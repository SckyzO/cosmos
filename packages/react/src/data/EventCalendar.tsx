import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { SegmentedControl } from '../forms/SegmentedControl';
import { useControllableState } from '../hooks/useControllableState';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useTicker } from '../hooks/useTicker';
import { Button } from '../ui/Button';
import type { Intent } from '../ui/intent';
import { Tooltip } from '../ui/Tooltip';
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
import {
  compareEvents,
  isAllDay,
  lastDay,
  periodStart,
  stepPeriod,
  type CalendarView,
} from './calendar-grid';
import { DayEventsPopover, EventChip } from './EventCalendarChip';
import { EventCalendarStrip } from './EventCalendarStrip';
import { EventCalendarTimeGrid } from './EventCalendarTimeGrid';
import { clockTick, nextClockDelay } from './time';

export type { CalendarView } from './calendar-grid';

/**
 * An event's color: an `Intent`, or `violet`, a category color that carries no meaning of
 * its own.
 */
export type EventCalendarIntent =
  Extract<Intent, 'brand' | 'success' | 'warning' | 'danger' | 'info'> | 'violet';

export type CalendarEvent = {
  id: string;
  title: string;
  /**
   * When the event starts. The month view uses its date and writes its time on the chip, unless
   * the event is all-day; the week and day views put it at its time in the hour grid.
   */
  start: Date;
  /**
   * An all-day event: the last day, inclusive. A timed one: the moment it ends. Omit for an event
   * that lasts no longer than its day (in the hour grid, one with no end is drawn at the
   * minimum height).
   */
  end?: Date;
  /**
   * An all-day event has a date and no time: it goes in the row above the hour grid and shows no
   * time. Left unset, it is true when `start` is at 00:00 and `end` is missing or at 00:00, so an
   * event made of dates alone stays all-day. Set it to force the answer either way (a timed event
   * that starts at midnight is `allDay: false`).
   */
  allDay?: boolean;
  /** Dot and chip colour. Defaults to `brand`. */
  intent?: EventCalendarIntent;
};

export type EventCalendarProps = {
  events: CalendarEvent[];
  /** What is shown: `month` (default), `week` or `day`. Set it with `onViewChange` to control it. */
  view?: CalendarView;
  /** The view shown first when `view` is not set. Defaults to `month`. */
  defaultView?: CalendarView;
  /** Fires with the view picked in the toolbar. */
  onViewChange?: (view: CalendarView) => void;
  /** Day that sets the period shown (any day in it). Set it with `onDateChange` to control the calendar. */
  date?: Date;
  /** Day that sets the first period shown when `date` is not set. Defaults to `today`. */
  defaultDate?: Date;
  /**
   * Fires with the first day of the period reached by previous / next / Today (the 1st of a month,
   * the Monday of a week, the day itself), and by a change of view that lands on another period.
   */
  onDateChange?: (date: Date) => void;
  /**
   * The current moment. Its day is highlighted, Today goes to it, and the line of the week and day
   * views sits at its time. Defaults to now, and the line moves every minute; set it to freeze it
   * (stories, screenshots and tests).
   */
  today?: Date;
  /** Makes each event chip a button. */
  onEventClick?: (event: CalendarEvent) => void;
  /** Makes each day number a button. */
  onDayClick?: (date: Date) => void;
  /**
   * Makes the empty time slots of the week and day views interactive: a click on one, or Enter on
   * the keyboard cursor, calls it with the start of the 30-minute slot. `info.allDay` is `true`
   * for a click on the all-day row, whose start is 00:00. With it set, the hour grid is a single
   * tab stop for a cursor on the slots: the arrow keys move it a day or 30 minutes, Page Up and
   * Page Down a week (a day, in the day view), Home and End to the first and the last slot of
   * the day.
   */
  onSlotClick?: (start: Date, info: { allDay: boolean }) => void;
  /**
   * BCP 47 language tag (`'fr-FR'`) for the weekday names, the titles, the times and the
   * date in the accessible name of each day and of its "+N more" list. Defaults to
   * the browser's locale. The grid itself stays Gregorian, weeks starting on
   * Monday, whatever the locale. The button labels (Today, Previous month, Next
   * month, "+N more") stay English. An invalid tag throws a `RangeError`.
   */
  locale?: string;
  /**
   * Shown under the grid when no event falls in the period shown. Default `No events this month`,
   * `No events this week` or `No events this day`.
   */
  emptyMessage?: ReactNode;
  /**
   * Classes of the card. The week and day views are as tall as the card is: give it a height
   * (`h-[640px]`) and the hour grid scrolls inside it; without one the grid is 36rem tall.
   */
  className?: string;
};

