import { clsx } from 'clsx';
import { Clock } from 'lucide-react';
import {
  forwardRef,
  useId,
  type ChangeEvent,
  type InputHTMLAttributes,
} from 'react';

export type TimePickerProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> & {
  label?: string;
  description?: string;
  error?: string;
  /** HH:MM (24h) string. */
  value?: string;
  defaultValue?: string;
  onChange?: (time: string, e: ChangeEvent<HTMLInputElement>) => void;
  /** Minute granularity. 1 = any minute, 60 = hours only. Default 1. */
  step?: number;
  /** Earliest time (HH:MM). */
  min?: string;
  /** Latest time (HH:MM). */
  max?: string;
};

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(function TimePicker(
  {
    label,
    description,
    error,
    value,
    defaultValue,
    onChange,
    step,
    min,
    max,
    disabled,
    id,
    name,
    className,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? name ?? generatedId;
  const stepSeconds = step !== undefined ? step * 60 : undefined;

  return (
    <div className="block">
      {label && (
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div className="relative inline-flex h-9 w-full items-center">
        <Clock
          aria-hidden
          className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400"
        />
        <input
          ref={ref}
          id={fieldId}
          name={name}
          type="time"
          value={value}
          defaultValue={defaultValue}
          step={stepSeconds}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value, e)}
          className={clsx(
            'h-full w-full rounded-lg border bg-white pl-9 pr-3 text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white',
            // Hide the browser-native time picker icon (Chrome adds an extra clock on the right) so only our left-icon shows.
            '[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer',
            error
              ? 'border-red-400 focus:border-red-500 dark:border-red-500/60'
              : 'focus:border-brand-500 border-gray-200 dark:border-gray-700',
            className,
          )}
          {...rest}
        />
      </div>
      {(error || description) && (
        <p
          className={clsx(
            'mt-1 text-xs',
            error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400',
          )}
        >
          {error ?? description}
        </p>
      )}
    </div>
  );
});
