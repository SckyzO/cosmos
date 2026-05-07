import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { expect, fn, userEvent } from 'storybook/test';
import { Input } from './Input';

const meta = {
  title: 'Forms/Input',
  component: Input,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { placeholder: 'Type here…' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Email', placeholder: 'user@example.com' },
};

export const WithIcon: Story = {
  args: { label: 'Email', icon: Mail, placeholder: 'user@example.com' },
};

export const WithDescription: Story = {
  args: {
    label: 'Email',
    icon: Mail,
    placeholder: 'user@example.com',
    description: 'We will never share your email.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Endpoint URL',
    placeholder: 'https://prom.example.com',
    error: 'Must start with https://',
  },
};

export const WithRightSlot: Story = {
  args: {
    label: 'Scrape interval',
    placeholder: '15',
    type: 'number',
    rightSlot: 'seconds',
  },
};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState('');
    return (
      <div className="max-w-md">
        <Input
          label="Search"
          placeholder="Type to filter…"
          value={v}
          onChange={(e) => setV(e.target.value)}
        />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Value: <code>{v || '(empty)'}</code>
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const TypingFiresOnChange: Story = {
  args: { label: 'Name', placeholder: 'Your name', onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByLabelText('Name');
    await userEvent.type(input, 'Tom');
    // onChange called once per keystroke
    await expect(args.onChange).toHaveBeenCalledTimes(3);
  },
};
