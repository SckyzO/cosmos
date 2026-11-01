import { useEffect, useState } from 'react';

/**
 * The width and the height of an element, kept up to date while it resizes.
 * Attach `ref` to the element; both are `undefined` until it is measured (and
 * in SSR). `useElementWidth` is the same for a chart that needs only the width.
 */
export const useElementSize = <E extends Element = HTMLElement>() => {
  const [element, ref] = useState<E | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>();
  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // The same size is the same state: no render.
      setSize((current) =>
        current?.width === width && current.height === height ? current : { width, height }
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return { ref, width: size?.width, height: size?.height };
};
