import { useEffect, useState, type CSSProperties, type RefObject } from 'react';

const EDGE = '1.5rem';

/**
 * The style that fades the edges of a horizontally scrolling element, on the side that has more
 * to scroll to: a hint that the content goes on. `undefined` while it all fits, and until the
 * first measure. `start: false` leaves the start edge alone (a column pinned there). Re-measured on scroll and whenever the element, or a child it has at mount,
 * changes size.
 *
 * Internal to the package, not exported.
 */
export const useScrollFade = (
  ref: RefObject<HTMLElement | null>,
  { start: fadeStart = true }: { start?: boolean } = {}
): CSSProperties | undefined => {
  const [fade, setFade] = useState({ start: false, end: false });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const start = node.scrollLeft > 1;
      const end = node.scrollLeft + node.clientWidth < node.scrollWidth - 1;
      setFade((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
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
  const start = fadeStart && fade.start;
  if (!start && !fade.end) return undefined;
  const mask = `linear-gradient(to right, ${start ? 'transparent' : '#000'}, #000 ${EDGE}, #000 calc(100% - ${EDGE}), ${fade.end ? 'transparent' : '#000'})`;
  return { maskImage: mask, WebkitMaskImage: mask };
};
