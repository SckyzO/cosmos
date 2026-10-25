import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { ThemeToggle } from './ThemeToggle';

const meta = {
  title: 'Settings/Theme Toggle',
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
  tags: ['!dev'],
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
  tags: ['!dev'],
  args: { isDark: true, onChange: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: /switch to light mode/i });
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(button);
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith(false);
  },
};

/** Click, Enter and Space each call `onChange` with the next value of `isDark`. */
export const EveryActivationPassesTheNextValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: { isDark: false, onChange: fn() },
  render: (args) => {
    const [dark, setDark] = useState(args.isDark);
    return (
      <ThemeToggle
        isDark={dark}
        onChange={(next) => {
          args.onChange(next);
          setDark(next);
        }}
      />
    );
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /switch to dark mode/i }));
    await expect(args.onChange).toHaveBeenLastCalledWith(true);

    canvas.getByRole('button', { name: /switch to light mode/i }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(false);
    await userEvent.keyboard(' ');
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    await expect(args.onChange).toHaveBeenCalledTimes(3);
  },
};
