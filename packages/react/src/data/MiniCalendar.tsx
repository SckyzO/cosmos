import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createCalendarFormats, isoDate, isoWeekday, sameDay } from './calendar-dates';
import { useControllableState } from '../hooks/useControllableState';

export type MiniCalendarProps = {
  today?: Date;
  /** Selected day, when controlled. */
  selected?: Date;
  /** First selected day, when uncontrolled. None when omitted. */
  defaultSelected?: Date;
  /** Called with the day the user picks. */
  onSelect?: (date: Date) => void;
  /** Set of ISO date strings (YYYY-MM-DD) marking days with events. */
  eventDays?: Set<string>;
  /**
   * BCP 47 language tag (`'fr-FR'`) for the weekday names, the month title and the
   * accessible name of each day. Defaults to the browser's locale. The grid itself
   * stays Gregorian, weeks starting on Monday, whatever the locale. The button
   * labels (Previous month, Next month) stay English. An invalid tag throws a
   * `RangeError`.
   */
  locale?: string;
  className?: string;
};

/**
 * MiniCalendar — compact ISO-week month picker with optional event dots.
 * Click the month title to jump back to today's month.
 */
export const MiniCalendar = ({
  today = new Date(),
  selected: selectedProp,
  defaultSelected,
  onSelect,
  eventDays,
  locale,
  className,
}: MiniCalendarProps) => {
  const [selected, select] = useControllableState({
    value: selectedProp,
    defaultValue: defaultSelected,
    onChange: onSelect,
    name: 'MiniCalendar.selected',
  });
  // Opens on the selected day's month, or today's when none is.
  const [view, setView] = useState(() => {
    const shown = selected ?? today;
    return new Date(shown.getFullYear(), shown.getMonth(), 1);
  });

  const cells = useMemo(() => {
    const firstOfMonth = new Date(view.getFullYear(), view.getMonth(), 1);
    const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const isoOffset = isoWeekday(firstOfMonth);
    const arr: (Date | null)[] = Array(isoOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++)
      arr.push(new Date(view.getFullYear(), view.getMonth(), d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [view]);

  // The accessible name of a day button is its full date, "Thursday, May 7, 2026"
  // in en-US. The visible text stays the bare day number.
  const fmt = useMemo(() => createCalendarFormats(locale), [locale]);

  const goPrev = () => setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  const goNext = () => setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1));
  const goToday = () => setView(new Date(today.getFullYear(), today.getMonth(), 1));

  return (
    <div
      className={clsx(
        'rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900',
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous month"
          className="focus-visible:focus-indicator flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={goToday}
          className="hover:text-brand-600 dark:hover:text-brand-400 focus-visible:focus-indicator rounded text-sm font-semibold text-gray-900 dark:text-gray-100"
        >
          {fmt.monthYear(view)}
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label="Next month"
          className="focus-visible:focus-indicator flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {/* One letter each so the seven labels never touch; the short name is the tooltip. */}
        {fmt.weekdaysNarrow.map((d, i) => (
          <span
            key={i}
            title={fmt.weekdays[i]}
            className="text-3xs py-1 font-semibold text-gray-500 uppercase dark:text-gray-400"
          >
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`e-${i}`} />;
          const isToday = sameDay(d, today);
          const isSelected = !!selected && sameDay(d, selected);
          const hasEvent = eventDays?.has(isoDate(d));
          return (
            <button
              type="button"
              key={d.toISOString()}
              onClick={() => select(d)}
              aria-label={fmt.fullDate(d)}
              aria-pressed={isSelected}
              aria-current={isToday ? 'date' : undefined}
              className={clsx(
                // The number sits above the middle of the cell (`pb-1.5`) to leave room for the event dot under it.
                'relative flex h-9 items-center justify-center rounded-md border pb-1.5 text-xs font-medium transition-colors focus-visible:ring-inset',
                isSelected
                  ? 'bg-brand-500 hover:bg-brand-600 focus-visible:focus-indicator-on-accent border-transparent text-white'
                  : isToday
                    ? 'border-brand-500 text-brand-600 hover:bg-brand-50 focus-visible:focus-indicator dark:text-brand-400 dark:hover:bg-white/5'
                    : 'focus-visible:focus-indicator border-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
              )}
            >
              {fmt.dayNumber(d)}
              {hasEvent && (
                <span
                  className={clsx(
                    'absolute bottom-1.5 h-1 w-1 rounded-full',
                    isSelected ? 'bg-white' : 'bg-brand-500'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
