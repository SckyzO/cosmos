import { type ComponentType } from 'react';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export type BreadcrumbItem = {
  label: string;
  /** Optional icon (lucide-react component) */
  icon?: ComponentType<{ className?: string }>;
  /** Link target — last item is rendered as plain text (no link) regardless */
  href?: string;
  /** Or click handler */
  onClick?: () => void;
};

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

/**
 * Breadcrumb — navigable path: Site → Room → Aisle → Rack → Device.
 *
 * Each item except the last is clickable. Last item renders as plain text
 * (the current page). Use icons for the most important items in the path.
 *
 * Differs from PageBreadcrumb (templates/) which is the slim variant for
 * page headers with the Home icon. This Breadcrumb is bigger and supports
 * an icon per item.
 */
export const Breadcrumb = ({ items, className }: BreadcrumbProps) => (
  <nav
    aria-label="Breadcrumb"
    className={clsx('flex items-center gap-1 overflow-x-auto', className)}
  >
    {items.map(({ icon: Icon, label, href, onClick }, i) => {
      const isLast = i === items.length - 1;
      return (
        <div key={label} className="flex items-center gap-1">
          {i > 0 && (
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden />
          )}
          {isLast ? (
            <span className="flex items-center gap-1.5 rounded px-2 py-1 text-sm font-semibold whitespace-nowrap text-[var(--color-text-primary)]">
              {Icon && <Icon className="text-brand-500 h-4 w-4" />}
              {label}
            </span>
          ) : onClick ? (
            <button
              type="button"
              onClick={onClick}
              className="text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 flex items-center gap-1.5 rounded px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors"
            >
              {Icon && <Icon className="h-4 w-4" />}
              {label}
            </button>
          ) : (
            <a
              href={href ?? '#'}
              className="text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 flex items-center gap-1.5 rounded px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors"
            >
              {Icon && <Icon className="h-4 w-4" />}
              {label}
            </a>
          )}
        </div>
      );
    })}
  </nav>
);
