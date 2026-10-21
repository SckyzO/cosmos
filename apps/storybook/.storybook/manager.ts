import { addons } from 'storybook/manager-api';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import { DEFAULT_THEME, chromeThemeFor } from './cosmos-theme';

/**
 * Manager (sidebar + toolbar) theme.
 *
 * `addon-themes` only switches the preview iframe (the class on its <html>).
 * The manager is a separate React app, so it follows the same `theme` global
 * here: SET_GLOBALS carries the initial value (URL globals included),
 * GLOBALS_UPDATED every toolbar change, and `setOptions` re-themes the UI live.
 */
addons.setConfig({
  theme: chromeThemeFor(DEFAULT_THEME),
  sidebar: { showRoots: true },
});

addons.register('cosmos/chrome-theme', (api) => {
  const follow = ({ globals }: { globals: Record<string, unknown> }) =>
    api.setOptions({ theme: chromeThemeFor(globals.theme) });
  api.on(SET_GLOBALS, follow);
  api.on(GLOBALS_UPDATED, follow);
});
