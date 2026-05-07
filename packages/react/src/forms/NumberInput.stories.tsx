import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { NumberInput } from './NumberInput';

const meta = {
  title: 'Forms/Number Input',
  component: NumberInput,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: 0, onChange: () => {} },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 60, min: 1, max: 3600, step: 1, unit: 's' },
};

export const NoUnit: Story = { args: { value: 8, min: 1, max: 20, step: 1 } };
export const Disabled: Story = { args: { value: 42, unit: 'ms', disabled: true } };

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState(60);
    return (
      <div>
        <NumberInput value={v} onChange={setV} min={1} max={3600} step={1} unit="s" />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Value: <code>{v}</code>
        </p>
      </div>
    );
  },
};

export const PlusFiresOnChange: Story = {
  args: { value: 10, min: 0, max: 100, step: 5, onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }));
    await expect(args.onChange).toHaveBeenCalledWith(15);
  },
};

export const MinusFiresOnChange: Story = {
  args: { value: 10, min: 0, max: 100, step: 5, onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Decrease' }));
    await expect(args.onChange).toHaveBeenCalledWith(5);
  },
};
