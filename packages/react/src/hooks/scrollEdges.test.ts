import { describe, expect, it } from 'vitest';
import { scrollEdges } from './scrollEdges';

describe('scrollEdges', () => {
  it('has no edge while everything fits', () => {
    expect(scrollEdges({ scrollLeft: 0, clientWidth: 300, scrollWidth: 300 })).toEqual({
      start: false,
      end: false,
    });
  });

  it('has more to the end before any scroll', () => {
    expect(scrollEdges({ scrollLeft: 0, clientWidth: 300, scrollWidth: 900 })).toEqual({
      start: false,
      end: true,
    });
  });

  it('has more on both sides in the middle', () => {
    expect(scrollEdges({ scrollLeft: 250, clientWidth: 300, scrollWidth: 900 })).toEqual({
      start: true,
      end: true,
    });
  });

  it('has more to the start only at the far end', () => {
    expect(scrollEdges({ scrollLeft: 600, clientWidth: 300, scrollWidth: 900 })).toEqual({
      start: true,
      end: false,
    });
  });

  it('reads a negative scrollLeft (right to left) like its mirror image', () => {
    for (const scrollLeft of [0, 250, 600]) {
      const metrics = { clientWidth: 300, scrollWidth: 900 };
      expect(scrollEdges({ ...metrics, scrollLeft: -scrollLeft })).toEqual(
        scrollEdges({ ...metrics, scrollLeft })
      );
    }
  });

  it('ignores a sub-pixel rounding', () => {
    expect(scrollEdges({ scrollLeft: -0.6, clientWidth: 300, scrollWidth: 300.5 })).toEqual({
      start: false,
      end: false,
    });
  });
});
