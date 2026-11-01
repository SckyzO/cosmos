import { clsx } from 'clsx';
import { isoDate, sameDay, type CalendarFormats } from './calendar-dates';
import type { CalendarEvent } from './EventCalendar';
import { INTENT_DOT } from './EventCalendarChip';

// Chips beyond this are left out of the dots under a day.
const MAX_DOTS = 3;

/**
 * The week of the phone: its seven days in a row, each a button with a dot per event, one picked.
 * The grid of the picked day goes under it. Internal: EventCalendar draws it below `sm`.
 */
export const EventCalendarStrip = ({
  days,
  picked,
  now,
  byDay,
  fmt,
  onPick,
}: {
  days: Date[];
  picked: Date;
  now: Date;
  byDay: Map<string, CalendarEvent[]>;
  fmt: CalendarFormats;
  onPick: (day: Date) => void;
}) => (
  <div
    role="group"
    aria-label="Days of the week"
    className="border-t border-gray-200 dark:border-gray-800"
  >
    {/* The weekday letters are not in the buttons: a button's name is its date, and a letter in
        it would be visible text its name does not hold. */}
    <div aria-hidden className="grid grid-cols-7 pt-2">
      {days.map((day, i) => (
        <span
          key={isoDate(day)}
          className="text-2xs text-center font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
        >
          {fmt.weekdaysNarrow[i]}
        </span>
      ))}
    </div>
    <div className="grid grid-cols-7">
      {days.map((day) => {
        const isToday = sameDay(day, now);
        const isPicked = sameDay(day, picked);
        const events = byDay.get(isoDate(day)) ?? [];
        return (
          <button
            key={isoDate(day)}
            type="button"
            aria-label={fmt.fullDate(day)}
            aria-current={isToday ? 'date' : undefined}
            aria-pressed={isPicked}
            onClick={() => onPick(day)}
            className={clsx(
              'focus-visible:focus-indicator flex flex-col items-center gap-0.5 pt-0.5 pb-2 focus-visible:ring-inset',
              isPicked ? 'bg-brand-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'
            )}
          >
            <span
              className={clsx(
                'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-sm font-medium',
                isToday ? 'bg-brand-500 text-white' : 'text-gray-700 dark:text-gray-200'
              )}
            >
              {fmt.dayNumber(day)}
            </span>
            <span aria-hidden className="flex h-1.5 gap-0.5">
              {events.slice(0, MAX_DOTS).map((event) => (
                <i
                  key={event.id}
                  className={clsx('h-1.5 w-1.5 rounded-full', INTENT_DOT[event.intent ?? 'brand'])}
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);
