import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

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
  className?: string;
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
  className,
}: OptionCardProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    aria-label={label}
    className={clsx(
      'relative flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-3 transition-all',
      active
        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
      className
    )}
  >
    {preview && <div className="flex h-10 w-10 items-center justify-center">{preview}</div>}
    <div className="text-center">
      <p
        className={clsx(
          'text-xs font-semibold',
          active ? 'text-brand-500' : 'text-gray-700 dark:text-gray-300'
        )}
      >
        {label}
      </p>
      {desc && <p className="text-[10px] text-gray-400 dark:text-gray-500">{desc}</p>}
    </div>
    {active && (
      <span className="bg-brand-500 absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full">
        <Check className="h-2.5 w-2.5 text-white" aria-hidden />
      </span>
    )}
  </button>
);
