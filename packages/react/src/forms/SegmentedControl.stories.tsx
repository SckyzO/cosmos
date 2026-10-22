import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { LayoutDashboard, List, Map } from 'lucide-react';
import { expect, fn, userEvent } from 'storybook/test';
import { SegmentedControl } from './SegmentedControl';

const meta = {
  title: 'Forms/Segmented Control',
  component: SegmentedControl,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { options: [], value: '', onChange: () => {} },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

const VIEWS = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'map', label: 'Map' },
] as const;

const VIEWS_WITH_ICONS = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'list', label: 'List', icon: List },
  { value: 'map', label: 'Map', icon: Map },
] as const;

export const TextOnly: Story = {
  args: { options: VIEWS as unknown as never, value: 'list' },
};

export const TextAndIcon: Story = {
  args: { options: VIEWS_WITH_ICONS as unknown as never, value: 'overview' },
};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState<'list' | 'grid' | 'map'>('list');
    return (
      <div>
        <SegmentedControl options={VIEWS as unknown as never} value={v} onChange={setV} />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Selected: <code>{v}</code>
        </p>
      </div>
    );
  },
};

export const ClickFiresOnChange: Story = {
  args: { options: VIEWS as unknown as never, value: 'list', onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Grid' }));
    await expect(args.onChange).toHaveBeenCalledWith('grid');
  },
};

export const SelectedSegmentIsChecked: Story = {
  tags: ['!dev'],
  args: { options: VIEWS as unknown as never, value: 'grid', 'aria-label': 'View' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radiogroup', { name: 'View' })).toBeInTheDocument();
    await expect(canvas.getByRole('radio', { name: 'Grid', checked: true })).toHaveAttribute(
      'tabindex',
      '0'
    );
    await expect(canvas.getByRole('radio', { name: 'List', checked: false })).toHaveAttribute(
      'tabindex',
      '-1'
    );
  },
};

const ControlledView = () => {
  const [v, setV] = useState<'list' | 'grid' | 'map'>('list');
  return (
    <SegmentedControl
      aria-label="View"
      options={VIEWS as unknown as never}
      value={v}
      onChange={setV}
    />
  );
};

export const ArrowKeysMoveSelection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ControlledView />,
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'List' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'Grid', checked: true })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await expect(canvas.getByRole('radio', { name: 'Map', checked: true })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(canvas.getByRole('radio', { name: 'List', checked: true })).toHaveFocus();
  },
};
