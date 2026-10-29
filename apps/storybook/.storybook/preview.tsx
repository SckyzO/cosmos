import type { Decorator, Loader, Preview } from '@storybook/react-vite';

import {
  COSMOS_ACCENTS,
  COSMOS_DENSITIES,
  COSMOS_FONTS,
  COSMOS_RADII,
  COSMOS_TEXT_SIZES,
  COSMOS_THEMES,
} from '../../../packages/react/src';
import { CosmosDocsContainer } from './CosmosDocsContainer';
import { DEFAULT_THEME } from './cosmos-theme';

// Fonts (npm-distributed CSS via @fontsource — Vite handles @fontsource/*/x.css natively)
import '@fontsource/outfit/300.css';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
// The other fonts of the Font menu (the default, Outfit, is above).
import '@sckyzo/cosmos-theme/fonts/inter';
import '@sckyzo/cosmos-theme/fonts/plex';
import '@sckyzo/cosmos-theme/fonts/montserrat';
import '@sckyzo/cosmos-theme/fonts/open-sans';

// Tailwind 4 + Cosmos tokens (loaded via the @tailwindcss/vite plugin)
import './preview.css';

/**
 * Wrap each story with a Cosmos-themed surface so the component is
 * rendered on `--color-bg-base` even inside autodocs preview blocks
 * (which would otherwise show the docs container background). Stories
 * that explicitly opt into `layout: 'fullscreen'` (Shell, Modal, Drawer,
 * ErrorPage…) bypass the wrapper so they can paint the whole iframe
 * themselves.
 *
 * This complements the docs container (which themes the docs page chrome)
 * by ensuring the embedded story surface itself follows the Cosmos palette
 * regardless of where it's rendered.
 */
const withCosmosSurface: Decorator = (Story, ctx) => {
  const layout = ctx.parameters?.layout as string | undefined;
  if (layout === 'fullscreen') return <Story />;
  return (
    <div className="min-h-full bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">
      <Story />
    </div>
  );
};

/**
 * The class each theme puts on <html>: none for light, its id otherwise (the
 * rule `applyAppearance` follows).
 */
const THEMES = COSMOS_THEMES.map(({ id }) => ({ id, className: id === 'light' ? '' : id }));

/**
 * Put the `theme` global's class on <html>, as addon-themes'
 * withThemeByClassName did: remove the classes of the other themes, then add
 * the selected one; classes that are not theme classes stay. Unlike the addon
 * (an effect after render), it runs before the story renders, like
 * withAppearanceAttributes, so components read the right theme on mount.
 */
const withThemeClass: Decorator = (Story, ctx) => {
  const selected = (ctx.globals.theme as string | undefined) || DEFAULT_THEME;
  const root = document.documentElement;
  for (const t of THEMES) {
    if (t.id !== selected && t.className) root.classList.remove(t.className);
  }
  const current = THEMES.find((t) => t.id === selected)?.className;
  if (current) root.classList.add(current);
  return <Story />;
};

/**
 * Toolbar items from the appearance metadata (`COSMOS_THEMES` and the like),
 * titled `<menu>: <label>`: with `dynamicTitle` the button shows the selected
 * item's title, so the menu name stays visible once picked.
 */
const menuItems = (menu: string, items: { id: string; label: string }[]) =>
  items.map(({ id, label }) => ({ value: id, title: `${menu}: ${label}` }));

/** Sets `data-<key>` on <html>, or removes it for the theme's default value. */
const setRootData = (
  key: 'accent' | 'font' | 'textSize' | 'density' | 'radius',
  value: unknown,
  byDefault: string
) => {
  const root = document.documentElement;
  if (!value || value === byDefault) delete root.dataset[key];
  else root.dataset[key] = String(value);
};

/**
 * Apply the `accent`, `font`, `textSize`, `density` and `radius` toolbar globals as
 * data-accent, data-font, data-text-size, data-density and data-radius on <html>;
 * each default (blue, Outfit, md, default, default) removes its attribute. Set before the story renders so charts read the right
 * --color-brand-500 on mount.
 */
const withAppearanceAttributes: Decorator = (Story, ctx) => {
  setRootData('accent', ctx.globals.accent, 'blue');
  setRootData('font', ctx.globals.font, 'outfit');
  setRootData('textSize', ctx.globals.textSize, 'md');
  setRootData('density', ctx.globals.density, 'default');
  setRootData('radius', ctx.globals.radius, 'default');
  return <Story />;
};

/** The Direction menu: `dir` on <html>, the native attribute (no `data-*`). */
const DIRECTIONS = [
  { id: 'ltr', label: 'Left to right' },
  { id: 'rtl', label: 'Right to left' },
];

/**
 * Apply the `direction` toolbar global as `dir` on <html>; the default (ltr)
 * removes the attribute, so left to right renders as it did before the menu.
 * Set before the story renders, like the appearance attributes, so components
 * that read the direction in JavaScript get the right one on mount.
 */
