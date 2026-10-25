import { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { StateLayout } from './StateLayout';

export type EmptyStateProps = {
  /** Title (typically "No data" or domain-specific) */
  title?: string;
  /** Optional description below title */
  description?: string;
  /** Optional call-to-action (button, link) */
  action?: ReactNode;
  /** Tighter spacing, for a card or a table body. */
  compact?: boolean;
  className?: string;
};

/**
 * EmptyState — friendly empty-list placeholder.
 *
 * Use when an API call returns no results. Always show a description
 * if there's an action the user can take to populate the list.
 * It is static: nothing announces it, since nothing changed under the user.
 */
export const EmptyState = ({
  title = 'No data',
  description,
  action,
  compact,
  className,
}: EmptyStateProps) => (
  <StateLayout
    intent="neutral"
    icon={Inbox}
    title={title}
    description={description}
    action={action}
    compact={compact}
    className={className}
  />
);
