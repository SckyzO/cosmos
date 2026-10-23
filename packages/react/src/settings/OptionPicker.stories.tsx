import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Box, LayoutGrid, List, Map, Server } from 'lucide-react';
import { expect, fn, userEvent } from 'storybook/test';
import { OptionPicker, type OptionItem } from './OptionPicker';

const meta = {
  title: 'Settings/Option Picker',
  component: OptionPicker,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { options: [], value: '', onChange: () => {} },
} satisfies Meta<typeof OptionPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

const ICON_STYLES: OptionItem[] = [
  {
    id: 'badge',
    label: 'Badge',
    desc: 'Filled square',
    preview: (
      <span className="bg-brand-500 flex h-9 w-9 items-center justify-center rounded-md text-white">
        <Server className="h-4 w-4" />
      </span>
    ),
  },
  {
    id: 'soft',
    label: 'Soft',
    desc: 'Tinted bg',
    preview: (
      <span className="bg-brand-500/10 text-brand-500 flex h-9 w-9 items-center justify-center rounded-lg">
        <Server className="h-4 w-4" />
      </span>
    ),
  },
  {
    id: 'circle',
    label: 'Circle',
    desc: 'Filled circle',
    preview: (
      <span className="bg-brand-500 flex h-9 w-9 items-center justify-center rounded-full text-white">
        <Server className="h-4 w-4" />
      </span>
    ),
  },
  {
    id: 'ghost',
    label: 'Ghost',
    desc: 'Outline only',
    preview: (
      <span className="border-brand-500 text-brand-500 flex h-9 w-9 items-center justify-center rounded-lg border-2">
        <Server className="h-4 w-4" />
      </span>
    ),
  },
  {
    id: 'solo',
    label: 'Solo',
    desc: 'Icon only',
    preview: (
      <span className="text-brand-500 flex h-9 w-9 items-center justify-center">
        <Server className="h-5 w-5" />
      </span>
    ),
  },
];

const VIEW_MODES: OptionItem[] = [
  {
    id: 'grid',
    label: 'Grid',
    desc: 'Cards layout',
    preview: <LayoutGrid className="text-brand-500 h-5 w-5" />,
  },
  {
    id: 'list',
    label: 'List',
    desc: 'Compact rows',
    preview: <List className="text-brand-500 h-5 w-5" />,
  },
  {
    id: 'map',
    label: 'Map',
    desc: 'Geographic',
    preview: <Map className="text-brand-500 h-5 w-5" />,
  },
  {
    id: 'box',
    label: 'Box',
    desc: 'Schematic',
    preview: <Box className="text-brand-500 h-5 w-5" />,
  },
];

export const IconStylePicker: Story = {
  render: () => {
    const [value, setValue] = useState('soft');
    return (
      <Wrap>
        <OptionPicker options={ICON_STYLES} value={value} onChange={setValue} cols={5} />
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Selected: <code>{value}</code>
        </p>
      </Wrap>
    );
  },
};

export const ViewModePicker: Story = {
  render: () => {
    const [value, setValue] = useState('grid');
    return (
      <Wrap>
        <OptionPicker options={VIEW_MODES} value={value} onChange={setValue} cols={4} />
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Selected: <code>{value}</code>
        </p>
      </Wrap>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

// The picker is controlled: keep the value here and report each pick to `onChange`.
const ControlledViewModes = ({
  initial,
  onChange,
}: {
  initial: string;
  onChange: (id: string) => void;
}) => {
  const [value, setValue] = useState(initial);
  return (
    <Wrap>
      <OptionPicker
        aria-label="View mode"
        options={VIEW_MODES}
        value={value}
        onChange={(id) => {
          onChange(id);
          setValue(id);
        }}
        cols={4}
      />
    </Wrap>
  );
};

/** Clicking an option reports its id and moves the checked state to it. */
export const ClickSelectsAnOption: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => <ControlledViewModes initial="grid" onChange={args.onChange} />,
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('radiogroup', { name: 'View mode' })).toBeVisible();
    await expect(canvas.getAllByRole('radio')).toHaveLength(VIEW_MODES.length);
    await expect(canvas.getByRole('radio', { name: 'Grid', checked: true })).toBeVisible();

    await userEvent.click(canvas.getByRole('radio', { name: 'Map' }));
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith('map');
    await expect(canvas.getByRole('radio', { name: 'Map', checked: true })).toBeVisible();
    await expect(canvas.getByRole('radio', { name: 'Grid', checked: false })).toBeVisible();
    await expect(canvas.getAllByRole('radio', { checked: true })).toHaveLength(1);
  },
};

/** Only the checked option is a tab stop; arrows, Home and End move and check, wrapping. */
export const ArrowKeysMoveTheSelection: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => <ControlledViewModes initial="grid" onChange={args.onChange} />,
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Grid' })).toHaveAttribute('tabindex', '0');
    await expect(canvas.getByRole('radio', { name: 'List' })).toHaveAttribute('tabindex', '-1');

    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Grid' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'List', checked: true })).toHaveFocus();
    await expect(args.onChange).toHaveBeenLastCalledWith('list');
    // The tab stop follows the selection.
    await expect(canvas.getByRole('radio', { name: 'List' })).toHaveAttribute('tabindex', '0');
    await expect(canvas.getByRole('radio', { name: 'Grid' })).toHaveAttribute('tabindex', '-1');

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await expect(canvas.getByRole('radio', { name: 'Box', checked: true })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('radio', { name: 'Grid', checked: true })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('radio', { name: 'Box', checked: true })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(canvas.getByRole('radio', { name: 'Grid', checked: true })).toHaveFocus();

    // Browser shortcuts such as Alt+ArrowLeft (back) are left alone.
    await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}');
    await expect(canvas.getByRole('radio', { name: 'Grid', checked: true })).toHaveFocus();
  },
};

/** With no option checked, Tab lands on the first one, and Space or Enter check a focused one. */
export const NothingCheckedEntersOnTheFirstOption: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => <ControlledViewModes initial="" onChange={args.onChange} />,
  play: async ({ args, canvas }) => {
    await expect(canvas.queryByRole('radio', { checked: true })).toBeNull();
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Grid', checked: false })).toHaveFocus();

    canvas.getByRole('radio', { name: 'Map' }).focus();
    await userEvent.keyboard(' ');
    await expect(args.onChange).toHaveBeenLastCalledWith('map');
    await expect(canvas.getByRole('radio', { name: 'Map', checked: true })).toHaveFocus();

    canvas.getByRole('radio', { name: 'List' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith('list');
    await expect(canvas.getByRole('radio', { name: 'List', checked: true })).toHaveFocus();
  },
};

/** `cols` sets the number of grid columns. */
export const ColsSetsTheGridColumns: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ControlledViewModes initial="grid" onChange={() => {}} />,
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'View mode' });
    await expect(getComputedStyle(group).gridTemplateColumns.split(' ')).toHaveLength(4);
  },
};
