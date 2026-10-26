import { describe, expect, it } from 'vitest';
import {
  cellMetrics,
  collectDays,
  formatDay,
  monthMarks,
  parseDay,
  partsOf,
  rowOf,
  stepOf,
  weekGrid,
  weekdayOf,
  yearSpans,
} from './calendarGrid';

const day = (iso: string) => parseDay(iso) as number;

describe('parseDay / formatDay', () => {
  it('round-trips an ISO date', () => {
    expect(formatDay(day('2026-03-14'))).toBe('2026-03-14');
    expect(formatDay(day('2024-02-29'))).toBe('2024-02-29');
  });
  it('numbers the days from 1970-01-01', () => {
    expect(day('1970-01-01')).toBe(0);
    expect(day('1970-01-02')).toBe(1);
    expect(day('1969-12-31')).toBe(-1);
  });
  it('refuses what is not a real date', () => {
    for (const bad of [
      '2026-02-30',
      '2025-02-29',
      '2026-13-01',
      '2026-3-4',
      '2026-03-14T10:00',
      '',
      'x',
    ])
      expect(parseDay(bad), bad).toBeUndefined();
  });
});

describe('weekdays', () => {
  it('knows the weekday of a date', () => {
    expect(weekdayOf(day('1970-01-01'))).toBe(4);
    expect(weekdayOf(day('2026-01-01'))).toBe(4); // Thursday
    expect(weekdayOf(day('2026-01-04'))).toBe(0); // Sunday
    expect(weekdayOf(day('1969-12-28'))).toBe(0);
  });
  it('puts the first day of the week in row 0', () => {
    expect(rowOf(day('2026-01-05'), 1)).toBe(0); // Monday
    expect(rowOf(day('2026-01-04'), 1)).toBe(6); // Sunday last
    expect(rowOf(day('2026-01-04'), 0)).toBe(0); // Sunday first
    expect(rowOf(day('2026-01-05'), 0)).toBe(1);
  });
});

