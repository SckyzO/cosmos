import { create } from 'storybook/theming';
import type { ThemeVars } from 'storybook/theming';
import type { CosmosTheme } from '../../../packages/react/src';

/*
 * Storybook chrome themes — one per Cosmos theme, used for the **manager** UI
 * (sidebar + toolbar, switched live in `manager.ts`) and the **docs** pages
 * (`CosmosDocsContainer.tsx`). Both follow the toolbar's Theme global, so the
 * whole app takes the picked theme, not just the story canvas.
 *
 * Hex values mirror the semantic tokens of each theme block in
 * `@sckyzo/cosmos-theme/vars` (bg-base, bg-panel, bg-elevated, border,
 * text-*). Storybook runs some of them through color helpers that don't parse
 * `oklch()`, so they stay hex. `PALETTES` is keyed by `CosmosTheme`, so the
 * compiler flags a theme added to that type without a palette here.
 */

/** Theme the canvas and the chrome start on (`initialGlobals.theme`). */
export const DEFAULT_THEME: CosmosTheme = 'dark';

type Palette = {
  base: 'light' | 'dark';
  bgBase: string;
  bgPanel: string;
  bgElevated: string;
  border: string;
  text: string;
  textSecondary: string;
};

const PALETTES: Record<CosmosTheme, Palette> = {
  light: {
    base: 'light',
    bgBase: '#f9fafb',
    bgPanel: '#ffffff',
    bgElevated: '#ffffff',
    border: '#d0d5dd',
    text: '#101828',
    textSecondary: '#667085',
  },
  sand: {
    base: 'light',
    bgBase: '#f9f5eb',
    bgPanel: '#fffcf7',
    bgElevated: '#fffcf7',
    border: '#d5cbba',
    text: '#1e1711',
    textSecondary: '#746656',
  },
  dark: {
    base: 'dark',
    bgBase: '#0a0a0a',
    bgPanel: '#141414',
    bgElevated: '#242424',
    border: '#3d3d3d',
    text: '#ffffff',
    textSecondary: '#a3a3a3',
  },
  'deep-blue': {
    base: 'dark',
    bgBase: '#0c111d',
    bgPanel: '#1a2231',
    bgElevated: '#1d2939',
    border: '#344054',
    text: '#ffffff',
    textSecondary: '#98a2b3',
  },
};

const BRAND = '#465fff';

const build = (p: Palette): ThemeVars =>
  create({
    base: p.base,
    brandTitle: 'Cosmos design system',
    brandUrl: 'https://github.com/SckyzO/cosmos',
    brandTarget: '_blank',

    colorPrimary: BRAND,
    colorSecondary: BRAND,

    appBg: p.bgBase,
    appContentBg: p.bgPanel,
    appPreviewBg: p.bgBase,
    appBorderColor: p.border,
    appBorderRadius: 6,

    textColor: p.text,
    textInverseColor: p.bgBase,
    textMutedColor: p.textSecondary,

    barTextColor: p.textSecondary,
    barHoverColor: BRAND,
    barSelectedColor: BRAND,
    barBg: p.bgPanel,

    inputBg: p.bgElevated,
    inputBorder: p.border,
    inputTextColor: p.text,
    inputBorderRadius: 6,
  });

const THEMES = Object.fromEntries(
  Object.entries(PALETTES).map(([name, palette]) => [name, build(palette)])
) as Record<CosmosTheme, ThemeVars>;

/** Chrome theme for a `theme` global value; unknown or unset → the default. */
export const chromeThemeFor = (name: unknown): ThemeVars =>
  typeof name === 'string' && name in THEMES ? THEMES[name as CosmosTheme] : THEMES[DEFAULT_THEME];
