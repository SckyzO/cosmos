import { clsx } from 'clsx';
import { forwardRef, type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';

// TUI Plus reference (Pattern 1 — "Contact cards with small portraits"):
//   <ul role="list" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
//     {people.map((p) => (
//       <li class="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
//         <div class="flex w-full items-center justify-between space-x-6 p-6">
//           <div class="flex-1 truncate">
//             <div class="flex items-center space-x-3">
//               <h3 class="truncate text-sm font-medium text-gray-900">{name}</h3>
//               {badge && <span class="…">{badge}</span>}
//             </div>
//             <p class="mt-1 truncate text-sm text-gray-500">{role}</p>
//           </div>
//           <img class="size-10 shrink-0 rounded-full bg-gray-300" />
//         </div>
//         <div>
//           <div class="-mt-px flex divide-x divide-gray-200">
//             <div class="flex w-0 flex-1">
//               <a class="…"><Envelope /> Email</a>
//             </div>
//             <div class="-ml-px flex w-0 flex-1">
//               <a class="…"><Phone /> Call</a>
//             </div>
//           </div>
//         </div>
//       </li>
//     ))}
//   </ul>

export type GridListCols = 1 | 2 | 3 | 4;

const COLS_CLASS: Record<GridListCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

// ── Root ─────────────────────────────────────────────────────────────────────

export type GridListProps = Omit<HTMLAttributes<HTMLUListElement>, 'children'> & {
  /** Number of columns at the widest viewport. Responsive defaults below. */
  cols?: GridListCols;
  /** Gap class (Tailwind). Default `gap-6` (24px). */
  gapClassName?: string;
  children: ReactNode;
};

const Root = forwardRef<HTMLUListElement, GridListProps>(function GridListRoot(
  { cols = 3, gapClassName = 'gap-6', className, children, ...rest },
  ref
) {
  return (
    <ul
      ref={ref}
      role="list"
      className={clsx('grid', COLS_CLASS[cols], gapClassName, className)}
      {...rest}
    >
      {children}
    </ul>
  );
});

// ── Card ─────────────────────────────────────────────────────────────────────

export type GridListCardProps = HTMLAttributes<HTMLLIElement>;

const Card = forwardRef<HTMLLIElement, GridListCardProps>(function GridListCard(
  { className, children, ...rest },
  ref
) {
  return (
    <li
      ref={ref}
      className={clsx(
        'col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow dark:divide-white/10 dark:bg-gray-900 dark:ring-1 dark:ring-white/10',
        className
      )}
      {...rest}
    >
      {children}
    </li>
  );
});

// ── Footer (split actions row, divided vertically) ──────────────────────────

export type GridListFooterProps = HTMLAttributes<HTMLDivElement>;

const Footer = forwardRef<HTMLDivElement, GridListFooterProps>(function GridListFooter(
  { className, children, ...rest },
  ref
) {
  return (
    <div ref={ref} {...rest}>
      <div className={clsx('-mt-px flex divide-x divide-gray-200 dark:divide-white/10', className)}>
        {children}
      </div>
    </div>
  );
});

// ── FooterAction (one cell of the split footer) ─────────────────────────────

export type GridListFooterActionProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** Index in the footer row — only used to apply `-ml-px` on cells after the first. */
  index?: number;
};

const FooterAction = forwardRef<HTMLAnchorElement, GridListFooterActionProps>(
  function GridListFooterAction({ index = 0, className, children, ...rest }, ref) {
    return (
      <div className={clsx('flex w-0 flex-1', index > 0 && '-ml-px')}>
        <a
          ref={ref}
          className={clsx(
            'relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5',
            className
          )}
          {...rest}
        >
          {children}
        </a>
      </div>
    );
  }
);

// ── Compound export ──────────────────────────────────────────────────────────

export const GridList = Object.assign(Root, {
  Card,
  Footer,
  FooterAction,
});
