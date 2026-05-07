import { clsx } from 'clsx';
import { type HealthStatus, STATUS_COLOR } from './types';

export type HealthDotProps = {
  status: HealthStatus;
  /** Show a pulsing animation around the dot */
  pulse?: boolean;
  className?: string;
};

/**
 * HealthDot — small colored circle indicator (10px).
 *
 * Use for compact status displays (next to a label, in a row, in a chart legend).
 * Set `pulse` to draw attention (recommended for CRIT).
 */
export const HealthDot = ({ status, pulse = false, className }: HealthDotProps) => (
  <span className={clsx('relative flex h-2.5 w-2.5 shrink-0', className)}>
    {pulse && (
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
        style={{ backgroundColor: STATUS_COLOR[status] }}
      />
    )}
    <span
      className="relative inline-flex h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: STATUS_COLOR[status] }}
    />
  </span>
);
