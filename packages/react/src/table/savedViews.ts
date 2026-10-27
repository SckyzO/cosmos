import { resolveColumnVisibility } from './columnVisibility';
import type { ColumnFilters } from './pipeline';
import type { ColumnDef, DataTableView } from './types';

// The logic behind the saved views of a DataTable, kept apart from the component so it can be
// unit-tested. Internal: not re-exported.

/** What a view holds besides its identity: the state of the table. */
export type ViewState = Omit<DataTableView, 'id' | 'name'>;

/** The filters of a view as the table keeps them: column key → set of values. */
export const recordToFilters = (record: Record<string, string[]>): ColumnFilters => {
  const out: ColumnFilters = {};
  for (const [key, values] of Object.entries(record)) {
    if (values.length > 0) out[key] = new Set(values);
  }
  return out;
};

const sameFilters = (a: Record<string, string[]>, b: Record<string, string[]>): boolean => {
  const keys = (r: Record<string, string[]>) => Object.keys(r).filter((k) => r[k].length > 0);
  const ka = keys(a);
  if (ka.length !== keys(b).length) return false;
  return ka.every((k) => {
    const va = new Set(a[k]);
    const vb = new Set(b[k] ?? []);
    return va.size === vb.size && [...va].every((v) => vb.has(v));
  });
};

/**
 * Whether the table is still as the view saved it. The visibility of a column the view says
 * nothing about is what the column does by default, as in the table.
 */
export const viewMatches = <T>(
  view: DataTableView,
  current: ViewState,
  columns: ColumnDef<T>[]
): boolean => {
  const { shown } = resolveColumnVisibility(columns, view.columnVisibility);
  return (
    view.search === current.search &&
    sameFilters(view.filters, current.filters) &&
    view.sort?.key === current.sort?.key &&
    view.sort?.direction === current.sort?.direction &&
    view.pageSize === current.pageSize &&
    view.density === current.density &&
    columns.every((col) => shown[col.key] === current.columnVisibility[col.key])
  );
};

/**
 * Why `name` cannot be a view's name, or `null` when it can: it is empty, or another view has it
 * (ignoring case and surrounding spaces). `exceptId` is the view being renamed.
 */
export const viewNameError = (
  name: string,
  views: DataTableView[],
  exceptId?: string
): string | null => {
  const wanted = name.trim().toLowerCase();
  if (wanted === '') return 'Enter a name.';
  if (views.some((v) => v.id !== exceptId && v.name.trim().toLowerCase() === wanted)) {
    return 'A view with this name already exists.';
  }
  return null;
};

/** An id no view has yet. Not a UUID: `crypto.randomUUID` needs a secure context. */
export const newViewId = (views: DataTableView[]): string => {
  const taken = new Set(views.map((v) => v.id));
  const base = `view-${Date.now().toString(36)}`;
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
};
