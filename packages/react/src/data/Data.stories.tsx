import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Server, Bell, Database } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { Timeline, type TimelineItem } from './Timeline';
import { MiniCalendar } from './MiniCalendar';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Data/Visualization',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const KpiGrid: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="KpiCard grid">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total Racks" value="48" sub="across 3 sites" />
          <KpiCard
            label="CRIT Alerts"
            value="3"
            sub="2 escalated"
            className="border-red-200 dark:border-red-900/40"
          />
          <KpiCard label="Health Score" value="94%" />
          <KpiCard label="Nodes Online" value="1 204" sub="of 1 248 total" />
        </div>
      </SectionCard>
    </Wrap>
  ),
};

const items: TimelineItem[] = [
  {
    id: '1',
    title: 'server-prod-01 marked CRIT',
    description: 'CPU > 95%',
    time: '5m ago',
    icon: Server,
    avatarName: 'A',
  },
  {
    id: '2',
    title: 'New alert escalated',
    description: 'PagerDuty notified',
    time: '12m ago',
    icon: Bell,
    avatarName: 'B',
  },
  { id: '3', title: 'db-primary recovered', time: '1h ago', icon: Database, avatarName: 'C' },
  { id: '4', title: 'Maintenance window started', time: '3h ago', avatarName: 'D' },
];

export const Timelines: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Timeline — 3 variants">
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <p className="mb-3 text-xs text-gray-400">variant=&quot;dot&quot;</p>
            <Timeline items={items} variant="dot" />
          </div>
          <div>
            <p className="mb-3 text-xs text-gray-400">variant=&quot;avatar&quot;</p>
            <Timeline items={items} variant="avatar" />
          </div>
          <div>
            <p className="mb-3 text-xs text-gray-400">variant=&quot;card&quot;</p>
            <Timeline items={items.slice(0, 3)} variant="card" />
          </div>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Calendar: Story = {
  render: () => {
    const [selected, setSelected] = useState(new Date());
    const events = new Set(['2026-05-12', '2026-05-21', '2026-05-28']);
    return (
      <Wrap>
        <SectionCard title="MiniCalendar — compact date picker with event dots">
          <div className="max-w-xs">
            <MiniCalendar selected={selected} onSelect={setSelected} eventDays={events} />
          </div>
          <p className="mt-3 text-xs text-gray-500">Selected: {selected.toLocaleDateString()}</p>
        </SectionCard>
      </Wrap>
    );
  },
};
