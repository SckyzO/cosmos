import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { expectFocusBorder, expectRefFocuses } from '../storybook-helpers';
import { StepperInput, type StepperInputProps } from './StepperInput';

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

/**
 * A width set through `className` narrows the input, never the arrows: the
 * input used to keep its `w-20` and push the arrows under the rounded border.
 */
export const NarrowWidthKeepsArrowsInside: Story = {
  args: { value: 60, min: 5, max: 3600, step: 5, unit: 's', className: 'w-28' },
  play: async ({ canvas }) => {
    const increase = canvas.getByRole('button', { name: 'Increase' });
    const control = increase.closest('div')?.parentElement as HTMLElement;
    await expect(control.scrollWidth).toBeLessThanOrEqual(control.clientWidth);
    await expect(increase.getBoundingClientRect().right).toBeLessThanOrEqual(
      control.getBoundingClientRect().right
    );
  },
};

// The inner input drops its outline: the wrapper shows focus with its border (#151).
export const FocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { value: 5 },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('spinbutton');
    await expectFocusBorder(input, { border: input.closest('.rounded-lg') as HTMLElement });
  },
};

/** Owns the value, like an app does: what `onChange` reports comes back as `value`. */
const Stateful = (props: StepperInputProps) => {
  const [value, setValue] = useState(props.value);
  return (
    <StepperInput
      {...props}
      value={value}
      onChange={(v) => {
        setValue(v);
        props.onChange(v);
      }}
    />
  );
};

/**
 * Typing passes through an empty field and values outside the range on the way
 * to a valid one; only valid values reach `onChange` (#151).
 */
export const TypingPassesThroughInvalidValues: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: 20, min: 10, max: 100, onChange: fn() },
  render: (args) => <Stateful {...args} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('spinbutton');
    await userEvent.clear(input);
    await expect(input).toHaveValue(null);
    await userEvent.type(input, '50');
    await expect(input).toHaveValue(50);
    await expect(args.onChange).toHaveBeenLastCalledWith(50);
    await expect(args.onChange).not.toHaveBeenCalledWith(5);
  },
};

/** A negative value can be typed sign first. */
export const TypingANegativeValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: 20, min: -10, max: 100, onChange: fn() },
  render: (args) => <Stateful {...args} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '-3');
    await expect(input).toHaveValue(-3);
    await expect(args.onChange).toHaveBeenLastCalledWith(-3);
  },
};

/** Leaving the field brings an out-of-range value into the range, and an empty field back to the value. */
export const BlurClampsOrRestores: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: 20, min: 10, max: 100, onChange: fn() },
  render: (args) => <Stateful {...args} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '5');
    await userEvent.tab();
    await expect(input).toHaveValue(10);
    await expect(args.onChange).toHaveBeenLastCalledWith(10);

    await userEvent.clear(input);
    await userEvent.type(input, '500');
    await userEvent.tab();
    await expect(input).toHaveValue(100);
    await expect(args.onChange).toHaveBeenLastCalledWith(100);

    await userEvent.clear(input);
    await userEvent.tab();
    await expect(input).toHaveValue(100);
  },
};

const stepperRef = createRef<HTMLInputElement>();

/** The ref gets the number `<input>`, not an arrow button, and focusing through it works. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <StepperInput ref={stepperRef} value={1} onChange={() => {}} aria-label="Quantity" />
  ),
  play: async ({ canvas }) => {
    await expectRefFocuses(stepperRef, canvas.getByRole('spinbutton', { name: 'Quantity' }));
  },
};
