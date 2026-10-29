import { clsx } from 'clsx';
import { X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ElementType, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  DialogTitleProvider,
  OverlayLayerProvider,
  PortalContainerProvider,
  useDialogTitleId,
  useFocusTrap,
  useOverlayLayer,
} from './overlayA11y';
import { directionOf } from '../hooks/direction';
import { useIsClient } from '../hooks/useIsClient';

/** `start` and `end` are the edges of the line: the left and the right, swapped under `dir="rtl"`. */
export type DrawerSide = 'start' | 'end' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg';

// The width of a `start` or `end` drawer. A bottom sheet ignores it: its height follows its content.
const SIZE_CLASS: Record<DrawerSize, string> = {
  sm: 'w-72',
  md: 'w-96',
  lg: 'w-[28rem]',
};

// The close-outside button lives inside the panel (so the focus trap covers
// it) and sits just past its inner edge, on the backdrop.
// On a bottom sheet it sits above the top edge, at the end.
const OUTSIDE_POSITION: Record<DrawerSide, string> = {
  start: 'top-4 inset-s-full',
  end: 'top-4 inset-e-full',
  bottom: 'inset-e-4 bottom-full mb-2',
};

// The portal needs `document`: render nothing on the server and during
// hydration, then portal once on the client (`useIsClient`).

// The bottom sheet is as wide as the viewport and as tall as its content, up to 85% of it: the
// scrim stays visible above it, which shows that a tap outside closes it. The padding keeps the
// content out of the home-indicator area of a phone (`viewport-fit=cover`).
const SIDE_CLASS: Record<DrawerSide, string> = {
  start: 'top-0 bottom-0 inset-s-0 border-e',
  end: 'top-0 inset-e-0 bottom-0 border-s',
  bottom:
    'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t pb-[env(safe-area-inset-bottom)]',
};

// A `translate` has no logical form: the start side leaves toward the left, and toward the right
// under `rtl:`, which wins over the plain class as a variant.
const SIDE_TRANSFORM: Record<DrawerSide, { open: string; closed: string }> = {
  start: { open: 'translate-x-0', closed: '-translate-x-full rtl:translate-x-full' },
  end: { open: 'translate-x-0', closed: 'translate-x-full rtl:-translate-x-full' },
  bottom: { open: 'translate-y-0', closed: 'translate-y-full' },
};

// A swipe closes the drawer past a third of the panel's size along the closing axis (its width, or
// the height of a bottom sheet), or when it ends as a flick: faster than FLICK_SPEED px/ms over the
// last FLICK_WINDOW ms. Below SWIPE_SLOP px of travel it is a tap.
const SWIPE_SLOP = 8;
const FLICK_SPEED = 0.5;
const FLICK_WINDOW = 100;

type Swipe = {
  pointerId: number;
  /** Toward the edge the panel slides out through: -1 for the left, 1 for the right and the bottom. */
  sign: -1 | 1;
  x: number;
  y: number;
  /** Whether the finger moved far enough, along the closing direction, to drag the panel. */
  dragging: boolean;
  /** Recent positions along the closing direction, for the release velocity. */
  samples: { along: number; t: number }[];
};

