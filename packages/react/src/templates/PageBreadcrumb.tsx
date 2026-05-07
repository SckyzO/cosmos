import { type ReactNode } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { clsx } from 'clsx';

export type PageBreadcrumbItem = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export type PageBreadcrumbProps = {
  /** Ordered list of breadcrumb items. First gets a Home icon, last is current page (no link). */
  items: PageBreadcrumbItem[];
  className?: string;
};

/**
 * PageBreadcrumb — slim breadcrumb shown below a page title.
 *
 * The first item is decorated with a Home icon. The last item is the current
 * page (rendered as plain text, not a link). Items in between are clickable
 * (either via `href` or `onClick`).
 */
export const PageBreadcrumb = ({ items, className }: PageBreadcrumbProps) => (
  <nav aria-label="Breadcrumb" className={className}>
    <ol className="flex flex-wrap items-center gap-1 text-sm">
      {items.map((item, i) => {
        const isFirst = i === 0;
        const isLast = i === items.length - 1;
        const linkClass =
          'hover:text-brand-500 dark:hover:text-brand-400 flex items-center gap-1 text-[var(--color-text-secondary)] transition-colors';
        const renderInner: ReactNode = (
          <>
            {isFirst && <Home className="h-4 w-4" />}
            {item.label}
          </>
        );
        return (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden />
            )}
            {isLast ? (
              <span className="font-medium text-[var(--color-text-primary)]">{item.label}</span>
            ) : item.onClick ? (
              <button type="button" onClick={item.onClick} className={linkClass}>
                {renderInner}
              </button>
            ) : (
              <a href={item.href ?? '#'} className={clsx(linkClass)}>
                {renderInner}
              </a>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);
