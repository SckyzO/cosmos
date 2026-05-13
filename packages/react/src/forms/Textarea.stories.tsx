import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { Textarea } from './Textarea';

const meta = {
  title: 'Forms/Textarea',
  component: Textarea,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { placeholder: 'Type a message…' },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Message', placeholder: 'Type a message…' },
};

export const WithDescription: Story = {
  args: {
    label: 'Bio',
    description: 'A short description that appears on your profile.',
    placeholder: 'Tell us about yourself…',
  },
};

export const WithError: Story = {
  args: {
    label: 'Comment',
    error: 'Comment cannot be empty.',
    defaultValue: '',
  },
};

export const WithMaxLength: Story = {
  args: {
    label: 'Tweet',
    maxLength: 280,
    description: 'Up to 280 characters.',
    defaultValue: 'Cosmos design system in action — keep it terse.',
  },
};

export const ShowCountWithoutMax: Story = {
  args: {
    label: 'Free-form notes',
    showCount: true,
    defaultValue: 'Counts characters as you type.',
  },
};

export const NoResize: Story = {
  args: { label: 'Locked size', resize: 'none', rows: 3 },
};

export const Disabled: Story = {
  args: { label: 'Read-only', disabled: true, defaultValue: 'You cannot edit me.' },
};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState('');
    return (
      <div className="max-w-md">
        <Textarea
          label="Bio"
          maxLength={120}
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="Type to see counter…"
        />
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          Length: <code>{v.length}</code>
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const TypingFiresOnChange: Story = {
  args: { label: 'Message', onChange: fn() },
  play: async ({ args, canvas }) => {
    const ta = canvas.getByLabelText('Message');
    await userEvent.type(ta, 'hi');
    await expect(args.onChange).toHaveBeenCalledTimes(2);
  },
};

export const CounterUpdatesAsYouType: Story = {
  args: { label: 'Note', maxLength: 50 },
  play: async ({ canvas }) => {
    const ta = canvas.getByLabelText('Note');
    await userEvent.type(ta, 'hello');
    await expect(canvas.getByText('5 / 50')).toBeInTheDocument();
  },
};
