import type { AccentColor } from './AccentPicker';
import type { PaletteMeta } from './PaletteCard';

/** A Cosmos theme: one class on `<html>`, none for `light`. */
export type CosmosTheme = 'light' | 'sand' | 'dark' | 'deep-blue';

/**
 * What a user can choose as a theme: a Cosmos theme, or `system` to follow
 * `prefers-color-scheme`. `system` is not a theme of its own (it has no CSS):
 * `applyAppearance` resolves it to the light or the dark theme.
 */
export type CosmosThemeChoice = CosmosTheme | 'system';

/** The themes `system` resolves to. */
export type CosmosSystemThemes = { light: CosmosTheme; dark: CosmosTheme };

/** A Cosmos accent: the `data-accent` attribute on `<html>`, none for `blue`. */
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

/** A Cosmos font: the `data-font` attribute on `<html>`, none for `outfit`. */
export type CosmosFont = 'outfit' | 'inter' | 'plex' | 'montserrat' | 'open-sans' | 'system';

/** A Cosmos text size: the `data-text-size` attribute on `<html>`, none for `md`. */
export type CosmosTextSize = 'sm' | 'md' | 'lg' | 'xl';

/** A Cosmos density: the `data-density` attribute on `<html>`, none for `default`. */
export type CosmosDensity = 'compact' | 'default' | 'comfortable';

export type CosmosThemeMeta = PaletteMeta & { id: CosmosTheme; dark: boolean };
/** The `system` entry for `<PalettePicker>`: see `COSMOS_SYSTEM_THEME`. */
export type CosmosSystemThemeMeta = PaletteMeta & { id: 'system' };
export type CosmosAccentMeta = AccentColor & { id: CosmosAccent };
/** `family` is the CSS font stack the theme sets for this font. */
export type CosmosFontMeta = { id: CosmosFont; label: string; family: string };
/** `scale` is the factor the theme applies to every text size. */
export type CosmosTextSizeMeta = { id: CosmosTextSize; label: string; scale: number };
export type CosmosDensityMeta = { id: CosmosDensity; label: string };

/**
 * The page's appearance. `font`, `textSize` and `density` are optional: leave
 * them out and `applyAppearance` doesn't touch their attributes.
 */
export type CosmosAppearance = {
  /** `system` follows `prefers-color-scheme`: see `systemThemes`. */
  theme: CosmosThemeChoice;
  /** The themes `system` resolves to. Default `{ light: 'light', dark: 'dark' }`. */
  systemThemes?: CosmosSystemThemes;
  accent: CosmosAccent;
  font?: CosmosFont;
  textSize?: CosmosTextSize;
  density?: CosmosDensity;
};

/** The four themes shipped by `@sckyzo/cosmos-theme`, ready for `<PalettePicker>`. */
export const COSMOS_THEMES: CosmosThemeMeta[] = [
  {
    id: 'light',
    label: 'Light',
    dark: false,
    preview: { bg: '#f9fafb', surface: '#ffffff', border: '#e5e7eb', text: '#667085' },
  },
  {
    id: 'sand',
    label: 'Sand',
    dark: false,
    preview: { bg: '#f9f5eb', surface: '#fffcf7', border: '#e7dfd0', text: '#746656' },
  },
  {
    id: 'dark',
    label: 'Dark',
    dark: true,
    preview: { bg: '#0a0a0a', surface: '#141414', border: '#3d3d3d', text: '#a3a3a3' },
  },
  {
    id: 'deep-blue',
    label: 'Deep Blue',
    dark: true,
    preview: { bg: '#0c111d', surface: '#101828', border: '#344054', text: '#98a2b3' },
  },
];

/**
 * The opt-in `system` choice for `<PalettePicker>` / `<AppearanceSettings>`,
 * which no list offers by default: `themes={[COSMOS_SYSTEM_THEME, ...COSMOS_THEMES]}`.
 * Its mockup is a neutral mid-tone, since it shows whichever theme the device uses.
 */
export const COSMOS_SYSTEM_THEME: CosmosSystemThemeMeta = {
  id: 'system',
  label: 'System',
  preview: { bg: '#6b7280', surface: '#9ca3af', border: '#4b5563', text: '#111827' },
};

/**
 * The twelve accents, ready for `<AccentPicker>`. `hex` is the accent's
 * `brand-500`. Red, orange, amber and green look like the status colors, so
 * they come last.
 */
export const COSMOS_ACCENTS: CosmosAccentMeta[] = [
  { id: 'blue', label: 'Blue', hex: '#465fff' },
  { id: 'indigo', label: 'Indigo', hex: '#5963e9' },
  { id: 'violet', label: 'Violet', hex: '#8a49f5' },
  { id: 'purple', label: 'Purple', hex: '#b234d4' },
  { id: 'rose', label: 'Rose', hex: '#d81e70' },
  { id: 'teal', label: 'Teal', hex: '#038378' },
  { id: 'cyan', label: 'Cyan', hex: '#017f9d' },
  { id: 'graphite', label: 'Graphite', hex: '#707580' },
  { id: 'red', label: 'Red', hex: '#de1f2d' },
  { id: 'orange', label: 'Orange', hex: '#c04f01' },
  { id: 'amber', label: 'Amber', hex: '#a46800' },
  { id: 'green', label: 'Green', hex: '#02863c' },
];

