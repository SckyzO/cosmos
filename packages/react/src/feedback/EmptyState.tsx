import { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export type EmptyStateProps = {
  /** Title (typically "No data" or domain-specific) */
  title?: string;
  /** Optional description below title */
  description?: string;
  /** Optional call-to-action (button, link) */
  action?: ReactNode;
  className?: string;
};

/**
 * EmptyState — friendly empty-list placeholder.
 *
 * Use when an API call returns no results. Always show a description
 * if there's an action the user can take to populate the list.
 */
export const EmptyState = ({
  title = 'No data',
  description,
  action,
  className,
}: EmptyStateProps) => (
  <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className ?? ''}`}>
    <Inbox className="h-10 w-10 text-[var(--color-border)]" />
    <div className="text-center">
      <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
      {description && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{description}</p>}
    </div>
    {action}
  </div>
);
