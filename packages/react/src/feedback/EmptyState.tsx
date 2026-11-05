import type { ElementType, ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { useLabels } from '../labels/labelsContext';
import type { Intent } from '../ui/intent';
import { EMPTY_STATE_LABELS, type EmptyStateLabels } from './labels';
import { StateLayout } from './StateLayout';

/**
 * No `danger`: a failure is an `ErrorState`, which is announced and offers "Try again".
 * An empty state is static, so it never takes the color of an error.
 */
export type EmptyStateIntent = Extract<
  Intent,
  'neutral' | 'brand' | 'info' | 'success' | 'warning'
>;

export type EmptyStateProps = {
  /** Title, domain-specific. Default `labels.title`, "No data". */
  title?: string;
  /** Optional description below title */
  description?: string;
  /**
   * Under the description, before the `action`: a short list of steps, a hint. It is start-aligned
   * and up to 28rem wide, whatever the centering of the rest.
   */
  children?: ReactNode;
  /** Optional call-to-action (button, link) */
  action?: ReactNode;
  /**
   * What the emptiness means, as the color of the icon tile: `brand` for a first run, `success` for
   * "all caught up", `info` or `warning` for a source that is offline. The title stays neutral.
   * Default `neutral`.
   */
  intent?: EmptyStateIntent;
  /** Icon drawn in the tile, any component taking `className`. Default `Inbox`, whatever the intent. */
  icon?: ElementType;
  /** Tighter spacing, for a card or a table body. */
  compact?: boolean;
  /** The texts it writes, over `LabelsProvider`'s `emptyState` and the English defaults. */
  labels?: Partial<EmptyStateLabels>;
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
  title,
  description,
  children,
  action,
  intent = 'neutral',
  icon = Inbox,
  compact,
  labels: ownLabels,
  className,
}: EmptyStateProps) => {
  const labels = useLabels('emptyState', EMPTY_STATE_LABELS, ownLabels);
  return (
    <StateLayout
      intent={intent}
      icon={icon}
      title={title ?? labels.title}
      description={description}
      action={action}
      compact={compact}
      className={className}
    >
      {children}
    </StateLayout>
  );
};
