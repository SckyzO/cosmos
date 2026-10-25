import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Whether the element's content overflows its box, so that it scrolls. Measured before the first
 * paint, then whenever the element, or a child it has at mount, changes size: a region that
 * scrolls is keyboard-reachable from its first frame (axe's `scrollable-region-focusable`).
 *
 * Internal to the package, not exported.
 */
export const useOverflows = (ref: RefObject<HTMLElement | null>) => {
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () =>
      setOverflows(node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth);
    // The ResizeObserver's first report comes after paint; measure now so the first frame is right.
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    for (const child of node.children) observer.observe(child);
    return () => observer.disconnect();
  }, [ref]);
  return overflows;
};
