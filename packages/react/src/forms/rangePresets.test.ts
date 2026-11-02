import { describe, expect, it } from 'vitest';
import { outsideBounds, resolvePreset, sameRange } from './rangePresets';

// A fixed "today": a Thursday, mid-month, so a preset that counts back crosses nothing odd.
const TODAY = new Date(2026, 0, 15, 14, 30);
const day = (month: number, date: number, hours = 0) => new Date(2026, month - 1, date, hours);

describe('resolvePreset', () => {
  it('returns a fixed range as it is', () => {
    const range = { from: day(1, 1), to: day(1, 31) };
    expect(resolvePreset(range, TODAY)).toBe(range);
  });

  it('calls a function with today and returns its range', () => {
    const lastSevenDays = (today: Date) => ({
      from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6),
      to: today,
    });
    expect(resolvePreset(lastSevenDays, TODAY)).toEqual({ from: day(1, 9), to: TODAY });
  });

  it('gives the same function another range on another day', () => {
    const sinceMonday = (today: Date) => ({
      from: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - ((today.getDay() + 6) % 7)
      ),
      to: today,
    });
    expect(resolvePreset(sinceMonday, TODAY).from).toEqual(day(1, 12));
    expect(resolvePreset(sinceMonday, new Date(2026, 0, 18)).from).toEqual(day(1, 12));
    expect(resolvePreset(sinceMonday, new Date(2026, 0, 19)).from).toEqual(day(1, 19));
  });
});

describe('sameRange', () => {
  it('is true for the same days, whatever the time of day', () => {
    expect(
      sameRange({ from: day(1, 9, 8), to: day(1, 15, 23) }, { from: day(1, 9), to: day(1, 15) })
    ).toBe(true);
  });

  it('is false when either end is another day', () => {
    const base = { from: day(1, 9), to: day(1, 15) };
    expect(sameRange(base, { from: day(1, 10), to: day(1, 15) })).toBe(false);
    expect(sameRange(base, { from: day(1, 9), to: day(1, 16) })).toBe(false);
  });

  it('is false while an end is missing, even against itself', () => {
    const open = { from: day(1, 9), to: undefined };
    expect(sameRange(open, open)).toBe(false);
    expect(sameRange({ from: undefined, to: undefined }, { from: undefined, to: undefined })).toBe(
      false
    );
    expect(sameRange(open, { from: day(1, 9), to: day(1, 15) })).toBe(false);
  });
});

describe('outsideBounds', () => {
  const range = { from: day(1, 9), to: day(1, 15) };

  it('is false with no bounds', () => {
    expect(outsideBounds(range)).toBe(false);
  });

  it('keeps both bounds inclusive, by day', () => {
    expect(outsideBounds(range, day(1, 9, 18), day(1, 15, 3))).toBe(false);
  });

  it('is true when the range starts before the earliest date', () => {
    expect(outsideBounds(range, day(1, 10))).toBe(true);
  });

  it('is true when the range ends after the latest date', () => {
    expect(outsideBounds(range, undefined, day(1, 14))).toBe(true);
  });

  it('checks only the ends that are set', () => {
    expect(outsideBounds({ from: day(1, 9), to: undefined }, undefined, day(1, 8))).toBe(true);
    expect(outsideBounds({ from: undefined, to: day(1, 15) }, day(1, 10))).toBe(false);
  });
});
