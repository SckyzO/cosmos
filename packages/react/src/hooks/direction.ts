import { useCallback, useLayoutEffect, useRef, useState, type RefCallback } from 'react';

/** The reading direction of an element, from the native `dir` attribute of it or an ancestor. */
export type Direction = 'ltr' | 'rtl';

/**
 * The direction `element` is laid out in: `rtl` under `dir="rtl"` (on it, on an ancestor, on
 * `<html>`), else `ltr`. Read from the computed style, so `dir="auto"` and a stylesheet's
 * `direction` count as much as the attribute. `read` is the computed-style reader, there for
 * a test in Node.
 *
 * For the places JavaScript has to know: the alignment of a floating panel, the arrow keys of a
 * horizontal widget, the side a swipe goes to. Everything else mirrors through the logical
 * utilities (`ms-`, `text-start`…) and the `rtl:` variant, which need no JavaScript.
 *
 * Internal to the package, not exported.
 */
export const directionOf = (
  element: Element | null | undefined,
  read: (element: Element) => { direction: string } = (el) => getComputedStyle(el)
): Direction => (element && read(element).direction === 'rtl' ? 'rtl' : 'ltr');

/**
 * The direction a widget sits in, for a library that wants it as a prop (Radix's slider, a
 * calendar) and does not read the page. `ref` goes on the widget's root; `direction` is read
 * from the root's parent, because the root usually carries the `dir` this feeds, and it is
 * measured after every commit so a page whose `dir` changes is followed on the next render.
 * `ltr` until the first measure, which lands before the first paint.
 */
export function useParentDirection<T extends Element>(): [Direction, RefCallback<T>] {
  const root = useRef<T | null>(null);
  const [direction, setDirection] = useState<Direction>('ltr');
  const ref = useCallback((node: T | null) => {
    root.current = node;
  }, []);
  // After every commit on purpose: the page's `dir` can change with nothing here changing. The
  // state only moves when the direction does, so this does not loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (root.current) setDirection(directionOf(root.current.parentElement));
  });
  return [direction, ref];
}
