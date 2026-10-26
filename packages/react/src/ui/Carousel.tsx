import { clsx } from 'clsx';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

type EmblaApi = UseEmblaCarouselType[1];

// ── Context ──────────────────────────────────────────────────────────────────

type Ctx = {
  emblaRef: UseEmblaCarouselType[0];
  api: EmblaApi;
  selectedIndex: number;
  snapCount: number;
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
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!api) return () => {};
      api.on('select', onChange);
      api.on('reInit', onChange);
      return () => {
        api.off('select', onChange);
        api.off('reInit', onChange);
      };
    },
    [api]
  );
  const selectedIndex = useSyncExternalStore(
    subscribe,
    () => api?.selectedScrollSnap() ?? 0,
    () => 0
  );
  const snapCount = useSyncExternalStore(
    subscribe,
    () => api?.scrollSnapList().length ?? 0,
    () => 0
  );

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);
  const scrollTo = useCallback((i: number) => api?.scrollTo(i), [api]);

  const canScrollPrev = api?.canScrollPrev() ?? false;
  const canScrollNext = api?.canScrollNext() ?? false;

  return (
    <CarouselContext.Provider
      value={{
        emblaRef,
        api,
        selectedIndex,
        snapCount,
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
    'flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 focus-visible:focus-indicator';
  // Over a slide (an image, a card) the arrows must read whatever the theme: a dark scrim with
  // white glyphs, not the surface colors of the buttons below the viewport.
  const overlayBtn =
    'flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:focus-indicator-on-accent';
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
        className={clsx('absolute top-1/2 left-4 z-10 -translate-y-1/2', overlayBtn, className)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={nextLabel}
        disabled={!canScrollNext}
        onClick={scrollNext}
        className={clsx('absolute top-1/2 right-4 z-10 -translate-y-1/2', overlayBtn, className)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </>
  );
};

// ── Indicators (dots) ────────────────────────────────────────────────────────

export type CarouselIndicatorsProps = { className?: string };

const CarouselIndicators = ({ className }: CarouselIndicatorsProps) => {
  const { snapCount, selectedIndex, scrollTo } = useCtx();
  return (
    <div className={clsx('mt-3 flex items-center justify-center', className)}>
      {Array.from({ length: snapCount }, (_, i) => {
        const active = i === selectedIndex;
        return (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={active}
            onClick={() => scrollTo(i)}
            // The button is the 24px touch target; the dot inside it stays small.
            className="focus-visible:focus-indicator flex h-6 min-w-6 items-center justify-center rounded-full"
          >
            <span
              className={clsx(
                'h-2 rounded-full transition-all',
                active ? 'bg-brand-500 w-6' : 'w-2 bg-gray-300 dark:bg-gray-600'
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

// ── Thumbnails (a strip of buttons, one per slide) ───────────────────────────

export type CarouselThumbnailsProps = {
  /**
   * One node per slide, usually a small `<img>`, matched to the slides by index. The button
   * carries the name ("Go to slide N"), so an image takes `alt=""` unless it says more.
   */
  children: ReactNode;
  /** Accessible name of the strip. Default "Slide thumbnails". */
  label?: string;
  className?: string;
};

const CarouselThumbnails = ({
  children,
  label = 'Slide thumbnails',
  className,
}: CarouselThumbnailsProps) => {
  const { selectedIndex, scrollTo } = useCtx();
  const strip = useRef<HTMLDivElement>(null);
  // Not on mount: scrolling the first thumbnail into view could scroll the page to it. A plain
  // scrolling row, no second Embla instance.
  const shown = useRef(selectedIndex);
  useEffect(() => {
    if (shown.current === selectedIndex) return;
    shown.current = selectedIndex;
    strip.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [selectedIndex]);
  return (
    <div
      ref={strip}
      role="group"
      aria-label={label}
      // The padding leaves room for the selected ring and its halo, which the scroll container
      // would clip.
      className={clsx(
        'mt-3 flex gap-2 overflow-x-auto p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      {Children.toArray(children).map((thumb, i) => {
        const active = i === selectedIndex;
        return (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={active}
            onClick={() => scrollTo(i)}
            className={clsx(
              'focus-visible:focus-indicator h-14 w-19 shrink-0 overflow-hidden rounded-lg transition-opacity [&_img]:h-full [&_img]:w-full [&_img]:object-cover',
              active
                ? 'ring-brand-500 ring-2 ring-offset-2 ring-offset-[var(--color-bg-panel)]'
                : 'opacity-70 hover:opacity-100'
            )}
          >
            {thumb}
          </button>
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
  Thumbnails: CarouselThumbnails,
});
