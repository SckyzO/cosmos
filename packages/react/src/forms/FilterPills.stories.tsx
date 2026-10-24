import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { Filter } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { expectRefFocuses } from '../storybook-helpers';
import { FilterPills } from './FilterPills';

const meta = {
  title: 'Forms/Filter Pills',
  component: FilterPills,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { options: [], value: '', onChange: () => {} },
} satisfies Meta<typeof FilterPills>;

export default meta;
type Story = StoryObj<typeof meta>;

const SEVERITY = [
  { value: 'all', label: 'All' },
  { value: 'crit', label: 'CRIT' },
  { value: 'warn', label: 'WARN' },
  { value: 'ok', label: 'OK' },
];

export const Default: Story = {
  args: { options: SEVERITY, value: 'all' },
};

export const WithIconPrefix: Story = {
  args: { options: SEVERITY, value: 'all', icon: Filter },
};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState('all');
    return (
      <div>
        <FilterPills options={SEVERITY} value={v} onChange={setV} icon={Filter} />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Selected: <code>{v}</code>
        </p>
      </div>
    );
  },
};

export const ClickPillFiresOnChange: Story = {
  args: { options: SEVERITY, value: 'all', onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'CRIT' }));
    await expect(args.onChange).toHaveBeenCalledWith('crit');
  },
};

export const SelectedPillIsChecked: Story = {
  tags: ['!dev'],
  args: { options: SEVERITY, value: 'warn', 'aria-label': 'Severity' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radiogroup', { name: 'Severity' })).toBeInTheDocument();
    await expect(canvas.getByRole('radio', { name: 'WARN', checked: true })).toHaveAttribute(
      'tabindex',
      '0'
    );
    await expect(canvas.getByRole('radio', { name: 'All', checked: false })).toHaveAttribute(
      'tabindex',
      '-1'
    );
  },
};

const ControlledSeverity = () => {
  const [v, setV] = useState('all');
  return <FilterPills aria-label="Severity" options={SEVERITY} value={v} onChange={setV} />;
};

export const ArrowKeysMoveSelection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ControlledSeverity />,
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'All' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('radio', { name: 'CRIT', checked: true })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('radio', { name: 'OK', checked: true })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'All', checked: true })).toHaveFocus();
  },
};

const tabStopRef = createRef<HTMLButtonElement>();

/**
 * The ref gets the pill the group's Tab stop is on, the first one while none is
 * selected, and it follows the selection.
 */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [v, setV] = useState('');
    return (
      <FilterPills
        ref={tabStopRef}
        options={SEVERITY}
        value={v}
        onChange={setV}
        aria-label="Severity"
      />
    );
  },
  play: async ({ canvas }) => {
    await expectRefFocuses(tabStopRef, canvas.getByRole('radio', { name: 'All' }));
    await userEvent.click(canvas.getByRole('radio', { name: 'WARN' }));
    await expectRefFocuses(tabStopRef, canvas.getByRole('radio', { name: 'WARN' }));
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
      <FilterPills
        aria-label="Uncontrolled"
        options={SEVERITY}
        defaultValue="warn"
        onChange={args.onChange}
      />
      <FilterPills
        aria-label="Controlled"
        options={SEVERITY}
        value="all"
        onChange={args.onChange}
      />
    </div>
  ),
  play: async ({ args, canvas }) => {
    const own = within(canvas.getByRole('radiogroup', { name: 'Uncontrolled' }));
    await expect(own.getByRole('radio', { name: 'WARN' })).toBeChecked();
    await userEvent.click(own.getByRole('radio', { name: 'CRIT' }));
    await expect(args.onChange).toHaveBeenLastCalledWith('crit');
    await expect(own.getByRole('radio', { name: 'CRIT' })).toBeChecked();

    const held = within(canvas.getByRole('radiogroup', { name: 'Controlled' }));
    await userEvent.click(held.getByRole('radio', { name: 'OK' }));
    await expect(args.onChange).toHaveBeenLastCalledWith('ok');
    await expect(held.getByRole('radio', { name: 'All' })).toBeChecked();
  },
};
