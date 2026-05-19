import { clsx } from 'clsx';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from './Calendar';

export type DatePickerProps = {
  label?: string;
  description?: string;
  error?: string;
  /** Selected date. Pass `undefined` for empty. */
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date | undefined) => void;
  /** Placeholder when no date is selected. */
  placeholder?: string;
  /** Lock the field. */
  disabled?: boolean;
  /** Earliest selectable date (inclusive). */
  fromDate?: Date;
  /** Latest selectable date (inclusive). */
  toDate?: Date;
  /** Year range for the year dropdown. Default: current year ±10. */
  fromYear?: number;
  toYear?: number;
  /** Caption style. `dropdown` (default) shows month + year as `<select>`s — much faster than chevrons for distant dates. */
  captionLayout?: 'dropdown' | 'dropdown-months' | 'dropdown-years' | 'label';
  /** Show a "Today" shortcut button below the calendar. Default `true`. */
  showTodayButton?: boolean;
  /** Custom formatter for the displayed value. Default `toLocaleDateString()`. */
  format?: (date: Date) => string;
  /** Optional footer rendered below the calendar (replaces the Today button). */
  calendarFooter?: ReactNode;
  /**
   * Stretch the trigger to fill its parent (`w-full`). Default `false` —
   * the trigger sizes itself with a sensible `min-w-[200px]` so a bare
   * picker doesn't look stretched on a wide background. Pass `fullWidth`
   * inside form grids where the column should be filled.
   */
  fullWidth?: boolean;
  className?: string;
};

const defaultFormat = (d: Date): string =>
  d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

export const DatePicker = ({
  label,
  description,
  error,
  value,
  defaultValue,
  onChange,
  placeholder = 'Pick a date',
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
}: DatePickerProps) => {
  const fieldId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<Date | undefined>(defaultValue);
  const selected = isControlled ? value : internalValue;

  // Default year range: current ±10 unless explicitly set.
  const currentYear = new Date().getFullYear();
  const startMonth = fromDate ?? new Date(fromYear ?? currentYear - 10, 0, 1);
  const endMonth = toDate ?? new Date(toYear ?? currentYear + 10, 11, 31);

  // Controlled month state so the "Today" button can jump back instantly.
  const [month, setMonth] = useState<Date>(selected ?? new Date());

  const refreshRect = useCallback(() => {
    if (triggerRef.current) setTriggerRect(triggerRef.current.getBoundingClientRect());
  }, []);

  const toggle = (next: boolean) => {
    if (next) {
      refreshRect();
      // Re-anchor the calendar on the selected date when reopening.
      setMonth(selected ?? new Date());
    }
    setOpen(next);
  };

  useEffect(() => {
    if (!open) return;
    const handleScroll = () => refreshRect();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('resize', handleScroll);
    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open, refreshRect]);

  const handleSelect = (date: Date | undefined) => {
    if (!isControlled) setInternalValue(date);
    onChange?.(date);
    if (date) setOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setMonth(today);
    handleSelect(today);
  };

  const footer =
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
      <button
        ref={triggerRef}
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => toggle(!open)}
        className={clsx(
          // `inline-flex` so the trigger sizes to its content by default;
          // `min-w-[200px]` keeps it readable without being a hairline.
          // `fullWidth` opts into `flex w-full` for column-filling form grids.
          fullWidth ? 'flex w-full' : 'inline-flex min-w-[200px]',
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
            selected ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
          )}
        >
          {selected ? format(selected) : placeholder}
        </span>
      </button>
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
        triggerRect &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
            <div
              role="dialog"
              aria-label={label ? `${label} calendar` : 'Calendar'}
              style={{ top: triggerRect.bottom + 6, left: triggerRect.left }}
              className="fixed z-[9999] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
            >
              <Calendar
                mode="single"
                selected={selected}
                onSelect={handleSelect}
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
                footer={footer}
              />
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
