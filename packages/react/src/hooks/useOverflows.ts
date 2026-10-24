import { useEffect, useState, type RefObject } from 'react';

/**
 * Whether the element's content overflows its box, so that it scrolls. False until the first
 * measure, then re-measured whenever the element, or a child it has at mount, changes size.
 *
 * Internal to the package, not exported.
 */
export const useOverflows = (ref: RefObject<HTMLElement | null>) => {
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // A ResizeObserver reports every element it starts to observe, which is the first measure.
    const observer = new ResizeObserver(() =>
      setOverflows(node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)
    );
    observer.observe(node);
    for (const child of node.children) observer.observe(child);
    return () => observer.disconnect();
  }, [ref]);
  return overflows;
};
