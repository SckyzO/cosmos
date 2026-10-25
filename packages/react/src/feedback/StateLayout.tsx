import { clsx } from 'clsx';
import type { ElementType, ReactNode } from 'react';
import { INTENT_STYLE, type Intent } from '../ui/intent';

export type StateLayoutProps = {
  /** Meaning of the icon tile. */
  intent: Intent;
  /** Icon drawn in the tile; ignored when `media` is set. Defaults to the intent's icon. */
  icon?: ElementType;
  /** Replaces the icon (the loading spinner). */
  media?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Tighter spacing and a smaller tile, for a card or a table body. */
  compact?: boolean;
  role?: 'status' | 'alert';
  className?: string;
};

/**
 * The layout EmptyState, ErrorState and LoadingState share: an icon tile, a title, a description and
 * an action, centered. Internal: each state sets its own intent, icon and role.
 */
export const StateLayout = ({
  intent,
  icon,
  media,
  title,
  description,
  action,
  compact = false,
  role,
  className,
}: StateLayoutProps) => {
  const style = INTENT_STYLE[intent];
  const Icon = icon ?? style.icon;
  return (
    <div
      role={role}
      className={clsx(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 py-6' : 'gap-3 py-12',
        className
      )}
    >
      <div
        className={clsx(
          'flex shrink-0 items-center justify-center rounded-xl',
          compact ? 'h-9 w-9' : 'h-12 w-12',
          style.tile
        )}
      >
        {media ?? (
          <Icon className={clsx(compact ? 'h-5 w-5' : 'h-6 w-6', style.iconColor)} aria-hidden />
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
};
