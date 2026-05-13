import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Building2, Cpu, Server } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';

const meta = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { items: [] },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcons: Story = {
  args: {
    items: [
      { icon: Building2, label: 'DC Paris', href: '#' },
      { icon: Server, label: 'Room A', href: '#' },
      { icon: Box, label: 'Rack 01-A', href: '#' },
      { icon: Cpu, label: 'server-alpha-01' },
    ],
  },
};

export const SimpleText: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Library', href: '/library' },
      { label: 'Components', href: '/library/components' },
      { label: 'Breadcrumb' },
    ],
  },
};

const PATH = [
  { label: 'Home', href: '/' },
  { label: 'Library', href: '/library' },
  { label: 'Components', href: '/library/components' },
  { label: 'Breadcrumb' },
];

export const SeparatorSlash: Story = { args: { items: PATH, separator: 'slash' } };

export const SeparatorDot: Story = { args: { items: PATH, separator: 'dot' } };

export const SeparatorCustom: Story = {
  args: {
    items: PATH,
    separator: <span className="text-xs text-[var(--color-text-muted)]">→</span>,
  },
};

export const SeparatorMatrix: Story = {
  render: () => (
    <div className="space-y-3">
      {(['chevron', 'slash', 'dot'] as const).map((sep) => (
        <div key={sep} className="flex items-center gap-3">
          <span className="w-16 font-mono text-[10px] text-[var(--color-text-muted)] uppercase">
            {sep}
          </span>
          <Breadcrumb items={PATH} separator={sep} />
        </div>
      ))}
    </div>
  ),
};
