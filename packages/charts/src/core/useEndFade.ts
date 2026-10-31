import { useEffect, useState, type CSSProperties } from 'react';

const EDGE = '1.5rem';

/**
 * The style that fades the end of a box that scrolls sideways while there is more past it: a
 * hint that the content goes on, as the tables of cosmos-react give. Charts read left to right
 * whatever the page, so the end is the right edge. The start is left alone: it holds the row
 * labels, which stay in view. `undefined` while it all fits, and until the first measure. Attach
 * `ref` to the scrolling box.
 */
export const useEndFade = () => {
  const [element, ref] = useState<HTMLElement | null>(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    if (!element) return;
    const measure = () =>
      setMore(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
    measure();
    element.addEventListener('scroll', measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    return () => {
      element.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, [element]);
  const mask = `linear-gradient(to right, #000 calc(100% - ${EDGE}), transparent)`;
  const style: CSSProperties | undefined = more
    ? { maskImage: mask, WebkitMaskImage: mask }
    : undefined;
  return { ref, style };
};
