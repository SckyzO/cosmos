import { clsx } from 'clsx';
import type { Ref } from 'react';
import { useFieldA11y, type FieldA11yProps } from './fieldA11y';
import { useNumberDraft } from './numberDraft';

export type NumberInputProps = FieldA11yProps & {
  name?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Tailwind width class for the inner input — default `w-20`. */
  width?: string;
  /**
   * Stretch the whole control to fill its parent (`flex w-full`). Default
   * `false` — the control sizes to its content (buttons + input width + unit).
   * Use `fullWidth` for form grids where the column should be filled.
   */
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  /** Ref to the number `<input>`, not to the `−` / `+` buttons. */
  ref?: Ref<HTMLInputElement>;
};

/**
 * NumberInput — number field with `−` / `+` buttons on the outside edges.
 * Replaces native `<input type="number">` spinners for cross-browser
 * consistency.
 *
 * Typing can pass through an empty field or a value outside `min`…`max`;
 * only valid values reach `onChange`, and leaving the field clamps.
 */
export const NumberInput = ({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  unit,
  width = 'w-20',
  fullWidth = false,
  disabled = false,
  className,
  name,
  ref,
  ...a11y
}: NumberInputProps) => {
  const fieldA11y = useFieldA11y(a11y);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const draft = useNumberDraft({ value, onChange, min, max });
  const btn =
    'flex h-full items-center justify-center px-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300';

  return (
    <div
      className={clsx(
        // `inline-flex` so the control sizes to its content by default; opt into
        // `flex w-full` via `fullWidth` for form grids that need the column.
        fullWidth ? 'flex w-full' : 'inline-flex',
        'focus-within:border-brand-500 h-9 overflow-hidden rounded-lg border border-gray-200 bg-white transition-colors dark:border-gray-700 dark:bg-gray-800',
        disabled && 'opacity-50',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        disabled={disabled || value <= min}
        tabIndex={-1}
        aria-label="Decrease"
        className={clsx('border-r border-gray-200 dark:border-gray-700', btn)}
      >
        <span className="text-base leading-none font-semibold text-gray-500 dark:text-gray-400">
          −
        </span>
      </button>
      <div className="flex items-center">
        <input
          ref={ref}
          type="number"
          name={name}
          {...fieldA11y}
          {...draft}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={clsx(
            'h-full [appearance:textfield] border-0 bg-transparent text-center text-sm font-medium text-gray-700 focus:outline-none disabled:cursor-not-allowed dark:text-gray-200 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            width
          )}
        />
        {unit && <span className="pr-1.5 text-xs text-gray-500 dark:text-gray-400">{unit}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        disabled={disabled || value >= max}
        tabIndex={-1}
        aria-label="Increase"
        className={clsx('border-l border-gray-200 dark:border-gray-700', btn)}
      >
        <span className="text-base leading-none font-semibold text-gray-500 dark:text-gray-400">
          +
        </span>
      </button>
    </div>
  );
};
