import { describe, expect, it } from 'vitest';
import { fitSegments, ringGeometry, toPercent } from './progress';

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

describe('ringGeometry', () => {
  it('centres the stroke inside the box', () => {
    const { radius, circumference } = ringGeometry(56, 6, 50);
    expect(radius).toBe(25);
    expect(circumference).toBeCloseTo(2 * Math.PI * 25);
  });

  it('hides the part of the dash past the percentage', () => {
    const { circumference, dashOffset, dashArray } = ringGeometry(56, 6, 25);
    expect(dashOffset).toBeCloseTo(circumference * 0.75);
    expect(dashArray).toBe(`${circumference} ${circumference}`);
  });

  it('shows nothing at 0 and everything at 100', () => {
    const empty = ringGeometry(56, 6, 0);
    expect(empty.dashOffset).toBeCloseTo(empty.circumference);
    expect(ringGeometry(56, 6, 100).dashOffset).toBe(0);
  });

  it('holds the percentage between 0 and 100', () => {
    expect(ringGeometry(56, 6, 140).dashOffset).toBe(0);
    const low = ringGeometry(56, 6, -20);
    expect(low.dashOffset).toBeCloseTo(low.circumference);
  });

  it('never returns a negative radius', () => {
    expect(ringGeometry(4, 10, 50).radius).toBe(0);
  });
});
