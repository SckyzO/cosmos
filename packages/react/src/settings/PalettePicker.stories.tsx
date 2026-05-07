import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { PalettePicker } from './PalettePicker';
import type { PaletteMeta } from './PaletteCard';

const meta = {
  title: 'Settings/Palette Picker',
  component: PalettePicker,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { palettes: [], value: '', onChange: () => {} },
} satisfies Meta<typeof PalettePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

const LIGHT_THEMES: PaletteMeta[] = [
  {
    id: 'pure',
    label: 'Pure',
    desc: 'White surfaces',
    preview: { bg: '#f9fafb', surface: '#ffffff', border: '#e5e7eb' },
  },
  {
    id: 'warm',
    label: 'Warm',
    desc: 'Cream tone',
    preview: { bg: '#fefcf8', surface: '#fffaf0', border: '#f3e8d0' },
  },
  {
    id: 'cool',
    label: 'Cool',
    desc: 'Blue tint',
    preview: { bg: '#f3f6fc', surface: '#ffffff', border: '#dbe5f5' },
  },
  {
    id: 'paper',
    label: 'Paper',
    desc: 'Slight grain',
    preview: { bg: '#f4f3ee', surface: '#fafaf7', border: '#dad8d0' },
  },
];

const DARK_THEMES: PaletteMeta[] = [
  {
    id: 'cosmos',
    label: 'Cosmos',
    desc: 'Default deep blue',
    preview: { bg: '#0c111d', surface: '#101828', border: '#1f2937' },
  },
  {
    id: 'void',
    label: 'Void',
    desc: 'NOC near-black',
    preview: { bg: '#000000', surface: '#0a0a0a', border: '#262626' },
  },
  {
    id: 'slate',
    label: 'Slate',
    desc: 'Neutral grey',
    preview: { bg: '#1f2937', surface: '#293241', border: '#3a4659' },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    desc: 'Indigo wash',
    preview: { bg: '#10162b', surface: '#1a2240', border: '#2d3563' },
  },
];

export const LightThemes: Story = {
  render: () => {
    const [value, setValue] = useState('pure');
    return (
      <Wrap>
        <PalettePicker palettes={LIGHT_THEMES} value={value} onChange={setValue} />
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Selected: <code>{value}</code>
        </p>
      </Wrap>
    );
  },
};

export const DarkThemes: Story = {
  render: () => {
    const [value, setValue] = useState('cosmos');
    return (
      <Wrap>
        <PalettePicker palettes={DARK_THEMES} value={value} onChange={setValue} />
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Selected: <code>{value}</code>
        </p>
      </Wrap>
    );
  },
};
