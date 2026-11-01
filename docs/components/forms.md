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

## Password strength

Storybook: [Password Strength Meter](https://sckyzo.github.io/cosmos/?path=/docs/forms-password-strength-meter--docs), [Password Policy Checker](https://sckyzo.github.io/cosmos/?path=/docs/forms-password-policy-checker--docs).

`PasswordPolicyChecker` lists the rules a password must meet, each with a tick or a cross; a screen
reader also hears "met" or "not met" after each label (`labels` translates both words).
`PasswordStrengthMeter` is the other half: how strong the password is, not whether it follows the
rules. `score` is 0 to 4 (zxcvbn's scale): that many of its four segments light up, and the level
reads below them ("Password strength: Fair"). `labels` takes the words to translate:

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

Cosmos bundles no estimator, so it adds no weight to a page that does not need one. This one has no
dependency and suits a page that wants a first version: it counts at most two characters for each
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
