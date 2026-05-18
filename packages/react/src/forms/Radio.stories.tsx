import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { Radio, RadioGroup } from './Radio';

const meta = {
  title: 'Forms/Radio',
  component: Radio,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Option A', name: 'demo' } };

export const Checked: Story = {
  args: { label: 'Option B', name: 'demo2', defaultChecked: true },
};

export const WithDescription: Story = {
  args: {
    label: 'Pro plan',
    description: '$29 / month — unlimited members and 1 TB storage.',
    defaultChecked: true,
    name: 'demo3',
  },
};

export const Disabled: Story = {
  args: { label: 'Locked option', disabled: true, name: 'demo4' },
};

export const DisabledChecked: Story = {
  args: { label: 'Locked + selected', disabled: true, defaultChecked: true, name: 'demo5' },
};

export const Small: Story = {
  args: { label: 'Compact radio', size: 'sm', defaultChecked: true, name: 'demo6' },
};

// ── Group stories ────────────────────────────────────────────────────────────

const PLANS = [
  { value: 'free', label: 'Free', description: '0 € — 1 user, 100 MB' },
  { value: 'pro', label: 'Pro', description: '29 € / month — 10 users' },
  { value: 'team', label: 'Team', description: '99 € / month — unlimited' },
  { value: 'enterprise', label: 'Enterprise', description: 'Contact sales', disabled: true },
];

export const Group: Story = {
  render: () => <RadioGroup legend="Choose a plan" options={PLANS} defaultValue="pro" />,
};

export const GroupHorizontal: Story = {
  render: () => (
    <RadioGroup
      legend="Severity"
      orientation="horizontal"
      options={[
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' },
      ]}
      defaultValue="medium"
    />
  ),
};

export const GroupWithError: Story = {
  render: () => (
    <RadioGroup
      legend="Required choice"
      options={[
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
      ]}
      error="Please select an option."
    />
  ),
};

export const GroupControlled: Story = {
  render: () => {
    const [val, setVal] = useState<string | undefined>(undefined);
    return (
      <div className="space-y-3">
        <RadioGroup
          legend="Region"
          options={[
            { value: 'eu-west', label: 'EU West' },
            { value: 'us-east', label: 'US East' },
            { value: 'ap-south', label: 'AP South' },
          ]}
          value={val}
          onChange={setVal}
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Selected: <code>{val ?? '(none)'}</code>
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickSelects: Story = {
  args: { label: 'Click me', name: 'click-test', onChange: fn() },
  play: async ({ args, canvas }) => {
    const r = canvas.getByLabelText('Click me') as HTMLInputElement;
    await expect(r).not.toBeChecked();
    await userEvent.click(r);
    await expect(r).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledWith(true, expect.anything());
  },
};

export const GroupSelectsExclusive: Story = {
  render: (args) => (
    <RadioGroup
      legend="Pick one"
      name="excl-test"
      options={[
        { value: 'a', label: 'Apple' },
        { value: 'b', label: 'Banana' },
        { value: 'c', label: 'Cherry' },
      ]}
      onChange={args.onChange as unknown as (v: string) => void}
    />
  ),
  args: { onChange: fn() } as never,
  play: async ({ args, canvas }) => {
    const apple = canvas.getByLabelText('Apple') as HTMLInputElement;
    const banana = canvas.getByLabelText('Banana') as HTMLInputElement;
    await userEvent.click(apple);
    await expect(apple).toBeChecked();
    await expect((args as { onChange: ReturnType<typeof fn> }).onChange).toHaveBeenLastCalledWith(
      'a'
    );
    await userEvent.click(banana);
    // Native radio behaviour: selecting Banana deselects Apple
    await expect(banana).toBeChecked();
    await expect(apple).not.toBeChecked();
    await expect((args as { onChange: ReturnType<typeof fn> }).onChange).toHaveBeenLastCalledWith(
      'b'
    );
  },
};

export const DisabledBlocksClick: Story = {
  args: { label: 'No clicking', disabled: true, name: 'disabled-test', onChange: fn() },
  play: async ({ args, canvas }) => {
    const r = canvas.getByLabelText('No clicking') as HTMLInputElement;
    await expect(r).toBeDisabled();
    await userEvent.click(r).catch(() => undefined);
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};