// Whether the drawer is a bottom sheet that swipes down: its `Drawer.Body` then decides who owns a
// vertical drag (see `Body`).
const SheetSwipeContext = createContext(false);

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  /**
   * The edge the panel slides in from. `start` and `end` give a full-height panel, on the edge
   * the text starts at and ends at: left and right, swapped under `dir="rtl"`. `bottom` gives a
   * sheet: full width, as tall as its content up to 85% of the viewport (`Drawer.Body` scrolls
   * past that), rounded on top, with a grab `handle`, and the scrim stays visible above it. All
   * three are the same dialog, with the same focus trap, Escape and `Drawer.Header`, `Body` and
   * `Footer`. Default `end`.
   */
  side?: DrawerSide;
  /** The width of a `start` or `end` drawer. Ignored on `bottom`, where the content sets the height. Default `md`. */
  size?: DrawerSize;
  /**
   * Show a grab handle at the top of a bottom sheet: a visual cue that the sheet can be dragged
   * away, not a control (`aria-hidden`). Set `false` to remove it. Only `side="bottom"` has one.
   * Default `true`.
   */
  handle?: boolean;
  /**
   * Render a translucent overlay behind the panel that closes on click.
   * Default `true`, which makes the drawer a modal dialog (`aria-modal`).
   * Set `false` for the TUI "Empty" slide-over pattern where the page stays
   * interactive behind the panel; the drawer is then a non-modal dialog.
   */
  withBackdrop?: boolean;
  /**
   * Render the close button on the backdrop (outside the panel), opposite
   * the chosen `side`. Mirrors the TUI "With close button on outside"
   * pattern. When `true`, no close button is rendered inside `Drawer.Header`
   * — handle the X via this overlay button instead.
   * Has no effect when `withBackdrop` is `false`.
   */
  closeOutside?: boolean;
  /**
   * Let a touch or pen swipe on the panel, toward its edge (toward the start of the line for
   * `side="start"`, the end for `side="end"`, down for `side="bottom"`), close the drawer. The panel follows the finger and
   * never goes past its open position; released past a third of its width (its height for
   * `bottom`), or as a fast flick, it calls `onClose`, otherwise it springs back (without the
   * animation under `prefers-reduced-motion`). A mouse does not swipe. Scrolling inside the panel
   * is left to the browser: vertical on `start` and `end`; on `bottom`, a `Drawer.Body` that
   * scrolls keeps the vertical drag, so the sheet is dragged by its handle, header, footer or a
   * body that fits. Default `false`.
   */
  swipeToClose?: boolean;
  /**
   * Accessible name for the drawer when it has no `Drawer.Header` title to
   * point at. With a `Drawer.Header title=…` present the drawer is labelled by
   * it automatically and this is unnecessary.
   */
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
};

