import { Spinner } from '../ui/Spinner';
import { StateLayout } from './StateLayout';

export type LoadingStateProps = {
  /** Line shown next to the spinner. Default: 'Loading…' */
  title?: string;
  /** Detail under the title. */
  description?: string;
  /** Alias of `title`, kept for existing callers. `title` wins when both are set. */
  message?: string;
  /** Tighter spacing, for a card or a table body. */
  compact?: boolean;
  className?: string;
};

/**
 * LoadingState — spinning loader with a message.
 *
 * Use inside a SectionCard or any container while data is being fetched.
 * Fills available height with vertical centering. It is a live region
 * (`role="status"`) named by its title.
 */
export const LoadingState = ({
  title,
  description,
  message,
  compact,
  className,
}: LoadingStateProps) => (
  <StateLayout
    role="status"
    intent="brand"
    // The state's own role names it, so the spinner's would announce "Loading" twice.
    media={
      <span aria-hidden="true">
        <Spinner size={compact ? 'sm' : 'md'} />
      </span>
    }
    title={title ?? message ?? 'Loading…'}
    description={description}
    compact={compact}
    className={className}
  />
);
