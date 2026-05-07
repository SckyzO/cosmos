import type { Decorator, Preview } from '@storybook/react-vite';
import { withThemeByClassName } from '@storybook/addon-themes';

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

import { cosmosDarkTheme } from './cosmos-theme';

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

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: { test: 'todo' },
    // Per Storybook 10 docs: `parameters.docs.theme` controls the docs
    // page chrome (autodocs MDX, code blocks, sidebar within the docs).
    // Reuse the same Cosmos palette as the manager so chrome and content
    // match.
    // https://storybook.js.org/docs/configure/user-interface/theming#themed-docs
    docs: { theme: cosmosDarkTheme },
    options: {
      // `Pages/Dashboard` is the landing — the first story Storybook opens
      // when the user arrives. Then `Welcome` (intro doc), then the rest
      // ordered atomic-design-style.
      storySort: {
        order: [
          'Pages',
          'Welcome',
          'Foundations',
          'Atoms',
          'Status',
          'Forms',
          'Feedback',
          'Overlays',
          'Navigation',
          'Actions',
          'Data',
          'Tables',
          'Layout',
          'Lists',
          'Settings',
          'Charts',
        ],
        method: 'alphabetical',
      },
    },
  },
  decorators: [
    withCosmosSurface,
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'dark',
      parentSelector: 'html',
    }),
  ],
};

export default preview;
