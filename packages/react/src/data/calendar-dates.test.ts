import { describe, expect, it } from 'vitest';
import { isoDate, isoWeekday, MONTHS, sameDay } from './calendar-dates';

// Every date here is built from local components, like the helpers read them,
// so the tests do not depend on the machine's time zone.

describe('isoDate', () => {
  it('formats YYYY-MM-DD with zero padding', () => {
    expect(isoDate(new Date(2024, 0, 5))).toBe('2024-01-05');
    expect(isoDate(new Date(2024, 11, 31))).toBe('2024-12-31');
  });

  it('is local time: the last minute of a day stays that day', () => {
    expect(isoDate(new Date(2024, 5, 9, 23, 59, 59))).toBe('2024-06-09');
    expect(isoDate(new Date(2024, 5, 10, 0, 0, 0))).toBe('2024-06-10');
  });
});

describe('sameDay', () => {
  it('ignores the time of day', () => {
    expect(sameDay(new Date(2024, 2, 8, 0, 0), new Date(2024, 2, 8, 23, 59))).toBe(true);
  });

  it('tells apart days, months and years', () => {
    const day = new Date(2024, 2, 8);
    expect(sameDay(day, new Date(2024, 2, 9))).toBe(false);
    expect(sameDay(day, new Date(2024, 3, 8))).toBe(false);
    expect(sameDay(day, new Date(2025, 2, 8))).toBe(false);
  });
});

describe('isoWeekday', () => {
  it('counts from Monday = 0 to Sunday = 6', () => {
    // 2024-01-01 is a Monday.
    const week = Array.from({ length: 7 }, (_, i) => isoWeekday(new Date(2024, 0, 1 + i)));
    expect(week).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('puts Sunday last, not first', () => {
    expect(new Date(2024, 0, 7).getDay()).toBe(0);
    expect(isoWeekday(new Date(2024, 0, 7))).toBe(6);
  });
});

describe('MONTHS', () => {
  it('lists the twelve months, January first', () => {
    expect(MONTHS).toHaveLength(12);
    expect(MONTHS[0]).toBe('January');
    expect(MONTHS[11]).toBe('December');
  });

  it('is indexed like Date#getMonth', () => {
    expect(MONTHS[new Date(2024, 8, 15).getMonth()]).toBe('September');
  });
});
