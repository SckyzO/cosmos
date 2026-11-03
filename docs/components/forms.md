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

## Messages under a field

Storybook: [Field errors](https://sckyzo.github.io/cosmos/?path=/docs/forms-field-errors--docs).

The line under a field (its `description`, `error` or `success` message) is the same piece in
`Input`, `Select`, `Combobox`, `MultiSelect`, `PhoneInput`, `ColorInput`, `DatePicker`,
`FileInput`, `TimePicker`, the card fields and the `CheckboxGroup` and `RadioGroup`. A message that
shows after the first render, such as an error after a submit, unfolds under the field in 200ms
instead of pushing the rest of the form down at once, and folds back and is removed when it clears.
A field that has its message from the first render simply has it, and an error that takes the place
of a description changes its text in place. How it is read does not change: it is the same element
with the same `id` and `aria-live`, in the accessibility tree and named by the field from the
render that shows it, and out of both from the render that hides it. `Textarea` keeps a line for
its message and counter, so its error shows in place and nothing moves.

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

Picking a range by hand takes two clicks. The first day starts it: `onChange` gets
`{ from, to: undefined }` and the calendar stays open. The second ends it, in order whichever day
comes first, and the calendar closes; the same day twice is a range of one day. Opened on a finished
range, a click starts another. Picking a preset does what picking its two days does: the range is
set, `onChange` is called with it and the calendar closes. The preset whose days are the current range is marked `aria-current` and
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

## Select

Storybook: [Select](https://sckyzo.github.io/cosmos/?path=/docs/forms-select--docs).

`Select` is a native `<select>`: `onChange` gets the native event, `ref` is the `<select>`, and a
form, a label and the platform's keyboard and phone picker work as they do for any select. The
closed field is drawn by Cosmos in every browser. The open list is the browser's:

- Where the browser can draw it from CSS (`appearance: base-select`, Chromium for now), the list
  takes the look of the `Combobox` list: the same panel, rows of `py-row-8 px-3` (36px at the
  default density), a check mark on the picked option, the accent under the pointer or the
  keyboard focus. Nothing changes for the closed field.
- Elsewhere, and in a phone's picker, the list is the system's own, native and unstyled by us: its
  rows are as tall as the platform makes them.
- For a list that looks the same in every browser, with typing to filter, descriptions or an icon on
  each option, use [`Combobox`](#combobox-with-typed-text).

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
- A field made wider than its content, by a width in `className` or by `fullWidth`, gives the room
  to the value: the arrows stay on the end edge (with `controls="sides"`, the buttons stay on both
  edges and the value is centred between them).
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
  your own data. `onChange` fires on every keystroke, a pick, a line added or a line removed. A pick
  from the catalogue is one call, with the label and the rate together.
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
- **Words.** `labels` replaces the texts of the editor itself, for another language: the column
  titles, the item placeholder, "Add line", the subtotal row, the empty state, and the functions
  that write the names of the fields, the title of a line, the remove buttons and the announcements.
  The two controls it borrows keep their English names: the toggle of the catalogue's combobox
  ("Toggle options") and the arrows of the quantity ("Increase", "Decrease").

There is no reordering of lines and no limit on their number.

## Permission grid

Storybook: [Permission Grid](https://sckyzo.github.io/cosmos/?path=/docs/forms-permission-grid--docs).

`PermissionGrid` is the editor of a role, or the matrix of roles against permissions: permissions
grouped by area down the side (`groups`), actions or roles across the top (`columns`), a checkbox in
each cell. It is the same grid either way, read in the other direction. The value is the list of
granted cells, each written `cellKey(rowId, columnId)` (the row id, a colon, the column id), with
`defaultValue` and `onChange(value)` as for every control.

Ids are how the grid tells things apart, so each must be unique: a row id across the whole grid
(not only inside its group), a group id among the groups, a column id among the columns. Two rows
with one id share their cells, and two groups with one id merge their box and their count. Build
the keys with `cellKey` rather than by hand: it escapes a colon or a backslash in a column id (and
a backslash in a row id) with a backslash, so `('a:b', 'c')` and `('a', 'b:c')` are two cells.
For any other id, a row id with colons such as `invoices:edit` included, the key is plain
`row:column`.

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
  box, and moving on takes the focus back to the column it came along. Nothing wraps. The focus goes to the box itself, so a screen reader announces its name and
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
rules. `score` is 0 to 4 (zxcvbn's scale): that many of the four slots of the bar fill, and the
level reads above them ("Password strength: Fair"). A slot grows in from the start edge when the
score reaches it, and the colour fades from one level to the next, over 300 ms; with reduced motion
each level shows at once. `labels` takes the words to translate:

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

## Card fields

> **Security.** Cosmos never handles real card data. A real checkout takes the card through its
> payment provider's hosted fields (iframes the provider serves), which keep the number off your
> app and out of its PCI scope. These fields are for demos, prototypes and providers that hand the
> values to your own code: the value sits in your page's state, so the page is in scope. They set no
> `name` attribute, so a plain form post never sends a card by accident, and they log and keep
> nothing.

Storybook: [Card Fields](https://sckyzo.github.io/cosmos/?path=/docs/forms-card-fields--docs).

`CardNumberInput`, `CardExpiryInput` and `CardCvcInput` are three fields that work alone (an "add a
card" page may only ask for a date) and take the usual field props: `label`, `description`,
`error`, `required`, `size`, `disabled`, `labelTrailing`, and the attributes of the `<input>` such as
`onBlur`. `className` goes on the wrapper. `CardFields` is an optional group around the three: a
`<fieldset>` with a shared `legend` and `error`, the number on its own line, the expiry and the code
in two equal columns (still two at 375px), and the brand handed from the number to the code through
context.

```tsx
<CardFields
  legend="Card details"
  value={card}
  onChange={setCard}
  errors={{ number: errors.number, expiry: errors.expiry, cvc: errors.cvc }}
  error="Your card was declined."
/>

<CardNumberInput label="Card number" value={number} onChange={setNumber} onBrandChange={setBrand} />
<CardExpiryInput label="Expiry date" value={expiry} onChange={setExpiry} />
<CardCvcInput label="Security code" brand={brand} value={cvc} onChange={setCvc} />
```

**Typing.** The number is grouped as it is typed, 4-4-4-4 and 4-6-5 for an Amex, and the caret stays
where it was after a digit typed or a number pasted in the middle; Backspace on the space between
two groups removes the digit before it. A pasted number with spaces or dashes is accepted, and
anything that is not a digit is dropped. The expiry shows `MM / YY`: a first digit from 2 to 9
becomes the month 02 to 09, and a pasted `12/2028` becomes `12 / 28`. The security code takes digits
only, 4 of them for an Amex and 3 for every other brand and while there is no brand; a code longer
than its brand allows is cut when the brand turns up. The `<input>`s carry `inputmode="numeric"` and
`autocomplete="cc-number"`, `cc-exp` and `cc-csc`, so browsers and password managers fill them.
Numbers, dates and codes read left to right in any page: each field is a `dir="ltr"` island, as
`PhoneInput` is, and its label and message keep the page's side.

**Brand.** The leading digits pick the brand: Visa, Mastercard, Amex, Discover, Diners Club, JCB or
UnionPay. Its name shows as text in a pill at the end of the number field (no logos, nothing to keep
up to date). `onBrandChange(brand)` reports it, with `null` once the digits no longer point to one.
A lone leading digit that several brands share gives `null` until the next ones tell them apart.

**Values.** `value`, `defaultValue` and `onChange(value)` carry digits only: the number as
`4111111111111111`, the expiry as `MMYY` (`'1228'`), the code as `123`. `CardFields` carries the
three as one `{ number, expiry, cvc }` (`CardValue`).

**Validation belongs to the page.** Unlike `PhoneInput`, the fields write no error message of their
own and never turn red by themselves: the page chooses when to check (on blur, on submit) and which
words to use, and passes the text as `error`. The checks come as pure helpers you can call anywhere:

- `cardBrand(number)` returns the brand or `null`.
- `cardNumberLengths(brand)` lists the lengths the brand issues (12 to 19 for `null`).
- `luhnValid(number)` is the checksum, which catches a mistyped digit and not a card that does not
  exist (some UnionPay numbers are issued without it).
- `expiryValid(expiry, today?)` is a real month that is not over, a card holding through the end of
  its month; pass `today` to test it.
- `cardCvcLength(brand)` is 4 for `'amex'` and 3 otherwise.

```tsx
const numberError = () => {
  const brand = cardBrand(number);
  if (!cardNumberLengths(brand).includes(number.length)) return 'The card number is incomplete.';
  if (!luhnValid(number)) return 'Check the card number.';
};

<CardNumberInput
  label="Card number"
  value={number}
  onChange={setNumber}
  onBlur={() => setErrors((e) => ({ ...e, number: number ? numberError() : undefined }))}
  error={errors.number}
/>;
```

`CardFields` takes `errors` (one message per field) and `error` for the whole card, under the three
fields and announced when it appears ("Your card was declined", a failed 3-D Secure check).
`labels` renames the three labels (`Card number`, `Expiry date`, `Security code`), and
`inputRefs` hands the three `<input>`s to the page, to focus the one a validation error names.

**Hosted fields.** A payment provider mounts its own field into a container you give it, so no
Cosmos component stands in for it. Keep the same layout: a `<fieldset>` and a `<legend>` as
`CardFields` draws, a label and a container per field styled like a Cosmos field (the height,
border and radius tokens, `h-ctrl-36` and `rounded-lg`), and the provider's SDK mounting into the
containers.

```tsx
<fieldset className="grid min-w-0 grid-cols-2 gap-4">
  <legend className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Card details</legend>
  <div className="col-span-2">
    <label htmlFor="card-number" className="mb-1.5 block text-sm font-medium">
      Card number
    </label>
    <div
      id="card-number"
      className="h-ctrl-36 rounded-lg border border-gray-200 px-3 dark:border-gray-700"
    />
  </div>
  {/* the expiry and the code, one column each */}
</fieldset>
```

## Calendar month

Storybook: [Calendar](https://sckyzo.github.io/cosmos/?path=/docs/forms-calendar--docs), [Date Picker](https://sckyzo.github.io/cosmos/?path=/docs/forms-date-picker--docs).

The month slides when it changes, in `Calendar` and so in `DatePicker`: react-day-picker's own
`animate` option is on, over `--cosmos-motion-base` (200ms) with the in-out easing, and the next
month comes in from the end of the line. Both are set inline on the root from the theme's tokens
(`--rdp-animation_duration`, `--rdp-animation_timing`), so `data-motion="reduced"` and the device's
`prefers-reduced-motion` take the length to 0. The month that leaves is a copy the library keeps
until the slide has played; it is inert, and with `captionLayout="dropdown"` its dropdowns are
hidden, so two sets never overlap. `<Calendar animate={false} />` turns the slide off.

## Segmented control, checkbox and radio

Storybook: [Segmented Control](https://sckyzo.github.io/cosmos/?path=/docs/forms-segmented-control--docs), [Checkbox](https://sckyzo.github.io/cosmos/?path=/docs/forms-checkbox--docs), [Radio](https://sckyzo.github.io/cosmos/?path=/docs/forms-radio--docs).

The accent fill of a `SegmentedControl` is one element that slides to the option you pick, in
200ms, easing in and out, along the line (so it follows the reading direction). It is measured
again when an option changes size, with the text size or a web font, and it is placed with no
transition the first time. Until it is measured (a server render) the selected option draws its own
fill. In a `Checkbox` and a `Radio` the check, the dash of the indeterminate state and the dot grow
from half their size as they fade in, in 120ms, and shrink back as they fade out.
