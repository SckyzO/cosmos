import { type ComponentType } from 'react';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export type ClickableRowProps = {
  /** Optional leading icon (lucide-react or any icon component) */
  icon?: ComponentType<{ className?: string }>;
  /** Main row title */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Click handler — renders a button */
  onClick?: () => void;
  /** Or provide an href to render an <a> instead */
  href?: string;
  className?: string;
};

/**
 * ClickableRow — full-width navigable row with icon + title + subtitle + chevron.
 *
 * Use for navigable lists: racks, servers, exporters, articles…
 * Pair with `<StatusRow>` when you need a status badge on the right.
 */
export const ClickableRow = ({
  icon: Icon,
  title,
  subtitle,
  onClick,
  href,
  className,
}: ClickableRowProps) => {
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
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
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
