import { useEffect, useState } from 'react';

/**
 * The width of an element, kept up to date while it resizes. Attach `ref` to
 * the element; `width` is `undefined` until it is measured (and in SSR).
 */
export const useElementWidth = () => {
  const [element, ref] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState<number>();
  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return { ref, width };
};
