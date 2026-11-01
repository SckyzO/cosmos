import type { DateRange } from './DatePicker';

/** The range of a preset: a fixed one as it is, or the one a function makes of `today`. */
export const resolvePreset = (
  range: DateRange | ((today: Date) => DateRange),
  today: Date
): DateRange => (typeof range === 'function' ? range(today) : range);

// A date as its calendar day, so days compare whatever the time of day they carry.
const dayOf = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** Whether both ranges are complete and cover the same days. */
export const sameRange = (a: DateRange, b: DateRange): boolean =>
  a.from !== undefined &&
  a.to !== undefined &&
  b.from !== undefined &&
  b.to !== undefined &&
  dayOf(a.from) === dayOf(b.from) &&
  dayOf(a.to) === dayOf(b.to);

/** Whether an end of `range` falls before `fromDate` or after `toDate` (both inclusive, by day). */
export const outsideBounds = (range: DateRange, fromDate?: Date, toDate?: Date): boolean =>
  [range.from, range.to].some(
    (end) =>
      end !== undefined &&
      ((fromDate !== undefined && dayOf(end) < dayOf(fromDate)) ||
        (toDate !== undefined && dayOf(end) > dayOf(toDate)))
  );
