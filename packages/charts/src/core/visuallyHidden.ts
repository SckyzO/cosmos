import type { CSSProperties } from 'react';

/** Visually hidden, still read by screen readers: the reading table or list a chart keeps next to its picture. */
export const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
};
