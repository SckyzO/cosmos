import { describe, expect, it } from 'vitest';
import { absolute, mirrorSeries, symmetricDomain } from './mirror';

describe('mirrorSeries', () => {
  it('turns the first series to the negative side and keeps the others on the positive one', () => {
    expect(
      mirrorSeries([
        { name: 'Men', data: [4, 6] },
        { name: 'Women', data: [5, 7] },
      ])
    ).toEqual([
      { name: 'Men', data: [-4, -6] },
      { name: 'Women', data: [5, 7] },
    ]);
  });

  it('reads the values as magnitudes: a sign they arrive with is dropped', () => {
    expect(
      mirrorSeries([
        { name: 'a', data: [-4, 6] },
        { name: 'b', data: [-5, 7] },
      ])
    ).toEqual([
      { name: 'a', data: [-4, -6] },
      { name: 'b', data: [5, 7] },
    ]);
  });

  it('leaves a missing point missing, and does not change what it is given', () => {
    const given = [{ name: 'a', data: [3, undefined as unknown as number] }];
    const [mirrored] = mirrorSeries(given);
    expect(mirrored.data[0]).toBe(-3);
    expect(mirrored.data[1]).toBeUndefined();
    expect(given[0].data[0]).toBe(3);
  });
});

describe('absolute', () => {
  it('formats the magnitude of a value, so no minus sign shows', () => {
    const format = absolute((value) => `${value} k`);
    expect(format(-12)).toBe('12 k');
    expect(format(12)).toBe('12 k');
    expect(format(-0)).toBe('0 k');
  });

  it('writes a plain number without a formatter', () => {
    expect(absolute()(-1500)).toBe('1500');
  });
});

describe('symmetricDomain', () => {
  it('is as far on each side of zero, so the central axis is in the middle', () => {
    const [low, high] = symmetricDomain([-5, 8]);
    expect(low).toBe(-high);
    expect(symmetricDomain([-9, 3])).toEqual(symmetricDomain([-3, 9]));
  });

  it('stops at a round number, so five ticks fall on zero and on round values', () => {
    expect(symmetricDomain([-17, 11])).toEqual([-20, 20]);
    expect(symmetricDomain([-4, 4.5])).toEqual([-5, 5]);
    expect(symmetricDomain([-6, 13])).toEqual([-20, 20]);
    expect(symmetricDomain([-120, 90])).toEqual([-200, 200]);
    expect(symmetricDomain([-0.012, 0.03])).toEqual([-0.04, 0.04]);
  });

  it('keeps a value that already is round', () => {
    expect(symmetricDomain([-20, 15])).toEqual([-20, 20]);
    expect(symmetricDomain([-10, 10])).toEqual([-10, 10]);
    expect(symmetricDomain([-5, 2])).toEqual([-5, 5]);
  });

  it('gives a range with no data a width, not a point', () => {
    expect(symmetricDomain([0, 0])).toEqual([-1, 1]);
  });
});
