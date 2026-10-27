import { useLayoutEffect, useState, type RefObject } from 'react';
import { fitCount } from './uptime';

/**
 * How many marks of `size` px, `gap` px apart, the element's width holds: `Infinity` until it is
 * measured (before the first paint), so a server render and a browser without `ResizeObserver`
 * show every mark. Measured again whenever the element is resized.
 *
 * The element must take its width from its parent, never from its marks, or fewer marks would
 * make it narrower still.
 *
 * Internal to the package, not exported.
 */
export const useFitCount = (
  ref: RefObject<HTMLElement | null>,
  size: number,
  gap: number
): number => {
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width === null ? Infinity : fitCount(width, size, gap);
};
