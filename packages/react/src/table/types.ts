import type { ComponentType, ReactNode } from 'react';
import type { Intent } from '../ui/intent';
import type { ColumnVisibility } from './columnVisibility';

export type SortDirection = 'asc' | 'desc';

/** The column a `DataTable` is sorted by and the direction, or `null` for the order of `rows`. */
export type DataTableSort = { key: string; direction: SortDirection } | null;

/**
 * Row height of a `DataTable`: the standard rows, tighter `compact` ones or taller `comfortable`
 * ones. Same names as the page's `data-density`.
 */
export type DataTableDensity = 'compact' | 'default' | 'comfortable';

/** The edge of a `DataTable` a column is pinned to. */
export type ColumnPin = 'start' | 'end';

/**
 * What `ColumnEdit.render` gets to draw an editor: the draft and what to do with it. The draft is
 * a string, what a form field holds: parse it in `onCellEdit` / `onRowEdit`.
 */
export type CellEditor<T> = {
  /** The row being edited. */
  row: T;
  /** The draft value: `initialValue(row)` until `setValue` changes it. */
  value: string;
  /** Changes the draft. */
  setValue: (value: string) => void;
  /**
   * Saves the draft: what Enter does (and blur, with `editTrigger` `'cell'` and `'button'`). With
   * `editTrigger="row"` it saves the whole row.
   */
  commit: () => void;
  /** Drops the draft and closes the editor: what Escape does. With `'row'`, for the whole row. */
  cancel: () => void;
  /** A save is waiting for its promise (`'row'` only: a cell editor is closed meanwhile). */
  saving: boolean;
  /**
   * What the field needs, spread on it: its name (`aria-label`, "Rack for node-a02"), the error
   * tie (`aria-describedby`, `aria-invalid`), `disabled` while saving and a `className` that turns
   * the border red on `aria-invalid`. An `Input`, a `Select` or any field that takes these props
   * accepts the object as it is.
   */
  fieldProps: {
    'aria-label': string;
    'aria-describedby': string | undefined;
    'aria-invalid': true | undefined;
    disabled: boolean | undefined;
    /** Turns the border red while `aria-invalid` is set. */
    className: string;
  };
};

/** The editor of a column (`ColumnDef.edit`). */
export type ColumnEdit<T> = {
  /** The draft the editor starts from, for a row: usually the plain text of the cell. */
  initialValue: (row: T) => string;
  /**
   * Draws the editor from the existing form fields:
   * `(e) => <Input {...e.fieldProps} size="sm" value={e.value} onChange={(ev) => e.setValue(ev.target.value)} />`.
   * Enter, Escape and blur are handled by the table around it, not by the field.
   */
  render: (editor: CellEditor<T>) => ReactNode;
};

export type ColumnDef<T> = {
  /** Stable key — used for sort/filter identity. */
  key: string;
  label: ReactNode;
  /** Optional fixed width (CSS value, e.g. `'20%'` or `'180px'`). */
  width?: string;
  /** Text alignment override: `start` (the default), `end` or `center`. `end` is for numbers. */
  align?: 'start' | 'end' | 'center';
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
  /**
   * Makes the cells of the column editable (see `DataTable`'s `editTrigger`, `onCellEdit` and
   * `onRowEdit`): the editor to draw, and the draft it starts from. A cell's content is drawn
   * inside a button with `editTrigger` `'cell'`, so keep it to text and badges, with no link or
   * button of its own. Not in the cards of `mobileLayout="cards"`.
   */
  edit?: ColumnEdit<T>;
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
  /**
   * The `rowKey`s of the selected rows, present only while rows are selected: the export is of
   * those rows alone, whatever the search and the filters keep.
   */
  selection?: (string | number)[];
};

/**
 * A bulk action of `DataTable`'s `bulkActionItems`, shown while rows are selected. The first is a
 * button; when the bar runs out of room the others fold into an "Actions" menu, and on a phone
 * (`mobileLayout="cards"`) each one is an icon button named by its `label`.
 */
export type DataTableBulkAction<T> = {
  /** Identifies the action among the others. */
  key: string;
  /** The text of the button or menu item, and the name of its icon-only form. */
  label: string;
  /** Drawn before the label. An action with no icon is a text button on a phone too. */
  icon?: ComponentType<{ className?: string }>;
  /** `danger` colors a destructive action red. Default `neutral`. */
  intent?: Extract<Intent, 'neutral' | 'danger'>;
  disabled?: boolean;
  /** Called with the selected rows. */
  onClick: (selectedRows: T[]) => void;
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
