import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Box, LayoutGrid, List, Map, Server } from 'lucide-react';
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
