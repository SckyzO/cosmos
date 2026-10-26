import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Checkbox } from '../forms/Checkbox';
import { Select } from '../forms/Select';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { Sk } from '../feedback/Skeleton';
import { isRowClick, RAISE_CONTROLS, ROW_LINK } from './rowInteraction';
import {
  mobileLabelOf,
  mobileSortOptions,
  mobileSortValue,
  parseMobileSort,
  splitMobileColumns,
} from './mobileCards';
import type { ColumnDef, SortDirection } from './types';

// DataTable's `mobileLayout="cards"` below `sm`: the rows as a list of blocks, and the "Sort by"
// select that replaces the column headers. Internal: not re-exported.
//
// A list, not the table with `display` changed: a `table` whose rows and cells are blocks loses
// its roles unless every one gets an explicit `role`, and a cell's header would still be a column
// header that is no longer there. A `<ul>` of `<li>` reads as "list, 25 items", and each pair is
// a term and its description with the label as real text. DataTable draws this and the table
// together and shows one at a time with `sm:hidden` / `max-sm:hidden` (`display: none` takes the
// other out of the accessibility tree), so there is no media query in JavaScript and no flash.

type DataTableMobileCardsProps<T> = {
  /** The page's rows. */
  rows: T[];
  /** The shown columns. */
  columns: ColumnDef<T>[];
  rowKey: (row: T) => string | number;
  selectable: boolean;
  isSelected: (key: string | number) => boolean;
  onToggleRow: (key: string | number) => void;
  renderRowAction?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  rowHref?: (row: T) => string | undefined;
  loading: boolean;
  loadingRows: number;
  error: string | null;
  onRetry?: () => void;
  emptyTitle: string;
  emptyDescription?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

const ROW_DIVIDER = 'divide-y divide-gray-200 dark:divide-gray-800';

export const DataTableMobileCards = <T,>({
  rows,
  columns,
  rowKey,
  selectable,
  isSelected,
  onToggleRow,
  renderRowAction,
  onRowClick,
  rowHref,
  loading,
  loadingRows,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: DataTableMobileCardsProps<T>) => {
  const { title, pairs } = splitMobileColumns(columns);

  if (loading) {
    return (
      <div className="sm:hidden">
        <span role="status" className="sr-only">
          Loading…
        </span>
        <ul aria-hidden className={ROW_DIVIDER}>
          {Array.from({ length: loadingRows }, (_, i) => (
            <li key={i} className="flex flex-col gap-3 px-4 py-4">
              <Sk h="h-5" w="w-40" />
              {pairs.map((col) => (
                <Sk key={col.key} h="h-3" w="w-full" />
              ))}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (error || rows.length === 0) {
    return (
      <div className="flex justify-center px-4 sm:hidden">
        {error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </div>
    );
  }

  return (
    <ul
      role="list"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={clsx(ROW_DIVIDER, 'sm:hidden')}
    >
      {rows.map((row) => {
        const key = rowKey(row);
        const selected = isSelected(key);
        const href = rowHref?.(row);
        // A link is the focusable thing of its card; without one, the card itself is.
        const focusableRow = onRowClick && !href;
        return (
          <li
            key={key}
            tabIndex={focusableRow ? 0 : undefined}
            onClick={
              onRowClick
                ? (e) => {
                    if (isRowClick(e)) onRowClick(row);
                  }
                : undefined
            }
            onKeyDown={
              focusableRow
                ? (e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    onRowClick(row);
                  }
                : undefined
            }
            className={clsx(
              'px-4 py-3',
              selected && 'bg-brand-50/40 dark:bg-brand-500/5',
              (onRowClick || href) && 'cursor-pointer',
              focusableRow && 'focus-visible:focus-indicator focus-visible:ring-inset',
              href &&
                'has-[[data-row-link]:focus-visible]:focus-indicator relative has-[[data-row-link]:focus-visible]:ring-inset'
            )}
          >
            <div className="flex items-center gap-3 text-sm">
              {selectable && (
                <div className={clsx('flex shrink-0 items-center', href && 'relative z-[1]')}>
                  <Checkbox
                    aria-label={`Select row ${key}`}
                    checked={selected}
                    onChange={() => onToggleRow(key)}
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {title &&
                  (href ? (
                    <a href={href} data-row-link className={ROW_LINK}>
                      {title.render(row)}
                    </a>
                  ) : (
                    title.render(row)
                  ))}
              </div>
              {renderRowAction && (
                <div className={clsx('flex shrink-0 items-center', href && 'relative z-[1]')}>
                  {renderRowAction(row)}
                </div>
              )}
            </div>
            {pairs.length > 0 && (
              // The hairline between two pairs is lighter than the divider between two cards, so
              // the boundary of a row stays the strongest line in every theme.
              <dl className="mt-3 text-sm">
                {pairs.map((col) => (
                  <div
                    key={col.key}
                    className="flex items-baseline justify-between gap-4 border-t border-gray-100 py-2 first:border-t-0 first:pt-0 last:pb-0 dark:border-gray-800/60"
                  >
                    <dt className="shrink-0 text-[var(--color-text-muted)]">
                      {mobileLabelOf(col)}
                    </dt>
                    <dd className={clsx('min-w-0 text-right', href && RAISE_CONTROLS)}>
                      {col.render(row)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        );
      })}
    </ul>
  );
};

type DataTableMobileSortProps<T> = {
  columns: ColumnDef<T>[];
  sortKey: string | null;
  sortDir: SortDirection;
  onSortChange: (key: string | null, dir: SortDirection) => void;
};

/** The "Sort by" select of the toolbar's second line: one option per sortable column and direction. */
export const DataTableMobileSort = <T,>({
  columns,
  sortKey,
  sortDir,
  onSortChange,
}: DataTableMobileSortProps<T>) => (
  <div className="min-w-0 flex-1">
    <Select
      aria-label="Sort by"
      options={mobileSortOptions(columns)}
      value={mobileSortValue(sortKey, sortDir)}
      onChange={(e) => {
        const next = parseMobileSort(e.target.value);
        onSortChange(next.key, next.dir);
      }}
    />
  </div>
);
