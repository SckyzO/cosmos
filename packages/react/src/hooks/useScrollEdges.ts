import { useEffect, useState, type RefObject } from 'react';

/**
 * Which edges of a horizontally scrolling element have more to scroll to: `start` once it has
 * scrolled away from its beginning (content hides under a start edge), `end` while there is more
 * to the right. Both `false` while it all fits, and until the first measure. Re-measured on scroll
 * and whenever the element, or a child it has at mount, changes size.
 *
 * Internal to the package, not exported.
 */
export const useScrollEdges = (ref: RefObject<HTMLElement | null>) => {
  const [edges, setEdges] = useState({ start: false, end: false });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const start = node.scrollLeft > 1;
      const end = node.scrollLeft + node.clientWidth < node.scrollWidth - 1;
      setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };
    measure();
    node.addEventListener('scroll', measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    for (const child of node.children) observer.observe(child);
    return () => {
      node.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, [ref]);
  return edges;
};
