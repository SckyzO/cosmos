import { describe, expect, it } from 'vitest';
import {
  addDays,
  createCalendarFormats,
  isoDate,
  isoWeekday,
  sameDay,
  startOfDay,
  startOfMonth,
  weekDays,
  weekStart,
} from './calendar-dates';

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

describe('addDays', () => {
  it('moves by whole days, across a month and a year end', () => {
    expect(addDays(new Date(2026, 4, 7), 3)).toEqual(new Date(2026, 4, 10));
    expect(addDays(new Date(2026, 4, 30), 3)).toEqual(new Date(2026, 5, 2));
    expect(addDays(new Date(2025, 11, 30), 3)).toEqual(new Date(2026, 0, 2));
    expect(addDays(new Date(2026, 0, 2), -3)).toEqual(new Date(2025, 11, 30));
  });

  it('returns midnight, whatever the time it was given', () => {
    expect(addDays(new Date(2026, 4, 7, 15, 40), 1)).toEqual(new Date(2026, 4, 8));
    expect(addDays(new Date(2026, 4, 7, 15, 40), 0)).toEqual(new Date(2026, 4, 7));
  });

  it('counts days, not 24 hours, on a day the clocks change', () => {
    // 8 March 2026 has 23 hours in New York, 29 March 2026 in Paris, 5 April 2026 in Auckland:
    // in whichever zone this runs, a day later is the next date at 00:00, never 23:00 or 01:00.
    for (const [month, date] of [
      [2, 7],
      [2, 28],
      [3, 4],
      [9, 24],
      [9, 31],
    ]) {
      const next = addDays(new Date(2026, month, date), 1);
      expect([next.getHours(), next.getMinutes()]).toEqual([0, 0]);
      expect(next.getDate()).toBe(new Date(2026, month, date + 1).getDate());
    }
  });
});

describe('startOfDay and startOfMonth', () => {
  it('cut a date back to its midnight and to the 1st', () => {
    expect(startOfDay(new Date(2026, 4, 7, 23, 59, 59, 999))).toEqual(new Date(2026, 4, 7));
    expect(startOfMonth(new Date(2026, 4, 31, 12))).toEqual(new Date(2026, 4, 1));
  });
});

describe('weekStart and weekDays', () => {
  it('start the week on the Monday on or before the date, at midnight', () => {
    expect(weekStart(new Date(2026, 4, 7, 15, 30))).toEqual(new Date(2026, 4, 4));
    expect(weekStart(new Date(2026, 4, 4))).toEqual(new Date(2026, 4, 4));
  });

  it('put a Sunday at the end of its week, not at the start of the next', () => {
    expect(weekStart(new Date(2026, 4, 10))).toEqual(new Date(2026, 4, 4));
    expect(weekStart(new Date(2026, 4, 11))).toEqual(new Date(2026, 4, 11));
  });

  it('cross a month and a year end', () => {
    expect(weekStart(new Date(2026, 0, 1))).toEqual(new Date(2025, 11, 29));
    expect(weekStart(new Date(2026, 4, 1))).toEqual(new Date(2026, 3, 27));
  });

  it('list seven consecutive days, Monday first', () => {
    const days = weekDays(new Date(2025, 11, 31, 9));
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.getDay())).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(days[0]).toEqual(new Date(2025, 11, 29));
    expect(days[6]).toEqual(new Date(2026, 0, 4));
    expect(days.every((d) => d.getHours() === 0 && d.getMinutes() === 0)).toBe(true);
  });

  it('stay a week of seven dates when the clocks change in it', () => {
    // 8 March 2026 (New York), 29 March (Paris), 5 April (Auckland), 25 October (Paris).
    for (const sunday of [new Date(2026, 2, 8), new Date(2026, 2, 29), new Date(2026, 3, 5)]) {
      const days = weekDays(sunday);
      expect(days[6]).toEqual(sunday);
      expect(days.map((d) => d.getDate())).toEqual(
        Array.from({ length: 7 }, (_, i) =>
          new Date(2026, sunday.getMonth(), sunday.getDate() - 6 + i).getDate()
        )
      );
    }
  });
});

