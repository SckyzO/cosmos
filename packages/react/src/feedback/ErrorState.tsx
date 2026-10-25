import { RotateCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { StateLayout } from './StateLayout';

export type ErrorStateProps = {
  /** What went wrong. Default: 'Something went wrong.' */
  title?: string;
  /** Detail under the title: the cause, or what to do next. */
  description?: string;
  /** Alias of `title`, kept for existing callers. `title` wins when both are set. */
  message?: string;
  /** Optional retry callback. If set, a "Try again" button appears. */
  onRetry?: () => void;
  /** Tighter spacing, for a card or a table body. */
  compact?: boolean;
  className?: string;
};

/**
 * ErrorState — error placeholder with optional retry action.
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
  compact,
  className,
}: ErrorStateProps) => (
  <StateLayout
    role="alert"
    intent="danger"
    title={title ?? message ?? 'Something went wrong.'}
    description={description}
    action={
      onRetry && (
        <Button variant="secondary" size="sm" icon={RotateCw} onClick={onRetry}>
          Try again
        </Button>
      )
    }
    compact={compact}
    className={className}
  />
);
