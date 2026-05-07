import { CheckCircle, AlertTriangle, XCircle, HelpCircle, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { type HealthStatus } from './types';

export type HealthBadgeProps = {
  status: HealthStatus;
  /** Custom label override (default: the status text) */
  label?: string;
  className?: string;
};

const HEALTH_CONFIG: Record<
  HealthStatus,
  { icon: LucideIcon; bg: string; text: string; border: string }
> = {
  OK: {
    icon: CheckCircle,
    bg: 'bg-green-50 dark:bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-500/30',
  },
  WARN: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-500/30',
  },
  CRIT: {
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-500/30',
  },
  UNKNOWN: {
    icon: HelpCircle,
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-500 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
  },
};

/**
 * HealthBadge — prominent status badge with icon + label (rounded-lg).
 *
 * Larger and more visible than StatusBadge — use for hero status displays
 * (e.g. "System Health" page, dashboard summary cards).
 */
export const HealthBadge = ({ status, label, className }: HealthBadgeProps) => {
  const { icon: Icon, bg, text, border } = HEALTH_CONFIG[status];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium',
        bg,
        text,
        border,
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {label ?? status}
    </span>
  );
};
