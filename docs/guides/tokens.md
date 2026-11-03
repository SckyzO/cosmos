# Tokens and focus

What `@sckyzo/cosmos-theme/tailwind` and `/vars` give your own markup: the design tokens and the
focus utilities. The source is [`css/tailwind-tokens.css`](../../packages/theme/css/tailwind-tokens.css)
and [`css/css-vars.css`](../../packages/theme/css/css-vars.css).

## Tokens

The brand palette, the status colors and the semantic colors are always in the CSS (`@theme
static`): Tailwind only emits a theme variable that a utility uses, and the charts read these as
plain `var(--color-…)`.

- **Brand palette**: `--color-brand-25` to `--color-brand-950`
- **Chart series**: `--color-chart-2` to `--color-chart-8`, the series colors after the accent
  (the first series is `--color-brand-500`). Each accent lists its own seven, skipping the hues
  that look like it
- **Semantic colors**: `--color-success-*`, `--color-error-*`, `--color-warning-*`
- **Status**: `--color-status-{ok,warn,crit,unknown}`
- **Typography**: `--font-sans` (Outfit), `--font-mono` (JetBrains Mono), `--text-2xs` (11px),
  `--text-3xs` (10px)
- **Shadows**: `--shadow-card`, `--shadow-card-hover`, `--shadow-focus-ring` and
  `--shadow-focus-ring-error` (the focus halos)
- **Layout vars** (theme-aware): `--color-bg-{base,panel,elevated}`,
  `--color-text-{base,primary,secondary,muted}`, `--color-border`, `--color-accent`
- **Code highlighting** (theme-aware): `--color-code-foreground` and `--color-code-token-*`
  (keyword, string, comment, constant, function, parameter, string-expression, punctuation, link,
  inserted, deleted, changed). The names match Shiki's CSS variables theme with
  `variablePrefix: '--color-code-'`. Each one keeps 4.5:1 on CodeBlock's background in all four
  themes (checked by the theme package's contrast check).
- **Density and radius**: `--spacing-ctrl-*`, `--spacing-row-*`, `--spacing-cell-*` and the
  `--radius-*` scale, see [Appearance](appearance.md#density).
- **Scrim** (theme-aware): `--color-scrim-{dim,blur,blur-dark}`, the veil behind a window, see
  [Scrims](#scrims).
- **Motion**: `--cosmos-motion-*` durations and `--cosmos-ease-*` easings, see [Motion](#motion).

Accent-colored **text** (links, active labels) is `text-brand-600 dark:text-brand-400`, never
`text-brand-500`: brand-500 text drops under 4.5:1 on the sand theme. `bg-`, `border-` and
`ring-brand-500` are fine.

## Focus indicator

Four Tailwind utilities, shipped with `@sckyzo/cosmos-theme/tailwind`, give every control the same
keyboard focus look: a solid accent indicator plus the `--shadow-focus-ring` halo (12% of the
accent). The halo alone is too faint to count: the solid part is what reaches 3:1 against the
surface (WCAG 1.4.11; `brand-500` is checked on every theme and accent pair by the theme package's contrast check).

| Utility                     | Paints                      | For                                                                   |
| --------------------------- | --------------------------- | --------------------------------------------------------------------- |
| `focus-indicator`           | 2px `brand-500` ring + halo | buttons, links, toggles, tabs, menu items, cards…                     |
| `field-focus`               | `brand-500` border + halo   | text inputs, textarea, select and their wrappers                      |
| `field-focus-error`         | `red-500` border + red halo | the same fields in error (`--shadow-focus-ring-error`)                |
| `focus-indicator-on-accent` | 2px white ring, no halo     | a control filled with `brand-500`, where the accent ring would vanish |

They hold no state: put the variant that fits in front of them.

```html
<button class="focus-visible:focus-indicator">Save</button>
<input class="focus:field-focus border border-gray-200" />
<div class="focus-within:field-focus border border-gray-200"><input /></div>
<!-- a control drawn by a sibling of a visually hidden input -->
<input type="checkbox" class="peer sr-only" />
<span class="peer-focus-visible:focus-indicator"></span>
```

There is no ring offset. Add `ring-inset` where an ancestor clips with `overflow-hidden`, or a
neighbor covers the outer ring. The utilities use `outline-hidden`, so the indicator survives
forced-colors mode, where box shadows are not painted.

## Motion

Every animation of a component reads one set of durations and easings, declared once on `<html>`,
so your own markup can move at the same pace:

| Token                     | Value | A component uses it for                                 |
| ------------------------- | ----- | ------------------------------------------------------- |
| `--cosmos-motion-fast`    | 120ms | a floating panel coming in, a check, an icon that swaps |
| `--cosmos-motion-exit`    | 80ms  | a floating panel leaving                                |
| `--cosmos-motion-exit-lg` | 120ms | a window leaving (`Modal`, the scrim, `Lightbox`)       |
| `--cosmos-motion-base`    | 200ms | a window coming in, a fold, an indicator that slides    |
| `--cosmos-motion-slow`    | 300ms | the sidebar's width, the `Drawer` sliding in            |
| `--cosmos-ease-out`       |       | `cubic-bezier(0.2, 0, 0, 1)`, for what comes in         |
| `--cosmos-ease-in`        |       | `cubic-bezier(0.4, 0, 1, 1)`, for what leaves           |
| `--cosmos-ease-in-out`    |       | `cubic-bezier(0.4, 0, 0.2, 1)`, for what moves          |

Read them as utilities: `transition-opacity duration-(--cosmos-motion-base)
ease-(--cosmos-ease-out)`, never a millisecond value of your own. The durations read 0ms under
`prefers-reduced-motion` and under `data-motion="reduced"` on `<html>`
([Appearance](appearance.md#animations)), so an element built on them stops moving with the rest.

A panel that leaves is an element whose classes turn to the closed look; it has to stay on screen
until that transition ends. `@starting-style` (Tailwind's `starting:` variant) gives an entrance
with no script: `opacity-100 starting:opacity-0` fades an element in the first time it is drawn.

## Scrims

`Backdrop` is the one veil behind every window, and its `variant` picks the look: `dim` (the
default, the colour alone, the cheapest on a large page), `blur` (an 8px blur under a light
veil, the page stays recognisable) or `blur-dark` (the same blur under a dark veil). The colour
of each is a variable of the theme, set again by each of the four themes:
`--color-scrim-dim`, `--color-scrim-blur` and `--color-scrim-blur-dark`.

`Modal`, `Modal.Alert`, `ConfirmationModal`, `HelpOverlay`, `Drawer`, `CommandPalette` and
`Customizer` take the same three values as `backdrop`, and `Shell` as `drawerBackdrop` for its
mobile drawer. An app picks it window by window; there is no global switch. `Lightbox` keeps its
own near-black surface in every theme.

```tsx
<Modal open={open} onClose={close} backdrop="blur">
  …
</Modal>
```

## Variants

The theme redefines four Tailwind variants:

- `dark:` is on for the `dark` and `deep-blue` themes. It has zero specificity (`:where()`), so
  `focus:` and `hover:` classes still win over a plain `dark:` class: add `dark:hover:` or
  `dark:focus:` when a state needs its own dark color.
- `rtl:` follows the nearest `dir` attribute: [Right to left](right-to-left.md).
- `motion-safe:` and `motion-reduce:` follow `data-motion="reduced"` on `<html>` as well as the
  device's `prefers-reduced-motion`. Put a loop that only decorates behind `motion-safe:` or take
  it off with `motion-reduce:animate-none`; keep a spinner running.
