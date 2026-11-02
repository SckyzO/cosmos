import type { CSSProperties } from 'react';

/** Visually hidden, still read by screen readers: the reading table or list a chart keeps next to its picture. */
export const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  // Not the usual -1px: it would put the box a pixel outside the start edge of its parent, and a
  // chart that keeps its left-to-right layout in a right-to-left page sits in a container that
  // scrolls to its left.
  margin: 0,
  padding: 0,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
};
