import type { Preview } from '@storybook/react-vite';
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

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0c111d' },
        { name: 'light', value: '#f9fafb' },
      ],
    },
    a11y: { test: 'todo' },
    options: {
      // Sidebar group order — anything not listed lands at the bottom.
      // Aligns with the Storybook story-hierarchy convention.
      storySort: {
        // `Pages/Dashboard` is the landing — the first story Storybook opens
        // when the user arrives, showing a fully composed dashboard built
        // from real Cosmos components. Then `Welcome` (intro doc), then
        // groups ordered atomic-design-style.
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
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'dark',
      parentSelector: 'html',
    }),
  ],
};

export default preview;
