import { clsx } from 'clsx';
import { ChevronRight } from 'lucide-react';
import {
  forwardRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ReactNode,
} from 'react';

// ── Root ─────────────────────────────────────────────────────────────────────
// TUI reference: <ul role="list" class="divide-y divide-gray-100">
//                light pattern; dark variant uses divide-white/5

export type StackedListProps = Omit<HTMLAttributes<HTMLUListElement>, 'children'> & {
  children: ReactNode;
};

const StackedListRoot = forwardRef<HTMLUListElement, StackedListProps>(function StackedListRoot(
  { className, children, ...rest },
  ref,
) {
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
});

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

export type StackedListItemProps = LiHTMLAttributes<HTMLLIElement> & {
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
   * The overlay sits above the title text — other inner anchors stay on top via z-index.
   */
  href?: string;
  /** When `href` is set, also append a chevron-right icon to indicate navigation. */
  chevron?: boolean;
};

const StackedListItem = forwardRef<HTMLLIElement, StackedListItemProps>(function StackedListItem(
  {
    avatar,
    title,
    subtitle,
    meta,
    trailing,
    href,
    chevron,
    className,
    ...rest
  },
  ref,
) {
  // The full-row link overlay needs the <li> to be `relative`.
  const isLinked = Boolean(href);

  const titleEl = isLinked ? (
    <p className="text-sm/6 font-semibold text-gray-900 dark:text-white">
      <a href={href}>
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
        isLinked && 'relative',
        className,
      )}
      {...rest}
    >
      <div className="flex min-w-0 gap-x-4">
        {avatar}
        <div className="min-w-0 flex-auto">
          {titleEl}
          {subtitle && (
            <p className="mt-1 truncate text-xs/5 text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {(meta || trailing || (isLinked && chevron)) && (
        <div className="flex shrink-0 items-center gap-x-4">
          {meta && (
            <div className="hidden sm:flex sm:flex-col sm:items-end">{meta}</div>
          )}
          {trailing}
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
});

// ── Compound export ──────────────────────────────────────────────────────────

export const StackedList = Object.assign(StackedListRoot, { Item: StackedListItem });
