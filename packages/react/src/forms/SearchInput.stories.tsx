import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import {
  expectFocusBorder,
  expectPlaceholderContrast,
  expectRefFocuses,
  inEachTheme,
} from '../storybook-helpers';
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

// In the dark themes `dark:border-*` used to win over `focus:border-*` (#151).
export const FocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('textbox'));
  },
};

// Native placeholders sat under 4.5:1 on light and sand (#151).
export const PlaceholderContrastInEveryTheme: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    inEachTheme(() => expectPlaceholderContrast(input));
  },
};

const searchRef = createRef<HTMLInputElement>();

/** The ref gets the `<input>`, and focusing through it works. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <SearchInput ref={searchRef} value="" onChange={() => {}} />,
  play: async ({ canvas }) => {
    await expectRefFocuses(searchRef, canvas.getByPlaceholderText('Search…'));
  },
};

// ── Controlled or not (#151) ─────────────────────────────────────────────────
// Only `undefined` means uncontrolled. The uncontrolled instance starts from its
// default and moves on its own; the controlled one, held at a fixed value, reports
// the change and keeps showing the value it is given.

export const DefaultValueOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => (
    <div className="max-w-md space-y-3">
      <SearchInput aria-label="Uncontrolled" defaultValue="rack" onChange={args.onChange} />
      <SearchInput aria-label="Controlled" value="node" onChange={args.onChange} />
    </div>
  ),
  play: async ({ args, canvas }) => {
    const own = canvas.getByRole('textbox', { name: 'Uncontrolled' });
    await expect(own).toHaveValue('rack');
    await userEvent.type(own, '-1');
    await expect(args.onChange).toHaveBeenLastCalledWith('rack-1');
    await expect(own).toHaveValue('rack-1');

    const held = canvas.getByRole('textbox', { name: 'Controlled' });
    await userEvent.type(held, 's');
    await expect(args.onChange).toHaveBeenLastCalledWith('nodes');
    await expect(held).toHaveValue('node');
  },
};
