import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export type ColorSwatchProps = {
  /** Color hex (e.g. `#465fff`). */
  hex: string;
  /** Visible label below the swatch. */
  label: string;
  /** Whether this swatch is currently selected. */
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

/**
 * ColorSwatch — single colour pick button. A filled rectangle with the
 * colour, an optional checkmark when active, and a small caption below.
 */
export const ColorSwatch = ({
  hex,
  label,
  active = false,
  onClick,
  className,
}: ColorSwatchProps) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    aria-pressed={active}
    className={clsx(
      'relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 transition-all',
      active
        ? 'scale-105 border-gray-400 dark:border-gray-200'
        : 'border-transparent hover:scale-[1.02] hover:border-gray-200 dark:hover:border-gray-700',
      className
    )}
  >
    <span
      className="flex h-8 w-full items-center justify-center rounded-lg"
      style={{ backgroundColor: hex }}
    >
      {active && <Check className="h-3.5 w-3.5 text-white drop-shadow" aria-hidden />}
    </span>
    <span
      className={clsx(
        'text-[10px] leading-none font-medium',
        active ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
      )}
    >
      {label}
    </span>
  </button>
);
