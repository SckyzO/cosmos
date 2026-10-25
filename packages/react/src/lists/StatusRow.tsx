import { type ComponentType, type Ref } from 'react';
import { clsx } from 'clsx';
import { StatusBadge } from '../status/StatusBadge';
import { type HealthStatus } from '../status/types';

export type StatusRowProps = {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  status: HealthStatus;
  onClick?: () => void;
  href?: string;
  className?: string;
  /** Ref to the row's root: an `<a>` when `href` is set, a `<button>` otherwise. */
  ref?: Ref<HTMLAnchorElement | HTMLButtonElement>;
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
  ref,
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
      <StatusBadge status={status} size="sm" className="shrink-0" />
    </>
  );
  const baseClass = clsx(
    'focus-visible:focus-indicator flex w-full items-center gap-3 px-1 py-2.5 text-left transition-colors focus-visible:ring-inset',
    'hover:bg-black/5 dark:hover:bg-white/5',
    className
  );
  if (href) {
    return (
      <a ref={ref as Ref<HTMLAnchorElement>} href={href} className={baseClass}>
        {inner}
      </a>
    );
  }
  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      className={baseClass}
    >
      {inner}
    </button>
  );
};