const Root = ({
  open,
  onClose,
  side = 'end',
  size = 'md',
  handle = true,
  withBackdrop = true,
  closeOutside = false,
  swipeToClose = false,
  ariaLabel,
  className,
  children,
}: DrawerProps) => {
  const titleId = useId();
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  const isClient = useIsClient();
  // `hidden` turns true once the slide-out ends, false as soon as it reopens.
  const [hidden, setHidden] = useState(!open);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setHidden(false);
  }

  // Escape closes the drawer, unless an overlay opened above it takes it.
  const layer = useOverlayLayer(open, onClose);

  // The floating panels opened in the drawer render into the panel, once mounted:
  // `aria-modal` tells assistive technology to skip everything outside it. Its
  // `translate` makes it the box their fixed position is relative to, which
  // `useAnchorPosition` accounts for; they slide with it.
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    setContainer(isClient ? trapRef.current : null);
  }, [isClient, trapRef]);

  // A slide-out that starts no transition fires no `transitionend`: transitions at `0s` (a
  // reduced-motion reset, a user stylesheet) or a drawer closed before its slide-in moved. Once
  // the closed position is committed, `getAnimations()`, which applies the pending style first,
  // tells whether the slide runs; when it doesn't, the drawer hides at once.
  useLayoutEffect(() => {
    const panel = trapRef.current;
    if (open || hidden || !panel) return;
    const slides = panel
      .getAnimations()
      .some((a) => a instanceof CSSTransition && a.transitionProperty === 'translate');
    if (!slides) setHidden(true);
  }, [open, hidden, trapRef]);

  // Swipe to close: the panel's offset while the finger drags it (`null` at rest), and whether
  // the spring-back skips its animation (`prefers-reduced-motion`).
  const swipe = useRef<Swipe | null>(null);
  const [offset, setOffset] = useState<number | null>(null);
  const [instant, setInstant] = useState(false);
  // A bottom sheet closes along the vertical axis, the other sides along the horizontal one.
  const vertical = side === 'bottom';

  const swipeHandlers = swipeToClose
    ? {
        onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
          if (!open || e.pointerType === 'mouse' || !e.isPrimary) return;
          // The left edge is the start one in ltr and the end one in rtl: read where the panel is.
          const onLeft = (side === 'start') === (directionOf(e.currentTarget) === 'ltr');
          swipe.current = {
            pointerId: e.pointerId,
            sign: side !== 'bottom' && onLeft ? -1 : 1,
            x: e.clientX,
            y: e.clientY,
            dragging: false,
            samples: [{ along: 0, t: e.timeStamp }],
          };
        },
        onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
          const s = swipe.current;
          if (!s || e.pointerId !== s.pointerId) return;
          const along = (vertical ? e.clientY - s.y : e.clientX - s.x) * s.sign;
          if (!s.dragging) {
            // A move across the closing axis is not a swipe: a scroll of the panel's content
            // (vertical, for the side drawers), or a sideways drift of the finger on a sheet.
            const across = Math.abs(vertical ? e.clientX - s.x : e.clientY - s.y);
            if (across > Math.abs(along)) {
              if (across > SWIPE_SLOP) swipe.current = null;
              return;
            }
            if (along < SWIPE_SLOP) return;
            s.dragging = true;
            setInstant(false);
          }
          s.samples.push({ along, t: e.timeStamp });
          // Never past the open position: only toward the edge.
          setOffset(Math.max(0, along) * s.sign);
        },
        onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => {
          const s = swipe.current;
          if (!s || e.pointerId !== s.pointerId) return;
          swipe.current = null;
          if (!s.dragging) return;
          const along = Math.max(0, (vertical ? e.clientY - s.y : e.clientX - s.x) * s.sign);
          // Speed over the last FLICK_WINDOW ms of the gesture, toward the edge.
          // A finger that stopped before lifting (no move in the window) leaves at speed 0.
          const from = s.samples.find((p) => e.timeStamp - p.t <= FLICK_WINDOW);
          const elapsed = from ? e.timeStamp - from.t : 0;
          const speed = from && elapsed > 0 ? (along - from.along) / elapsed : 0;
          const panel = e.currentTarget.getBoundingClientRect();
          const close = along > (vertical ? panel.height : panel.width) / 3 || speed > FLICK_SPEED;
          // Closing keeps the panel where the finger left it: `open` turning false in the same
          // render lets the slide-out continue from there. A drawer the host keeps open springs back.
          if (!close && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setInstant(true);
            requestAnimationFrame(() => setInstant(false));
          }
          setOffset(null);
          if (close) onClose();
        },
        onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => {
          if (swipe.current?.pointerId !== e.pointerId) return;
          swipe.current = null;
          setOffset(null);
        },
      }
    : undefined;

  if (!isClient) return null;

  // Portal into document.body so the drawer escapes any clipping ancestor
  // (cards, sidebars, overflow:hidden containers). Without this, calling
  // Drawer from inside e.g. a SectionCard or modal renders it in a
  // confined coordinate space and the panel never appears.
  //
  // A closed drawer stays mounted so it can slide out, but it is `inert`
  // at once and turns `invisible` when the slide ends, so its content leaves
  // the tab order and the accessibility tree.
  return createPortal(
    <>
      {withBackdrop && (
        <div
          className={clsx(
            'fixed inset-0 z-40 bg-gray-500/75 transition-opacity duration-300 dark:bg-gray-900/75',
            open ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          onClick={onClose}
          aria-hidden
        />
      )}
      {/* A `div`, not an `aside`: the `complementary` role of an `aside` forbids `dialog`. */}
      <div
        ref={trapRef}
        tabIndex={-1}
        inert={!open}
        aria-hidden={open ? undefined : true}
        {...swipeHandlers}
        style={
          swipeToClose
            ? {
                // The panel slides with the `translate` property. On the side drawers `pan-y` leaves
                // vertical scrolling to the browser and delivers the horizontal pointer moves to
                // the swipe; on a sheet `none` delivers the vertical ones (a body that scrolls
                // takes its own `pan-y` back, see `Body`).
                touchAction: vertical ? 'none' : 'pan-y',
                translate: offset === null ? undefined : vertical ? `0 ${offset}px` : `${offset}px`,
                transition: offset !== null || instant ? 'none' : undefined,
              }
            : undefined
        }
        onTransitionEnd={(e) => {
          // Tailwind 4 slides the panel with the `translate` property, so that
          // is the one that ends, not `transform`.
          if (!open && e.target === e.currentTarget && e.propertyName === 'translate') {
            setHidden(true);
          }
        }}
        className={clsx(
          'fixed z-50 flex flex-col border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900',
          SIDE_CLASS[side],
          !vertical && SIZE_CLASS[size],
          // On a screen narrower than the size, the panel stops short of the far edge; with the
          // close-outside button, short enough to leave it on screen.
          !vertical && (withBackdrop && closeOutside ? 'max-w-[calc(100%-3rem)]' : 'max-w-full'),
          open ? SIDE_TRANSFORM[side].open : SIDE_TRANSFORM[side].closed,
          hidden && 'invisible',
          className
        )}
        role="dialog"
        aria-modal={withBackdrop ? true : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : titleId}
      >
        {vertical && handle && (
          <div
            aria-hidden
            data-slot="handle"
            className="mx-auto mt-2.5 mb-0.5 h-1 w-10 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600"
          />
        )}
        <OverlayLayerProvider value={layer}>
          <PortalContainerProvider value={container}>
            <SheetSwipeContext.Provider value={vertical && swipeToClose}>
              <DialogTitleProvider value={titleId}>{children}</DialogTitleProvider>
            </SheetSwipeContext.Provider>
          </PortalContainerProvider>
        </OverlayLayerProvider>
        {withBackdrop && closeOutside && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className={clsx(
              'absolute flex size-10 items-center justify-center rounded-full text-gray-300 transition-opacity duration-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
              OUTSIDE_POSITION[side],
              open ? 'opacity-100' : 'opacity-0'
            )}
          >
            <X className="size-6" aria-hidden />
          </button>
        )}
      </div>
    </>,
    document.body
  );
};

