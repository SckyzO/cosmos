import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { LayoutDashboard, List, Map } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { expectFocusRing, expectRefFocuses } from '../storybook-helpers';
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

// Browser shortcuts such as Alt+ArrowLeft (back) must reach the browser.
export const ModifiedArrowKeysAreIgnored: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ControlledView />,
  play: async ({ canvas }) => {
    await userEvent.tab();
    await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}{Control>}{ArrowRight}{/Control}');
    await expect(canvas.getByRole('radio', { name: 'List', checked: true })).toHaveFocus();
  },
};

const tabStopRef = createRef<HTMLButtonElement>();

/**
 * The ref gets the segment the group's Tab stop is on, the first one while none
 * is selected, and it follows the selection.
 */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [v, setV] = useState('');
    return (
      <SegmentedControl<string>
        ref={tabStopRef}
        options={[...VIEWS]}
        value={v}
        onChange={setV}
        aria-label="View"
      />
    );
  },
  play: async ({ canvas }) => {
    await expectRefFocuses(tabStopRef, canvas.getByRole('radio', { name: 'List' }));
    await userEvent.click(canvas.getByRole('radio', { name: 'Map' }));
    await expectRefFocuses(tabStopRef, canvas.getByRole('radio', { name: 'Map' }));
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
      <SegmentedControl<string>
        aria-label="Uncontrolled"
        options={[...VIEWS]}
        defaultValue="grid"
        onChange={args.onChange}
      />
      <SegmentedControl<string>
        aria-label="Controlled"
        options={[...VIEWS]}
        value="list"
        onChange={args.onChange}
      />
    </div>
  ),
  play: async ({ args, canvas }) => {
    const own = within(canvas.getByRole('radiogroup', { name: 'Uncontrolled' }));
    await expect(own.getByRole('radio', { name: 'Grid' })).toBeChecked();
    await userEvent.click(own.getByRole('radio', { name: 'Map' }));
    await expect(args.onChange).toHaveBeenLastCalledWith('map');
    await expect(own.getByRole('radio', { name: 'Map' })).toBeChecked();

    const held = within(canvas.getByRole('radiogroup', { name: 'Controlled' }));
    await userEvent.click(held.getByRole('radio', { name: 'Grid' }));
    await expect(args.onChange).toHaveBeenLastCalledWith('grid');
    await expect(held.getByRole('radio', { name: 'List' })).toBeChecked();
  },
};

// Roving tabindex puts focus on the checked segment, which is filled with the accent:
// its ring is white and inside. Any other segment gets the accent ring.

export const FocusShowsWhiteRingOnCheckedSegmentInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { options: VIEWS as unknown as never, value: 'list' },
  play: async ({ canvas }) => {
    await expectFocusRing(canvas.getByRole('radio', { name: 'List' }), {
      token: '--color-white',
      inset: true,
      halo: false,
    });
  },
};

export const FocusShowsWhiteRingOnCheckedSegmentInLight: Story = {
  ...FocusShowsWhiteRingOnCheckedSegmentInDark,
  globals: { theme: 'light' },
};

export const FocusShowsAccentRingOnOtherSegmentInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { options: VIEWS as unknown as never, value: 'list' },
  play: async ({ canvas }) => {
    // Tab first, so the keyboard is the last input and :focus-visible matches.
    await userEvent.tab();
    const grid = canvas.getByRole('radio', { name: 'Grid' });
    grid.focus();
    await expectFocusRing(grid, { inset: true });
  },
};
