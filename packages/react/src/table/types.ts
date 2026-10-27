import type { ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc';

/** The column a `DataTable` is sorted by and the direction, or `null` for the order of `rows`. */
export type DataTableSort = { key: string; direction: SortDirection } | null;

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
  /**
   * The cell's value in a CSV export (`exportable`, `toCsv`). Without it the export takes
   * `sortValue`, then `searchValue`, then `filterValue`, then an empty cell. `null` is an empty
   * cell too.
   */
  exportValue?: (row: T) => string | number | null;
  sortable?: boolean;
  filterable?: boolean;
  /**
   * With `columnsMenu`, whether the column can be hidden from the menu. Default `true`; `false`
   * keeps it shown and its checkbox disabled (the column that names the row).
   */
  hideable?: boolean;
  /** Starts hidden, until `columnVisibility` or the menu says otherwise. */
  defaultHidden?: boolean;
  /**
   * With `mobileLayout="cards"`, below `sm`: `'title'` makes the column the heading of the card
   * (the first one of them; the first column when none is marked), `'hidden'` leaves it out of
   * the card. The others become label/value pairs. The table above `sm` ignores it.
   */
  mobile?: 'title' | 'hidden';
  /** The label of the column's pair in a card, in place of `label` (a short or plain-text one). */
  mobileLabel?: ReactNode;
};
