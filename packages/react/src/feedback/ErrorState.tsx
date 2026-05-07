import { AlertCircle } from 'lucide-react';

export type ErrorStateProps = {
  /** Error message. Default: 'Something went wrong.' */
  message?: string;
  /** Optional retry callback. If set, a "Try again" link appears. */
  onRetry?: () => void;
  className?: string;
};

/**
 * ErrorState — error placeholder with optional retry action.
 *
 * Use when an API call fails or rendering fails inside a section.
 * Pair with `<EmptyState>` when the error is "no data found" rather
 * than a real failure.
 */
export const ErrorState = ({
  message = 'Something went wrong.',
  onRetry,
  className,
}: ErrorStateProps) => (
  <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className ?? ''}`}>
    <AlertCircle className="h-8 w-8 text-red-400" />
    <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="text-brand-500 hover:text-brand-600 text-xs font-medium hover:underline"
      >
        Try again
      </button>
    )}
  </div>
);
