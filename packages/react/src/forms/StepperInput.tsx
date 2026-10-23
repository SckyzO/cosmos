import { clsx } from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Ref } from 'react';
import { useFieldA11y, type FieldA11yProps } from './fieldA11y';
import { useNumberDraft } from './numberDraft';

export type StepperInputProps = FieldA11yProps & {
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
   * `false` — the control sizes to its content (input width + unit + arrows).
   */
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  /** Ref to the number `<input>`, not to the ↑ / ↓ buttons. */
  ref?: Ref<HTMLInputElement>;
};

/**
 * StepperInput — number field with stacked ↑ / ↓ arrows embedded inside the
 * right edge. Compact alternative to NumberInput for settings panels.
 *
 * Typing can pass through an empty field or a value outside `min`…`max`;
 * only valid values reach `onChange`, and leaving the field clamps.
 */
export const StepperInput = ({
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
}: StepperInputProps) => {
  const fieldA11y = useFieldA11y(a11y);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const draft = useNumberDraft({ value, onChange, min, max });
  const arrowBtn =
    'flex flex-1 items-center justify-center text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200 dark:active:bg-white/15';

  return (
    <div
      className={clsx(
        fullWidth ? 'flex w-full' : 'inline-flex',
        'focus-within:border-brand-500 h-9 overflow-hidden rounded-lg border border-gray-200 bg-white transition-colors dark:border-gray-700 dark:bg-gray-800',
        disabled && 'opacity-50',
        className
      )}
    >
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
          // min-w-0: in a narrower container the input gives way, not the arrows.
          'h-full min-w-0 [appearance:textfield] bg-transparent pr-1 pl-3 text-sm font-medium text-gray-700 focus:outline-none disabled:cursor-not-allowed dark:text-gray-200 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          fullWidth ? 'flex-1' : width
        )}
      />
      {unit && (
        <span className="flex shrink-0 items-center pr-1.5 text-xs text-gray-500 select-none dark:text-gray-400">
          {unit}
        </span>
      )}
      {/* Fixed width keeps the chevrons clear of the rounded corner. */}
      <div className="flex w-7 shrink-0 flex-col border-l border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          disabled={disabled || value >= max}
          tabIndex={-1}
          aria-label="Increase"
          className={arrowBtn}
        >
          <ChevronUp className="h-3 w-3" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          disabled={disabled || value <= min}
          tabIndex={-1}
          aria-label="Decrease"
          className={clsx('border-t border-gray-200 dark:border-gray-700', arrowBtn)}
        >
          <ChevronDown className="h-3 w-3" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </div>
  );
};
