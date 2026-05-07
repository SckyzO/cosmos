import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { SearchInput } from './SearchInput';

const meta = {
  title: 'Forms/Search Input',
  component: SearchInput,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: '', onChange: () => {}, placeholder: 'Search…' },
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: '', placeholder: 'Search resources…' },
};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState('');
    return (
      <div className="max-w-md">
        <SearchInput value={v} onChange={setV} placeholder="Search…" />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Value: <code>{v || '(empty)'}</code>
        </p>
      </div>
    );
  },
};

export const TypingFiresOnChange: Story = {
  args: { onChange: fn(), placeholder: 'Search…' },
  play: async ({ args, canvas }) => {
    const input = canvas.getByPlaceholderText('Search…');
    await userEvent.type(input, 'cosmos');
    await expect(args.onChange).toHaveBeenCalled();
  },
};
