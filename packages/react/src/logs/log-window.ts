import type { LogLine } from './types';

// The window maths of the viewer. Every line is one slot tall, and an expanded line takes more
// slots after its own, for its details: the slots are what `useVirtualWindow` windows over.
// Plain functions, so they are unit-tested in Node.

/** An expanded line, by its index among the lines drawn, and how many slots its details take. */
export type ExpandedBlock = { index: number; extra: number };

/** The most slots (rows) the details of an expanded line take: past it they scroll. */
export const MAX_DETAIL_SLOTS = 12;
/** The fewest slots they take. */
export const MIN_DETAIL_SLOTS = 2;

/**
 * The slots the details of `line` take: a row per field, a row per line of the stack and one more
 * for its heading, between `MIN_DETAIL_SLOTS` and `MAX_DETAIL_SLOTS`. It only reads the line, so a
 * line keeps its height while the buffer moves.
 */
export const detailSlots = (line: LogLine): number => {
  const fields = line.fields ? Object.keys(line.fields).length : 0;
  const stack = line.stack ? line.stack.split('\n').length + 1 : 0;
  return Math.min(MAX_DETAIL_SLOTS, Math.max(MIN_DETAIL_SLOTS, fields + stack + 1));
};

/** The slots there are: a slot per line, plus the details of the expanded ones. */
export const totalSlots = (count: number, blocks: readonly ExpandedBlock[]): number =>
  count + blocks.reduce((sum, block) => sum + block.extra, 0);

/** The first slot of the line at `index`. `blocks` is sorted by `index`. */
export const slotOf = (index: number, blocks: readonly ExpandedBlock[]): number => {
  let slot = index;
  for (const block of blocks) {
    if (block.index >= index) break;
    slot += block.extra;
  }
  return slot;
};

/**
 * The line whose slots (its own and its details') hold `slot`, clamped to the lines. `blocks` is
 * sorted by `index`.
 */
export const lineAt = (slot: number, count: number, blocks: readonly ExpandedBlock[]): number => {
  if (count <= 0) return 0;
  const target = Math.max(0, slot);
  // The slots of the details of the blocks before `target`: they are not lines.
  let passed = 0;
  for (const block of blocks) {
    const first = block.index + passed;
    if (target < first) break;
    // Inside the block: the line itself, then its details.
    if (target <= first + block.extra) return Math.min(block.index, count - 1);
    passed += block.extra;
  }
  return Math.min(target - passed, count - 1);
};

/** What a windowed viewer draws: the lines from `first` to `last` (included) between two spacers. */
export type LineWindow = { first: number; last: number; before: number; after: number };

/**
 * The lines to draw for the slots `start` to `end` (excluded) of `slice`, and the room, in slots,
 * of the lines above and below that are not drawn. Nothing to draw gives `last` before `first`.
 */
export const lineWindow = (
  start: number,
  end: number,
  count: number,
  blocks: readonly ExpandedBlock[]
): LineWindow => {
  if (count <= 0) return { first: 0, last: -1, before: 0, after: 0 };
  // Nothing in the window yet: the room of every line is still there, so the scroller keeps its height.
  if (end <= start) return { first: 0, last: -1, before: 0, after: totalSlots(count, blocks) };
  const first = lineAt(start, count, blocks);
  const last = Math.max(first, lineAt(end - 1, count, blocks));
  const tail = blocks.find((block) => block.index === last)?.extra ?? 0;
  return {
    first,
    last,
    before: slotOf(first, blocks),
    after: totalSlots(count, blocks) - slotOf(last, blocks) - 1 - tail,
  };
};
