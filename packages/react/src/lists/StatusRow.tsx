import { type ComponentType } from 'react';
import { clsx } from 'clsx';
import { type HealthStatus } from '../status/types';

export type StatusRowProps = {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  status: HealthStatus;
  onClick?: () => void;
  href?: string;
  className?: string;
};

// Inlined here too (Tailwind scanner doesn't follow imports from constants).
const STATUS_CLASS: Record<HealthStatus, string> = {
  OK: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  WARN: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  CRIT: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  UNKNOWN: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  INFO: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
};

/**
 * StatusRow — same as ClickableRow but ends with a status badge instead of a chevron.
 */
export const StatusRow = ({
  icon: Icon,
  title,
  subtitle,
  status,
  onClick,
  href,
  className,
}: StatusRowProps) => {
  const inner = (
    <>
      {Icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5 text-[var(--color-text-muted)] dark:bg-white/5">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
        {subtitle && <p className="truncate text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
      </div>
      <span
        className={clsx(
          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
          STATUS_CLASS[status]
        )}
      >
        {status}
      </span>
    </>
  );
  const baseClass = clsx(
    'flex w-full items-center gap-3 px-1 py-2.5 text-left transition-colors',
    'hover:bg-black/5 dark:hover:bg-white/5',
    className
  );
  if (href) {
    return (
      <a href={href} className={baseClass}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={baseClass}>
      {inner}
    </button>
  );
};
