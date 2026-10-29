import { clsx } from 'clsx';
import { ChevronDown, Download, Search, X } from 'lucide-react';
import { Fragment, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ColumnHeader } from './ColumnHeader';
import { DataTableColumnsMenu } from './DataTableColumnsMenu';
import { DataTableViews } from './DataTableViews';
import { DataTableMobileCards, DataTableMobileSort } from './DataTableMobileCards';
import { ActiveFiltersBar, type ActiveFilter } from './ActiveFiltersBar';
import { DataTableFilterTabsStrip, type DataTableFilterTabsConfig } from './DataTableFilterTabs';
import { PageSizeSelect } from './PageSizeSelect';
import { Pagination } from '../navigation/Pagination';
import { Checkbox } from '../forms/Checkbox';
import { Button } from '../ui/Button';
import { Sk } from '../feedback/Skeleton';
import { DIMMED, LoadingVeil } from './LoadingVeil';
import { AppLink } from '../ui/AppLink';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import {
  BODY_CELL_PADDING,
  HEADER_CELL,
  HEADER_CELL_PADDING,
  SKELETON_WIDTHS,
  VIRTUAL_CELL_HEIGHT,
  VIRTUAL_CELL_PADDING,
  VIRTUAL_ROW_HEIGHT,
} from './density';
import { resolveColumnVisibility, type ColumnVisibility } from './columnVisibility';
import { columnFilterValues, filterRows, filtersToRecord, searchRows, sortRows } from './pipeline';
import { newViewId, recordToFilters, type ViewState } from './savedViews';
import { useControllableState } from '../hooks/useControllableState';
import { toCsv } from './csv';
import { downloadCsv } from './download';
import { TOOLBAR_BUTTON } from './toolbarButton';
import { useOverflows } from '../hooks/useOverflows';
import { useScrollFade } from '../hooks/useScrollFade';
import { useVirtualWindow, windowParts } from '../hooks/useVirtualWindow';
import { detailRowId, toggleKey } from './expandedRows';
import { CellEditorBox, CellTrigger, RowEditActions, RowEditError } from './InlineEdit';
import { useInlineEdit } from './useInlineEdit';
import { rowInitials, triggerId } from './editing';
import { isRowClick, RAISE_CONTROLS, ROW_LINK } from './rowInteraction';
import { pinEdges, pinnedCell, pinOffsets, pinStyle } from './pinned';
import { usePinnedWidths } from './usePinnedWidths';
import { RowChevron } from './RowChevron';
import { useScrollEdges } from '../hooks/useScrollEdges';
import type {
  ColumnDef,
  ColumnPin,
  DataTableDensity,
  DataTableExportQuery,
  DataTableSort,
  DataTableView,
} from './types';

