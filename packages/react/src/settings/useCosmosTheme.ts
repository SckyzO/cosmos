import { useSyncExternalStore } from 'react';
import { COSMOS_THEMES, type CosmosTheme, isDarkTheme } from './appearance';

// The theme is a class on <html> (none = light), so it is read from the DOM
// rather than a context: an app may switch it with `applyAppearance` or by hand.
const readTheme = (): CosmosTheme => {
  const { classList } = document.documentElement;
  return COSMOS_THEMES.find((t) => t.id !== 'light' && classList.contains(t.id))?.id ?? 'light';
};

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};

const getSnapshot = (): 'light' | 'dark' => (isDarkTheme(readTheme()) ? 'dark' : 'light');
const getServerSnapshot = (): 'light' | 'dark' => 'light';

/** `'dark'` under the dark Cosmos themes (`.dark`, `.deep-blue`), `'light'` otherwise. */
export const useCosmosTheme = (): 'light' | 'dark' =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
