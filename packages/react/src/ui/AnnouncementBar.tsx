import { clsx } from 'clsx';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Megaphone,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ElementType, type ReactNode } from 'react';

export type AnnouncementBarIntent = 'info' | 'success' | 'warning' | 'danger' | 'brand';

export type AnnouncementBarProps = {
  intent?: AnnouncementBarIntent;
  /** Override the default icon for the intent. Pass `null` to hide. */
  icon?: ElementType | null;
  message: ReactNode;
  /** Right-side slot — a Link, Button, etc. */
  action?: ReactNode;
  /** Render a close button. */
  dismissible?: boolean;
  /** Called when the user clicks close. */
  onDismiss?: () => void;
  /** Stick to the top of the viewport. */
  sticky?: boolean;
  className?: string;
};

const INTENT_ICON: Record<AnnouncementBarIntent, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  brand: Megaphone,
};

const INTENT_BG: Record<AnnouncementBarIntent, string> = {
  info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30',
  success:
    'bg-green-50 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/30',
  warning:
    'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30',
  danger:
    'bg-red-50 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
  brand: 'bg-brand-500 text-white border-brand-600 dark:bg-brand-600 dark:border-brand-500',
};

const ICON_COLOR: Record<AnnouncementBarIntent, string> = {
  info: 'text-blue-500 dark:text-blue-400',
  success: 'text-green-500 dark:text-green-400',
  warning: 'text-amber-500 dark:text-amber-400',
  danger: 'text-red-500 dark:text-red-400',
  brand: 'text-white',
};

export const AnnouncementBar = ({
  intent = 'info',
  icon,
  message,
  action,
  dismissible = false,
  onDismiss,
  sticky = false,
  className,
}: AnnouncementBarProps) => {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  const Icon = icon === null ? null : (icon ?? INTENT_ICON[intent]);
  return (
    <div
      role="status"
      className={clsx(
        'flex w-full items-center gap-3 border-b px-4 py-2 text-sm',
        INTENT_BG[intent],
        sticky && 'sticky top-0 z-40',
        className
      )}
    >
      {Icon && <Icon className={clsx('h-4 w-4 shrink-0', ICON_COLOR[intent])} aria-hidden />}
      <span className="min-w-0 flex-1">{message}</span>
      {action && <span className="shrink-0">{action}</span>}
      {dismissible && (
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={() => {
            setOpen(false);
            onDismiss?.();
          }}
          className={clsx(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
            intent === 'brand'
              ? 'text-white/80 hover:bg-white/15 hover:text-white'
              : 'text-current opacity-60 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10'
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