export type DataTableProps<T> = {
  rows: T[];
  columns: ColumnDef<T>[];
  rowKey: (row: T) => string | number;
  /**
   * Called when a row is clicked, or when Enter or Space is pressed on it: the row then takes the
   * keyboard focus and a pointer cursor. A click on a control inside the row (the checkbox, the
   * action column, a link or button in a cell) does not call it. With `rowHref`, a click on the
   * row's link calls it too, once the browser follows the link.
   */
  onRowClick?: (row: T) => void;
  /**
   * Makes each row a link to the returned URL (a row that returns `undefined` stays a plain row).
   * The first column holds the link, drawn over the whole row: a click anywhere on it, a middle
   * click, "Open in a new tab" and Enter on the focused link all work as on a link. Keep the first
   * column's content free of buttons and links (they cannot nest in a link), and give the
   * others' as many as you want: they stay clickable above the row.
   */
  rowHref?: (row: T) => string | undefined;
  /** Optional end-edge action column (typically a `RowActionButton` or a `RowActionsMenu`). */
  renderRowAction?: (row: T) => React.ReactNode;
  /**
   * Rows per page, when controlled. Without `pageSizeOptions` it is the fixed size. Default 25.
   */
  pageSize?: number;
  /**
   * The table is waiting for rows. With none on screen yet, it keeps the header and shows
   * `loadingRows` placeholder rows in place of the body, so the columns and the page do not jump
   * when the rows arrive. With rows on screen (the next page, a new sort), they stay, dimmed and
   * inert so nothing in them can be clicked meanwhile, under a centred spinner. The table is
   * `aria-busy` either way. The same in both modes.
   */
  loading?: boolean;
  /** How many placeholder rows `loading` draws. Default 5. */
  loadingRows?: number;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  /**
   * Row height. Without it (and without `defaultDensity`) the table follows the page's
   * `data-density`. Set, it is a local override of the page: `default` keeps the standard rows,
   * `compact` pads the header and body cells less, `comfortable` more, for rows that carry two
   * lines (a name over an email, an avatar) or need more room. Cell content stays vertically
   * centred. A `density` passed without `onDensityChange` is a controlled value that never
   * moves: applying a saved view then reports its density and keeps this one. A table that
   * follows the page saves `default` in a view.
   */
  density?: DataTableDensity;
  defaultDensity?: DataTableDensity;
  /** Called with the density to move to, in both modes (a saved view sets it). */
  onDensityChange?: (density: DataTableDensity) => void;

  // ── Expandable rows ────────────────────────────────────────────────────────
  /**
   * Makes the rows expandable: a first column holds a chevron button per row (`aria-expanded`,
   * `aria-controls` the detail row while it is open, named "Show details for <row key>"), and the
   * content this returns is drawn in a row below it that spans every column. Opening a row never
   * selects it nor counts as a click on it. Not combined with `virtualize`: the rows of a
   * virtualized table have one fixed height, so nothing expands there (the prop is ignored).
   * With `mobileLayout="cards"` below `sm` the chevron sits on the card's title line and the
   * content opens inside the card, under its fields.
   */
  renderExpandedRow?: (row: T) => ReactNode;
  /**
   * The keys (`rowKey`) of the open rows, when controlled. A controlled table shows a toggle once
   * the host passes the new set back through `onExpandedRowsChange`.
   */
  expandedRows?: Set<string | number>;
  defaultExpandedRows?: Set<string | number>;
  /** Called with the set of open row keys after a row is toggled, in both modes. */
  onExpandedRowsChange?: (expanded: Set<string | number>) => void;

  // ── Inline editing ─────────────────────────────────────────────────────────
  /**
   * How an editable cell (a column with `edit`) opens its editor. Only one cell, or one row, edits
   * at a time. Not combined with `virtualize` (its fixed-height cells would clip an editor and its
   * error) nor with the cards of `mobileLayout="cards"`: the prop is ignored there.
   * - `'cell'` (default): the cell's content is a button that fills it; a click, Enter or F2 on it
   *   opens the editor in place, focused. Enter or blur saves, Escape cancels and puts the focus
   *   back on the cell's button.
   * - `'button'`: a pencil button in each editable cell, shown on the hovered or focused row and
   *   always on a screen with no hover, opens the editor, which has Save and Cancel buttons too.
   *   Keys and blur as in `'cell'`.
   * - `'row'`: an Edit button in the row's action column turns every editable cell of the row into
   *   its field, with Cancel and Save in their place. Save (or Enter in a field) calls
   *   `onRowEdit` once with the cells that changed; Escape or Cancel drops the changes.
   */
  editTrigger?: 'cell' | 'button' | 'row';
  /**
   * Saves one cell, with `editTrigger` `'cell'` or `'button'`: the row, the column `key` and the
   * draft string (parse it yourself). Not called when the draft did not change. Without it those
   * cells are not editable. Return a promise to show the save: the cell is `aria-busy` with a
   * spinner until it settles, then the editor closes. If it rejects (or throws), the editor opens
   * again with the value the user typed, and the error's message shows under the cell, tied to the
   * field by `aria-describedby`. The table never changes `rows`: update them from here.
   */
  onCellEdit?: (row: T, columnKey: string, value: string) => void | PromiseLike<unknown>;
  /**
   * Saves a row, with `editTrigger="row"`: the row and its changes, column `key` → draft string,
   * for the cells that changed only (not called when none did). Without it the Edit button is not
   * shown. Return a promise to show the save: the row's Save button spins and the fields are
   * disabled until it settles. If it rejects (or throws) the fields stay open with what was typed,
   * and the error's message shows in a row under the row.
   */
  onRowEdit?: (row: T, changes: Record<string, string>) => void | PromiseLike<unknown>;

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

  /**
   * Names the table ("Recent alerts"). While the rows scroll, the scrolling area is a region
   * with the same name. Without a name (and without `aria-labelledby`) it is still focusable
   * while it scrolls, but it is not a region: a region with no name is no landmark.
   */
  'aria-label'?: string;
  /** Id of the element that names the table, in place of `aria-label`. */
  'aria-labelledby'?: string;

  className?: string;

  // ── Column filters ─────────────────────────────────────────────────────────
  /**
   * Controlled column filters: column `key` → the selected values. Pass this or `defaultFilters`;
   * a filter picked in a column header, a status tab or the active filters bar goes through
   * `onFiltersChange`, and a controlled table shows it once the host passes it back.
   */
  filters?: Record<string, Set<string>>;
  defaultFilters?: Record<string, Set<string>>;
  onFiltersChange?: (filters: Record<string, Set<string>>) => void;
  /**
   * Underlined tabs at the top of the card ("All", then one per option) that set the filter of
   * one column; "All" clears it. The tabs and the active filters bar stay in sync. The counts
   * come from the host (they may come from a server), the table never computes them.
   */
  filterTabs?: DataTableFilterTabsConfig;

  // ── Server mode ────────────────────────────────────────────────────────────
  /**
   * Turns the in-memory search, column filters, sort and pagination off: `rows` is the current
   * page as the host fetched it, drawn in its order, and nothing is filtered, reordered or sliced
   * here. The controls still report every change (`onSearchChange`, `onFiltersChange`,
   * `onSortChange`, `onPageChange`, `onPageSizeChange`), and the host fetches the next page.
   * Pass `rowCount` for the pager, and `filterOptions` on a filterable column (its values cannot
   * be read from one page). The built-in CSV export (`exportable`) holds only the loaded rows
   * here: pass `onExport` to export on the server. Selection works on the loaded rows; "Show
   * all" is not offered. Default `false`.
   */
  manual?: boolean;
  /**
   * With `manual`, the total number of rows across every page, for the pager and its "Showing X
   * to Y of Z". Without it the pager counts `rows.length`. Ignored without `manual`.
   */
  rowCount?: number;

  // ── Long lists ─────────────────────────────────────────────────────────────
  /**
   * Draws only the rows in view and a few around them, for thousands of rows on one page (a large
   * `pageSize`, or "Show all"): the rest are two spacers, so the scroll bar still stands for the
   * whole list. The header stays sticky, `aria-rowcount` and each row's `aria-rowindex` tell
   * assistive technology where the window is, and the row that holds the keyboard focus stays
   * drawn while it is scrolled out of view, so focus and selection survive scrolling.
   *
   * Every row has one fixed height, set by the density (41px `compact`, 49px, or 61px `comfortable`, at the
   * default text size, and growing with the text size setting): content taller than that is
   * clipped, so keep each cell to the one line of text (or a control) it has in a standard row.
   * The rows scroll in the table's own area:
   * give it a height (`className="max-h-96"`), or the window has no end. Table layout only: with
   * `mobileLayout="cards"` below `sm` the cards keep the pagination. Not for expandable rows nor
   * inline editing: both are off with it. On paper only the drawn rows print. Default `false`.
   */
  virtualize?: boolean;

  // ── Sort and page ──────────────────────────────────────────────────────────
  /**
   * The sort, when controlled: `{ key, direction }` of a column, or `null` for the order of
   * `rows`. A click on a sortable header, the "Sort by" select of the cards and a saved view go
   * through `onSortChange`, and a controlled table shows the new sort once the host passes it
   * back. Works with or without `manual`.
   */
  sort?: DataTableSort;
  /** The sort when uncontrolled. Default `null`. */
  defaultSort?: DataTableSort;
  /** Called with the sort to move to, in both modes. The table then goes back to the first page. */
  onSortChange?: (sort: DataTableSort) => void;
  /**
   * The current page, 1-indexed like `Pagination`, when controlled. Works with or without
   * `manual`. A change of the search, the filters, the sort or the page size goes back to page 1,
   * and a controlled table reports it through `onPageChange` (not when it is on page 1 already).
   */
  page?: number;
  /** The page when uncontrolled, 1-indexed. Default `1`. */
  defaultPage?: number;
  /** Called with the page to go to, in both modes. */
  onPageChange?: (page: number) => void;

  // ── Rows per page ──────────────────────────────────────────────────────────
  /** Rows per page when uncontrolled. Default 25. */
  defaultPageSize?: number;
  /** Called with the size to move to, in both modes; the table goes back to the first page. */
  onPageSizeChange?: (size: number) => void;
  /**
   * The sizes a "Rows per page" select offers in the footer, before "Show all" and the pager. The
   * select is shown only when this is set. A `pageSize` passed without `onPageSizeChange` is a
   * controlled value that never moves: the select then reports the pick and keeps the size.
   */
  pageSizeOptions?: number[];

  // ── Column visibility ──────────────────────────────────────────────────────
  /**
   * Shows a "Columns" button at the end of the toolbar, with a checkbox per column. The toolbar
   * then shows even without a search field. Default `false`.
   */
  columnsMenu?: boolean;
  /**
   * Controlled visibility: column key → shown. A key that is missing follows the column's
   * `defaultHidden`, and a `hideable: false` column is shown whatever it says.
   */
  columnVisibility?: ColumnVisibility;
  defaultColumnVisibility?: ColumnVisibility;
  /** Called with the visibility of every column when one is toggled from the menu. */
  onColumnVisibilityChange?: (visibility: ColumnVisibility) => void;

  // ── Export ─────────────────────────────────────────────────────────────────
  /**
   * Shows an "Export" button in the toolbar, before the "Columns" one; the toolbar then shows even
   * without a search field. It downloads a CSV of every page of the rows that the search, the
   * filters and the sort keep, in the visible columns and their order (the selection and action
   * columns are not data). With `manual` it holds the loaded rows only, one page: pass `onExport`
   * to export on the server. A column's header is its `label` when that is a string or a number,
   * else its `mobileLabel` when that is a string, else its `key`; its cells come from `exportValue`
   * (see `ColumnDef`, and `toCsv` for the format). The file is UTF-8 with a byte order mark, so
   * that spreadsheets read accents. Default `false`.
   */
  exportable?: boolean;
  /** Name of the downloaded file. Default `'export.csv'`. */
  exportFileName?: string;
  /**
   * Makes the Export button call this with what the table shows (search, filters, sort, visible
   * column keys) and build no file: for a host that exports on the server.
   */
  onExport?: (query: DataTableExportQuery) => void;

  // ── Saved views ────────────────────────────────────────────────────────────
  /**
   * The saved views, when controlled. Passing this or `defaultViews` shows a "Views" button in the
   * toolbar (which then shows even without a search field): its menu applies a view, saves the
   * current state as a new one, renames the active view or deletes it. A view holds the search,
   * filters, sort, visible columns, page size and density as plain JSON; the host keeps it
   * (`onViewsChange`). Applying a view sets each part through the table's own setters, so a
   * controlled part reports its `on*Change` (a part the host does not let move, such as a `pageSize`
   * with no `onPageSizeChange`, stays where it is), and goes back to the first page.
   */
  views?: DataTableView[];
  defaultViews?: DataTableView[];
  /** Called with the whole list after a view is saved, renamed or deleted. */
  onViewsChange?: (views: DataTableView[]) => void;
  /** The `id` of the active view, or `null` for none; when controlled. */
  activeView?: string | null;
  defaultActiveView?: string | null;
  /** Called with the `id` of the view that became active, or `null` (the active view was deleted). */
  onActiveViewChange?: (id: string | null) => void;

  // ── Narrow screens ─────────────────────────────────────────────────────────
  /**
   * What the rows become below `sm` (640px). `scroll` (the default) keeps the table, scrolling
   * sideways. `cards` swaps it for a list of blocks: the selection checkbox, the `mobile: 'title'`
   * column and the row action on the first line, then one label/value pair per remaining column
   * (`mobileLabel`, else the column header; `mobile: 'hidden'` leaves a column out). The toolbar
   * gets a second line with a "Sort by" select for the sortable columns and the columns button.
   * From `sm` up the table is the same either way.
   */
  mobileLayout?: 'scroll' | 'cards';
};

