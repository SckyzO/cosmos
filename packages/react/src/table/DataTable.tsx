import { clsx } from 'clsx';
import { useMemo, useState } from 'react';
import { ColumnHeader } from './ColumnHeader';
import { ActiveFiltersBar, type ActiveFilter } from './ActiveFiltersBar';
import { Pagination } from './Pagination';
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
  className?: string;
};

const ALIGN_CELL = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

/**
 * DataTable — opinionated data table with sticky header, per-column sort and
 * filter, active filter chips bar, pagination, and integrated loading /
 * error / empty states. Use for read-mostly tabular data.
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
  className,
}: DataTableProps<T>) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [page, setPage] = useState(0);
  const [showAll, setShowAll] = useState(false);

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

  const filteredRows = useMemo(() => {
    if (Object.keys(filters).length === 0) return rows;
    return rows.filter((row) =>
      columns.every((col) => {
        const sel = filters[col.key];
        if (!sel || sel.size === 0) return true;
        const v = col.filterValue ? col.filterValue(row) : '';
        return sel.has(v);
      })
    );
  }, [rows, columns, filters]);

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
              {columns.map((c) => (
                <col key={c.key} style={c.width ? { width: c.width } : undefined} />
              ))}
              {renderRowAction && <col style={{ width: '8%' }} />}
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-100 dark:border-gray-800">
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
              {pageRows.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-gray-50 dark:hover:bg-white/5">
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
              ))}
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
