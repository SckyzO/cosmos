import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { expectFocusBorder, expectRefFocuses } from '../storybook-helpers';
import { NumberInput, type NumberInputProps } from './NumberInput';

const meta = {
  title: 'Forms/Number Input',
  component: NumberInput,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // A bare NumberInput has no label of its own: the stories name it, as a form row or an
  // `aria-label` does in an app.
  args: { value: 0, onChange: () => {}, 'aria-label': 'Value' },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 60, min: 1, max: 3600, step: 1, unit: 's' },
};

export const NoUnit: Story = { args: { value: 8, min: 1, max: 20, step: 1 } };
export const Disabled: Story = { args: { value: 42, unit: 'ms', disabled: true } };

/**
 * The field, dimmed when disabled, is `aria-disabled`: the unit belongs to an
 * inactive control, which axe then exempts from contrast.
 */
export const AriaDisabledFollowsDisabled: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex gap-4">
      <NumberInput aria-label="Enabled" value={42} onChange={() => {}} unit="ms" />
      <NumberInput aria-label="Disabled" value={42} onChange={() => {}} unit="ms" disabled />
      <NumberInput
        aria-label="Stacked disabled"
        controls="stacked"
        value={42}
        onChange={() => {}}
        unit="ms"
        disabled
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const field = (name: string) => canvas.getByRole('spinbutton', { name }).closest('.h-ctrl-36');
    await expect(field('Enabled')).not.toHaveAttribute('aria-disabled');
    for (const name of ['Disabled', 'Stacked disabled']) {
      await expect(field(name)).toHaveClass('opacity-50');
      await expect(field(name)).toHaveAttribute('aria-disabled', 'true');
    }
  },
};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState(60);
    return (
      <div>
        <NumberInput
          aria-label="Timeout"
          value={v}
          onChange={setV}
          min={1}
          max={3600}
          step={1}
          unit="s"
        />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Value: <code>{v}</code>
        </p>
      </div>
    );
  },
};

export const PlusFiresOnChange: Story = {
  tags: ['!dev'],
  args: { value: 10, min: 0, max: 100, step: 5, onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }));
    await expect(args.onChange).toHaveBeenCalledWith(15);
  },
};

export const MinusFiresOnChange: Story = {
  tags: ['!dev'],
  args: { value: 10, min: 0, max: 100, step: 5, onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Decrease' }));
    await expect(args.onChange).toHaveBeenCalledWith(5);
  },
};

/** `controls="stacked"`: ↑ / ↓ arrows stacked inside the right edge, left-aligned text. */
export const StackedDefault: Story = {
  args: {
    controls: 'stacked',
    value: 60,
    min: 5,
    max: 3600,
    step: 5,
    unit: 's',
    className: 'w-28',
  },
};

export const StackedNoUnit: Story = {
  args: { controls: 'stacked', value: 8, min: 1, max: 18, className: 'w-20' },
};

export const StackedDisabled: Story = {
  args: { controls: 'stacked', value: 60, unit: 's', disabled: true, className: 'w-28' },
};

export const StackedControlled: Story = {
  render: () => {
    const [v, setV] = useState(60);
    return (
      <div>
        <NumberInput
          aria-label="Timeout"
          controls="stacked"
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

export const StackedClickIncreaseFiresOnChange: Story = {
  tags: ['!dev'],
  args: {
    controls: 'stacked',
    value: 10,
    min: 0,
    max: 100,
    step: 5,
    onChange: fn(),
    className: 'w-28',
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }));
    await expect(args.onChange).toHaveBeenCalledWith(15);
  },
};

export const StackedClickDecreaseFiresOnChange: Story = {
  tags: ['!dev'],
  args: {
    controls: 'stacked',
    value: 10,
    min: 0,
    max: 100,
    step: 5,
    onChange: fn(),
    className: 'w-28',
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Decrease' }));
    await expect(args.onChange).toHaveBeenCalledWith(5);
  },
};

