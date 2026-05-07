import { clsx } from 'clsx';
import { type HealthStatus } from './types';

export type StatusBadgeProps = {
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
};

const SIZE_CLASS = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
} as const;

// Tailwind 4 scans source files for class strings — keeping these inline (not
// imported from types.ts as constants) ensures the scanner picks them up.
const STATUS_CLASS: Record<HealthStatus, string> = {
  OK: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  WARN: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  CRIT: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  UNKNOWN: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  INFO: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
};

/**
 * StatusBadge — rounded-full status pill (OK / WARN / CRIT / UNKNOWN).
 *
 * Three sizes: sm (inline in tables), md (default), lg (prominent display).
 */
export const StatusBadge = ({ status, size = 'md', label, className }: StatusBadgeProps) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full font-bold',
      SIZE_CLASS[size],
      STATUS_CLASS[status],
      className
    )}
  >
    {label ?? status}
  </span>
);
