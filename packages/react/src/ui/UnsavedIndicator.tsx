import { clsx } from 'clsx';

export type UnsavedIndicatorProps = {
  visible: boolean;
  label?: string;
  className?: string;
};

/**
 * UnsavedIndicator — small amber label shown when a form has unsaved changes.
 * Pair with StatefulSaveButton in a header or toolbar.
 */
export const UnsavedIndicator = ({
  visible,
  label = 'Unsaved changes',
  className,
}: UnsavedIndicatorProps) => {
  if (!visible) return null;
  return (
    <span className={clsx('text-xs font-medium text-amber-500 dark:text-amber-400', className)}>
      {label}
    </span>
  );
};
