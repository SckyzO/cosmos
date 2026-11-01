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
