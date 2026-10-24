import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';

/** Side of the anchor a floating panel opens on. */
export type AnchorSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Alignment with the anchor for the `top` and `bottom` sides: left edges (`start`), centers, or
 * right edges (`end`). The `left` and `right` sides always center the panel vertically.
 */
export type AnchorAlign = 'start' | 'center' | 'end';

export type AnchorPlacement = {
  /** Default `bottom`. */
  side?: AnchorSide;
  /** Default `center`. */
  align?: AnchorAlign;
  /** Gap between the anchor and the panel, in px. Default 0. */
  offset?: number;
  /** Give the panel the anchor's width, as a listbox under its field. */
  matchWidth?: boolean;
};

/** The part of a `DOMRect` a placement reads. */
export type AnchorRect = Pick<DOMRect, 'top' | 'right' | 'bottom' | 'left' | 'width' | 'height'>;

export type BoxSize = { width: number; height: number };

/** What collision handling needs: the panel's size, once it is on screen, and the viewport's. */
export type AnchorBounds = { panel: BoxSize; viewport: BoxSize };

// Gap kept between the screen edge and a panel moved back inside it, or an `end`-aligned one.
const VIEWPORT_MARGIN = 16;

const OPPOSITE: Record<AnchorSide, AnchorSide> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

const isVertical = (side: AnchorSide) => side === 'top' || side === 'bottom';

// Room between the anchor, offset included, and the edge of the viewport on `side`.
const roomOn = (side: AnchorSide, rect: AnchorRect, offset: number, viewport: BoxSize) => {
  if (side === 'top') return rect.top - offset;
  if (side === 'bottom') return viewport.height - rect.bottom - offset;
  if (side === 'left') return rect.left - offset;
  return viewport.width - rect.right - offset;
};

/**
 * The side a panel opens on: `placement.side`, unless the viewport would cut the panel there
 * and the opposite side has more room. Without `bounds`, always `placement.side`.
 */
export function resolveSide(
  rect: AnchorRect,
  { side = 'bottom', offset = 0 }: AnchorPlacement = {},
  bounds?: AnchorBounds
): AnchorSide {
  if (!bounds) return side;
  const needed = isVertical(side) ? bounds.panel.height : bounds.panel.width;
  const room = roomOn(side, rect, offset, bounds.viewport);
  if (needed <= room) return side;
  const opposite = OPPOSITE[side];
  return roomOn(opposite, rect, offset, bounds.viewport) > room ? opposite : side;
}

// How far to move a panel spanning `start` to `start + size` on an axis of `length`: nothing
// while it is all in view, else enough to bring it 16px inside, its start edge first when it
// is longer than the viewport.
const clampShift = (start: number, size: number, length: number) => {
  if (start >= 0 && start + size <= length) return 0;
  const clamped = Math.max(VIEWPORT_MARGIN, Math.min(start, length - VIEWPORT_MARGIN - size));
  return clamped - start;
};

const withShift = (style: CSSProperties, shift: number): CSSProperties =>
  shift ? ({ ...style, '--anchor-shift': `${shift}px` } as CSSProperties) : style;

/**
 * The `position: fixed` style that puts a panel on `side` of an anchor whose viewport rect is
 * `rect`. An `end`-aligned panel also gets a `maxWidth` that keeps it 16px from the left of
 * the screen. The style sets `--anchor-width` too, for a part of the panel that points at
 * the anchor (an arrow).
 *
 * With `bounds`, collisions with the viewport: the panel flips to the opposite side when the
 * viewport would cut it on its own (`resolveSide`), and one the viewport cuts on the other
 * axis moves back inside, 16px from the edge. A panel that is all in view stays where its
 * placement puts it. A moved panel's style sets `--anchor-shift`, how far it moved along
 * the anchor, so an arrow can keep pointing at the anchor.
 */
export function anchoredStyle(
  rect: AnchorRect,
  placement: AnchorPlacement = {},
  bounds?: AnchorBounds
): CSSProperties {
  const { align = 'center', offset = 0, matchWidth = false } = placement;
  const side = resolveSide(rect, placement, bounds);
  const style = { '--anchor-width': `${rect.width}px` } as CSSProperties;
  if (matchWidth) style.width = rect.width;

  if (!isVertical(side)) {
    const centerY = rect.top + rect.height / 2;
    const shift = bounds
      ? clampShift(centerY - bounds.panel.height / 2, bounds.panel.height, bounds.viewport.height)
      : 0;
    style.top = centerY + shift;
    if (side === 'right') {
      style.left = rect.right + offset;
      style.transform = 'translateY(-50%)';
    } else {
      style.left = rect.left - offset;
      style.transform = 'translate(-100%, -50%)';
    }
    return withShift(style, shift);
  }

  const shiftX = align === 'end' ? '-100%' : align === 'center' ? '-50%' : '0';
  const left =
    align === 'end' ? rect.right : align === 'center' ? rect.left + rect.width / 2 : rect.left;
  let shift = 0;
  if (bounds) {
    const width = bounds.panel.width;
    const start = align === 'end' ? left - width : align === 'center' ? left - width / 2 : left;
    shift = clampShift(start, width, bounds.viewport.width);
  }
  style.left = left + shift;
  if (align === 'end') style.maxWidth = rect.right - VIEWPORT_MARGIN;
  if (side === 'top') {
    style.top = rect.top - offset;
    style.transform = `translate(${shiftX}, -100%)`;
  } else {
    style.top = rect.bottom + offset;
    if (shiftX !== '0') style.transform = `translateX(${shiftX})`;
  }
  return withShift(style, shift);
}

