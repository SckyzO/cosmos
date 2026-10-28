import { clsx } from 'clsx';
import type { Ref } from 'react';
import { PICKER_SELECTED_BORDER, SelectedMark } from './SelectedMark';

export type ColorSwatchProps = {
  /** Color hex (e.g. `#465fff`). */
  hex: string;
  /** Visible label below the swatch. */
  label: string;
  /** Whether this swatch is currently selected. */
  active?: boolean;
  onClick?: () => void;
  /** Roving tab stop, set by the picker's radio group. */
  tabIndex?: number;
  className?: string;
  /** Ref to the `<button role="radio">`. */
  ref?: Ref<HTMLButtonElement>;
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
  tabIndex,
  className,
  ref,
}: ColorSwatchProps) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    role="radio"
    aria-checked={active}
    tabIndex={tabIndex}
    className={clsx(
      'focus-visible:focus-indicator relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 transition-all',
      active
        ? PICKER_SELECTED_BORDER
        : 'border-transparent hover:scale-[1.02] hover:border-gray-200 dark:hover:border-gray-700',
      className
    )}
  >
    <span
      className="flex h-8 w-full items-center justify-center rounded-lg"
      style={{ backgroundColor: hex }}
    />
    {active && <SelectedMark className="inset-e-1 absolute top-1" />}
    <span
      className={clsx(
        'text-2xs leading-none font-medium',
        active ? 'text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'
      )}
    >
      {label}
    </span>
  </button>
);
