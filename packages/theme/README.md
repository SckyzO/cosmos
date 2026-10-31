# @sckyzo/cosmos-theme

[![npm](https://img.shields.io/npm/v/@sckyzo/cosmos-theme)](https://www.npmjs.com/package/@sckyzo/cosmos-theme)

Cosmos design tokens, CSS only: a Tailwind 4 `@theme` block, four themes, twelve accents, six
fonts, and text size, density and corner radius settings. It is what `@sckyzo/cosmos-react` and
`@sckyzo/cosmos-charts` are styled with, and it works on its own in any framework.

| Import                              | Purpose                                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `@sckyzo/cosmos-theme/tailwind`     | Tailwind 4 `@theme` block (palette, fonts, shadows, brand colors), the `dark:` and `rtl:` variants, the focus utilities |
| `@sckyzo/cosmos-theme/vars`         | The CSS custom properties (bg, text, border, accent), the themes and the accents                                        |
| `@sckyzo/cosmos-theme/fonts`        | `@fontsource` font imports (Outfit + JetBrains Mono)                                                                    |
| `@sckyzo/cosmos-theme/fonts/<name>` | One variable font for `data-font`: `inter`, `plex`, `montserrat`, `open-sans`                                           |

## Install

```bash
npm install @sckyzo/cosmos-theme
```

The three Cosmos packages share one version number: install the same version of each.

## Usage

### With Tailwind 4 (recommended for React apps)

Import order matters: `tailwindcss` comes first, then the Cosmos tokens, then the vars.

```css
/* src/index.css */
@import 'tailwindcss';
@import '@sckyzo/cosmos-theme/tailwind';
@import '@sckyzo/cosmos-theme/vars';
@import '@sckyzo/cosmos-theme/fonts';
```

With `@sckyzo/cosmos-react`, also add an `@source` line so Tailwind scans the components: see [Getting started](https://github.com/SckyzO/cosmos/blob/main/docs/getting-started.md#set-up-the-styles).

### Without Tailwind (e.g. Docusaurus)

```css
@import '@sckyzo/cosmos-theme/fonts';
@import '@sckyzo/cosmos-theme/vars';
/* Then reference vars: var(--color-brand-500), var(--color-bg-base), etc. */
```

### Set the appearance

The theme is one class on `<html>`; the accent, the font, the text size, the density and the corner
radius are `data-accent`, `data-font`, `data-text-size`, `data-density` and `data-radius` attributes,
and the reading direction is the native `dir`.

```html
<html class="sand" data-accent="teal"></html>
```

## Documentation

- [Appearance](https://github.com/SckyzO/cosmos/blob/main/docs/guides/appearance.md): every theme, accent, font, text size, density and radius.
- [Tokens and focus](https://github.com/SckyzO/cosmos/blob/main/docs/guides/tokens.md): the design tokens and the focus utilities.
- [Getting started](https://github.com/SckyzO/cosmos/blob/main/docs/getting-started.md).

## License

MIT, see [LICENSE](https://github.com/SckyzO/cosmos/blob/main/LICENSE).
