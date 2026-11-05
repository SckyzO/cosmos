import { RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLabels } from '../labels/labelsContext';
import { Button } from '../ui/Button';
import { ERROR_STATE_LABELS, type ErrorStateLabels } from './labels';
import { StateLayout } from './StateLayout';

export type ErrorStateProps = {
  /** What went wrong. Default `labels.title`, 'Something went wrong.' */
  title?: string;
  /** Detail under the title: the cause, or what to do next. */
  description?: string;
  /** Alias of `title`, kept for existing callers. `title` wins when both are set. */
  message?: string;
  /** Optional retry callback. If set, a retry button appears. */
  onRetry?: () => void;
  /** Label of the retry button. Default `labels.retry`, 'Try again'. */
  retryLabel?: string;
  /**
   * A way out that is not a retry ("Back to tickets" on a record that does not exist), next to
   * the retry button, which comes first. Alone when there is no `onRetry`.
   */
  action?: ReactNode;
  /** Tighter spacing, for a card or a table body. */
  compact?: boolean;
  /** The texts it writes (the retry button…), over `LabelsProvider`'s `errorState` and English. */
  labels?: Partial<ErrorStateLabels>;
  className?: string;
};

/**
 * ErrorState — error placeholder with an optional retry button and an optional `action`.
 *
 * Use when an API call fails or rendering fails inside a section.
 * Pair with `<EmptyState>` when the error is "no data found" rather
 * than a real failure. It is announced to assistive technology (`role="alert"`).
 */
export const ErrorState = ({
  title,
  description,
  message,
  onRetry,
  retryLabel,
  action,
  compact,
  labels: ownLabels,
  className,
}: ErrorStateProps) => {
  const labels = useLabels('errorState', ERROR_STATE_LABELS, ownLabels);
  return (
    <StateLayout
      role="alert"
      intent="danger"
      title={title ?? message ?? labels.title}
      description={description}
      action={
        (onRetry || action) && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {onRetry && (
              <Button variant="secondary" size="sm" icon={RotateCw} onClick={() => onRetry()}>
                {retryLabel ?? labels.retry}
              </Button>
            )}
            {action}
          </div>
        )
      }
      compact={compact}
      className={className}
    />
  );
};
