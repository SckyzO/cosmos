import { describe, expect, it } from 'vitest';
import { shares } from './shares';

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

describe('shares', () => {
  it('gives each value its percent of the total', () => {
    expect(shares([44, 23, 18, 9, 6])).toEqual([44, 23, 18, 9, 6]);
    expect(shares([1, 1])).toEqual([50, 50]);
  });

  it('adds up to 100 whatever the rounding', () => {
    for (const values of [
      [1, 1, 1],
      [1, 2, 4],
      [5, 3, 2, 7, 11, 13],
      [1, 1, 1, 1, 1, 1, 1],
    ]) {
      expect(sum(shares(values))).toBe(100);
    }
  });

  it('gives the extra points to the largest remainders, the first on a tie', () => {
    expect(shares([1, 1, 1])).toEqual([34, 33, 33]);
    expect(shares([2, 1, 1, 1, 1, 1, 1])).toEqual([25, 13, 13, 13, 12, 12, 12]);
  });

  it('is all zero when there is nothing to share', () => {
    expect(shares([0, 0])).toEqual([0, 0]);
    expect(shares([])).toEqual([]);
  });

  it('counts a negative value as zero', () => {
    expect(shares([3, -2, 1])).toEqual([75, 0, 25]);
  });

  it('keeps a lone value at 100', () => {
    expect(shares([7])).toEqual([100]);
  });
});
