import { create } from 'storybook/theming';

/**
 * Cosmos Storybook theme — used for both the **manager** UI (sidebar +
 * toolbar) via `manager.ts` and the **docs** page chrome (autodocs MDX +
 * code blocks) via `parameters.docs.theme` in `preview.tsx`.
 *
 * Keeping a single source of truth means the story canvas, the manager
 * and the docs page all share the same Cosmos palette. Hex values mirror
 * the `@sckyzo/cosmos-theme` design tokens.
 */
export const cosmosDarkTheme = create({
  base: 'dark',
  brandTitle: 'Cosmos design system',
  brandUrl: 'https://github.com/SckyzO/cosmos',
  brandTarget: '_blank',

  colorPrimary: '#465fff',
  colorSecondary: '#465fff',

  appBg: '#0c111d', // bg-base
  appContentBg: '#101828', // bg-panel
  appPreviewBg: '#0c111d',
  appBorderColor: '#1f2937',
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
