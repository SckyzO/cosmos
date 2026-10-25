import { type ComponentType, type ReactNode } from 'react';
import { ChevronRight, Home } from 'lucide-react';
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

export type BreadcrumbSeparator = 'chevron' | 'slash' | 'dot' | ReactNode;

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
  /** Visual separator between items. Default `'chevron'`. Pass any ReactNode for full custom. */
  separator?: BreadcrumbSeparator;
  /**
   * Put a Home icon on the first item (the usual page-header path). It is named "Home" for
   * assistive technology, so a first item labelled "Home" reads twice: label it otherwise
   * (a site name). An `icon` set on that item wins.
   */
  homeIcon?: boolean;
  /**
   * Name of the navigation landmark. Default `'Breadcrumb'`. A page that holds
   * several breadcrumbs gives each its own, or a screen reader cannot tell
   * them apart; a translated app passes its own wording.
   */
  'aria-label'?: string;
  className?: string;
};

const renderSeparator = (sep: BreadcrumbSeparator): ReactNode => {
  if (sep === 'chevron')
    return <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden />;
  if (sep === 'slash')
    return (
      <span aria-hidden className="text-sm text-[var(--color-text-muted)] select-none">
        /
      </span>
    );
  if (sep === 'dot')
    return (
      <span
        aria-hidden
        className="text-base leading-none text-[var(--color-text-muted)] select-none"
      >
        ·
      </span>
    );
  return sep;
};

/**
 * Breadcrumb — navigable path: Site → Room → Aisle → Rack → Device.
 *
 * Each item except the last is clickable. Last item renders as plain text
 * (the current page). Use icons for the most important items in the path,
 * or `homeIcon` for the Home icon of a page header.
 */
export const Breadcrumb = ({
  items,
  separator = 'chevron',
  homeIcon = false,
  'aria-label': ariaLabel = 'Breadcrumb',
  className,
}: BreadcrumbProps) => (
  <nav
    aria-label={ariaLabel}
    className={clsx('flex items-center gap-1 overflow-x-auto', className)}
  >
    {items.map(({ icon, label, href, onClick }, i) => {
      const isLast = i === items.length - 1;
      const Icon = icon;
      const renderIcon = (className: string) =>
        homeIcon && i === 0 && !Icon ? (
          <Home className={className} role="img" aria-label="Home" />
        ) : (
          Icon && <Icon className={className} />
        );
      return (
        <div key={label} className="flex items-center gap-1">
          {i > 0 && renderSeparator(separator)}
          {isLast ? (
            <span
              aria-current="page"
              className="flex items-center gap-1.5 rounded px-2 py-1 text-sm font-semibold whitespace-nowrap text-[var(--color-text-primary)]"
            >
              {renderIcon('text-brand-500 h-4 w-4')}
              {label}
            </span>
          ) : onClick ? (
            <button
              type="button"
              onClick={onClick}
              className="text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 focus-visible:focus-indicator flex items-center gap-1.5 rounded px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors"
            >
              {renderIcon('h-4 w-4')}
              {label}
            </button>
          ) : (
            <a
              href={href ?? '#'}
              className="text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 focus-visible:focus-indicator flex items-center gap-1.5 rounded px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors"
            >
              {renderIcon('h-4 w-4')}
              {label}
            </a>
          )}
        </div>
      );
    })}
  </nav>
);
