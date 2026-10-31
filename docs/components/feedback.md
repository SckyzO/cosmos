# Feedback

Storybook group: Feedback.

## Progress

Storybook: [Progress Bar](https://sckyzo.github.io/cosmos/?path=/docs/feedback-progress-bar--docs), [Progress Ring](https://sckyzo.github.io/cosmos/?path=/docs/feedback-progress-ring--docs).

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
and `children` for the center (a value, an icon). It is a `progressbar` too, so name it
with `aria-label` or `aria-labelledby`; the center is not read a second time. `indeterminate`
spins a quarter arc, except under reduced motion.

```tsx
<ProgressRing aria-label="Course progress" value={68} intent="success">
  68%
</ProgressRing>
```
