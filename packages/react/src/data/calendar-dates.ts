// Date helpers shared by MiniCalendar and EventCalendar: local time, ISO weeks
// (Monday first), and the formatting of every date text they show. Internal:
// not re-exported from the package.

/** `YYYY-MM-DD` in local time. */
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** Days since the Monday of `d`'s week: JS 0=Sun..6=Sat → ISO 0=Mon..6=Sun. */
export const isoWeekday = (d: Date) => (d.getDay() + 6) % 7;

/** `d` moved by `n` days (negative goes back), at 00:00. A day count, not 24 hours a day. */
export const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** 00:00 of `d`'s day. */
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** The 1st of `d`'s month, at 00:00. */
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

/** The Monday on or before `d`, at 00:00. Weeks run Monday to Sunday, whatever the locale. */
export const weekStart = (d: Date) => addDays(d, -isoWeekday(d));

/** The seven days of `d`'s week, Monday first, at 00:00. */
export const weekDays = (d: Date) => {
  const monday = weekStart(d);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
};

export type CalendarFormats = {
  /** Short weekday names, Monday first: `Mon`..`Sun` in en-US. */
  weekdays: string[];
  /**
   * One-letter weekday names, Monday first (`M`..`S` in en-US), for a grid too narrow for
   * `weekdays`. Ambiguous alone: pair them with `weekdays`.
   */
  weekdaysNarrow: string[];
  /** Month and year: `May 2026`. */
  monthYear: (d: Date) => string;
  /** Weekday, day, month and year: `Thursday, May 7, 2026`. A day's accessible name. */
  fullDate: (d: Date) => string;
  /** The day of the month alone, in the locale's digits: `7`, never `7日`. */
  dayNumber: (d: Date) => string;
  /** The time of day, hours and minutes: `9:30 AM` in en-US, `09:30` in fr-FR. */
  time: (d: Date) => string;
  /** The time of day from `a` to `b`, without dates, even over midnight: `9:30 – 11:00 AM`. */
  timeRange: (a: Date, b: Date) => string;
  /** An hour on the hour, for the side of an hour grid: `9 AM` in en-US. */
  hour: (hour: number) => string;
  /** The dates from `a` to `b`, short, with the repeated parts folded: `May 4 – 10, 2026`. */
  dateRange: (a: Date, b: Date) => string;
};

/**
 * Every date text of the calendars, in `locale` (a BCP 47 tag; the runtime's
 * default when omitted). One `Intl.DateTimeFormat` per text, built once: memoize
 * the result per locale. An invalid tag throws a `RangeError`.
 *
 * The grids are Gregorian, built from `Date` components, so every formatter pins
 * `calendar: 'gregory'`. Without it `ar-SA` or `fa-IR` would label a Gregorian grid
 * with Islamic or Persian dates, and the option also wins over a `-u-ca-` tag.
 */
export const createCalendarFormats = (locale?: string): CalendarFormats => {
  const formatter = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, calendar: 'gregory' });
  const weekday = formatter({ weekday: 'short' });
  const weekdayNarrow = formatter({ weekday: 'narrow' });
  const monthYear = formatter({ month: 'long', year: 'numeric' });
  const fullDate = formatter({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dayNumber = formatter({ day: 'numeric' });
  const time = formatter({ hour: 'numeric', minute: '2-digit' });
  const hour = formatter({ hour: 'numeric' });
  const dateRange = formatter({ month: 'short', day: 'numeric', year: 'numeric' });
  return {
    // 2024-01-01 is a Monday.
    weekdays: Array.from({ length: 7 }, (_, i) => weekday.format(new Date(2024, 0, 1 + i))),
    weekdaysNarrow: Array.from({ length: 7 }, (_, i) =>
      weekdayNarrow.format(new Date(2024, 0, 1 + i))
    ),
    monthYear: monthYear.format,
    fullDate: fullDate.format,
    // Some locales write the day with a suffix (`7日`): keep the number alone.
    dayNumber: (d) =>
      dayNumber
        .formatToParts(d)
        .filter((part) => part.type === 'day')
        .map((part) => part.value)
        .join(''),
    time: time.format,
    // `formatRange` writes the dates as well when the two are on different days.
    timeRange: (a, b) =>
      sameDay(a, b) ? time.formatRange(a, b) : `${time.format(a)} – ${time.format(b)}`,
    hour: (h) => hour.format(new Date(2024, 0, 1, h)),
    dateRange: (a, b) => dateRange.formatRange(a, b),
  };
};
