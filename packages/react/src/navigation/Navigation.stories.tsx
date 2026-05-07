import type { Meta, StoryObj } from '@storybook/react-vite';
import { Building2, Server, Box, Cpu } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { items: [] },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const WithIcons: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Path navigation">
        <Breadcrumb
          items={[
            { icon: Building2, label: 'DC Paris', href: '#' },
            { icon: Server, label: 'Room A', href: '#' },
            { icon: Box, label: 'Rack 01-A', href: '#' },
            { icon: Cpu, label: 'server-alpha-01' },
          ]}
        />
      </SectionCard>
    </Wrap>
  ),
};

export const SimpleText: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Without icons">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Library', href: '/library' },
            { label: 'Components', href: '/library/components' },
            { label: 'Breadcrumb' },
          ]}
        />
      </SectionCard>
    </Wrap>
  ),
};