type Point = { x: number; y: number };

type Measures = { anchor: AnchorRect; viewport: BoxSize; panel: BoxSize | null; origin: Point };

const sameSize = (a: BoxSize | null, b: BoxSize | null) =>
  a === b || (!!a && !!b && a.width === b.width && a.height === b.height);

const sameMeasures = (a: Measures | null, b: Measures) =>
  !!a &&
  a.anchor.top === b.anchor.top &&
  a.anchor.left === b.anchor.left &&
  sameSize(a.anchor, b.anchor) &&
  sameSize(a.viewport, b.viewport) &&
  sameSize(a.panel, b.panel) &&
  a.origin.x === b.origin.x &&
  a.origin.y === b.origin.y;

// The viewport point the fixed position of a panel in `container` is relative to: the
// container's padding box (its border doesn't count), or the viewport's own origin.
const originOf = (container: HTMLElement | undefined): Point => {
  if (!container) return { x: 0, y: 0 };
  const rect = container.getBoundingClientRect();
  return { x: rect.left + container.clientLeft, y: rect.top + container.clientTop };
};

// `style`, placed in the viewport, moved to the same spot relative to `origin`.
const fromOrigin = (style: CSSProperties, origin: Point): CSSProperties =>
  origin.x || origin.y
    ? {
        ...style,
        left: (style.left as number) - origin.x,
        top: (style.top as number) - origin.y,
      }
    : style;

export type AnchorPosition = {
  /** The panel's fixed-position style (see `anchoredStyle`), or `null` before the first measure. */
  style: CSSProperties | null;
  /** The side the panel opens on, once flipped (see `resolveSide`). */
  side: AnchorSide;
  /** Callback ref for the panel, measured for the collision handling. */
  panelRef: (panel: HTMLElement | null) => void;
};

/**
 * Keeps a floating panel in place next to its anchor. While `open`, measures the anchor and
 * the panel, and measures them again on a window resize, on any scroll (capture phase, so a
 * scrolling container counts as much as the page) and when either changes size (a web font
 * swap, a new label, a filtered list): a border-box `ResizeObserver`, since the default
 * content box misses padding changes.
 *
 * The panel opens where `placement` says, then, once measured, flips or moves to stay in the
 * viewport (see `anchoredStyle`). Closed, it keeps the last position, so a panel fading out
 * stays in place. It measures in a layout effect, so the panel is placed before the browser
 * paints it. Pass another ref object to anchor the panel to another element.
 *
 * A panel rendered in `container`, the element of a modal dialog (`usePortalContainer`), is
 * placed relative to that element's origin rather than the viewport's, which is what its
 * fixed position means once the container has a transform (the sliding Drawer panel).
 *
 * Internal to the package, not exported.
 */
export function useAnchorPosition(
  anchorRef: RefObject<HTMLElement | null>,
  open: boolean,
  placement: AnchorPlacement,
  container?: HTMLElement | null
): AnchorPosition {
  const [measures, setMeasures] = useState<Measures | null>(null);
  const [panel, setPanel] = useState<HTMLElement | null>(null);
  // Set when the anchor wasn't attached yet: a compound component's trigger written after
  // its panel gets its ref after the panel's layout effect ran. Re-runs the effect once.
  const [missed, setMissed] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    if (!anchor) {
      setMissed(true);
      return;
    }
    const measure = () => {
      const next: Measures = {
        anchor: anchor.getBoundingClientRect(),
        // The box fixed elements are laid out in: the viewport without its scrollbars.
        viewport: {
          width: document.documentElement.clientWidth,
          height: document.documentElement.clientHeight,
        },
        // Layout size, which the panel's own translate doesn't change.
        panel: panel && { width: panel.offsetWidth, height: panel.offsetHeight },
        origin: originOf(container ?? undefined),
      };
      // Most scrolls happen in containers the anchor isn't in: don't re-render for nothing.
      setMeasures((prev) => (sameMeasures(prev, next) ? prev : next));
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const observer = new ResizeObserver(measure);
    observer.observe(anchor, { box: 'border-box' });
    if (panel) observer.observe(panel, { box: 'border-box' });
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      observer.disconnect();
    };
  }, [open, anchorRef, missed, panel, container]);

  if (!measures) return { style: null, side: placement.side ?? 'bottom', panelRef: setPanel };
  const bounds = measures.panel
    ? { panel: measures.panel, viewport: measures.viewport }
    : undefined;
  return {
    style: fromOrigin(anchoredStyle(measures.anchor, placement, bounds), measures.origin),
    side: resolveSide(measures.anchor, placement, bounds),
    panelRef: setPanel,
  };
}
