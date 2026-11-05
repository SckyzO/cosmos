import { clsx } from 'clsx';
import { useLabels } from '../labels/labelsContext';
import { STATUS_BADGE_LABELS, type StatusBadgeLabels } from './labels';
import { type HealthStatus, STATUS_DOT } from './types';

type HealthDotSize = 'xs' | 'sm' | 'md' | 'lg';

export type HealthDotProps = {
  status: HealthStatus;
  /** `xs` 6px, `sm` 8px, `md` 10px or `lg` 12px. Default `md`. */
  size?: HealthDotSize;
  /** Show a pulsing animation around the dot */
  pulse?: boolean;
  /**
   * Accessible name. Set, the dot is an `img` with this name (say what it
   * stands for: "Database: critical"). Omitted, the status text is read.
   */
  label?: string;
  /** The texts it writes (the status read out), over `LabelsProvider`'s `statusBadge` and the English defaults. */
  labels?: Partial<StatusBadgeLabels>;
  className?: string;
};

const SIZE: Record<HealthDotSize, string> = {
  xs: 'size-1.5',
  sm: 'size-2',
  md: 'size-2.5',
  lg: 'size-3',
};

/**
 * HealthDot — small colored circle indicator (10px by default, 6 to 12px with `size`).
 *
 * Use for compact status displays (next to a label, in a row, in a chart legend).
 * Set `pulse` to draw attention (recommended for CRIT).
 */
export const HealthDot = ({
  status,
  size = 'md',
  pulse = false,
  label,
  labels: ownLabels,
  className,
}: HealthDotProps) => {
  const labels = useLabels('statusBadge', STATUS_BADGE_LABELS, ownLabels);
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      className={clsx('relative flex shrink-0', SIZE[size], className)}
    >
      {pulse && (
        <span
          className={clsx(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none',
            STATUS_DOT[status]
          )}
        />
      )}
      <span className={clsx('relative inline-flex size-full rounded-full', STATUS_DOT[status])} />
      {!label && <span className="sr-only">{labels[status]}</span>}
    </span>
  );
};
