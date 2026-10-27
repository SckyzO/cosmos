/** What a scroller reports: the three numbers `scrollEdges` reads off an element. */
export interface ScrollMetrics {
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
}

/**
 * Which edges of a horizontal scroller have more to scroll to, by the end of the line and not by
 * the screen: `start` once it has moved away from where it begins, `end` while there is more
 * past the other side. Where the page reads right to left the scroller begins on the right,
 * `scrollLeft` is 0 there and goes negative toward the end, so its magnitude is the distance
 * scrolled in both directions. One pixel of slack for sub-pixel rounding.
 *
 * Internal to the package, not exported.
 */
export const scrollEdges = ({ scrollLeft, clientWidth, scrollWidth }: ScrollMetrics) => {
  const scrolled = Math.abs(scrollLeft);
  return {
    start: scrolled > 1,
    end: scrolled + clientWidth < scrollWidth - 1,
  };
};