/**
 * A width set through `className` narrows the input, never the arrows: the
 * input used to keep its `w-20` and push the arrows under the rounded border.
 */
export const StackedNarrowWidthKeepsArrowsInside: Story = {
  tags: ['!dev'],
  args: {
    controls: 'stacked',
    value: 60,
    min: 5,
    max: 3600,
    step: 5,
    unit: 's',
    className: 'w-28',
  },
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
const Stateful = (props: NumberInputProps) => {
  const [value, setValue] = useState(props.value);
  return (
    <NumberInput
      {...props}
      value={value}
      onChange={(v) => {
        setValue(v);
        props.onChange?.(v);
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

// The behaviour stories above run unchanged against the stacked layout.
export const StackedFocusShowsAccentBorderInDark: Story = {
  tags: ['!dev'],
  ...FocusShowsAccentBorderInDark,
  args: { ...FocusShowsAccentBorderInDark.args, controls: 'stacked' },
};

export const StackedTypingPassesThroughInvalidValues: Story = {
  tags: ['!dev'],
  ...TypingPassesThroughInvalidValues,
  args: { ...TypingPassesThroughInvalidValues.args, controls: 'stacked' },
};

export const StackedTypingANegativeValue: Story = {
  tags: ['!dev'],
  ...TypingANegativeValue,
  args: { ...TypingANegativeValue.args, controls: 'stacked' },
};

export const StackedBlurClampsOrRestores: Story = {
  tags: ['!dev'],
  ...BlurClampsOrRestores,
  args: { ...BlurClampsOrRestores.args, controls: 'stacked' },
};

const numberRef = createRef<HTMLInputElement>();

/** The ref gets the number `<input>`, not a − / + button, and focusing through it works. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <NumberInput ref={numberRef} value={1} onChange={() => {}} aria-label="Quantity" />,
  play: async ({ canvas }) => {
    await expectRefFocuses(numberRef, canvas.getByRole('spinbutton', { name: 'Quantity' }));
  },
};

const stackedRef = createRef<HTMLInputElement>();

/** Same for `controls="stacked"`: the ref gets the number `<input>`, not an arrow button. */
export const StackedForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <NumberInput
      controls="stacked"
      ref={stackedRef}
      value={1}
      onChange={() => {}}
      aria-label="Quantity"
    />
  ),
  play: async ({ canvas }) => {
    await expectRefFocuses(stackedRef, canvas.getByRole('spinbutton', { name: 'Quantity' }));
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
    <div className="space-y-3">
      <div role="group" aria-label="Uncontrolled">
        <NumberInput aria-label="Replicas" defaultValue={5} max={6} onChange={args.onChange} />
      </div>
      <div role="group" aria-label="Controlled">
        <NumberInput aria-label="Replicas" value={10} onChange={args.onChange} />
      </div>
      <div role="group" aria-label="No default">
        <NumberInput aria-label="Replicas" min={3} />
      </div>
    </div>
  ),
  play: async ({ args, canvas }) => {
    const own = within(canvas.getByRole('group', { name: 'Uncontrolled' }));
    await expect(own.getByRole('spinbutton')).toHaveValue(5);
    await userEvent.click(own.getByRole('button', { name: 'Increase' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(6);
    await expect(own.getByRole('spinbutton')).toHaveValue(6);
    await expect(own.getByRole('button', { name: 'Increase' })).toBeDisabled();

    const held = within(canvas.getByRole('group', { name: 'Controlled' }));
    await userEvent.click(held.getByRole('button', { name: 'Increase' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(11);
    await expect(held.getByRole('spinbutton')).toHaveValue(10);

    // Without a default, 0 brought within min…max.
    const bare = within(canvas.getByRole('group', { name: 'No default' }));
    await expect(bare.getByRole('spinbutton')).toHaveValue(3);
  },
};
