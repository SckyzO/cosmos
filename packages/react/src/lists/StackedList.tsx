import { clsx } from 'clsx';
import { ChevronRight } from 'lucide-react';
import {
  Children,
  createContext,
  Fragment,
  useContext,
  type ReactNode,
  type ComponentPropsWithRef,
} from 'react';
import { AppLink } from '../ui/AppLink';

// The `card` mode of the list reaches its items without a prop on each of them.
const CardContext = createContext(false);

// ── Root ─────────────────────────────────────────────────────────────────────
// TUI reference: <ul role="list" class="divide-y divide-gray-100">
//                light pattern; dark variant uses divide-white/5

export type StackedListProps = Omit<ComponentPropsWithRef<'ul'>, 'children' | 'title'> & {
  children: ReactNode;
  /**
   * Put the list on a card surface (ring, shadow, rounded from `sm` up) and inset its items
   * so their content clears the card edge. `className` then styles the card; `ref` and the
   * other props stay on the `<ul>`.
   */
  card?: boolean;
  /** Card header title, above the rows. Only with `card`. */
  title?: ReactNode;
  /** Card header text under the title. Only with `card`. */
  description?: ReactNode;
  /** Card header action at the end of the title row (a link, a button). Only with `card`. */
  action?: ReactNode;
};

/**
 * Divided list of rows: avatar, title and subtitle at the start; a meta column
 * (hidden on phones), a trailing slot and a chevron at the end. An item with
 * `href` is a link across the whole row.
 *
 * Items also take a `badge` and a line of `details` for content rows (issues,
 * projects), a `timestamp` and a `description` for narrow columns, and a `rank`
 * for "top N" lists. `StackedList.Header` adds group headings between items.
 * With `card` the list sits on a card surface, with an optional header.
 */
function StackedListRoot({
  card = false,
  title,
  description,
  action,
  className,
  children,
  ref,
  ...rest
}: StackedListProps) {
  const list = (
    <ul
      ref={ref}
      role="list"
      className={clsx('divide-y divide-gray-100 dark:divide-white/5', !card && className)}
      {...rest}
    >
      {children}
    </ul>
  );
  if (!card) return list;

  const hasHeader = Boolean(title || description || action);
  return (
    <div
      className={clsx(
        'overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 sm:rounded-md dark:bg-gray-900 dark:ring-white/10',
        className
      )}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-x-4 border-b border-gray-100 px-4 py-4 sm:px-6 dark:border-white/10">
          <div className="min-w-0">
            {title && (
              <h3 className="text-base/7 font-semibold text-gray-900 dark:text-white">{title}</h3>
            )}
            {description && (
              <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          {action && <div className="flex flex-none items-center">{action}</div>}
        </div>
      )}
      <CardContext value>{list}</CardContext>
    </div>
  );
}

// ── Header (TUI Pattern 11 — sticky group headings) ─────────────────────────

export type StackedListHeaderProps = Omit<ComponentPropsWithRef<'li'>, 'children'> & {
  /** Render with `position: sticky` so the header stays pinned while scrolling. */
  sticky?: boolean;
  children: ReactNode;
};

/**
 * Group heading, rendered as an `<li>` among the items of the same list. With
 * `sticky` it stays pinned to the top of the scrolling container.
 */
function StackedListHeader({ sticky, className, children, ref, ...rest }: StackedListHeaderProps) {
  return (
    <li
      ref={ref}
      className={clsx(
        'py-row-6 border-t border-b border-t-gray-200 border-b-gray-200 px-3 text-sm/6 font-semibold text-gray-900 dark:border-t-white/10 dark:border-b-white/10 dark:bg-gray-800 dark:text-white',
        // A pinned heading is a band over the rows that scroll under it: a deeper fill and a
        // shadow on its lower edge set it apart from them, where a loose one needs neither.
        sticky ? 'sticky top-0 z-10 bg-gray-100 shadow-xs' : 'bg-gray-50',
        className
      )}
      {...rest}
    >
      {children}
    </li>
  );
}

// ── Dot separator (TUI: <svg viewBox="0 0 2 2"><circle r=1 /></svg>) ─────────

const Dot = () => (
  <svg viewBox="0 0 2 2" className="size-0.5 flex-none fill-current" aria-hidden>
    <circle r="1" cx="1" cy="1" />
  </svg>
);

// ── Item ─────────────────────────────────────────────────────────────────────
// TUI reference (Simple, row markup):
//   <li class="flex justify-between gap-x-6 py-5">
//     <div class="flex min-w-0 gap-x-4">
//       {avatar — size-12 flex-none rounded-full bg-gray-50}
//       <div class="min-w-0 flex-auto">
//         <p class="text-sm/6 font-semibold text-gray-900">{title}</p>
//         <p class="mt-1 truncate text-xs/5 text-gray-500">{subtitle}</p>
//       </div>
//     </div>
//     <div class="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
//       {meta — also two <p> lines, hidden on mobile}
//     </div>
//   </li>

