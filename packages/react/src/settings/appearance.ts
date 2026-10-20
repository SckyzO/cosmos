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

export type CosmosThemeMeta = PaletteMeta & { id: CosmosTheme; dark: boolean };
export type CosmosAccentMeta = AccentColor & { id: CosmosAccent };

export type CosmosAppearance = { theme: CosmosTheme; accent: CosmosAccent };

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
  { id: 'violet', label: 'Violet', hex: '#8745f1' },
  { id: 'purple', label: 'Purple', hex: '#ad2ecf' },
  { id: 'rose', label: 'Rose', hex: '#d4166d' },
  { id: 'teal', label: 'Teal', hex: '#038378' },
  { id: 'cyan', label: 'Cyan', hex: '#017f9d' },
  { id: 'graphite', label: 'Graphite', hex: '#707580' },
  { id: 'red', label: 'Red', hex: '#db192a' },
  { id: 'orange', label: 'Orange', hex: '#c04f01' },
  { id: 'amber', label: 'Amber', hex: '#a46800' },
  { id: 'green', label: 'Green', hex: '#02863c' },
];

const THEME_CLASSES = COSMOS_THEMES.map((t) => t.id).filter((id) => id !== 'light');

/** `true` for the themes that enable Tailwind's `dark:` variant. */
export const isDarkTheme = (theme: CosmosTheme): boolean =>
  COSMOS_THEMES.some((t) => t.id === theme && t.dark);

/**
 * Apply a theme and an accent to `root` (default `<html>`): swaps the theme
 * class and sets `data-accent`, removing it for `blue`. No-op during SSR.
 */
export const applyAppearance = ({ theme, accent }: CosmosAppearance, root?: HTMLElement) => {
  const el = root ?? (typeof document === 'undefined' ? undefined : document.documentElement);
  if (!el) return;
  el.classList.remove(...THEME_CLASSES);
  if (theme !== 'light') el.classList.add(theme);
  if (accent === 'blue') delete el.dataset.accent;
  else el.dataset.accent = accent;
};
