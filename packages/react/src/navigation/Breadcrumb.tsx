import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from 'react';
import { ChevronRight, Ellipsis, Home } from 'lucide-react';
import { clsx } from 'clsx';
import { useMediaQuery } from '../hooks/useMediaQuery';
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
   * all of them, except below `sm`, where a trail that doesn't fit its box folds as few crumbs
   * after the first as it needs for every label to read whole. Set, it applies at every width.
   */
  maxItems?: number;
  className?: string;
};

// Below this, a fraction of a pixel is measurement noise, not a crumb that needs one more pixel.
const TOLERANCE = 0.5;

/**
 * Whether a crumb has less room than its label needs. A label's text is as wide as a `Range` over
 * it says, whatever the room it is given, and the rest of the crumb (padding, icon) is the crumb's
 * width less the label's: the crumb needs `width - label + text`. Its own `max-width` caps that
 * need: a label the cap cuts is cut at any width of the trail, and folding brings it nothing.
 */
const isSqueezed = (label: HTMLElement, range: Range) => {
  const crumb = label.parentElement;
  if (!crumb) return false;
  range.selectNodeContents(label);
  const width = crumb.getBoundingClientRect().width;
  const need = width - label.getBoundingClientRect().width + range.getBoundingClientRect().width;
  const cap = parseFloat(getComputedStyle(crumb).maxWidth);
  return Math.min(need, Number.isNaN(cap) ? Infinity : cap) - width > TOLERANCE;
};

/**
 * How many crumbs after the first the trail folds into the "…" menu: as few as leave every crumb
 * its whole label, `foldable` at most, 0 while not `enabled`.
 *
 * Counted before the first paint, one crumb more per render while a crumb is squeezed, and from 0
 * again whenever the room or the labels may have changed: the nav or its parent changes width
 * (a parent that sizes to its content gives the nav no room of its own), the text size or the font
 * changes (`data-text-size`, `data-font`, a web font loading), or the trail changes (`trail`).
 */
const useFoldedCrumbs = (
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  foldable: number,
  trail: string
) => {
  const [fold, setFold] = useState({ trail, count: 0, pass: 0 });
  if (fold.trail !== trail) setFold({ trail, count: 0, pass: fold.pass + 1 });
  const count = enabled ? Math.min(fold.count, foldable) : 0;

  useLayoutEffect(() => {
    const nav = ref.current;
    // Some DOM implementations used in tests have no `Range` boxes: nothing to measure there.
    const range = document.createRange?.();
    if (!enabled || !nav || count >= foldable || !range?.getBoundingClientRect) return;
    const measure = () => {
      const labels = nav.querySelectorAll<HTMLElement>('[data-crumb-label]');
      if ([...labels].some((label) => isSqueezed(label, range)))
        setFold((prev) => ({ ...prev, count: count + 1 }));
    };
    measure();
  }, [ref, enabled, count, foldable, fold.pass]);

  useLayoutEffect(() => {
    const nav = ref.current;
    if (!enabled || !nav) return;
    const refold = () => setFold((prev) => ({ ...prev, count: 0, pass: prev.pass + 1 }));
    const cleanups: Array<() => void> = [];
    if (typeof ResizeObserver !== 'undefined') {
      // The widths the trail was just folded for, read now: the observer's first report comes
      // after paint, and a box resized before it would pass for the box as folded.
      const boxes = [nav, nav.parentElement].filter((box) => box !== null);
      const widths = new Map<Element, number>(
        boxes.map((box) => [box, box.getBoundingClientRect().width])
      );
      const observer = new ResizeObserver((entries) => {
        let changed = false;
        for (const { target } of entries) {
          const width = target.getBoundingClientRect().width;
          if (Math.abs((widths.get(target) ?? width) - width) > TOLERANCE) changed = true;
          widths.set(target, width);
        }
        if (changed) refold();
      });
      for (const box of boxes) observer.observe(box);
      cleanups.push(() => observer.disconnect());
    }
    if (typeof MutationObserver !== 'undefined') {
      const text = new MutationObserver(refold);
      text.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-text-size', 'data-font'],
      });
      cleanups.push(() => text.disconnect());
    }
    // `document.fonts` is missing in some test environments.
    document.fonts?.addEventListener('loadingdone', refold);
    cleanups.push(() => document.fonts?.removeEventListener('loadingdone', refold));
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [ref, enabled]);

  return count;
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
 * or `homeIcon` for the Home icon of a page header. In a box too narrow for the
 * trail, the labels shrink and end with an ellipsis; below `sm`, the trail first
 * folds the crumbs after the first into the "…" menu, as few as it needs, so the
 * first crumb and the current page read whole.
 */
export const Breadcrumb = ({
  items,
  separator = 'chevron',
  homeIcon = false,
  'aria-label': ariaLabel = 'Breadcrumb',
  maxItems,
  className,
}: BreadcrumbProps) => {
  const navRef = useRef<HTMLElement>(null);
  const phone = !useMediaQuery('(min-width: 40rem)', true);
  // What sets the crumbs' widths: a change folds the trail again from none.
  const trail = [
    homeIcon,
    typeof separator === 'string' ? separator : 'node',
    ...items.map(({ icon, label }) => `${icon ? '+' : '-'}${label}`),
  ].join('\n');
  const folded = useFoldedCrumbs(
    navRef,
    phone && maxItems === undefined,
    Math.max(0, items.length - 2),
    trail
  );
  const limit = maxItems === undefined ? items.length - folded : Math.max(2, maxItems);
  const collapsed = items.length > limit;
  // The collapsed crumbs are the ones after the first, up to the last `limit - 1`.
  const hiddenFrom = 1;
  const hiddenTo = collapsed ? items.length - (limit - 1) : 1;
  const hidden = items.slice(hiddenFrom, hiddenTo);
  const shown = collapsed ? [...items.slice(0, hiddenFrom), ...items.slice(hiddenTo)] : items;
  const linkClass =
    'text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 focus-visible:focus-indicator flex max-w-32 min-w-0 items-center gap-1.5 rounded-sm px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors sm:max-w-none';
  return (
    <nav
      ref={navRef}
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
          <div key={label} className="flex min-w-0 items-center gap-1">
            {i > 0 && renderSeparator(separator)}
            {collapsed && i === hiddenFrom && (
              <>
                <Menu>
                  <Menu.Trigger
                    aria-label={`Show ${hidden.length} more ${hidden.length === 1 ? 'page' : 'pages'}`}
                    className="text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 flex shrink-0 items-center rounded-sm px-2 py-1 transition-colors"
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
                className="flex min-w-0 items-center gap-1.5 rounded-sm px-2 py-1 text-sm font-semibold whitespace-nowrap text-[var(--color-text-primary)]"
              >
                {renderIcon('text-brand-500 h-4 w-4 shrink-0')}
                <span className="truncate" data-crumb-label>
                  <bdi>{label}</bdi>
                </span>
              </span>
            ) : onClick ? (
              <button type="button" onClick={() => onClick()} className={linkClass}>
                {renderIcon('h-4 w-4 shrink-0')}
                <span className="truncate" data-crumb-label>
                  <bdi>{label}</bdi>
                </span>
              </button>
            ) : (
              <AppLink href={href ?? '#'} className={linkClass}>
                {renderIcon('h-4 w-4 shrink-0')}
                <span className="truncate" data-crumb-label>
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
