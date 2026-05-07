import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

/**
 * Manager (sidebar + toolbar) theme.
 *
 * Storybook's `addon-themes` only flips the iframe (preview canvas) between
 * `light` and `dark` via the `<html>` class. The manager UI lives in a
 * separate React app and needs its own theme — set here once.
 *
 * We use the dark Cosmos palette so the entire Storybook app matches the
 * default `addon-themes` selection.
 */
const cosmosDark = create({
  base: 'dark',
  brandTitle: 'Cosmos design system',
  brandUrl: 'https://github.com/SckyzO/cosmos',
  brandTarget: '_blank',

  // Cosmos palette (matches @sckyzo/cosmos-theme tokens)
  colorPrimary: '#465fff', // brand-500
  colorSecondary: '#465fff',

  appBg: '#0c111d', // bg-base
  appContentBg: '#101828', // bg-panel
  appPreviewBg: '#0c111d',
  appBorderColor: '#1f2937', // border subtle
  appBorderRadius: 6,

  textColor: '#e5e7eb',
  textInverseColor: '#0c111d',
  textMutedColor: '#9ca3af',

  barTextColor: '#9ca3af',
  barHoverColor: '#465fff',
  barSelectedColor: '#465fff',
  barBg: '#101828',

  inputBg: '#1f2937',
  inputBorder: '#374151',
  inputTextColor: '#f9fafb',
  inputBorderRadius: 6,
});

addons.setConfig({
  theme: cosmosDark,
  sidebar: {
    showRoots: true,
  },
});
