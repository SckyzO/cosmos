import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { applyAppearance, type CosmosAccent } from '../settings/appearance';
import { ThemeToggleTri, type ThemeMode } from './ThemeToggleTri';

const meta = {
  title: 'Atoms/Theme Toggle Tri',
  component: ThemeToggleTri,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { theme: 'light', onChange: fn() },
} satisfies Meta<typeof ThemeToggleTri>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

export const Light: Story = { args: { theme: 'light' } };
export const Dark: Story = { args: { theme: 'dark' } };
export const DeepBlue: Story = { args: { theme: 'deep-blue' } };
export const Small: Story = { args: { theme: 'light', size: 'sm' } };

export const AllModes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <ThemeToggleTri theme="light" onChange={fn()} />
      <ThemeToggleTri theme="dark" onChange={fn()} />
      <ThemeToggleTri theme="deep-blue" onChange={fn()} />
    </div>
  ),
};

const MODES: readonly string[] = ['light', 'dark', 'deep-blue'];

const ControlledToggle = ({ initial }: { initial: ThemeMode }) => {
  const [theme, setTheme] = useState(initial);
  const onChange = (next: ThemeMode) => {
    setTheme(next);
    // The toggle only reports the next mode: applying it is the app's job.
    const accent = (document.documentElement.dataset.accent ?? 'blue') as CosmosAccent;
    applyAppearance({ theme: next, accent });
  };
  return (
    <div className="space-y-3">
      <ThemeToggleTri theme={theme} onChange={onChange} />
      <p className="text-xs text-[var(--color-text-muted)]">
        Current: <code>{theme}</code> — click cycles to the next mode and applies it to the page
      </p>
    </div>
  );
};

/** Starts from the toolbar theme (light when it's sand) and remounts when it changes. */
export const Controlled: Story = {
  render: (_args, { globals }) => {
    const initial = (MODES.includes(globals.theme) ? globals.theme : 'light') as ThemeMode;
    return <ControlledToggle key={initial} initial={initial} />;
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const LightClickFiresWithDark: Story = {
  args: { theme: 'light', onChange: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: /switch to dark mode/i });
    await expect(button).toHaveAttribute('data-theme', 'light');
    await userEvent.click(button);
    await expect(args.onChange).toHaveBeenCalledWith('dark');
  },
};

export const DarkClickFiresWithDeepBlue: Story = {
  args: { theme: 'dark', onChange: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: /switch to deep blue mode/i });
    await expect(button).toHaveAttribute('data-theme', 'dark');
    await userEvent.click(button);
    await expect(args.onChange).toHaveBeenCalledWith('deep-blue');
  },
};

export const DeepBlueClickWrapsToLight: Story = {
  args: { theme: 'deep-blue', onChange: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: /switch to light mode/i });
    await expect(button).toHaveAttribute('data-theme', 'deep-blue');
    await userEvent.click(button);
    await expect(args.onChange).toHaveBeenCalledWith('light');
  },
};
