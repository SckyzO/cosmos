// The logic of EventCalendar that needs no DOM: which events are all-day, which days an event
// covers, in what order a day lists them. Internal: not re-exported from the package.
//
// A moment here is a wall-clock time: every helper reads a `Date` through its local components
// (`getHours`, `getDate`…) and builds days with `new Date(y, m, d)`, never by adding 24 hours of
// milliseconds. It is the same reading `calendar-dates.ts` makes, and it does not depend on the
// machine's time zone: a day on which the clocks change still starts at 00:00 and has one date.

import { addDays, sameDay, startOfDay, startOfMonth, weekStart } from './calendar-dates';

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

// ── The hour grid ───────────────────────────────────────────────────────────

/** Minutes in a day, counted on the wall clock (a day on which the clocks change has no more). */
export const DAY_MINUTES = 24 * 60;
/** Height of one hour in the grid, in px. */
export const HOUR_HEIGHT = 48;
/** What `onSlotClick` and the keyboard cursor step by, in minutes. */
export const SLOT_MINUTES = 30;
/** An event is drawn at least this tall, in px. */
export const MIN_EVENT_HEIGHT = 20;
/** A column of overlapping events is at least this wide, in px, and at least two fit. */
const MIN_COLUMN_WIDTH = 72;
const MIN_COLUMNS = 2;
/** Hour the grid opens on, unless an event starts earlier. */
const OPEN_HOUR = 7;

/** How many minutes the shortest drawn event stands for: what it takes in its column. */
const MIN_EVENT_MINUTES = (MIN_EVENT_HEIGHT / HOUR_HEIGHT) * 60;

/** Minutes since 00:00 on the wall clock. */
export const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** Distance from the top of the grid of a time of day, in px. */
export const minutesToPx = (minutes: number) => (minutes * HOUR_HEIGHT) / 60;

/** The part of a timed event that falls on one day. */
export type DaySegment = {
  startMin: number;
  endMin: number;
  /** The event began on an earlier day. */
  before: boolean;
  /** The event goes on the next day. */
  after: boolean;
};

/**
 * The part of a timed event on `day`, or `null` when the event is all-day or does not reach it.
 * An event that runs past midnight is cut at 24:00 and picks up at 00:00 the next day. One with no
 * end has no length (it is drawn at the minimum height).
 */
export const segmentOn = (event: EventSpan, day: Date): DaySegment | null => {
  if (isAllDay(event)) return null;
  const first = startOfDay(event.start);
  const last = lastDay(event);
  const at = startOfDay(day);
  if (at < first || at > last) return null;
  const startMin = at.getTime() === first.getTime() ? minutesOfDay(event.start) : 0;
  const end = endAfterStart(event);
  const endMin =
    at < last ? DAY_MINUTES : !end ? startMin : atMidnight(end) ? DAY_MINUTES : minutesOfDay(end);
  return { startMin, endMin, before: at > first, after: at < last };
};

export type LayoutInput = { startMin: number; endMin: number };

/** Where one segment of a day goes among the ones it overlaps. */
export type PlacedSegment = {
  /** Index of the segment in the list given to `layoutDay`. */
  index: number;
  /** Column it takes, from 0. */
  column: number;
  /** Columns its group of overlapping segments is drawn in. */
  columns: number;
  /** The group has hidden segments: leave room for the "+N" button after the columns. */
  reserved: boolean;
};

/** Segments that did not fit the columns of their group, for one "+N" button. */
export type OverflowGroup = {
  /** Minutes at which the first of them starts: where the button goes. */
  startMin: number;
  /** Indexes of the hidden segments. */
  indices: number[];
};

export type DayLayout = { placed: PlacedSegment[]; overflow: OverflowGroup[] };

/**
 * Lays one day's segments side by side. Segments that overlap, directly or through a chain of
 * others, make a group and share its width; each takes the first column of its group that is free
 * when it starts, in the order of the list (start, the longer first). A segment is held to at
 * least the height of the shortest drawn event, so two short events a few minutes apart do not
 * sit on top of each other. A group that needs more than `maxColumns` columns keeps the segments
 * of the first `maxColumns` and reports the rest as overflow.
 *
 * `segments` must be sorted by start, the longer first (the order of `compareEvents`).
 */
export const layoutDay = (segments: LayoutInput[], maxColumns: number): DayLayout => {
  const placed: PlacedSegment[] = [];
  const overflow: OverflowGroup[] = [];
  const columnEnds: number[] = [];
  let group: { index: number; column: number; startMin: number }[] = [];
  let groupEnd = -1;

  const flush = () => {
    if (group.length === 0) return;
    const columns = columnEnds.length;
    const visible = Math.min(columns, maxColumns);
    const hidden = group.filter((item) => item.column >= maxColumns);
    for (const item of group) {
      if (item.column >= maxColumns) continue;
      placed.push({
        index: item.index,
        column: item.column,
        columns: visible,
        reserved: hidden.length > 0,
      });
    }
    if (hidden.length > 0) {
      overflow.push({
        startMin: Math.min(...hidden.map((item) => item.startMin)),
        indices: hidden.map((item) => item.index),
      });
    }
    group = [];
    columnEnds.length = 0;
    groupEnd = -1;
  };

  segments.forEach((segment, index) => {
    if (group.length > 0 && segment.startMin >= groupEnd) flush();
    const end = Math.min(
      DAY_MINUTES,
      Math.max(segment.endMin, segment.startMin + MIN_EVENT_MINUTES)
    );
    let column = columnEnds.findIndex((columnEnd) => columnEnd <= segment.startMin);
    if (column < 0) column = columnEnds.length;
    columnEnds[column] = end;
    group.push({ index, column, startMin: segment.startMin });
    groupEnd = Math.max(groupEnd, end);
  });
  flush();
  return { placed, overflow };
};

