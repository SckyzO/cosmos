import { clsx } from 'clsx';
import {
  forwardRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ReactNode,
} from 'react';

// ── Root ─────────────────────────────────────────────────────────────────────
// TUI reference (Pattern 10 — "Narrow"):
//   <ul role="list" class="divide-y divide-gray-100">

export type NarrowStackedListProps = Omit<HTMLAttributes<HTMLUListElement>, 'children'> & {
  children: ReactNode;
};

const NarrowStackedListRoot = forwardRef<HTMLUListElement, NarrowStackedListProps>(
  function NarrowStackedListRoot({ className, children, ...rest }, ref) {
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
  },
);

// ── Header (TUI Pattern 11 — sticky group headings) ─────────────────────────

export type NarrowStackedListHeaderProps = Omit<LiHTMLAttributes<HTMLLIElement>, 'children'> & {
  /** Render with `position: sticky` so the header stays pinned while scrolling. */
  sticky?: boolean;
  children: ReactNode;
};

const NarrowStackedListHeader = forwardRef<HTMLLIElement, NarrowStackedListHeaderProps>(
  function NarrowStackedListHeader({ sticky, className, children, ...rest }, ref) {
    return (
      <li
        ref={ref}
        className={clsx(
          'border-b border-t border-b-gray-200 border-t-gray-200 bg-gray-50 px-3 py-1.5 text-sm/6 font-semibold text-gray-900 dark:border-b-white/10 dark:border-t-white/10 dark:bg-gray-800/60 dark:text-white',
          sticky && 'sticky top-0 z-10',
          className,
        )}
        {...rest}
      >
        {children}
      </li>
    );
  },
);

// ── Item ─────────────────────────────────────────────────────────────────────
// Three layout shapes depending on which props are passed:
//
//  - simple (Pattern 10): avatar + (title, subtitle)
//      <li class="flex gap-x-4 py-5">
//        {avatar} <div><p>{title}</p><p>{subtitle}</p></div>
//      </li>
//
//  - with trailing (Pattern 12): + right-aligned action
//      <li class="flex justify-between gap-x-6 py-5">
//        <div class="flex gap-x-4">{avatar} <div>{title/subtitle}</div></div>
//        {trailing}
//      </li>
//
//  - with timestamp/description (Pattern 13): two-row layout next to avatar
//      <li class="flex gap-x-4 py-5">
//        {avatar}
//        <div class="flex-auto">
//          <div class="flex justify-between gap-x-4">
//            <p>{title}</p> <p>{timestamp}</p>
//          </div>
//          <p class="line-clamp-2">{description}</p>
//        </div>
//      </li>

export type NarrowStackedListItemProps = LiHTMLAttributes<HTMLLIElement> & {
  /** Leading slot — typically `<img class="size-12 rounded-full" />`. */
  avatar?: ReactNode;
  /** Primary text. */
  title: ReactNode;
  /** Secondary text below the title (truncated by default). */
  subtitle?: ReactNode;
  /** Optional right-of-title timestamp (Pattern 13). When set, an extra layout row is used. */
  timestamp?: ReactNode;
  /** Optional second body line (Pattern 13). Auto line-clamped to 2. */
  description?: ReactNode;
  /** Optional right-aligned trailing slot — action button, link (Pattern 12). */
  trailing?: ReactNode;
};

const NarrowStackedListItem = forwardRef<HTMLLIElement, NarrowStackedListItemProps>(
  function NarrowStackedListItem(
    { avatar, title, subtitle, timestamp, description, trailing, className, ...rest },
    ref,
  ) {
    const hasRichBody = Boolean(timestamp || description);

    if (hasRichBody) {
      return (
        <li
          ref={ref}
          className={clsx('flex gap-x-4 py-5', className)}
          {...rest}
        >
          {avatar}
          <div className="min-w-0 flex-auto">
            <div className="flex items-baseline justify-between gap-x-4">
              <p className="text-sm/6 font-semibold text-gray-900 dark:text-white">{title}</p>
              {timestamp && (
                <p className="flex-none text-xs/5 text-gray-600 dark:text-gray-400">
                  {timestamp}
                </p>
              )}
            </div>
            {description && (
              <p className="mt-1 line-clamp-2 text-sm/6 text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}
            {!description && subtitle && (
              <p className="mt-1 truncate text-xs/5 text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </li>
      );
    }

    if (trailing) {
      return (
        <li
          ref={ref}
          className={clsx('flex items-center justify-between gap-x-6 py-5', className)}
          {...rest}
        >
          <div className="flex min-w-0 gap-x-4">
            {avatar}
            <div className="min-w-0 flex-auto">
              <p className="text-sm/6 font-semibold text-gray-900 dark:text-white">{title}</p>
              {subtitle && (
                <p className="mt-1 truncate text-xs/5 text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {trailing}
        </li>
      );
    }

    return (
      <li
        ref={ref}
        className={clsx('flex gap-x-4 py-5', className)}
        {...rest}
      >
        {avatar}
        <div className="min-w-0">
          <p className="text-sm/6 font-semibold text-gray-900 dark:text-white">{title}</p>
          {subtitle && (
            <p className="mt-1 truncate text-xs/5 text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </li>
    );
  },
);

// ── Compound export ──────────────────────────────────────────────────────────

export const NarrowStackedList = Object.assign(NarrowStackedListRoot, {
  Header: NarrowStackedListHeader,
  Item: NarrowStackedListItem,
});
