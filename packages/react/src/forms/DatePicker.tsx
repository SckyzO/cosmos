import { clsx } from 'clsx';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from './Calendar';

export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export type DatePickerMode = 'single' | 'range';

// Discriminated union — the `mode` prop changes the shape of `value`,
// `defaultValue`, and `onChange`. Without a union TypeScript would force
// consumers to type-narrow at every call site.
type SingleProps = {
  mode?: 'single';
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date | undefined) => void;
  /** Placeholder for the (single) trigger. */
  placeholder?: string;
};

type RangeProps = {
  mode: 'range';
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;
  /** Placeholder for the FROM trigger. */
  fromPlaceholder?: string;
  /** Placeholder for the TO trigger. */
  toPlaceholder?: string;
};

type CommonProps = {
  label?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  /** Earliest selectable date (inclusive). */
  fromDate?: Date;
  /** Latest selectable date (inclusive). */
  toDate?: Date;
  /** Year range for the year dropdown. Default: current year ±10. */
  fromYear?: number;
  toYear?: number;
  /** Caption style. `dropdown` (default) shows month + year as `<select>`s. */
  captionLayout?: 'dropdown' | 'dropdown-months' | 'dropdown-years' | 'label';
  /** Single mode only — show a "Today" shortcut button below the calendar. Default `true`. */
  showTodayButton?: boolean;
  /** Custom formatter for displayed dates. Default `DD MMM YYYY`. */
  format?: (date: Date) => string;
  /** Single mode only — fully replace the default footer (Today button) with custom JSX. */
  calendarFooter?: ReactNode;
  /** Stretch the trigger(s) to fill the parent. */
  fullWidth?: boolean;
  className?: string;
};

export type DatePickerProps = (SingleProps | RangeProps) & CommonProps;

const defaultFormat = (d: Date): string =>
  d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

const EMPTY_RANGE: DateRange = { from: undefined, to: undefined };

