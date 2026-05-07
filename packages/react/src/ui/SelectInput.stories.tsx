import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { SelectInput } from './SelectInput';

const meta = {
  title: 'Atoms/Select Input',
  component: SelectInput,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: '', onChange: () => {}, options: [] },
} satisfies Meta<typeof SelectInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { label: '15s', value: '15' },
  { label: '30s', value: '30' },
  { label: '1m', value: '60' },
  { label: '5m', value: '300' },
];

export const Default: Story = {
  args: { value: '15', options: OPTIONS },
};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState('15');
    return (
      <div>
        <SelectInput value={v} onChange={setV} options={OPTIONS} />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Current: <code>{v}</code>
        </p>
      </div>
    );
  },
};

export const ChangingValueFiresOnChange: Story = {
  args: { value: '15', options: OPTIONS, onChange: fn() },
  play: async ({ args, canvas }) => {
    const select = canvas.getByRole('combobox');
    await userEvent.selectOptions(select, '60');
    await expect(args.onChange).toHaveBeenCalledWith('60');
  },
};
