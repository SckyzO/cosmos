import { type ComponentType, type Ref } from 'react';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { StatusBadge } from '../status/StatusBadge';
import { type HealthStatus } from '../status/types';
import { AppLink } from '../ui/AppLink';

export type RowProps = {
  /** Optional leading icon (lucide-react or any icon component) */
  icon?: ComponentType<{ className?: string }>;
  /** Main row title */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /**
   * Health shown as a `StatusBadge` at the end of the row, in place of the
   * navigation chevron.
   */
  status?: HealthStatus;
  /** Click handler — renders a button */
  onClick?: () => void;
  /** Or provide an href to render an `<a>` instead */
  href?: string;
  className?: string;
  /** Ref to the row's root: an `<a>` when `href` is set, a `<button>` otherwise. */
  ref?: Ref<HTMLAnchorElement | HTMLButtonElement>;
};

/**
 * Row — full-width navigable row with icon + title + subtitle, ending with a
 * chevron, or with a status badge when `status` is set.
 *
 * Use for navigable lists: racks, servers, exporters, articles… The padding
 * insets the content from the hover background, so stack rows in a plain
 * container, with or without dividers.
 */
export const Row = ({
  icon: Icon,
  title,
  subtitle,
  status,
  onClick,
  href,
  className,
  ref,
}: RowProps) => {
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
      {status ? (
        <StatusBadge status={status} size="sm" className="shrink-0" />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
      )}
    </>
  );
  const baseClass = clsx(
    'focus-visible:focus-indicator py-row-10 flex w-full items-center gap-3 rounded-lg px-3 text-left transition-colors focus-visible:ring-inset',
    'hover:bg-black/5 dark:hover:bg-white/5',
    className
  );
  if (href) {
    return (
      <AppLink ref={ref as Ref<HTMLAnchorElement>} href={href} className={baseClass}>
        {inner}
      </AppLink>
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
