# Forms

Storybook group: Forms. The text fields, selects and pickers are documented in Storybook; this page holds the ones that need more than their props. The rich text editor is in [Optional entries](../guides/optional-entries.md#editor).

## Slider

Storybook: [Slider](https://sckyzo.github.io/cosmos/?path=/docs/forms-slider--docs).

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

## Color and phone fields

Storybook: [Color Input](https://sckyzo.github.io/cosmos/?path=/docs/forms-color-input--docs), [Phone Input](https://sckyzo.github.io/cosmos/?path=/docs/forms-phone-input--docs).

`ColorInput` picks a color from named swatches (a radio group, arrows move between them) or a hex
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

## Permission grid

Storybook: [Permission Grid](https://sckyzo.github.io/cosmos/?path=/docs/forms-permission-grid--docs).

`PermissionGrid` is the editor of a role, or the matrix of roles against permissions: permissions
grouped by area down the side (`groups`), actions or roles across the top (`columns`), a checkbox in
each cell. It is the same grid either way, read in the other direction. The value is the list of
granted cells, each written `cellKey(rowId, columnId)` (the row id, a colon, the column id), with
`defaultValue` and `onChange(value)` as for every control.

```tsx
const columns = [
  { id: 'admin', label: 'Admin', readOnly: true }, // built in: shown, not editable
  { id: 'editor', label: 'Editor' },
  { id: 'viewer', label: 'Viewer' },
];
const groups = [
  {
    id: 'invoices',
    label: 'Invoices',
    rows: [
      { id: 'invoices.view', label: 'View invoices' },
      { id: 'invoices.edit', label: 'Edit invoices', columns: ['admin', 'editor'] }, // not for viewers
    ],
  },
];

<PermissionGrid
  ariaLabel="Permissions by role"
  groups={groups}
  columns={columns}
  defaultValue={[cellKey('invoices.view', 'admin'), cellKey('invoices.edit', 'admin')]}
  onChange={(granted) => setRole({ ...role, granted })}
  error={granted.length === 0 ? 'Grant at least one permission' : undefined}
/>;
```

- **Select all.** Each row has a box in the first column, each column one in its header, each
  group one in its header row, and the corner holds one for the whole grid. A box shows the dash
  (`indeterminate`) when it covers some granted cells and not all. A click on a mixed box grants
  everything it covers, and the next click clears it.
- **Not applicable and read-only.** A row's `columns` lists the columns it applies to; the others
  are empty cells that no one can grant. A column with `readOnly` (a built-in role), or the whole
  grid with `readOnly`, shows what is granted as an icon, with a text for the screen reader
  ("Edit invoices, Admin: granted, read-only") instead of a disabled checkbox. Both are left out of
  every box and of every count, and the keys they hold in `value` are kept as they are. A box with
  nothing left to change is not drawn.
- **Names.** Each cell's checkbox is named by its row and its column ("Edit invoices, Admin"), the
  boxes of a row, a column or a group "Select all for <name>". `labels` replaces these, the header
  of the first column (`rowHeader`, "Permission" by default), the read-only texts and the message
  below, for another language.
- **Keyboard.** The grid is a `role="grid"`, an ARIA grid, not a table of checkboxes: it takes one
  Tab stop, and the arrow keys move between cells (Left and Right follow the reading direction),
  Home and End go to the ends of the row, Ctrl+Home and Ctrl+End to the ends of the grid, and Space
  toggles the box in focus. A group's header row has one cell, so moving down onto it lands on its
  box. Nothing wraps. The focus goes to the box itself, so a screen reader announces its name and
  state; a read-only or empty cell takes the focus itself. The whole cell is the click target, not
  only the 18px box.
- **Announcements.** After a box that grants or clears several cells, a polite status says how many
  permissions are granted ("8 of 26 permissions granted"), out of the cells a user can change. A
  single cell says nothing: the screen reader already announces the box that changed.
- **Narrow screens.** The grid scrolls sideways inside its own frame and the page does not. The
  header row and the first column stay in view, and the keyboard scrolls the focused cell clear of
  them. `maxHeight` makes the grid scroll vertically too, keeping the header row visible; there is
  no list layout.
- **Error.** `error` is written under the grid, outlines it, and is the grid's description
  (`aria-describedby`), so a screen reader reads it with the grid.

Groups are always open: they do not collapse.
