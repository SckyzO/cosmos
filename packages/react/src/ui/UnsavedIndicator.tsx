import { clsx } from 'clsx';
import { useLabels } from '../labels/labelsContext';
import { UNSAVED_INDICATOR_LABELS, type UnsavedIndicatorLabels } from './labels';

export type UnsavedIndicatorProps = {
  visible: boolean;
  /** The text. Default `labels.unsaved`, 'Unsaved changes'. */
  label?: string;
  /** The texts it writes, over `LabelsProvider`'s `unsavedIndicator` and the English defaults. */
  labels?: Partial<UnsavedIndicatorLabels>;
  className?: string;
};

/**
 * UnsavedIndicator — small amber label shown when a form has unsaved changes.
 * Pair with StatefulSaveButton in a header or toolbar.
 */
export const UnsavedIndicator = ({
  visible,
  label,
  labels: ownLabels,
  className,
}: UnsavedIndicatorProps) => {
  const labels = useLabels('unsavedIndicator', UNSAVED_INDICATOR_LABELS, ownLabels);
  if (!visible) return null;
  return (
    <span className={clsx('text-xs font-medium text-amber-700 dark:text-amber-400', className)}>
      {label ?? labels.unsaved}
    </span>
  );
};
