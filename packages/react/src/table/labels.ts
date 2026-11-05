// The English the table components write, their part of `CosmosLabels` (`englishLabels`).

export type ActiveFiltersBarLabels = {
  /** The line before the chips. Default `Active filters:`. */
  title: string;
  /** Name of a chip's remove button, given the column it filters. Default `Clear Status filter`. */
  clearOne: (column: string) => string;
  /** The button that clears every filter. Default `Clear all`. */
  clearAll: string;
};

export type ColumnFilterDropdownLabels = {
  /** Placeholder of the field that narrows the values. Default `Search…`. */
  searchPlaceholder: string;
  /** The line shown when no value matches the search. Default `No results`. */
  noResults: string;
  /** The button that unchecks every value, given how many are checked. Default `Clear (2 selected)`. */
  clear: (count: number) => string;
};

export type ColumnHeaderLabels = {
  /** Name of a column's filter button, given the column's header. Default `Filter Status`. */
  filter: (column: string) => string;
  /** The same when the header is not text. Default `Filter column`. */
  filterColumn: string;
  /**
   * The same once values are checked, given the name above and how many. Default
   * `Filter Status, 2 selected`.
   */
  filterSelected: (name: string, count: number) => string;
};

export type RowActionsMenuLabels = {
  /** Name of the ⋮ button when the host passes no `aria-label`. Default `Row actions`. */
  trigger: string;
};

export type DataTableLabels = {
  /** Title of the empty state when the host passes no `emptyTitle`. Default `No results`. */
  emptyTitle: string;
  /** Placeholder of the search field. Default `Search…`. */
  searchPlaceholder: string;
  /** Name of the search field. Default `Search rows`. */
  search: string;
  /** Name of the button that empties the search field. Default `Clear search`. */
  clearSearch: string;
  /** The button of the empty state that clears the search and the filters. Default `Clear filters`. */
  clearFilters: string;
  /** Hidden text of the status that announces a load. Default `Loading…`. */
  loading: string;
  /** Hidden header of the column that expands the rows. Default `Details`. */
  detailsHeader: string;
  /** Header of the row actions column. Default `Action`. */
  actionHeader: string;
  /** Name of a row's closed expander, given the row's key. Default `Show details for node-1`. */
  showDetails: (row: string | number) => string;
  /** Name of a row's open expander. Default `Hide details for node-1`. */
  hideDetails: (row: string | number) => string;
  /** Name of a row's checkbox, given the row's key. Default `Select row node-1`. */
  selectRow: (row: string | number) => string;
  /** Name of the checkbox of the header. Default `Select all rows`. */
  selectAll: string;
  /** The count of the selection bar. Default `3 selected`. */
  selected: (count: number) => string;
  /** The button that clears the selection. Default `Clear`. */
  clearSelection: string;
  /** Name of the pager, given the table's name. Default `Recent alerts pagination`. */
  pagination: (name: string) => string;
  /** The export button, given how many rows are selected (0: all). Default `Export`, `Export 3`. */
  export: (selected: number) => string;
  /** The "Rows per page" select. Default `Rows per page`. */
  rowsPerPage: string;
  /** The tab that clears a filter in `filterTabs`. Default `All`. */
  filterAll: string;
  /** The columns button and its menu. Default `Columns`. */
  columns: string;
  /** The menu of the bulk actions that fold. Default `Actions`. */
  bulkActions: string;

  // ── Saved views ──
  /** The views button and its menu, with no active view. Default `Views`. */
  views: string;
  /** The views button for an active view the table moved away from. Default `Errors (modified)`. */
  viewModified: (name: string) => string;
  /** The menu line when there is no view. Default `No saved views`. */
  noViews: string;
  /** Menu item that saves the state as a view. Default `Save as…`. */
  saveViewAs: string;
  /** Menu item that renames the active view. Default `Rename…`. */
  renameView: string;
  /** Menu item and button that delete the active view. Default `Delete`. */
  deleteView: string;
  /** Title of the dialog that saves a view. Default `Save view as`. */
  saveViewTitle: string;
  /** Title of the dialog that renames a view. Default `Rename view`. */
  renameViewTitle: string;
  /** Submit button of the rename dialog. Default `Rename`. */
  rename: string;
  /** Title of the confirmation, given the view's name. Default `Delete "Errors"?`. */
  deleteViewTitle: (name: string) => string;
  /** Text of the confirmation. Default `The view is removed. The table keeps what it shows now.`. */
  deleteViewMessage: string;
  /** Name of the field of a view's name. Default `View name`. */
  viewName: string;
  /** Error under that field when it is empty. Default `Enter a name.`. */
  viewNameEmpty: string;
  /** Error under that field when another view has the name. Default `A view with this name already exists.`. */
  viewNameTaken: string;

  // ── Cards on a phone ──
  /** The filters button and the title of its sheet. Default `Filters`. */
  filters: string;
  /** The sheet's button that clears every filter. Default `Clear all`. */
  clearAll: string;
  /** The sheet's button that closes it, given how many rows the filters keep. Default `Show 12 rows`. */
  showRows: (count: number) => string;
  /** Name of the "Sort by" select. Default `Sort by`. */
  sortBy: string;
  /** The option that leaves the rows as given. Default `Default order`. */
  defaultOrder: string;
  /** Option that sorts a column ascending, given its name. Default `Name, ascending`. */
  sortAscending: (column: string) => string;
  /** Option that sorts a column descending. Default `Name, descending`. */
  sortDescending: (column: string) => string;

  // ── Inline editing ──
  /** Name of the spinner of a cell being saved. Default `Saving`. */
  saving: string;
  /** Name of an editable cell's field, given the column and the row's key. Default `Rack for node-a02`. */
  editField: (column: string, row: string | number) => string;
  /** Name of a cell's pencil button. Default `Edit Rack for node-a02`. */
  editCell: (column: string, row: string | number) => string;
  /** Hidden text after the value of an editable cell, given the column. Default `, edit Rack`. */
  editCellHint: (column: string) => string;
  /** Hint under a cell's editor. Default `Enter saves · Esc cancels`. */
  editKeys: string;
  /** The Edit button of a row, and its name with the row's key. Default `Edit`, `Edit node-a02`. */
  edit: string;
  editRow: (row: string | number) => string;
  /** The Save button of an editor. Default `Save`. */
  save: string;
  /** The Cancel button of an editor, and of the views dialogs. Default `Cancel`. */
  cancel: string;
  /** The error shown when a save fails with no message. Default `Not saved`. */
  notSaved: string;
};

