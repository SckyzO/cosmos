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
