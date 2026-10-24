# @sckyzo/cosmos-theme

[![npm](https://img.shields.io/npm/v/@sckyzo/cosmos-theme)](https://www.npmjs.com/package/@sckyzo/cosmos-theme)

Cosmos design tokens — CSS only.

Provides CSS files consumable by any framework:

| Import                              | Purpose                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `@sckyzo/cosmos-theme/tailwind`     | Tailwind 4 `@theme` block (palette, fonts, shadows, brand colors)              |
| `@sckyzo/cosmos-theme/vars`         | Universal CSS custom properties (bg, text, border, accent), themes and accents |
| `@sckyzo/cosmos-theme/fonts`        | `@fontsource` font imports (Outfit + JetBrains Mono)                           |
| `@sckyzo/cosmos-theme/fonts/<name>` | One variable font for `data-font`: `inter`, `plex`, `montserrat`, `open-sans`  |

## Usage

### With Tailwind 4 (recommended for React apps)

Import order matters: `tailwindcss` comes first, then the Cosmos tokens, then
the vars.

```css
/* src/index.css */
@import 'tailwindcss';
@import '@sckyzo/cosmos-theme/tailwind';
@import '@sckyzo/cosmos-theme/vars';
@import '@sckyzo/cosmos-theme/fonts';
```

Pairing this with `@sckyzo/cosmos-react`? You also need an `@source` line so
Tailwind scans the components — see the
[cosmos-react README](../react#set-up-the-styles).

### Without Tailwind (e.g. Docusaurus)

```css
@import '@sckyzo/cosmos-theme/fonts';
@import '@sckyzo/cosmos-theme/vars';
/* Then reference vars: var(--color-brand-500), var(--color-bg-base), etc. */
```

## Themes & accents

Two independent settings, both on the `<html>` element:

- **Theme**: one class, and only one at a time.

  | Theme       | Class        | Look                                         |
  | ----------- | ------------ | -------------------------------------------- |
  | `light`     | _(none)_     | Cool gray, the default                       |
  | `sand`      | `.sand`      | Warm beige light theme                       |
  | `dark`      | `.dark`      | Neutral black/gray, softened (no pure black) |
  | `deep-blue` | `.deep-blue` | Navy dark theme                              |

  `.dark` and `.deep-blue` both enable Tailwind's `dark:` variant.

- **Accent**: a `data-accent` attribute that swaps the whole `--color-brand-*`
  scale (and with it `--color-accent` and the focus ring). Leave it off for
  `blue`. The others are `indigo`, `violet`, `purple`, `rose`, `teal`, `cyan`,
  `graphite`, `red`, `orange`, `amber`, `green`.

```html
<html class="sand" data-accent="teal"></html>
```

`red`, `orange`, `amber` and `green` look like the status colors (error,
warning, success): a red primary button reads as a destructive action. Offer
them last in any picker, after the others.

Every theme × accent pair meets WCAG AA for body text, links and white text on
the accent. `pnpm --filter @sckyzo/cosmos-theme test` runs the contrast check
(`scripts/check-contrast.mjs`) against the CSS files.

## Focus indicator

Three Tailwind utilities, shipped with `@sckyzo/cosmos-theme/tailwind`, give
every control the same keyboard focus look: a **solid accent indicator** plus
the `--shadow-focus-ring` halo (12% of the accent). The halo alone is too faint
to count: the solid part is what reaches 3:1 against the surface (WCAG 1.4.11;
`brand-500` is checked on every theme × accent pair by `pnpm test`).

| Utility             | Paints                      | For                                                    |
| ------------------- | --------------------------- | ------------------------------------------------------ |
| `focus-indicator`   | 2px `brand-500` ring + halo | buttons, links, toggles, tabs, menu items, cards…      |
| `field-focus`       | `brand-500` border + halo   | text inputs, textarea, select and their wrappers       |
| `field-focus-error` | `red-500` border + red halo | the same fields in error (`--shadow-focus-ring-error`) |

They hold no state: put the variant that fits in front of them.

```html
<button class="focus-visible:focus-indicator">Save</button>
<input class="focus:field-focus border border-gray-200" />
<div class="focus-within:field-focus border border-gray-200"><input /></div>
<!-- a control drawn by a sibling of a visually hidden input -->
<input type="checkbox" class="peer sr-only" />
<span class="peer-focus-visible:focus-indicator"></span>
```

There is no ring offset. Add `ring-inset` where an ancestor clips with
`overflow-hidden`, or a neighbour covers the outer ring. The utilities use
`outline-hidden`, so the indicator survives forced-colors mode, where box
shadows are not painted.

## Fonts & text size

Two more settings on `<html>`, both optional:

- **Font**: a `data-font` attribute that swaps `--font-sans`. Leave it off for
  Outfit. The others are `inter`, `plex` (IBM Plex Sans), `montserrat`,
  `open-sans`, and `system`, the platform's UI font. Each one loads from its own
  subpath, so import only the fonts you offer; `system` loads nothing. The mono
  font stays JetBrains Mono.

  ```css
  @import '@sckyzo/cosmos-theme/fonts'; /* Outfit + JetBrains Mono */
  @import '@sckyzo/cosmos-theme/fonts/inter';
  ```

- **Text size**: a `data-text-size` attribute, `sm`, `lg` or `xl`, that scales
  every `text-*` size to 93.75%, 112.5% or 125%. Leave it off for 100%. Only the
  text grows: spacing keeps its `rem` values, so layouts keep their density.
  Sizes written in pixels, such as `text-[13px]`, don't scale; the `text-*`
  scale includes `text-2xs` (11px) and `text-3xs` (10px) for small labels.

```html
<html class="sand" data-accent="teal" data-font="inter" data-text-size="lg"></html>
```

Both attributes also work on an element below `<html>`, for one part of a page.

## Tokens

See [`css/tailwind-tokens.css`](css/tailwind-tokens.css) for the full source.

Categories:

- **Brand palette** : `--color-brand-25` to `--color-brand-950`
- **Semantic colors** : `--color-success-*`, `--color-error-*`, `--color-warning-*`
- **Status** : `--color-status-{ok,warn,crit,unknown}`
- **Typography** : `--font-sans` (Outfit), `--font-mono` (JetBrains Mono), `--text-2xs` (11px), `--text-3xs` (10px)
- **Shadows** : `--shadow-card`, `--shadow-card-hover`, `--shadow-focus-ring` and `--shadow-focus-ring-error` (the focus halos)
- **Layout vars** (theme-aware): `--color-bg-{base,panel,elevated}`, `--color-text-{base,primary,secondary,muted}`, `--color-border`, `--color-accent`
- **Code highlighting** (theme-aware): `--color-code-foreground` and `--color-code-token-*` (keyword, string, comment, constant, function, parameter, string-expression, punctuation, link, inserted, deleted, changed). The names match Shiki's CSS variables theme with `variablePrefix: '--color-code-'`. Each one keeps 4.5:1 on CodeBlock's background in all four themes (checked by `pnpm test`).

## License

MIT — see [LICENSE](../../LICENSE).
