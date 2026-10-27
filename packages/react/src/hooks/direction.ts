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
