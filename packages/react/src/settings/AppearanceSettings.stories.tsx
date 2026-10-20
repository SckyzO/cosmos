import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { AppearanceSettings } from './AppearanceSettings';
import { COSMOS_ACCENTS, COSMOS_THEMES, type CosmosAccent, type CosmosTheme } from './appearance';

const meta = {
  title: 'Settings/Appearance Settings',
  component: AppearanceSettings,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    theme: 'light',
    accent: 'blue',
    onThemeChange: fn(),
    onAccentChange: fn(),
  },
} satisfies Meta<typeof AppearanceSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {};

export const CustomLabels: Story = {
  args: { themeLabel: 'Color scheme', accentLabel: 'Highlight color' },
};

/** `themes` / `accents` narrow the choice, e.g. dark themes and cool accents only. */
export const RestrictedChoices: Story = {
  args: {
    theme: 'deep-blue',
    accent: 'teal',
    themes: COSMOS_THEMES.filter((t) => t.dark),
    accents: COSMOS_ACCENTS.filter((a) => ['blue', 'teal', 'cyan', 'graphite'].includes(a.id)),
  },
};

export const Controlled: Story = {
  render: () => {
    const [theme, setTheme] = useState<CosmosTheme>('light');
    const [accent, setAccent] = useState<CosmosAccent>('blue');
    return (
      <div className="space-y-4">
        <AppearanceSettings
          theme={theme}
          accent={accent}
          onThemeChange={setTheme}
          onAccentChange={setAccent}
        />
        <p className="text-xs text-[var(--color-text-secondary)]">
          Selected: <code>{theme}</code> / <code>{accent}</code>
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const GroupsAreLabelled: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('group', { name: 'Theme' })).toBeInTheDocument();
    await expect(canvas.getByRole('group', { name: 'Accent color' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Light' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  },
};

export const ClickSandFiresThemeChange: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Sand' }));
    await expect(args.onThemeChange).toHaveBeenCalledWith('sand');
    await expect(args.onAccentChange).not.toHaveBeenCalled();
  },
};

export const ClickTealFiresAccentChange: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Teal' }));
    await expect(args.onAccentChange).toHaveBeenCalledWith('teal');
    await expect(args.onThemeChange).not.toHaveBeenCalled();
  },
};
