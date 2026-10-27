import type { ReactNode } from 'react';
import type { ColumnVisibility } from './columnVisibility';

export type SortDirection = 'asc' | 'desc';

/** The column a `DataTable` is sorted by and the direction, or `null` for the order of `rows`. */
export type DataTableSort = { key: string; direction: SortDirection } | null;

/** Row height of a `DataTable`: the standard rows, or taller `comfortable` ones. */
export type DataTableDensity = 'default' | 'comfortable';

/** The edge of a `DataTable` a column is pinned to. */
export type ColumnPin = 'start' | 'end';

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
   * The values this column's filter dropdown offers, in this order, in place of the distinct
   * `filterValue`s found in `rows` (sorted). Without `manual` they come from every row; with it
   * `rows` is one page, so list the values here or the dropdown offers that page's only. Valid in
   * both modes; a column with it still needs `filterable`.
   */
  filterOptions?: string[];
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
  /**
   * Pins the column to the `start` or the `end` of the table while it scrolls sideways, so a row
   * stays identified (a name at the start) or its status and actions stay in reach (at the end).
   * Several columns can sit on each side. List the pinned columns first (`start`) or last (`end`)
   * in `columns`: a pinned column keeps its place in the order. The selection and toggle columns
   * stay first, and pinned with the start columns; the action column is pinned with the end ones.
   * A shadow marks the edge while content scrolls under it. With `rowHref`, the link of the row
   * covers its own column only when that one is pinned, and a click on the rest of the row follows
   * it from a handler (middle click and the context menu work on that column only). The table
   * above `sm` only: the cards of `mobileLayout="cards"` ignore it.
   */
  pin?: ColumnPin;
  /** The label of the column's pair in a card, in place of `label` (a short or plain-text one). */
  mobileLabel?: ReactNode;
};

/** What `DataTable` hands to `onExport`: the table as the user has set it, not the file. */
export type DataTableExportQuery = {
  /** The search text (empty without a search). */
  search: string;
  /** Column `key` → the selected filter values. */
  filters: Record<string, string[]>;
  sort: DataTableSort;
  /** The keys of the visible data columns, in the order they are drawn. */
  columns: string[];
};

/**
 * A saved view of a `DataTable`: a name and every part of the state a user sets. Plain JSON, so
 * the host can keep it anywhere (local storage, a server).
 */
export type DataTableView = {
  /** Identifies the view; `activeView` holds it. Unique among the views of a table. */
  id: string;
  name: string;
  /** The search text. */
  search: string;
  /** Column `key` → the selected filter values. */
  filters: Record<string, string[]>;
  sort: DataTableSort;
  /** Column `key` → shown. */
  columnVisibility: ColumnVisibility;
  /** Rows per page; `'all'` is "Show all". */
  pageSize: number | 'all';
  density: DataTableDensity;
};
