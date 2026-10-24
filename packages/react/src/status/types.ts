/** Health status — used by StatusBadge, HealthDot, HealthBadge, and lists. */
export type HealthStatus = 'OK' | 'WARN' | 'CRIT' | 'UNKNOWN' | 'INFO';

/** Tailwind class string per status — pill background + text color. */
export const STATUS_PILL: Record<HealthStatus, string> = {
  OK: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  WARN: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  CRIT: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  UNKNOWN: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  INFO: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
};

/** Tailwind background class per status — the HealthDot fill, same hues as the pills. */
export const STATUS_DOT: Record<HealthStatus, string> = {
  OK: 'bg-green-500',
  WARN: 'bg-amber-500',
  CRIT: 'bg-red-500',
  UNKNOWN: 'bg-gray-500',
  INFO: 'bg-blue-500',
};
