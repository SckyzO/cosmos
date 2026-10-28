import { describe, expect, it } from 'vitest';
import { pinEdges, pinOffsets, pinStyle } from './pinned';

describe('pinOffsets', () => {
  it('adds up the pinned cells before a start-pinned one', () => {
    const { start } = pinOffsets([44, 168, 100, 100], ['start', 'start', undefined, undefined]);
    expect(start).toEqual([0, 44, undefined, undefined]);
  });

  it('adds up the pinned cells after an end-pinned one', () => {
    const { end } = pinOffsets([100, 100, 136, 64], [undefined, undefined, 'end', 'end']);
    expect(end).toEqual([undefined, undefined, 64, 0]);
  });

  it('skips the cells that scroll between two pinned ones', () => {
    const { start } = pinOffsets([40, 90, 50], ['start', undefined, 'start']);
    expect(start).toEqual([0, undefined, 40]);
  });

  it('counts a width not measured yet as 0', () => {
    const { start } = pinOffsets([], ['start', 'start']);
    expect(start).toEqual([0, 0]);
  });

  it('keeps both sides apart', () => {
    const { start, end } = pinOffsets([10, 20, 30], ['start', undefined, 'end']);
    expect(start).toEqual([0, undefined, undefined]);
    expect(end).toEqual([undefined, undefined, 0]);
  });
});

describe('pinEdges', () => {
  it('names the last start cell and the first end cell', () => {
    expect(pinEdges(['start', 'start', undefined, 'end', 'end'])).toEqual({ start: 1, end: 3 });
  });

  it('gives -1 for a side with no pinned cell', () => {
    expect(pinEdges([undefined, 'end'])).toEqual({ start: -1, end: 1 });
    expect(pinEdges([undefined])).toEqual({ start: -1, end: -1 });
  });
});

describe('pinStyle', () => {
  const offsets = pinOffsets([10, 20, 30], ['start', undefined, 'end']);

  it('gives the inline-start inset to a start cell, the inline-end one to an end cell, nothing to the others', () => {
    expect(pinStyle(offsets, 0)).toEqual({ insetInlineStart: 0 });
    expect(pinStyle(offsets, 1)).toBeUndefined();
    expect(pinStyle(offsets, 2)).toEqual({ insetInlineEnd: 0 });
  });
});
