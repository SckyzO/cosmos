import { useLayoutEffect, useState } from 'react';

/**
 * Whether the element's text is cut by a line clamp (`line-clamp-*`): its content is taller than
 * its box. Measured before the first paint, then whenever the element changes size. Takes the
 * element itself, not a ref: it can be replaced (a tooltip that wraps it only while it is
 * clamped), and the measure follows the new one.
 *
 * Internal to the package, not exported.
 */
export const useClamped = (node: HTMLElement | null) => {
  const [clamped, setClamped] = useState(false);
  useLayoutEffect(() => {
    if (!node) return;
    const measure = () => setClamped(node.scrollHeight > node.clientHeight);
    // The ResizeObserver's first report comes after paint; measure now so the first frame is right.
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return node !== null && clamped;
};
