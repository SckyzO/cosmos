import { clsx } from 'clsx';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import { FloatingPanel } from '../ui/FloatingPanel';
import { setRef } from '../ui/mergeRefs';
import { Calendar } from './Calendar';
import { useControllableState } from '../hooks/useControllableState';
import { FIELD_ICON_SIZE, FIELD_PAD_X, fieldClass, type FieldSize } from './fieldRecipe';
import { RequiredMark } from './RequiredMark';

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
  /** Height and text size of the trigger(s), aligned on Button's. Default `md`. */
  size?: FieldSize;
  /**
   * Marks the field required: an asterisk after the label. A button can't carry
   * `aria-required`, so the label also tells assistive technology ("required").
   */
  required?: boolean;
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
  /**
   * Open state of the calendar, when controlled. Opened this way, it anchors to the
   * trigger the label points at, as a click on it does.
   */
  open?: boolean;
  /** Initial open state of the calendar, when uncontrolled. Default `false`. */
  defaultOpen?: boolean;
  /** Called with the open state to move to. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Ref to the trigger `<button>` the label points at: the only one in `single`
   * mode, the start date's in `range` mode.
   */
  ref?: Ref<HTMLButtonElement>;
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
    size = 'md',
    required,
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
    ref,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
  } = props;

  const isRange = props.mode === 'range';
  const fieldId = useId();
  const fromRef = useRef<HTMLButtonElement>(null);
  const toRef = useRef<HTMLButtonElement>(null);
  // The consumer's `ref` gets the same trigger as `fromRef`, the one the label points at.
  const setFromTrigger = useCallback(
    (node: HTMLButtonElement | null) => {
      fromRef.current = node;
      setRef(ref, node);
    },
    [ref]
  );
  // The trigger that opened the calendar: focus goes back to it on close, and the
  // calendar stays anchored under it.
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const [openerSide, setOpenerSide] = useState<'from' | 'to'>('from');
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'DatePicker.open',
  });

  // ── Value plumbing (controlled vs uncontrolled) ─────────────────────────────
  // One state per mode: each only reads the props of its own mode.
  const single = isRange ? undefined : (props as SingleProps);
  const range = isRange ? (props as RangeProps) : undefined;
  const [singleState, setSingle] = useControllableState<Date | undefined>({
    value: single?.value,
    defaultValue: single?.defaultValue,
    onChange: single?.onChange,
    name: 'DatePicker.value',
  });
  const [rangeState, setRange] = useControllableState<DateRange>({
    value: range?.value,
    defaultValue: range?.defaultValue ?? EMPTY_RANGE,
    onChange: range?.onChange,
    name: 'DatePicker.value',
  });

  const selectedSingle = isRange ? undefined : singleState;
  const selectedRange = isRange ? (rangeState ?? EMPTY_RANGE) : EMPTY_RANGE;

  // ── Calendar bounds ─────────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const startMonth = fromDate ?? new Date(fromYear ?? currentYear - 10, 0, 1);
  const endMonth = toDate ?? new Date(toYear ?? currentYear + 10, 11, 31);
  const initialMonth = isRange
    ? (selectedRange.from ?? selectedRange.to ?? new Date())
    : (selectedSingle ?? new Date());
  const [month, setMonth] = useState<Date>(initialMonth);

  // ── Popover open/close ──────────────────────────────────────────────────────
  // What opening does: remember the trigger focus goes back to, anchor the panel
  // to it and show the month of the selection.
  const prepareOpen = (side: 'from' | 'to') => {
    openerRef.current = side === 'to' ? toRef.current : fromRef.current;
    setOpenerSide(side);
    setMonth(initialMonth);
  };
  // Whether this opening is set up, by a trigger click or below.
  const preparedRef = useRef(false);

  const toggle = (next: boolean, side: 'from' | 'to' = 'from') => {
    if (next) {
      prepareOpen(side);
      preparedRef.current = true;
    }
    setOpen(next);
  };

  // Opened without a trigger click (`open`, `defaultOpen`): set up as a click on
  // the start trigger would.
  useLayoutEffect(() => {
    if (!open) {
      preparedRef.current = false;
      return;
    }
    if (preparedRef.current) return;
    preparedRef.current = true;
    prepareOpen('from');
  });

  // ── Selection commit ────────────────────────────────────────────────────────
  const commitSingle = (date: Date | undefined) => {
    setSingle(date);
    if (date) setOpen(false);
  };

  const commitRange = (next: DateRange) => {
    setRange(next);
    if (next.from && next.to) setOpen(false);
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
        className="text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 focus-visible:focus-indicator h-ctrl-28 inline-flex items-center rounded-md px-3 text-xs font-medium transition-colors"
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
        className="focus-visible:focus-indicator h-ctrl-28 inline-flex items-center rounded-md px-3 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
      >
        Clear
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="bg-brand-500 hover:bg-brand-600 focus-visible:focus-indicator h-ctrl-28 inline-flex items-center rounded-md px-3 text-xs font-medium text-white transition-colors"
      >
        Done
      </button>
    </div>
  );

  // ── Trigger rendering ───────────────────────────────────────────────────────
  const triggerClass = clsx(
    'items-center gap-2 text-left',
    fieldClass({ size, invalid: !!error }),
    FIELD_PAD_X[size]
  );

  const renderTrigger = (
    id: string | undefined,
    side: 'from' | 'to',
    date: Date | undefined,
    placeholder: string
  ) => (
    <button
      ref={side === 'from' ? setFromTrigger : toRef}
      id={id}
      type="button"
      disabled={disabled}
      aria-haspopup="dialog"
      aria-expanded={open}
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
      <CalendarIcon className={clsx('shrink-0 text-gray-400', FIELD_ICON_SIZE[size])} aria-hidden />
      <span
        className={clsx(
          'flex-1 truncate',
          date ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
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
          {required && <RequiredMark srText=" (required)" />}
        </label>
      )}

      {isRange ? (
        <div className={clsx('flex items-center gap-2', !fullWidth && 'w-fit')}>
          {renderTrigger(
            fieldId,
            'from',
            selectedRange.from,
            (props as RangeProps).fromPlaceholder ?? 'Start date'
          )}
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">to</span>
          {renderTrigger(
            undefined,
            'to',
            selectedRange.to,
            (props as RangeProps).toPlaceholder ?? 'End date'
          )}
        </div>
      ) : (
        renderTrigger(
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
            error ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {error ?? description}
        </p>
      )}

      {/* Kept under the trigger that opened it while the page scrolls or resizes. A
          ref object per side, so switching sides re-measures. */}
      <FloatingPanel
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={openerRef}
        anchorRef={openerSide === 'to' ? toRef : fromRef}
        placement={{ side: 'bottom', align: 'start', offset: 6 }}
        role="dialog"
        tabIndex={-1}
        aria-label={label ? `${label} calendar` : 'Calendar'}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl outline-none dark:border-gray-700 dark:bg-gray-900"
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
      </FloatingPanel>
    </div>
  );
};
