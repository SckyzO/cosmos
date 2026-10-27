import type { CSSProperties, RefObject } from 'react';
import { useScrollEdges } from './useScrollEdges';

const EDGE = '1.5rem';

/**
 * The style that fades the edges of a horizontally scrolling element, on the side that has more
 * to scroll to: a hint that the content goes on. `undefined` while it all fits, and until the
 * first measure. `start: false` or `end: false` leaves that edge alone (a column pinned there).
 * Measured by `useScrollEdges`.
 *
 * Internal to the package, not exported.
 */
export const useScrollFade = (
  ref: RefObject<HTMLElement | null>,
  { start: fadeStart = true, end: fadeEnd = true }: { start?: boolean; end?: boolean } = {}
): CSSProperties | undefined => {
  const edges = useScrollEdges(ref);
  const start = fadeStart && edges.start;
  const end = fadeEnd && edges.end;
  if (!start && !end) return undefined;
  const mask = `linear-gradient(to right, ${start ? 'transparent' : '#000'}, #000 ${EDGE}, #000 calc(100% - ${EDGE}), ${end ? 'transparent' : '#000'})`;
  return { maskImage: mask, WebkitMaskImage: mask };
};
