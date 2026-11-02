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

## Error summary

Storybook: [Error Summary](https://sckyzo.github.io/cosmos/?path=/docs/forms-error-summary--docs). The whole screen is in [Examples/Settings](https://sckyzo.github.io/cosmos/?path=/story/examples-settings--load-error).

`ErrorSummary` is the banner a form shows above its fields when it could not be submitted: how many
fields need attention, and a link to each. Each link moves the focus to its field and brings it
to the middle of the view, so a keyboard or screen reader user lands on the field to fix without
scrolling for it. Draw each field's own message under the field (`error` on `Input`, `Select`…):
the summary names the fields, it does not repeat the messages.

`errors` is one `{ field, label }` per field in error, in the order of the page. `field` is the
`id` of the field or of any box around it: the link focuses the field if that is the `id` of the
input, else the first enabled input, select, textarea or button inside the box. A `field` that is
not on the page leaves the link to the browser, which follows `#field`. Entries that name the same
field each keep their link. An empty list draws nothing, so the summary can stay in the markup. `title` defaults to "There is a problem". It is an
`AlertBanner` in `danger`, so it is announced as it appears.

```tsx
<ErrorSummary
  title="We couldn’t save your changes"
  errors={[
    { field: 'name', label: 'Organisation name' },
    { field: 'booking-url', label: 'Booking URL' },
  ]}
/>
<Input id="name" label="Organisation name" error="Enter a name." />
<Input id="booking-url" label="Booking URL" error="That address is taken." />
```

The sentence around the links ("Fix 3 fields and try again: … need attention.") is English by
default. `message` writes it for another language or another wording: a function of the number of
fields and the array of links, one per entry, in order, that returns the sentence. It owns the words
that depend on the count ("field" and "fields", "needs" and "need") and how the links are joined.

```tsx
<ErrorSummary
  title="Nous n’avons pas pu enregistrer"
  errors={errors}
  message={(count, links) => (
    <>
      Corrigez {count} {count === 1 ? 'champ' : 'champs'} :{' '}
      {links.map((link, i) => (
        <Fragment key={i}>
          {i > 0 && (i === links.length - 1 ? ' et ' : ', ')}
          {link}
        </Fragment>
      ))}
      .
    </>
  )}
/>
```

## Date range presets

Storybook: [Date Picker](https://sckyzo.github.io/cosmos/?path=/docs/forms-date-picker--docs).

`DatePicker mode="range"` takes `presets`: buttons next to the calendar that set the whole range in
one click ("Last 7 days", "This month"). Each is a `label` and a `range`, which is either a fixed
`{ from, to }` or a function of today that makes the range when the picker draws:

```tsx
const presets: DateRangePreset[] = [
  { label: 'Last 7 days', range: (today) => ({ from: subDays(today, 6), to: today }) },
  { label: 'This month', range: (today) => ({ from: startOfMonth(today), to: endOfMonth(today) }) },
  { label: 'First quarter', range: { from: new Date(2026, 0, 1), to: new Date(2026, 2, 31) } },
];

<DatePicker
  mode="range"
  label="Report period"
  presets={presets}
  value={range}
  onChange={setRange}
/>;
```

Picking a preset does what picking its two days does: the range is set, `onChange` is called with
it and the calendar closes. The preset whose days are the current range is marked `aria-current` and
tinted, so reopening the calendar shows which one is on. A preset that falls outside `fromDate` or
`toDate` is disabled. The group of presets is named "Date range presets" for a screen reader;
`presetsLabel` replaces it, for a page in another language.

`today` is the date the presets count from, and the one the calendar marks as today; it defaults to
now. A preset gets it at the start of its day, as a day picked in the calendar is, so `to: today`
covers that whole day for a host that filters on `<= to`. Pass a fixed date in a test, so the days a
preset makes do not depend on the day it runs. The presets are a column at the end of the calendar
from `sm` up, and wrap under it below `sm`; they come after the calendar in the tab order at both
widths.

## Combobox with typed text

Storybook: [Combobox](https://sckyzo.github.io/cosmos/?path=/docs/forms-combobox--docs).

`Combobox` picks one of its `options`: the text typed only filters the list, and when focus leaves
the field goes back to the option selected. `allowCustomValue` makes the text the value instead, for
a field that suggests (a catalogue, a list of tags) and lets the user write their own entry.

```tsx
<Combobox
  label="Item"
  allowCustomValue
  value={item}
  onChange={setItem}
  onSelect={(option) => setRate(RATES[option.value])}
  options={catalogue}
  placeholder="Select or type an item"
/>
```

- `value` is an option's `value` or the text itself, and `onChange(value)` fires on every keystroke,
  as an `Input`'s does. A text equal to the `value` of an option names that option: keep the values
  of the options (SKUs, ids) out of what people type, or use the labels as values.
- `onSelect(option)` fires when the user picks an option (a click, or Enter on the active one) and
  never for typed text. It is how a host fills what depends on the pick, such as a price.
- Nothing is active until an arrow key moves there, so Enter keeps the text instead of taking the
  first match. With no option active, Enter closes the list and goes on to submit the form around
  the field; with one active, it picks it and the form stays put.
- When no option matches, the list stays closed: the text is accepted. `emptyMessage` opens it with
  that message ("Press Enter to use this text").
- Without a visible `label`, `aria-label` names the input, as for a field in a row of lines. A
  `label` wins: the name is the one on screen.

## Number input

Storybook: [Number Input](https://sckyzo.github.io/cosmos/?path=/docs/forms-number-input--docs).

`NumberInput` writes a number between `min` and `max` with step buttons, `−` / `+` on the edges or
stacked arrows (`controls="stacked"`). `unit` follows the value, inside the border, and `prefix`
comes before it: a currency sign, a protocol.

```tsx
<NumberInput
  aria-label="Rate"
  controls="stacked"
  prefix="$"
  unit="/h"
  value={rate}
  onChange={setRate}
  min={0}
/>
```

- `prefix` takes text or a node. It sits on the start edge of the value (the right one in right to
  left, in a `<bdi>` of its own), small and dimmed like `unit`. It is part of neither the value nor
  the accessible name: name the field with `aria-label` or a `FormRow`.
- `error` marks the field invalid: a red border and `aria-invalid`. It carries no message, a
  `NumberInput` having no text of its own: write it under the field and point `aria-describedby` at
  it (a `FormRow` does the same with its description).
- `controls="none"` draws the field alone, start-aligned like the stacked layout, for a price or an
  amount where a step of one means nothing. The arrow keys of the field still step by `step`.

## Line items editor

Storybook: [Line Items Editor](https://sckyzo.github.io/cosmos/?path=/docs/forms-line-items-editor--docs).

`LineItemsEditor` is the list of lines of a new invoice or order: an item, a quantity, a rate and the
amount worked out from them, with lines added and removed and the subtotal under them. It adds up
what the user types and nothing else: tax, discounts and shipping are the page's.

```tsx
const [lines, setLines] = useState<LineItem[]>([]);

<LineItemsEditor
  aria-label="Invoice items"
  currency="USD"
  locale="en-US"
  value={lines}
  onChange={setLines}
  catalogue={[
    { label: 'Landing page design', rate: 950 },
    { label: 'Copy editing (per page)', rate: 45 },
  ]}
  error={submitted && lines.length === 0 ? 'Add at least one line.' : undefined}
  footer={({ subtotal }) => (
    <>
      <Totals.Row label="Tax (20%)" value={subtotal * 0.2} />
      <Totals.Total label="Total due" value={subtotal * 1.2} />
    </>
  )}
/>;
```

- **Value.** A line is `{ id, item, quantity, rate }`, the rate in units of the currency (`24.5`, not
  2450 cents). `value`, `defaultValue` and `onChange(lines, { subtotal })` follow the usual
  controlled and uncontrolled pair; only `undefined` means uncontrolled. The editor starts with no
  line (`defaultValue` to change that) and gives an `id` to every line it adds: use it as the key of
  your own data. `onChange` fires on every keystroke, a pick, a line added or a line removed.
- **Layout.** From 42rem of its own width (a container query, so a card beside a summary switches on
  its own width, not the window's) the lines are a grid with the amounts aligned in a column, and
  the titles are drawn once above it. Narrower, each line is a card with the titles of its fields in
  view, the item on the full width, the quantity and the rate side by side, and "Add line" as wide
  as the editor. Every field has a name of its own, "Quantity, line 2".
- **Item.** A plain text field, or, with a `catalogue` of `{ label, rate }`, a `Combobox` that also
  takes what the user types (`allowCustomValue`). Picking an entry copies its rate to the line;
  typing, even the whole label of an entry, never does. The list shows each rate written for the
  currency. With a catalogue, the combobox toggle is one more Tab stop per line.
- **Quantity and rate.** The quantity is a `NumberInput` with its arrows, at least 1 and in steps of
  1; `quantity={{ min: 0.5, step: 0.5 }}` for hours. The rate is a `NumberInput` with no buttons and
  the sign of the currency in front, from 0 and in steps of the smallest unit of the currency (a
  browser checking the form around it refuses a rate with more decimals than the currency has).
- **Amounts and rounding.** Each line is quantity times rate, rounded to the smallest unit of the
  currency as `Intl.NumberFormat` knows it (2 decimals for USD, none for JPY, a half rounds up as it
  reads in decimal), then the amounts shown are added: the subtotal is always the sum of the rows.
  Without a `currency` the figures are plain numbers, up to three decimals.
  `summarizeLineItems(lines, { currency, locale })` gives the same `{ subtotal }` for lines you hold
  from elsewhere, such as a draft loaded from a server.
- **Totals.** Under the lines the editor draws a `Totals` block with the subtotal, hidden while there
  are no lines. `footer` receives `{ subtotal }` and returns the rows that follow it (`Totals.Row`,
  `Totals.Total`, `Totals.Note`), written with the editor's currency and locale. `footer={false}`
  draws no block, for a page that shows the summary in a card of its own and reads the subtotal from
  `onChange`.
- **Errors.** `errors` is keyed by line `id`, each with an `item`, `quantity` or `rate` message under
  its cell; the cell is marked `aria-invalid` and described by it. `error` is a message for the
  editor as a whole ("Add at least one line."), described by the editor and by "Add line", the one
  button that can fix it. With no line, an empty state offers that button.
- **Keyboard.** Tab goes through the item, the quantity, the rate and the remove button of each
  line, then "Add line". Enter in a field does what it does without the editor: it submits the form
  around it, or picks the option of the list; it never adds a line. A removed line hands the focus
  to the remove button of the line that took its place, the one of the new last line when the last
  line is removed, or "Add line" when none is left (never into a field, which would open the list of
  a catalogue), so the same key removes the next line. A new line takes the focus in its item field.
- **Announcements.** A polite status says "Line 3 added. 3 lines." and "Line 2 removed. 2 lines
  left. Subtotal $1,900.00." and, when a cell is committed (focus leaves it, or Enter) and the
  subtotal changed, "Subtotal $1,900.00". Nothing is said on a keystroke.
- **Read only.** `readOnly` shows the lines as text, with no field, no "Add line" and no remove
  button, in the same grid and cards, for a sent invoice.
- **Words.** `labels` replaces every text, including the functions that write the names of the fields
  and the announcements, for another language.

There is no reordering of lines and no limit on their number.

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

## Password strength

Storybook: [Password Strength Meter](https://sckyzo.github.io/cosmos/?path=/docs/forms-password-strength-meter--docs), [Password Policy Checker](https://sckyzo.github.io/cosmos/?path=/docs/forms-password-policy-checker--docs).

`PasswordPolicyChecker` lists the rules a password must meet, each with a tick or a cross; a screen
reader also hears "met" or "not met" after each label (`labels` translates both words).
`PasswordStrengthMeter` is the other half: how strong the password is, not whether it follows the
rules. `score` is 0 to 4 (zxcvbn's scale): that many of the four segments of a `ProgressBar` light
up, and the level reads above them ("Password strength: Fair"). `labels` takes the words to
translate:

```tsx
<PasswordStrengthMeter
  score={2}
  labels={{ name: 'Robustesse', levels: ['Très faible', 'Faible', 'Moyen', 'Bon', 'Fort'] }}
/>
```

The bar is decoration (`aria-hidden`). The visible text is what a screen reader reads when the field
takes focus, if you point the field at it: give the meter an `id` and pass it as the field's
`aria-describedby`, which `Input` adds to its own description. A hidden polite status announces a
new level once the score has held for 800 ms, so nobody is read to on every key, and says nothing
when the meter first shows.

```tsx
const meterId = useId();

<PasswordInput
  label="New password"
  autoComplete="new-password"
  aria-describedby={meterId}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
<PasswordStrengthMeter id={meterId} score={estimate(password)} />
```

Cosmos bundles no estimator, so it adds no weight to a page that does not need one.
`NewPasswordForm` and `SignUpForm` take one as `strength` (see [Auth forms](layout.md#auth-forms)).
This one has no dependency and suits a page that wants a first version: it counts at most two characters for each
distinct one, steps up at 8, 12, 16 and 20 of them, and moves one step for the kinds of character
used.

```ts
const estimate = (password: string): number => {
  const useful = Math.min(password.length, 2 * new Set(password).size);
  const base = useful < 8 ? 0 : Math.min(4, 1 + Math.floor((useful - 8) / 4));
  if (base === 0) return 0;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((c) => c.test(password)).length;
  return Math.max(0, Math.min(4, base + (classes >= 3 ? 1 : classes === 1 ? -1 : 0)));
};
```

For a real app, use [zxcvbn-ts](https://zxcvbn-ts.github.io/zxcvbn/): it knows common passwords,
keyboard patterns and dates. Its dictionaries are large, so load them with `import()` when the
password field appears, and keep a score of 0 until they are in:

```tsx
const [zxcvbn, setZxcvbn] = useState<ZxcvbnFactory | null>(null);
useEffect(() => {
  void (async () => {
    const [{ ZxcvbnFactory }, common, en] = await Promise.all([
      import('@zxcvbn-ts/core'),
      import('@zxcvbn-ts/language-common'),
      import('@zxcvbn-ts/language-en'),
    ]);
    setZxcvbn(
      new ZxcvbnFactory({
        translations: en.translations,
        graphs: common.adjacencyGraphs,
        dictionary: { ...common.dictionary, ...en.dictionary },
      })
    );
  })();
}, []);

const score = zxcvbn ? zxcvbn.check(password).score : 0;
```
