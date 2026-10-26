import { describe, expect, it } from 'vitest';
import {
  TIE_SPREAD,
  describeChange,
  periodsOf,
  plottedRanks,
  rankChange,
  rankSpan,
  ranksOf,
  shortName,
} from './bump';

const point = (x: string, rank: number) => ({ x, rank });

describe('periodsOf', () => {
  it('lists every period once, in order of appearance', () => {
    const series = [
      { name: 'a', data: [point('Jan', 1), point('Feb', 2)] },
      { name: 'b', data: [point('Feb', 1), point('Mar', 2)] },
    ];
    expect(periodsOf(series)).toEqual(['Jan', 'Feb', 'Mar']);
  });

  it('is empty without data', () => {
    expect(periodsOf([])).toEqual([]);
    expect(periodsOf([{ name: 'a', data: [] }])).toEqual([]);
  });
});

describe('ranksOf', () => {
  it('leaves a gap where a series has not entered yet', () => {
    const series = [
      { name: 'a', data: [point('Jan', 1), point('Feb', 1), point('Mar', 2)] },
      { name: 'late', data: [point('Mar', 1)] },
    ];
    const periods = periodsOf(series);
    expect(ranksOf(series, periods)).toEqual([
      [1, 1, 2],
      [undefined, undefined, 1],
    ]);
  });

  it('keeps the last rank of a period listed twice and drops a rank that is not a number', () => {
    const series = [{ name: 'a', data: [point('Jan', 3), point('Jan', 2), point('Feb', NaN)] }];
    expect(ranksOf(series, ['Jan', 'Feb'])).toEqual([[2, undefined]]);
  });
});

describe('plottedRanks', () => {
  it('leaves ranks without a tie where they are', () => {
    expect(plottedRanks([[1, 2], [2, 1], [3]])).toEqual([[1, 2], [2, 1], [3]]);
  });

  it('spreads series tied on a rank around it, in series order', () => {
    const [a, b, c] = plottedRanks([[2], [2], [3]]);
    expect(a[0]).toBeCloseTo(2 - TIE_SPREAD / 2);
    expect(b[0]).toBeCloseTo(2 + TIE_SPREAD / 2);
    expect(c[0]).toBe(3);
  });

  it('centers three tied series on their rank', () => {
    const plotted = plottedRanks([[1], [1], [1]]).map((r) => r[0] as number);
    expect(plotted[1]).toBeCloseTo(1);
    expect(plotted[2] - plotted[0]).toBeCloseTo(2 * TIE_SPREAD);
  });

  it('ties only series of the same period and skips gaps', () => {
    const plotted = plottedRanks([
      [1, undefined],
      [undefined, 1],
    ]);
    expect(plotted).toEqual([
      [1, undefined],
      [undefined, 1],
    ]);
  });
});

describe('rankChange', () => {
  const periods = ['Mar', 'Apr', 'May', 'Jun'];

  it('has nothing to compare the first period with', () => {
    expect(rankChange([2, 1, 1, 3], periods, 0)).toBeUndefined();
  });

  it('is up when the rank number gets smaller', () => {
    expect(rankChange([3, 1, 1, 3], periods, 1)).toEqual({ direction: 'up', by: 2, versus: 'Mar' });
  });

  it('is down when the rank number gets larger', () => {
    expect(rankChange([3, 1, 1, 3], periods, 3)).toEqual({
      direction: 'down',
      by: 2,
      versus: 'May',
    });
  });

  it('is unchanged on the same rank', () => {
    expect(rankChange([3, 1, 1, 3], periods, 2)).toEqual({ direction: 'same', versus: 'Apr' });
  });

  it('is a new entry when the series had no rank in the previous period', () => {
    expect(rankChange([undefined, undefined, 2, 2], periods, 2)).toEqual({ direction: 'new' });
  });

  it('is nothing for a period the series is not in', () => {
    expect(rankChange([1, undefined, 1, 1], periods, 1)).toBeUndefined();
  });
});

describe('describeChange', () => {
  it('says the change in words', () => {
    expect(describeChange({ direction: 'same', versus: 'May' })).toBe('unchanged vs May');
    expect(describeChange({ direction: 'up', by: 2, versus: 'Apr' })).toBe('up 2 vs Apr');
    expect(describeChange({ direction: 'down', by: 1, versus: 'Mar' })).toBe('down 1 vs Mar');
    expect(describeChange({ direction: 'new' })).toBe('new entry');
  });
});

describe('rankSpan', () => {
  it('is the first and last period with a rank', () => {
    expect(rankSpan([undefined, 2, undefined, 1, undefined])).toEqual({ first: 1, last: 3 });
    expect(rankSpan([1])).toEqual({ first: 0, last: 0 });
  });

  it('is undefined for a series without a rank', () => {
    expect(rankSpan([undefined, undefined])).toBeUndefined();
  });
});

describe('shortName', () => {
  it('keeps a short name and cuts a long one with an ellipsis', () => {
    expect(shortName('Aurora', 12)).toBe('Aurora');
    expect(shortName('Northern lights', 8)).toBe('Norther…');
  });
});
