# @sckyzo/cosmos-react

[![npm](https://img.shields.io/npm/v/@sckyzo/cosmos-react)](https://www.npmjs.com/package/@sckyzo/cosmos-react)

React 19 component library for the Cosmos design system. 135+ themeable,
accessible components, built with Tailwind 4 and shipped as ESM + CJS + types.

Browse the full catalog in the [live Storybook](https://sckyzo.github.io/cosmos/).

## Install

```bash
pnpm add @sckyzo/cosmos-react @sckyzo/cosmos-theme
pnpm add react react-dom   # peers, react 19+
```

`@sckyzo/cosmos-theme` carries the CSS (tokens, fonts, theme and accent vars). The
components render unstyled without it.

## Set up the styles

Components are styled with Tailwind 4 utility classes, so your app's Tailwind
build has to generate those classes. Tailwind only scans your own source by
default, so you **must** point `@source` at the installed package. Without it no
Cosmos utility classes are generated and every component renders unstyled.

In your main CSS file:

```css
@import 'tailwindcss';

/* Required: let Tailwind scan the compiled components for class names.
   The path is relative to this CSS file; adjust the depth to your layout. */
@source '../node_modules/@sckyzo/cosmos-react/dist/**/*.{js,cjs}';

/* Cosmos tokens (the @theme block) then the theme and accent CSS vars. */
@import '@sckyzo/cosmos-theme/tailwind';
@import '@sckyzo/cosmos-theme/vars';

/* Optional: the Outfit + JetBrains Mono webfonts. */
@import '@sckyzo/cosmos-theme/fonts';

/* Only if you use Calendar, DatePicker or a component built on them. */
@import '@sckyzo/cosmos-react/calendar.css';
```

`Calendar` and `DatePicker` wrap [react-day-picker](https://daypicker.dev), whose
structural styles are not bundled in the JS, so the package stays loadable with
`require` in Node and Jest. `calendar.css` is the explicit export that loads them;
without it the calendar grid renders unstyled. Import it once, after Tailwind.

If you also use `@sckyzo/cosmos-charts`, add a second `@source` line for its
`dist` the same way.

## Use

```tsx
import { useState } from 'react';
import { Button, Modal } from '@sckyzo/cosmos-react';

function Example() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Modal.Header title="Hello from Cosmos" onClose={() => setOpen(false)} />
        <Modal.Body>A themed, focus-trapped dialog.</Modal.Body>
      </Modal>
    </>
  );
}
```

## Refs

`ref` is a regular prop (React 19), so no component needs `forwardRef`. Fields,
buttons and custom controls point it at the element you would focus, for
instance to put the focus on the first invalid field:

```tsx
import { useRef } from 'react';
import { Input } from '@sckyzo/cosmos-react';

const emailRef = useRef<HTMLInputElement>(null);

<Input ref={emailRef} label="Email" />;
// on a validation error: emailRef.current?.focus()
```

The `ref` prop of each component says what it points to: the native `<input>`
for text, number and search fields, the switch `<button>` for `Toggle`, the first
cell for `OtpInput`, the trigger for `DatePicker`, and the segment you would Tab
to for `SegmentedControl`, in either appearance (the selected one, else the first).

## Links and your router

A component with an `href` (`Sidebar.Item`, `Breadcrumb`, `Menu.Item`, `Link`, `Tag`, a `Row`, a
`DataTable` row…) draws a plain `<a>`, so a click loads the page again. Mount `LinkProvider` once, at
the root of the app, to send those links through your router instead: it renders the component you
give in place of the `<a>`, so a click navigates in place, and middle-click and "Open in a new tab"
keep working, the element still being a real link. `cosmos-react` imports no router; the adapter is
yours.

```tsx
import { Link } from 'react-router';
import { LinkProvider, type LinkComponentProps } from '@sckyzo/cosmos-react';

// Define it once, at module level, and hand on every prop (`ref`, `className`, `onClick`, `aria-*`).
const AppLink = ({ href, ...props }: LinkComponentProps) => <Link to={href} {...props} />;

<LinkProvider component={AppLink}>{app}</LinkProvider>;
```

Next.js's `Link` takes `href` as it is: `<LinkProvider component={NextLink}>`. Without a provider
nothing changes. A link with `target="_blank"`, a link with no `href` or a bare `#`, and the links in
chat messages stay a plain `<a>`, and a provider inside another one replaces it for its subtree.

## Variants worth knowing

- `Tabs variant="pills"`: rounded triggers on a tinted track, the active one filled with the accent, horizontal or vertical.
- `Tabs variant="raised"`: the same neutral gray track, but the active tab is raised on it in white (a lighter gray in the dark themes) with no accent, horizontal or vertical.
- `Toggle size="sm"`: a 36×20 track; the label stays in the same `<label>`.
- `Textarea autoResize maxRows={6}`: `rows` is the minimum, the field grows with its content up to `maxRows`, then scrolls.
- `Input`, `Select` and `Textarea` `success="Username is available."`: the message under a field whose value is valid, with a green border (and a check icon on `Input` and `Select`). It is linked as the description and announced politely; `error` wins when both are set. `OtpInput success`: a green border on every cell, the message is yours.
- `SegmentedControl` options take a `badge` (a count in a small pill, part of the radio's accessible name).
- `PageHeader icon={Plug} iconIntent="brand"`: a decorative icon tile left of the title.
- `Rating value={4.5} allowHalf readOnly showValue count="(128 reviews)"`: stars on the warning hue with an outlined empty star, announced as `role="img"` ("Rated 4.5 out of 5"). Without `readOnly` it is a `radiogroup` (one tab stop, arrows, Home/End, hover preview) with `defaultValue`/`value` and `onChange(value)`; `0` is "no rating".
- `Carousel.Thumbnails`: a scrolling row of buttons under the slides, one child per slide, named "Go to slide N" with `aria-current` on the current one and scrolled into view as it changes.
- `ProfileHeader`: the top of a profile page. A `cover` (a gradient of the accent's tints by default), an `avatar` overlapping its bottom edge, the `name` with `badges`, a `headline` and `meta`, `actions`, `stats` read as a `<dl>`, and a `tabs` slot for a `Tabs.List` under a border. Below `sm` it stacks and the actions share the width.
- `ImageGrid layout="masonry"`: CSS columns, each picture keeping its aspect with its caption under it. Items flow down the first column, then the next; give the images `width` and `height` so the columns don't rebalance as they load.
- `ConfirmationModal intent="danger" requireText="my-project"`: a red tile and a solid action, disabled until the exact (case-sensitive) text is typed; `requireTextLabel` replaces the label.
- `SecretValue label="API key" value={key} visibleSuffix={4}`: a stored secret, masked until revealed. While masked the real value is not in the DOM (20 bullets plus the suffix, at most half of the value); the Copy button copies the real value without revealing it. `autoHideAfter` (ms) masks it again.
- `Link intent="danger"`: a `colored` link in `success`, `warning` or `danger` in place of the accent; the other variants have no color of their own and ignore it.
- `ProgressBar intent="neutral"`: a gray fill for a gauge that means nothing (space used, a quota). Segments and `ProgressRing` take it too.
- `Badge size="lg"` and `shape="rounded"`: a larger badge, and `rounded-md` corners in place of the pill.
- `Carousel.Indicators position="inside"`: the dots at the bottom center of the slide, 12px from the edge, on a dark pill. Keep the default when `Carousel.Controls` is `outside` too: its row sits under the slide.
- `Ribbon shape="pill"`: a fully rounded label set inside the card, 12px from the corner of its `position`.

## Tables

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
`TableAmountCell` are the cells tables keep rebuilding.

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
gets a "Sort by" select for the sortable columns. The default, `scroll`, keeps
the table.

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
sort, columns }` (the visible column keys, in order) and builds no file.
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
prints its own colours: pick a light one for print (or `@media print` in your CSS).

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
be clicked meanwhile), under a centred spinner, with the pager still there and
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

## Audit diff

`AuditDiff` shows what an audit log entry changed: `changes` is a list of
`{ field, label?, before?, after? }`. The default `table` variant is a real
table (Field, Before, After) that stacks each change as a block below `sm`; the
old value is struck through on a red tint and the new one sits on a green tint.
`variant="inline"` is one line per field (`Role: Viewer → Admin`), for an entry
of an `ActivityFeed` or a `Timeline`.

```tsx
import { AuditDiff } from '@sckyzo/cosmos-react';

<AuditDiff
  variant="inline"
  changes={[
    { field: 'role', label: 'Role', before: 'Viewer', after: 'Admin' },
    { field: 'phone', label: 'Phone', after: '+33 1 23 45 67 89' },
  ]}
/>;
```

Values are rendered as text (markup in one shows as written): strings as they
are, numbers and booleans with `String`, objects and arrays as compact JSON
(there is no nested diff). `null`, `undefined` and `''` mean the field was
empty on that side and show "—", which a screen reader reads as "empty".
`formatValue(value, change, side)` draws a value yourself. When both sides are
strings of a few words or more, the cells mark the words that moved with `<del>`
and `<ins>`, each with a visually hidden "removed:" / "added:"; past about 500
tokens on each side the whole values are shown instead. `labels` rewords every
text the component writes (`field`, `before`, `after`, `empty`, `removed`,
`added`), for another language.

## Progress

`ProgressBar` shows one value (`value`, `max`, `intent`) or a list of parts
(`segments`), never both. Each segment has a `value`, a `label` and an `intent`
you pick yourself; the parts sit 2px apart, and their sum is held to `max`, so
show the overflow yourself ("112%"). `legend` adds a row of swatch, label and value
under the bar, with what is left on the track. `aria-valuetext` lists the parts
("Documents 40, Images 25, Free 35"); `valueLabel` puts a unit on a part.

```tsx
<ProgressBar
  aria-label="Storage"
  legend
  segments={[
    { label: 'Documents', value: 40, valueLabel: '40 GB' },
    { label: 'Images', value: 25, intent: 'success', valueLabel: '25 GB' },
  ]}
  free={{ valueLabel: '35 GB' }}
/>
```

`ProgressRing` is the same meter as an SVG ring (no dependency): `value`, `max`,
`intent`, `size` (`sm` 32px, `md` 56px, `lg` 96px, or a number of pixels), `thickness`,
and `children` for the centre (a value, an icon). It is a `progressbar` too, so name it
with `aria-label` or `aria-labelledby`; the centre is not read a second time. `indeterminate`
spins a quarter arc, except under reduced motion.

```tsx
<ProgressRing aria-label="Course progress" value={68} intent="success">
  68%
</ProgressRing>
```

## Kanban board

`KanbanBoard` shows columns of cards that move between columns: a sprint board, a pipeline, tasks by
status. Cards are plain data (`id`, `title`, an optional `description`, and `badges` and `footer`
slots for `Tag`s and an `AvatarGroup`), columns are `{ id, title, cards }`. It follows the usual
controlled/uncontrolled pair (`value`, `defaultValue`, `onChange(columns)`), and owns no data: the
host saves the move. `onCardMove` carries just the move, after `onChange`, which is what a server
needs.

```tsx
<KanbanBoard
  ariaLabel="Sprint board"
  defaultValue={columns}
  onChange={setColumns}
  onCardMove={({ cardId, fromColumnId, toColumnId, index }) => save(cardId, toColumnId, index)}
  onCardOpen={(card) => setOpen(card)}
  onAddCard={(columnId) => openForm(columnId)}
/>
```

A card is dragged by its grip, with a pointer or a finger. From the keyboard, focus the grip, press
Space or Enter to pick the card up, the arrow keys to move it between positions and columns, Space
or Enter to drop it, Escape to put it back; a live region announces each step. Every card also has
an actions menu ("Move to" the other columns, "Move up", "Move down"), so the board works without
dragging. `onCardOpen` makes the whole card a button, `onAddCard` adds an "Add card" button to each
column, `renderCard` replaces what is inside a card (the grip and the actions menu stay), and
`loading` shows skeleton columns. A column takes an `intent` for the dot before its title and an
`empty` node for when it has no cards. Below `sm` the columns scroll sideways, one column wide.

Drag and drop is built on [`@dnd-kit/react`](https://dndkit.com), pinned to an exact version since it
is pre-1.0. It is a regular dependency of the package, not a peer.

## Dates, clocks and countdowns

`DateTime`, `RelativeTime`, `Clock` and `Countdown` write a moment the same way everywhere, with
`Intl` and in the user's language. They render in the browser only, since the server knows neither
the locale nor the zone, and keep the room of their text until then.

```tsx
<DateTime value={order.createdAt} format="datetime" timeZone="Europe/Paris" />
<RelativeTime value={event.at} tooltip />
<Clock variant="card" timeZone="Asia/Tokyo" label="Tokyo" showDate />
<Countdown target="2026-03-01T09:00:00Z" onComplete={() => reload()} />
```

- `DateTime` takes a `format` (`date`, `time`, `datetime`, `long`, `full`, or `Intl.DateTimeFormat`
  options), a `locale` and a `timeZone`, and draws a `<time dateTime>`. `tooltip` adds the full date
  and zone, and makes the `<time>` a tab stop so a keyboard reaches it.
- `RelativeTime` reads "5 minutes ago", "yesterday", "in 2 days". Every instance shares one timer and
  wakes only when its text changes: each second in the first minute, each minute in the first hour,
  and rarely after, so a long list costs nothing.
- `Clock` has the variants `inline`, `card` and `display`, and takes `hour12`, `showSeconds`,
  `showDate` and a `label` for the zone. It ticks on the second boundary. A world clock is a grid of
  `Clock`s.
- `Countdown` has the variants `tiles`, `inline` and `compact`. `onComplete` is called once, at zero,
  and the countdown stops there. `labels`, `shortLabels`, `label` and `completedLabel` translate its
  text.

`Clock` and `Countdown` are `role="timer"`, which a screen reader does not announce as it changes.
Every one of them takes `now`, which freezes it at that moment and sets no timer: use it for
stories, screenshots and tests.

## Health checks

`HealthSummary`, `HealthCheckList` and `HealthMatrix` show whether a system and its parts are
healthy, and why not. They build on `HealthStatus` (`OK`, `WARN`, `CRIT`, `UNKNOWN`, `INFO`) and on
the dots and badges of the same folder.

A check is plain data. A group holds checks and, below them, other groups: one level per dependency
reads as a tree. A group has no status of its own, it is the worst status under it.

```tsx
const checks: HealthCheck[] = [
  {
    id: 'queue',
    name: 'Job queue',
    status: 'WARN',
    target: 'redis://queue:6379/0',
    message: '312 jobs waiting (limit 200)',
    latency: 4, // milliseconds
    checkedAt: '2026-01-15T09:59:30Z', // a Date, a timestamp or an ISO string
    output: 'queue=default depth=312 oldest=94s', // shown in a code block, on demand
  },
];
const groups: HealthCheckGroup[] = [{ id: 'queue', name: 'Queue', checks, groups: [] }];

<HealthSummary checks={flattenChecks(groups)} refresh={{ onRefresh, autoRefreshMs, onIntervalChange }} />
<HealthCheckList groups={groups} sort="severity" />
<HealthMatrix ariaLabel="Services by node" columns={nodes} rows={services} />
```

Everything that sorts or rolls up uses one **severity order**, worst first: `CRIT`, `WARN`,
`UNKNOWN`, `INFO`, `OK`. A check nobody could run weighs more than one that passes. `SEVERITY_ORDER`,
`compareSeverity` and `worstStatus` are exported, as are `flattenChecks` and `groupWorst`. A set with
nothing in it is `UNKNOWN`.

- `HealthSummary` takes the worst status of its `checks`, and `status` overrides it when you weigh the
  checks differently (the counts still come from `checks`). The headlines are "All systems
  operational", "Degraded performance", "Major outage", "Status unknown" and "Operational, with
  notices"; `labels` replaces any of them. It also shows the count per status, the last check
  (`RelativeTime`, from the latest `checkedAt`, or `checkedAt`) and, with `refresh` (the props of
  `RefreshButton`), a refresh action. `variant="banner"` is full width and tinted by the status,
  `variant="compact"` is one line for a card or a topbar.
- `HealthCheckList` draws rows with the status in words, the name, target, message, latency and last
  check. A check with an `output` has a toggle on its name. Pass `checks`, `groups` or both. A group
  header shows the worst status and the counts under it and collapses
  (`collapsedGroups` / `defaultCollapsedGroups` / `onCollapsedGroupsChange`, by group id).
  `sort="severity"` puts the failing checks, and the groups holding them, first. `variant="list"` is
  rows, `variant="grid"` one small card per check, for a wall screen.
- `HealthMatrix` is one cell per service (`rows`) and per environment, node or region (`columns`),
  with sticky headers, in a `role="grid"` that takes one tab stop: arrow keys move between cells,
  Home and End go to the ends of the row. A cell opens its detail in a popover (`message`, `latency`,
  `checkedAt`, and a `detail` node of your own) with Enter, Space or a click; Escape closes it and the
  focus returns to the cell. Each cell is named like "API on par-2b: Warning", and a column with no
  entry is an empty cell. `variant="dots"` is dense, and every dot has a shape as well as a colour: OK a
  filled circle, warning a diamond, critical a square, unknown a hollow ring, info a triangle. The
  legend above the grid shows the same shapes. `variant="pills"` writes the status in each cell. The
  grid scrolls in its own box when it is wider than the screen; `maxHeight` also scrolls it
  vertically.

Every one takes `now`, which freezes the relative times, for stories and tests. One check shown as a
card, and a dependency tree, need no component of their own: see the stories of the Monitoring group.

## Uptime monitoring

`HeartbeatBar`, `UptimeBars`, `UptimeStat` and `MonitorRow` draw what a monitor found: its recent
checks, its uptime over days and periods, and one monitor as a line or a tile. A monitor checks a
target every N seconds; these show the result, and the host brings the data.

A **beat** is one check, and a **day** is one day of history. `time` and `date` take a `Date`, a
timestamp in milliseconds or an ISO 8601 string (a bare `YYYY-MM-DD` names that calendar day for every
reader, whatever their time zone).

```tsx
const beats: Beat[] = [
  { time: '2026-01-15T06:41:10Z', status: 'up', latency: 182 },
  { time: '2026-01-15T06:42:10Z', status: 'down', latency: 5003, message: 'Timeout after 5 s' },
]; // oldest first; status: 'up' | 'down' | 'degraded' | 'maintenance' | 'pending'
const days: UptimeDay[] = [
  { date: '2026-01-14', uptime: 0.9995, incidents: 1 }, // 0 to 1; null is a day with no data
  { date: '2026-01-15', uptime: null },
];

<HeartbeatBar beats={beats} />
<UptimeBars days={days} title="API" legend />
<UptimeStat periods={[{ label: '30 days', uptime: 0.9991 }]} responseTime={182} certificate={{ daysLeft: 12 }} />
<MonitorRow name="API" type="HTTP" beats={beats} uptime={0.9992} />
```

**Thresholds.** An uptime is coloured by one shared rule: 99.9 % and up is green, 99 % up to 99.9 %
is amber, below 99 % is red, and `null` is grey ("No data"). Every component that colours by uptime
(`UptimeBars`, `UptimeStat`, `MonitorRow`) takes `thresholds`, a partial `{ good, warning }` in shares
from 0 to 1 (`{ good: 0.9999, warning: 0.999 }`), and the legend of `UptimeBars` follows it. A
`warning` limit above `good` is lowered to it. `DEFAULT_THRESHOLDS`, `resolveThresholds` and
`uptimeLevel` are exported, to colour your own figures the same way. The status colours are the
theme's (`--color-status-ok`, `-warn`, `-crit`), so a theme or an accent repaints them.

- `HeartbeatBar` draws one mark per beat, the newest at the end. `variant` is `bars` (default),
  `blocks` or `dots`; `size` is `md` (32px, default) or `sm` (24px, the height inside a `MonitorRow`).
  It holds as many beats as its width allows and drops the oldest, so a 375px screen still shows the
  latest history: give it the width of its container. A `down` beat differs by shape as well as
  colour (a taller bar, a block crossed by a diagonal, a square dot) and every beat is named in words
  (status, time, latency, message). The bar is one tab stop on the newest beat; the arrow keys, Home
  and End move between beats, and hovering or focusing one shows its tooltip (Escape hides it).
  `legend` writes the key of the statuses under the bar.
- `UptimeBars` draws one bar per day over `period` 30, 60 or 90 days (default 90), coloured by the
  thresholds. The header gives `title` and the uptime of the period (the mean of the days with data,
  or `uptime` when you have the exact figure), the captions read "90 days ago" and "Today". When the
  width cannot hold every day, the oldest are dropped and the caption and the figure describe what is
  drawn. Days are named ("Jan 15, 2026: 99.95% uptime, 1 incident"), reached with the same keyboard
  model as `HeartbeatBar`, and `legend` writes the thresholds. `compact` is the form for a card: lower
  bars, no header, captions or legend.
- `UptimeStat` has two variants. `row` (default) puts the uptime of each of your `periods` side by
  side (`{ label: '24 hours', uptime }`: you name the periods), then `responseTime` and the
  `certificate`: days left, a warning (an icon, and the amber colour) under `warnBelow` days, 14 by
  default. `card` is one figure for a dashboard tile: the first period, and the downtime it stands for
  ("39 min down") when the period has a `duration` in milliseconds, with `days` drawn as compact bars.
  It is a variant of its own, not a `KpiCard` preset.
- `MonitorRow` shows the state (the status of the last beat, `status` to force it, `paused` to
  pause it), the name (a link with `href`) and `type` (any string: `HTTP`, `TCP`, `DNS`, `ping`,
  `keyword`), a 24px `HeartbeatBar`, the uptime over 24 hours, and the current latency (default: the
  last beat's). `variant="row"` is a line of a list, which the host draws: it stacks on a narrow
  screen. `variant="card"` is a tile for a grid.

The response time (a `LineAreaChart` from `@sckyzo/cosmos-charts`, its `referenceBands` shading the
down periods; the stories draw a plain SVG, since this package has no chart dependency), the timeline
of an incident (`Timeline`) and a maintenance notice (`AlertBanner`) need no component of their own:
see the stories of the Monitoring group, and the two example pages (a public status page and a
monitors dashboard).

## Auth layouts

`AuthLayout` wraps the sign-in, sign-up, reset and two-step forms. `variant` picks the page:
`card` (default) is a centred card; `split` puts the form beside a brand panel; `cover`
centres the card over a full-bleed image.

```tsx
<AuthLayout variant="split" logo={Activity} title="Cosmos Cloud" subtitle="Monitor every rack.">
  <SignInForm />
</AuthLayout>
<AuthLayout variant="cover" cover={{ src: '/login.jpg' }} logo={Activity} title="Cosmos Cloud">
  <SignInForm />
</AuthLayout>
```

In `split`, `aside` replaces the default panel (an accent surface with the `logo`, `title` and
`subtitle`; `null` for none), `asidePosition` (`start` | `end`, default `end`) picks its side. The
panel shows from `lg` up; below, the brand block sits above the form. In `cover`, `cover.src` is
drawn under a dark scrim (`cover.alt` is empty unless set), and without it the card sits on a
gradient of the accent. In every variant the built-in title is a paragraph: the forms carry the
page's `h1`.

## Record pager

`RecordPager` moves through the records of a list from a detail page: "12 of 340", Previous, Next
and an optional "Back to list". `Pagination` stays for pages of a list; the order and filters of the
list are the host's to keep (URL or state).

```tsx
<RecordPager
  position={12}
  total={340}
  noun="order"
  previousHref="/orders/20430"
  nextHref="/orders/20432"
  backHref="/orders"
  hotkeys={{ previous: '[', next: ']' }}
/>
```

- Links when `previousHref` / `nextHref` are given (through `LinkProvider`), buttons with
  `onPrevious` / `onNext` otherwise. A side with nowhere to go, or at the first or last record, is a
  disabled button, never a link.
- `noun` builds the labels ("Previous order"); `labels` (`previous`, `next`, `back`, `count`)
  replaces any of them, for another language.
- `variant="compact"` draws icon buttons (still named) and the count, for a `PageHeader`'s `actions`.
- Below `sm`, the default variant shows the icons only too, so a long label never wraps; the label
  stays the button's name.
- Shortcuts are off unless `hotkeys` is given. They listen on the document, do nothing while a
  field is being typed in, and click the control, so a link goes through your router. List them
  yourself in a `HelpOverlay`.

## Files and uploads

`FileTile` is one file or folder as a `<li>`: `layout="tile"` (the default) is the card of a grid, with a
128px preview, `layout="row"` the line of a list. `kind` (`folder`, `image`, `video`, `audio`, `pdf`,
`document`, `spreadsheet`, `archive`, `code`, `other`) picks the icon and its tint; a `thumbnail` takes
the icon's place and falls back to it if it fails to load. The name is the only link (`href`) or button
(`onOpen`) of the tile; the star (`starred` / `defaultStarred` / `onStarredChange`, named "Star {name}")
and `actions`, typically a `Menu`, are siblings of it. `shared` adds a "Shared" badge and `selected`
draws the tile as picked.

```tsx
<GridList cols={4}>
  <FileTile
    name="Q3 report.pdf"
    kind="pdf"
    meta="2.4 MB · Edited yesterday"
    defaultStarred
    onOpen={() => open(file)}
    actions={<FileMenu file={file} />}
  />
</GridList>
```

`UploadQueue` lists uploads in progress, failed and done in one card. It does no network I/O: the app
owns the transfer, keeps `items` (`id`, `name`, `size`, `status`, `progress`, `error`) up to date and
answers `onRetry(id)` and `onRemove(id)`. A row says its status in text first, and a polite live region
announces the rows that finish or fail. Pair it with a `Dropzone` set to `hideFileList`:
`onFilesAdded(files)` gets only the files just accepted, so the app can start uploading them, and
`onReject(rejections)` keeps the valid files of a drop and reports the others one by one with their
reason, where without it one invalid file rejects the whole drop.

```tsx
<Dropzone multiple hideFileList accept=".pdf,.png" maxSize={25 * 1024 * 1024}
  onFilesAdded={(files) => files.forEach(upload)}
  onReject={(rejections) => report(rejections)} />
<UploadQueue items={uploads} onRetry={retry} onRemove={cancelOrDismiss} />
```

## Chat

Building blocks for a conversation view: `ChatThread` (a `role="log"` live
region that stays scrolled to the newest message), `ChatMessage`,
`ChatDaySeparator`, `ChatTypingIndicator`, `ChatComposer` (Enter sends,
Shift+Enter adds a line) and `ChatConversationList` for a two-pane layout.
Message text is always rendered as text, never HTML; http(s) URLs become links.

`Chatbot` is a floating widget built on them: a launcher at the bottom right
opens a panel (full-screen under 480px). It has no network code, the app owns
the messages and answers `onSend`:

```tsx
<Chatbot
  messages={messages}
  onSend={(text) => ask(text)}
  typing={waiting}
  suggestions={['Show my alerts']}
  error={failed ? 'The assistant could not be reached.' : undefined}
  onRetry={retry}
/>
```

A bot message with `streaming: true` shows a caret while its text grows.

### Rich replies (AI assistant, generators)

The same blocks build an assistant page; the app owns the conversation and renders any
Markdown itself.

- `ChatMessage` takes `children` in place of `text` (rendered nodes: a `CodeBlock`, a list, an
  `ImageGrid`). `bubble={false}` drops the bubble of an incoming reply so it takes the whole
  column, with the avatar and name on top. While `streaming` the message is `aria-busy`.
- `actions={<ChatMessageActions text={reply} onRegenerate={…} feedback={…} onFeedbackChange={…} />}`
  adds Copy reply, Regenerate and Good/Bad response under the reply (`aria-pressed`, also
  `defaultFeedback`). With a pointer they show on hover and focus; on touch they always show.
- `ChatSuggestions` is the row of chips `Chatbot` uses (`suggestions`, `onSelect`).
- `ChatComposer` takes `footer` (a line under the field: attach, a model `Select`, a hint) and
  `generating` + `onStop`: the send button becomes Stop (`stopLabel`), and Enter does not send.
- `ChatToolCall` (`name`, `status` of `running | done | failed`, `duration`, `input`, `output`)
  is a disclosure row for what the assistant did; `ChatSources` (`sources`, `label`) lists where
  an answer comes from. Only http(s) sources become links.
- `Clipboard plain` is the borderless copy button of that row.

## Comments

`CommentThread`, `Comment` and `CommentComposer` build the discussion under a record (a ticket, a
task, an order). The host owns the data: the components take callbacks and keep only which
replies are unfolded and which composer is open. Body text is rendered as text, never HTML, and
only http(s) URLs become links.

```tsx
<CommentThread composer={<CommentComposer onSubmit={(text) => add(text)} />}>
  {comments.map((c) => (
    <Comment
      key={c.id}
      author={c.author}
      role={c.role}
      time={<time dateTime={c.createdAt}>{format(c.createdAt)}</time>}
      edited={c.edited}
      variant={c.internal ? 'internal' : 'default'}
      text={c.text}
      onReply={(text) => reply(c.id, text)}
      onEdit={c.mine ? (text) => edit(c.id, text) : undefined}
      onDelete={c.mine ? () => remove(c.id) : undefined}
      replies={c.replies.map((r) => (
        <Comment key={r.id} author={r.author} text={r.text} />
      ))}
    />
  ))}
</CommentThread>
```

- An action shows only when its callback is given, so a host lets people edit only their own
  comments. Reply and Edit open a `CommentComposer` in place (the edit one starts with the
  comment's text; `editText` when the body is `children`) and call back with the trimmed text;
  Cancel and Escape return the focus to the button that opened it. Delete calls back at once:
  confirm in the host if needed.
- Replies are one level, `Comment`s passed as `replies`, folded beyond `maxReplies` (default
  `2`) behind a "Show 3 more replies" button. A reply has no Reply of its own.
- `variant="internal"` tints a note and labels it "Internal note" with a lock, so it reads as one
  without the color.
- `CommentComposer` is a `Textarea` with `autoResize`: Enter adds a line, Ctrl or Cmd+Enter and the
  submit button send, Escape cancels when `onCancel` is given. Submit is disabled while the text
  is empty or `submitting`. `value` / `defaultValue` / `onChange` work as on other fields.
- `time` is a node, as in `Timeline`: a `RelativeTime`, a `<time>` or your own text.
- Every text can be translated: `labels` on `CommentThread` reaches all its comments (a
  comment's own `labels` win), `emptyTitle` and `label` on the thread, and the composer's own
  `label`, `placeholder`, `submitLabel` and `cancelLabel`.

## Log views

`LogViewer`, `LogToolbar`, `LogLevelBadge` and `LogEntryDetail` read a log: the live tail, its
controls, a level label and one record in full. The host owns the data: it fetches the snapshot,
streams the new lines (SSE, WebSocket), trims the buffer and decides what "clear" and "download"
do. The components draw what they are given.

```tsx
const [lines, setLines] = useState<LogLine[]>([]); // oldest first, ids unique and stable
const [follow, setFollow] = useState(true);
const [levels, setLevels] = useState<readonly LogLevelKey[]>(['debug', 'info', 'warn', 'error']);
const [search, setSearch] = useState('');
const [active, setActive] = useState(0);
const [matches, setMatches] = useState(0);

<LogToolbar
  live={follow}
  onLiveChange={setFollow}
  levels={['debug', 'info', 'warn', 'error']}
  levelCounts={countLogLevels(lines)}
  activeLevels={levels}
  onActiveLevelsChange={setLevels}
  search={search}
  onSearchChange={(text) => {
    setSearch(text);
    setActive(0); // a new search starts at its first match
  }}
  matchCount={matches}
  activeMatch={active}
  onActiveMatchChange={setActive}
  onClear={() => setLines([])}
/>
<LogViewer
  aria-label="Backend logs"
  lines={lines}
  follow={follow}
  onFollowChange={setFollow}
  activeLevels={levels}
  search={search}
  activeMatch={active}
  onMatchCountChange={setMatches}
/>
```

**Data model.** A `LogLine` is `{ id, time, level?, source?, message, fields?, stack? }`. `time` is
a `Date`, a timestamp in milliseconds or an ISO string, shown with milliseconds. `level` is
`trace`, `debug`, `info`, `warn`, `error` or `fatal` in any case; anything else (`warning`,
`notice`, nothing) is `unknown`. `lines` is always oldest first, whatever the `order` it is drawn
in, and each `id` must stay the same from one render to the next: the viewer uses it to key rows
and to count the lines that arrived while it was paused.

**`LogViewer`**

- `tone`: `terminal` (default) is a dark panel in every theme, as a console is; `surface` follows
  the theme, for a card on a dashboard. `density`: `compact` (default) is one line per record,
  `comfortable` puts the message under its time, level and source. `columns` hides parts of the
  row (`['time']`), `lineNumbers` numbers the lines in the order of `lines`.
- `follow` / `defaultFollow` / `onFollowChange`: it stays at the newest line while lines arrive.
  Scrolling away from the end pauses it and shows "Jump to latest (12 new)"; the button, or
  scrolling back to the end, resumes it; a filter that shortens the list does not. `order` puts
  the newest line last (`newest-last`, the default, a tail) or first.
- The row follows the width of the viewer, not the screen's: the viewer is a container. Under
  28rem the source column is hidden; without `wrap` the row stays on one line and the viewer
  scrolls sideways inside itself, with `wrap` the message goes on a line of its own under the
  time and the level. Give the viewer a width (it fills a block parent; in a flex row, a `flex-1`
  or a width class), since a container takes none from its content.
- `activeLevels` and `activeSources` filter the lines (left out or, for sources, empty, shows
  all). `search` highlights a case-insensitive term in the messages and sources, `searchRegex`
  reads it as a pattern (one that does not compile finds nothing). `activeMatch` is the active
  match, counted from 0 among the lines that match; it is drawn stronger and scrolled into view
  when it changes. `onMatchCountChange` reports how many lines match. Reset `activeMatch` to 0
  when the search changes, as the example does; `LogToolbar` steps it with previous and next
  (and Enter / Shift+Enter), wrapping around the ends.
- A row with `fields` or a `stack` has a button that expands it in place
  (`expandedIds` / `defaultExpandedIds` / `onExpandedIdsChange`). `onOpenLine` adds an "Open
  details" button to the expanded row, to open a `LogEntryDetail` in a drawer.
- Messages, sources, fields and stacks are text, never HTML. A bidirectional control character
  stays inside its own message.

**`LogToolbar`.** Each control is there when its props are given: Live / Paused
(`onLiveChange`), level toggles with counts (`levels`), search (`onSearchChange`) with a regex
toggle (`onSearchRegexChange`) and previous / next (`matchCount` and `onActiveMatchChange`), a
source filter on `MultiSelect` (`sources`), `onWrapChange`, `onOrderChange`, `onDownload` and
`onClear`. From `sm` up it is one bar. Below, Live / Paused and the search stay in the bar and
the levels, sources and view options move into a "Filters" popover; its button shows how many
filters are active (levels narrowed, sources chosen). The state pairs (`live`, `activeLevels`,
`search`, `searchRegex`, `activeSources`, `wrap`, `order`) work controlled or not, as on other
fields. It holds none of the log: pass the same filters to the viewer.

**`LogLevelBadge`** is the level as a word in its colour (`ERROR`, `WARN`), on the `surface` tone
by default or the `terminal` one. Use it in a table cell, a card or a detail.

**`LogEntryDetail`** shows one record in full for a drawer or a side panel: level, time, source
and message, the fields as key / value pairs with a copy button each, the stack trace, the raw
JSON, and "Show context", the lines around it (a `context` prop, or fetched through
`onShowContext`). `onFilterValue` and `onExcludeValue` add "Filter on this value" and "Exclude
this value" buttons to each field. A structured table is a `DataTable` with a `LogLevelBadge`
column and, once rows can expand, a `LogEntryDetail` in them.

**Accessibility.** The viewer is `role="log"` with `aria-live="off"`: a fast stream read aloud
line by line cannot be followed, so new lines are not announced. `announceErrors` reads the
error and fatal lines that arrive (three at most, then the count of the rest) in a polite live
region of its own. The scroller takes a tab stop, so the arrow keys scroll it, and every level is
a word, not only a colour. Each level colour holds 4.5:1 on both tones in the four themes.

**Limits.**

- The default mode is windowed: only the rows in view are drawn, so tens of thousands of lines
  stay smooth. The row height is measured, so it follows the text size, and a row that scrolls out
  of view and back is redrawn: a button on it loses the focus when it leaves the window.
- An expanded row takes a fixed room of up to 12 rows (a row per field and per stack line); a
  longer detail scrolls inside it.
- `wrap` lines have no fixed height, so they cannot be windowed: all of them are drawn (the
  browser skips the ones out of view with `content-visibility`). Keep the buffer to a few
  thousand lines with `wrap` on, as rackscope does with 2,000. Newest first and paused, wrapped
  lines do not stay put when new ones arrive.
- Without `wrap` a long line scrolls sideways: the scroll width is that of the widest row drawn.
- The labels ("Jump to latest", "Filters"…) are English.
- Not here: the log volume chart (stacked `BarChart` of `@sckyzo/cosmos-charts`, as the lines per
  level over time) and a structured logs table. The output of a job is `JobLog`, below.

## Job logs

`JobLog` is the output of a CI job or a build: collapsible steps, each with its status and
duration, and the lines of each step numbered and coloured. It is read differently from a live
tail, hence a component of its own; it shares the tones, the clock format and the windowing of
`LogViewer`. The host owns the data and the clock: it passes the steps, their durations (`JobLog`
runs no timer) and the new lines as they come.

```tsx
const steps: JobLogStep[] = [
  { id: 'install', name: 'Install dependencies', status: 'passed', duration: 41_000, lines: [...] },
  {
    id: 'run-tests',
    name: 'Run tests',
    status: 'failed',
    duration: 72_000,
    startedAt: '2026-01-15T09:30:44Z',
    // A string, or { text, timestamp } when the line has a time.
    lines: ['$ pnpm test', '\x1b[31m✗ sortRows keeps empty values last\x1b[0m', ...],
  },
  { id: 'build', name: 'Build', status: 'skipped', lines: [] },
];

<JobLog title="Build #1287" meta="main · 4f2c1a9" status="failed" duration={123_000} steps={steps} />
```

- **Steps.** `status` is `queued`, `running`, `passed`, `failed` or `skipped`. `duration` is in
  milliseconds; `startedAt` is the origin of the elapsed times (it defaults to the first
  timestamp of the step). `id` is unique and stays the same from one render to the next. The
  optional header (`title`, `status`, `meta`, `duration`) is drawn when any of them is given.
- **Open steps.** The failed and the running steps start open, the others closed, and a step that
  starts running later opens. `expandedSteps` / `defaultExpandedSteps` / `onExpandedStepsChange`
  work as on other controls. The header of an open step sticks to the top of the log while its
  lines scroll, and each step is windowed on its own, so a step of tens of thousands of lines
  stays smooth.
- **Line numbers.** They restart at 1 in each step and are links: `href="#<idPrefix><step id>-L<n>"`.
  A click calls `onCurrentLineChange({ step, line })` and does not touch `location`; a click with a
  modifier key is the browser's own, so "open in a new tab" works. `currentLine` /
  `defaultCurrentLine` is the line in focus: when it changes its step opens, the line scrolls into
  view and takes `aria-current="location"`. One line at a time. To make the links shareable, sync
  it with the URL hash in the host: read `parseJobLogHash(location.hash, idPrefix)` into
  `currentLine` on load and on `hashchange`, and write `jobLogLineHref(idPrefix, line)` back from
  `onCurrentLineChange` (the `Monitoring/JobLog` "Synced with the URL hash" story does).
- **Toolbar.** Search across all the steps (a match in a closed step opens it) with the count and
  previous / next, a timestamps toggle, wrap, expand or collapse all, and download as plain text
  (ANSI codes stripped, `fileName`). `controls` picks which are drawn (`['search']`; `[]` leaves
  the toolbar out). Below `md` of the log's own width, as a container, the search stays and the
  rest moves into a "More options" menu. `timestamps`, `wrap` and `search` each come with a
  `default*` and an `on*Change`.
- **Timestamps.** Off by default. `timestampFormat="clock"` (default) is the time of each line, as
  `LogViewer` writes it (`locale`, `timeZone`); `"elapsed"` is the time since its step started,
  `+0:04.2`.
- **Following.** While a step runs the log stays at the end, pauses when the reader scrolls up,
  and has a footer button: Pause, then "Jump to latest (12 new)". `follow` / `defaultFollow` /
  `onFollowChange`. Moving to a line (a `currentLine`, a search match) leaves the end too.
- **Tone.** `terminal` (default) is a dark panel in every theme, `surface` follows the theme.

**ANSI.** Colour codes are read into styled spans, never HTML. Kept: the 16 colours and their
bright variants as a foreground and as a background, bold, dim, italic, underline and the resets.
A 256-colour or truecolor code lands on the nearest of the 16. Every other escape sequence (cursor
moves, window titles, links) and control character is dropped, and a carriage return keeps only the
last segment of the line, so a progress bar reads as its last state. Black and white are mapped to
what reads on the tone (a black text on the terminal panel is the muted gray). Each colour holds
4.5:1 on both tones in the four themes. On a background colour, the text takes the colour that
reads on that background and its own is dropped (`31;47` is dark text on a light fill), and dim
mutes only the default text: a coloured text keeps its colour.

**Accessibility.** The log is a named `region` with a tab stop. A step header is a button with
`aria-expanded` and `aria-controls`, its status an image with a text name (never a colour alone),
and the lines of an open step a named group. A line number is a link named "Line 6".

**Limits.**

- The windowing needs a row of a fixed height, so it is off with `wrap`: all the lines of an open
  step are then drawn (the browser skips the ones out of view). Keep a step to a few thousand lines
  with `wrap` on. A line link that scrolls out of the window loses the focus.
- Without `wrap`, the lines of a step scroll sideways inside the step, under its header.
- A search compiles the plain text of every line of every step: for logs of hundreds of thousands
  of lines, filter on the host.
- The labels ("Jump to latest", "More options"…) are English.

## Slider

`Slider` is a position on a scale, or a range of it. One `value` (with `defaultValue` and
`onChange(value)`): a number draws one handle, a pair `[minimum, maximum]` draws two, which can meet
but never cross. `min`, `max` and `step` default to 0, 100 and 1. `label` sits on the left of the
header, the current value on the right, and `min` and `max` under the track; `formatValue(n)` writes
all of them and the value a screen reader announces. `label` also names the handles ("Price minimum"
and "Price maximum" for a range): without a visible label, give `aria-label`. `marks` draws a tick at
every `step`, `intent` colors the fill (`brand`, `success`, `warning` or `danger`).

```tsx
<Slider
  label="Price"
  defaultValue={[200, 800]}
  max={1000}
  step={10}
  formatValue={(n) => `$${n}`}
  onChange={(range) => setPrice(range)}
/>
```

## Colour and phone fields

`ColorInput` picks a colour from named swatches (a radio group, arrows move between them) or a hex
field with a preview square. The value is the lowercase `#rrggbb`: the field accepts `#abc`, `abc`
and `#aabbcc`, and only a valid hex reaches `onChange(hex)`. Leaving the field with an invalid draft
shows an error and keeps the value. `presets` replaces the eight default swatches (`[]` for the hex
field alone); each is a `{ value, label }`, and the label is what a screen reader announces.

`PhoneInput` joins a country list and the number field in one border. The value is the E.164 number
(`+33612345678`) or `''`: `onChange(value)` gets `''` until the number is valid, which the light
check decides (digits only, 4 or more, 15 at most with the country code). The list searches by
name, ISO code or calling code; names come from `Intl.DisplayNames` in the page language.
`defaultCountry` (an ISO 3166-1 code, `US` by default) sets the country until a number says
otherwise, and `countries` limits the list. Typing `+` and a known calling code switches the
country, picking a country keeps the digits. A calling code shared by several countries keeps the
current one if it has it, else takes the code's main country. The package carries no phone metadata:
`format(country, national)` shapes the digits as they are typed and `validate(value)` returns the
message for a number it rejects, so a host can plug `libphonenumber-js` in.

```tsx
<ColorInput label="Event colour" value={colour} onChange={setColour} />

<PhoneInput
  label="Phone number"
  defaultCountry="FR"
  value={phone}
  onChange={setPhone}
  validate={(v) => (isValidPhoneNumber(v) ? undefined : 'Enter a valid phone number.')}
/>
```

## Application shell

`Shell` lays out a `Topbar`, a `Sidebar` and the page, and owns the sidebar's
collapsed state: `defaultSidebarCollapsed`, or `sidebarCollapsed` and
`onCollapsedChange` to control it. The Topbar shows the toggle, or the bottom of
the Sidebar does with `collapseControl="sidebar"`.

Below `lg` the sidebar leaves the layout and the Topbar's hamburger opens it as a 288px
drawer over a scrim (`defaultSidebarOpen`, or `sidebarOpen` and `onSidebarOpenChange`
to control it). It is always expanded there, with a close button in `Sidebar.Brand`, and it
closes on the scrim, Escape, a swipe to the left, a click on a `Sidebar.Item` and when the
viewport grows past `lg`. Pass the product logo as the Topbar's `brand` to keep it in
view while the sidebar is off screen. Any `Drawer` can close on a swipe too, with
`swipeToClose`: toward its edge on `left` and `right`, downward on `side="bottom"`, the
bottom sheet (full width, as tall as its content up to 85% of the viewport, a grab `handle`
you can turn off with `handle={false}`, and a `Drawer.Body` that scrolls past that height).

The expanded `Sidebar` follows its content: from `width` (264px, its minimum) it grows to
fit its widest visible row, the deep levels of a tree included, up to `maxWidth` (320px). A
label that needs more ends in an ellipsis and its row shows the full label in a tooltip. Set
`maxWidth` to the same value as `width` for a fixed width. The collapsed rail (`collapsedWidth`)
and the drawer keep their own widths.

A collapsed `Sidebar` can open while the pointer rests on it, with `expandOnHover`:
`"overlay"` opens it above the page after 150 ms, with a shadow, and the page does not move;
`"push"` widens it and the page makes room. Keyboard focus entering the sidebar does the same,
and Escape closes it. It only applies from `lg` up, on a pointer that can hover, never in the
drawer, and it does not touch the collapsed state: `onCollapsedChange` is not called and the
toggles keep their state.

`SidebarToggle` is that toggle, to place anywhere else in the Shell (a header of
your own, the Topbar's `startActions`, the Sidebar's `footer`) with no props: it
reads the Shell's state, and every toggle stays in sync. Outside a Shell, pass it
`collapsed` and `onCollapsedChange`.

```tsx
<Shell
  topbar={<Topbar pageTitle="Servers" />}
  sidebar={<Sidebar footer={<SidebarToggle variant="panel" />}>{/* items */}</Sidebar>}
>
  {/* page */}
</Shell>
```

### Layout modes

`Sidebar variant="compact"` is a fixed 88px rail with the label under each icon, on two lines
at most (a tooltip carries the full name of a label that is cut). A `Sidebar.SubMenu` opens in a
flyout, as in the collapsed rail. It has no collapsed state, so `collapsed`, `expandOnHover` and
the bottom button do nothing: inside a Shell, set `collapseControl="sidebar"` so the Topbar shows
no hamburger that would do nothing. Below `lg` the drawer shows the default sidebar.

`Shell container="boxed"` centres the topbar, the sidebar and the page in a column of at most
1440px, with the page background on both sides. `fluid`, the default, spans the window.

A top navigation is a composition: a `Shell` with no `sidebar` and a `Navbar` in `topbar`. Its
`Navbar.Items` take `Navbar.Item` and `Navbar.Menu`, a dropdown group of links (`Menu.Item` with
an `href`, a `Menu.Group`, a `Menu.Separator`) that follows the menu button pattern: Enter, Space
and the arrows open it, the arrows move between the links, Escape closes it and gives the focus
back to the trigger, Tab leaves it. Mark the group `active` while one of its links is the current
page, and that link with `aria-current="page"`. Items that do not fit move, from the last, into a
"More" menu (`moreLabel` renames it) and come back when there is room. Only `Navbar.Item` and
`Navbar.Menu` placed directly in `Navbar.Items` move; `Navbar.Items` inside a `Navbar.Brand` takes
the room the bar leaves, and anywhere else it needs a bounded width (`min-w-0 flex-1`) to measure
against. Below `md` the items leave the bar and `Navbar.MobileMenuButton` opens your own menu.

```tsx
<Shell
  container="boxed"
  topbar={
    <Navbar>
      <Navbar.Brand>
        <Navbar.MobileMenuButton />
        <Navbar.Items>
          <Navbar.Item href="/" active>
            Dashboard
          </Navbar.Item>
          <Navbar.Menu label="Settings">
            <Menu.Item href="/profile">Profile</Menu.Item>
            <Menu.Item href="/team">Team</Menu.Item>
          </Navbar.Menu>
        </Navbar.Items>
      </Navbar.Brand>
    </Navbar>
  }
>
  {/* page */}
</Shell>
```

## Split panes

`SplitView` puts two or three `SplitView.Pane` side by side in one bordered frame (mail,
chat, a file manager). It fills the height of its parent and each pane scrolls on its own;
`width` is a Tailwind class (`w-56`), and a pane without one takes the remaining space. Below
`collapseBelow` (`md`, `lg` by default, `xl`) only the active pane shows. Control it with
`activePane` and `onActivePaneChange`, or start it with `defaultActivePane` and switch from
inside with `useSplitView()`; the pane that appears takes focus. A Back button is yours to
place.

```tsx
<SplitView activePane={pane} onActivePaneChange={setPane}>
  <SplitView.Pane id="list" label="Messages" width="w-80">
    {/* list */}
  </SplitView.Pane>
  <SplitView.Pane id="detail" label="Message">
    {/* detail */}
  </SplitView.Pane>
</SplitView>
```

## Code

`CodeBlock` shows a snippet with a copy button. It needs no highlighter, and takes a few variants:
`lineNumbers`, `highlightLines={[3, '5-7']}`, `filename` (a header with the name, the language and
the copy button), `wrap`, `maxHeight` (the block scrolls inside, takes a Tab stop and scrolls with the
arrow keys), `diff` (the first column of each line is its sign, `+`, `-` or a space; changes are
tinted and marked, the sign column is not copied) and `variant="terminal"` (a line starting with
`$` and a space is a command, the others are its output; only the commands are copied). A block that a long line
makes scroll sideways is a Tab stop too. The copy button copies the code, never the line numbers, the
signs or the prompts.

To colour it, use the `/code` entry. It needs [Shiki](https://shiki.style), an optional peer
dependency that only the apps using this entry install:

```bash
pnpm add shiki
```

```tsx
import { CodeBlock } from '@sckyzo/cosmos-react/code';

<CodeBlock language="yaml" filename="deployment.yaml" code={manifest} lineNumbers />;
```

The colours are the `--color-code-*` tokens of the theme, so they follow the theme, accent and text
size. The JavaScript regex engine is used (no WebAssembly), and each language is its own chunk,
loaded when a block shows it: until then, and for a language Cosmos has no grammar for, the block
shows plain text. The languages are shell (`bash`, `sh`, `zsh`), `shellsession`, `yaml`, `json`,
`toml`, `ini`, `dockerfile`, `sql`, `typescript`, `javascript`, `tsx`, `jsx`, `python`, `go`, `html`,
`xml`, `css`, `diff`, `nginx`, `hcl`, `terraform`, `rust`, `java`, `php`, `markdown` and `promql`.
A `highlight` prop still replaces the built-in highlighter. The main entry never imports Shiki:
an app that does not use `/code` ships none of it. Imported without `shiki` installed, a block
throws an error that names the package.

## Editor

`RichTextEditor` is a formatted text field: bold, italic, strike, headings, bulleted and numbered
lists, quotes, code, links, undo and redo. It lives in the `/editor` entry and is built on
[Tiptap](https://tiptap.dev) (MIT), whose packages are optional peer dependencies that only the apps
using this entry install:

```bash
pnpm add @tiptap/react @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extensions
```

```tsx
import { RichTextEditor } from '@sckyzo/cosmos-react/editor';

<RichTextEditor
  label="Reply"
  placeholder="Write a reply…"
  value={html}
  onChange={setHtml}
  maxLength={2000}
/>;
```

`value`, `defaultValue` and `onChange` carry HTML by default, or the ProseMirror JSON document with
`format="json"`; an empty HTML document is `''`. `variant` picks the chrome: `toolbar` (default,
buttons on top; `toolbar={['bold', 'italic', 'link']}` picks them), `bubble` (a small toolbar over
the selection; Alt+F10 moves the focus into it, Escape gives it back) or `minimal` (no toolbar, the
shortcuts and Markdown-like input rules only: `##` and a space, `-` and a space, `**bold**`).
`labels` replaces every text the editor draws, tooltips included. `readOnly`, `disabled`, `rows`,
`autoFocus` and `name` (a hidden input, for a native form) work as on a Textarea, and so do `label`,
`description`, `error` and `required`: the label and the error are linked to the editable text.
`maxLength` counts the text characters and stops typing and pasting at the limit.

Links accept `http(s):`, `mailto:` and relative URLs only: a
`javascript:` link is refused whether it is typed in the link field, typed as Markdown, pasted or
passed in `value`. The schema holds paragraphs, headings 2 and 3, lists, quotes, hard breaks and the
marks above; images, tables and anything else are dropped on paste. **That is the editor's
guarantee, not yours: sanitise the stored HTML again on the server before you render it elsewhere.**
The main entry never imports Tiptap: an app that does not use `/editor` ships none of it.

## Map

`MapView` draws places on a map: pins in the theme's colours with an icon or a number, a popup per
pin, groups of close pins as a counted circle, zoom buttons and a fit to the markers. It lives in
the `/map` entry and needs [MapLibre GL JS](https://maplibre.org) (BSD-3), an optional peer
dependency that only the apps using this entry install:

```bash
pnpm add maplibre-gl
```

MapLibre draws in a web worker. Since `maplibre-gl` 6, an app built with a bundler tells it where
the worker is, once, before the first map; without that the map stays empty. With Vite:

```ts
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setWorkerUrl(workerUrl);
```

MapLibre's [installation guide](https://maplibre.org/maplibre-gl-js/docs/#installation) gives the
line for webpack, Rollup, esbuild and Next.js, and the extra setting for server rendering.
`maplibre-gl` 5 needs none of this.

Load MapLibre's stylesheet once in the app, and import the component from `/map`:

```tsx
import { useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapMarkerList, MapView, type MapMarker } from '@sckyzo/cosmos-react/map';

const stores: MapMarker[] = [
  { id: 'harbour', label: 'Harbour', position: [4.81, 45.71], description: '12 quay street' },
  { id: 'station', label: 'Station', position: [4.9, 45.75], intent: 'success', icon: 3 },
];

export const Stores = () => {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      <MapMarkerList markers={stores} selectedId={selected} onSelect={setSelected} />
      <MapView
        markers={stores}
        style="https://tiles.example.com/styles/light.json"
        darkStyle="https://tiles.example.com/styles/dark.json"
        ariaLabel="Stores"
        selectedId={selected}
        onSelectedIdChange={setSelected}
      />
    </>
  );
};
```

- **The base map is yours.** Cosmos ships no tiles: a tile server has its own terms and sees every
  visitor. `style` is a MapLibre style (a URL or an object) and its attribution stays visible.
  `darkStyle` is optional: under the dark themes (`.dark`, `.deep-blue`) the map switches to it,
  and without it keeps `style`. Pass constants, not a new object on each render. A markers array
  is the same: define it once, or the pins are redrawn each time.
- **Pins, popups and buttons are React and HTML**, coloured by `intent` with the theme's classes,
  so a theme, accent or text size switch repaints them with no code. A title or description with
  markup shows as text.
- **`variant="static"`** is a fixed view for a card or a detail page: no gesture, no zoom buttons,
  no focus stop, no popup, and the pins are pictures.
- **Keyboard and screen readers.** The interactive map is one focus stop with the name given by
  `ariaLabel`: the arrow keys pan, `+` and `-` zoom. A map alone cannot be used with a screen
  reader, so show the same `markers` as a `MapMarkerList` next to it: choosing a row opens the
  popup on the map. On a static map, the list is the only way to the places.
- `cluster` (default on) groups close pins; a click on a group zooms in to split it. `fit` frames
  the markers on the first draw and when the set of markers changes; otherwise `initialCenter` and
  `initialZoom` give the view. `onViewChange` reports each pan or zoom.
- A browser without WebGL shows `unavailableMessage` in place of the map. The main entry never
  imports MapLibre: an app that does not use `/map` ships none of it. Imported without
  `maplibre-gl` installed, a map throws an error that names the package.

## Right to left

Set the native `dir` attribute on `<html>`, or on any ancestor of the components, and
they follow it. There is no prop and no `data-` attribute:

```html
<html lang="ar" dir="rtl"></html>
```

What mirrors is what follows the reading direction: the side an icon, a ribbon, a floating
panel or a status dot sits on, the padding and margins, the corners of a button group, a
chevron that points forward, the `start` and `end` alignments of panels. A prop that names
a side of the line takes `start` or `end`, never `left` or `right` (`Ribbon`'s
`position="top-end"`, `BackToTopFab`'s `position="bottom-end"`, `iconPosition="start"`,
`align="end"`), so the side swaps under `dir="rtl"`. `top` and `bottom` stay as they are.
Left to right renders as it always did.

Text that comes from you and sits inside a label or a sentence (a name, a value, a key) is
wrapped in `<bdi>`, so a Latin name in an Arabic page, or the reverse, keeps its own order
and does not drag the punctuation around it. The package's own copy stays in English, as it
is everywhere else. A Latin text cut short by an ellipsis in a right-to-left page (a long file
name in a narrow tile) shows its end rather than its beginning: the line ends on the left, where
Latin text starts.

A text field (`Input`, `SearchInput`, `Textarea`, the inputs of `Combobox`, `MultiSelect` and
`TagInput`) follows the direction of what is typed in it: Arabic aligns and flows right to
left, a URL left to right, each paragraph of a `Textarea` on its own. It does that with
`unicode-bidi: plaintext` rather than `dir="auto"`, which would also turn the field's own
direction around for a Latin text and leave the room reserved for a trailing icon or button
on the wrong side. A `PasswordInput` does the same once its value is shown; hidden, it keeps
the page's direction, as HTML leaves password fields out of `dir="auto"`, so how it aligns
says nothing of what is typed. A value that is a code reads left to right in any page: the cells of
`OtpInput`, the country button and number of `PhoneInput`, and the swatch and hex of
`ColorInput` are `dir="ltr"` islands. `Slider` and `Calendar` hand the direction to Radix and
react-day-picker, which lay out the handles and read the arrow keys from a `dir` prop and not
from the page.

Tailwind's `rtl:` variant (redefined by the theme to follow the nearest `dir`) is the tool
for what has no logical form, such as `rtl:-scale-x-100` on an arrow. In your own markup,
prefer the logical utilities (`ms-`, `pe-`, `text-start`, `border-s`, `rounded-e`, `inset-s-`)
to the physical ones.

A component draws the icon you pass it as it is. An icon that points along the line (a
forward arrow, a back chevron, undo) turns around through its own class:

```tsx
import { clsx } from 'clsx';
import { ArrowRight, type LucideProps } from 'lucide-react';

const Forward = ({ className, ...props }: LucideProps) => (
  <ArrowRight {...props} className={clsx(className, 'rtl:-scale-x-100')} />
);

<Button icon={Forward} iconPosition="end">
  Continue
</Button>;
```

Two things stay as they are on purpose. A chevron that points down, or turns over when a
panel opens (`Accordion`), and a trend arrow that points up or down, are not turned around.
And the arrow keys that move a card across a `KanbanBoard` follow where the columns are, not
the reading direction: with the first column on the right, ArrowLeft takes the card to the
next one.

The conversion lands group by group, following the groups of the Storybook sidebar. Done:
**Atoms**, **Actions**, **Forms** (apart from the rich text editor, which follows), **Data** and
**Lists**. The others still lay out for left to right and are the next ones in line: Feedback
and Overlays, Navigation and Layout, Chat, Tables and Settings, then Pages. In Storybook, the
**Direction** menu of the toolbar (`&globals=direction:rtl`) renders any story right to left.

## Themes and accents

The theme is a class on `<html>`; the accent, the font, the text size and the
density are the `data-accent`, `data-font`, `data-text-size` and `data-density`
attributes, see the
[theme README](../theme#themes--accents). `AppearanceSettings` renders a picker
for each, and `applyAppearance` sets them on the document:

```tsx
import { useEffect, useState } from 'react';
import { AppearanceSettings, applyAppearance, type CosmosAppearance } from '@sckyzo/cosmos-react';

function Appearance() {
  const [appearance, setAppearance] = useState<CosmosAppearance>({
    theme: 'light',
    accent: 'blue',
    font: 'outfit',
    textSize: 'md',
    density: 'default',
  });
  useEffect(() => applyAppearance(appearance), [appearance]);
  const update = (patch: Partial<CosmosAppearance>) => setAppearance((a) => ({ ...a, ...patch }));
  return (
    <AppearanceSettings
      {...appearance}
      onThemeChange={(theme) => update({ theme })}
      onAccentChange={(accent) => update({ accent })}
      onFontChange={(font) => update({ font })}
      onTextSizeChange={(textSize) => update({ textSize })}
      onDensityChange={(density) => update({ density })}
    />
  );
}
```

The font, text size and density groups show only when their handlers are set. Pass
`fonts` to offer only the fonts whose CSS the app imports
(`@sckyzo/cosmos-theme/fonts/<name>`).

For a top bar, `AppearanceMenu` takes the same props and puts the pickers in a
panel behind an icon button, for example in `Topbar`'s `endActions`. Set `onReset`
to add a Reset button under the groups.

To offer a **System** choice that follows the device's `prefers-color-scheme`,
add `COSMOS_SYSTEM_THEME` to the themes and apply again when the device switches
(it resolves to `light` or `dark`; set `systemThemes` for another pair). Nothing
changes for an app that doesn't opt in (`ThemeToggleTri` takes a `system` prop for the same
choice at the end of its cycle):

```tsx
const [appearance, setAppearance] = useState<CosmosAppearance>({ theme: 'system', accent: 'blue' });
useEffect(() => {
  applyAppearance(appearance);
  return appearance.theme === 'system'
    ? watchSystemTheme(() => applyAppearance(appearance))
    : undefined;
}, [appearance]);
// …
<AppearanceSettings {...appearance} themes={[COSMOS_SYSTEM_THEME, ...COSMOS_THEMES]} … />
```

Saving the choice (local storage, user profile) is left to the app.

Charts live in a separate package, [`@sckyzo/cosmos-charts`](../charts), so apps
that don't render charts don't ship a chart library.

## License

MIT — see [LICENSE](../../LICENSE).