export const DatePicker = (props: DatePickerProps) => {
  const {
    label,
    description,
    error,
    disabled = false,
    fromDate,
    toDate,
    fromYear,
    toYear,
    captionLayout = 'dropdown',
    showTodayButton = true,
    format = defaultFormat,
    calendarFooter,
    fullWidth = false,
    className,
  } = props;

  const isRange = props.mode === 'range';
  const fieldId = useId();
  const fromRef = useRef<HTMLButtonElement>(null);
  const toRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  // ── Value plumbing (controlled vs uncontrolled) ─────────────────────────────
  const isControlled = props.value !== undefined;
  const [internalSingle, setInternalSingle] = useState<Date | undefined>(
    !isRange ? (props as SingleProps).defaultValue : undefined
  );
  const [internalRange, setInternalRange] = useState<DateRange>(
    isRange ? ((props as RangeProps).defaultValue ?? EMPTY_RANGE) : EMPTY_RANGE
  );

  const selectedSingle = isRange
    ? undefined
    : isControlled
      ? (props as SingleProps).value
      : internalSingle;
  const selectedRange = isRange
    ? isControlled
      ? ((props as RangeProps).value ?? EMPTY_RANGE)
      : internalRange
    : EMPTY_RANGE;

  // ── Calendar bounds ─────────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const startMonth = fromDate ?? new Date(fromYear ?? currentYear - 10, 0, 1);
  const endMonth = toDate ?? new Date(toYear ?? currentYear + 10, 11, 31);
  const initialMonth = isRange
    ? (selectedRange.from ?? selectedRange.to ?? new Date())
    : (selectedSingle ?? new Date());
  const [month, setMonth] = useState<Date>(initialMonth);

  // ── Popover open/close ──────────────────────────────────────────────────────
  const anchor = useCallback((side: 'from' | 'to' = 'from') => {
    const r = side === 'to' ? toRef.current : fromRef.current;
    if (r) setAnchorRect(r.getBoundingClientRect());
  }, []);

  const toggle = (next: boolean, side: 'from' | 'to' = 'from') => {
    if (next) {
      anchor(side);
      setMonth(initialMonth);
    }
    setOpen(next);
  };

  useEffect(() => {
    if (!open) return;
    const refresh = () => anchor('from');
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
  }, [open, anchor]);

  // ── Selection commit ────────────────────────────────────────────────────────
  const commitSingle = (date: Date | undefined) => {
    if (!isControlled) setInternalSingle(date);
    (props as SingleProps).onChange?.(date);
    if (date) setOpen(false);
  };

  const commitRange = (range: DateRange) => {
    if (!isControlled) setInternalRange(range);
    (props as RangeProps).onChange?.(range);
    if (range.from && range.to) setOpen(false);
  };

  // ── Footer (single mode) ────────────────────────────────────────────────────
  const handleToday = () => {
    const today = new Date();
    setMonth(today);
    commitSingle(today);
  };

  const singleFooter =
    calendarFooter ??
    (showTodayButton ? (
      <button
        type="button"
        onClick={handleToday}
        className="text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 inline-flex h-7 items-center rounded-md px-3 text-xs font-medium transition-colors"
      >
        Today
      </button>
    ) : undefined);

  // Range mode always exposes Clear + Done — closing without picking the
  // second bound shouldn't be a dead end.
  const rangeFooter = (
    <div className="flex items-center justify-between gap-2 pt-2">
      <button
        type="button"
        onClick={() => commitRange(EMPTY_RANGE)}
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
  );

  // ── Trigger rendering ───────────────────────────────────────────────────────
  const triggerClass = clsx(
    'h-9 items-center gap-2 rounded-lg border bg-white px-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800',
    error
      ? 'border-red-400 focus:border-red-500 focus:outline-none dark:border-red-500/60'
      : 'focus:border-brand-500 border-gray-200 focus:outline-none dark:border-gray-700'
  );

  const renderTrigger = (
    ref: React.RefObject<HTMLButtonElement | null>,
    id: string | undefined,
    side: 'from' | 'to',
    date: Date | undefined,
    placeholder: string
  ) => (
    <button
      ref={ref}
      id={id}
      type="button"
      disabled={disabled}
      aria-haspopup="dialog"
      aria-expanded={open}
      // `react-hooks/refs` flags this because `toggle → anchor → ref.current`,
      // but the chain only runs in the click callback, never during render.
      // eslint-disable-next-line react-hooks/refs
      onClick={() => toggle(!open, side)}
      className={clsx(
        fullWidth
          ? 'flex flex-1'
          : isRange
            ? 'inline-flex min-w-[180px]'
            : 'inline-flex min-w-[200px]',
        triggerClass
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

  // ── Render ──────────────────────────────────────────────────────────────────
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

      {isRange ? (
        <div className={clsx('flex items-center gap-2', !fullWidth && 'w-fit')}>
          {renderTrigger(
            fromRef,
            fieldId,
            'from',
            selectedRange.from,
            (props as RangeProps).fromPlaceholder ?? 'Start date'
          )}
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">to</span>
          {renderTrigger(
            toRef,
            undefined,
            'to',
            selectedRange.to,
            (props as RangeProps).toPlaceholder ?? 'End date'
          )}
        </div>
      ) : (
        renderTrigger(
          fromRef,
          fieldId,
          'from',
          selectedSingle,
          (props as SingleProps).placeholder ?? 'Pick a date'
        )
      )}

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
              aria-label={label ? `${label} calendar` : 'Calendar'}
              style={{ top: anchorRect.bottom + 6, left: anchorRect.left }}
              className="fixed z-[9999] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
            >
              {isRange ? (
                <Calendar
                  mode="range"
                  selected={selectedRange.from || selectedRange.to ? selectedRange : undefined}
                  onSelect={(r) => commitRange({ from: r?.from, to: r?.to })}
                  month={month}
                  onMonthChange={setMonth}
                  captionLayout={captionLayout}
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
                  footer={rangeFooter}
                />
              ) : (
                <Calendar
                  mode="single"
                  selected={selectedSingle}
                  onSelect={commitSingle}
                  month={month}
                  onMonthChange={setMonth}
                  captionLayout={captionLayout}
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
                  footer={singleFooter}
                />
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
