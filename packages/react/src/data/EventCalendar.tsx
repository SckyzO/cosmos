import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Popover } from '../ui/Popover';
import { createCalendarFormats, isoDate, isoWeekday, sameDay } from './calendar-dates';

export type EventCalendarTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'violet';

export type CalendarEvent = {
  id: string;
  title: string;
  /** First day of the event. Only the date is used, not the time. */
  start: Date;
  /** Last day, inclusive. Omit for a one-day event. */
  end?: Date;
  /** Dot and chip colour. Defaults to `brand`. */
  tone?: EventCalendarTone;
};

export type EventCalendarProps = {
  events: CalendarEvent[];
  /** Month to show (any day in it). Set it with `onMonthChange` to control the calendar. */
  month?: Date;
  /** First month shown when `month` is not set. Defaults to the month of `today`. */
  defaultMonth?: Date;
  /** Fires with the first day of the month reached by previous / next / Today. */
  onMonthChange?: (month: Date) => void;
  /** Day highlighted as today, and where the Today button goes. Defaults to now. */
  today?: Date;
  /** Makes each event chip a button. */
  onEventClick?: (event: CalendarEvent) => void;
  /** Makes each day number a button. */
  onDayClick?: (date: Date) => void;
  /**
   * BCP 47 language tag (`'fr-FR'`) for the weekday names, the month title and the
   * date in the accessible name of each day and of its "+N more" list. Defaults to
   * the browser's locale. The grid itself stays Gregorian, weeks starting on
   * Monday, whatever the locale. The button labels (Today, Previous month, Next
   * month, "+N more") stay English. An invalid tag throws a `RangeError`.
   */
  locale?: string;
  className?: string;
};

// Chips beyond this go behind the "+N more" button.
const MAX_CHIPS = 3;

const TONE_DOT: Record<EventCalendarTone, string> = {
  brand: 'bg-brand-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  violet: 'bg-violet-500',
};

const TONE_CHIP: Record<EventCalendarTone, string> = {
  brand: 'bg-brand-50 dark:bg-brand-500/15',
  success: 'bg-green-50 dark:bg-green-500/15',
  warning: 'bg-amber-50 dark:bg-amber-500/15',
  danger: 'bg-red-50 dark:bg-red-500/15',
  info: 'bg-blue-50 dark:bg-blue-500/15',
  violet: 'bg-violet-50 dark:bg-violet-500/15',
};

const TONE_CHIP_HOVER: Record<EventCalendarTone, string> = {
  brand: 'hover:bg-brand-100 dark:hover:bg-brand-500/25',
  success: 'hover:bg-green-100 dark:hover:bg-green-500/25',
  warning: 'hover:bg-amber-100 dark:hover:bg-amber-500/25',
  danger: 'hover:bg-red-100 dark:hover:bg-red-500/25',
  info: 'hover:bg-blue-100 dark:hover:bg-blue-500/25',
  violet: 'hover:bg-violet-100 dark:hover:bg-violet-500/25',
};

const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

/** Monday on or before the 1st through the Sunday on or after the last day. */
const monthGrid = (month: Date) => {
  const first = startOfMonth(month);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const end = addDays(last, 6 - isoWeekday(last));
  const days: Date[] = [];
  for (let d = addDays(first, -isoWeekday(first)); d <= end; d = addDays(d, 1)) days.push(d);
  return days;
};

