import { useLayoutEffect, useState, type RefObject } from 'react';

/** The width of `ref`'s element, once measured, and again whenever it changes. */
export const useWidth = (ref: RefObject<HTMLElement | null>) => {
  const [width, setWidth] = useState<number>();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setWidth(el.clientWidth);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
};
