import { RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../ui/Button';
import { StateLayout } from './StateLayout';

export type ErrorStateProps = {
  /** What went wrong. Default: 'Something went wrong.' */
  title?: string;
  /** Detail under the title: the cause, or what to do next. */
  description?: string;
  /** Alias of `title`, kept for existing callers. `title` wins when both are set. */
  message?: string;
  /** Optional retry callback. If set, a retry button appears. */
  onRetry?: () => void;
  /** Label of the retry button. Default 'Try again'. */
  retryLabel?: string;
  /**
   * A way out that is not a retry ("Back to tickets" on a record that does not exist), next to
   * the retry button, which comes first. Alone when there is no `onRetry`.
   */
  action?: ReactNode;
  /** Tighter spacing, for a card or a table body. */
  compact?: boolean;
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
  retryLabel = 'Try again',
  action,
  compact,
  className,
}: ErrorStateProps) => (
  <StateLayout
    role="alert"
    intent="danger"
    title={title ?? message ?? 'Something went wrong.'}
    description={description}
    action={
      (onRetry || action) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <Button variant="secondary" size="sm" icon={RotateCw} onClick={onRetry}>
              {retryLabel}
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
