import { useLayoutEffect, useState, type RefObject } from 'react';

// A window over a long list of rows that all have the same height: only the rows in view, and a
// few more on each side, are drawn, with a spacer standing for the rest above and below. The
// maths (`windowSlice`, `windowParts`) are plain functions so they can be unit-tested; the hook
// only feeds them the scroll position and the height of the scroller.

export type WindowSlice = {
  /** Index of the first row to draw. */
  start: number;
  /** One past the index of the last row to draw. */
  end: number;
  /** Height in px of the rows above the window, which are not drawn. */
  before: number;
  /** Height in px of the rows below the window, which are not drawn. */
  after: number;
};

export type WindowInput = {
  /** How far the scroller is scrolled, in px. */
  scrollTop: number;
  /** The visible height of the scroller, in px. */
  viewportHeight: number;
  /** The height of every row, in px. */
  rowHeight: number;
  /** How many rows there are. */
  count: number;
  /** Rows drawn beyond the visible ones, on each side. */
  overscan: number;
};

/**
 * The rows to draw: those that intersect the viewport, plus `overscan` on each side, clamped to
 * the list. A scroll position outside the content (the elastic bounce past either end, a list
 * that just got shorter) lands on the nearest rows. Nothing to draw without rows, and no window
 * from a row height that is not a positive number (the whole list would be one spacer).
 */
export const windowSlice = ({
  scrollTop,
  viewportHeight,
  rowHeight,
  count,
  overscan,
}: WindowInput): WindowSlice => {
  if (!(rowHeight > 0) || !(count > 0)) return { start: 0, end: 0, before: 0, after: 0 };
  const extra = Math.max(0, Math.floor(overscan));
  const top = Math.max(0, scrollTop);
  const first = Math.floor(top / rowHeight);
  const last = Math.ceil((top + Math.max(0, viewportHeight)) / rowHeight);
  const start = Math.min(Math.max(0, first - extra), count);
  const end = Math.min(Math.max(start, last + extra), count);
  return { start, end, before: start * rowHeight, after: (count - end) * rowHeight };
};

/** What a windowed body draws, top to bottom: a spacer of `height` px, or the row at `index`. */
export type WindowPart = { kind: 'spacer'; height: number } | { kind: 'row'; index: number };

/**
 * The window as a list of parts. With `pinned` (the row that holds the keyboard focus) outside the
 * window, that row is drawn in its own place between spacers, so it is not unmounted, and the
 * focus survives scrolling away from it. A `pinned` inside the window, or not a row of the list,
 * changes nothing. Spacers of no height are left out.
 */
export const windowParts = (
  slice: WindowSlice,
  count: number,
  rowHeight: number,
  pinned: number | null
): WindowPart[] => {
  const parts: WindowPart[] = [];
  const spacer = (rows: number) => {
    if (rows > 0) parts.push({ kind: 'spacer', height: rows * rowHeight });
  };
  const rows = () => {
    for (let index = slice.start; index < slice.end; index++) parts.push({ kind: 'row', index });
  };
  const outside =
    pinned !== null &&
    Number.isInteger(pinned) &&
    pinned >= 0 &&
    pinned < count &&
    (pinned < slice.start || pinned >= slice.end);
  if (!outside) {
    spacer(slice.start);
    rows();
    spacer(count - slice.end);
  } else if (pinned < slice.start) {
    spacer(pinned);
    parts.push({ kind: 'row', index: pinned });
    spacer(slice.start - pinned - 1);
    rows();
    spacer(count - slice.end);
  } else {
    spacer(slice.start);
    rows();
    spacer(pinned - slice.end);
    parts.push({ kind: 'row', index: pinned });
    spacer(count - pinned - 1);
  }
  return parts;
};

export type UseVirtualWindowOptions = {
  /** The element that scrolls the rows. */
  scrollerRef: RefObject<HTMLElement | null>;
  count: number;
  /** The height of every row, in px. */
  rowHeight: number;
  /** Rows drawn beyond the visible ones, on each side. Default 6. */
  overscan?: number;
  /** Off, the window is the whole list and nothing listens to the scroller. Default `true`. */
  enabled?: boolean;
};

/**
 * The slice of `count` rows, each `rowHeight` px tall, to draw in `scrollerRef`'s element: it
 * follows the scroll position and the size of the scroller, and re-renders only when the slice
 * changes, not on every pixel of scroll. The caller draws `windowParts` of it, with the rows
 * themselves at a fixed height.
 *
 * Internal to the package, not exported. DataTable's `virtualize` uses it.
 */
export const useVirtualWindow = ({
  scrollerRef,
  count,
  rowHeight,
  overscan = 6,
  enabled = true,
}: UseVirtualWindowOptions): WindowSlice => {
  const [range, setRange] = useState({ start: 0, end: 0 });

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!enabled || !el) return;
    const measure = () => {
      const next = windowSlice({
        scrollTop: el.scrollTop,
        viewportHeight: el.clientHeight,
        rowHeight,
        count,
        overscan,
      });
      setRange((prev) =>
        prev.start === next.start && prev.end === next.end
          ? prev
          : { start: next.start, end: next.end }
      );
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, [scrollerRef, enabled, count, rowHeight, overscan]);

  if (!enabled) return { start: 0, end: count, before: 0, after: 0 };
  // `count` may have dropped since the range was measured: stay inside the list for that render.
  const start = Math.min(range.start, count);
  const end = Math.min(range.end, count);
  return { start, end, before: start * rowHeight, after: (count - end) * rowHeight };
};
