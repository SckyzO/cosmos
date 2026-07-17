# @sckyzo/cosmos-theme

Cosmos design tokens — CSS only.

Provides three CSS files consumable by any framework:

| Import                          | Purpose                                                                |
| ------------------------------- | ---------------------------------------------------------------------- |
| `@sckyzo/cosmos-theme/tailwind` | Tailwind 4 `@theme` block (palette, fonts, shadows, brand colors)      |
| `@sckyzo/cosmos-theme/vars`     | Universal CSS custom properties (bg, text, border, accent + dark mode) |
| `@sckyzo/cosmos-theme/fonts`    | `@fontsource` font imports (Outfit + JetBrains Mono)                   |

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

## Tokens

See [`css/tailwind-tokens.css`](css/tailwind-tokens.css) for the full source.

Categories:

- **Brand palette** : `--color-brand-25` to `--color-brand-950`
- **Semantic colors** : `--color-success-*`, `--color-error-*`, `--color-warning-*`
- **Status** : `--color-status-{ok,warn,crit,unknown}`
- **Typography** : `--font-sans` (Outfit), `--font-mono` (JetBrains Mono)
- **Shadows** : `--shadow-card`, `--shadow-card-hover`
- **Layout vars** (dark-mode aware): `--color-bg-{base,panel,elevated}`, `--color-text-{base,primary,secondary,muted}`, `--color-border`, `--color-accent`

## License

MIT — see [LICENSE](../../LICENSE).
