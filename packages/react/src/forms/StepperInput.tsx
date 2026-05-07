import { clsx } from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';

export type StepperInputProps = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * StepperInput — number field with stacked ↑ / ↓ arrows embedded inside the
 * right edge. Compact alternative to NumberInput for settings panels.
 */
export const StepperInput = ({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  unit,
  disabled = false,
  className,
}: StepperInputProps) => {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const arrowBtn =
    'flex flex-1 items-center justify-center px-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div
      className={clsx(
        'flex h-9 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
        disabled && 'opacity-50',
        className
      )}
    >
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (!isNaN(n)) onChange(clamp(n));
        }}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className="h-full flex-1 [appearance:textfield] bg-transparent pr-1 pl-3 text-sm font-medium text-gray-700 focus:outline-none disabled:cursor-not-allowed dark:text-gray-200 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {unit && (
        <span className="flex items-center pr-1.5 text-xs text-gray-400 select-none dark:text-gray-500">
          {unit}
        </span>
      )}
      <div className="flex flex-col border-l border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          disabled={disabled || value >= max}
          tabIndex={-1}
          aria-label="Increase"
          className={arrowBtn}
        >
          <ChevronUp className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          disabled={disabled || value <= min}
          tabIndex={-1}
          aria-label="Decrease"
          className={clsx('border-t border-gray-200 dark:border-gray-700', arrowBtn)}
        >
          <ChevronDown className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
