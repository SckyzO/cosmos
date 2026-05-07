import { addons } from 'storybook/manager-api';
import { cosmosDarkTheme } from './cosmos-theme';

/**
 * Manager (sidebar + toolbar) theme.
 *
 * Storybook's `addon-themes` only flips the iframe (preview canvas) between
 * `light` and `dark` via the `<html>` class. The manager UI lives in a
 * separate React app and needs its own theme — set here once.
 *
 * The same theme is reused for the docs page chrome (via
 * `parameters.docs.theme` in `preview.tsx`) so the entire Storybook app
 * shares one Cosmos palette.
 */
addons.setConfig({
  theme: cosmosDarkTheme,
  sidebar: { showRoots: true },
});
