import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
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
export const Oled: Story = { args: { theme: 'oled' } };
export const Small: Story = { args: { theme: 'light', size: 'sm' } };

export const AllThemes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <ThemeToggleTri theme="light" onChange={fn()} />
      <ThemeToggleTri theme="dark" onChange={fn()} />
      <ThemeToggleTri theme="oled" onChange={fn()} />
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [theme, setTheme] = useState<ThemeMode>('light');
    return (
      <div className="space-y-3">
        <ThemeToggleTri theme={theme} onChange={setTheme} />
        <p className="text-xs text-[var(--color-text-muted)]">
          Current: <code>{theme}</code> — click cycles to next
        </p>
      </div>
    );
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

export const DarkClickFiresWithOled: Story = {
  args: { theme: 'dark', onChange: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: /switch to oled mode/i });
    await expect(button).toHaveAttribute('data-theme', 'dark');
    await userEvent.click(button);
    await expect(args.onChange).toHaveBeenCalledWith('oled');
  },
};

export const OledClickWrapsToLight: Story = {
  args: { theme: 'oled', onChange: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: /switch to light mode/i });
    await expect(button).toHaveAttribute('data-theme', 'oled');
    await userEvent.click(button);
    await expect(args.onChange).toHaveBeenCalledWith('light');
  },
};