/**
 * The fonts of `@sckyzo/cosmos-theme`. Outfit loads from
 * `@sckyzo/cosmos-theme/fonts`, each other one from `fonts/<id>`; `system`
 * loads nothing. Only offer the fonts whose CSS the app imports.
 */
export const COSMOS_FONTS: CosmosFontMeta[] = [
  { id: 'outfit', label: 'Outfit', family: "'Outfit', system-ui, sans-serif" },
  { id: 'inter', label: 'Inter', family: "'Inter Variable', system-ui, sans-serif" },
  { id: 'plex', label: 'IBM Plex Sans', family: "'IBM Plex Sans Variable', system-ui, sans-serif" },
  { id: 'montserrat', label: 'Montserrat', family: "'Montserrat Variable', system-ui, sans-serif" },
  { id: 'open-sans', label: 'Open Sans', family: "'Open Sans Variable', system-ui, sans-serif" },
  {
    id: 'system',
    label: 'System',
    family: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
];

/** The four text sizes of `@sckyzo/cosmos-theme`, smallest first. */
export const COSMOS_TEXT_SIZES: CosmosTextSizeMeta[] = [
  { id: 'sm', label: 'Small', scale: 0.9375 },
  { id: 'md', label: 'Default', scale: 1 },
  { id: 'lg', label: 'Large', scale: 1.125 },
  { id: 'xl', label: 'Extra large', scale: 1.25 },
];

/**
 * The three densities of `@sckyzo/cosmos-theme`, tightest first. They move the
 * height of controls and the vertical padding of rows, nothing else.
 */
export const COSMOS_DENSITIES: CosmosDensityMeta[] = [
  { id: 'compact', label: 'Compact' },
  { id: 'default', label: 'Default' },
  { id: 'comfortable', label: 'Comfortable' },
];

const THEME_CLASSES = COSMOS_THEMES.map((t) => t.id).filter((id) => id !== 'light');

/** `true` for the themes that enable Tailwind's `dark:` variant. */
export const isDarkTheme = (theme: CosmosTheme): boolean =>
  COSMOS_THEMES.some((t) => t.id === theme && t.dark);

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Whether the device asks for a dark color scheme. `false` during SSR or without `matchMedia`. */
export const systemPrefersDark = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia?.(DARK_QUERY).matches;

/**
 * The theme to apply for a choice: the theme itself, or for `system` the dark
 * or the light one of `systemThemes` according to `prefersDark`.
 */
export const resolveTheme = (
  choice: CosmosThemeChoice,
  prefersDark: boolean,
  systemThemes: CosmosSystemThemes = { light: 'light', dark: 'dark' }
): CosmosTheme =>
  choice === 'system' ? (prefersDark ? systemThemes.dark : systemThemes.light) : choice;

/**
 * Calls `onChange(prefersDark)` when the device switches its color scheme, and
 * returns the function that stops it. Use it while the theme is `system`, to
 * apply the appearance again. No-op during SSR or without `matchMedia`.
 */
export const watchSystemTheme = (onChange: (prefersDark: boolean) => void): (() => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const query = window.matchMedia(DARK_QUERY);
  const listener = (event: MediaQueryListEvent) => onChange(event.matches);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
};

/**
 * Apply an appearance to `root` (default `<html>`): swaps the theme class and
 * sets `data-accent`, `data-font`, `data-text-size` and `data-density`,
 * removing each one for its default (blue, Outfit, `md`, `default`). A `system`
 * theme is resolved with `prefers-color-scheme` when applied: call this again
 * on `watchSystemTheme`. A `font`, `textSize` or `density` left out keeps its
 * attribute as it is. No-op during SSR.
 */
export const applyAppearance = (
  { theme: choice, systemThemes, accent, font, textSize, density }: CosmosAppearance,
  root?: HTMLElement
) => {
  const el = root ?? (typeof document === 'undefined' ? undefined : document.documentElement);
  if (!el) return;
  const theme = resolveTheme(choice, systemPrefersDark(), systemThemes);
  el.classList.remove(...THEME_CLASSES);
  if (theme !== 'light') el.classList.add(theme);
  if (accent === 'blue') delete el.dataset.accent;
  else el.dataset.accent = accent;
  if (font === 'outfit') delete el.dataset.font;
  else if (font) el.dataset.font = font;
  if (textSize === 'md') delete el.dataset.textSize;
  else if (textSize) el.dataset.textSize = textSize;
  if (density === 'default') delete el.dataset.density;
  else if (density) el.dataset.density = density;
};
