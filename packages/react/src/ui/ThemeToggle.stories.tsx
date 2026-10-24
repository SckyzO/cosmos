import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { ThemeToggle } from './ThemeToggle';

const meta = {
  title: 'Atoms/Theme Toggle',
  component: ThemeToggle,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { isDark: false, onChange: fn() },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LightMode: Story = { args: { isDark: false } };
export const DarkMode: Story = { args: { isDark: true } };
export const Small: Story = { args: { isDark: false, size: 'sm' } };
export const SmallDark: Story = { args: { isDark: true, size: 'sm' } };

export const Controlled: Story = {
  render: (args) => {
    const [dark, setDark] = useState(args.isDark);
    return (
      <div className="space-y-2">
        <ThemeToggle isDark={dark} onChange={setDark} />
        <p className="text-xs text-[var(--color-text-muted)]">
          Current: <code>{dark ? 'dark' : 'light'}</code>
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickFiresOnChange: Story = {
  args: { isDark: false, onChange: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: /switch to dark mode/i });
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(button);
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith(true);
  },
};

export const DarkClickFiresOnChange: Story = {
  args: { isDark: true, onChange: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: /switch to light mode/i });
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(button);
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith(false);
  },
};
