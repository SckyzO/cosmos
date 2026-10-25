import type { ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc';

/** Row height of a `DataTable`: the standard rows, or taller `comfortable` ones. */
export type DataTableDensity = 'default' | 'comfortable';

export type ColumnDef<T> = {
  /** Stable key — used for sort/filter identity. */
  key: string;
  label: ReactNode;
  /** Optional fixed width (CSS value, e.g. `'20%'` or `'180px'`). */
  width?: string;
  /** Tailwind text alignment override. */
  align?: 'left' | 'right' | 'center';
  /** Renders the cell for a row. */
  render: (row: T) => ReactNode;
  /** Returns the raw sortable value for the row. */
  sortValue?: (row: T) => string | number | null;
  /** Returns the raw filterable string for the row. */
  filterValue?: (row: T) => string;
  /** Returns the searchable string for the row. Falls back to `filterValue` if absent. */
  searchValue?: (row: T) => string;
  sortable?: boolean;
  filterable?: boolean;
  /**
   * With `columnsMenu`, whether the column can be hidden from the menu. Default `true`; `false`
   * keeps it shown and its checkbox disabled (the column that names the row).
   */
  hideable?: boolean;
  /** Starts hidden, until `columnVisibility` or the menu says otherwise. */
  defaultHidden?: boolean;
};
