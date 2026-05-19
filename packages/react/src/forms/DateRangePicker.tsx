import { clsx } from 'clsx';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from './Calendar';

export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export type DateRangePickerProps = {
  label?: string;
  description?: string;
  error?: string;
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  disabled?: boolean;
  /** Earliest selectable date (inclusive). */
  fromDate?: Date;
  /** Latest selectable date (inclusive). */
  toDate?: Date;
  /** Year range for the year dropdown. Default: current year ±10. */
  fromYear?: number;
  toYear?: number;
  /** Custom formatter for both displayed values. Defaults to "DD MMM YYYY". */
  format?: (date: Date) => string;
  /** Stretch both triggers to share the available width (`flex-1`). */
  fullWidth?: boolean;
  className?: string;
};

const defaultFormat = (d: Date): string =>
  d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

const EMPTY: DateRange = { from: undefined, to: undefined };

export const DateRangePicker = ({
  label,
  description,
  error,
  value,
  defaultValue,
  onChange,
  fromPlaceholder = 'Start date',
  toPlaceholder = 'End date',
  disabled = false,
  fromDate,
  toDate,
  fromYear,
  toYear,
  format = defaultFormat,
  fullWidth = false,
  className,
}: DateRangePickerProps) => {
  const fieldId = useId();
  const fromRef = useRef<HTMLButtonElement>(null);
  const toRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  // Which trigger anchored the popover, so it lines up under the clicked side.
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<DateRange>(defaultValue ?? EMPTY);
  const selected = isControlled ? value : internalValue;

  const currentYear = new Date().getFullYear();
  const startMonth = fromDate ?? new Date(fromYear ?? currentYear - 10, 0, 1);
  const endMonth = toDate ?? new Date(toYear ?? currentYear + 10, 11, 31);

  const [month, setMonth] = useState<Date>(selected.from ?? new Date());

  const openWith = useCallback((side: 'from' | 'to') => {
    const r = side === 'from' ? fromRef.current : toRef.current;
    if (!r) return;
    setAnchorRect(r.getBoundingClientRect());
    setMonth((current) => selected.from ?? selected.to ?? current);
    setOpen(true);
    // (selected is captured in closure — fine, only used for initial month anchor.)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const refresh = () => {
      if (!anchorRect) return;
      // Re-anchor if scroll/resize moved the page; pick whichever trigger is in view.
      const r = (fromRef.current ?? toRef.current)?.getBoundingClientRect();
      if (r) setAnchorRect(r);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('resize', refresh);
    window.addEventListener('scroll', refresh, true);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', refresh);
      window.removeEventListener('scroll', refresh, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, anchorRect]);

  const commit = (next: DateRange) => {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
    // Close once a full range is picked.
    if (next.from && next.to) setOpen(false);
  };

  const renderTrigger = (side: 'from' | 'to') => {
    const date = side === 'from' ? selected.from : selected.to;
    const placeholder = side === 'from' ? fromPlaceholder : toPlaceholder;
    return (
      <button
        ref={side === 'from' ? fromRef : toRef}
        id={side === 'from' ? fieldId : undefined}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => openWith(side)}
        className={clsx(
          fullWidth ? 'flex flex-1' : 'inline-flex min-w-[180px]',
          'h-9 items-center gap-2 rounded-lg border bg-white px-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800',
          error
            ? 'border-red-400 focus:border-red-500 focus:outline-none dark:border-red-500/60'
            : 'focus:border-brand-500 border-gray-200 focus:outline-none dark:border-gray-700'
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        <span
          className={clsx(
            'flex-1 truncate',
            date ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
          )}
        >
          {date ? format(date) : placeholder}
        </span>
      </button>
    );
  };

  return (
    <div className={clsx('block', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div className={clsx('flex items-center gap-2', !fullWidth && 'w-fit')}>
        {renderTrigger('from')}
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">to</span>
        {renderTrigger('to')}
      </div>
      {(error || description) && (
        <p
          className={clsx(
            'mt-1 text-xs',
            error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {error ?? description}
        </p>
      )}
      {open &&
        anchorRect &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
            <div
              role="dialog"
              aria-label={label ? `${label} range` : 'Date range'}
              style={{ top: anchorRect.bottom + 6, left: anchorRect.left }}
              className="fixed z-[9999] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
            >
              <Calendar
                mode="range"
                selected={selected.from || selected.to ? selected : undefined}
                onSelect={(r) => commit({ from: r?.from, to: r?.to })}
                month={month}
                onMonthChange={setMonth}
                captionLayout="dropdown"
                startMonth={startMonth}
                endMonth={endMonth}
                disabled={
                  fromDate || toDate
                    ? [
                        ...(fromDate ? [{ before: fromDate }] : []),
                        ...(toDate ? [{ after: toDate }] : []),
                      ]
                    : undefined
                }
                footer={
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => commit(EMPTY)}
                      className="inline-flex h-7 items-center rounded-md px-3 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="bg-brand-500 hover:bg-brand-600 inline-flex h-7 items-center rounded-md px-3 text-xs font-medium text-white transition-colors"
                    >
                      Done
                    </button>
                  </div>
                }
              />
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
