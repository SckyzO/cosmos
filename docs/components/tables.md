# Tables

Storybook group: Tables. `DataTable` and the table primitives.

## DataTable

Storybook: [DataTable](https://sckyzo.github.io/cosmos/?path=/docs/tables-datatable--docs), [Table](https://sckyzo.github.io/cosmos/?path=/docs/tables-table--docs), [Cards on phones](https://sckyzo.github.io/cosmos/?path=/docs/tables-datatable-cards-on-phones--docs), [Columns menu](https://sckyzo.github.io/cosmos/?path=/docs/tables-datatable-columns-menu--docs), [Expandable rows and pinned columns](https://sckyzo.github.io/cosmos/?path=/docs/tables-datatable-expandable-rows-and-pinned-columns--docs), [Export](https://sckyzo.github.io/cosmos/?path=/docs/tables-datatable-export--docs), [Inline editing](https://sckyzo.github.io/cosmos/?path=/docs/tables-datatable-inline-editing--docs), [Saved views](https://sckyzo.github.io/cosmos/?path=/docs/tables-datatable-saved-views--docs), [Selection and filters](https://sckyzo.github.io/cosmos/?path=/docs/tables-datatable-selection-and-filters--docs), [Server](https://sckyzo.github.io/cosmos/?path=/docs/tables-datatable-server--docs), [Virtualised](https://sckyzo.github.io/cosmos/?path=/docs/tables-datatable-virtualised--docs).

`DataTable` sorts, filters, searches and paginates its rows. Give it a height
(`className="max-h-96"`) and the rows scroll under the header, in an area the
keyboard can focus and scroll while it overflows; `aria-label` or
`aria-labelledby` names the table, and that area as a region. For a short
read-only table, compose the table primitives instead: `Table`, `TableCaption`,
`TableHead`, `TableBody`, `TableFoot`, `TableRow`, `TableHeaderCell` and
`TableCell` render the native elements with the Cosmos styling and no logic.

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@sckyzo/cosmos-react';

<Table striped>
  <TableCaption>Nodes</TableCaption>
  <TableHead>
    <TableRow>
      <TableHeaderCell>Name</TableHeaderCell>
      <TableHeaderCell numeric>CPU</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow>
      <TableCell>node-101</TableCell>
      <TableCell numeric>42%</TableCell>
    </TableRow>
  </TableBody>
</Table>;
```

`DataTable` shows a muted two-way icon on every sortable column, keeps its
header (and the width of its selection and action columns) while it loads, is
empty or fails, and takes `loadingRows` for the number of placeholder rows. Its
rows can act: `onRowClick(row)` makes them focusable (Enter and Space) and
clickable, `rowHref(row)` makes each one a link (a real `<a>` in the first
column, drawn over the row, so middle click and "Open in a new tab" work; keep
buttons and links out of that column). A click on a control inside the row (the
checkbox, the action column, a link or button in another cell) never counts as a
row click. `RowActionsMenu` is the ⋮ button and menu of a row, for
`renderRowAction`: give it `Menu.Item`s, a destructive one with
`intent="danger"`. On a narrow screen the edge of a table that scrolls sideways
fades, and `Table`'s `stickyFirstColumn` pins its first column (`DataTable` pins
columns with `pin`, below). `TableIdentityCell`, `TableIdCell`, `TableDescriptionCell` and
`TableAmountCell` are the cells tables keep rebuilding. `TableAmountCell` is an `Amount` (see
[Data](data.md)) with a plus in front of a gain, so it writes a figure like the rest of the page.

`DataTable`'s column filters can be controlled: `filters`, `defaultFilters` and
`onFiltersChange(filters)` hold a record of column `key` to the set of selected
values. `filterTabs` (`{ columnKey, options: [{ value, label, count }], allLabel,
allCount }`) puts underlined status tabs at the top of the card, each setting
that column's filter ("All" clears it) and staying in sync with the active
filters bar; the counts come from you, the table never computes them.

`DataTable` takes `mobileLayout="cards"` to show each row as a block below `sm`
instead of scrolling: the checkbox, the column marked `mobile: 'title'` and the
row action on the first line, then a label/value pair per other column
(`mobileLabel` renames a label, `mobile: 'hidden'` drops a column). The toolbar
gets a "Sort by" select for the sortable columns and, when a column is
filterable, a "Filters" button with the number of values filtered: it opens a
bottom sheet with the filter of each filterable column, "Clear all" and "Show n
rows", and sets the same `filters` as the column headers, controlled or not. The
default, `scroll`, keeps the table and scrolls it sideways when the box is
narrower than its columns need. A column with a length for `width` (`'120px'`)
keeps it; one with a percentage or no width is never drawn narrower than its
`minWidth`, `8rem` unless set. Columns without a width split what the others
leave in equal parts, so each gets at least the largest `minWidth` among them:
give the short columns a width and the one that needs room takes the rest.

With `selectable`, a selection puts a tinted bar on one row: the count, "Clear"
and the bulk actions on the start side, the search and the toolbar on the end
side. `bulkActionItems` takes the actions as data (`{ key, label, icon,
intent, disabled, onClick(selectedRows) }`) so the bar can adapt: the first is a
button and, under 1152px of bar, the others fold into an "Actions" menu; the
toolbar buttons go icon-only and the search narrows under 1360px; under 640px
the bar wraps to two lines, and the actions go under the count when they don't
fit beside it; with `mobileLayout="cards"` on a phone each action is
an icon button named by its `label`. `bulkActions(selectedRows)` still renders
any node after them, as given at every width. While rows are selected the
toolbar's Export follows them ("Export 3" downloads those rows, in the table's
sort order, and `onExport` gets their keys as `selection`); with none selected it
exports the filtered rows.

`emptyAction` puts a call to action under the empty state ("Create the first
order"). When a search or filters hide every row it gives way to a "Clear
filters" button, which clears both.

`DataTable` rows can expand: `renderExpandedRow(row)` adds a first column of
chevron buttons (`aria-expanded`, `aria-controls` the detail row while it is
open, named "Show details for <row key>") and draws what it returns in a row
below, spanning every column. The open rows are a set of row keys, like the
selection: `expandedRows`, `defaultExpandedRows` and
`onExpandedRowsChange(expanded)`. A toggle never selects a row nor counts as a
click on it. Limit: with `virtualize` nothing expands (its rows have one fixed
height), and the prop is ignored. With `mobileLayout="cards"` the chevron sits on
the card's title line and the content opens inside the card, under its fields.

`pin: 'start' | 'end'` on a column keeps it in place while the table scrolls
sideways, several per side: list the `start` ones first and the `end` ones last
in `columns`. A pinned cell sticks after the widths of the pinned columns before
it, measured, so percentage widths, a resize and the text size keep it right.
The selection and toggle columns are pinned with the start columns, the action
column with the end ones. A shadow marks an edge only while content scrolls
under it, and the scroll fade leaves a pinned side alone. `pin` replaces
`DataTable`'s `stickyFirstColumn` (removed): put `pin: 'start'` on the first
column. With `rowHref`, the link covers its own column when that is pinned and
a click on the rest of the row follows it from a handler. The cards of
`mobileLayout="cards"` ignore `pin`.

```tsx
<DataTable
  rows={hosts}
  rowKey={(r) => r.host}
  selectable
  renderExpandedRow={(r) => <HostDetail host={r} />}
  columns={[
    { key: 'host', label: 'Host', pin: 'start', render: (r) => r.host },
    { key: 'rack', label: 'Rack', render: (r) => r.rack },
    // …
    {
      key: 'status',
      label: 'Status',
      pin: 'end',
      render: (r) => <StatusBadge status={r.status} />,
    },
  ]}
/>
```

Inline editing: `edit` on a column is `{ initialValue(row), render(editor) }`,
and `render` draws an existing form field from the editor: `editor.value` (the
draft, a string: parse it yourself), `setValue`, `commit`, `cancel`, `saving`
and `fieldProps` (the field's name, "Rack for node-a02", its error tie, `disabled`
while saving and a red border on `aria-invalid`), which an `Input` or a `Select`
takes as it is. `editTrigger` picks how an editable cell opens, one per table:

- `'cell'` (default): the cell's content is a button that fills it; a click,
  Enter or F2 opens the editor in place, focused. Keep that content to text and
  badges, with no link or button in it.
- `'button'`: a pencil button in each editable cell ("Edit Rack for node-a02"),
  shown on the hovered or focused row and always on a screen with no hover; the
  editor has Save and Cancel buttons beside the field.
- `'row'`: an Edit button in the row's action column turns every editable cell
  of the row into its field, with Cancel and Save in place of the button.

In `'cell'` and `'button'`, Enter or blur saves and Escape cancels, putting the
focus back on the cell's trigger. `onCellEdit(row, columnKey, value)` is called
only when the draft changed, and may return a promise: the cell is `aria-busy`
with a spinner until it settles. If it rejects (or throws), the editor opens
again with what was typed, and the error's message shows under the cell, tied to
the field by `aria-describedby`. In `'row'`, Save (or Enter in a field) calls
`onRowEdit(row, changes)` once, `changes` being column `key` to draft for the
cells that changed only; a promise makes the row `aria-busy` and the fields
disabled, and a rejection keeps the fields open with the error in a row under
the row. Escape or Cancel drops the changes. Only one cell or row edits at a
time, and nothing opens while a save is pending. The table never changes
`rows`: update them from the handler. Limits: editing is off with `virtualize`
(a fixed-height cell would clip an editor and its error) and in the cards of
`mobileLayout="cards"`.

```tsx
<DataTable
  rows={hosts}
  rowKey={(r) => r.host}
  editTrigger="cell"
  onCellEdit={async (row, key, value) => {
    await api.patchHost(row.host, { [key]: value }); // a rejection shows under the cell
    setHosts((all) => all.map((h) => (h.host === row.host ? { ...h, [key]: value } : h)));
  }}
  columns={[
    { key: 'host', label: 'Host', render: (r) => r.host },
    {
      key: 'rack',
      label: 'Rack',
      render: (r) => r.rack,
      edit: {
        initialValue: (r) => r.rack,
        render: (e) => (
          <Input
            {...e.fieldProps}
            size="sm"
            value={e.value}
            onChange={(ev) => e.setValue(ev.target.value)}
          />
        ),
      },
    },
  ]}
/>
```

`DataTable`'s `density` is controllable like the rest: `density`, `defaultDensity`
and `onDensityChange(density)`: `compact`, `default` or `comfortable`. Without
`density` and `defaultDensity` the table follows the page's `data-density`; set,
it is a local override of the page. As with `pageSize`, a `density` passed without
`onDensityChange` is a controlled value that never moves, so a saved view
reports its density and the table keeps the one you pass.

`exportable` adds an Export button before Columns (the toolbar shows even
without a search field). It downloads a CSV of every page of the rows that the
search, filters and sort keep, in the visible columns and their order; the
selection and action columns stay out. A header is the column's `label` when it
is a string or a number, else `mobileLabel` when that is a string, else the
`key`. A cell takes `exportValue(row)`, else `sortValue`, `searchValue` or
`filterValue` (the first the column has); `null` is an empty cell. The file is
named by `exportFileName` (default `export.csv`) and is UTF-8 with a byte order
mark (U+FEFF), so that spreadsheets read accents. Fields follow RFC 4180
(quoted when they hold `"`, `,` or a line break, records end with CRLF), and a
header or string value that starts with `=`, `+`, `-`, `@`, a tab or a carriage
return gets a `'` prefix so a spreadsheet never runs it as a formula; a
`number` is left alone. To export on the server, `onExport(query)` receives `{ search, filters,
sort, columns }` (the visible column keys, in order, plus `selection`, the
selected keys, while rows are selected) and builds no file.
`toCsv(rows, columns)` gives the same text, without the byte order mark, for an
export outside a table (prepend U+FEFF for a file meant for spreadsheets).

```tsx
<DataTable
  rows={rows}
  columns={[
    { key: 'name', label: 'Name', render: (r) => r.name, sortValue: (r) => r.name },
    {
      key: 'cpu',
      label: 'CPU %',
      render: (r) => <Gauge value={r.cpu} />,
      exportValue: (r) => r.cpu,
    },
  ]}
  rowKey={(r) => r.id}
  exportable
  exportFileName="nodes.csv"
/>
```

On paper a `DataTable` drops its toolbar, bulk-action bar, filter tabs, pager
and the selection and action columns, prints every row of the page instead of
scrolling, repeats the header on each page and keeps a row on one page. There is
no Print button: use the browser's. The theme is not switched, so a dark theme
prints its own colors: pick a light one for print (or `@media print` in your CSS).

Saved views: `views` (or `defaultViews`) shows a Views button in the toolbar.
A view is plain JSON, `{ id, name, search, filters, sort, columnVisibility,
pageSize, density }` (`filters` maps a column key to an array of values, `sort`
is `{ key, direction }` or `null`, `pageSize` is a number or `'all'` for "Show
all"), so you can keep the list anywhere: the table never stores it. Pass
`views` and `onViewsChange(views)`, or `defaultViews` and listen to
`onViewsChange`; `activeView` / `defaultActiveView` / `onActiveViewChange(id)`
hold the `id` of the applied view, or `null`. The menu applies a view, saves the
current state as a new one ("Save as…"), renames the active one or deletes it
(after a confirmation); a name must be filled and not used by another view.
Applying a view sets each part through the table's own state, so a part you
control reports its own `on*Change`, and the table goes back to the first page.
The button shows the active view's name, with "(modified)" once the table no
longer matches it. The `DataTableView`, `DataTableSort` and `DataTableExportQuery`
types are exported.

```tsx
const [views, setViews] = useState<DataTableView[]>(() => load());
<DataTable
  rows={rows}
  columns={columns}
  rowKey={(r) => r.id}
  views={views}
  onViewsChange={(next) => {
    setViews(next);
    save(next);
  }}
/>;
```

Server mode: `manual` turns the in-memory search, filters, sort and pagination
off. `rows` is the page you fetched, drawn in its order, and the controls only
report: `onSearchChange`, `onFiltersChange`, `onSortChange`, `onPageChange` and
`onPageSizeChange` (a change of search, filters, sort or page size goes back to
page 1 first). `rowCount` is the total across every page, for the pager and its
"Showing X to Y of Z"; without it the pager counts `rows.length`. A filter
dropdown lists the values found in `rows`, which in `manual` are one page, so a
filterable column takes `filterOptions` (`['Paid', 'Pending']`, in the order to
show) instead; it works without `manual` too. "Show all" is not offered, and
the built-in CSV export only holds the loaded rows: pass `onExport` to export on
the server.

The sort and the page are controlled with or without `manual`: `sort`,
`defaultSort` and `onSortChange(sort)` hold a `DataTableSort` (`{ key,
direction }` or `null`), and `page`, `defaultPage` and `onPageChange(page)` are
1-indexed like `Pagination`. A controlled table shows a new value once you pass
it back, and a change that resets the page calls `onPageChange(1)` (not when it
is on page 1 already).

`loading` with rows on screen keeps them, dimmed and inert (nothing in them can
be clicked meanwhile), under a centered spinner, with the pager still there and
`aria-busy` on the table; with no rows yet it draws the `loadingRows`
placeholders as before. Use it for every request, the first or the next page.

```tsx
const [sort, setSort] = useState<DataTableSort>(null);
const [page, setPage] = useState(1);
const { data, isFetching } = useOrders({ sort, page });
<DataTable
  manual
  rows={data?.rows ?? []}
  rowCount={data?.total}
  loading={isFetching}
  columns={columns}
  rowKey={(o) => o.id}
  sort={sort}
  onSortChange={setSort}
  page={page}
  onPageChange={setPage}
/>;
```

`virtualize` draws only the rows in view and a few around them, for thousands of
rows on one page (a large `pageSize`, or "Show all"). Two `aria-hidden` spacer
rows stand for the rest, so the scroll bar measures the whole list, and the
header stays sticky. The table says where the window is (`aria-rowcount`, and
`aria-rowindex` on each drawn row), and the row that holds the keyboard focus
stays drawn while it is scrolled out of view, so focus and selection survive
scrolling. Its limits:

- The table needs a height (`className="max-h-96"`): its own area is what
  scrolls, and without a height every row is in view.
- Every row has one fixed height, from the density: 41px when `compact`, 49px,
  or 61px when `comfortable`, at the default text size, and growing with the text size
  setting. Content taller than that is clipped, so keep a cell to a line of text
  or a control, as in a standard row.
- It applies to the table layout only: with `mobileLayout="cards"` below `sm`
  the cards keep the pagination.
- It is not for expandable rows or inline editing: both are off with it.
- On paper only the drawn rows print.

```tsx
<DataTable
  rows={tenThousandRows}
  columns={columns}
  rowKey={(r) => r.id}
  pageSize={10_000}
  virtualize
  className="max-h-96"
/>
```

`Table` takes `density` (`compact`, `default` or `comfortable`, as on `DataTable`; the
page's by default),
`striped`, `stickyHeader` (give the wrapper a height with
`containerClassName`, e.g. `max-h-80`) and `stickyFirstColumn`. While data
loads, `TableSkeletonRows` fills the `TableBody` under the header row. Cells take `align` and `numeric`
(`start`, `center` or `end`; `numeric` aligns to the end, with tabular figures). `TableHeaderCell` sets `scope` to `col` in the
head and `row` elsewhere. The wrapper scrolls horizontally, so a wide table
stays inside the page on small screens.
