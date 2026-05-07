import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AccentPicker, type AccentColor } from './AccentPicker';

const meta = {
  title: 'Settings/Accent Picker',
  component: AccentPicker,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { colors: [], value: '', onChange: () => {} },
} satisfies Meta<typeof AccentPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

const ACCENTS: AccentColor[] = [
  { id: 'brand', label: 'Brand', hex: '#465fff' },
  { id: 'sky', label: 'Sky', hex: '#0ea5e9' },
  { id: 'emerald', label: 'Emerald', hex: '#10b981' },
  { id: 'amber', label: 'Amber', hex: '#f59e0b' },
  { id: 'rose', label: 'Rose', hex: '#f43f5e' },
  { id: 'violet', label: 'Violet', hex: '#8b5cf6' },
  { id: 'fuchsia', label: 'Fuchsia', hex: '#d946ef' },
  { id: 'teal', label: 'Teal', hex: '#14b8a6' },
  { id: 'orange', label: 'Orange', hex: '#f97316' },
  { id: 'slate', label: 'Slate', hex: '#64748b' },
];

export const TenAccents: Story = {
  render: () => {
    const [value, setValue] = useState('brand');
    return (
      <Wrap>
        <AccentPicker colors={ACCENTS} value={value} onChange={setValue} />
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Selected: <code>{value}</code>
        </p>
      </Wrap>
    );
  },
};
