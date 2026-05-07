import type { Meta, StoryObj } from '@storybook/react-vite';
import { Server } from 'lucide-react';
import { SectionCard } from './SectionCard';

const meta = {
  title: 'Layout/Section Card',
  component: SectionCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { title: 'Title', children: null },
} satisfies Meta<typeof SectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Connection settings',
    children: <p className="text-sm text-[var(--color-text-secondary)]">Section body content.</p>,
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Servers',
    icon: Server,
    desc: 'Active fleet across 3 sites',
    children: <p className="text-sm text-[var(--color-text-secondary)]">Section body content.</p>,
  },
};
