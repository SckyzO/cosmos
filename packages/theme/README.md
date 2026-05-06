# @sckyzo/cosmos-theme

Cosmos design tokens — CSS only.

Provides three CSS files consumable by any framework:

| Import | Purpose |
|---|---|
| `@sckyzo/cosmos-theme/tailwind` | Tailwind 4 `@theme` block (palette, fonts, shadows, brand colors) |
| `@sckyzo/cosmos-theme/vars` | Universal CSS custom properties (bg, text, border, accent + dark mode) |
| `@sckyzo/cosmos-theme/fonts` | `@fontsource` font imports (Outfit + JetBrains Mono) |

## Usage

### With Tailwind 4 (recommended for React apps)

```css
/* src/index.css */
@import '@sckyzo/cosmos-theme/fonts';
@import '@sckyzo/cosmos-theme/tailwind';
@import 'tailwindcss';
@import '@sckyzo/cosmos-theme/vars';
```

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
- **Semantic colors** : `--color-success-*`, `--color-error-*`, `--color-warn-*`
- **Status** : `--color-status-{ok,warn,crit,unknown}`
- **Typography** : `--font-sans` (Outfit), `--font-mono` (JetBrains Mono)
- **Shadows** : `--shadow-card`, `--shadow-card-hover`
- **Layout vars** (dark-mode aware): `--color-bg-{base,panel,elevated}`, `--color-text-{base,primary,secondary,muted}`, `--color-border`, `--color-accent`

## License

MIT — see [LICENSE](../../LICENSE).
