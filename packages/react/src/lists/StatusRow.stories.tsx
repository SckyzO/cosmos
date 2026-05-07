import type { Meta, StoryObj } from '@storybook/react-vite';
import { Cpu, Database, HardDrive, Server } from 'lucide-react';
import { StatusRow } from './StatusRow';

const meta = {
  title: 'Lists/Status Row',
  component: StatusRow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { title: 'Item', status: 'OK' },
} satisfies Meta<typeof StatusRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { icon: Server, title: 'server-prod-01', subtitle: 'DC Paris', status: 'OK' },
};

export const Mixed: Story = {
  render: () => (
    <div className="max-w-md divide-y divide-[var(--color-border)]">
      <StatusRow icon={Server} title="server-prod-01" subtitle="DC Paris" status="OK" />
      <StatusRow icon={Server} title="server-prod-02" subtitle="DC Paris" status="WARN" />
      <StatusRow icon={Database} title="db-primary" subtitle="DC Lyon" status="CRIT" />
      <StatusRow icon={HardDrive} title="storage-cold" subtitle="DC Bordeaux" status="UNKNOWN" />
      <StatusRow icon={Cpu} title="hpc-node-04" subtitle="DC Toulouse" status="OK" />
    </div>
  ),
};
