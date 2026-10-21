import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, userEvent } from 'storybook/test';
import {
  AppearanceSettings,
  Button,
  applyAppearance,
  type CosmosAccent,
  type CosmosTheme,
} from '../../../packages/react/src';

const meta = {
  title: 'Foundations/Appearance',
  parameters: {
    docs: {
      description: {
        component:
          'Pick a theme and an accent: `applyAppearance` sets them on `<html>`, so the ' +
          'whole page follows. The toolbar menus reset the page to their own values.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

type PlaygroundProps = { initialTheme: CosmosTheme; initialAccent: CosmosAccent };

const AppearancePlayground = ({ initialTheme, initialAccent }: PlaygroundProps) => {
  const [theme, setTheme] = useState(initialTheme);
  const [accent, setAccent] = useState(initialAccent);
  useEffect(() => applyAppearance({ theme, accent }), [theme, accent]);

  return (
    <div className="max-w-3xl space-y-8">
      <AppearanceSettings
        theme={theme}
        accent={accent}
        onThemeChange={setTheme}
        onAccentChange={setAccent}
      />
      <section aria-label="Sample" className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="secondary">Secondary</Button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Body text with{' '}
          <a href="#appearance" className="text-brand-600 dark:text-brand-400 hover:underline">
            a link
          </a>{' '}
          in the accent color.
        </p>
      </section>
    </div>
  );
};

// Start from the toolbar's values; changing them remounts the playground.
const renderPlayground: Story['render'] = (_args, { globals }) => {
  const theme = (globals.theme || 'dark') as CosmosTheme;
  const accent = (globals.accent || 'blue') as CosmosAccent;
  return (
    <AppearancePlayground key={`${theme}-${accent}`} initialTheme={theme} initialAccent={accent} />
  );
};

export const Default: Story = { render: renderPlayground };

// ── Interaction tests ────────────────────────────────────────────────────────

export const PickingAppliesToDocument: Story = {
  render: renderPlayground,
  play: async ({ canvas }) => {
    const root = document.documentElement;
    await userEvent.click(canvas.getByRole('button', { name: 'Sand' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Teal' }));
    await expect(root).toHaveClass('sand');
    await expect(root).not.toHaveClass('dark');
    await expect(root).toHaveAttribute('data-accent', 'teal');

    await userEvent.click(canvas.getByRole('button', { name: 'Light' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Blue' }));
    await expect(root).not.toHaveClass('sand');
    await expect(root).not.toHaveAttribute('data-accent');
  },
};
