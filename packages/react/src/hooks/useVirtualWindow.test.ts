import { describe, expect, it } from 'vitest';
import { windowParts, windowSlice, type WindowInput, type WindowSlice } from './useVirtualWindow';

const input = (over: Partial<WindowInput> = {}): WindowInput => ({
  scrollTop: 0,
  viewportHeight: 200,
  rowHeight: 20,
  count: 1000,
  overscan: 3,
  ...over,
});

describe('windowSlice', () => {
  it('starts at the first row, with the overscan below the visible ones', () => {
    // 200 / 20 = 10 rows in view, plus 3 of overscan below; none above the first row.
    expect(windowSlice(input())).toEqual({ start: 0, end: 13, before: 0, after: 987 * 20 });
  });

  it('draws the rows in view and the overscan on both sides in the middle', () => {
    // Scrolled 1000px: row 50 is the first in view, rows 50..59 are visible.
    expect(windowSlice(input({ scrollTop: 1000 }))).toEqual({
      start: 47,
      end: 63,
      before: 47 * 20,
      after: 937 * 20,
    });
  });

  it('counts a row that is partly in view', () => {
    // 1010px: row 50 is half out of the top, row 60 half in at the bottom.
    const slice = windowSlice(input({ scrollTop: 1010, overscan: 0 }));
    expect([slice.start, slice.end]).toEqual([50, 61]);
  });

  it('keeps the spacers and the rows equal to the whole list', () => {
    for (const scrollTop of [0, 7, 333, 5000, 19800, 20000, 99999]) {
      const s = windowSlice(input({ scrollTop }));
      expect(s.before + (s.end - s.start) * 20 + s.after).toBe(1000 * 20);
    }
  });

  it('stops at the end of the list', () => {
    // Scrolled to the very bottom: 1000 rows of 20px, a 200px viewport.
    const s = windowSlice(input({ scrollTop: 19800 }));
    expect(s.end).toBe(1000);
    expect(s.after).toBe(0);
    expect(s.start).toBe(990 - 3);
  });

  it('lands on the last rows for a scroll position past the content', () => {
    const s = windowSlice(input({ scrollTop: 1e9 }));
    expect(s).toEqual({ start: 1000, end: 1000, before: 20000, after: 0 });
  });

  it('treats a negative scroll position (elastic bounce) as the top', () => {
    expect(windowSlice(input({ scrollTop: -80 }))).toEqual(windowSlice(input()));
  });

  it('draws every row of a list shorter than the viewport', () => {
    expect(windowSlice(input({ count: 4 }))).toEqual({ start: 0, end: 4, before: 0, after: 0 });
  });

  it('draws nothing for no rows', () => {
    expect(windowSlice(input({ count: 0 }))).toEqual({ start: 0, end: 0, before: 0, after: 0 });
  });

  it('draws only the overscan while the scroller has no height (display: none)', () => {
    const s = windowSlice(input({ viewportHeight: 0 }));
    expect([s.start, s.end]).toEqual([0, 3]);
  });

  it('refuses a row height that is not a positive number', () => {
    for (const rowHeight of [0, -20, NaN]) {
      expect(windowSlice(input({ rowHeight }))).toEqual({ start: 0, end: 0, before: 0, after: 0 });
    }
  });

  it('takes a negative or fractional overscan as a whole count from zero', () => {
    expect(windowSlice(input({ scrollTop: 1000, overscan: -2 })).start).toBe(50);
    expect(windowSlice(input({ scrollTop: 1000, overscan: 2.9 })).start).toBe(48);
  });

  it('works on a fractional row height', () => {
    const s = windowSlice(input({ rowHeight: 48.5, scrollTop: 970, overscan: 0 }));
    expect(s.start).toBe(20);
    expect(s.before).toBeCloseTo(20 * 48.5);
  });
});

describe('windowParts', () => {
  const slice = (start: number, end: number, count = 100, rowHeight = 10): WindowSlice => ({
    start,
    end,
    before: start * rowHeight,
    after: (count - end) * rowHeight,
  });
  // A compact picture: spacers as `~height`, rows as their index.
  const show = (parts: ReturnType<typeof windowParts>) =>
    parts.map((p) => (p.kind === 'spacer' ? `~${p.height}` : String(p.index))).join(' ');

  it('is a spacer, the window and a spacer', () => {
    expect(show(windowParts(slice(10, 13), 100, 10, null))).toBe('~100 10 11 12 ~870');
  });

  it('leaves out a spacer of no height at either end', () => {
    expect(show(windowParts(slice(0, 3), 100, 10, null))).toBe('0 1 2 ~970');
    expect(show(windowParts(slice(97, 100), 100, 10, null))).toBe('~970 97 98 99');
  });

  it('changes nothing for a pinned row inside the window', () => {
    expect(windowParts(slice(10, 13), 100, 10, 11)).toEqual(
      windowParts(slice(10, 13), 100, 10, null)
    );
  });

  it('draws a pinned row above the window in its own place', () => {
    expect(show(windowParts(slice(50, 53), 100, 10, 5))).toBe('~50 5 ~440 50 51 52 ~470');
  });

  it('draws a pinned row below the window in its own place', () => {
    expect(show(windowParts(slice(10, 13), 100, 10, 90))).toBe('~100 10 11 12 ~770 90 ~90');
  });

  it('has no spacer between the window and a pinned row right next to it', () => {
    expect(show(windowParts(slice(10, 13), 100, 10, 13))).toBe('~100 10 11 12 13 ~860');
    expect(show(windowParts(slice(10, 13), 100, 10, 9))).toBe('~90 9 10 11 12 ~870');
  });

  it('pins the first and the last row without a spacer at the end of the list', () => {
    expect(show(windowParts(slice(50, 53), 100, 10, 0))).toBe('0 ~490 50 51 52 ~470');
    expect(show(windowParts(slice(10, 13), 100, 10, 99))).toBe('~100 10 11 12 ~860 99');
  });

  it('ignores a pinned index that is not a row of the list', () => {
    const plain = windowParts(slice(10, 13), 100, 10, null);
    for (const pinned of [-1, 100, 1.5, NaN]) {
      expect(windowParts(slice(10, 13), 100, 10, pinned)).toEqual(plain);
    }
  });

  it('adds up to the height of the whole list, pinned or not', () => {
    for (const pinned of [null, 5, 11, 90, 0, 99]) {
      const total = windowParts(slice(10, 13), 100, 10, pinned).reduce(
        (sum, p) => sum + (p.kind === 'spacer' ? p.height : 10),
        0
      );
      expect(total).toBe(1000);
    }
  });
});
