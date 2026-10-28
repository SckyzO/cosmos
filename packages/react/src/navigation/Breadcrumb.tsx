import { type ComponentType, type ReactNode } from 'react';
import { ChevronRight, Ellipsis, Home } from 'lucide-react';
import { clsx } from 'clsx';
import { AppLink } from '../ui/AppLink';
import { Menu } from '../ui/Menu';

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
  /**
   * Most crumbs shown at once (at least 2). A longer trail keeps its first crumb and its last
   * `maxItems - 1`, and the ones in between collapse into a "…" menu that links to them. Default:
   * all of them.
   */
  maxItems?: number;
  className?: string;
};

const renderSeparator = (sep: BreadcrumbSeparator): ReactNode => {
  if (sep === 'chevron')
    return (
      <ChevronRight
        className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] rtl:-scale-x-100"
        aria-hidden
      />
    );
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
  maxItems,
  className,
}: BreadcrumbProps) => {
  const limit = maxItems === undefined ? items.length : Math.max(2, maxItems);
  const collapsed = items.length > limit;
  // The collapsed crumbs are the ones after the first, up to the last `limit - 1`.
  const hiddenFrom = 1;
  const hiddenTo = collapsed ? items.length - (limit - 1) : 1;
  const hidden = items.slice(hiddenFrom, hiddenTo);
  const shown = collapsed ? [...items.slice(0, hiddenFrom), ...items.slice(hiddenTo)] : items;
  const linkClass =
    'text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 focus-visible:focus-indicator flex max-w-32 items-center max-sm:min-w-0 gap-1.5 rounded px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors sm:max-w-none';
  return (
    <nav
      aria-label={ariaLabel}
      className={clsx('flex items-center gap-1 overflow-x-auto', className)}
    >
      {shown.map(({ icon: Icon, label, href, onClick }, i) => {
        const isLast = i === shown.length - 1;
        // The first crumb is never collapsed: `i === 0` is the first item of the trail.
        const renderIcon = (className: string) =>
          homeIcon && i === 0 && !Icon ? (
            <Home className={className} role="img" aria-label="Home" />
          ) : (
            Icon && <Icon className={className} />
          );
        return (
          <div key={label} className="flex items-center gap-1 max-sm:min-w-0">
            {i > 0 && renderSeparator(separator)}
            {collapsed && i === hiddenFrom && (
              <>
                <Menu>
                  <Menu.Trigger
                    aria-label={`Show ${hidden.length} more pages`}
                    className="text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 flex shrink-0 items-center rounded px-2 py-1 transition-colors"
                  >
                    <Ellipsis className="h-4 w-4" aria-hidden />
                  </Menu.Trigger>
                  <Menu.Content aria-label="Hidden pages">
                    {hidden.map((crumb) => (
                      <Menu.Item
                        key={crumb.label}
                        icon={crumb.icon}
                        href={crumb.onClick ? undefined : (crumb.href ?? '#')}
                        onSelect={crumb.onClick}
                      >
                        {crumb.label}
                      </Menu.Item>
                    ))}
                  </Menu.Content>
                </Menu>
                {renderSeparator(separator)}
              </>
            )}
            {isLast ? (
              <span
                aria-current="page"
                className="flex items-center gap-1.5 rounded px-2 py-1 text-sm font-semibold whitespace-nowrap text-[var(--color-text-primary)] max-sm:min-w-0"
              >
                {renderIcon('text-brand-500 h-4 w-4 shrink-0')}
                <span className="truncate">
                  <bdi>{label}</bdi>
                </span>
              </span>
            ) : onClick ? (
              <button type="button" onClick={onClick} className={linkClass}>
                {renderIcon('h-4 w-4 shrink-0')}
                <span className="truncate">
                  <bdi>{label}</bdi>
                </span>
              </button>
            ) : (
              <AppLink href={href ?? '#'} className={linkClass}>
                {renderIcon('h-4 w-4 shrink-0')}
                <span className="truncate">
                  <bdi>{label}</bdi>
                </span>
              </AppLink>
            )}
          </div>
        );
      })}
    </nav>
  );
};
