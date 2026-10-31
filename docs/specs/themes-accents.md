# Spec — 4 themes and 12 accent colors

> Status: implemented in 0.1.0 (#145, then #146 for `AppearanceMenu`).
>
> Changes made during implementation: `PalettePreview` gained an optional `text` color so
> light and dark previews stay readable in one picker; Sidebar icons in active rows inherit
> the label color; `PageBreadcrumb` link hover moved to `brand-600`; LineAreaChart got a fix
> for y-axis labels that went blank after an options update. The release is 0.1.0, not
> 1.0.0 (`bump-minor-pre-major`).

## Goal

Two independent appearance settings, both set on the `<html>` element:

| Setting | Mechanism                  | Values                                                                                                                              |
| ------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Theme   | one class (none = `light`) | `light`, `sand`, `dark`, `deep-blue`                                                                                                |
| Accent  | `data-accent` attribute    | `blue` (default, no attribute), `indigo`, `violet`, `purple`, `rose`, `red`, `orange`, `amber`, `green`, `teal`, `cyan`, `graphite` |

Example: `<html class="sand" data-accent="teal">`. 4 × 12 = 48 combinations, all at WCAG AA (checked, see § 1.6).

## Decisions

- `dark` becomes the **softened neutral black/gray** theme (no pure black). The current navy `dark` is renamed `deep-blue`, with the same values.
- No `.oled` class. An early draft had one; it was never published.
- All 12 accents stay. Red, Orange, Amber and Green go **last** in every displayed list, because they look like the status colors (error / warning / success).
- Contrast fix included: **links and active labels** move from `text-brand-500` to `text-brand-600` on light themes.
- Out of scope: the existing "muted" text (`--color-text-muted`, `text-gray-400` on light, ~2.5:1) gets its own PR. Do not change it here.
- Scope: `packages/theme`, Storybook, `packages/react`, `packages/charts`.
- Accepted breaking change (packages are at 0.0.x): a consumer that sets `.dark` now gets the black/gray theme.

## Starting point

`main` ships two themes: `:root` (light) and `.dark` (navy), both in `packages/theme/css/css-vars.css`, with the `dark:` Tailwind variant bound to `.dark` in `packages/theme/css/tailwind-tokens.css`. Storybook's theme switcher lists `light` and `dark`.

---

## 1. `packages/theme`

### 1.1 Principle

Components mostly use Tailwind palette classes (`bg-white`, `text-gray-500`, `dark:bg-gray-900`, `bg-brand-500`…). Tailwind 4 compiles them to `var(--color-…)`. A theme or an accent **redefines those variables** on `<html>`; no component needs per-theme classes.

Theme and accent rules stay **outside any `@layer`** in `css-vars.css`, so they win over Tailwind's `@theme` block (emitted in `@layer theme`).

### 1.2 Themes — `css/css-vars.css`

Update the header comment (4 themes + accents, one class + one attribute on `<html>`).

**`:root` (light)**: unchanged, except `--color-accent: var(--color-brand-500);` (instead of `#465fff`).

**`.sand`** (new, warm beige light theme). It re-tints `--color-white` and the gray scale and does not set `--color-accent` (inherited from `:root`):

```css
.sand {
  --color-bg-base: #f9f5eb;
  --color-bg-panel: #fffcf7;
  --color-bg-elevated: #fffcf7;

  --color-border: #d5cbba;

  --color-text-base: #1e1711;
  --color-text-primary: #1e1711;
  --color-text-secondary: #746656;
  --color-text-muted: #a39684;

  /* Warm gray scale — same lightness steps as Tailwind gray, beige hue. */
  --color-white: oklch(99.3% 0.008 85);
  --color-gray-50: oklch(97% 0.014 85);
  --color-gray-100: oklch(94.8% 0.018 84);
  --color-gray-200: oklch(90.5% 0.022 82);
  --color-gray-300: oklch(84.5% 0.026 80);
  --color-gray-400: oklch(68% 0.03 75);
  --color-gray-500: oklch(52% 0.03 70);
  --color-gray-600: oklch(43% 0.028 65);
  --color-gray-700: oklch(36% 0.025 60);
  --color-gray-800: oklch(27.5% 0.02 60);
  --color-gray-900: oklch(21% 0.016 60);
  --color-gray-950: oklch(13% 0.012 60);
}
```

**`.dark`** (new, neutral black/gray) — replaces the current `.dark`:

```css
.dark {
  color-scheme: dark;

  --color-bg-base: #0a0a0a;
  --color-bg-panel: #141414;
  --color-bg-elevated: #242424;

  --color-border: #3d3d3d;

  --color-text-base: #e5e5e5;
  --color-text-primary: #fff;
  --color-text-secondary: #a3a3a3;
  --color-text-muted: #8f8f8f;

  /* Neutral gray scale, softened near-black (no pure #000). */
  --color-gray-50: #fafafa;
  --color-gray-100: #f5f5f5;
  --color-gray-200: #e5e5e5;
  --color-gray-300: #d4d4d4;
  --color-gray-400: #a3a3a3;
  --color-gray-500: #8f8f8f;
  --color-gray-600: #5c5c5c;
  --color-gray-700: #3d3d3d;
  --color-gray-800: #242424;
  --color-gray-900: #141414;
  --color-gray-950: #0a0a0a;
  --color-gray-dark: #141414;
}
```

**`.deep-blue`**: exactly the values of the **current** `.dark`, with no gray override (it uses Tailwind's default gray palette):

```css
.deep-blue {
  color-scheme: dark;

  --color-bg-base: #0c111d;
  --color-bg-panel: #1a2231;
  --color-bg-elevated: #1d2939;

  --color-border: #344054;

  --color-text-base: #e4e7ec;
  --color-text-primary: #fff;
  --color-text-secondary: #98a2b3;
  --color-text-muted: #667085;
}
```

No theme block sets `--color-accent`: only `:root` does, through `var(--color-brand-500)`.

### 1.3 `dark:` variant — `css/tailwind-tokens.css`

```css
@custom-variant dark (&:is(.dark, .dark *, .deep-blue, .deep-blue *));
```

Update the related comments (`.dark` / `.deep-blue`).

### 1.4 Accents — `css/css-vars.css`

Add a section after the themes. Blue stays the `@theme` block value (no rule). Every other accent gets a block that redefines the 12 shades:

```css
[data-accent='indigo'] {
  --color-brand-25: #f4f6fe;
  /* … 50 → 950 … */
}
```

Values (from 25 to 950, in the order 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950):

| Accent     | Label    | 25        | 50        | 100       | 200       | 300       | 400       | 500       | 600       | 700       | 800       | 900       | 950       |
| ---------- | -------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- |
| `blue`     | Blue     | `#f2f7ff` | `#ecf3ff` | `#dde9ff` | `#c2d6ff` | `#9cb9ff` | `#7592ff` | `#465fff` | `#3641f5` | `#2a31d8` | `#252dae` | `#262e89` | `#161950` |
| `indigo`   | Indigo   | `#f4f6fe` | `#eff2fe` | `#e2e7ff` | `#c9d3ff` | `#a7b5ff` | `#7f8fff` | `#5963e9` | `#4a4fd3` | `#3c3bbf` | `#2f25ab` | `#24257a` | `#160b63` |
| `violet`   | Violet   | `#f7f5ff` | `#f3f0fe` | `#eae4ff` | `#d8ceff` | `#c0abff` | `#a57eff` | `#8a49f5` | `#752cdb` | `#6508c6` | `#5200a4` | `#3f097e` | `#2b005b` |
| `purple`   | Purple   | `#fcf3ff` | `#fbedff` | `#f7dfff` | `#f0c2ff` | `#e696ff` | `#d55bf8` | `#b234d4` | `#990aba` | `#81019e` | `#690181` | `#520066` | `#380046` |
| `rose`     | Rose     | `#fff3f6` | `#ffeef1` | `#ffdfe6` | `#ffc3d2` | `#ff96b4` | `#ff4e90` | `#d81e70` | `#b8005c` | `#9b004c` | `#7f013d` | `#64002f` | `#45001e` |
| `teal`     | Teal     | `#defffa` | `#d2fdf6` | `#c8f3ec` | `#99e7dc` | `#31d5c6` | `#02b3a5` | `#038378` | `#006f66` | `#015c54` | `#024a43` | `#003833` | `#002723` |
| `cyan`     | Cyan     | `#ecf9ff` | `#e1f7ff` | `#c8f0ff` | `#96e3fe` | `#25cefb` | `#01abd3` | `#017f9d` | `#016b84` | `#01596e` | `#014759` | `#003645` | `#002631` |
| `graphite` | Graphite | `#f5f7fb` | `#f0f3f7` | `#e6e8ec` | `#d0d6e2` | `#b5bbc7` | `#959ba6` | `#707580` | `#5d626d` | `#4c515c` | `#3c414b` | `#2e3138` | `#1f2228` |
| `red`      | Red      | `#fff4f3` | `#ffeeec` | `#ffe0dd` | `#ffc6c0` | `#ff9b94` | `#ff5a57` | `#de1f2d` | `#be021e` | `#a00118` | `#830011` | `#67000b` | `#470005` |
| `orange`   | Orange   | `#fff4f0` | `#ffefe8` | `#ffe1d5` | `#ffc8b0` | `#ff9f73` | `#f66a15` | `#c04f01` | `#a44201` | `#8a3600` | `#712b00` | `#592000` | `#3d1300` |
| `amber`    | Amber    | `#fff5ea` | `#fff0e0` | `#ffe3c5` | `#ffcb8f` | `#ffa408` | `#d48700` | `#a46800` | `#8a5601` | `#734701` | `#5d3900` | `#482b00` | `#321c00` |
| `green`    | Green    | `#e5ffe9` | `#d7ffde` | `#cdf4d4` | `#a5e9b2` | `#5ad87e` | `#32b75e` | `#02863c` | `#027232` | `#015e28` | `#014b1f` | `#003915` | `#00280d` |

The table order is the display order (the 4 status-like accents last).

### 1.5 Focus ring — `css/tailwind-tokens.css`

Replace the hardcoded blue:

```css
--shadow-focus-ring: 0px 0px 0px 4px color-mix(in srgb, var(--color-brand-500) 12%, transparent);
```

Since #151 the halo is drawn together with a solid indicator through the `focus-indicator`, `field-focus`, `field-focus-error` and `focus-indicator-on-accent` utilities of `tailwind-tokens.css` (documented in `docs/guides/tokens.md`); no component uses `--shadow-focus-ring` alone.

### 1.6 Contrast guard — `packages/theme/scripts/check-contrast.mjs`

Dependency-free Node script, wired to the `test` script of `packages/theme/package.json` (replaces the `echo`). It reads `css/css-vars.css` and `css/tailwind-tokens.css`, converts colors (hex and `oklch()` → sRGB), computes WCAG 2.x ratios and **fails** when a threshold isn't met. Tailwind's default grays (used by `light` and `deep-blue`) are hardcoded in the script:

| Tailwind 4.3 token | Value                        |
| ------------------ | ---------------------------- |
| gray-50            | `oklch(98.5% 0.002 247.839)` |
| gray-100           | `oklch(96.7% 0.003 264.542)` |
| gray-200           | `oklch(92.8% 0.006 264.531)` |
| gray-300           | `oklch(87.2% 0.01 258.338)`  |
| gray-400           | `oklch(70.7% 0.022 261.325)` |
| gray-500           | `oklch(55.1% 0.027 264.364)` |
| gray-600           | `oklch(44.6% 0.03 256.802)`  |
| gray-700           | `oklch(37.3% 0.034 259.733)` |
| gray-800           | `oklch(27.8% 0.033 256.848)` |
| gray-900           | `oklch(21% 0.034 264.665)`   |
| gray-950           | `oklch(13% 0.028 261.692)`   |

Reference surfaces: light = page `--color-bg-base`, card `white`, subtle `gray-100`; dark = page `--color-bg-base`, card `gray-900`, raised `gray-800`.

Checked thresholds (≥ 4.5 unless stated otherwise):

- For each theme: headings and body text (light: `gray-900`, `gray-700`, `gray-600`, `gray-500`; dark: `white`, `gray-200`, `gray-300`, `gray-400`) on the 3 surfaces. Known exception: `light` `gray-500` on `gray-100` = 4.39, tolerated (≥ 4.3) since it's out of scope.
- `dark` only: `gray-500` / `--color-text-muted` on the 3 surfaces (expected ≥ 4.8).
- For each accent × light theme: `brand-600` on the 3 surfaces and on `brand-50`.
- For each accent × dark theme: `brand-400` on the 3 surfaces.
- For each accent: white text (the theme's `--color-white`, cream `oklch(99.3% 0.008 85)` on `sand`) on `brand-500`.
- For each accent × theme: `brand-500`, the focus indicator, on the 3 surfaces plus `--color-bg-panel`, `--color-bg-elevated`, `gray-800` and `gray-900` (the dark grays that stay dark in a light theme, as a `Navbar` with `theme="dark"`), ≥ 3 (WCAG 1.4.11). `violet`, `purple`, `rose` and `red` have a `brand-500` just light enough to clear 3:1 on `deep-blue` raised while white text stays above 4.8.
- `dark` structure (non-WCAG thresholds, so surfaces don't blend into each other): card ↔ raised ≥ 1.15; `gray-700` on card ≥ 1.6.

Before the contrast checks, the script reads `packages/react/src/settings/appearance.ts` as text and **fails** when it disagrees with the CSS: every theme and accent of `COSMOS_THEMES` / `COSMOS_ACCENTS` must exist in the CSS and vice versa, a theme's `dark` flag must match the classes the `dark:` variant of `tailwind-tokens.css` covers, and an accent's `hex` must equal its `brand-500`. A theme is `:root` or a class block of `css-vars.css` that sets `--color-bg-base`.

Do **not** check `--color-text-muted` or `gray-400` on light themes, nor `muted` on `deep-blue` (known debt, separate PR).

Expected reference values (worst case): white on `brand-500` between 4.51 and 4.84; `brand-500` focus indicator ≥ 4.19 on `light`, 3.96 on `sand`, 3.20 on `dark`, 3.03 on `deep-blue`; `brand-600` on Sand subtle ≥ 5.21; `brand-400` on `deep-blue` raised ≥ 4.67; `dark`: `gray-500` on raised 4.80, card ↔ raised 1.19, `gray-700` on card 1.70.

The script prints a readable table and exits with code 1 on the first failure, naming the failing pair.

### 1.7 Documentation — `packages/theme/README.md`

Add a "Themes & accents" section: the list of 4 themes and 12 accents, the `<html class="sand" data-accent="teal">` example, the "one theme at a time" rule, and the warning about Red / Orange / Amber / Green (they look like statuses).

---

## 2. Storybook — `apps/storybook`

- `.storybook/preview.tsx`:
  - `withThemeByClassName({ themes: { light: '', sand: 'sand', dark: 'dark', 'deep-blue': 'deep-blue' }, defaultTheme: 'deep-blue', parentSelector: 'html' })`. `deep-blue` by default, to keep the current look and stay consistent with `cosmosDarkTheme` (navy docs chrome). _Changed after 0.1.0: the default is `dark`, and the manager and docs chrome follow the Theme global (#157). Later replaced by a `theme` globalType and a `withThemeClass` decorator in `preview.tsx` (same classes and removal), so the toolbar item reads "Theme: Dark"; `@storybook/addon-themes` is gone._
  - Add an `accent` global to the toolbar: `globalTypes.accent` (`paintbrush` icon, `dynamicTitle: true`, the 12 accents in the § 1.4 order) + `initialGlobals: { accent: 'blue' }`, and a decorator that sets `document.documentElement.dataset.accent` (removes the attribute for `blue`). Don't use a second `@storybook/addon-themes` decorator: it would share the `theme` global.
- `.storybook/preview.css`: update the comment (`:root + .sand + .dark + .deep-blue + [data-accent]`).
- `stories/Welcome.stories.tsx`: the sentence "Dark mode toggles automatically via the `data-theme` attribute…" is wrong. Replace it with the theme class + `data-accent` explanation.
- Add a `Foundations/Appearance` story that mounts `AppearanceSettings` (§ 3.2) and applies the choice to the document through `applyAppearance`, to try every combination from one page.

## 3. `packages/react`

### 3.1 Data and helper — `src/settings/appearance.ts` (exported from `src/settings/index.ts`)

```ts
export type CosmosTheme = 'light' | 'sand' | 'dark' | 'deep-blue';
export type CosmosAccent =
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'rose'
  | 'teal'
  | 'cyan'
  | 'graphite'
  | 'red'
  | 'orange'
  | 'amber'
  | 'green';
```

- `COSMOS_THEMES`: array of `PaletteMeta & { id: CosmosTheme; dark: boolean }` (existing type in `PaletteCard.tsx`), English labels (`Light`, `Sand`, `Dark`, `Deep Blue`), `preview`:
  - light: `bg #f9fafb`, `surface #ffffff`, `border #e5e7eb`
  - sand: `bg #f9f5eb`, `surface #fffcf7`, `border #e7dfd0`
  - dark: `bg #0a0a0a`, `surface #141414`, `border #3d3d3d`
  - deep-blue: `bg #0c111d`, `surface #101828`, `border #344054`
- `COSMOS_ACCENTS`: array of `AccentColor & { id: CosmosAccent }` (existing type in `AccentPicker.tsx`), `hex` = the § 1.4 `brand-500`, English labels (`Blue`, `Indigo`, `Violet`, `Purple`, `Rose`, `Teal`, `Cyan`, `Graphite`, `Red`, `Orange`, `Amber`, `Green`), **in the § 1.4 order**.
- `applyAppearance({ theme, accent }, root = document.documentElement)`: removes every known theme class, adds the `theme` one (none for `light`), sets `data-accent` (removes the attribute for `blue`). No-op when `document` doesn't exist (SSR).
- `isDarkTheme(theme)`: `true` for `dark` and `deep-blue`.

### 3.2 `AppearanceSettings` component — `src/settings/AppearanceSettings.tsx`

Composes the existing `PalettePicker` (themes) and `AccentPicker` (accents) components:

- props: `theme`, `accent`, `onThemeChange(theme)`, `onAccentChange(accent)`, `themeLabel` (default `'Theme'`), `accentLabel` (default `'Accent color'`), `className`; optional `themes` / `accents` (default `COSMOS_THEMES` / `COSMOS_ACCENTS`) to narrow the list.
- Each group has a visible heading tied to the group (`aria-labelledby`).
- `AppearanceSettings.stories.tsx` story with `play` tests (in the style of the existing stories): clicking `Sand` calls `onThemeChange('sand')`, clicking `Teal` calls `onAccentChange('teal')`.

### 3.3 `ThemeToggleTri` — breaking change

- `ThemeMode` becomes `'light' | 'dark' | 'deep-blue'`; cycle `light → dark → deep-blue → light`.
- Icons: `light` Sun, `dark` Moon, `deep-blue` MoonStar.
- `oledLabel` is replaced by `deepBlueLabel` (default `'Switch to deep blue mode'`).
- Update `ThemeToggleTri.stories.tsx` (`Oled…` stories and tests → `DeepBlue…`) and the `DocPage.stories.tsx` copy that mentions "light + dark + OLED variants".
- `ThemeToggle` (boolean `isDark`) and the `Navbar` `theme` prop don't change.

### 3.4 Links in `brand-600` on light backgrounds

In `packages/react/src` (stories excluded), **text** in `text-brand-500` (links, active labels and tabs, ~19 occurrences) moves to `text-brand-600`. Keep the existing dark variant (`dark:text-brand-400`); add it when it's missing. Don't touch `bg-brand-500`, `border-brand-500`, `ring-…`, or decorative icons. Why: `brand-500` as text drops to 4.15–4.44 on Sand; `brand-600` holds ≥ 5.2 with all 12 accents.

## 4. `packages/charts` — `src/theme.ts`

- `detectDark`: true when `<html>` has the `dark` **or** `deep-blue` class (otherwise charts stay light on `deep-blue`).
- Add `readCssVar(name, fallback)` (read through `getComputedStyle(document.documentElement)`, `fallback` when empty or SSR).
- `useDarkMode` → also observe `data-accent` (`attributeFilter: ['class', 'data-accent']`), or a `useAppearance` hook exposing `dark` and a refresh key.
- `useChartTheme`: `brand` = `--color-brand-500` (fallback `COSMOS_BRAND`); `palette` = `[brand, ...COSMOS_PALETTE.slice(1)]`; grid = `--color-gray-800` on dark / `--color-gray-200` on light; axis labels = `--color-gray-400` on dark / `--color-gray-500` on light (fallbacks = the current values).
- Keep the `COSMOS_BRAND` export (doc: default value, prefer `useChartTheme().brand`).

## 5. Commits

- Conventional commits per package, for example `feat(theme)!: …`, `feat(react)!: …`, `feat(charts): …`, `docs(storybook): …`.
- `BREAKING CHANGE:` footer for `theme` (`.dark` becomes neutral, the old one is `.deep-blue`) and `react` (`ThemeToggleTri`: `oled` → `deep-blue`, `oledLabel` → `deepBlueLabel`).
- Everything lands through one reviewed PR.

## 6. Validation before pushing

1. `pnpm lint`, `pnpm format:check`, `pnpm typecheck`.
2. `pnpm --filter @sckyzo/cosmos-theme test` (the § 1.6 contrast script): must pass.
3. `pnpm test` (stories + `play` tests + a11y in `error` mode).
4. `pnpm build`.
5. Visual check in Storybook: the 4 themes with at least `blue`, `teal` and `red`, on `Examples/Dashboard`, a form (focus ring) and a chart (color follows the accent, dark chart on `deep-blue`).

## Out of scope (separate PRs)

- "Muted" text too light in the existing themes.
- `Toast` (Sonner's `theme="system"`) follows `prefers-color-scheme`, not the theme class.
