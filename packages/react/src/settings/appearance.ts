import type { AccentColor } from './AccentPicker';
import type { PaletteMeta } from './PaletteCard';

/** A Cosmos theme: one class on `<html>`, none for `light`. */
export type CosmosTheme = 'light' | 'sand' | 'dark' | 'deep-blue';

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

export type CosmosThemeMeta = PaletteMeta & { id: CosmosTheme; dark: boolean };
export type CosmosAccentMeta = AccentColor & { id: CosmosAccent };
/** `family` is the CSS font stack the theme sets for this font. */
export type CosmosFontMeta = { id: CosmosFont; label: string; family: string };
/** `scale` is the factor the theme applies to every text size. */
export type CosmosTextSizeMeta = { id: CosmosTextSize; label: string; scale: number };

/**
 * The page's appearance. `font` and `textSize` are optional: leave them out
 * and `applyAppearance` doesn't touch their attributes.
 */
export type CosmosAppearance = {
  theme: CosmosTheme;
  accent: CosmosAccent;
  font?: CosmosFont;
  textSize?: CosmosTextSize;
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

const THEME_CLASSES = COSMOS_THEMES.map((t) => t.id).filter((id) => id !== 'light');

/** `true` for the themes that enable Tailwind's `dark:` variant. */
export const isDarkTheme = (theme: CosmosTheme): boolean =>
  COSMOS_THEMES.some((t) => t.id === theme && t.dark);

/**
 * Apply an appearance to `root` (default `<html>`): swaps the theme class and
 * sets `data-accent`, `data-font` and `data-text-size`, removing each one for
 * its default (blue, Outfit, `md`). A `font` or `textSize` left out keeps its
 * attribute as it is. No-op during SSR.
 */
export const applyAppearance = (
  { theme, accent, font, textSize }: CosmosAppearance,
  root?: HTMLElement
) => {
  const el = root ?? (typeof document === 'undefined' ? undefined : document.documentElement);
  if (!el) return;
  el.classList.remove(...THEME_CLASSES);
  if (theme !== 'light') el.classList.add(theme);
  if (accent === 'blue') delete el.dataset.accent;
  else el.dataset.accent = accent;
  if (font === 'outfit') delete el.dataset.font;
  else if (font) el.dataset.font = font;
  if (textSize === 'md') delete el.dataset.textSize;
  else if (textSize) el.dataset.textSize = textSize;
};
