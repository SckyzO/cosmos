import { clsx } from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useDocumentDirection } from '../hooks/direction';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useControllableState } from '../hooks/useControllableState';
import { useExitTransition } from '../hooks/useExitTransition';
import { mergeRefs } from './mergeRefs';
import { clampIndex, indexForKey, isNearby } from './lightboxNav';
import { OverlayLayerProvider, useFocusTrap, useOverlayLayer } from './overlayA11y';
import { Spinner } from './Spinner';

export type LightboxItem = {
  /** The large picture. The page's own grid or carousel keeps its small one. */
  src: string;
  /** What the picture shows: its accessible name, and read out when the viewer reaches it. */
  alt: string;
  /** Under the picture, two lines at most (the whole text is still read out). */
  caption?: ReactNode;
  /** The picture of the strip when `thumbnails` is set. Default `src`: the large picture, downloaded for it too. */
  thumbSrc?: string;
};

export type LightboxProps = {
  /** The pictures, in order. */
  items: LightboxItem[];
  /** Whether the viewer is open. The page owns it: it opens the viewer, and closes it on `onOpenChange(false)`. */
  open: boolean;
  /** Called with `false` from the close button, Escape and a click on the dark around the picture. */
  onOpenChange: (open: boolean) => void;
  /** The picture shown (controlled). */
  index?: number;
  /** The picture shown first, while uncontrolled. Default 0. */
  defaultIndex?: number;
  /** Called with the picture moved to, by the arrows, the keys, the thumbnails and a swipe. */
  onIndexChange?: (index: number) => void;
  /** Draws a strip of thumbnails under the picture, from `sm` up. Default `false`. */
  thumbnails?: boolean;
  /** Accessible name of the viewer. Default "Picture viewer". */
  ariaLabel?: string;
  /** Default "Previous picture". */
  prevLabel?: string;
  /** Default "Next picture". */
  nextLabel?: string;
  /** Default "Close". */
  closeLabel?: string;
  /** What is read out when the picture changes, from the 1-based `position`. Default "Picture 3 of 12". */
  counterLabel?: (position: number, total: number) => string;
  /** Accessible name of the thumbnail strip. Default "Picture thumbnails". */
  thumbnailsLabel?: string;
  /** Accessible name of the thumbnail of the 1-based `position`. Default "Go to picture 3". */
  thumbnailLabel?: (position: number, total: number) => string;
  /** Shown when a picture can't be loaded. Default "This picture could not be loaded." */
  errorLabel?: string;
  /** The button that loads the picture again. Default "Try again". */
  retryLabel?: string;
};

// The controls stay dark in every theme: a photo viewer, not a themed panel. White glyphs on a
// translucent white disc over a near-black surface, read the same on the four themes.
const CONTROL =
  'flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition-colors enabled:hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:focus-indicator-on-accent sm:h-ctrl-36 sm:w-ctrl-36';

// The arrows sit in the band under the picture below `sm` (a thumb reaches them there), and on
// the sides of the picture from `sm` up, level with its middle.
const ARROW_PLACE = {
  prev: 'inset-s-3 sm:inset-s-4',
  next: 'inset-e-3 sm:inset-e-4',
} as const;
const ARROW = 'absolute top-full z-10 mt-5.5 sm:top-1/2 sm:mt-0 sm:-translate-y-1/2';

type PictureProps = {
  item: LightboxItem;
  current: boolean;
  errorLabel: string;
  retryLabel: string;
};

// One picture with its own loading state. Only the slides next to the current one mount it, and
// each is keyed by its `src`, so a new picture starts loading again.
function Picture({ item, current, errorLabel, retryLabel }: PictureProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  // A new `<img>` per attempt: the browser requests the picture again.
  const [attempt, setAttempt] = useState(0);

  if (status === 'error') {
    return (
      <div className="flex max-w-full flex-col items-center gap-3 px-6 text-center text-sm text-white/90">
        <ImageOff className="size-8 opacity-70" aria-hidden />
        <p role="status">{errorLabel}</p>
        <button
          type="button"
          onClick={() => {
            setStatus('loading');
            setAttempt((n) => n + 1);
          }}
          className="focus-visible:focus-indicator-on-accent h-ctrl-36 rounded-full bg-white/15 px-4 text-sm font-medium text-white transition-colors hover:bg-white/25"
        >
          {retryLabel}
        </button>
      </div>
    );
  }

  return (
    <>
      {status === 'loading' && (
        <div className="absolute inset-x-0 inset-y-0 grid place-items-center sm:px-18">
          <div className="grid aspect-[3/2] max-h-full w-[min(100%,48rem)] animate-pulse place-items-center rounded-lg bg-white/10 motion-reduce:animate-none">
            {current && <Spinner size="lg" onDark />}
          </div>
        </div>
      )}
      <img
        key={attempt}
        src={item.src}
        alt={item.alt}
        draggable={false}
        decoding="async"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={clsx(
          'max-h-full max-w-full rounded-lg object-contain transition-opacity select-none',
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        )}
      />
    </>
  );
}