export const ACTIVE_FILTERS_BAR_LABELS: ActiveFiltersBarLabels = {
  title: 'Active filters:',
  clearOne: (column) => `Clear ${column} filter`,
  clearAll: 'Clear all',
};

export const COLUMN_FILTER_DROPDOWN_LABELS: ColumnFilterDropdownLabels = {
  searchPlaceholder: 'Search…',
  noResults: 'No results',
  clear: (count) => `Clear (${count} selected)`,
};

export const COLUMN_HEADER_LABELS: ColumnHeaderLabels = {
  filter: (column) => `Filter ${column}`,
  filterColumn: 'Filter column',
  filterSelected: (name, count) => `${name}, ${count} selected`,
};

export const ROW_ACTIONS_MENU_LABELS: RowActionsMenuLabels = { trigger: 'Row actions' };

export const DATA_TABLE_LABELS: DataTableLabels = {
  emptyTitle: 'No results',
  searchPlaceholder: 'Search…',
  search: 'Search rows',
  clearSearch: 'Clear search',
  clearFilters: 'Clear filters',
  loading: 'Loading…',
  detailsHeader: 'Details',
  actionHeader: 'Action',
  showDetails: (row) => `Show details for ${row}`,
  hideDetails: (row) => `Hide details for ${row}`,
  selectRow: (row) => `Select row ${row}`,
  selectAll: 'Select all rows',
  selected: (count) => `${count} selected`,
  clearSelection: 'Clear',
  pagination: (name) => `${name} pagination`,
  export: (selected) => (selected > 0 ? `Export ${selected}` : 'Export'),
  rowsPerPage: 'Rows per page',
  filterAll: 'All',
  columns: 'Columns',
  bulkActions: 'Actions',

  views: 'Views',
  viewModified: (name) => `${name} (modified)`,
  noViews: 'No saved views',
  saveViewAs: 'Save as…',
  renameView: 'Rename…',
  deleteView: 'Delete',
  saveViewTitle: 'Save view as',
  renameViewTitle: 'Rename view',
  rename: 'Rename',
  deleteViewTitle: (name) => `Delete "${name}"?`,
  deleteViewMessage: 'The view is removed. The table keeps what it shows now.',
  viewName: 'View name',
  viewNameEmpty: 'Enter a name.',
  viewNameTaken: 'A view with this name already exists.',

  filters: 'Filters',
  clearAll: 'Clear all',
  showRows: (count) => `Show ${count} ${count === 1 ? 'row' : 'rows'}`,
  sortBy: 'Sort by',
  defaultOrder: 'Default order',
  sortAscending: (column) => `${column}, ascending`,
  sortDescending: (column) => `${column}, descending`,

  saving: 'Saving',
  editField: (column, row) => `${column} for ${row}`,
  editCell: (column, row) => `Edit ${column} for ${row}`,
  editCellHint: (column) => `, edit ${column}`,
  editKeys: 'Enter saves · Esc cancels',
  edit: 'Edit',
  editRow: (row) => `Edit ${row}`,
  save: 'Save',
  cancel: 'Cancel',
  notSaved: 'Not saved',
};