// Chips beyond this go behind the "+N more" button.
const MAX_CHIPS = 3;

const UNIT: Record<CalendarView, string> = { month: 'month', week: 'week', day: 'day' };
const VIEWS = [
  { label: 'Month', value: 'month' },
  { label: 'Week', value: 'week' },
  { label: 'Day', value: 'day' },
] satisfies { label: string; value: CalendarView }[];

// The moment the calendar reads as now, to the minute: Date.now() once a minute, on the boundary.
const readMinute = (ms: number) => clockTick(ms, false);
const minuteDelay = (ms: number) => nextClockDelay(ms, false);

/** `today` when it is set, else the current moment, renewed every minute. */
const useNow = (today?: Date) => {
  const minute = useTicker(readMinute, minuteDelay, today);
  return useMemo(() => today ?? new Date(minute), [today, minute]);
};

/** Monday on or before the 1st through the Sunday on or after the last day. */
const monthGrid = (month: Date) => {
  const first = startOfMonth(month);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const end = addDays(last, 6 - isoWeekday(last));
  const days: Date[] = [];
  for (let d = addDays(first, -isoWeekday(first)); d <= end; d = addDays(d, 1)) days.push(d);
  return days;
};

/** The days a period of `view` starting at `start` shows. */
const periodDays = (start: Date, view: CalendarView) =>
  view === 'month' ? monthGrid(start) : view === 'week' ? weekDays(start) : [start];

/** Day key → events covering that day, for the shown days only: all-day first, then by start. */
const indexByDay = (events: CalendarEvent[], first: Date, last: Date) => {
  const byDay = new Map<string, CalendarEvent[]>();
  const sorted = [...events].sort(compareEvents);
  for (const event of sorted) {
    const start = startOfDay(event.start);
    const end = lastDay(event);
    const to = end < last ? end : last;
    for (let d = start < first ? first : start; d <= to; d = addDays(d, 1)) {
      const key = isoDate(d);
      const list = byDay.get(key);
      if (list) list.push(event);
      else byDay.set(key, [event]);
    }
  }
  return byDay;
};

const NAV_BUTTON = clsx(
  'h-ctrl-32 w-ctrl-32 flex items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200',
  'focus-visible:focus-indicator'
);

/**
 * EventCalendar — events in a month grid, a week of hours or a day of hours, with ISO weeks
 * (Monday first).
 *
 * The month shows up to three event chips a day (a color dot, the time and the title) and a
 * "+N more" button that lists the whole day. An all-day event has no time; a timed one writes its
 * start time before the title. An event with an `end` shows its title on its first day and a bare
 * chip on each following day. Below `sm` the weekday names shrink to a letter, the chips to their
 * dots, and picking a day lists its events under the grid.
 *
 * The week and day views draw a scrolling grid of 24 hours, 48px each, opened at 7 AM (or an hour
 * before the first event). All-day events sit in a row above it; timed ones are placed at their
 * time, side by side when they overlap, as many as the width allows (72px each, two at least),
 * the rest behind a "+N" button. A line marks the current time. Below `sm` a week is a strip of
 * its seven days and the grid of the picked day.
 *
 * Uncontrolled by default; pass `date` with `onDateChange`, and `view` with `onViewChange`, to
 * drive it from outside (a side MiniCalendar, or loading events per period).
 */
