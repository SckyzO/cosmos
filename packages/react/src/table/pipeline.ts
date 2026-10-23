import type { ColumnDef, SortDirection } from './types';

// The row pipeline of DataTable (search → column filters → sort), kept apart
// from the component so it can be unit-tested. Internal: not re-exported.

/** The values selected per column key; a column without a selection filters nothing. */
export type ColumnFilters = Record<string, Set<string>>;

/** The unique, non-empty filter values of each filterable column, sorted. */
export const columnFilterValues = <T>(
  rows: T[],
  columns: ColumnDef<T>[]
): Record<string, string[]> => {
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
};

/**
 * The rows where any column's text (`searchValue`, else `filterValue`)
 * contains `search`, ignoring case and surrounding spaces. All rows for a
 * blank `search`.
 */
export const searchRows = <T>(rows: T[], columns: ColumnDef<T>[], search: string): T[] => {
  if (search.trim().length === 0) return rows;
  const needle = search.trim().toLowerCase();
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
};

/** The rows whose `filterValue` is selected, for every column that has a selection. */
export const filterRows = <T>(rows: T[], columns: ColumnDef<T>[], filters: ColumnFilters): T[] => {
  if (Object.keys(filters).length === 0) return rows;
  return rows.filter((row) =>
    columns.every((col) => {
      const sel = filters[col.key];
      if (!sel || sel.size === 0) return true;
      const v = col.filterValue ? col.filterValue(row) : '';
      return sel.has(v);
    })
  );
};

/**
 * A copy of the rows sorted by the `sortValue` of the `sortKey` column, or the
 * rows as they are with no key or a column without `sortValue`. Rows with a
 * null or undefined value go last, whatever the direction.
 */
export const sortRows = <T>(
  rows: T[],
  columns: ColumnDef<T>[],
  sortKey: string | null,
  sortDir: SortDirection
): T[] => {
  if (!sortKey) return rows;
  const col = columns.find((c) => c.key === sortKey);
  if (!col?.sortValue) return rows;
  const dir = sortDir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = col.sortValue!(a);
    const bv = col.sortValue!(b);
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
};
