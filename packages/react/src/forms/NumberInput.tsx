import { clsx } from 'clsx';

export type NumberInputProps = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Tailwind width class for the inner input — default `w-20`. */
  width?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * NumberInput — number field with `−` / `+` buttons on the outside edges.
 * Replaces native `<input type="number">` spinners for cross-browser
 * consistency.
 */
export const NumberInput = ({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  unit,
  width = 'w-20',
  disabled = false,
  className,
}: NumberInputProps) => {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const btn =
    'flex h-full items-center justify-center px-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300';

  return (
    <div
      className={clsx(
        'flex h-9 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
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
          className={clsx(
            'h-full [appearance:textfield] border-0 bg-transparent text-center text-sm font-medium text-gray-700 focus:outline-none disabled:cursor-not-allowed dark:text-gray-200 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            width
          )}
        />
        {unit && <span className="pr-1.5 text-xs text-gray-400 dark:text-gray-500">{unit}</span>}
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
