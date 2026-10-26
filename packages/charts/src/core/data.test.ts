import { describe, expect, it } from 'vitest';
import { hasNoData, safeId, seriesKey, toRows } from './data';

describe('toRows', () => {
  it('makes one row per category, with a value under each series key', () => {
    expect(
      toRows(
        ['a', 'b'],
        [
          { name: 'CPU', data: [1, 2] },
          { name: 'Mem', data: [3, 4] },
        ]
      )
    ).toEqual([
      { category: 'a', s0: 1, s1: 3 },
      { category: 'b', s0: 2, s1: 4 },
    ]);
  });

  it('keys a series by position, so a name with dots is no path', () => {
    const [row] = toRows([1], [{ name: 'a.b.c', data: [5] }]);
    expect(row).toEqual({ category: 1, s0: 5 });
    expect(seriesKey(3)).toBe('s3');
  });

  it('leaves a missing point undefined, so the line breaks there', () => {
    expect(toRows(['a', 'b'], [{ name: 'x', data: [1] }])[1]).toEqual({
      category: 'b',
      s0: undefined,
    });
  });
});

describe('hasNoData', () => {
  it('is true with no series, or only series without a point', () => {
    expect(hasNoData([])).toBe(true);
    expect(hasNoData([{ data: [] }, { data: [] }])).toBe(true);
  });

  it('is false as soon as one series has a point', () => {
    expect(hasNoData([{ data: [] }, { data: [0] }])).toBe(false);
  });
});

describe('safeId', () => {
  it('drops what url(#…) cannot take from a React id', () => {
    expect(safeId(':r1a:')).toBe('r1a');
    expect(safeId('_r_0_')).toBe('_r_0_');
  });
});
