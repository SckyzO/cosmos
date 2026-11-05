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

`ProgressRing` is the same meter as an SVG ring (no dependency), drawn in the same colors as the
bar: `value`, `max`, `intent`, `size` (`sm` 32px, `md` 56px, `lg` 96px, or a number of pixels), `thickness`,
and `children` for the center (a value, an icon). It is a `progressbar` too, so name it
with `aria-label` or `aria-labelledby`; the center is not read a second time. `indeterminate`
spins a quarter arc, except under reduced motion.

```tsx
<ProgressRing aria-label="Course progress" value={68} intent="success">
  68%
</ProgressRing>
```

## Tooltip

Storybook: [Tooltip](https://sckyzo.github.io/cosmos/?path=/docs/feedback-tooltip--docs).

A `Tooltip` fades in over `--cosmos-motion-fast` (120ms) and out over `--cosmos-motion-exit` (80ms),
and slides 4px out from its trigger: it waits that far toward the trigger, on the side it opened
on as the screen sees it, so `start` and `end` mirror in right to left. It stays mounted while it
is hidden, since `aria-describedby` points at it.

## Cookie banner

Storybook: [Cookie Banner](https://sckyzo.github.io/cosmos/?path=/docs/feedback-cookie-banner--docs).

A `CookieBanner` rises in from the edge it is fixed to (the bottom, the top, or the bottom with a
1rem gap when `position="floating"`) as it fades in, over 200ms, and leaves the same way on
Accept or Deny, over 120ms. While it leaves it is `inert` and takes no clicks; it is removed at
once when nothing animates (reduced motion).
