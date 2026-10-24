import { clsx } from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Ref } from 'react';
import { useFieldA11y, type FieldA11yProps } from './fieldA11y';
import { useNumberDraft } from './numberDraft';
import { useControllableState } from '../hooks/useControllableState';

export type NumberInputProps = FieldA11yProps & {
  name?: string;
  /** Value, when controlled. */
  value?: number;
  /** Initial value, when uncontrolled. Default `0`, brought within `min`…`max`. */
  defaultValue?: number;
  onChange?: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /**
   * Where the step buttons sit. `sides` (default): `−` / `+` on the outer edges,
   * centered text. `stacked`: ↑ / ↓ arrows stacked in a column inside the right
   * edge, left-aligned text: the compact form for settings panels.
   */
  controls?: 'sides' | 'stacked';
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
  /** Ref to the number `<input>`, not to the step buttons. */
  ref?: Ref<HTMLInputElement>;
};

const sideButton =
  'flex h-full items-center justify-center px-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300';

const stackedButton =
  'flex flex-1 items-center justify-center text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200 dark:active:bg-white/15';

/**
 * NumberInput — number field with step buttons. Replaces native
 * `<input type="number">` spinners for cross-browser consistency. `controls`
 * picks the layout: `−` / `+` on the outside edges (`sides`, the default) or
 * stacked ↑ / ↓ arrows embedded inside the right edge (`stacked`).
 *
 * Typing can pass through an empty field or a value outside `min`…`max`;
 * only valid values reach `onChange`, and leaving the field clamps.
 */
export const NumberInput = ({
  value: valueProp,
  defaultValue,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  unit,
  controls = 'sides',
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
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue: () => defaultValue ?? clamp(0),
    onChange,
    name: 'NumberInput.value',
  });
  const draft = useNumberDraft({ value, onChange: setValue, min, max });
  const stacked = controls === 'stacked';

  return (
    <div
      // The unit is dimmed with the disabled field: aria-disabled tells axe it
      // belongs to an inactive control, exempt from contrast (WCAG 1.4.3).
      aria-disabled={disabled || undefined}
      className={clsx(
        // `inline-flex` so the control sizes to its content by default; opt into
        // `flex w-full` via `fullWidth` for form grids that need the column.
        fullWidth ? 'flex w-full' : 'inline-flex',
        'focus-within:field-focus h-9 overflow-hidden rounded-lg border border-gray-200 bg-white transition-colors dark:border-gray-700 dark:bg-gray-800',
        disabled && 'opacity-50',
        className
      )}
    >
      {stacked ? (
        <>
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
              onClick={() => setValue(clamp(value + step))}
              disabled={disabled || value >= max}
              tabIndex={-1}
              aria-label="Increase"
              className={stackedButton}
            >
              <ChevronUp className="h-3 w-3" strokeWidth={2.25} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setValue(clamp(value - step))}
              disabled={disabled || value <= min}
              tabIndex={-1}
              aria-label="Decrease"
              className={clsx('border-t border-gray-200 dark:border-gray-700', stackedButton)}
            >
              <ChevronDown className="h-3 w-3" strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setValue(clamp(value - step))}
            disabled={disabled || value <= min}
            tabIndex={-1}
            aria-label="Decrease"
            className={clsx('border-r border-gray-200 dark:border-gray-700', sideButton)}
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
            {unit && (
              <span className="pr-1.5 text-xs text-gray-500 dark:text-gray-400">{unit}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setValue(clamp(value + step))}
            disabled={disabled || value >= max}
            tabIndex={-1}
            aria-label="Increase"
            className={clsx('border-l border-gray-200 dark:border-gray-700', sideButton)}
          >
            <span className="text-base leading-none font-semibold text-gray-500 dark:text-gray-400">
              +
            </span>
          </button>
        </>
      )}
    </div>
  );
};
