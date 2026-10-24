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

// Smallest gap kept between an `end`-aligned panel and the left of the screen.
const VIEWPORT_MARGIN = 16;

/**
 * The `position: fixed` style that puts a panel on `side` of an anchor whose viewport rect is
 * `rect`. An `end`-aligned panel also gets a `maxWidth` that keeps it 16px from the left of
 * the screen. The style sets `--anchor-width` too, for a part of the panel that points at
 * the anchor (an arrow).
 *
 * No collision handling: the panel opens on the side asked for, even when the viewport cuts
 * it there.
 */
export function anchoredStyle(
  rect: AnchorRect,
  { side = 'bottom', align = 'center', offset = 0, matchWidth = false }: AnchorPlacement = {}
): CSSProperties {
  const style = { '--anchor-width': `${rect.width}px` } as CSSProperties;
  if (matchWidth) style.width = rect.width;

  if (side === 'left' || side === 'right') {
    style.top = rect.top + rect.height / 2;
    if (side === 'right') {
      style.left = rect.right + offset;
      style.transform = 'translateY(-50%)';
    } else {
      style.left = rect.left - offset;
      style.transform = 'translate(-100%, -50%)';
    }
    return style;
  }

  const shiftX = align === 'end' ? '-100%' : align === 'center' ? '-50%' : '0';
  style.left =
    align === 'end' ? rect.right : align === 'center' ? rect.left + rect.width / 2 : rect.left;
  if (align === 'end') style.maxWidth = rect.right - VIEWPORT_MARGIN;
  if (side === 'top') {
    style.top = rect.top - offset;
    style.transform = `translate(${shiftX}, -100%)`;
  } else {
    style.top = rect.bottom + offset;
    if (shiftX !== '0') style.transform = `translateX(${shiftX})`;
  }
  return style;
}

const sameRect = (a: AnchorRect | null, b: AnchorRect) =>
  !!a && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;

/**
 * Keeps a floating panel in place next to its anchor. While `open`, measures the anchor and
 * measures it again on a window resize, on any scroll (capture phase, so a scrolling
 * container counts as much as the page) and when the anchor itself changes size (a web font
 * swap, a new label): a border-box `ResizeObserver`, since the default content box misses
 * padding changes.
 *
 * Returns the panel's fixed-position style (see `anchoredStyle`), or `null` while closed or
 * before the first measure. It measures in a layout effect, so the panel is placed before the
 * browser paints it. Pass another ref object to anchor the panel to another element.
 *
 * Internal to the package, not exported.
 */
export function useAnchorPosition(
  anchorRef: RefObject<HTMLElement | null>,
  open: boolean,
  placement: AnchorPlacement
): CSSProperties | null {
  const [rect, setRect] = useState<AnchorRect | null>(null);
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
      const next = anchor.getBoundingClientRect();
      // Most scrolls happen in containers the anchor isn't in: don't re-render for nothing.
      setRect((prev) => (sameRect(prev, next) ? prev : next));
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const observer = new ResizeObserver(measure);
    observer.observe(anchor, { box: 'border-box' });
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      observer.disconnect();
    };
  }, [open, anchorRef, missed]);

  return open && rect ? anchoredStyle(rect, placement) : null;
}
