import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { ComponentPropsWithRef, ComponentType, ReactNode } from 'react';
import { Badge } from './Badge';
import type { Intent } from './intent';

export type NotificationRowIntent = Extract<Intent, 'danger' | 'warning' | 'info' | 'success'>;

const INTENT_META: Record<
  NotificationRowIntent,
  { icon: ComponentType<{ className?: string }>; color: string; chipBg: string }
> = {
  danger: {
    icon: XCircle,
    color: 'text-red-500 dark:text-red-400',
    chipBg: 'bg-red-500/15 dark:bg-red-500/20',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-500 dark:text-amber-400',
    chipBg: 'bg-amber-500/15 dark:bg-amber-500/20',
  },
  info: {
    icon: Info,
    color: 'text-blue-500 dark:text-blue-400',
    chipBg: 'bg-blue-500/15 dark:bg-blue-500/20',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    chipBg: 'bg-green-500/15 dark:bg-green-500/20',
  },
};

// Monitoring vocabulary on the badge: the label is data-facing, the prop is not.
const BADGE_LABEL: Record<NotificationRowIntent, string> = {
  danger: 'CRIT',
  warning: 'WARN',
  info: 'INFO',
  success: 'OK',
};

export type NotificationRowProps = ComponentPropsWithRef<'button'> & {
  /** Color of the chip and the badge, and the icon unless `icon` replaces it. */
  intent: NotificationRowIntent;
  /**
   * Icon of the chip, in place of the one `intent` picks (a comment, an invoice, a deploy). The
   * chip keeps the color of the intent.
   */
  icon?: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  /** Small mono caption shown below the subtitle (e.g. check id, error code). */
  caption?: string;
  /** When the notification happened, as a line under the text (e.g. "2 min ago"). */
  time?: ReactNode;
  /** Not read yet: a dot before the title and a tinted row. Default false. */
  unread?: boolean;
  /** Badge label at the end of the row. If omitted, derived from `intent` (CRIT/WARN/INFO/OK). */
  badgeLabel?: string;
  /**
   * Controls at the end of the row (mark as read, delete…): icon buttons named for their row
   * (`aria-label="Delete: {title}"`), or a menu. They come after the row's own button and are
   * siblings of it, never inside it, so each is a stop of its own for the keyboard and a click
   * on one is not a click on the row. With `actions` the row is a `<div>` around that button and
   * them: `className` styles the `<div>`, and `ref` and the other props stay on the button.
   */
  actions?: ReactNode;
};

/**
 * One notification, as a full-width button: a chip with its icon, the title, subtitle, caption
 * and time, and a badge. `NotificationsPanel.Item` is this row plus closing the panel; on a
 * notifications page, put it in your own list (`<ul>` and `<li>`) with the filters and paging
 * that page has.
 */
export function NotificationRow({
  intent,
  icon,
  title,
  subtitle,
  caption,
  time,
  unread = false,
  badgeLabel,
  actions,
  className,
  ref,
  ...rest
}: NotificationRowProps) {
  const meta = INTENT_META[intent];
  const Icon = icon ?? meta.icon;
  // The tint and the hover belong to the row, so that with `actions` they cover the actions too.
  const tint = unread
    ? 'bg-brand-50/60 hover:bg-brand-50 dark:bg-brand-500/10 dark:hover:bg-brand-500/15'
    : 'hover:bg-gray-50 dark:hover:bg-white/5';
  const renderButton = (buttonClass: string) => (
    <button
      ref={ref}
      type="button"
      className={clsx(
        'focus-visible:focus-indicator py-row-12 flex items-start gap-3 text-start focus-visible:ring-inset',
        buttonClass
      )}
      {...rest}
    >
      <div
        aria-hidden
        className={clsx(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          meta.chipBg
        )}
      >
        <Icon className={clsx('h-4 w-4', meta.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          {unread && (
            <>
              <span aria-hidden className="bg-brand-500 h-2 w-2 shrink-0 rounded-full" />
              <span className="sr-only">Unread: </span>
            </>
          )}
          <span className="min-w-0 truncate">
            <bdi>{title}</bdi>
          </span>
        </p>
        {subtitle && (
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            <bdi>{subtitle}</bdi>
          </p>
        )}
        {caption && (
          <p className="text-3xs mt-0.5 truncate font-mono text-gray-500 dark:text-gray-400">
            <bdi>{caption}</bdi>
          </p>
        )}
        {time && (
          <p className="text-3xs mt-1 text-gray-500 dark:text-gray-400">
            <bdi>{time}</bdi>
          </p>
        )}
      </div>
      <Badge appearance="solid" intent={intent} size="sm" className="mt-0.5 shrink-0">
        {badgeLabel ?? BADGE_LABEL[intent]}
      </Badge>
    </button>
  );

  if (!actions) return renderButton(clsx('w-full px-4 transition-colors', tint, className));

  return (
    <div className={clsx('flex transition-colors', tint, className)}>
      {renderButton('min-w-0 flex-1 ps-4 pe-2')}
      <div className="flex shrink-0 items-center gap-1 self-center pe-3">{actions}</div>
    </div>
  );
}
