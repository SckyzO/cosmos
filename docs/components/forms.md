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
not on the page leaves the link to the browser, which follows `#field`. An empty list draws
nothing, so the summary can stay in the markup. `title` defaults to "There is a problem". It is an
`AlertBanner` in `danger`, so it is announced as it appears. The sentence around the links ("Fix 3
fields and try again: … need attention.") is English.

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
`toDate` is disabled.

`today` is the date the presets count from, and the one the calendar marks as today; it defaults to
now. Pass a fixed date in a test, so the days a preset makes do not depend on the day it runs. The
presets are a column at the end of the calendar from `sm` up, and wrap under it below `sm`; they come
after the calendar in the tab order at both widths.

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