// The selection and action columns keep these widths whatever the data columns add up to.
const SELECT_COLUMN_WIDTH = '44px';
const EXPAND_COLUMN_WIDTH = '44px';
const ACTION_COLUMN_WIDTH = '96px';
// Room for Cancel and Save, in a row being edited.
const EDIT_ACTION_COLUMN_WIDTH = '176px';

const ALIGN_CELL = {
  start: 'text-start',
  end: 'text-end',
  center: 'text-center',
} as const;

/**
 * DataTable — opinionated data table with sticky header, per-column sort and
 * filter, active filter chips bar, pagination, integrated loading / error /
 * empty states, optional row selection with bulk actions, and an optional
 * global search bar. Give the container a height (`className="max-h-96"`) to
 * scroll the rows under the header: while they scroll, the scrolling area takes
 * the keyboard focus, so the arrow keys scroll it even when no cell holds a
 * control.
 */
export const DataTable = <T,>({
  rows,
  columns: allColumns,
  rowKey,
  onRowClick,
  rowHref,
  renderRowAction,
  pageSize: pageSizeProp,
  manual = false,
  rowCount,
  virtualize = false,
  loading = false,
  loadingRows = 5,
  error = null,
  onRetry,
  emptyTitle = 'No results',
  emptyDescription,
  density: densityProp,
  defaultDensity,
  onDensityChange,
  editTrigger = 'cell',
  onCellEdit,
  onRowEdit,
  renderExpandedRow,
  expandedRows: expandedRowsProp,
  defaultExpandedRows,
  onExpandedRowsChange,
  selectable = false,
  selection: selectionProp,
  defaultSelection,
  onSelectionChange,
  bulkActions,
  searchValue: searchValueProp,
  defaultSearchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  filters: filtersProp,
  defaultFilters,
  onFiltersChange,
  filterTabs,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  defaultPageSize = 25,
  onPageSizeChange,
  pageSizeOptions,
  columnsMenu = false,
  exportable = false,
  exportFileName = 'export.csv',
  onExport,
  views: viewsProp,
  defaultViews,
  onViewsChange,
  activeView: activeViewProp,
  defaultActiveView = null,
  onActiveViewChange,
  columnVisibility: columnVisibilityProp,
  defaultColumnVisibility,
  onColumnVisibilityChange,
  mobileLayout = 'scroll',
}: DataTableProps<T>) => {
  const mobileCards = mobileLayout === 'cards';
  const [density, setDensity] = useControllableState<
    DataTableDensity,
    [],
    DataTableDensity | undefined
  >({
    value: densityProp,
    defaultValue: defaultDensity,
    onChange: onDensityChange,
    name: 'DataTable.density',
  });
  const [columnVisibility, setColumnVisibility] = useControllableState<ColumnVisibility>({
    value: columnVisibilityProp,
    defaultValue: () => defaultColumnVisibility ?? {},
    onChange: onColumnVisibilityChange,
    name: 'DataTable.columnVisibility',
  });
  // `columns` below is what is drawn, searched and sorted; `allColumns` still names the filters.
  const { visible: columns, shown } = useMemo(
    () => resolveColumnVisibility(allColumns, columnVisibility),
    [allColumns, columnVisibility]
  );
  const viewsEnabled = viewsProp !== undefined || defaultViews !== undefined;
  const hasToolbarControls = columnsMenu || exportable || viewsEnabled;
  const columnsMenuNode = columnsMenu ? (
    <DataTableColumnsMenu
      columns={allColumns}
      shown={shown}
      onToggle={(key, visible) => setColumnVisibility({ ...shown, [key]: visible })}
    />
  ) : null;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrolls = useOverflows(scrollerRef);
  // An edge fades where the table goes on, as the Tabs' do; not the start one under a pinned column.
  const scrollEdges = useScrollEdges(scrollerRef);
  // Pinned columns. A cell's index counts the toggle and selection columns before the data
  // columns and the action column after them; those follow the data columns' pins.
  const dataPins = columns.map((col) => col.pin);
  const hasStartPin = dataPins.includes('start');
  const hasEndPin = dataPins.includes('end');
  // The link of a row covers its own column, which is a box of its own once that is pinned.
  const linkColumnPinned = dataPins[0] !== undefined;
  // An edge fades where the table goes on, as the Tabs' do; not under a pinned column.
  const fade = useScrollFade(scrollerRef, { start: !hasStartPin, end: !hasEndPin });
  // A region needs a name to be a landmark, and the table's own content is no name for it.
  const region = scrolls && Boolean(ariaLabel || ariaLabelledBy);
  const [sort, setSortState] = useControllableState<DataTableSort>({
    value: sortProp,
    defaultValue: defaultSort,
    onChange: onSortChange,
    name: 'DataTable.sort',
  });
  const sortKey = sort?.key ?? null;
  const sortDir = sort?.direction ?? 'asc';
  const [filters, setFilters] = useControllableState<Record<string, Set<string>>>({
    value: filtersProp,
    defaultValue: () => defaultFilters ?? {},
    onChange: onFiltersChange,
    name: 'DataTable.filters',
  });
  // 1-indexed, as `Pagination`'s; `safePage` below keeps it inside the pages that exist.
  const [page, setPage] = useControllableState({
    value: pageProp,
    defaultValue: defaultPage,
    onChange: onPageChange,
    name: 'DataTable.page',
  });
  // A change of search, filters, sort or page size shows page 1 again. Through the setter, so a
  // controlled host hears it; not when it is there already, so a keystroke is not a page change.
  const goToFirstPage = () => {
    if (page !== 1) setPage(1);
  };
  const [showAll, setShowAll] = useState(false);

  const expandable = Boolean(renderExpandedRow) && !virtualize;
  const [expanded, updateExpanded] = useControllableState<Set<string | number>>({
    value: expandedRowsProp,
    defaultValue: () => defaultExpandedRows ?? new Set(),
    onChange: onExpandedRowsChange,
    name: 'DataTable.expandedRows',
  });
  const tableId = useId();
  // Editing is off where an editor would not fit: windowed cells and cards.
  const anyEditable = !virtualize && columns.some((c) => c.edit);
  const rowEditing = anyEditable && editTrigger === 'row' && Boolean(onRowEdit);
  const cellEditing = anyEditable && editTrigger !== 'row' && Boolean(onCellEdit);
  const edit = useInlineEdit<T>({ onCellEdit, onRowEdit });
  const actionColumn = Boolean(renderRowAction) || rowEditing;

  const [selection, updateSelection] = useControllableState<Set<string | number>>({
    value: selectionProp,
    defaultValue: () => defaultSelection ?? new Set(),
    onChange: onSelectionChange,
    name: 'DataTable.selection',
  });

  const [searchValue, setSearchState, isSearchControlled] = useControllableState({
    value: searchValueProp,
    defaultValue: defaultSearchValue ?? '',
    onChange: onSearchChange,
    name: 'DataTable.searchValue',
  });
  const searchEnabled =
    isSearchControlled || defaultSearchValue !== undefined || onSearchChange !== undefined;
  const setSearch = (value: string) => {
    setSearchState(value);
    goToFirstPage();
  };

  const [pageSize, setPageSizeState] = useControllableState({
    value: pageSizeProp,
    defaultValue: defaultPageSize,
    onChange: onPageSizeChange,
    name: 'DataTable.pageSize',
  });
  const setPageSize = (size: number) => {
    setPageSizeState(size);
    goToFirstPage();
  };
  const setSort = (next: DataTableSort) => {
    setSortState(next);
    goToFirstPage();
  };

  const handleSortToggle = (key: string) => {
    if (sortKey !== key) setSort({ key, direction: 'asc' });
    else if (sortDir === 'asc') setSort({ key, direction: 'desc' });
    else setSort(null);
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
    goToFirstPage();
  };

  const clearFilter = (key: string) => {
    setFilters((prev) => {
      const out = { ...prev };
      delete out[key];
      return out;
    });
    goToFirstPage();
  };

  const selectFilterTab = (value: string | undefined) => {
    if (!filterTabs) return;
    if (value === undefined) clearFilter(filterTabs.columnKey);
    else {
      setFilters((prev) => ({ ...prev, [filterTabs.columnKey]: new Set([value]) }));
      goToFirstPage();
    }
  };

  const clearAllFilters = () => {
    setFilters({});
    goToFirstPage();
  };

  // Build filter values per column (unique values currently present)
  const filterValues = useMemo(() => columnFilterValues(rows, columns), [rows, columns]);

  // Pipeline: search → column filters → sort.
  // With `manual` the host did it: `rows` is the page to draw, in its order.
  const searchedRows = useMemo(
    () => (searchEnabled && !manual ? searchRows(rows, columns, searchValue) : rows),
    [rows, columns, searchEnabled, manual, searchValue]
  );

  const filteredRows = useMemo(
    () => (manual ? searchedRows : filterRows(searchedRows, allColumns, filters)),
    [searchedRows, allColumns, manual, filters]
  );

  const sortedRows = useMemo(
    () => (manual ? filteredRows : sortRows(filteredRows, columns, sortKey, sortDir)),
    [filteredRows, columns, manual, sortKey, sortDir]
  );

  // In a fixed layout the width the columns leave over is shared among all of them, the selection
  // and action columns too. When every data column states a width, the first one gives it up and
  // takes what is left, so those two stay as wide as asked.
  const firstColumnTakesTheRest =
    (selectable || actionColumn) && columns.length > 0 && columns.every((c) => c.width);
  // What is left is nothing once the stated widths add up to more than the box, as in a table that
  // scrolls under pinned columns: the table is then at least as wide as all of them, so the first
  // column keeps its own width.
  const statedMinWidth = firstColumnTakesTheRest
    ? `calc(${[
        expandable && EXPAND_COLUMN_WIDTH,
        selectable && SELECT_COLUMN_WIDTH,
        ...columns.map((c) => c.width),
        actionColumn && (rowEditing ? EDIT_ACTION_COLUMN_WIDTH : ACTION_COLUMN_WIDTH),
      ]
        .filter(Boolean)
        .join(' + ')})`
    : undefined;

  const mobileSortable = columns.some((c) => c.sortable);

  // Rows on screen stay while a reload waits (dimmed, under a spinner); placeholders are for the
  // first load only. An error is not drawn over the rows of a load that is still going.
  const hasRows = sortedRows.length > 0;
  const showSkeleton = loading && !hasRows;
  const dimRows = loading && hasRows;

  const columnCount =
    columns.length + (expandable ? 1 : 0) + (selectable ? 1 : 0) + (actionColumn ? 1 : 0);

  const leadCount = (expandable ? 1 : 0) + (selectable ? 1 : 0);
  const cellPins: (ColumnPin | undefined)[] = [
    ...Array.from({ length: leadCount }, () => (hasStartPin ? ('start' as const) : undefined)),
    ...dataPins,
    ...(actionColumn ? [hasEndPin ? ('end' as const) : undefined] : []),
  ];
  const headRowRef = useRef<HTMLTableRowElement>(null);
  const cellWidths = usePinnedWidths(headRowRef, hasStartPin || hasEndPin, cellPins.length);
  const offsets = pinOffsets(cellWidths, cellPins);
  const edges = pinEdges(cellPins);
  // The `sticky` classes and the offset of the cell at `index` (none for one that scrolls).
  const pinOf = (index: number, state?: 'idle' | 'selected' | 'open') => {
    const pinned = cellPins[index] !== undefined;
    return {
      style: pinStyle(offsets, index),
      className: pinned
        ? pinnedCell({
            head: state === undefined,
            state,
            edgeSide: index === edges.start ? 'start' : index === edges.end ? 'end' : undefined,
            scrolled: index === edges.start ? scrollEdges.start : scrollEdges.end,
          })
        : undefined,
    };
  };

  // The rows the pager counts: all of them in memory, the host's total in `manual`.
  const totalRows = manual ? (rowCount ?? rows.length) : sortedRows.length;
  // "Show all" has no meaning when the host holds the rows.
  const showAllRows = showAll && !manual;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageRows =
    manual || showAllRows
      ? sortedRows
      : sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Windowed (`virtualize`): the body draws a slice of `pageRows` between spacers.
  const showRows = !showSkeleton && !((error && !dimRows) || !hasRows);
  const windowed = virtualize && showRows;
  // The height of a row in px: the default text size's until a drawn row is measured, then what
  // it really is, which follows the text size.
  const [rowHeight, setRowHeight] = useState(VIRTUAL_ROW_HEIGHT[density ?? 'default']);
  const slice = useVirtualWindow({
    scrollerRef,
    count: pageRows.length,
    rowHeight,
    enabled: windowed,
  });
  // All the rows share one height, measured as the distance between two drawn rows in the middle
  // of the longest run of rows that follow each other: the divider is part of it, and the rows
  // next to a spacer or to the top of the table sit half a pixel off, so they are not measured. A
  // text size change resizes them. Observed again whenever other rows are the ones measured; with
  // no such run, the last measurement stands.
  useLayoutEffect(() => {
    const body = scrollerRef.current?.querySelector('tbody');
    if (!windowed || !body) return;
    const at = (tr: HTMLElement) => Number(tr.getAttribute('aria-rowindex'));
    let run: HTMLElement[] = [];
    let best: HTMLElement[] = [];
    for (const tr of body.querySelectorAll<HTMLElement>('tr[aria-rowindex]')) {
      run = run.length > 0 && at(run[run.length - 1]) + 1 === at(tr) ? [...run, tr] : [tr];
      if (run.length > best.length) best = run;
    }
    if (best.length < 4) return;
    const mid = Math.floor(best.length / 2);
    const [row, next] = [best[mid - 1], best[mid]];
    const measure = () => {
      const height = next.getBoundingClientRect().top - row.getBoundingClientRect().top;
      if (height > 0) setRowHeight((prev) => (Math.abs(prev - height) < 0.01 ? prev : height));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [windowed, density, slice.start, slice.end]);
  // The row that holds the focus is drawn wherever the scroll is, or scrolling would drop it.
  const [focusedKey, setFocusedKey] = useState<string | number | null>(null);
  const pinnedIndex =
    windowed && focusedKey !== null ? pageRows.findIndex((r) => rowKey(r) === focusedKey) : -1;
  const virtualParts = windowed
    ? windowParts(slice, pageRows.length, rowHeight, pinnedIndex < 0 ? null : pinnedIndex)
    : null;
  // A windowed cell is a box of one fixed height, so every row is as tall as the others.
  const bodyPadding = windowed ? VIRTUAL_CELL_PADDING : BODY_CELL_PADDING;
  const cellBox = windowed ? { height: VIRTUAL_CELL_HEIGHT } : undefined;

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
    label: allColumns.find((c) => c.key === key)?.label?.toString() ?? key,
    value: Array.from(vals).join(', '),
  }));

  const [savedViews, setSavedViews] = useControllableState<DataTableView[]>({
    value: viewsProp,
    defaultValue: () => defaultViews ?? [],
    onChange: onViewsChange,
    name: 'DataTable.views',
  });
  const [activeViewId, setActiveViewId] = useControllableState<string | null>({
    value: activeViewProp,
    defaultValue: defaultActiveView,
    onChange: onActiveViewChange,
    name: 'DataTable.activeView',
  });
  const currentState: ViewState = {
    search: searchValue,
    filters: filtersToRecord(filters),
    sort,
    columnVisibility: shown,
    pageSize: showAllRows ? 'all' : pageSize,
    density: density ?? 'default',
  };
  const applyView = (view: DataTableView) => {
    // Each part through its own setter, then one trip back to the first page.
    setSearchState(view.search);
    setFilters(recordToFilters(view.filters));
    setSortState(view.sort);
    setColumnVisibility(view.columnVisibility);
    // A server holds the rows: "Show all" is not a thing the table can do there.
    if (view.pageSize === 'all') setShowAll(!manual);
    else {
      setShowAll(false);
      setPageSizeState(view.pageSize);
    }
    setDensity(view.density);
    goToFirstPage();
    setActiveViewId(view.id);
  };
  const saveView = (name: string) => {
    const view: DataTableView = { id: newViewId(savedViews), name, ...currentState };
    setSavedViews([...savedViews, view]);
    setActiveViewId(view.id);
  };
  const renameActiveView = (name: string) =>
    setSavedViews(savedViews.map((v) => (v.id === activeViewId ? { ...v, name } : v)));
  const deleteActiveView = () => {
    setSavedViews(savedViews.filter((v) => v.id !== activeViewId));
    setActiveViewId(null);
  };

  const handleExport = () => {
    if (onExport) {
      onExport({
        search: searchEnabled ? searchValue : '',
        filters: filtersToRecord(filters),
        sort,
        columns: columns.map((c) => c.key),
      });
      return;
    }
    downloadCsv(toCsv(sortedRows, columns), exportFileName);
  };
  const toolbarControls = hasToolbarControls ? (
    <div className="flex shrink-0 items-center gap-2">
      {viewsEnabled && (
        <DataTableViews
          views={savedViews}
          activeId={activeViewId}
          current={currentState}
          columns={allColumns}
          onApply={applyView}
          onSave={saveView}
          onRename={renameActiveView}
          onDelete={deleteActiveView}
        />
      )}
      {exportable && (
        <button type="button" aria-label="Export" onClick={handleExport} className={TOOLBAR_BUTTON}>
          <Download aria-hidden className="h-4 w-4" />
          <span className="max-sm:hidden">Export</span>
        </button>
      )}
      {columnsMenuNode}
    </div>
  ) : null;

  const renderRow = (row: T, index: number) => {
    const key = rowKey(row);
    const isSelected = selection.has(key);
    const href = rowHref?.(row);
    // A link is the focusable thing of its row; without one, the row itself is.
    const focusableRow = onRowClick && !href;
    const isOpen = expandable && expanded.has(key);
    const detailId = detailRowId(tableId, key);
    const state = edit.state;
    const editedHere = state?.key === key ? state : null;
    const rowInEdit = rowEditing && editedHere?.kind === 'row' ? editedHere : null;
    // The row an editor is open in, or a detail is open under, is lifted like a hovered one.
    const cellState = isSelected ? 'selected' : isOpen || rowInEdit ? 'open' : 'idle';
    const rowErrorId = detailId.replace('-detail-', '-edit-error-');
    const firstEditable = rowInEdit ? columns.find((c) => c.edit)?.key : undefined;
    return (
      <Fragment key={key}>
        <tr
          // The header is row 1; a windowed table says where each drawn row sits in the whole list.
          aria-rowindex={windowed ? index + 2 : undefined}
          aria-busy={rowInEdit?.saving || undefined}
          onFocus={windowed ? () => setFocusedKey(key) : undefined}
          onBlur={
            windowed
              ? (e) => {
                  // Focus that moved inside the row (or into a menu portaled out of it) stays.
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setFocusedKey((prev) => (prev === key ? null : prev));
                  }
                }
              : undefined
          }
          tabIndex={focusableRow ? 0 : undefined}
          onClick={
            onRowClick || (href && linkColumnPinned)
              ? (e) => {
                  if (!isRowClick(e)) return;
                  // The link covers its own column only: follow it from the rest of
                  // the row. Its click comes back here, and calls onRowClick.
                  const link = e.currentTarget.querySelector<HTMLAnchorElement>('[data-row-link]');
                  if (link && linkColumnPinned && !link.contains(e.target as Node)) {
                    link.click();
                    return;
                  }
                  onRowClick?.(row);
                }
              : undefined
          }
          onKeyDown={
            focusableRow
              ? (e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  onRowClick(row);
                }
              : undefined
          }
          className={clsx(
            'hover:bg-gray-50 dark:hover:bg-white/5 print:break-inside-avoid',
            isSelected
              ? 'bg-brand-50/40 dark:bg-brand-500/5'
              : (isOpen || rowInEdit) && 'bg-gray-50 dark:bg-white/[0.03]',
            // The detail or error row below is part of it: no divider between the two.
            (isOpen || rowInEdit?.error) && 'border-b-0',
            (onRowClick || href) && 'cursor-pointer',
            'group/row',
            focusableRow && 'focus-visible:focus-indicator focus-visible:ring-inset',
            href &&
              'has-[[data-row-link]:focus-visible]:focus-indicator relative has-[[data-row-link]:focus-visible]:ring-inset'
          )}
        >
          {expandable && (
            <td
              style={pinOf(0, cellState).style}
              className={clsx(
                'px-2 print:hidden',
                bodyPadding,
                href && 'relative z-[1]',
                pinOf(0, cellState).className
              )}
            >
              <Button
                variant="ghost"
                size="sm"
                shape="square"
                icon={isOpen ? ChevronDown : RowChevron}
                aria-expanded={isOpen}
                // Only while the detail row exists: an id that is not there names nothing.
                aria-controls={isOpen ? detailId : undefined}
                aria-label={`${isOpen ? 'Hide' : 'Show'} details for ${key}`}
                onClick={() => updateExpanded(toggleKey(expanded, key))}
                className="-my-1.5"
              />
            </td>
          )}
          {selectable && (
            <td
              style={pinOf(expandable ? 1 : 0, cellState).style}
              className={clsx(
                'px-4 print:hidden',
                bodyPadding,
                // The cell box is in em of this size, as in the data cells.
                windowed && 'text-sm',
                href && 'relative z-[1]',
                pinOf(expandable ? 1 : 0, cellState).className
              )}
            >
              {/* A flex box centres the checkbox; inline, it sat on the
              text baseline and moved with the font metrics. */}
              <div className="flex items-center" style={cellBox}>
                <Checkbox
                  aria-label={`Select row ${key}`}
                  checked={isSelected}
                  onChange={() => toggleRow(key)}
                />
              </div>
            </td>
          )}
          {columns.map((col, i) => {
            const editable = Boolean(col.edit) && (rowEditing || cellEditing);
            const cellInEdit =
              cellEditing && editedHere?.kind === 'cell' && editedHere.column === col.key
                ? editedHere
                : null;
            const savingHere = Boolean(cellInEdit?.saving);
            const content = col.render(row);
            const cell =
              rowInEdit && editable ? (
                <CellEditorBox
                  col={col}
                  row={row}
                  rowKey={key}
                  mode="row"
                  draft={rowInEdit.drafts[col.key] ?? ''}
                  setDraft={(v) => edit.setDraft(col.key, v)}
                  commit={() => edit.saveRow(row)}
                  cancel={edit.cancel}
                  saving={rowInEdit.saving}
                  error={rowInEdit.error}
                  errorId={rowInEdit.error ? rowErrorId : undefined}
                  focusField={col.key === firstEditable}
                />
              ) : cellInEdit && !savingHere && editable ? (
                <CellEditorBox
                  col={col}
                  row={row}
                  rowKey={key}
                  mode={editTrigger === 'button' ? 'button' : 'cell'}
                  draft={cellInEdit.draft}
                  setDraft={(v) => edit.setDraft(col.key, v)}
                  commit={(refocus) => edit.commitCell(row, refocus)}
                  cancel={edit.cancel}
                  saving={false}
                  error={cellInEdit.error}
                  focusField={cellInEdit.focusField}
                />
              ) : cellEditing && editable ? (
                <CellTrigger
                  col={col}
                  row={row}
                  rowKey={key}
                  mode={editTrigger === 'button' ? 'button' : 'cell'}
                  saving={savingHere}
                  locked={Boolean(state?.saving)}
                  open={() => edit.openCell(key, col.key, col.edit!.initialValue(row))}
                  register={edit.registerTrigger(triggerId(key, col.key))}
                />
              ) : href && i === 0 ? (
                <AppLink href={href} data-row-link className={ROW_LINK}>
                  {content}
                </AppLink>
              ) : (
                content
              );
            return (
              <td
                key={col.key}
                aria-busy={savingHere || undefined}
                style={pinOf(leadCount + i, cellState).style}
                className={clsx(
                  'px-4',
                  bodyPadding,
                  'text-sm',
                  ALIGN_CELL[col.align ?? 'start'],
                  href && i > 0 && RAISE_CONTROLS,
                  pinOf(leadCount + i, cellState).className
                )}
              >
                {windowed ? (
                  <div
                    className={clsx(
                      'flex items-center overflow-hidden',
                      col.align === 'end' && 'justify-end',
                      col.align === 'center' && 'justify-center'
                    )}
                    style={cellBox}
                  >
                    {cell}
                  </div>
                ) : (
                  cell
                )}
              </td>
            );
          })}
          {actionColumn && (
            <td
              style={pinOf(leadCount + columns.length, cellState).style}
              className={clsx(
                'px-4 print:hidden',
                bodyPadding,
                windowed && 'text-sm',
                href && 'relative z-[1]',
                pinOf(leadCount + columns.length, cellState).className
              )}
            >
              <div className="flex items-center justify-end" style={cellBox}>
                {rowEditing ? (
                  <RowEditActions
                    rowKey={key}
                    editing={Boolean(rowInEdit)}
                    saving={Boolean(rowInEdit?.saving)}
                    locked={Boolean(state?.saving)}
                    open={() => edit.openRow(key, rowInitials(columns, row))}
                    save={() => edit.saveRow(row)}
                    cancel={edit.cancel}
                    registerEdit={edit.registerTrigger(edit.rowButtonId(key))}
                    registerSave={edit.registerTrigger(edit.rowSaveId(key))}
                  >
                    {renderRowAction?.(row)}
                  </RowEditActions>
                ) : (
                  renderRowAction?.(row)
                )}
              </div>
            </td>
          )}
        </tr>
        {rowInEdit?.error && (
          <RowEditError id={rowErrorId} message={rowInEdit.error} colSpan={columnCount} />
        )}
        {isOpen && renderExpandedRow && (
          <tr id={detailId} className="bg-gray-50 dark:bg-white/[0.03] print:break-inside-avoid">
            <td colSpan={columnCount} className="ps-15 pe-4 pt-1 pb-5 text-sm">
              {renderExpandedRow(row)}
            </td>
          </tr>
        )}
      </Fragment>
    );
  };

  return (
    <div
      data-density={density}
      className={clsx(
        'flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-[var(--color-bg-panel)] dark:border-gray-800',
        // On paper every row prints: no height to scroll in, nothing clipped, so that the header
        // repeats on each page.
        'print:h-auto print:max-h-none print:overflow-visible',
        className
      )}
    >
      {filterTabs && (
        <div className="print:hidden">
          <DataTableFilterTabsStrip
            tabs={filterTabs}
            selected={filters[filterTabs.columnKey]}
            onSelect={selectFilterTab}
          />
        </div>
      )}

      {/* Top toolbar: bulk actions when any selected, otherwise search bar. */}
      {selectable && selection.size > 0 ? (
        <div className="bg-brand-50 dark:bg-brand-500/10 flex items-center gap-3 border-b border-gray-100 px-4 py-2 dark:border-gray-800 print:hidden">
          <span className="text-brand-700 dark:text-brand-300 text-sm font-medium">
            <bdi>{selection.size} selected</bdi>
          </span>
          <button
            type="button"
            onClick={clearSelection}
            className="focus-visible:focus-indicator rounded-sm text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear
          </button>
          <div className="ms-auto flex items-center gap-2">
            {bulkActions ? bulkActions(selectedRows) : null}
          </div>
        </div>
      ) : searchEnabled ? (
        <div
          className={clsx(
            'border-b border-gray-100 px-4 py-2 dark:border-gray-800 print:hidden',
            hasToolbarControls && 'flex items-center gap-2'
          )}
        >
          <div className={clsx('h-ctrl-36 relative', hasToolbarControls && 'min-w-0 flex-1')}>
            <Search
              aria-hidden
              className="inset-s-3 pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              // What is typed reads in its own direction.
              dir="auto"
              value={searchValue}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Search rows"
              className="focus:field-focus h-full w-full rounded-lg border border-gray-200 bg-white ps-9 pe-9 text-sm transition-colors placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="focus-visible:focus-indicator inset-e-2 absolute top-1/2 -translate-y-1/2 rounded-sm p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {mobileCards ? <div className="max-sm:hidden">{toolbarControls}</div> : toolbarControls}
        </div>
      ) : hasToolbarControls ? (
        <div
          className={clsx(
            'flex justify-end border-b border-gray-100 px-4 py-2 dark:border-gray-800 print:hidden',
            mobileCards && 'max-sm:hidden'
          )}
        >
          {toolbarControls}
        </div>
      ) : null}

      {mobileCards && (mobileSortable || hasToolbarControls) && (
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2 sm:hidden dark:border-gray-800 print:hidden">
          {mobileSortable && (
            <DataTableMobileSort
              columns={columns}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortChange={(key, direction) => setSort(key === null ? null : { key, direction })}
            />
          )}
          {toolbarControls}
        </div>
      )}

      <ActiveFiltersBar
        filters={activeFilters}
        onClearOne={clearFilter}
        onClearAll={clearAllFilters}
      />

      {mobileCards && (
        <DataTableMobileCards
          rows={pageRows}
          columns={columns}
          rowKey={rowKey}
          selectable={selectable}
          isSelected={(key) => selection.has(key)}
          onToggleRow={toggleRow}
          renderRowAction={renderRowAction}
          renderExpandedRow={expandable ? renderExpandedRow : undefined}
          isExpanded={(key) => expanded.has(key)}
          onToggleExpanded={(key) => updateExpanded(toggleKey(expanded, key))}
          idBase={tableId}
          onRowClick={onRowClick}
          rowHref={rowHref}
          loading={showSkeleton}
          dimmed={dimRows}
          loadingRows={loadingRows}
          error={error}
          onRetry={onRetry}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
        />
      )}

      {/* The wrapper holds the spinner over the scrolling area, which would carry it away. */}
      <div
        className={clsx('relative flex min-h-0 flex-1 flex-col', mobileCards && 'max-sm:hidden')}
      >
        <div
          ref={scrollerRef}
          // Focusable only while it scrolls: a scroll container with no control inside is out of
          // reach of the keyboard, and one that fits would add a tab stop that does nothing.
          tabIndex={scrolls ? 0 : undefined}
          role={region ? 'region' : undefined}
          aria-label={region ? ariaLabel : undefined}
          aria-labelledby={region ? ariaLabelledBy : undefined}
          style={fade}
          className={clsx(
            'focus-visible:focus-indicator min-h-0 flex-1 overflow-y-auto focus-visible:ring-inset',
            // The edge fade is set inline; `!` lets paper drop it.
            'print:overflow-visible print:mask-none!',
            // The wrapper hides too; the scroller keeps its own, which the cards' stories read.
            mobileCards && 'max-sm:hidden'
          )}
        >
          {loading && (
            <span role="status" className="sr-only">
              Loading…
            </span>
          )}
          <table
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-busy={loading || undefined}
            aria-rowcount={windowed ? pageRows.length + 1 : undefined}
            style={statedMinWidth ? { minWidth: statedMinWidth } : undefined}
            className="w-full table-fixed"
          >
            <colgroup>
              {expandable && (
                <col style={{ width: EXPAND_COLUMN_WIDTH }} className="print:hidden" />
              )}
              {selectable && (
                <col style={{ width: SELECT_COLUMN_WIDTH }} className="print:hidden" />
              )}
              {columns.map((c, i) => (
                <col
                  key={c.key}
                  style={
                    c.width && !(i === 0 && firstColumnTakesTheRest)
                      ? { width: c.width }
                      : undefined
                  }
                />
              ))}
              {actionColumn && (
                <col
                  style={{ width: rowEditing ? EDIT_ACTION_COLUMN_WIDTH : ACTION_COLUMN_WIDTH }}
                  className="print:hidden"
                />
              )}
            </colgroup>
            <thead className="sticky top-0 z-10 print:static">
              <tr
                ref={headRowRef}
                aria-rowindex={windowed ? 1 : undefined}
                className="border-b border-gray-100 dark:border-gray-800"
              >
                {expandable && (
                  <th
                    style={pinOf(0).style}
                    className={clsx(
                      HEADER_CELL,
                      HEADER_CELL_PADDING,
                      'text-start print:hidden',
                      pinOf(0).className
                    )}
                  >
                    <span className="sr-only">Details</span>
                  </th>
                )}
                {selectable && (
                  <th
                    style={pinOf(expandable ? 1 : 0).style}
                    className={clsx(
                      HEADER_CELL,
                      HEADER_CELL_PADDING,
                      'text-start print:hidden',
                      pinOf(expandable ? 1 : 0).className
                    )}
                  >
                    <div className="flex items-center">
                      <Checkbox
                        aria-label="Select all rows"
                        checked={allVisibleSelected}
                        indeterminate={someVisibleSelected}
                        onChange={toggleAllVisible}
                      />
                    </div>
                  </th>
                )}
                {columns.map((col, i) => (
                  <ColumnHeader
                    key={col.key}
                    style={pinOf(leadCount + i).style}
                    className={pinOf(leadCount + i).className}
                    label={col.label}
                    align={col.align}
                    sortable={col.sortable}
                    filterable={col.filterable}
                    sortDir={sortKey === col.key ? sortDir : null}
                    onSortToggle={() => handleSortToggle(col.key)}
                    filterValues={filterValues[col.key]}
                    filterSelected={filters[col.key]}
                    onFilterToggle={(v) => handleFilterToggle(col.key, v)}
                    onFilterClear={() => clearFilter(col.key)}
                  />
                ))}
                {actionColumn && (
                  <th
                    style={pinOf(leadCount + columns.length).style}
                    className={clsx(
                      HEADER_CELL,
                      HEADER_CELL_PADDING,
                      'text-end print:hidden',
                      pinOf(leadCount + columns.length).className
                    )}
                  >
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody
              inert={dimRows || undefined}
              className={clsx('divide-y divide-gray-100 dark:divide-gray-800', dimRows && DIMMED)}
            >
              {showSkeleton ? (
                Array.from({ length: loadingRows }, (_, i) => (
                  <tr key={i}>
                    {selectable && <td className={clsx('px-4 print:hidden', BODY_CELL_PADDING)} />}
                    {columns.map((col, c) => (
                      <td
                        key={col.key}
                        className={clsx(
                          'px-4',
                          BODY_CELL_PADDING,
                          // The cell's own line height, so a row is as tall loading as loaded.
                          'text-sm',
                          ALIGN_CELL[col.align ?? 'start']
                        )}
                      >
                        <div
                          className={clsx(
                            'flex h-5 items-center',
                            col.align === 'end' && 'justify-end',
                            col.align === 'center' && 'justify-center'
                          )}
                        >
                          <Sk h="h-3" w={SKELETON_WIDTHS[(i + c) % SKELETON_WIDTHS.length]} />
                        </div>
                      </td>
                    ))}
                    {actionColumn && (
                      <td className={clsx('px-4 print:hidden', BODY_CELL_PADDING)}>
                        <div className="flex h-5 items-center justify-end">
                          <Sk h="h-5" w="w-12" round="rounded-lg" />
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : !showRows ? (
                <tr>
                  <td colSpan={columnCount} className="px-4">
                    <div className="flex justify-center">
                      {error ? (
                        <ErrorState message={error} onRetry={onRetry} />
                      ) : (
                        <EmptyState title={emptyTitle} description={emptyDescription} />
                      )}
                    </div>
                  </td>
                </tr>
              ) : virtualParts ? (
                virtualParts.map((part, n) =>
                  part.kind === 'spacer' ? (
                    <tr key={`__spacer-${n}`} aria-hidden className="border-b-0">
                      <td colSpan={columnCount} className="p-0" style={{ height: part.height }} />
                    </tr>
                  ) : (
                    renderRow(pageRows[part.index], part.index)
                  )
                )
              ) : (
                pageRows.map(renderRow)
              )}
            </tbody>
          </table>
        </div>
        {dimRows && <LoadingVeil />}
      </div>

      {hasRows && (loading || !error) && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          aria-label={ariaLabel ? `${ariaLabel} pagination` : undefined}
          showInfo
          total={totalRows}
          pageSize={pageSize}
          onPageChange={setPage}
          showAll={showAllRows}
          onShowAllChange={manual ? undefined : setShowAll}
          controls={
            pageSizeOptions && pageSizeOptions.length > 0 ? (
              <PageSizeSelect value={pageSize} options={pageSizeOptions} onChange={setPageSize} />
            ) : undefined
          }
          className="shrink-0 border-t border-gray-100 px-4 py-3 dark:border-gray-800 print:hidden"
        />
      )}
    </div>
  );
};
