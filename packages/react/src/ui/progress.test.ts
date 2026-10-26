import { describe, expect, it } from 'vitest';
import { fitSegments, toPercent } from './progress';

describe('toPercent', () => {
  it('holds the value between 0 and 100', () => {
    expect(toPercent(25, 100)).toBe(25);
    expect(toPercent(250, 100)).toBe(100);
    expect(toPercent(-5, 100)).toBe(0);
  });

  it('is 0 when max is not positive', () => {
    expect(toPercent(10, 0)).toBe(0);
    expect(toPercent(10, -3)).toBe(0);
  });
});

describe('fitSegments', () => {
  it('keeps the values and reports the rest when they fit', () => {
    const fit = fitSegments([40, 25], 100);
    expect(fit.segments).toEqual([
      { index: 0, value: 40 },
      { index: 1, value: 25 },
    ]);
    expect(fit.rest).toBe(35);
    expect(fit.percent).toBe(65);
  });

  it('cuts the segment that crosses max and empties the ones after it', () => {
    const fit = fitSegments([70, 60, 10], 100);
    expect(fit.segments.map((s) => s.value)).toEqual([70, 30, 0]);
    expect(fit.rest).toBe(0);
    expect(fit.percent).toBe(100);
  });

  it('counts a negative or non-finite value for nothing', () => {
    const fit = fitSegments([-10, Number.NaN, 20], 100);
    expect(fit.segments.map((s) => s.value)).toEqual([0, 0, 20]);
    expect(fit.rest).toBe(80);
  });

  it('uses the max it is given, not 100', () => {
    const fit = fitSegments([3, 4], 10);
    expect(fit.rest).toBe(3);
    expect(fit.percent).toBe(70);
  });

  it('puts nothing on a track with no max', () => {
    const fit = fitSegments([5], 0);
    expect(fit.segments).toEqual([{ index: 0, value: 0 }]);
    expect(fit.percent).toBe(0);
  });
});
