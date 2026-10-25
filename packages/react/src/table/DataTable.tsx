import { clsx } from 'clsx';
import { Search, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ColumnHeader } from './ColumnHeader';
import { ActiveFiltersBar, type ActiveFilter } from './ActiveFiltersBar';
import { Pagination } from '../navigation/Pagination';
import { Checkbox } from '../forms/Checkbox';
import { Sk } from '../feedback/Skeleton';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { BODY_CELL_PADDING, HEADER_CELL, HEADER_CELL_PADDING, SKELETON_WIDTHS } from './density';
import { columnFilterValues, filterRows, searchRows, sortRows } from './pipeline';
import { useControllableState } from '../hooks/useControllableState';
import { useOverflows } from '../hooks/useOverflows';
import { useScrollFade } from '../hooks/useScrollFade';
import { isRowClick, RAISE_CONTROLS, ROW_LINK } from './rowInteraction';
import { stickyBodyCell, stickyHeadCell, STICKY_AFTER_SELECT, STICKY_START } from './stickyColumn';
import type { ColumnDef, DataTableDensity, SortDirection } from './types';

export type DataTableProps<T> = {
  rows: T[];
  columns: ColumnDef<T>[];
  rowKey: (row: T) => string | number;
  /**
   * Called when a row is clicked, or when Enter or Space is pressed on it: the row then takes the
   * keyboard focus and a pointer cursor. A click on a control inside the row (the checkbox, the
   * action column, a link or button in a cell) does not call it. With `rowHref`, a click on the
   * row's link calls it too, once the browser follows the link.
   */
  onRowClick?: (row: T) => void;
  /**
   * Makes each row a link to the returned URL (a row that returns `undefined` stays a plain row).
   * The first column holds the link, drawn over the whole row: a click anywhere on it, a middle
   * click, "Open in a new tab" and Enter on the focused link all work as on a link. Keep the first
   * column's content free of buttons and links (they cannot nest in a link), and give the
   * others' as many as you want: they stay clickable above the row.
   */
  rowHref?: (row: T) => string | undefined;
  /** Optional right-edge action column (typically a `RowActionButton` or a `RowActionsMenu`). */
  renderRowAction?: (row: T) => React.ReactNode;
  pageSize?: number;
  /**
   * Keeps the header and shows `loadingRows` placeholder rows in place of the body, so the
   * columns and the page do not jump when the rows arrive.
   */
  loading?: boolean;
  /** How many placeholder rows `loading` draws. Default 5. */
  loadingRows?: number;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  /**
   * Row height. `default` keeps the standard rows. `comfortable` pads the
   * header and body cells more, for rows that carry two lines (a name over an
   * email, an avatar) or need more room. Cell content stays vertically centred.
   */
  density?: DataTableDensity;
  /**
   * Pins the first data column (and the selection column before it) to the start while the table
   * scrolls sideways, so the row stays identified on a narrow screen. With `rowHref`, the link
   * of the row then covers its own column, and a click on the rest of the row follows it from a
   * handler: middle click and the context menu work on the first column only.
   */
  stickyFirstColumn?: boolean;

  // ── Selection ──────────────────────────────────────────────────────────────
  /** Show a checkbox column and enable row selection. */
  selectable?: boolean;
  /** Controlled selection set (row keys). */
  selection?: Set<string | number>;
  defaultSelection?: Set<string | number>;
  onSelectionChange?: (selection: Set<string | number>) => void;
  /** Toolbar rendered above the table when `selection.size > 0`. Receives the selected rows. */
  bulkActions?: (selectedRows: T[]) => ReactNode;

  // ── Global search ──────────────────────────────────────────────────────────
  /** Controlled search value. When provided, the search input is shown. */
  searchValue?: string;
  defaultSearchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  /**
   * Names the table ("Recent alerts"). While the rows scroll, the scrolling area is a region
   * with the same name. Without a name (and without `aria-labelledby`) it is still focusable
   * while it scrolls, but it is not a region: a region with no name is no landmark.
   */
  'aria-label'?: string;
  /** Id of the element that names the table, in place of `aria-label`. */
  'aria-labelledby'?: string;

  className?: string;
};

// The selection and action columns keep these widths whatever the data columns add up to.
const SELECT_COLUMN_WIDTH = '44px';
const ACTION_COLUMN_WIDTH = '96px';

const ALIGN_CELL = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

