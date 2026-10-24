import { clsx } from 'clsx';
import { useId, type ReactNode } from 'react';
import { TooltipHelp } from '../ui/Tooltip';
import { FormRowContext } from './fieldA11y';

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
 * `divide-y` container to build settings panels. The Cosmos controls inside
 * (Toggle, NumberInput, SearchInput, SelectInput, SegmentedControl) take the
 * label as their name and the description as their description; any other
 * control needs its own `aria-label`.
 */
export const FormRow = ({ label, description, tooltip, children, className }: FormRowProps) => {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-desc` : undefined;
  return (
    <div className={clsx('flex items-center justify-between gap-4', className)}>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          <span id={labelId}>{label}</span>
          {tooltip && <TooltipHelp text={tooltip} />}
        </p>
        {description && (
          <p id={descriptionId} className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">
        <FormRowContext.Provider value={{ labelId, descriptionId }}>
          {children}
        </FormRowContext.Provider>
      </div>
    </div>
  );
};
