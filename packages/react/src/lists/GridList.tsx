import { clsx } from 'clsx';
import type { ReactNode, ComponentPropsWithRef } from 'react';

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

export type GridListProps = Omit<ComponentPropsWithRef<'ul'>, 'children'> & {
  /**
   * Maximum number of columns. The grid starts at one column on phones and adds
   * one at `sm`, `lg` and `xl` until it reaches this count.
   */
  cols?: GridListCols;
  /** Gap class (Tailwind). Default `gap-6` (24px). */
  gapClassName?: string;
  children: ReactNode;
};

/**
 * Responsive grid of cards, as a `<ul>`. `GridList.Card` is one `<li>`; a
 * `GridList.Footer` of `GridList.FooterAction` links closes a card with a split
 * action row.
 */
function GridListRoot({
  cols = 3,
  gapClassName = 'gap-6',
  className,
  children,
  ref,
  ...rest
}: GridListProps) {
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
}

// ── Card ─────────────────────────────────────────────────────────────────────

export type GridListCardProps = ComponentPropsWithRef<'li'>;

/**
 * One card of the grid. Its direct children are separated by a divider, so wrap
 * the card body in a single element and put the `GridList.Footer` after it.
 */
function GridListCard({ className, children, ref, ...rest }: GridListCardProps) {
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
}

// ── Footer (split actions row, divided vertically) ──────────────────────────

export type GridListFooterProps = ComponentPropsWithRef<'div'>;

/**
 * Split action row at the bottom of a card. `className` styles the inner flex
 * row; `ref` and the other props go to the outer wrapper.
 */
function GridListFooter({ className, children, ref, ...rest }: GridListFooterProps) {
  return (
    <div ref={ref} {...rest}>
      <div className={clsx('-mt-px flex divide-x divide-gray-200 dark:divide-white/10', className)}>
        {children}
      </div>
    </div>
  );
}

// ── FooterAction (one cell of the split footer) ─────────────────────────────

export type GridListFooterActionProps = ComponentPropsWithRef<'a'> & {
  /** Index in the footer row — only used to apply `-ml-px` on cells after the first. */
  index?: number;
};

/** One link of the footer row. The first and last cells round the card's bottom corners. */
function GridListFooterAction({
  index = 0,
  className,
  children,
  ref,
  ...rest
}: GridListFooterActionProps) {
  return (
    // The cell's position picks the card corner it rounds: first bottom-left, last bottom-right.
    <div className={clsx('group/action flex w-0 flex-1', index > 0 && '-ml-px')}>
      <a
        ref={ref}
        className={clsx(
          'relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 border border-transparent py-4 text-sm font-semibold text-gray-900 group-first/action:rounded-bl-lg group-last/action:rounded-br-lg hover:bg-gray-50 dark:text-white dark:hover:bg-white/5',
          className
        )}
        {...rest}
      >
        {children}
      </a>
    </div>
  );
}

// ── Compound export ──────────────────────────────────────────────────────────

export const GridList = Object.assign(GridListRoot, {
  Card: GridListCard,
  Footer: GridListFooter,
  FooterAction: GridListFooterAction,
});
