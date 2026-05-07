import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { TooltipHelp } from '../ui/Tooltip';

export type FormRowProps = {
  label: string;
  description?: string;
  /** Renders a `(?)` help icon next to the label. */
  tooltip?: string;
  children: ReactNode;
  className?: string;
};

/**
 * FormRow — horizontal setting row : label (+ optional description and help)
 * on the left, control on the right. Pair multiple FormRows inside a
 * `divide-y` container to build settings panels.
 */
export const FormRow = ({ label, description, tooltip, children, className }: FormRowProps) => (
  <div className={clsx('flex items-center justify-between gap-4', className)}>
    <div className="min-w-0 flex-1">
      <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {tooltip && <TooltipHelp text={tooltip} />}
      </p>
      {description && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);
