import { describe, expect, it } from 'vitest';
import { barPercent, largestValue } from './bar-list';

describe('largestValue', () => {
  it('is the largest of the values', () => {
    expect(largestValue([3, 9, 4])).toBe(9);
  });

  it('is 0 for no values, so an empty list has no scale to divide by', () => {
    expect(largestValue([])).toBe(0);
  });

  it('keeps a negative largest value', () => {
    expect(largestValue([-5, -2])).toBe(-2);
  });
});

describe('barPercent', () => {
  it('scales the value to max', () => {
    expect(barPercent(50, 200)).toBe(25);
    expect(barPercent(200, 200)).toBe(100);
  });

  it('caps a value above max at a full bar', () => {
    expect(barPercent(300, 200)).toBe(100);
  });

  it('draws no bar for zero or a negative value', () => {
    expect(barPercent(0, 200)).toBe(0);
    expect(barPercent(-4, 200)).toBe(0);
  });

  it('draws no bar when max is zero or negative, instead of dividing by it', () => {
    expect(barPercent(0, 0)).toBe(0);
    expect(barPercent(5, 0)).toBe(0);
    expect(barPercent(5, -1)).toBe(0);
  });

  it('draws no bar for a value that is not a finite number', () => {
    expect(barPercent(Number.NaN, 10)).toBe(0);
    expect(barPercent(Number.POSITIVE_INFINITY, 10)).toBe(0);
  });

  it('fills every bar of a list of equal values', () => {
    const values = [7, 7, 7];
    const max = largestValue(values);
    expect(values.map((v) => barPercent(v, max))).toEqual([100, 100, 100]);
  });
});