export type DrawerHeaderProps = {
  title: ReactNode;
  icon?: ElementType;
  description?: ReactNode;
  onClose?: () => void;
  className?: string;
  children?: ReactNode;
};

const Header = ({
  title,
  icon: Icon,
  description,
  onClose,
  className,
  children,
}: DrawerHeaderProps) => {
  const titleId = useDialogTitleId();
  return (
    <div
      className={clsx(
        'flex shrink-0 items-center justify-between border-b border-gray-200 p-5 dark:border-gray-800',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
        )}
        <div className="min-w-0">
          <h2
            id={titleId}
            className="truncate text-base font-semibold text-gray-900 dark:text-white"
          >
            <bdi>{title}</bdi>
          </h2>
          {description && (
            <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
              <bdi>{description}</bdi>
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="focus-visible:focus-indicator rounded-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

const Body = ({ children, className }: { children: ReactNode; className?: string }) => {
  // On a bottom sheet that swipes down, the panel takes every vertical drag (`touch-action: none`).
  // A body that scrolls keeps its own vertical pan, and one that fits takes the drag too: as a
  // scroll container it would otherwise claim the touch itself and cancel the swipe.
  const sheetSwipes = useContext(SheetSwipeContext);
  const [scrolls, setScrolls] = useState(false);
  const watchOverflow = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el || !sheetSwipes) return;
      const measure = () => setScrolls(el.scrollHeight > el.clientHeight);
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    },
    [sheetSwipes]
  );
  return (
    <div
      ref={watchOverflow}
      className={clsx(
        'flex-1 overflow-y-auto p-5',
        sheetSwipes && (scrolls ? 'touch-pan-y' : 'touch-none'),
        className
      )}
    >
      {children}
    </div>
  );
};

const Footer = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={clsx(
      'flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-800 dark:bg-gray-800/50',
      className
    )}
  >
    {children}
  </div>
);

export const Drawer = Object.assign(Root, { Header, Body, Footer });