export const EventCalendar = ({
  events,
  view: viewProp,
  defaultView = 'month',
  onViewChange,
  date,
  defaultDate,
  onDateChange,
  today,
  onEventClick,
  onDayClick,
  onSlotClick,
  locale,
  emptyMessage,
  className,
}: EventCalendarProps) => {
  const now = useNow(today);
  const [view, setView] = useControllableState({
    value: viewProp,
    defaultValue: defaultView,
    onChange: onViewChange,
    name: 'EventCalendar.view',
  });
  const [current, goTo] = useControllableState({
    value: date,
    defaultValue: () => periodStart(defaultDate ?? now, view),
    onChange: onDateChange,
    name: 'EventCalendar.date',
  });
  const [openDay, setOpenDay] = useState<string | null>(null);
  // Below `sm` a cell has room for a dot only: the picked day's events are listed under the grid.
  const narrow = !useMediaQuery('(min-width: 40rem)', true);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const shown = periodStart(current, view);
  const shownTime = shown.getTime();
  const fmt = useMemo(() => createCalendarFormats(locale), [locale]);

  const { days, byDay } = useMemo(() => {
    const shownDays = periodDays(periodStart(current, view), view);
    return {
      days: shownDays,
      byDay: indexByDay(events, shownDays[0], shownDays[shownDays.length - 1]),
    };
  }, [events, current, view]);
  // In the month view, the greyed days of the neighbouring months do not count.
  const isEmptyPeriod = !days.some(
    (day) => (view !== 'month' || day.getMonth() === shown.getMonth()) && byDay.has(isoDate(day))
  );
  const isCurrentPeriod = periodStart(now, view).getTime() === shownTime;
  // The picked day if it is in the period shown, else today, else the first day.
  const pickedDay =
    days.find(
      (d) => isoDate(d) === pickedKey && (view !== 'month' || d.getMonth() === shown.getMonth())
    ) ?? (isCurrentPeriod ? now : shown);
  const pickedEvents = byDay.get(isoDate(pickedDay)) ?? [];
  // The one column of hours the phone draws under the strip: the picked day of the week.
  const pickedIndex = Math.max(
    0,
    days.findIndex((d) => sameDay(d, pickedDay))
  );
  const pickedColumn = useMemo(() => [days[pickedIndex]], [days, pickedIndex]);
  // The start time of a timed event, on the day it starts; no time on an all-day event, nor on the
  // days it goes on.
  const timeOn = (event: CalendarEvent, day: Date) =>
    !isAllDay(event) && sameDay(event.start, day) ? fmt.time(event.start) : undefined;

  const unit = UNIT[view];
  const title =
    view === 'month'
      ? fmt.monthYear(shown)
      : view === 'week'
        ? fmt.dateRange(days[0], days[days.length - 1])
        : fmt.fullDate(shown);

  // A switch from the period that holds today goes to the period of the new view that holds it
  // too; from another, to the new period that starts with the one shown (a week's month is its
  // Thursday's, as in ISO 8601).
  const changeView = (next: CalendarView) => {
    if (next === view) return;
    setView(next);
    const anchor = isCurrentPeriod
      ? now
      : view === 'week' && next === 'month'
        ? addDays(shown, 3)
        : shown;
    const target = periodStart(anchor, next);
    if (target.getTime() !== periodStart(current, next).getTime()) goTo(target);
  };

  // The keyboard cursor of the hour grid reached a day that is not drawn.
  const showDay = (target: Date) => {
    if (view === 'day') goTo(startOfDay(target));
    else if (weekStart(target).getTime() !== shownTime) goTo(weekStart(target));
    setPickedKey(isoDate(target));
  };

  // Below `sm` a week is a strip of its seven days and the grid of the picked one: seven columns
  // of hours would be 48px wide. The day is one column already.
  const stripped = view === 'week' && narrow;

  return (
    <div
      className={clsx(
        'flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
        <h3 aria-live="polite" className="text-base font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        <div className="flex flex-wrap items-center gap-1 max-sm:contents">
          <div className="flex items-center gap-1">
            {/* A disabled Today reads as dead: the tooltip says why. It wraps the button in both
                states, so the button is the same element when the period changes. */}
            <Tooltip
              content={
                isCurrentPeriod
                  ? `Already showing the current ${unit}`
                  : `Back to the current ${unit}`
              }
              position="bottom"
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goTo(periodStart(now, view))}
                disabled={isCurrentPeriod}
                className="me-1"
              >
                Today
              </Button>
            </Tooltip>
            <button
              type="button"
              onClick={() => goTo(stepPeriod(shown, view, -1))}
              aria-label={`Previous ${unit}`}
              className={NAV_BUTTON}
            >
              <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => goTo(stepPeriod(shown, view, 1))}
              aria-label={`Next ${unit}`}
              className={NAV_BUTTON}
            >
              <ChevronRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
            </button>
          </div>
          <SegmentedControl
            aria-label="Calendar view"
            size="sm"
            options={VIEWS}
            value={view}
            onChange={changeView}
            fullWidth={narrow}
            className="max-sm:order-last sm:ms-2"
          />
        </div>
      </div>

      {view === 'month' ? (
        <>
          <div
            className="grid grid-cols-7 border-y border-gray-200 dark:border-gray-800"
            aria-hidden
          >
            {fmt.weekdays.map((d, i) => (
              <span
                key={i}
                className="text-2xs py-2 text-center font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
              >
                <bdi className="max-sm:hidden">{d}</bdi>
                <span className="sm:hidden">{fmt.weekdaysNarrow[i]}</span>
              </span>
            ))}
          </div>

          {/* -mb-px tucks the last row's bottom border under the card's own. */}
          <div className="-mb-px grid grid-cols-7">
            {days.map((day, i) => {
              const key = isoDate(day);
              const label = fmt.fullDate(day);
              const dayEvents = byDay.get(key) ?? [];
              const hidden = dayEvents.length - MAX_CHIPS;
              const outside = day.getMonth() !== shown.getMonth();
              const isToday = sameDay(day, now);
              const numberClass = clsx(
                'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-medium',
                isToday
                  ? 'bg-brand-500 text-white'
                  : outside
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-gray-700 dark:text-gray-200'
              );
              return (
                <div
                  key={key}
                  role="group"
                  aria-label={label}
                  className={clsx(
                    'min-h-20 min-w-0 border-b border-gray-200 p-1.5 sm:min-h-28 dark:border-gray-800',
                    i % 7 !== 6 && 'border-e',
                    outside && 'bg-gray-50 dark:bg-white/[0.02]'
                  )}
                >
                  {onDayClick || narrow ? (
                    <button
                      type="button"
                      aria-label={label}
                      aria-current={isToday ? 'date' : undefined}
                      aria-pressed={narrow ? sameDay(day, pickedDay) : undefined}
                      onClick={() => {
                        setPickedKey(key);
                        onDayClick?.(day);
                      }}
                      className={clsx(
                        numberClass,
                        !isToday && 'hover:bg-gray-100 dark:hover:bg-white/5',
                        narrow && sameDay(day, pickedDay) && 'ring-brand-500 ring-2 ring-inset',
                        'focus-visible:focus-indicator'
                      )}
                    >
                      {fmt.dayNumber(day)}
                    </button>
                  ) : (
                    <time
                      dateTime={key}
                      aria-current={isToday ? 'date' : undefined}
                      className={numberClass}
                    >
                      {fmt.dayNumber(day)}
                    </time>
                  )}

                  {dayEvents.length > 0 && (
                    <ul className="mt-1 flex flex-wrap gap-0.5 sm:flex-col sm:flex-nowrap">
                      {dayEvents.slice(0, MAX_CHIPS).map((event) => (
                        <li key={event.id} className="min-w-0">
                          <EventChip
                            event={event}
                            time={timeOn(event, day)}
                            onClick={onEventClick}
                            compact
                            // The first shown day also carries it, for an event that began before the grid.
                            continuation={!sameDay(startOfDay(event.start), day) && i > 0}
                          />
                        </li>
                      ))}
                    </ul>
                  )}

                  {hidden > 0 && !narrow && (
                    <DayEventsPopover
                      open={openDay === key}
                      onOpenChange={(open) => setOpenDay(open ? key : null)}
                      label={label}
                      hidden={hidden}
                      events={dayEvents}
                      timeOn={(event) => timeOn(event, day)}
                      onEventClick={onEventClick}
                      triggerClassName="mt-0.5 rounded-sm px-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      <bdi>
                        +{hidden}
                        <span className="max-sm:sr-only"> more</span>
                      </bdi>
                    </DayEventsPopover>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {stripped && (
            <EventCalendarStrip
              days={days}
              picked={pickedDay}
              now={now}
              byDay={byDay}
              fmt={fmt}
              onPick={(day) => {
                setPickedKey(isoDate(day));
                onDayClick?.(day);
              }}
            />
          )}
          <EventCalendarTimeGrid
            days={stripped ? pickedColumn : days}
            events={events}
            now={now}
            fmt={fmt}
            label={`Schedule for ${title}`}
            periodDays={view === 'week' ? 7 : 1}
            header={!stripped}
            onEventClick={onEventClick}
            onDayClick={onDayClick}
            onSlotClick={onSlotClick}
            onShowDay={showDay}
          />
        </>
      )}

      {isEmptyPeriod && (
        <p
          role="status"
          className="border-t border-gray-200 px-4 py-3 text-center text-sm text-[var(--color-text-muted)] dark:border-gray-800"
        >
          {emptyMessage ?? `No events this ${unit}`}
        </p>
      )}

      {view === 'month' && narrow && !isEmptyPeriod && (
        <section aria-label={`Events on ${fmt.fullDate(pickedDay)}`} className="px-4 py-3">
          <p className="mb-2 text-xs font-semibold text-[var(--color-text-primary)]">
            {fmt.fullDate(pickedDay)}
          </p>
          {pickedEvents.length > 0 ? (
            <ul className="space-y-1">
              {pickedEvents.map((event) => (
                <li key={event.id}>
                  <EventChip event={event} time={timeOn(event, pickedDay)} onClick={onEventClick} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">No events</p>
          )}
        </section>
      )}
    </div>
  );
};
