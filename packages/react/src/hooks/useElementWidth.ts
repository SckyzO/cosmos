import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * The width of the element in px (`clientWidth`): 0 until it is measured, which happens before the
 * first paint, then again whenever the element changes size.
 *
 * Internal to the package, not exported.
 */
export const useElementWidth = (ref: RefObject<HTMLElement | null>) => {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setWidth(node.clientWidth);
    // The ResizeObserver's first report comes after paint; measure now so the first frame is right.
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return width;
};
