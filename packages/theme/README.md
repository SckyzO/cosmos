# @sckyzo/cosmos-theme

[![npm](https://img.shields.io/npm/v/@sckyzo/cosmos-theme)](https://www.npmjs.com/package/@sckyzo/cosmos-theme)

Cosmos design tokens — CSS only.

Provides three CSS files consumable by any framework:

| Import                          | Purpose                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `@sckyzo/cosmos-theme/tailwind` | Tailwind 4 `@theme` block (palette, fonts, shadows, brand colors)              |
| `@sckyzo/cosmos-theme/vars`     | Universal CSS custom properties (bg, text, border, accent), themes and accents |
| `@sckyzo/cosmos-theme/fonts`    | `@fontsource` font imports (Outfit + JetBrains Mono)                           |

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

## Tokens

See [`css/tailwind-tokens.css`](css/tailwind-tokens.css) for the full source.

Categories:

- **Brand palette** : `--color-brand-25` to `--color-brand-950`
- **Semantic colors** : `--color-success-*`, `--color-error-*`, `--color-warning-*`
- **Status** : `--color-status-{ok,warn,crit,unknown}`
- **Typography** : `--font-sans` (Outfit), `--font-mono` (JetBrains Mono)
- **Shadows** : `--shadow-card`, `--shadow-card-hover`
- **Layout vars** (theme-aware): `--color-bg-{base,panel,elevated}`, `--color-text-{base,primary,secondary,muted}`, `--color-border`, `--color-accent`
- **Code highlighting** (theme-aware): `--color-code-foreground` and `--color-code-token-*` (keyword, string, comment, constant, function, parameter, string-expression, punctuation, link, inserted, deleted, changed). The names match Shiki's CSS variables theme with `variablePrefix: '--color-code-'`. Each one keeps 4.5:1 on CodeBlock's background in all four themes (checked by `pnpm test`).

## License

MIT — see [LICENSE](../../LICENSE).
