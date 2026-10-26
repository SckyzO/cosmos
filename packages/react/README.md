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
`swipeToClose`.

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
