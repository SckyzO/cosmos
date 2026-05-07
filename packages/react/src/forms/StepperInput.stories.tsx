import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { StepperInput } from './StepperInput';

const meta = {
  title: 'Forms/Stepper Input',
  component: StepperInput,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: 0, onChange: () => {} },
} satisfies Meta<typeof StepperInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 60, min: 5, max: 3600, step: 5, unit: 's', className: 'w-28' },
};

export const NoUnit: Story = { args: { value: 8, min: 1, max: 18, className: 'w-20' } };
export const Disabled: Story = {
  args: { value: 60, unit: 's', disabled: true, className: 'w-28' },
};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState(60);
    return (
      <div>
        <StepperInput
          value={v}
          onChange={setV}
          min={5}
          max={3600}
          step={5}
          unit="s"
          className="w-28"
        />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Value: <code>{v}</code>
        </p>
      </div>
    );
  },
};

export const ClickIncreaseFiresOnChange: Story = {
  args: { value: 10, min: 0, max: 100, step: 5, onChange: fn(), className: 'w-28' },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }));
    await expect(args.onChange).toHaveBeenCalledWith(15);
  },
};

export const ClickDecreaseFiresOnChange: Story = {
  args: { value: 10, min: 0, max: 100, step: 5, onChange: fn(), className: 'w-28' },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Decrease' }));
    await expect(args.onChange).toHaveBeenCalledWith(5);
  },
};