describe('createCalendarFormats', () => {
  const thursday = new Date(2026, 4, 7);

  it('formats in en-US', () => {
    const fmt = createCalendarFormats('en-US');
    expect(fmt.weekdays).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(fmt.weekdaysNarrow).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
    expect(fmt.monthYear(thursday)).toBe('May 2026');
    expect(fmt.fullDate(thursday)).toBe('Thursday, May 7, 2026');
    expect(fmt.dayNumber(thursday)).toBe('7');
  });

  it('formats in fr-FR', () => {
    const fmt = createCalendarFormats('fr-FR');
    // The abbreviations carry a trailing dot in CLDR: `lun.`.
    expect(fmt.weekdays.map((name) => name.replace(/\.$/, ''))).toEqual([
      'lun',
      'mar',
      'mer',
      'jeu',
      'ven',
      'sam',
      'dim',
    ]);
    expect(fmt.monthYear(thursday)).toBe('mai 2026');
    expect(fmt.fullDate(thursday)).toBe('jeudi 7 mai 2026');
    expect(fmt.dayNumber(thursday)).toBe('7');
  });

  it('starts the weekdays on Monday whatever the locale', () => {
    // 2024-01-01 is a Monday; en-US puts Sunday first in its own calendars.
    expect(createCalendarFormats('en-US').weekdays[0]).toBe('Mon');
    expect(createCalendarFormats('fr-FR').weekdays[0]).toMatch(/^lun/);
    expect(createCalendarFormats('de-DE').weekdays[6]).toMatch(/^So/);
  });

  it('is local time: the last minute of a day stays that day', () => {
    const fmt = createCalendarFormats('en-US');
    expect(fmt.fullDate(new Date(2026, 4, 7, 23, 59, 59))).toBe('Thursday, May 7, 2026');
    expect(fmt.fullDate(new Date(2026, 4, 8, 0, 0, 0))).toBe('Friday, May 8, 2026');
  });

  it('follows the runtime default locale when none is given', () => {
    const runtime = new Intl.DateTimeFormat().resolvedOptions().locale;
    const fmt = createCalendarFormats();
    const same = createCalendarFormats(runtime);
    expect(fmt.weekdays).toEqual(same.weekdays);
    expect(fmt.monthYear(thursday)).toBe(same.monthYear(thursday));
    expect(fmt.fullDate(thursday)).toBe(same.fullDate(thursday));
    expect(fmt.dayNumber(thursday)).toBe(same.dayNumber(thursday));
  });

  it('keeps the Gregorian calendar of the grid in locales that default to another', () => {
    // th-TH counts years from the Buddhist era (2569), fa-IR uses the Persian calendar.
    expect(createCalendarFormats('th-TH').monthYear(thursday)).toContain('2026');
    expect(createCalendarFormats('th-TH').monthYear(thursday)).not.toContain('2569');
    const persian = createCalendarFormats('fa-IR');
    expect(persian.fullDate(thursday)).toContain('۲۰۲۶');
    expect(persian.fullDate(thursday)).not.toContain('۱۴۰۵');
    expect(persian.dayNumber(thursday)).toBe('۷');
  });

  it('ignores a calendar asked for in the locale tag', () => {
    expect(createCalendarFormats('en-u-ca-buddhist').monthYear(thursday)).toBe('May 2026');
    expect(createCalendarFormats('en-u-ca-persian').fullDate(thursday)).toBe(
      'Thursday, May 7, 2026'
    );
  });

  describe('time', () => {
    // Newer ICU writes a narrow no-break space before AM and PM.
    const plain = (text: string) => text.replace(/\u202f/g, ' ');

    it('is the hour and the minutes in the locale', () => {
      const en = createCalendarFormats('en-US');
      expect(plain(en.time(new Date(2026, 4, 7, 9, 30)))).toBe('9:30 AM');
      expect(plain(en.time(new Date(2026, 4, 7, 14, 5)))).toBe('2:05 PM');
      expect(plain(en.time(new Date(2026, 4, 7, 0, 0)))).toBe('12:00 AM');
      expect(createCalendarFormats('fr-FR').time(new Date(2026, 4, 7, 14, 5))).toBe('14:05');
      expect(createCalendarFormats('de-DE').time(new Date(2026, 4, 7, 9, 30))).toBe('9:30');
    });

    it('is local time', () => {
      expect(plain(createCalendarFormats('en-US').time(new Date(2026, 4, 7, 23, 59, 59)))).toBe(
        '11:59 PM'
      );
    });
  });

  describe('timeRange, hour and dateRange', () => {
    // ICU writes thin and narrow no-break spaces around the dash and before AM and PM.
    const plain = (text: string) => text.replace(/[\u202f\u2009\u00a0]/g, ' ');
    const at = (h: number, m = 0, d = 7) => new Date(2026, 4, d, h, m);

    it('writes the time of an event from its start to its end', () => {
      const en = createCalendarFormats('en-US');
      expect(plain(en.timeRange(at(9, 30), at(11)))).toBe('9:30 – 11:00 AM');
      expect(plain(en.timeRange(at(11), at(14, 30)))).toBe('11:00 AM – 2:30 PM');
      expect(createCalendarFormats('fr-FR').timeRange(at(9, 30), at(11))).toMatch(
        /^09:30\s*[–-]\s*11:00$/
      );
    });

    it('writes the time of an event over midnight, hours only', () => {
      const en = createCalendarFormats('en-US');
      expect(plain(en.timeRange(at(22), at(1, 30, 8)))).toBe('10:00 PM – 1:30 AM');
    });

    it('names an hour for the side of the grid', () => {
      const en = createCalendarFormats('en-US');
      expect(plain(en.hour(9))).toBe('9 AM');
      expect(plain(en.hour(12))).toBe('12 PM');
      expect(plain(en.hour(15))).toBe('3 PM');
      expect(createCalendarFormats('fr-FR').hour(15)).toMatch(/^15/);
    });

    it('folds the repeated parts of a range of dates', () => {
      const en = createCalendarFormats('en-US');
      expect(plain(en.dateRange(new Date(2026, 4, 4), new Date(2026, 4, 10)))).toBe(
        'May 4 – 10, 2026'
      );
      expect(plain(en.dateRange(new Date(2026, 3, 27), new Date(2026, 4, 3)))).toBe(
        'Apr 27 – May 3, 2026'
      );
      expect(plain(en.dateRange(new Date(2025, 11, 29), new Date(2026, 0, 4)))).toBe(
        'Dec 29, 2025 – Jan 4, 2026'
      );
    });

    it('is one date when the two are the same day, and keeps the Gregorian calendar', () => {
      const en = createCalendarFormats('en-US');
      expect(en.dateRange(new Date(2026, 4, 4), new Date(2026, 4, 4))).toBe('May 4, 2026');
      expect(
        createCalendarFormats('th-TH').dateRange(new Date(2026, 4, 4), new Date(2026, 4, 10))
      ).not.toContain('2569');
    });

    it('names the dates in the locale', () => {
      expect(
        createCalendarFormats('fr-FR').dateRange(new Date(2026, 4, 4), new Date(2026, 4, 10))
      ).toMatch(/4.*10 mai 2026/);
    });
  });

  describe('dayNumber', () => {
    it('is the bare number, unpadded', () => {
      const fmt = createCalendarFormats('en-US');
      expect(fmt.dayNumber(new Date(2026, 4, 1))).toBe('1');
      expect(fmt.dayNumber(new Date(2026, 4, 31))).toBe('31');
    });

    it('drops the day suffix some locales add', () => {
      // `Intl` formats a lone day as `7日` in Japanese.
      expect(new Intl.DateTimeFormat('ja-JP', { day: 'numeric' }).format(thursday)).toBe('7日');
      expect(createCalendarFormats('ja-JP').dayNumber(thursday)).toBe('7');
    });

    it('uses the digits of the locale', () => {
      expect(createCalendarFormats('ar-EG').dayNumber(thursday)).toBe('٧');
      expect(createCalendarFormats('en-u-nu-arab').dayNumber(new Date(2026, 4, 12))).toBe('١٢');
    });
  });

  it('throws a RangeError on an invalid tag', () => {
    expect(() => createCalendarFormats('not a locale')).toThrow(RangeError);
  });
});