/** Day key → events covering that day, for the shown days only, in start order. */
const indexByDay = (events: CalendarEvent[], first: Date, last: Date) => {
  const byDay = new Map<string, CalendarEvent[]>();
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  for (const event of sorted) {
    const start = startOfDay(event.start);
    const end = event.end && event.end > event.start ? startOfDay(event.end) : start;
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

const EventChip = ({
  event,
  onClick,
  compact = false,
}: {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  /** In a day cell: below `sm` only the dot shows, the title stays for screen readers. */
  compact?: boolean;
}) => {
  const tone = event.tone ?? 'brand';
  const content = (
    <>
      <span aria-hidden className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', TONE_DOT[tone])} />
      <span className={clsx('truncate', compact && 'max-sm:sr-only')}>{event.title}</span>
    </>
  );
  const className = clsx(
    'flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-xs text-gray-700 dark:text-gray-200',
    TONE_CHIP[tone],
    compact ? 'max-sm:bg-transparent max-sm:px-1 sm:w-full max-sm:dark:bg-transparent' : 'w-full'
  );
  if (!onClick) {
    return (
      <div title={event.title} className={className}>
        {content}
      </div>
    );
  }
  return (
    <button
      type="button"
      title={event.title}
      onClick={() => onClick(event)}
      className={clsx(className, TONE_CHIP_HOVER[tone], FOCUS_RING)}
    >
      {content}
    </button>
  );
};

/**
 * EventCalendar — month view of events, with ISO weeks (Monday first).
 *
 * Each day shows up to three event chips (a tone dot and the title) and a
 * "+N more" button that lists the whole day. An event with an `end` repeats on
 * every day it covers. Below `sm` the chips shrink to their dots.
 *
 * Uncontrolled by default; pass `month` with `onMonthChange` to drive it from
 * outside (a side MiniCalendar, or loading events per month).
 */
export const EventCalendar = ({
  events,
  month,
  defaultMonth,
  onMonthChange,
  today = new Date(),
  onEventClick,
  onDayClick,
  locale,
  className,
}: EventCalendarProps) => {
  const [internalMonth, setInternalMonth] = useState(() => startOfMonth(defaultMonth ?? today));
  const [openDay, setOpenDay] = useState<string | null>(null);
  const shown = startOfMonth(month ?? internalMonth);
  const fmt = useMemo(() => createCalendarFormats(locale), [locale]);

  const { days, byDay } = useMemo(() => {
    const grid = monthGrid(month ?? internalMonth);
    return { days: grid, byDay: indexByDay(events, grid[0], grid[grid.length - 1]) };
  }, [events, month, internalMonth]);

  const goTo = (next: Date) => {
    if (month === undefined) setInternalMonth(next);
    onMonthChange?.(next);
  };
  const isTodayMonth =
    shown.getFullYear() === today.getFullYear() && shown.getMonth() === today.getMonth();

  return (
    <div
      className={clsx(
        'overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h3 aria-live="polite" className="text-base font-semibold text-[var(--color-text-primary)]">
          {fmt.monthYear(shown)}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => goTo(startOfMonth(today))}
            disabled={isTodayMonth}
            className="mr-1"
          >
            Today
          </Button>
          <button
            type="button"
            onClick={() => goTo(new Date(shown.getFullYear(), shown.getMonth() - 1, 1))}
            aria-label="Previous month"
            className={clsx(
              'flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200',
              FOCUS_RING
            )}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => goTo(new Date(shown.getFullYear(), shown.getMonth() + 1, 1))}
            aria-label="Next month"
            className={clsx(
              'flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200',
              FOCUS_RING
            )}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-y border-gray-200 dark:border-gray-800" aria-hidden>
        {fmt.weekdays.map((d, i) => (
          <span
            key={i}
            className="text-2xs py-2 text-center font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
          >
            {d}
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
          const isToday = sameDay(day, today);
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
                i % 7 !== 6 && 'border-r',
                outside && 'bg-gray-50 dark:bg-white/[0.02]'
              )}
            >
              {onDayClick ? (
                <button
                  type="button"
                  aria-label={label}
                  aria-current={isToday ? 'date' : undefined}
                  onClick={() => onDayClick(day)}
                  className={clsx(
                    numberClass,
                    !isToday && 'hover:bg-gray-100 dark:hover:bg-white/5',
                    FOCUS_RING
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
                      <EventChip event={event} onClick={onEventClick} compact />
                    </li>
                  ))}
                </ul>
              )}

              {hidden > 0 && (
                <Popover
                  open={openDay === key}
                  onOpenChange={(open) => setOpenDay(open ? key : null)}
                >
                  <Popover.Trigger
                    aria-label={`+${hidden} more on ${label}`}
                    className={clsx(
                      'mt-0.5 rounded px-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
                      FOCUS_RING
                    )}
                  >
                    +{hidden}
                    <span className="max-sm:sr-only"> more</span>
                  </Popover.Trigger>
                  <Popover.Content aria-label={`Events on ${label}`} width="w-60">
                    <p className="mb-2 text-xs font-semibold text-[var(--color-text-primary)]">
                      {label}
                    </p>
                    <ul className="space-y-1">
                      {dayEvents.map((event) => (
                        <li key={event.id}>
                          <EventChip
                            event={event}
                            onClick={
                              onEventClick &&
                              ((e) => {
                                setOpenDay(null);
                                onEventClick(e);
                              })
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  </Popover.Content>
                </Popover>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
