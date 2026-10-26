import type { ColumnDef } from './types';

// Which columns of a DataTable are shown, kept apart from the component so it can be unit-tested.
// Internal: not re-exported.

/** Column key → shown. A key that is missing takes the column's own default. */
export type ColumnVisibility = Record<string, boolean>;

/**
 * The columns to draw. A column that cannot be hidden (`hideable: false`) is always there, a
 * column with no entry follows `defaultHidden`. If nothing is left (a controlled value that
 * hides every column), all of them are shown: a table with no column is no table.
 */
export const resolveColumnVisibility = <T>(
  columns: ColumnDef<T>[],
  visibility: ColumnVisibility
): { visible: ColumnDef<T>[]; shown: ColumnVisibility } => {
  const shown: ColumnVisibility = {};
  for (const col of columns) {
    shown[col.key] = col.hideable === false || (visibility[col.key] ?? !col.defaultHidden);
  }
  const visible = columns.filter((col) => shown[col.key]);
  if (visible.length > 0) return { visible, shown };
  const all: ColumnVisibility = {};
  for (const col of columns) all[col.key] = true;
  return { visible: columns, shown: all };
};

/**
 * Whether the column's checkbox can be toggled: not a `hideable: false` column, and not the last
 * one shown (hiding it would leave no column).
 */
export const canToggleColumn = <T>(
  columns: ColumnDef<T>[],
  shown: ColumnVisibility,
  key: string
): boolean => {
  const col = columns.find((c) => c.key === key);
  if (!col || col.hideable === false) return false;
  if (!shown[key]) return true;
  return columns.filter((c) => shown[c.key]).length > 1;
};
