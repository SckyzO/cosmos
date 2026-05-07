import type { Meta, StoryObj } from '@storybook/react-vite';
import { Server, Database, HardDrive, Cpu } from 'lucide-react';
import { SimpleRow } from './SimpleRow';
import { ClickableRow } from './ClickableRow';
import { StatusRow } from './StatusRow';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Lists/Rows',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const SimpleRows: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Resource metadata">
        <div className="divide-y divide-[var(--color-border)]">
          <SimpleRow label="ID" value="rack-01-a" mono />
          <SimpleRow label="Height" value="42U" />
          <SimpleRow label="Template" value="Standard Air Cooled" />
          <SimpleRow label="Devices" value={14} />
          <SimpleRow label="Last seen" value="2 minutes ago" />
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const ClickableRows: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Servers">
        <div className="divide-y divide-[var(--color-border)]">
          <ClickableRow icon={Server} title="Server alpha-01" subtitle="Rack 01-A · Slot 5" />
          <ClickableRow icon={Server} title="Server alpha-02" subtitle="Rack 01-A · Slot 6" />
          <ClickableRow icon={Database} title="DB primary" subtitle="Rack 01-B · Slot 12" />
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const StatusRows: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Infrastructure health">
        <div className="divide-y divide-[var(--color-border)]">
          <StatusRow icon={Server} title="server-prod-01" subtitle="DC Paris" status="OK" />
          <StatusRow icon={Server} title="server-prod-02" subtitle="DC Paris" status="WARN" />
          <StatusRow icon={Database} title="db-primary" subtitle="DC Lyon" status="CRIT" />
          <StatusRow
            icon={HardDrive}
            title="storage-cold"
            subtitle="DC Bordeaux"
            status="UNKNOWN"
          />
          <StatusRow icon={Cpu} title="hpc-node-04" subtitle="DC Toulouse" status="OK" />
        </div>
      </SectionCard>
    </Wrap>
  ),
};
