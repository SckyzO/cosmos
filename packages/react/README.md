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
fades, and `stickyFirstColumn` pins its first column (after the checkbox on
`DataTable`). `TableIdentityCell`, `TableIdCell`, `TableDescriptionCell` and
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

`DataTable`'s `density` is controllable like the rest: `density`, `defaultDensity`
and `onDensityChange(density)`. As with `pageSize`, a `density` passed without
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
- Every row has one fixed height, from `density`: 49px, or 61px when
  `comfortable`, at the default text size. Content taller than that is clipped,
  so keep a cell to a line of text or a control, as in a standard row. A larger
  text size makes standard rows taller than the window counts, and clips them.
- It applies to the table layout only: with `mobileLayout="cards"` below `sm`
  the cards keep the pagination.
- It is not for expandable rows.
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

`Table` takes `density` (`default` or `comfortable`, as on `DataTable`),
`striped`, `stickyHeader` (give the wrapper a height with
`containerClassName`, e.g. `max-h-80`) and `stickyFirstColumn`. While data
loads, `TableSkeletonRows` fills the `TableBody` under the header row. Cells take `align` and `numeric`
(right-aligned, tabular figures). `TableHeaderCell` sets `scope` to `col` in the
head and `row` elsewhere. The wrapper scrolls horizontally, so a wide table
stays inside the page on small screens.

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
your own, the Topbar's `leftActions`, the Sidebar's `footer`) with no props: it
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

## Themes and accents

The theme is a class on `<html>`; the accent, the font and the text size are
the `data-accent`, `data-font` and `data-text-size` attributes, see the
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
    />
  );
}
```

The font and text size groups show only when their handlers are set. Pass
`fonts` to offer only the fonts whose CSS the app imports
(`@sckyzo/cosmos-theme/fonts/<name>`).

For a top bar, `AppearanceMenu` takes the same props and puts the pickers in a
panel behind an icon button, for example in `Topbar`'s `rightActions`. Set `onReset`
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