type ThumbnailsProps = {
  items: LightboxItem[];
  index: number;
  onSelect: (index: number) => void;
  label: string;
  thumbnailLabel: (position: number, total: number) => string;
};

function Thumbnails({ items, index, onSelect, label, thumbnailLabel }: ThumbnailsProps) {
  const strip = useRef<HTMLDivElement>(null);
  // A long strip scrolls: bring the current thumbnail into view, on open as well as on a move.
  useEffect(() => {
    strip.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [index]);
  return (
    // `mx-auto` on the group centers a short strip and lets a long one scroll from its start.
    <div className="hidden shrink-0 overflow-x-auto pt-2 [scrollbar-width:none] sm:flex [&::-webkit-scrollbar]:hidden">
      <div
        ref={strip}
        role="group"
        aria-label={label}
        // The padding leaves room for the ring of the current thumbnail, which the scroller would clip.
        className="mx-auto flex gap-2 px-4 py-1.5"
      >
        {items.map((item, i) => {
          const active = i === index;
          return (
            <button
              key={i}
              type="button"
              aria-label={thumbnailLabel(i + 1, items.length)}
              aria-current={active}
              onClick={() => onSelect(i)}
              className={clsx(
                'focus-visible:focus-indicator-on-accent h-10.5 w-15 shrink-0 overflow-hidden rounded-md transition-opacity',
                active ? 'ring-brand-500 ring-2' : 'opacity-60 hover:opacity-100'
              )}
            >
              <img
                src={item.thumbSrc ?? item.src}
                alt=""
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

type ViewerProps = Required<
  Pick<
    LightboxProps,
    | 'items'
    | 'thumbnails'
    | 'ariaLabel'
    | 'prevLabel'
    | 'nextLabel'
    | 'closeLabel'
    | 'counterLabel'
    | 'thumbnailsLabel'
    | 'thumbnailLabel'
    | 'errorLabel'
    | 'retryLabel'
  >
> & {
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** False while the viewer fades out: it is already closed for focus, Escape and scrolling. */
  open: boolean;
  /** The viewer's root, which the exit waits on. */
  exitRef: RefObject<HTMLDivElement | null>;
};

// The viewer: mounted when `open` turns true and gone once it has faded out, so the focus trap,
// the overlay layer, the scroll lock and Embla all follow the viewer's own lifetime. While it
// fades out `open` is false: focus is back on the tile that opened it, Escape goes to the overlay
// under it and the page scrolls, and the viewer is `inert`.
function Viewer({
  open,
  exitRef,
  items,
  index,
  onIndexChange,
  onClose,
  thumbnails,
  ariaLabel,
  prevLabel,
  nextLabel,
  closeLabel,
  counterLabel,
  thumbnailsLabel,
  thumbnailLabel,
  errorLabel,
  retryLabel,
}: ViewerProps) {
  const count = items.length;
  const several = count > 1;
  const direction = useDocumentDirection();
  // Moves focus in on open, keeps Tab inside, and puts focus back on the tile that opened the
  // viewer on close. Escape closes the top overlay only, so a viewer opened from a modal leaves it.
  const rootRef = useFocusTrap<HTMLDivElement>(open);
  const layer = useOverlayLayer(open, onClose);
  useBodyScrollLock(open);
  // Both refs hold the root: the trap's, and the one the exit hook waits on.
  const mergedRootRef = useMemo(() => mergeRefs(rootRef, exitRef), [rootRef, exitRef]);

  // Embla lays the slides out and drags them the way the page reads, but only when told. The
  // viewer opens on the picture the page asked for; after that the index moves Embla, not its options.
  const [startIndex] = useState(index);
  const [emblaRef, api] = useEmblaCarousel({ direction, startIndex, watchDrag: several });

  const latest = useRef({ index, onIndexChange });
  useEffect(() => {
    latest.current = { index, onIndexChange };
  });
  useEffect(() => {
    if (!api) return;
    // A swipe moved Embla: tell the page.
    const onSelect = () => {
      const selected = api.selectedScrollSnap();
      if (selected !== latest.current.index) latest.current.onIndexChange(selected);
    };
    // Embla starts over on `startIndex` when its options change (the page's direction flipped):
    // go back to the picture the page is on.
    const onReInit = () => {
      if (api.selectedScrollSnap() !== latest.current.index)
        api.scrollTo(latest.current.index, true);
    };
    api.on('select', onSelect).on('reInit', onReInit);
    return () => {
      api.off('select', onSelect).off('reInit', onReInit);
    };
  }, [api]);
  // The index moved (arrows, keys, thumbnails, the page): Embla follows.
  // A jump of more than one picture (the end key, a thumbnail far along the strip) goes
  // there at once: sliding over the pictures in between would only show blank slides.
  useEffect(() => {
    if (!api) return;
    const selected = api.selectedScrollSnap();
    if (selected !== index) api.scrollTo(index, Math.abs(selected - index) > 1);
  }, [api, index]);

  const go = (to: number) => {
    const next = clampIndex(to, count);
    if (next !== index) onIndexChange(next);
  };

  const prev = useRef<HTMLButtonElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  // An arrow that has just become disabled can't hold focus any more (nor can a retry button
  // whose slide went inert), and the keys only reach the viewer from inside it: hand focus to the
  // other arrow, or to the viewer itself. Not on open, where the focus trap has the focus to keep.
  const shown = useRef(index);
  useLayoutEffect(() => {
    if (shown.current === index) return;
    shown.current = index;
    const root = rootRef.current;
    const active = document.activeElement;
    const stranded =
      !active ||
      active === document.body ||
      (!!root?.contains(active) && (active as HTMLButtonElement).disabled === true);
    if (!root || !stranded) return;
    const other = [next.current, prev.current].find((arrow) => arrow && !arrow.disabled);
    (other ?? root).focus();
  }, [index, rootRef]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return;
    const to = indexForKey(event, index, count, direction);
    if (to === undefined) return;
    event.preventDefault();
    go(to);
  };

  // A click on the dark around the picture closes the viewer; one on the picture or a control doesn't.
  const closeOnBackdrop = (event: MouseEvent<HTMLElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const item = items[index];
  const position = index + 1;
  const announcement = counterLabel(position, count);

  return createPortal(
    <OverlayLayerProvider value={layer}>
      <div
        ref={mergedRootRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        inert={!open}
        onKeyDown={onKeyDown}
        onClick={closeOnBackdrop}
        className={clsx(
          'fixed inset-0 z-50 flex flex-col bg-black/95 text-white outline-hidden transition-opacity',
          // The whole viewer fades, as the scrim of a window does: in over the base duration easing
          // out (from the first frame, `starting:`), out over the shorter exit easing in. It keeps
          // its own near-black surface in every theme, and does not scale: it fills the screen.
          open
            ? 'opacity-100 duration-(--cosmos-motion-base) ease-(--cosmos-ease-out) starting:opacity-0'
            : 'pointer-events-none opacity-0 duration-(--cosmos-motion-exit-lg) ease-(--cosmos-ease-in)'
        )}
      >
        <div
          onClick={closeOnBackdrop}
          className="flex shrink-0 items-center justify-between gap-3 px-4 py-3"
        >
          {several && (
            // The text read out, then the figures shown: `dir="ltr"` keeps "3 / 12" in that order
            // in a right to left page.
            <div aria-live="polite" aria-atomic="true" className="text-sm font-medium tabular-nums">
              <span className="sr-only">
                {announcement}. {item.alt}
              </span>
              <span aria-hidden dir="ltr" className="text-white/90">
                {position} / {count}
              </span>
            </div>
          )}
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className={clsx(CONTROL, 'ms-auto')}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <div
            ref={emblaRef}
            className="absolute inset-0 overflow-hidden"
            onClick={closeOnBackdrop}
          >
            <div className="flex h-full touch-pan-y" onClick={closeOnBackdrop}>
              {items.map((slide, i) => (
                <div
                  key={i}
                  inert={i !== index}
                  aria-hidden={i !== index}
                  onClick={closeOnBackdrop}
                  className="relative flex h-full min-w-0 shrink-0 grow-0 basis-full items-center justify-center sm:px-18"
                >
                  {isNearby(i, index) && (
                    <Picture
                      key={slide.src}
                      item={slide}
                      current={i === index}
                      errorLabel={errorLabel}
                      retryLabel={retryLabel}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          {several && (
            <>
              <button
                ref={prev}
                type="button"
                aria-label={prevLabel}
                disabled={index === 0}
                onClick={() => go(index - 1)}
                className={clsx(CONTROL, ARROW, ARROW_PLACE.prev)}
              >
                <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />
              </button>
              <button
                ref={next}
                type="button"
                aria-label={nextLabel}
                disabled={index === count - 1}
                onClick={() => go(index + 1)}
                className={clsx(CONTROL, ARROW, ARROW_PLACE.next)}
              >
                <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden />
              </button>
            </>
          )}
        </div>

        {thumbnails && several && (
          <Thumbnails
            items={items}
            index={index}
            onSelect={go}
            label={thumbnailsLabel}
            thumbnailLabel={thumbnailLabel}
          />
        )}

        <div
          onClick={closeOnBackdrop}
          className="flex h-22 shrink-0 items-center justify-center bg-gradient-to-t from-black/70 to-transparent px-16 text-center"
        >
          {item.caption && (
            <p className="line-clamp-2 max-w-2xl text-sm leading-snug font-medium text-white/90">
              <bdi>{item.caption}</bdi>
            </p>
          )}
        </div>
      </div>
    </OverlayLayerProvider>,
    document.body
  );
}

/**
 * Lightbox: a fullscreen picture viewer, dark in every theme. A counter and the close button
 * on top, arrows on the sides (under the picture below `sm`), the caption at the bottom, and an
 * optional strip of thumbnails. The page opens it, usually from an `ImageGrid.Item` or a
 * `Carousel` slide (`onClick` sets `index` and `open`).
 *
 * It is a modal dialog: focus moves in and comes back to what opened it, Escape closes the top
 * overlay only (a viewer opened from a modal leaves the modal open), and the page behind stops
 * scrolling. The arrow keys, a swipe and the arrows move between pictures, never in a loop, and
 * follow the reading direction in right to left. The picture shown and its neighbours are loaded.
 *
 * Every text is a prop with an English default.
 */
export const Lightbox = ({
  items,
  open,
  onOpenChange,
  index,
  defaultIndex = 0,
  onIndexChange,
  thumbnails = false,
  ariaLabel = 'Picture viewer',
  prevLabel = 'Previous picture',
  nextLabel = 'Next picture',
  closeLabel = 'Close',
  counterLabel = (position, total) => `Picture ${position} of ${total}`,
  thumbnailsLabel = 'Picture thumbnails',
  thumbnailLabel = (position) => `Go to picture ${position}`,
  errorLabel = 'This picture could not be loaded.',
  retryLabel = 'Try again',
}: LightboxProps) => {
  const [current, setIndex] = useControllableState<number>({
    value: index,
    defaultValue: defaultIndex,
    onChange: onIndexChange,
    name: 'Lightbox.index',
  });
  // The viewer stays on screen while it fades out, and renders nothing without a picture: a host
  // that empties `items` as it closes has nothing left to show.
  const active = open && items.length > 0;
  const exitRef = useRef<HTMLDivElement | null>(null);
  const present = useExitTransition(active, exitRef);
  if (!present || items.length === 0) return null;
  return (
    <Viewer
      open={active}
      exitRef={exitRef}
      items={items}
      index={clampIndex(current, items.length)}
      onIndexChange={setIndex}
      onClose={() => onOpenChange(false)}
      thumbnails={thumbnails}
      ariaLabel={ariaLabel}
      prevLabel={prevLabel}
      nextLabel={nextLabel}
      closeLabel={closeLabel}
      counterLabel={counterLabel}
      thumbnailsLabel={thumbnailsLabel}
      thumbnailLabel={thumbnailLabel}
      errorLabel={errorLabel}
      retryLabel={retryLabel}
    />
  );
};
