import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { PasswordInput } from './PasswordInput';

const meta = {
  title: 'Forms/Password Input',
  component: PasswordInput,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: 'Password', placeholder: '••••••••' },
} satisfies Meta<typeof PasswordInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHelp: Story = {
  args: {
    label: 'Current password',
    helpText: 'We use this to confirm it’s really you before applying changes.',
  },
};

export const WithDescription: Story = {
  args: {
    label: 'New password',
    description: 'Use 12+ characters with a mix of letters, numbers and symbols.',
    autoComplete: 'new-password',
  },
};

export const WithError: Story = {
  args: { label: 'Password', error: 'Incorrect password — please try again.' },
};

export const Disabled: Story = {
  args: { label: 'Password', disabled: true, defaultValue: 'hidden-secret' },
};

export const Controlled: Story = {
  render: (args) => {
    const [v, setV] = useState('');
    return (
      <div className="max-w-md space-y-3">
        <PasswordInput {...args} value={v} onChange={(e) => setV(e.target.value)} />
        <p className="text-xs text-[var(--color-text-muted)]">
          Length: <code>{v.length}</code>
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ToggleVisibility: Story = {
  args: { label: 'Password', defaultValue: 'p4ssw0rd!' },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Password') as HTMLInputElement;
    await expect(input).toHaveAttribute('type', 'password');
    const toggle = canvas.getByRole('button', { name: /show password/i });
    await userEvent.click(toggle);
    await expect(input).toHaveAttribute('type', 'text');
    await expect(canvas.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /hide password/i }));
    await expect(input).toHaveAttribute('type', 'password');
  },
};

export const TypingFiresOnChange: Story = {
  args: { label: 'Password', onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByLabelText('Password');
    await userEvent.type(input, 'abc');
    await expect(args.onChange).toHaveBeenCalledTimes(3);
  },
};

export const DisabledBlocksToggle: Story = {
  args: { label: 'Password', disabled: true, defaultValue: 'secret' },
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole('button', { name: /show password/i });
    await expect(toggle).toBeDisabled();
  },
};
