import {
  COSMOS_ACCENTS,
  COSMOS_DENSITIES,
  COSMOS_FONTS,
  COSMOS_MOTIONS,
  COSMOS_RADII,
  COSMOS_SYSTEM_THEME,
  COSMOS_TEXT_SIZES,
  COSMOS_THEMES,
} from './appearance';
import type { AppearanceLabels } from './labels';

// The names the options of the appearance components carry, by id: the key of `AppearanceLabels`
// that holds each one. A list the app passes keeps the labels it gives; an option it left as it
// is (its label is still the English one) reads the dictionary, so `themes={[COSMOS_SYSTEM_THEME,
// ...COSMOS_THEMES]}` is translated too.

const nameOf = <T extends { id: string; label: string }>(
  option: T,
  english: readonly { id: string; label: string }[],
  keys: Record<string, keyof AppearanceLabels>,
  labels: AppearanceLabels
): T => {
  const key = keys[option.id];
  const untouched = english.some(({ id, label }) => id === option.id && label === option.label);
  return key && untouched ? { ...option, label: labels[key] } : option;
};

const THEME_KEYS: Record<string, keyof AppearanceLabels> = {
  light: 'themeLight',
  sand: 'themeSand',
  dark: 'themeDark',
  'deep-blue': 'themeDeepBlue',
  system: 'themeSystem',
};
const ACCENT_KEYS: Record<string, keyof AppearanceLabels> = {
  blue: 'accentBlue',
  indigo: 'accentIndigo',
  violet: 'accentViolet',
  purple: 'accentPurple',
  rose: 'accentRose',
  teal: 'accentTeal',
  cyan: 'accentCyan',
  graphite: 'accentGraphite',
  red: 'accentRed',
  orange: 'accentOrange',
  amber: 'accentAmber',
  green: 'accentGreen',
};
const FONT_KEYS: Record<string, keyof AppearanceLabels> = { system: 'fontSystem' };
const TEXT_SIZE_KEYS: Record<string, keyof AppearanceLabels> = {
  sm: 'textSizeSmall',
  md: 'textSizeDefault',
  lg: 'textSizeLarge',
  xl: 'textSizeExtraLarge',
};
const DENSITY_KEYS: Record<string, keyof AppearanceLabels> = {
  compact: 'densityCompact',
  default: 'densityDefault',
  comfortable: 'densityComfortable',
};
const RADIUS_KEYS: Record<string, keyof AppearanceLabels> = {
  none: 'radiusNone',
  sm: 'radiusSmall',
  default: 'radiusDefault',
  lg: 'radiusLarge',
};
const MOTION_KEYS: Record<string, keyof AppearanceLabels> = {
  full: 'motionNormal',
  reduced: 'motionReduced',
};

const THEMES_ENGLISH = [...COSMOS_THEMES, COSMOS_SYSTEM_THEME];

/** The themes, each named by the dictionary unless the app gave it a label of its own. */
export const nameThemes = <T extends { id: string; label: string }>(
  themes: readonly T[],
  labels: AppearanceLabels
): T[] => themes.map((theme) => nameOf(theme, THEMES_ENGLISH, THEME_KEYS, labels));

export const nameAccents = <T extends { id: string; label: string }>(
  accents: readonly T[],
  labels: AppearanceLabels
): T[] => accents.map((accent) => nameOf(accent, COSMOS_ACCENTS, ACCENT_KEYS, labels));

export const nameFonts = <T extends { id: string; label: string }>(
  fonts: readonly T[],
  labels: AppearanceLabels
): T[] => fonts.map((font) => nameOf(font, COSMOS_FONTS, FONT_KEYS, labels));

export const nameTextSizes = <T extends { id: string; label: string }>(
  sizes: readonly T[],
  labels: AppearanceLabels
): T[] => sizes.map((size) => nameOf(size, COSMOS_TEXT_SIZES, TEXT_SIZE_KEYS, labels));

export const nameDensities = <T extends { id: string; label: string }>(
  densities: readonly T[],
  labels: AppearanceLabels
): T[] => densities.map((density) => nameOf(density, COSMOS_DENSITIES, DENSITY_KEYS, labels));

export const nameRadii = <T extends { id: string; label: string }>(
  radii: readonly T[],
  labels: AppearanceLabels
): T[] => radii.map((radius) => nameOf(radius, COSMOS_RADII, RADIUS_KEYS, labels));

export const nameMotions = <T extends { id: string; label: string }>(
  motions: readonly T[],
  labels: AppearanceLabels
): T[] => motions.map((motion) => nameOf(motion, COSMOS_MOTIONS, MOTION_KEYS, labels));
