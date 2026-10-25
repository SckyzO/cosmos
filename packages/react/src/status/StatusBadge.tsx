import { clsx } from 'clsx';
import { type HealthStatus, STATUS_PILL } from './types';

export type StatusBadgeProps = {
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
};

const SIZE_CLASS = {
  sm: 'px-1.5 py-0.5 text-3xs',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
} as const;

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
      STATUS_PILL[status],
      className
    )}
  >
    {label ?? status}
  </span>
);
