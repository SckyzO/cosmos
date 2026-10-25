import { clsx } from 'clsx';
import type { ReactNode, Ref } from 'react';
import { PICKER_SELECTED_BORDER, SelectedMark } from './SelectedMark';

export type OptionCardProps = {
  /** Stable identifier (used as React key + value). */
  id: string;
  /** Visible label. */
  label: string;
  /** Optional small description below the label. */
  desc?: string;
  /** Visual content rendered above the text — typically an icon, mockup, or preview. */
  preview?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  /** Roving tab stop, set by the picker's radio group. */
  tabIndex?: number;
  className?: string;
  /** Ref to the `<button role="radio">`. */
  ref?: Ref<HTMLButtonElement>;
};

/**
 * OptionCard — generic selectable card with a preview slot, label, and
 * optional description. Use to build pickers for icon styles, view modes,
 * layout variants, etc.
 */
export const OptionCard = ({
  label,
  desc,
  preview,
  active = false,
  onClick,
  tabIndex,
  className,
  ref,
}: OptionCardProps) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    role="radio"
    aria-checked={active}
    tabIndex={tabIndex}
    aria-label={label}
    className={clsx(
      'focus-visible:focus-indicator relative flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-3 transition-all',
      active
        ? clsx(PICKER_SELECTED_BORDER, 'bg-brand-50 dark:bg-brand-500/10')
        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
      className
    )}
  >
    {preview && <div className="flex h-10 w-10 items-center justify-center">{preview}</div>}
    <div className="text-center">
      <p
        className={clsx(
          'text-xs font-semibold',
          active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'
        )}
      >
        {label}
      </p>
      {desc && <p className="text-3xs text-gray-600 dark:text-gray-400">{desc}</p>}
    </div>
    {active && <SelectedMark className="absolute top-1.5 right-1.5" />}
  </button>
);
