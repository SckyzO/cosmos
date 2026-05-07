/** Health status — used by StatusBadge, HealthDot, HealthBadge, and lists. */
export type HealthStatus = 'OK' | 'WARN' | 'CRIT' | 'UNKNOWN';

/** Tailwind class string per status — pill background + text color. */
export const STATUS_PILL: Record<HealthStatus, string> = {
  OK: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  WARN: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  CRIT: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  UNKNOWN: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

/** Raw color hex per status — used for HealthDot pulse animation. */
export const STATUS_COLOR: Record<HealthStatus, string> = {
  OK: '#10b981',
  WARN: '#f59e0b',
  CRIT: '#ef4444',
  UNKNOWN: '#6b7280',
};
