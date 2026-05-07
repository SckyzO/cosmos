export type LoadingStateProps = {
  /** Message shown below the spinner. Default: 'Loading…' */
  message?: string;
  className?: string;
};

/**
 * LoadingState — spinning loader with a message.
 *
 * Use inside a SectionCard or any container while data is being fetched.
 * Fills available height with vertical centering.
 */
export const LoadingState = ({ message = 'Loading…', className }: LoadingStateProps) => (
  <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className ?? ''}`}>
    <div className="border-t-brand-500 h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)]" />
    <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
  </div>
);