const withDirection: Decorator = (Story, ctx) => {
  const root = document.documentElement;
  if (ctx.globals.direction === 'rtl') root.dir = 'rtl';
  else root.removeAttribute('dir');
  return <Story />;
};

/**
 * maplibre-gl 6 looks for its worker next to its own module, where no bundle puts it: without
 * this, a map draws nothing in the built Storybook. A story that sets `parameters.maplibre` gets
 * the worker bundled by Vite and handed to `setWorkerUrl`, as the react README tells apps to do.
 * The other stories never load MapLibre.
 */
const withMapLibreWorker: Loader = async ({ parameters }) => {
  if (!parameters.maplibre) return {};
  const [{ setWorkerUrl }, { default: workerUrl }] = await Promise.all([
    import('maplibre-gl'),
    import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
  ]);
  setWorkerUrl(workerUrl);
  return {};
};

/**
 * Viewport presets — first the Tailwind 4 breakpoints (the canonical contract
 * for any responsive utility used in Cosmos components), then a handful of
 * real-device sizes for spot-checking. Storybook 10 ships viewport in core
 * (no addon needed); these entries surface in the toolbar's viewport switcher.
 */
const tailwindViewports = {
  'tw-sm': { name: 'Tailwind sm — 640', styles: { width: '640px', height: '900px' } },
  'tw-md': { name: 'Tailwind md — 768', styles: { width: '768px', height: '1024px' } },
  'tw-lg': { name: 'Tailwind lg — 1024', styles: { width: '1024px', height: '768px' } },
  'tw-xl': { name: 'Tailwind xl — 1280', styles: { width: '1280px', height: '800px' } },
  'tw-2xl': { name: 'Tailwind 2xl — 1536', styles: { width: '1536px', height: '900px' } },
};

const deviceViewports = {
  mobile: { name: 'iPhone 15 (393×852)', styles: { width: '393px', height: '852px' } },
  tablet: { name: 'iPad (768×1024)', styles: { width: '768px', height: '1024px' } },
  laptop: { name: 'Laptop (1366×768)', styles: { width: '1366px', height: '768px' } },
  desktop: { name: 'Desktop (1920×1080)', styles: { width: '1920px', height: '1080px' } },
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: menuItems('Theme', COSMOS_THEMES),
        dynamicTitle: true,
      },
    },
    accent: {
      description: 'Accent color',
      toolbar: {
        title: 'Accent',
        icon: 'paintbrush',
        items: menuItems('Accent', COSMOS_ACCENTS),
        dynamicTitle: true,
      },
    },
    font: {
      description: 'Font family',
      toolbar: {
        title: 'Font',
        icon: 'paragraph',
        items: menuItems('Font', COSMOS_FONTS),
        dynamicTitle: true,
      },
    },
    textSize: {
      description: 'Text size',
      toolbar: {
        title: 'Size',
        icon: 'zoom',
        items: menuItems('Size', COSMOS_TEXT_SIZES),
        dynamicTitle: true,
      },
    },
    density: {
      description: 'Density',
      toolbar: {
        title: 'Density',
        icon: 'listunordered',
        items: menuItems('Density', COSMOS_DENSITIES),
        dynamicTitle: true,
      },
    },
    radius: {
      description: 'Corner radius',
      toolbar: {
        title: 'Radius',
        icon: 'circlehollow',
        items: menuItems('Radius', COSMOS_RADII),
        dynamicTitle: true,
      },
    },
    direction: {
      description: 'Text direction',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        items: menuItems('Direction', DIRECTIONS),
        dynamicTitle: true,
      },
    },
  },
  // `theme` set here so stories and the manager always read a value.
  initialGlobals: {
    accent: 'blue',
    theme: DEFAULT_THEME,
    font: 'outfit',
    textSize: 'md',
    density: 'default',
    radius: 'default',
    direction: 'ltr',
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: { ...tailwindViewports, ...deviceViewports },
      defaultViewport: 'reset',
    },
    a11y: { test: 'error' },
    // Docs pages (prose, prop tables, code blocks) follow the toolbar theme.
    docs: { container: CosmosDocsContainer },
    options: {
      // `Pages/Examples/Dashboard` is the landing — the first story Storybook opens
      // when the user arrives. Then `Welcome` (intro doc), then the rest
      // ordered atomic-design-style.
      storySort: {
        order: [
          'Welcome',
          'Pages',
          'Foundations',
          'Typography',
          'Atoms',
          'Actions',
          'Forms',
          'Data',
          'Media',
          'Status',
          'Monitoring',
          'Feedback',
          'Overlays',
          'Navigation',
          'Layout',
          'Lists',
          'Chat',
          'Tables',
          'Settings',
          'Charts',
        ],
        method: 'alphabetical',
      },
    },
  },
  loaders: [withMapLibreWorker],
  decorators: [
    withCosmosSurface,
    withAppearanceAttributes,
    withDirection,
    // The manager and the docs chrome follow the same global (manager.ts,
    // CosmosDocsContainer.tsx).
    withThemeClass,
  ],
};

export default preview;