export type StackedListItemProps = Omit<ComponentPropsWithRef<'li'>, 'title'> & {
  /** Leading slot — typically an `<img>` (size-12, rounded-full) or `<Avatar>`. */
  avatar?: ReactNode;
  /** Primary text. */
  title: ReactNode;
  /** Secondary text below the title (truncated by default). */
  subtitle?: ReactNode;
  /** End-aligned meta column, hidden on mobile (mirrors TUI `hidden sm:flex`). */
  meta?: ReactNode;
  /** Trailing slot rendered after `meta` (icon, actions menu, badge…). */
  trailing?: ReactNode;
  /**
   * If set, the entire row becomes a navigable link via a full-row overlay
   * (TUI pattern: `<a><span class="absolute inset-x-0 -top-px bottom-0"></span></a>`).
   * `trailing` is lifted above the overlay so its actions stay clickable; give
   * any other interactive element (in `subtitle`, `details` or `meta`)
   * `position: relative`.
   */
  href?: string;
  /** When `href` is set, also append a chevron-right icon to indicate navigation. */
  chevron?: boolean;
  /** Position in a "top N" list, shown before the avatar. */
  rank?: ReactNode;
  /** Inline badge rendered next to the title. */
  badge?: ReactNode;
  /**
   * Inline items under the title (author, date, owner…) separated by a dot. Each item stays
   * on one line; the last one truncates when the row runs out of room. Not the `meta`
   * column.
   */
  details?: ReactNode[];
  /** Timestamp at the end of the title row, for a narrow column. */
  timestamp?: ReactNode;
  /** Body text under the title, clamped to two lines. Replaces `subtitle`. */
  description?: ReactNode;
};

function StackedListItem({
  avatar,
  title,
  subtitle,
  meta,
  trailing,
  href,
  chevron,
  rank,
  badge,
  details,
  timestamp,
  description,
  className,
  ref,
  ...rest
}: StackedListItemProps) {
  // The full-row link overlay needs the <li> to be `relative`.
  const isLinked = Boolean(href);
  // In a card the rows clear the card edge, which the bare list gets from its container.
  const inCard = useContext(CardContext);
  const detailItems = details ? Children.toArray(details) : [];

  const titleEl = isLinked ? (
    <p className="text-sm/6 font-semibold text-gray-900 dark:text-white">
      <AppLink href={href} className="focus:outline-hidden">
        {/* Full-row click target */}
        <span className="absolute inset-x-0 -top-px bottom-0" aria-hidden />
        <bdi>{title}</bdi>
      </AppLink>
    </p>
  ) : (
    <p className="text-sm/6 font-semibold text-gray-900 dark:text-white">
      <bdi>{title}</bdi>
    </p>
  );
  // In a narrow row the badge goes under the title rather than wrapping inside itself.
  const titleRow = badge ? (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
      {titleEl}
      <span className="flex-none">{badge}</span>
    </div>
  ) : (
    titleEl
  );

  return (
    <li
      ref={ref}
      className={clsx(
        'py-row-20 flex justify-between gap-x-6',
        (badge || detailItems.length > 0) && 'items-center',
        isLinked && 'has-focus-visible:focus-indicator relative has-focus-visible:ring-inset',
        inCard && 'px-4 sm:px-6',
        className
      )}
      {...rest}
    >
      <div className="flex min-w-0 gap-x-4">
        {rank != null && (
          <span className="w-5 flex-none self-center text-sm/6 font-semibold text-[var(--color-text-muted)] tabular-nums">
            {rank}
          </span>
        )}
        {avatar}
        <div className="min-w-0 flex-auto">
          {timestamp ? (
            <div className="flex items-baseline justify-between gap-x-4">
              {titleRow}
              <p className="flex-none text-xs/5 text-gray-600 dark:text-gray-400">{timestamp}</p>
            </div>
          ) : (
            titleRow
          )}
          {description ? (
            <p className="mt-1 line-clamp-2 text-sm/6 text-gray-600 dark:text-gray-400">
              <bdi>{description}</bdi>
            </p>
          ) : (
            subtitle && (
              <p className="mt-1 truncate text-xs/5 text-gray-500 dark:text-gray-400">
                <bdi>{subtitle}</bdi>
              </p>
            )
          )}
          {detailItems.length > 0 && (
            <div className="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500 dark:text-gray-400">
              {detailItems.map((item, i) => (
                <Fragment key={i}>
                  {i > 0 && <Dot />}
                  {/* One line per item; the last one truncates when the row runs out of room. */}
                  <span className={i === detailItems.length - 1 ? 'truncate' : 'whitespace-nowrap'}>
                    <bdi>{item}</bdi>
                  </span>
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
      {(meta || trailing || (isLinked && chevron)) && (
        <div className="flex shrink-0 items-center gap-x-4">
          {meta && <div className="hidden sm:flex sm:flex-col sm:items-end">{meta}</div>}
          {/* Positioned after the overlay in tree order, so it paints above it. */}
          {trailing &&
            (isLinked ? (
              <div className="relative flex items-center gap-x-4">{trailing}</div>
            ) : (
              trailing
            ))}
          {isLinked && chevron && (
            <ChevronRight
              className="size-5 flex-none text-gray-400 rtl:-scale-x-100 dark:text-gray-500"
              aria-hidden
            />
          )}
        </div>
      )}
    </li>
  );
}

// ── Compound export ──────────────────────────────────────────────────────────

export const StackedList = Object.assign(StackedListRoot, {
  Header: StackedListHeader,
  Item: StackedListItem,
});
