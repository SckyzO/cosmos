import { useEffect, useState, type RefObject } from 'react';
import { directionOf, type Direction } from './direction';
import { scrollEdges } from './scrollEdges';

/**
 * Which edges of a horizontally scrolling element have more to scroll to: `start` once it has
 * scrolled away from its beginning (content hides under a start edge), `end` while there is more
 * past the other side. Start is the right-hand edge where the element reads right to left (see
 * `scrollEdges`), and `direction` says which it is. Both edges `false` while it all fits, and
 * until the first measure. Re-measured on scroll and whenever the element, or a child it has at
 * mount, changes size.
 *
 * Internal to the package, not exported.
 */
export const useScrollEdges = (ref: RefObject<HTMLElement | null>) => {
  const [edges, setEdges] = useState<{ start: boolean; end: boolean; direction: Direction }>({
    start: false,
    end: false,
    direction: 'ltr',
  });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const { start, end } = scrollEdges(node);
      const direction = directionOf(node);
      setEdges((prev) =>
        prev.start === start && prev.end === end && prev.direction === direction
          ? prev
          : { start, end, direction }
      );
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
