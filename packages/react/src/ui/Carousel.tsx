import { clsx } from 'clsx';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type EmblaApi = UseEmblaCarouselType[1];

// ── Context ──────────────────────────────────────────────────────────────────

type Ctx = {
  emblaRef: UseEmblaCarouselType[0];
  api: EmblaApi;
  selectedIndex: number;
  scrollSnaps: number[];
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (i: number) => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
};

const CarouselContext = createContext<Ctx | null>(null);
const useCtx = (): Ctx => {
  const ctx = useContext(CarouselContext);
  if (!ctx) throw new Error('Carousel.* must be used inside <Carousel>');
  return ctx;
};

// ── Root ─────────────────────────────────────────────────────────────────────

export type CarouselOptions = Parameters<typeof useEmblaCarousel>[0];

export type CarouselProps = {
  /** Embla options forwarded to the hook (loop, align, slidesToScroll, …). */
  options?: CarouselOptions;
  /** Auto-advance. Pass `true` for default 4 s, or a number (ms). */
  autoplay?: boolean | number;
  /** Pause autoplay on user interaction. Default `true`. */
  stopOnInteraction?: boolean;
  className?: string;
  children: ReactNode;
};

export const CarouselRoot = ({
  options,
  autoplay = false,
  stopOnInteraction = true,
  className,
  children,
}: CarouselProps) => {
  const plugins = autoplay
    ? [
        Autoplay({
          delay: typeof autoplay === 'number' ? autoplay : 4000,
          stopOnInteraction,
        }),
      ]
    : [];
  const [emblaRef, api] = useEmblaCarousel(options, plugins);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);
  const scrollTo = useCallback((i: number) => api?.scrollTo(i), [api]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
    setScrollSnaps(api.scrollSnapList());
    onSelect();
    api.on('select', onSelect);
    api.on('reInit', () => {
      setScrollSnaps(api.scrollSnapList());
      onSelect();
    });
  }, [api]);

  const canScrollPrev = api?.canScrollPrev() ?? false;
  const canScrollNext = api?.canScrollNext() ?? false;

  return (
    <CarouselContext.Provider
      value={{
        emblaRef,
        api,
        selectedIndex,
        scrollSnaps,
        scrollPrev,
        scrollNext,
        scrollTo,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div className={clsx('relative', className)}>{children}</div>
    </CarouselContext.Provider>
  );
};

// ── Viewport (the scroll container) ──────────────────────────────────────────

export type CarouselViewportProps = { children: ReactNode; className?: string };

const CarouselViewport = ({ children, className }: CarouselViewportProps) => {
  const { emblaRef } = useCtx();
  return (
    <div ref={emblaRef} className={clsx('overflow-hidden', className)}>
      <div className="flex">{children}</div>
    </div>
  );
};

// ── Slide ────────────────────────────────────────────────────────────────────

export type CarouselSlideProps = {
  /** Slide width as a Tailwind class. Default `basis-full` (one per view). */
  basis?: string;
  className?: string;
  children: ReactNode;
};

const CarouselSlide = ({ basis = 'basis-full', className, children }: CarouselSlideProps) => (
  <div className={clsx('min-w-0 shrink-0 grow-0 px-1', basis, className)}>{children}</div>
);

// ── Controls (prev / next buttons) ───────────────────────────────────────────

export type CarouselControlsProps = {
  /** Place buttons. `inside` overlays them on the viewport edges; `outside` puts them above the indicators. Default `inside`. */
  position?: 'inside' | 'outside';
  className?: string;
  prevLabel?: string;
  nextLabel?: string;
};

const CarouselControls = ({
  position = 'inside',
  className,
  prevLabel = 'Previous slide',
  nextLabel = 'Next slide',
}: CarouselControlsProps) => {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCtx();
  const baseBtn =
    'flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700';
  if (position === 'outside') {
    return (
      <div className={clsx('mt-3 flex items-center justify-center gap-2', className)}>
        <button
          type="button"
          aria-label={prevLabel}
          disabled={!canScrollPrev}
          onClick={scrollPrev}
          className={baseBtn}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={nextLabel}
          disabled={!canScrollNext}
          onClick={scrollNext}
          className={baseBtn}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }
  return (
    <>
      <button
        type="button"
        aria-label={prevLabel}
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        className={clsx('absolute top-1/2 left-2 z-10 -translate-y-1/2', baseBtn, className)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={nextLabel}
        disabled={!canScrollNext}
        onClick={scrollNext}
        className={clsx('absolute top-1/2 right-2 z-10 -translate-y-1/2', baseBtn, className)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </>
  );
};

// ── Indicators (dots) ────────────────────────────────────────────────────────

export type CarouselIndicatorsProps = { className?: string };

const CarouselIndicators = ({ className }: CarouselIndicatorsProps) => {
  const { scrollSnaps, selectedIndex, scrollTo } = useCtx();
  return (
    <div className={clsx('mt-3 flex items-center justify-center gap-2', className)}>
      {scrollSnaps.map((_, i) => {
        const active = i === selectedIndex;
        return (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={active}
            onClick={() => scrollTo(i)}
            className={clsx(
              'h-2 rounded-full transition-all',
              active ? 'bg-brand-500 w-6' : 'w-2 bg-gray-300 dark:bg-gray-600'
            )}
          />
        );
      })}
    </div>
  );
};

// ── Compound export ──────────────────────────────────────────────────────────

export const Carousel = Object.assign(CarouselRoot, {
  Viewport: CarouselViewport,
  Slide: CarouselSlide,
  Controls: CarouselControls,
  Indicators: CarouselIndicators,
});
