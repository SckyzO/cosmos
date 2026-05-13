import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { Checkbox, CheckboxGroup } from './Checkbox';

const meta = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Subscribe to newsletter' } };

export const Checked: Story = {
  args: { label: 'Email notifications', defaultChecked: true },
};

export const Indeterminate: Story = {
  args: { label: 'Select all', indeterminate: true },
};

export const WithDescription: Story = {
  args: {
    label: 'Marketing emails',
    description: 'Get tips, product updates and best practices once a week.',
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: { label: 'Premium feature', disabled: true },
};

export const DisabledChecked: Story = {
  args: { label: 'Locked option', disabled: true, defaultChecked: true },
};

export const Small: Story = {
  args: { label: 'Compact checkbox', size: 'sm', defaultChecked: true },
};

export const NoLabel: Story = {
  render: () => (
    <div className="flex gap-3">
      <Checkbox aria-label="check 1" />
      <Checkbox aria-label="check 2" defaultChecked />
      <Checkbox aria-label="check 3" indeterminate />
      <Checkbox aria-label="check 4" disabled />
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [val, setVal] = useState(false);
    return (
      <div className="space-y-2">
        <Checkbox
          label={`State: ${val ? 'on' : 'off'}`}
          checked={val}
          onChange={(c) => setVal(c)}
        />
      </div>
    );
  },
};

// ── Group stories ────────────────────────────────────────────────────────────

const NOTIFICATION_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS', description: 'Standard rates apply.' },
  { value: 'push', label: 'Push notifications' },
  { value: 'slack', label: 'Slack', disabled: true },
];

export const Group: Story = {
  render: () => (
    <CheckboxGroup
      legend="Notification channels"
      description="Pick how you want to be reached for incident escalations."
      options={NOTIFICATION_OPTIONS}
      defaultValue={['email']}
    />
  ),
};

export const GroupHorizontal: Story = {
  render: () => (
    <CheckboxGroup
      legend="Filter by status"
      orientation="horizontal"
      options={[
        { value: 'open', label: 'Open' },
        { value: 'in-progress', label: 'In progress' },
        { value: 'closed', label: 'Closed' },
      ]}
      defaultValue={['open', 'in-progress']}
    />
  ),
};

export const GroupWithError: Story = {
  render: () => (
    <CheckboxGroup
      legend="Required permissions"
      options={[
        { value: 'read', label: 'Read' },
        { value: 'write', label: 'Write' },
      ]}
      error="Select at least one permission."
    />
  ),
};

export const GroupControlled: Story = {
  render: () => {
    const [val, setVal] = useState<string[]>([]);
    return (
      <div className="space-y-3">
        <CheckboxGroup
          legend="Servers to restart"
          options={[
            { value: 'web-01', label: 'web-01' },
            { value: 'web-02', label: 'web-02' },
            { value: 'db-01', label: 'db-01' },
          ]}
          value={val}
          onChange={setVal}
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Selected: <code>{val.length === 0 ? '(none)' : val.join(', ')}</code>
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickToggles: Story = {
  args: { label: 'Click me', onChange: fn() },
  play: async ({ args, canvas }) => {
    const cb = canvas.getByLabelText('Click me') as HTMLInputElement;
    await expect(cb).not.toBeChecked();
    await userEvent.click(cb);
    await expect(cb).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledWith(true, expect.anything());
    await userEvent.click(cb);
    await expect(cb).not.toBeChecked();
  },
};

export const DisabledBlocksClick: Story = {
  args: { label: 'No clicking', disabled: true, onChange: fn() },
  play: async ({ args, canvas }) => {
    const cb = canvas.getByLabelText('No clicking') as HTMLInputElement;
    await expect(cb).toBeDisabled();
    await userEvent.click(cb).catch(() => undefined);
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const GroupTogglesValue: Story = {
  render: (args) => (
    <CheckboxGroup
      legend="Pick one or more"
      options={[
        { value: 'a', label: 'Apple' },
        { value: 'b', label: 'Banana' },
        { value: 'c', label: 'Cherry' },
      ]}
      onChange={args.onChange as (v: string[]) => void}
    />
  ),
  args: { onChange: fn() } as never,
  play: async ({ args, canvas }) => {
    const apple = canvas.getByLabelText('Apple');
    const banana = canvas.getByLabelText('Banana');
    await userEvent.click(apple);
    await expect((args as { onChange: ReturnType<typeof fn> }).onChange).toHaveBeenLastCalledWith([
      'a',
    ]);
    await userEvent.click(banana);
    await expect((args as { onChange: ReturnType<typeof fn> }).onChange).toHaveBeenLastCalledWith([
      'a',
      'b',
    ]);
    await userEvent.click(apple);
    await expect((args as { onChange: ReturnType<typeof fn> }).onChange).toHaveBeenLastCalledWith([
      'b',
    ]);
  },
};
