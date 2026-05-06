import type { Preview } from '@storybook/react-vite';
import { withThemeByClassName } from '@storybook/addon-themes';

// Cosmos theme — order matters: fonts → tailwind tokens → tailwind itself → app-level CSS vars.
import '@sckyzo/cosmos-theme/fonts';
import '@sckyzo/cosmos-theme/tailwind';
import 'tailwindcss';
import '@sckyzo/cosmos-theme/vars';

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
    a11y: {
      // Don't fail story render on a11y violations — surface them as warnings.
      test: 'todo',
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
