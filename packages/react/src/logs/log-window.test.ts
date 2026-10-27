import { describe, expect, it } from 'vitest';
import {
  MAX_DETAIL_SLOTS,
  MIN_DETAIL_SLOTS,
  detailSlots,
  lineAt,
  lineWindow,
  slotOf,
  totalSlots,
  type ExpandedBlock,
} from './log-window';

// Ten lines; line 2 takes 3 more slots and line 6 takes 2 more.
const BLOCKS: ExpandedBlock[] = [
  { index: 2, extra: 3 },
  { index: 6, extra: 2 },
];

describe('detailSlots', () => {
  it('takes a row per field and per line of stack, within the limits', () => {
    const base = { id: 1, time: 0, message: 'm' };
    expect(detailSlots({ ...base, fields: { a: 1 } })).toBe(MIN_DETAIL_SLOTS);
    expect(detailSlots({ ...base, fields: { a: 1, b: 2, c: 3, d: 4 } })).toBe(5);
    expect(detailSlots({ ...base, stack: 'a\nb\nc' })).toBe(5);
    expect(detailSlots({ ...base, stack: Array(50).fill('x').join('\n') })).toBe(MAX_DETAIL_SLOTS);
  });
});

describe('totalSlots and slotOf', () => {
  it('adds the details of the expanded lines', () => {
    expect(totalSlots(10, [])).toBe(10);
    expect(totalSlots(10, BLOCKS)).toBe(15);
  });

  it('places a line after the details above it', () => {
    expect(slotOf(0, BLOCKS)).toBe(0);
    expect(slotOf(2, BLOCKS)).toBe(2);
    expect(slotOf(3, BLOCKS)).toBe(6);
    expect(slotOf(6, BLOCKS)).toBe(9);
    expect(slotOf(7, BLOCKS)).toBe(12);
    expect(slotOf(9, BLOCKS)).toBe(14);
  });
});

describe('lineAt', () => {
  it('is the identity without a block', () => {
    expect(lineAt(4, 10, [])).toBe(4);
  });

  it('maps the slots of a block to its line', () => {
    expect(lineAt(1, 10, BLOCKS)).toBe(1);
    expect(lineAt(2, 10, BLOCKS)).toBe(2);
    expect(lineAt(5, 10, BLOCKS)).toBe(2);
    expect(lineAt(6, 10, BLOCKS)).toBe(3);
    expect(lineAt(9, 10, BLOCKS)).toBe(6);
    expect(lineAt(11, 10, BLOCKS)).toBe(6);
    expect(lineAt(12, 10, BLOCKS)).toBe(7);
    expect(lineAt(14, 10, BLOCKS)).toBe(9);
  });

  it('inverts slotOf', () => {
    for (let index = 0; index < 10; index++) {
      expect(lineAt(slotOf(index, BLOCKS), 10, BLOCKS)).toBe(index);
    }
  });

  it('stays inside the lines', () => {
    expect(lineAt(-5, 10, BLOCKS)).toBe(0);
    expect(lineAt(500, 10, BLOCKS)).toBe(9);
    expect(lineAt(3, 0, BLOCKS)).toBe(0);
  });
});

describe('lineWindow', () => {
  it('draws the lines of the slots and leaves the rest to the spacers', () => {
    expect(lineWindow(3, 8, 20, [])).toEqual({ first: 3, last: 7, before: 3, after: 12 });
  });

  it('draws a block whole when the window touches it', () => {
    // Slots 4 to 7: the details of line 2 (slots 3-5) and lines 3 and 4 (6 and 7).
    const window = lineWindow(4, 8, 10, BLOCKS);
    expect(window.first).toBe(2);
    expect(window.last).toBe(4);
    expect(window.before).toBe(2);
    // 15 slots, minus the 2 before and the 5 drawn (line 2 and its 3, then 3 and 4: 4 + 1 + 1).
    expect(window.after).toBe(15 - 2 - 6);
  });

  it('keeps the room of the last line details in the spacer after', () => {
    const window = lineWindow(0, 3, 10, BLOCKS);
    expect(window).toEqual({ first: 0, last: 2, before: 0, after: 15 - 0 - 6 });
  });

  it('keeps the whole height before anything is measured, and has nothing for no line', () => {
    expect(lineWindow(0, 0, 10, BLOCKS)).toEqual({ first: 0, last: -1, before: 0, after: 15 });
    expect(lineWindow(0, 5, 0, [])).toEqual({ first: 0, last: -1, before: 0, after: 0 });
  });
});
