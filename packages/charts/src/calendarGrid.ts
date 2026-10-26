// The date maths of `CalendarChart`. A day is a whole number: the days since
// 1970-01-01 in UTC, so nothing here reads the time zone of the machine or the
// date of today.

export const DAY_MS = 86_400_000;

/** The weekday a week starts on: 0 is Sunday, 1 is Monday. */
export type WeekStart = 0 | 1;

const mod = (n: number, by: number) => ((n % by) + by) % by;

/** The day number of an ISO date (`2026-03-14`), or `undefined` when it is not a real date. */
export const parseDay = (iso: string): number | undefined => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return undefined;
  const [year, month, date] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const time = Date.UTC(year, month - 1, date);
  const check = new Date(time);
  // `Date.UTC` rolls 02-30 over to 03-02: a date that moved is not a date.
  return check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === date
    ? time / DAY_MS
    : undefined;
};

/** The day number of a date: `month` is 0 to 11. */
export const dayOf = (year: number, month: number, date: number): number =>
  Date.UTC(year, month, date) / DAY_MS;

/** The ISO date of a day number. */
export const formatDay = (day: number): string => new Date(day * DAY_MS).toISOString().slice(0, 10);

/** The weekday of a day number, 0 (Sunday) to 6. 1970-01-01 was a Thursday. */
export const weekdayOf = (day: number): number => mod(day + 4, 7);

/** The year, month (0 to 11) and day of the month of a day number. */
export const partsOf = (day: number) => {
  const date = new Date(day * DAY_MS);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth(), date: date.getUTCDate() };
};

/** The row of a day in a week that starts on `weekStart`: 0 for the first day of the week. */
export const rowOf = (day: number, weekStart: WeekStart): number =>
  mod(weekdayOf(day) - weekStart, 7);

export type GridDay = { day: number; row: number; column: number };

export type WeekGrid = {
  /** The first day of the first column: on or before `from`. */
  start: number;
  /** The number of columns. 0 when the range is empty. */
  weeks: number;
  /** Every day of the range, in order. The slots before `from` and after `to` have no day. */
  days: GridDay[];
};

/** The days from `from` to `to` (inclusive) laid out as weeks in columns and weekdays in rows. */
export const weekGrid = (from: number, to: number, weekStart: WeekStart): WeekGrid => {
  if (to < from) return { start: from, weeks: 0, days: [] };
  const start = from - rowOf(from, weekStart);
  const days = Array.from({ length: to - from + 1 }, (_, i): GridDay => {
    const day = from + i;
    return { day, row: rowOf(day, weekStart), column: Math.floor((day - start) / 7) };
  });
  return { start, weeks: Math.floor((to - start) / 7) + 1, days };
};

export type YearSpan = { year: number; from: number; to: number };

/** `from` to `to` cut at the turn of each year: one block of the `calendar` layout per span. */
export const yearSpans = (from: number, to: number): YearSpan[] => {
  const spans: YearSpan[] = [];
  if (to < from) return spans;
  for (let year = partsOf(from).year; year <= partsOf(to).year; year++) {
    spans.push({
      year,
      from: Math.max(from, dayOf(year, 0, 1)),
      to: Math.min(to, dayOf(year, 11, 31)),
    });
  }
  return spans;
};

export type MonthMark = { column: number; month: number };

// Room a month name needs, in columns: two months closer than this would
// print over each other.
const MIN_MARK_GAP = 3;

/**
 * Where the month names go: above the first full week of each month, that is
 * the first column whose first day falls in the first seven days of the
 * month. A range that starts in the middle of a month also names that month
 * above its first column, unless the next name is too close to leave room.
 */
export const monthMarks = (grid: WeekGrid): MonthMark[] => {
  if (grid.weeks === 0) return [];
  const marks: MonthMark[] = [];
  for (let column = 0; column < grid.weeks; column++) {
    const { month, date } = partsOf(grid.start + column * 7);
    if (date <= 7) marks.push({ column, month });
  }
  const first = grid.days[0];
  const leading = partsOf(first.day).month;
  const next = marks[0];
  if (!next || (next.month !== leading && next.column >= MIN_MARK_GAP)) {
    marks.unshift({ column: 0, month: leading });
  }
  return marks;
};

/** The 0-based step a value takes on the scale: 0 is empty, 1 to `steps` split `(0, max]` evenly. */
export const stepOf = (value: number, max: number, steps = 4): number =>
  !(value > 0) || !(max > 0) ? 0 : Math.min(steps, Math.max(1, Math.ceil((value / max) * steps)));

/** How big the cells are: a short range gets larger ones, a long one fits more weeks on screen. */
export const cellMetrics = (weeks: number) =>
  weeks <= 26 ? { size: 18, gap: 4, radius: 4 } : { size: 12, gap: 3, radius: 3 };

export type DayValues = {
  /** The summed value of each valid day. */
  values: Map<number, number>;
  first: number;
  last: number;
};

/** The valid days of `data` by day number, a day listed twice summed. `undefined` when none is valid. */
export const collectDays = (
  data: readonly { day: string; value: number }[]
): DayValues | undefined => {
  const values = new Map<number, number>();
  for (const { day, value } of data) {
    const n = parseDay(day);
    if (n === undefined || !Number.isFinite(value)) continue;
    values.set(n, (values.get(n) ?? 0) + value);
  }
  if (values.size === 0) return undefined;
  const days = [...values.keys()];
  return { values, first: Math.min(...days), last: Math.max(...days) };
};