/** Number of columns that fit a day column `width` px wide, never fewer than two. */
export const columnsFitting = (width: number) =>
  Math.max(MIN_COLUMNS, Math.floor(width / MIN_COLUMN_WIDTH));

/** One all-day event as a bar over the day columns. */
export type AllDayBar = {
  /** Index of the event in the list given to `layoutAllDay`. */
  index: number;
  /** First day column it covers, from 0. */
  column: number;
  /** Day columns it covers. */
  span: number;
  /** Row of the bar, from 0. */
  lane: number;
  /** The event began before the first day shown. */
  before: boolean;
  /** The event goes on after the last day shown. */
  after: boolean;
};

/**
 * The all-day events as bars over `days` (consecutive days): each covers the days it reaches,
 * clipped to the ones shown, and takes the first row that is free over its columns. Events are
 * taken in the order of `compareEvents`: the earlier first, the longer first on a tie.
 */
export const layoutAllDay = (events: EventSpan[], days: Date[]): AllDayBar[] => {
  const first = days[0];
  const last = days[days.length - 1];
  const bars: AllDayBar[] = [];
  const laneEnds: number[] = [];
  const order = events
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => isAllDay(event))
    .sort((a, b) => compareEvents(a.event, b.event));
  for (const { event, index } of order) {
    const from = startOfDay(event.start);
    const to = lastDay(event);
    if (to < first || from > last) continue;
    const column = from < first ? 0 : days.findIndex((day) => sameDay(day, from));
    const end = to > last ? days.length - 1 : days.findIndex((day) => sameDay(day, to));
    let lane = laneEnds.findIndex((laneEnd) => laneEnd < column);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = end;
    bars.push({
      index,
      column,
      span: end - column + 1,
      lane,
      before: from < first,
      after: to > last,
    });
  }
  return bars;
};

/**
 * The slot under a point `offsetY` px below the top of a day column, as minutes since 00:00: the
 * start of the `slot`-minute slot that holds it, never before the first nor past the last.
 */
export const slotAt = (offsetY: number, hourHeight = HOUR_HEIGHT, slot = SLOT_MINUTES) =>
  Math.min(
    Math.max(Math.floor(((offsetY / hourHeight) * 60) / slot) * slot, 0),
    DAY_MINUTES - slot
  );

/** The slot the keyboard sits on: a day and the minutes at which its slot starts. */
export type SlotCursor = { date: Date; minutes: number };

export type CursorKey =
  'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'PageUp' | 'PageDown' | 'Home' | 'End';

/**
 * Where a key takes the cursor: a day left or right (`rtl` swaps them: the next day is on the
 * left), a slot up or down (held to the day), a whole period of `periodDays` days back or
 * forward, the first or the last slot of the day. A move off the days shown is the caller's to
 * follow: it shows the day the cursor is on.
 */
export const moveCursor = (
  cursor: SlotCursor,
  key: CursorKey,
  { periodDays, rtl }: { periodDays: number; rtl: boolean }
): SlotCursor => {
  const lastSlot = DAY_MINUTES - SLOT_MINUTES;
  const byDays = (n: number) => ({ ...cursor, date: addDays(cursor.date, n) });
  switch (key) {
    case 'ArrowLeft':
      return byDays(rtl ? 1 : -1);
    case 'ArrowRight':
      return byDays(rtl ? -1 : 1);
    case 'ArrowUp':
      return { ...cursor, minutes: Math.max(0, cursor.minutes - SLOT_MINUTES) };
    case 'ArrowDown':
      return { ...cursor, minutes: Math.min(lastSlot, cursor.minutes + SLOT_MINUTES) };
    case 'PageUp':
      return byDays(-periodDays);
    case 'PageDown':
      return byDays(periodDays);
    case 'Home':
      return { ...cursor, minutes: 0 };
    case 'End':
      return { ...cursor, minutes: lastSlot };
  }
};

/**
 * The hour the grid opens on: `OPEN_HOUR`, or the hour before the first event when that starts
 * earlier (`firstStartMin`, in minutes since 00:00; `undefined` when no event is shown).
 */
export const openHour = (firstStartMin: number | undefined) =>
  firstStartMin === undefined
    ? OPEN_HOUR
    : Math.max(0, Math.min(OPEN_HOUR, Math.floor(firstStartMin / 60) - 1));

/**
 * The earliest start, in minutes since 00:00, of a timed event that begins on one of `days`;
 * `undefined` if none does.
 */
export const firstStart = (events: EventSpan[], days: Date[]): number | undefined => {
  let first: number | undefined;
  for (const day of days) {
    for (const event of events) {
      const segment = segmentOn(event, day);
      // A part that carries on from the day before starts at 00:00 only because it was cut there.
      if (segment && !segment.before && (first === undefined || segment.startMin < first))
        first = segment.startMin;
    }
  }
  return first;
};

/** What the calendar shows: a month grid, a week of hours, or one day of hours. */
export type CalendarView = 'month' | 'week' | 'day';

/** First day of the period of `view` that holds `date`: the 1st, the Monday, or the day itself. */
export const periodStart = (date: Date, view: CalendarView) =>
  view === 'month' ? startOfMonth(date) : view === 'week' ? weekStart(date) : startOfDay(date);

/** The first day of the period `n` periods after the one starting at `start` (before, if negative). */
export const stepPeriod = (start: Date, view: CalendarView, n: number) =>
  view === 'month'
    ? new Date(start.getFullYear(), start.getMonth() + n, 1)
    : addDays(start, n * (view === 'week' ? 7 : 1));
