import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import type { ColumnPin } from './types';

// Pinned columns of a DataTable (`pin` on a column). Internal: not re-exported.
//
// A pinned cell is `sticky` with an offset in px: the widths of the pinned columns between it and
// its edge. The widths are measured (a column may be `20%`, or share what is left), so the
// offsets follow a resize and the text size. A pinned body cell is opaque, so the cells that
// scroll under it do not show through, and it takes the row's hover, selected and open colors
// itself.

/** The offset of each cell from its edge: `left` for a start-pinned cell, `right` for an end one. */
export type PinOffsets = { left: (number | undefined)[]; right: (number | undefined)[] };

/**
 * The offsets of the cells of a row, in order, from their measured `widths` and their `pins`
 * (`undefined` for a cell that scrolls). A start-pinned cell sits after the start-pinned cells
 * before it, an end-pinned one before the end-pinned cells after it. A width not measured yet
 * counts as 0.
 */
export const pinOffsets = (widths: number[], pins: (ColumnPin | undefined)[]): PinOffsets => {
  const left: (number | undefined)[] = [];
  const right: (number | undefined)[] = [];
  let before = 0;
  pins.forEach((pin, i) => {
    left[i] = pin === 'start' ? before : undefined;
    if (pin === 'start') before += widths[i] ?? 0;
  });
  let after = 0;
  for (let i = pins.length - 1; i >= 0; i--) {
    right[i] = pins[i] === 'end' ? after : undefined;
    if (pins[i] === 'end') after += widths[i] ?? 0;
  }
  return { left, right };
};

/**
 * The cells that carry the edge shadow: the last start-pinned one and the first end-pinned one,
 * or `-1` for a side with no pinned cell.
 */
export const pinEdges = (pins: (ColumnPin | undefined)[]): { start: number; end: number } => ({
  start: pins.lastIndexOf('start'),
  end: pins.indexOf('end'),
});

/** The `left` or `right` of a pinned cell, `undefined` for one that scrolls. */
export const pinStyle = (offsets: PinOffsets, index: number): CSSProperties | undefined => {
  const left = offsets.left[index];
  const right = offsets.right[index];
  if (left !== undefined) return { left };
  if (right !== undefined) return { right };
  return undefined;
};

const SELECTED =
  'bg-[color-mix(in_srgb,var(--color-brand-50)_40%,var(--color-white))] dark:bg-[color-mix(in_srgb,var(--color-brand-500)_5%,var(--color-gray-900))]';
const OPEN = 'bg-gray-50 dark:bg-gray-800';
const IDLE =
  'bg-white group-hover/row:bg-gray-50 dark:bg-gray-900 dark:group-hover/row:bg-gray-800';

// The line between a pinned column and the rest is a shadow in place of a border (a collapsed
// border stays behind when the cell is pinned). While content scrolls under the edge it grows a
// soft shadow on the side the content is on. Written out in full: Tailwind reads class names from
// the source and cannot see one built from pieces.
const EDGE = {
  start: {
    rest: '[box-shadow:inset_-1px_0_0_var(--color-border)]',
    scrolled:
      '[box-shadow:inset_-1px_0_0_var(--color-border),8px_0_8px_-8px_rgb(16_24_40/0.25)] dark:[box-shadow:inset_-1px_0_0_var(--color-border),8px_0_8px_-8px_rgb(0_0_0/0.6)]',
  },
  end: {
    rest: '[box-shadow:inset_1px_0_0_var(--color-border)]',
    scrolled:
      '[box-shadow:inset_1px_0_0_var(--color-border),-8px_0_8px_-8px_rgb(16_24_40/0.25)] dark:[box-shadow:inset_1px_0_0_var(--color-border),-8px_0_8px_-8px_rgb(0_0_0/0.6)]',
  },
} as const;
const edge = (side: 'start' | 'end', scrolled: boolean) =>
  EDGE[side][scrolled ? 'scrolled' : 'rest'];

/** What a pinned cell needs besides its offset: `sticky`, an opaque body fill, the edge. */
export const pinnedCell = ({
  head,
  state = 'idle',
  edgeSide,
  scrolled,
}: {
  head: boolean;
  state?: 'idle' | 'selected' | 'open';
  /** Set on the cell that carries the edge: the side it is on. */
  edgeSide?: 'start' | 'end';
  /** Whether content scrolls under that edge now. */
  scrolled?: boolean;
}) =>
  clsx(
    'sticky z-[1]',
    !head && (state === 'selected' ? SELECTED : state === 'open' ? OPEN : IDLE),
    edgeSide && edge(edgeSide, Boolean(scrolled))
  );
