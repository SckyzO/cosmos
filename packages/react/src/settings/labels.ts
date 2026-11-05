// The English the settings components write, their part of `CosmosLabels` (`englishLabels`).

import type { CustomizerSection } from './Customizer';

/**
 * The names of the options the appearance components offer by default (`COSMOS_THEMES`,
 * `COSMOS_ACCENTS`…), read by `AppearanceSettings`, `AppearanceMenu` and `Customizer`. A list the
 * app passes (`themes`, `accents`…) keeps its own labels, except for a choice it left as it is.
 */
export type AppearanceLabels = {
  /** Default `Light`. */
  themeLight: string;
  /** Default `Sand`. */
  themeSand: string;
  /** Default `Dark`. */
  themeDark: string;
  /** Default `Deep Blue`. */
  themeDeepBlue: string;
  /** The opt-in `COSMOS_SYSTEM_THEME`. Default `System`. */
  themeSystem: string;
  /** Default `Blue`. */
  accentBlue: string;
  /** Default `Indigo`. */
  accentIndigo: string;
  /** Default `Violet`. */
  accentViolet: string;
  /** Default `Purple`. */
  accentPurple: string;
  /** Default `Rose`. */
  accentRose: string;
  /** Default `Teal`. */
  accentTeal: string;
  /** Default `Cyan`. */
  accentCyan: string;
  /** Default `Graphite`. */
  accentGraphite: string;
  /** Default `Red`. */
  accentRed: string;
  /** Default `Orange`. */
  accentOrange: string;
  /** Default `Amber`. */
  accentAmber: string;
  /** Default `Green`. */
  accentGreen: string;
  /** The device's own font (the other fonts are named by their families). Default `System`. */
  fontSystem: string;
  /** Default `Small`. */
  textSizeSmall: string;
  /** Default `Default`. */
  textSizeDefault: string;
  /** Default `Large`. */
  textSizeLarge: string;
  /** Default `Extra large`. */
  textSizeExtraLarge: string;
  /** Default `Compact`. */
  densityCompact: string;
  /** Default `Default`. */
  densityDefault: string;
  /** Default `Comfortable`. */
  densityComfortable: string;
  /** Default `None`. */
  radiusNone: string;
  /** Default `Small`. */
  radiusSmall: string;
  /** Default `Default`. */
  radiusDefault: string;
  /** Default `Large`. */
  radiusLarge: string;
  /** Default `Normal`. */
  motionNormal: string;
  /** Default `Reduced`. */
  motionReduced: string;
  /** The sample of each font and text size in `AppearanceSettings`. Default `Aa`. */
  sample: string;
};

export type AppearanceSettingsLabels = {
  /** Heading of the theme group. Default `Theme`. */
  theme: string;
  /** Heading of the accent group. Default `Accent color`. */
  accent: string;
  /** Heading of the font group. Default `Font`. */
  font: string;
  /** Heading of the text size group. Default `Text size`. */
  textSize: string;
  /** Heading of the density group. Default `Density`. */
  density: string;
  /** Heading of the animations group. Default `Animations`. */
  motion: string;
};

export type AppearanceMenuLabels = {
  /** The trigger's name and tooltip, and the panel's name. Default `Appearance`. */
  label: string;
  /** The button under the groups, shown with `onReset`. Default `Reset`. */
  reset: string;
};

/** The headings of the sections of the panel, by section, then the rest of its texts. */
export type CustomizerLabels = Record<CustomizerSection, string> & {
  /** Title of the panel when the host gives no `title`. Default `Customize`. */
  title: string;
  /** The line under it when the host gives no `subtitle`. Default `Changes apply at once.` */
  subtitle: string;
  /** The button that puts the default value back. Default `Reset`. */
  reset: string;
  /** The button that copies the value as JSON. Default `Copy config`. */
  copyConfig: string;
  /** Said once the value is copied. Default `Copied`. */
  copied: string;
  /** Said when the clipboard refuses it. Default `Could not copy`. */
  copyFailed: string;
  /** Default `Vertical`. */
  layoutVertical: string;
  /** Default `Horizontal`. */
  layoutHorizontal: string;
  /** Default `Expanded`. */
  sidebarExpanded: string;
  /** Default `Collapsed`. */
  sidebarCollapsed: string;
  /** Default `On hover`. */
  sidebarHover: string;
  /** Default `Compact`. */
  sidebarCompact: string;
  /** Default `Fluid`. */
  containerFluid: string;
  /** Default `Boxed`. */
  containerBoxed: string;
  /** Default `Left to right`. */
  directionLtr: string;
  /** Default `Right to left`. */
  directionRtl: string;
};

export const APPEARANCE_LABELS: AppearanceLabels = {
  themeLight: 'Light',
  themeSand: 'Sand',
  themeDark: 'Dark',
  themeDeepBlue: 'Deep Blue',
  themeSystem: 'System',
  accentBlue: 'Blue',
  accentIndigo: 'Indigo',
  accentViolet: 'Violet',
  accentPurple: 'Purple',
  accentRose: 'Rose',
  accentTeal: 'Teal',
  accentCyan: 'Cyan',
  accentGraphite: 'Graphite',
  accentRed: 'Red',
  accentOrange: 'Orange',
  accentAmber: 'Amber',
  accentGreen: 'Green',
  fontSystem: 'System',
  textSizeSmall: 'Small',
  textSizeDefault: 'Default',
  textSizeLarge: 'Large',
  textSizeExtraLarge: 'Extra large',
  densityCompact: 'Compact',
  densityDefault: 'Default',
  densityComfortable: 'Comfortable',
  radiusNone: 'None',
  radiusSmall: 'Small',
  radiusDefault: 'Default',
  radiusLarge: 'Large',
  motionNormal: 'Normal',
  motionReduced: 'Reduced',
  sample: 'Aa',
};

export const APPEARANCE_SETTINGS_LABELS: AppearanceSettingsLabels = {
  theme: 'Theme',
  accent: 'Accent color',
  font: 'Font',
  textSize: 'Text size',
  density: 'Density',
  motion: 'Animations',
};

export const APPEARANCE_MENU_LABELS: AppearanceMenuLabels = {
  label: 'Appearance',
  reset: 'Reset',
};

export const CUSTOMIZER_LABELS: CustomizerLabels = {
  presets: 'Presets',
  theme: 'Theme',
  accent: 'Accent color',
  font: 'Font',
  textSize: 'Text size',
  density: 'Density',
  radius: 'Corner radius',
  motion: 'Animations',
  direction: 'Direction',
  layout: 'Layout',
  sidebar: 'Sidebar',
  container: 'Container',
  title: 'Customize',
  subtitle: 'Changes apply at once.',
  reset: 'Reset',
  copyConfig: 'Copy config',
  copied: 'Copied',
  copyFailed: 'Could not copy',
  layoutVertical: 'Vertical',
  layoutHorizontal: 'Horizontal',
  sidebarExpanded: 'Expanded',
  sidebarCollapsed: 'Collapsed',
  sidebarHover: 'On hover',
  sidebarCompact: 'Compact',
  containerFluid: 'Fluid',
  containerBoxed: 'Boxed',
  directionLtr: 'Left to right',
  directionRtl: 'Right to left',
};
