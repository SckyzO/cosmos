import { clsx } from 'clsx';
import { Clock } from 'lucide-react';
import { useId, type ChangeEvent, type ComponentPropsWithRef } from 'react';
import {
  FIELD_HEIGHT,
  FIELD_ICON_LEFT,
  FIELD_ICON_SIZE,
  FIELD_PAD_LEFT_ICON,
  FIELD_PAD_RIGHT,
  fieldClass,
  type FieldSize,
} from './fieldRecipe';
import { RequiredMark } from './RequiredMark';

export type TimePickerProps = Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'value' | 'onChange' | 'size'
> & {
  label?: string;
  description?: string;
  error?: string;
  /**
   * Height and text size, aligned on Button's. Default `md`. Replaces the native
   * `size` attribute, which is omitted from the props.
   */
  size?: FieldSize;
  /** Marks the field required: an asterisk after the label, `required` and `aria-required` on the input. */
  required?: boolean;
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
  /**
   * Stretch the input to fill its parent (`w-full`). Default `false` —
   * the input sizes itself with a sensible `min-w-[140px]`. Use `fullWidth`
   * in form grids that should fill the column.
   */
  fullWidth?: boolean;
};

export function TimePicker({
  label,
  description,
  error,
  size = 'md',
  required,
  value,
  defaultValue,
  onChange,
  step,
  min,
  max,
  disabled,
  id,
  name,
  fullWidth = false,
  className,
  ref,
  ...rest
}: TimePickerProps) {
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
          {required && <RequiredMark />}
        </label>
      )}
      <div
        className={clsx(
          'relative inline-flex items-center',
          FIELD_HEIGHT[size],
          fullWidth ? 'w-full' : 'min-w-[140px]'
        )}
      >
        <Clock
          aria-hidden
          className={clsx(
            'pointer-events-none absolute text-gray-400',
            FIELD_ICON_LEFT[size],
            FIELD_ICON_SIZE[size]
          )}
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
          required={required}
          aria-required={required || undefined}
          onChange={(e) => onChange?.(e.target.value, e)}
          className={clsx(
            'h-full w-full',
            fieldClass({ size, invalid: !!error, fixedHeight: false }),
            FIELD_PAD_LEFT_ICON[size],
            FIELD_PAD_RIGHT[size],
            // Hide the browser-native time picker icon (Chrome adds an extra clock on the right) so only our left-icon shows.
            '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0',
            className
          )}
          {...rest}
        />
      </div>
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
    </div>
  );
}
