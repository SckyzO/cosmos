// The logic of EventCalendar that needs no DOM: which events are all-day, which days an event
// covers, in what order a day lists them. Internal: not re-exported from the package.
//
// A moment here is a wall-clock time: every helper reads a `Date` through its local components
// (`getHours`, `getDate`…) and builds days with `new Date(y, m, d)`, never by adding 24 hours of
// milliseconds. It is the same reading `calendar-dates.ts` makes, and it does not depend on the
// machine's time zone: a day on which the clocks change still starts at 00:00 and has one date.

import { addDays, startOfDay } from './calendar-dates';

/** What the calendar reads of an event. The helpers take no more, so they need no component type. */
export type EventSpan = {
  start: Date;
  end?: Date;
  allDay?: boolean;
};

const atMidnight = (d: Date) =>
  d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;

/**
 * Whether the event goes in the all-day row: `allDay` when it is set, else true when `start` is at
 * 00:00 and `end` is missing or at 00:00 (a date with no time on it).
 */
export const isAllDay = (event: EventSpan) =>
  event.allDay ?? (atMidnight(event.start) && (event.end === undefined || atMidnight(event.end)));

/** `end` when it is after `start`, else `undefined`: an end that does not follow is no end. */
const endAfterStart = (event: EventSpan) =>
  event.end && event.end.getTime() > event.start.getTime() ? event.end : undefined;

/**
 * The last day, at 00:00, that the event covers. An all-day event includes the day of its `end`.
 * A timed one ends at its `end`: on the day before when that is exactly midnight, since nothing of
 * the event is left on the day that starts then.
 */
export const lastDay = (event: EventSpan) => {
  const end = endAfterStart(event);
  if (!end) return startOfDay(event.start);
  if (!isAllDay(event) && atMidnight(end)) return addDays(startOfDay(end), -1);
  return startOfDay(end);
};

const duration = (event: EventSpan) => {
  const end = endAfterStart(event);
  return end ? end.getTime() - event.start.getTime() : 0;
};

/**
 * Sort order of a day's events: all-day first, by first day and the longer run first; then timed
 * ones by start, the longer first when two start together. `Array.prototype.sort` is stable, so
 * equal events keep the order they were given in.
 */
export const compareEvents = (a: EventSpan, b: EventSpan) => {
  const aAll = isAllDay(a);
  const bAll = isAllDay(b);
  if (aAll !== bAll) return aAll ? -1 : 1;
  if (aAll) {
    const byDay = startOfDay(a.start).getTime() - startOfDay(b.start).getTime();
    return byDay || lastDay(b).getTime() - lastDay(a).getTime();
  }
  return a.start.getTime() - b.start.getTime() || duration(b) - duration(a);
};