/**
 * DataTable — opinionated data table with sticky header, per-column sort and
 * filter, active filter chips bar, pagination, integrated loading / error /
 * empty states, optional row selection with bulk actions, and an optional
 * global search bar. Give the container a height (`className="max-h-96"`) to
 * scroll the rows under the header: while they scroll, the scrolling area takes
 * the keyboard focus, so the arrow keys scroll it even when no cell holds a
 * control.
 */
export const DataTable = <T,>({
  rows,
  columns,
  rowKey,
  onRowClick,
  rowHref,
  renderRowAction,
  pageSize = 25,
  loading = false,
  loadingRows = 5,
  error = null,
  onRetry,
  emptyTitle = 'No results',
  emptyDescription,
  density = 'default',
  stickyFirstColumn = false,
  selectable = false,
  selection: selectionProp,
  defaultSelection,
  onSelectionChange,
  bulkActions,
  searchValue: searchValueProp,
  defaultSearchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
}: DataTableProps<T>) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrolls = useOverflows(scrollerRef);
  // An edge fades where the table goes on, as the Tabs' do; not the start one under a pinned column.
  const fade = useScrollFade(scrollerRef, { start: !stickyFirstColumn });
  // A region needs a name to be a landmark, and the table's own content is no name for it.
  const region = scrolls && Boolean(ariaLabel || ariaLabelledBy);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [page, setPage] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const [selection, updateSelection] = useControllableState<Set<string | number>>({
    value: selectionProp,
    defaultValue: () => defaultSelection ?? new Set(),
    onChange: onSelectionChange,
    name: 'DataTable.selection',
  });

  const [searchValue, setSearchState, isSearchControlled] = useControllableState({
    value: searchValueProp,
    defaultValue: defaultSearchValue ?? '',
    onChange: onSearchChange,
    name: 'DataTable.searchValue',
  });
  const searchEnabled =
    isSearchControlled || defaultSearchValue !== undefined || onSearchChange !== undefined;
  const setSearch = useCallback(
    (value: string) => {
      setSearchState(value);
      setPage(0);
    },
    [setSearchState]
  );

  const handleSortToggle = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
    }
  };

  const handleFilterToggle = (key: string, value: string) => {
    setFilters((prev) => {
      const next = new Set(prev[key] ?? []);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      const out = { ...prev };
      if (next.size === 0) delete out[key];
      else out[key] = next;
      return out;
    });
    setPage(0);
  };

  const clearFilter = (key: string) => {
    setFilters((prev) => {
      const out = { ...prev };
      delete out[key];
      return out;
    });
    setPage(0);
  };

  const clearAllFilters = () => {
    setFilters({});
    setPage(0);
  };

  // Build filter values per column (unique values currently present)
  const filterValues = useMemo(() => columnFilterValues(rows, columns), [rows, columns]);

  // Pipeline: search → column filters → sort.
  const searchedRows = useMemo(
    () => (searchEnabled ? searchRows(rows, columns, searchValue) : rows),
    [rows, columns, searchEnabled, searchValue]
  );

  const filteredRows = useMemo(
    () => filterRows(searchedRows, columns, filters),
    [searchedRows, columns, filters]
  );

  const sortedRows = useMemo(
    () => sortRows(filteredRows, columns, sortKey, sortDir),
    [filteredRows, columns, sortKey, sortDir]
  );

  // In a fixed layout the width the columns leave over is shared among all of them, the selection
  // and action columns too. When every data column states a width, the first one gives it up and
  // takes what is left, so those two stay as wide as asked.
  const firstColumnTakesTheRest =
    (selectable || Boolean(renderRowAction)) && columns.length > 0 && columns.every((c) => c.width);

  const columnCount = columns.length + (selectable ? 1 : 0) + (renderRowAction ? 1 : 0);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = showAll
    ? sortedRows
    : sortedRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

  // Selection helpers — operate on the *currently visible* rows so "select all"
  // never touches rows hidden by the search/filter pipeline.
  const visibleKeys = useMemo(() => sortedRows.map(rowKey), [sortedRows, rowKey]);
  const visibleSelectedCount = useMemo(
    () => visibleKeys.filter((k) => selection.has(k)).length,
    [visibleKeys, selection]
  );
  const allVisibleSelected = visibleKeys.length > 0 && visibleSelectedCount === visibleKeys.length;
  const someVisibleSelected = visibleSelectedCount > 0 && visibleSelectedCount < visibleKeys.length;

  const toggleAllVisible = () => {
    const next = new Set(selection);
    if (allVisibleSelected) {
      visibleKeys.forEach((k) => next.delete(k));
    } else {
      visibleKeys.forEach((k) => next.add(k));
    }
    updateSelection(next);
  };

  const toggleRow = (key: string | number) => {
    const next = new Set(selection);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    updateSelection(next);
  };

  const clearSelection = () => updateSelection(new Set());

  const selectedRows = useMemo(
    () => rows.filter((r) => selection.has(rowKey(r))),
    [rows, rowKey, selection]
  );

  const activeFilters: ActiveFilter[] = Object.entries(filters).map(([key, vals]) => ({
    key,
    label: columns.find((c) => c.key === key)?.label?.toString() ?? key,
    value: Array.from(vals).join(', '),
  }));

  return (
    <div
      className={clsx(
        'flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-[var(--color-bg-panel)] dark:border-gray-800',
        className
      )}
    >
      {/* Top toolbar: bulk actions when any selected, otherwise search bar. */}
      {selectable && selection.size > 0 ? (
        <div className="bg-brand-50 dark:bg-brand-500/10 flex items-center gap-3 border-b border-gray-100 px-4 py-2 dark:border-gray-800">
          <span className="text-brand-700 dark:text-brand-300 text-sm font-medium">
            {selection.size} selected
          </span>
          <button
            type="button"
            onClick={clearSelection}
            className="focus-visible:focus-indicator rounded text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear
          </button>
          <div className="ml-auto flex items-center gap-2">
            {bulkActions ? bulkActions(selectedRows) : null}
          </div>
        </div>
      ) : searchEnabled ? (
        <div className="border-b border-gray-100 px-4 py-2 dark:border-gray-800">
          <div className="relative h-9">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Search rows"
              className="focus:field-focus h-full w-full rounded-lg border border-gray-200 bg-white pr-9 pl-9 text-sm transition-colors placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="focus-visible:focus-indicator absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : null}

      <ActiveFiltersBar
        filters={activeFilters}
        onClearOne={clearFilter}
        onClearAll={clearAllFilters}
      />

      <div
        ref={scrollerRef}
        // Focusable only while it scrolls: a scroll container with no control inside is out of
        // reach of the keyboard, and one that fits would add a tab stop that does nothing.
        tabIndex={scrolls ? 0 : undefined}
        role={region ? 'region' : undefined}
        aria-label={region ? ariaLabel : undefined}
        aria-labelledby={region ? ariaLabelledBy : undefined}
        style={fade}
        className="focus-visible:focus-indicator min-h-0 flex-1 overflow-y-auto focus-visible:ring-inset"
      >
        {loading && (
          <span role="status" className="sr-only">
            Loading…
          </span>
        )}
        <table
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-busy={loading || undefined}
          className="w-full table-fixed"
        >
          <colgroup>
            {selectable && <col style={{ width: SELECT_COLUMN_WIDTH }} />}
            {columns.map((c, i) => (
              <col
                key={c.key}
                style={
                  c.width && !(i === 0 && firstColumnTakesTheRest) ? { width: c.width } : undefined
                }
              />
            ))}
            {renderRowAction && <col style={{ width: ACTION_COLUMN_WIDTH }} />}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {selectable && (
                <th
                  className={clsx(
                    HEADER_CELL,
                    HEADER_CELL_PADDING[density],
                    stickyFirstColumn && [stickyHeadCell(false), STICKY_START]
                  )}
                >
                  <div className="flex items-center">
                    <Checkbox
                      aria-label="Select all rows"
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected}
                      onChange={toggleAllVisible}
                    />
                  </div>
                </th>
              )}
              {columns.map((col, i) => (
                <ColumnHeader
                  key={col.key}
                  className={clsx(
                    stickyFirstColumn &&
                      i === 0 && [
                        stickyHeadCell(true),
                        selectable ? STICKY_AFTER_SELECT : STICKY_START,
                      ]
                  )}
                  label={col.label}
                  align={col.align}
                  sortable={col.sortable}
                  filterable={col.filterable}
                  sortDir={sortKey === col.key ? sortDir : null}
                  onSortToggle={() => handleSortToggle(col.key)}
                  filterValues={filterValues[col.key]}
                  filterSelected={filters[col.key]}
                  onFilterToggle={(v) => handleFilterToggle(col.key, v)}
                  onFilterClear={() => clearFilter(col.key)}
                  density={density}
                />
              ))}
              {renderRowAction && (
                <th className={clsx(HEADER_CELL, HEADER_CELL_PADDING[density], 'text-right')}>
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              Array.from({ length: loadingRows }, (_, i) => (
                <tr key={i}>
                  {selectable && <td className={clsx('px-4', BODY_CELL_PADDING[density])} />}
                  {columns.map((col, c) => (
                    <td
                      key={col.key}
                      className={clsx(
                        'px-4',
                        BODY_CELL_PADDING[density],
                        // The cell's own line height, so a row is as tall loading as loaded.
                        'text-sm',
                        ALIGN_CELL[col.align ?? 'left']
                      )}
                    >
                      <div
                        className={clsx(
                          'flex h-5 items-center',
                          col.align === 'right' && 'justify-end',
                          col.align === 'center' && 'justify-center'
                        )}
                      >
                        <Sk h="h-3" w={SKELETON_WIDTHS[(i + c) % SKELETON_WIDTHS.length]} />
                      </div>
                    </td>
                  ))}
                  {renderRowAction && (
                    <td className={clsx('px-4', BODY_CELL_PADDING[density])}>
                      <div className="flex h-5 items-center justify-end">
                        <Sk h="h-5" w="w-12" round="rounded-lg" />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : error || sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-4">
                  <div className="flex justify-center">
                    {error ? (
                      <ErrorState message={error} onRetry={onRetry} />
                    ) : (
                      <EmptyState title={emptyTitle} description={emptyDescription} />
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const key = rowKey(row);
                const isSelected = selection.has(key);
                const href = rowHref?.(row);
                // A link is the focusable thing of its row; without one, the row itself is.
                const focusableRow = onRowClick && !href;
                return (
                  <tr
                    key={key}
                    tabIndex={focusableRow ? 0 : undefined}
                    onClick={
                      onRowClick || (href && stickyFirstColumn)
                        ? (e) => {
                            if (!isRowClick(e)) return;
                            // The link covers its own column only: follow it from the rest of
                            // the row. Its click comes back here, and calls onRowClick.
                            const link =
                              e.currentTarget.querySelector<HTMLAnchorElement>('[data-row-link]');
                            if (link && stickyFirstColumn && !link.contains(e.target as Node)) {
                              link.click();
                              return;
                            }
                            onRowClick?.(row);
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
                      'hover:bg-gray-50 dark:hover:bg-white/5',
                      isSelected && 'bg-brand-50/40 dark:bg-brand-500/5',
                      (onRowClick || href) && 'cursor-pointer',
                      stickyFirstColumn && 'group',
                      focusableRow && 'focus-visible:focus-indicator focus-visible:ring-inset',
                      href &&
                        'has-[[data-row-link]:focus-visible]:focus-indicator relative has-[[data-row-link]:focus-visible]:ring-inset'
                    )}
                  >
                    {selectable && (
                      <td
                        className={clsx(
                          'px-4',
                          BODY_CELL_PADDING[density],
                          href && 'relative z-[1]',
                          stickyFirstColumn && [stickyBodyCell(isSelected, false), STICKY_START]
                        )}
                      >
                        {/* A flex box centres the checkbox; inline, it sat on the
                            text baseline and moved with the font metrics. */}
                        <div className="flex items-center">
                          <Checkbox
                            aria-label={`Select row ${key}`}
                            checked={isSelected}
                            onChange={() => toggleRow(key)}
                          />
                        </div>
                      </td>
                    )}
                    {columns.map((col, i) => (
                      <td
                        key={col.key}
                        className={clsx(
                          'px-4',
                          BODY_CELL_PADDING[density],
                          'text-sm',
                          ALIGN_CELL[col.align ?? 'left'],
                          href && i > 0 && RAISE_CONTROLS,
                          stickyFirstColumn &&
                            i === 0 && [
                              stickyBodyCell(isSelected, true),
                              selectable ? STICKY_AFTER_SELECT : STICKY_START,
                            ]
                        )}
                      >
                        {href && i === 0 ? (
                          <a href={href} data-row-link className={ROW_LINK}>
                            {col.render(row)}
                          </a>
                        ) : (
                          col.render(row)
                        )}
                      </td>
                    ))}
                    {renderRowAction && (
                      <td
                        className={clsx(
                          'px-4',
                          BODY_CELL_PADDING[density],
                          href && 'relative z-[1]'
                        )}
                      >
                        <div className="flex items-center justify-end">{renderRowAction(row)}</div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && sortedRows.length > 0 && (
        <Pagination
          page={safePage + 1}
          totalPages={totalPages}
          aria-label={ariaLabel ? `${ariaLabel} pagination` : undefined}
          showInfo
          total={sortedRows.length}
          pageSize={pageSize}
          onPageChange={(next) => setPage(next - 1)}
          showAll={showAll}
          onShowAllChange={setShowAll}
          className="shrink-0 border-t border-gray-100 px-4 py-3 dark:border-gray-800"
        />
      )}
    </div>
  );
};
