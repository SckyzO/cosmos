import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

export type MiniCalendarProps = {
  today?: Date;
  selected: Date;
  onSelect: (date: Date) => void;
  /** Set of ISO date strings (YYYY-MM-DD) marking days with events. */
  eventDays?: Set<string>;
  className?: string;
};

const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * MiniCalendar — compact ISO-week month picker with optional event dots.
 * Click the month title to jump back to today's month.
 */
export const MiniCalendar = ({
  today = new Date(),
  selected,
  onSelect,
  eventDays,
  className,
}: MiniCalendarProps) => {
  const [view, setView] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));

  const cells = useMemo(() => {
    const firstOfMonth = new Date(view.getFullYear(), view.getMonth(), 1);
    const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    // Monday-first offset (JS: 0=Sun..6=Sat → ISO: 0=Mon..6=Sun)
    const isoOffset = (firstOfMonth.getDay() + 6) % 7;
    const arr: (Date | null)[] = Array(isoOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++)
      arr.push(new Date(view.getFullYear(), view.getMonth(), d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [view]);

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
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={goToday}
          className="hover:text-brand-600 dark:hover:text-brand-400 text-sm font-semibold text-gray-900 dark:text-gray-100"
        >
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label="Next month"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEK_DAYS.map((d) => (
          <span
            key={d}
            className="py-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase"
          >
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`e-${i}`} />;
          const isToday = sameDay(d, today);
          const isSelected = sameDay(d, selected);
          const hasEvent = eventDays?.has(isoDate(d));
          return (
            <button
              type="button"
              key={d.toISOString()}
              onClick={() => onSelect(d)}
              className={clsx(
                'relative flex h-8 items-center justify-center rounded-md text-xs font-medium transition-colors',
                isSelected
                  ? 'bg-brand-500 hover:bg-brand-600 text-white'
                  : isToday
                    ? 'bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
              )}
            >
              {d.getDate()}
              {hasEvent && (
                <span
                  className={clsx(
                    'absolute bottom-1 h-1 w-1 rounded-full',
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