describe('weekGrid', () => {
  it('is empty when the range is reversed', () => {
    expect(weekGrid(day('2026-02-01'), day('2026-01-01'), 1)).toMatchObject({ weeks: 0, days: [] });
  });
  it('starts the first column on the week start before `from`', () => {
    const grid = weekGrid(day('2026-01-01'), day('2026-12-31'), 1);
    expect(formatDay(grid.start)).toBe('2025-12-29');
    expect(grid.weeks).toBe(53);
    expect(grid.days).toHaveLength(365);
    expect(grid.days[0]).toMatchObject({ row: 3, column: 0 }); // Thursday
    expect(grid.days.at(-1)).toMatchObject({ row: 3, column: 52 });
  });
  it('shifts the rows and the columns with a Sunday start', () => {
    const grid = weekGrid(day('2026-01-01'), day('2026-12-31'), 0);
    expect(formatDay(grid.start)).toBe('2025-12-28');
    expect(grid.days[0]).toMatchObject({ row: 4, column: 0 });
    expect(grid.weeks).toBe(53);
  });
  it('wraps exactly one week into one column', () => {
    const grid = weekGrid(day('2026-01-05'), day('2026-01-11'), 1);
    expect(grid.weeks).toBe(1);
    expect(grid.days.map((d) => d.row)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
  it('opens a new column on the week start', () => {
    const grid = weekGrid(day('2026-01-05'), day('2026-01-12'), 1);
    expect(grid.weeks).toBe(2);
    expect(grid.days.at(-1)).toMatchObject({ row: 0, column: 1 });
  });
  it('holds a single day', () => {
    const grid = weekGrid(day('2026-06-10'), day('2026-06-10'), 1);
    expect(grid).toMatchObject({ weeks: 1 });
    expect(grid.days).toHaveLength(1);
  });
  it('is the same on a leap year', () => {
    const grid = weekGrid(day('2024-01-01'), day('2024-12-31'), 1);
    expect(grid.days).toHaveLength(366);
    expect(grid.weeks).toBe(53);
  });
});

describe('yearSpans', () => {
  it('cuts a range at the turn of each year', () => {
    expect(
      yearSpans(day('2025-11-15'), day('2027-02-10')).map((s) => [
        s.year,
        formatDay(s.from),
        formatDay(s.to),
      ])
    ).toEqual([
      [2025, '2025-11-15', '2025-12-31'],
      [2026, '2026-01-01', '2026-12-31'],
      [2027, '2027-01-01', '2027-02-10'],
    ]);
  });
  it('is empty when the range is reversed', () => {
    expect(yearSpans(10, 5)).toEqual([]);
  });
});

describe('monthMarks', () => {
  const names = (from: string, to: string, weekStart: 0 | 1 = 1) => {
    const grid = weekGrid(day(from), day(to), weekStart);
    return monthMarks(grid).map((m) => `${m.month + 1}@${m.column}`);
  };
  it('names a year once per month above its first full week', () => {
    // 2026 starts on a Thursday: the first Monday of January is the 5th, column 1.
    expect(names('2026-01-01', '2026-12-31')).toEqual([
      '1@1',
      '2@5',
      '3@9',
      '4@14',
      '5@18',
      '6@22',
      '7@27',
      '8@31',
      '9@36',
      '10@40',
      '11@44',
      '12@49',
    ]);
  });
  it('follows the week start', () => {
    // First Sundays of 2026: Jan 4, Feb 1, Mar 1.
    expect(names('2026-01-01', '2026-03-31', 0).slice(0, 3)).toEqual(['1@1', '2@5', '3@9']);
  });
  it('names the month a range starts in when there is room', () => {
    // Mon 2026-06-08: the first mark by the rule is July (Mon 07-06, column 4).
    expect(names('2026-06-08', '2026-10-25')).toEqual(['6@0', '7@4', '8@8', '9@13', '10@17']);
  });
  it('drops that name when the next month is too close', () => {
    // Mon 2026-06-22: July starts the week of 06-29... first Monday of July is the 6th, column 2.
    expect(names('2026-06-22', '2026-08-30')).toEqual(['7@2', '8@6']);
  });
  it('does not name the first month twice', () => {
    // Thu 2026-01-01: the leading name and the rule both say January.
    expect(names('2026-01-01', '2026-02-28')).toEqual(['1@1', '2@5']);
  });
  it('names the only month of a short range', () => {
    expect(names('2026-06-10', '2026-06-20')).toEqual(['6@0']);
  });
  it('is empty without weeks', () => {
    expect(monthMarks(weekGrid(10, 5, 1))).toEqual([]);
  });
  it('is read in UTC', () => {
    expect(partsOf(day('2026-03-01'))).toEqual({ year: 2026, month: 2, date: 1 });
  });
});

describe('stepOf', () => {
  it('keeps zero, negatives and junk on the empty step', () => {
    for (const v of [0, -3, NaN, Infinity * 0]) expect(stepOf(v, 10)).toBe(0);
    expect(stepOf(5, 0)).toBe(0);
  });
  it('splits (0, max] in four', () => {
    expect([0.1, 2.5, 2.6, 5, 5.1, 7.5, 7.6, 10].map((v) => stepOf(v, 10))).toEqual([
      1, 1, 2, 2, 3, 3, 4, 4,
    ]);
  });
  it('caps a value above the maximum', () => {
    expect(stepOf(50, 10)).toBe(4);
  });
});

describe('cellMetrics', () => {
  it('gives a short range larger cells', () => {
    expect(cellMetrics(20)).toEqual({ size: 18, gap: 4, radius: 4 });
    expect(cellMetrics(26).size).toBe(18);
    expect(cellMetrics(27).size).toBe(12);
    expect(cellMetrics(53)).toEqual({ size: 12, gap: 3, radius: 3 });
  });
});

describe('collectDays', () => {
  it('is undefined with no valid day', () => {
    expect(collectDays([])).toBeUndefined();
    expect(
      collectDays([
        { day: 'nope', value: 1 },
        { day: '2026-01-01', value: NaN },
      ])
    ).toBeUndefined();
  });
  it('sums a day listed twice and finds the span', () => {
    const days = collectDays([
      { day: '2026-03-02', value: 2 },
      { day: '2026-01-10', value: 1 },
      { day: '2026-03-02', value: 3 },
      { day: 'bad', value: 9 },
    ]);
    expect(days?.values.get(day('2026-03-02'))).toBe(5);
    expect(days?.values.size).toBe(2);
    expect(formatDay(days?.first as number)).toBe('2026-01-10');
    expect(formatDay(days?.last as number)).toBe('2026-03-02');
  });
});
