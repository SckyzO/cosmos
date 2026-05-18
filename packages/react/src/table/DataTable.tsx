import { clsx } from 'clsx';
import { Search, X } from 'lucide-react';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ColumnHeader } from './ColumnHeader';
import { ActiveFiltersBar, type ActiveFilter } from './ActiveFiltersBar';
import { Pagination } from './Pagination';
import { Checkbox } from '../forms/Checkbox';
import { LoadingState } from '../feedback/LoadingState';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import type { ColumnDef, SortDirection } from './types';

export type DataTableProps<T> = {
  rows: T[];
  columns: ColumnDef<T>[];
  rowKey: (row: T) => string | number;
  /** Optional right-edge action column (typically a `RowActionButton`). */
  renderRowAction?: (row: T) => React.ReactNode;
  pageSize?: number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;

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

  className?: string;
};

const ALIGN_CELL = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

/**
 * DataTable — opinionated data table with sticky header, per-column sort and
 * filter, active filter chips bar, pagination, integrated loading / error /
 * empty states, optional row selection with bulk actions, and an optional
 * global search bar.
 */
export const DataTable = <T,>({
  rows,
  columns,
  rowKey,
  renderRowAction,
  pageSize = 25,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'No results',
  emptyDescription,
  selectable = false,
  selection: selectionProp,
  defaultSelection,
  onSelectionChange,
  bulkActions,
  searchValue: searchValueProp,
  defaultSearchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  className,
}: DataTableProps<T>) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [page, setPage] = useState(0);
  const [showAll, setShowAll] = useState(false);

  // Selection state (controlled / uncontrolled).
  const [internalSelection, setInternalSelection] = useState<Set<string | number>>(
    defaultSelection ?? new Set()
  );
  const isSelectionControlled = selectionProp !== undefined;
  const selection = isSelectionControlled ? selectionProp : internalSelection;
  const updateSelection = useCallback(
    (next: Set<string | number>) => {
      if (!isSelectionControlled) setInternalSelection(next);
      onSelectionChange?.(next);
    },
    [isSelectionControlled, onSelectionChange]
  );

  // Search state (controlled / uncontrolled).
  const [internalSearch, setInternalSearch] = useState(defaultSearchValue ?? '');
  const isSearchControlled = searchValueProp !== undefined;
  const searchEnabled =
    isSearchControlled || defaultSearchValue !== undefined || onSearchChange !== undefined;
  const searchValue = isSearchControlled ? searchValueProp! : internalSearch;
  const setSearch = useCallback(
    (value: string) => {
      if (!isSearchControlled) setInternalSearch(value);
      onSearchChange?.(value);
      setPage(0);
    },
    [isSearchControlled, onSearchChange]
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
  const columnFilterValues = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const col of columns) {
      if (!col.filterable) continue;
      const vals = new Set<string>();
      for (const row of rows) {
        const v = col.filterValue ? col.filterValue(row) : '';
        if (v) vals.add(v);
      }
      out[col.key] = Array.from(vals).sort();
    }
    return out;
  }, [rows, columns]);

  // Pipeline: search → column filters → sort.
  const searchedRows = useMemo(() => {
    if (!searchEnabled || searchValue.trim().length === 0) return rows;
    const needle = searchValue.trim().toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const haystack = col.searchValue
          ? col.searchValue(row)
          : col.filterValue
            ? col.filterValue(row)
            : '';
        return haystack.toLowerCase().includes(needle);
      })
    );
  }, [rows, columns, searchEnabled, searchValue]);

  const filteredRows = useMemo(() => {
    if (Object.keys(filters).length === 0) return searchedRows;
    return searchedRows.filter((row) =>
      columns.every((col) => {
        const sel = filters[col.key];
        if (!sel || sel.size === 0) return true;
        const v = col.filterValue ? col.filterValue(row) : '';
        return sel.has(v);
      })
    );
  }, [searchedRows, columns, filters]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filteredRows;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [filteredRows, columns, sortKey, sortDir]);

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
        'flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
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
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
              className="focus:border-brand-500 h-full w-full rounded-lg border border-gray-200 bg-white pr-9 pl-9 text-sm transition-colors focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
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

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center py-10">
            <LoadingState />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center py-10">
            <ErrorState message={error} onRetry={onRetry} />
          </div>
        ) : sortedRows.length === 0 ? (
          <div className="flex h-full items-center justify-center py-10">
            <EmptyState title={emptyTitle} description={emptyDescription} />
          </div>
        ) : (
          <table className="w-full table-fixed">
            <colgroup>
              {selectable && <col style={{ width: '44px' }} />}
              {columns.map((c) => (
                <col key={c.key} style={c.width ? { width: c.width } : undefined} />
              ))}
              {renderRowAction && <col style={{ width: '8%' }} />}
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {selectable && (
                  <th className="bg-gray-50 px-4 py-3 dark:bg-gray-800">
                    <Checkbox
                      aria-label="Select all rows"
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected}
                      onChange={toggleAllVisible}
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <ColumnHeader
                    key={col.key}
                    label={col.label}
                    align={col.align}
                    sortable={col.sortable}
                    filterable={col.filterable}
                    sortDir={sortKey === col.key ? sortDir : null}
                    onSortToggle={() => handleSortToggle(col.key)}
                    filterValues={columnFilterValues[col.key]}
                    filterSelected={filters[col.key]}
                    onFilterToggle={(v) => handleFilterToggle(col.key, v)}
                    onFilterClear={() => clearFilter(col.key)}
                  />
                ))}
                {renderRowAction && (
                  <th className="bg-gray-50 px-4 py-3 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase dark:bg-gray-800 dark:text-gray-400">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {pageRows.map((row) => {
                const key = rowKey(row);
                const isSelected = selection.has(key);
                return (
                  <tr
                    key={key}
                    className={clsx(
                      'hover:bg-gray-50 dark:hover:bg-white/5',
                      isSelected && 'bg-brand-50/40 dark:bg-brand-500/5'
                    )}
                  >
                    {selectable && (
                      <td className="px-4 py-3.5">
                        <Checkbox
                          aria-label={`Select row ${key}`}
                          checked={isSelected}
                          onChange={() => toggleRow(key)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={clsx('px-4 py-3.5 text-sm', ALIGN_CELL[col.align ?? 'left'])}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                    {renderRowAction && (
                      <td className="px-4 py-3.5 text-right">{renderRowAction(row)}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && !error && sortedRows.length > 0 && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          total={sortedRows.length}
          pageSize={pageSize}
          onPageChange={setPage}
          showAll={showAll}
          onToggleShowAll={setShowAll}
        />
      )}
    </div>
  );
};
