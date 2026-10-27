import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * The width in px of each cell of a row (its header row), measured before the first paint and
 * again whenever a cell or the row changes size: a column in `%`, one that shares what is left,
 * and a text size change all move them. `[]` while `enabled` is false. `count` re-measures when
 * the number of cells changes.
 *
 * Internal to the package, not exported.
 */
export const usePinnedWidths = (
  rowRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  count: number
): number[] => {
  const [widths, setWidths] = useState<number[]>([]);
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!enabled || !row) {
      setWidths((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    const measure = () => {
      const next = Array.from(row.children, (cell) => cell.getBoundingClientRect().width);
      setWidths((prev) =>
        prev.length === next.length && prev.every((w, i) => Math.abs(w - next[i]) < 0.01)
          ? prev
          : next
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    for (const cell of row.children) observer.observe(cell);
    return () => observer.disconnect();
  }, [rowRef, enabled, count]);
  return widths;
};
