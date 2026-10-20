import type { Decorator, Preview } from '@storybook/react-vite';
import { withThemeByClassName } from '@storybook/addon-themes';

import { cosmosDarkTheme } from './cosmos-theme';

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
 * This complements `parameters.docs.theme` (which themes the docs page
 * chrome) by ensuring the embedded story surface itself follows the
 * Cosmos palette regardless of where it's rendered.
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
 * Accent colors, in the order a picker shows them: red, orange, amber and
 * green look like the status colors, so they come last. Mirrors the
 * [data-accent] blocks in @sckyzo/cosmos-theme/vars.
 */
const ACCENTS = [
  { value: 'blue', title: 'Blue' },
  { value: 'indigo', title: 'Indigo' },
  { value: 'violet', title: 'Violet' },
  { value: 'purple', title: 'Purple' },
  { value: 'rose', title: 'Rose' },
  { value: 'teal', title: 'Teal' },
  { value: 'cyan', title: 'Cyan' },
  { value: 'graphite', title: 'Graphite' },
  { value: 'red', title: 'Red' },
  { value: 'orange', title: 'Orange' },
  { value: 'amber', title: 'Amber' },
  { value: 'green', title: 'Green' },
];

/**
 * Apply the `accent` toolbar global as `data-accent` on <html>. Blue is the
 * theme default, so it removes the attribute. Set before the story renders so
 * charts read the right --color-brand-500 on mount. Not a second addon-themes
 * decorator: that would share the `theme` global with the class switcher.
 */
const withAccent: Decorator = (Story, ctx) => {
  const accent = ctx.globals.accent as string | undefined;
  const root = document.documentElement;
  if (!accent || accent === 'blue') delete root.dataset.accent;
  else root.dataset.accent = accent;
  return <Story />;
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
    accent: {
      description: 'Accent color',
      toolbar: {
        title: 'Accent',
        icon: 'paintbrush',
        items: ACCENTS,
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { accent: 'blue' },
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
    // Restore the dark docs chrome that was here before — removing it made every
    // autodocs page (prop tables, code blocks) light by default, which broke the
    // visual consistency users were relying on. The Welcome page no longer needs
    // the toggle to flow through here because it lives in a story iframe now
    // (Welcome.stories.tsx), so `withThemeByClassName` reaches it natively.
    docs: { theme: cosmosDarkTheme },
    options: {
      // `Pages/Dashboard` is the landing — the first story Storybook opens
      // when the user arrives. Then `Welcome` (intro doc), then the rest
      // ordered atomic-design-style.
      storySort: {
        order: [
          'Welcome',
          'Pages',
          'Foundations',
          'Typography',
          'Atoms',
          'Forms',
          'Data',
          'Status',
          'Feedback',
          'Overlays',
          'Navigation',
          'Actions',
          'Layout',
          'Lists',
          'Tables',
          'Settings',
          'Charts',
        ],
        method: 'alphabetical',
      },
    },
  },
  decorators: [
    withCosmosSurface,
    withAccent,
    // deep-blue by default: it keeps the navy look that matches the docs
    // chrome (cosmosDarkTheme).
    withThemeByClassName({
      themes: { light: '', sand: 'sand', dark: 'dark', 'deep-blue': 'deep-blue' },
      defaultTheme: 'deep-blue',
      parentSelector: 'html',
    }),
  ],
};

export default preview;
