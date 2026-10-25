import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Checkbox, CheckboxGroup } from './Checkbox';
import { expectFocusRing, expectTextContrast } from '../storybook-helpers';

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
      onChange={args.onChange as unknown as (v: string[]) => void}
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

// red-500 error text fell under 4.5:1 (#151).
export const ErrorTextContrastInLight: Story = {
  ...GroupWithError,
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  play: async ({ canvas }) => {
    expectTextContrast(canvas.getByText('Select at least one permission.'));
  },
};

const checkboxRef = createRef<HTMLInputElement>();
const checkboxNodes: (HTMLInputElement | null)[] = [];

/** An object ref and a callback ref both get the input, and `indeterminate` still reaches it. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-2">
      <Checkbox ref={checkboxRef} label="Select all" indeterminate />
      <Checkbox ref={(node) => void checkboxNodes.push(node)} label="Archive" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const selectAll = canvas.getByRole('checkbox', { name: 'Select all' });
    await expect(checkboxRef.current).toBe(selectAll);
    await expect(selectAll).toHaveProperty('indeterminate', true);
    await expect(checkboxNodes.at(-1)).toBe(canvas.getByRole('checkbox', { name: 'Archive' }));
  },
};

// The input is visually hidden: the box next to it draws the ring.

export const FocusShowsRingInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Subscribe to newsletter', defaultChecked: true },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('checkbox');
    await expectFocusRing(input, { ring: input.nextElementSibling as HTMLElement });
  },
};

export const FocusShowsRingInLight: Story = {
  ...FocusShowsRingInDark,
  globals: { theme: 'light' },
};

// What the cleanup-style ref below saw: attached, then cleaned up, never null.
const refCalls: string[] = [];
const cleanupRef = (node: HTMLInputElement | null) => {
  refCalls.push(node ? 'attach' : 'null');
  return () => {
    refCalls.push('cleanup');
  };
};

/**
 * A React 19 callback ref that returns a cleanup gets it called once on
 * unmount, through the ref Checkbox merges with its own, and is never called
 * with null.
 */
export const RefCleanupRunsOnUnmount: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [shown, setShown] = useState(true);
    return (
      <>
        <button type="button" onClick={() => setShown(false)}>
          Remove
        </button>
        {shown && <Checkbox ref={cleanupRef} label="Notify me" />}
      </>
    );
  },
  play: async ({ canvas }) => {
    refCalls.length = 0;
    await userEvent.click(canvas.getByRole('button', { name: 'Remove' }));
    await expect(canvas.queryByRole('checkbox')).toBeNull();
    await expect(refCalls.slice(-1)).toEqual(['cleanup']);
    await expect(refCalls).not.toContain('null');
  },
};

// A disabled field shows the not-allowed cursor, not the pointer of its default (#290).
export const DisabledShowsNotAllowedCursor: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Locked', disabled: true },
  play: async ({ canvas }) => {
    const label = canvas.getByLabelText('Locked').closest('label') as HTMLElement;
    await expect(getComputedStyle(label).cursor).toBe('not-allowed');
  },
};

const STATUSES = [
  { value: 'open', label: 'Open', description: 'Waiting for a reply' },
  { value: 'in-progress', label: 'In progress', description: 'Someone is on it' },
  { value: 'closed', label: 'Closed', description: 'Nothing left to do' },
];

/** Each item is one block (box, label, description), kept apart from the next. */
export const GroupHorizontalWithDescriptions: Story = {
  render: () => (
    <CheckboxGroup
      legend="Filter by status"
      orientation="horizontal"
      options={STATUSES}
      defaultValue={['open']}
    />
  ),
};

export const GroupHorizontalKeepsItemsApart: Story = {
  tags: ['!dev', '!autodocs'],
  render: GroupHorizontalWithDescriptions.render,
  play: async ({ canvasElement }) => {
    const items = [...canvasElement.querySelectorAll<HTMLElement>('fieldset label')];
    await expect(items).toHaveLength(3);
    for (const [i, item] of items.entries()) {
      const box = item.getBoundingClientRect();
      // The description sits inside its own item, not under a neighbour.
      const description = within(item).getByText(STATUSES[i]!.description).getBoundingClientRect();
      await expect(description.left).toBeGreaterThanOrEqual(box.left);
      await expect(description.right).toBeLessThanOrEqual(box.right + 0.5);
      if (i > 0)
        await expect(box.left - items[i - 1]!.getBoundingClientRect().right).toBeGreaterThanOrEqual(
          24
        );
    }
  },
};
