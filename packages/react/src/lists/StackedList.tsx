import { clsx } from 'clsx';
import { ChevronRight } from 'lucide-react';
import type { ReactNode, ComponentPropsWithRef } from 'react';

// ── Root ─────────────────────────────────────────────────────────────────────
// TUI reference: <ul role="list" class="divide-y divide-gray-100">
//                light pattern; dark variant uses divide-white/5

export type StackedListProps = Omit<ComponentPropsWithRef<'ul'>, 'children'> & {
  children: ReactNode;
};

/**
 * Divided list of rows: avatar, title and subtitle on the left; a meta column
 * (hidden on phones), a trailing slot and a chevron on the right. An item with
 * `href` is a link across the whole row.
 *
 * Related: `StackedListInCard` puts these rows in a card, `NarrowStackedList`
 * suits narrow columns (timestamps, letter headings), `ContentStackedList`
 * shows content rows with a badge and dotted meta instead of people.
 */
function StackedListRoot({ className, children, ref, ...rest }: StackedListProps) {
  return (
    <ul
      ref={ref}
      role="list"
      className={clsx('divide-y divide-gray-100 dark:divide-white/5', className)}
      {...rest}
    >
      {children}
    </ul>
  );
}

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

export type StackedListItemProps = ComponentPropsWithRef<'li'> & {
  /** Leading slot — typically an `<img>` (size-12, rounded-full) or `<Avatar>`. */
  avatar?: ReactNode;
  /** Primary text. */
  title: ReactNode;
  /** Secondary text below the title (truncated by default). */
  subtitle?: ReactNode;
  /** Right-aligned meta column, hidden on mobile (mirrors TUI `hidden sm:flex`). */
  meta?: ReactNode;
  /** Trailing slot rendered after `meta` (icon, actions menu, badge…). */
  trailing?: ReactNode;
  /**
   * If set, the entire row becomes a navigable link via a full-row overlay
   * (TUI pattern: `<a><span class="absolute inset-x-0 -top-px bottom-0"></span></a>`).
   * `trailing` is lifted above the overlay so its actions stay clickable; give
   * any other interactive element (in `subtitle` or `meta`) `position: relative`.
   */
  href?: string;
  /** When `href` is set, also append a chevron-right icon to indicate navigation. */
  chevron?: boolean;
};

function StackedListItem({
  avatar,
  title,
  subtitle,
  meta,
  trailing,
  href,
  chevron,
  className,
  ref,
  ...rest
}: StackedListItemProps) {
  // The full-row link overlay needs the <li> to be `relative`.
  const isLinked = Boolean(href);

  const titleEl = isLinked ? (
    <p className="text-sm/6 font-semibold text-gray-900 dark:text-white">
      <a href={href} className="focus:outline-hidden">
        {/* Full-row click target */}
        <span className="absolute inset-x-0 -top-px bottom-0" aria-hidden />
        {title}
      </a>
    </p>
  ) : (
    <p className="text-sm/6 font-semibold text-gray-900 dark:text-white">{title}</p>
  );

  return (
    <li
      ref={ref}
      className={clsx(
        'flex justify-between gap-x-6 py-5',
        isLinked && 'has-focus-visible:focus-indicator relative has-focus-visible:ring-inset',
        className
      )}
      {...rest}
    >
      <div className="flex min-w-0 gap-x-4">
        {avatar}
        <div className="min-w-0 flex-auto">
          {titleEl}
          {subtitle && (
            <p className="mt-1 truncate text-xs/5 text-gray-500 dark:text-gray-400">{subtitle}</p>
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
              className="size-5 flex-none text-gray-400 dark:text-gray-500"
              aria-hidden
            />
          )}
        </div>
      )}
    </li>
  );
}

// ── Compound export ──────────────────────────────────────────────────────────

export const StackedList = Object.assign(StackedListRoot, { Item: StackedListItem });
