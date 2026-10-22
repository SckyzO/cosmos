import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  Activity as ActivityIcon,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Database,
  GitBranch,
  Home,
  Rocket,
  Server,
  Settings,
  UserPlus,
  Wrench,
} from 'lucide-react';
import { expect, userEvent } from 'storybook/test';
import { Timeline, type TimelineItem } from '../data/Timeline';
import { SegmentedControl } from '../forms/SegmentedControl';
import { Shell } from '../layout/Shell';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { PageHeader } from '../templates/PageHeader';
import { placeholderAvatar } from '../storybook-avatars';
import { portalDocsParams } from '../storybook-helpers';

// Team activity log: an alternating Timeline grouped by day, with a toggle
// between this month and the whole history. Composed from existing Cosmos
// primitives.

const meta = {
  title: 'Pages/Activity',
  parameters: portalDocsParams.full(),
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const THIS_MONTH: TimelineItem[] = [
  {
    id: 'release',
    group: 'Today',
    title: 'Release 2.4 deployed to production',
    description: 'All 12 services healthy after the rollout.',
    meta: 'by Sarah Chen',
    time: '14:32',
    icon: Rocket,
    tone: 'success',
  },
  {
    id: 'alert-rule',
    group: 'Today',
    title: 'Alert rule updated: API latency p95',
    description: 'Threshold raised from 300 ms to 400 ms.',
    meta: 'by Marcus Lee',
    time: '11:05',
    icon: Bell,
    tone: 'warning',
  },
  {
    id: 'resolved',
    group: 'Today',
    title: 'Incident INC-142 resolved',
    description: 'Root cause: connection pool exhaustion on db-primary.',
    meta: 'by Priya Patel',
    time: '09:20',
    icon: CheckCircle2,
    tone: 'success',
  },
  {
    id: 'incident',
    group: 'Yesterday',
    title: 'Incident INC-142 opened',
    description: 'API p95 latency above 800 ms for 10 minutes.',
    meta: 'by Alertmanager',
    time: '22:47',
    icon: AlertTriangle,
    tone: 'danger',
  },
  {
    id: 'scale',
    group: 'Yesterday',
    title: 'Node pool scaled to 8 nodes',
    description: 'The autoscaler reacted to sustained CPU load.',
    meta: 'by Autoscaler',
    time: '18:10',
    icon: Server,
    tone: 'brand',
  },
  {
    id: 'grafana',
    group: 'Earlier this month',
    title: 'Grafana upgraded to 12.2',
    meta: 'by Marcus Lee',
    time: 'May 4',
    icon: Wrench,
    tone: 'neutral',
  },
  {
    id: 'member',
    group: 'Earlier this month',
    title: 'Priya Patel joined the platform team',
    description: 'Admin access to the production clusters.',
    meta: 'by Sarah Chen',
    time: 'May 2',
    icon: UserPlus,
    tone: 'brand',
  },
];

const OLDER: TimelineItem[] = [
  {
    id: 'backups',
    group: 'April 2026',
    title: 'Backup policy changed',
    description: 'Snapshots are kept 30 days instead of 14.',
    meta: 'by Sarah Chen',
    time: 'Apr 22',
    icon: Database,
    tone: 'neutral',
  },
  {
    id: 'kubernetes',
    group: 'April 2026',
    title: 'Kubernetes 1.36 rollout finished',
    description: 'Three clusters upgraded with no downtime.',
    meta: 'by Marcus Lee',
    time: 'Apr 9',
    icon: CheckCircle2,
    tone: 'success',
  },
  {
    id: 'created',
    group: 'March 2026',
    title: 'Project Cosmos created',
    description: 'First commit on the design system.',
    meta: 'by Sarah Chen',
    time: 'Mar 14',
    icon: Rocket,
    tone: 'brand',
  },
];

type Range = 'month' | 'all';

const RANGES = [
  { value: 'month' as const, label: 'This month' },
  { value: 'all' as const, label: 'All time' },
];

const ActivityContent = () => {
  const [range, setRange] = useState<Range>('month');
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Activity"
        description="Deploys, incidents and changes across the platform."
        actions={<SegmentedControl options={RANGES} value={range} onChange={setRange} />}
      />
      <div className="mx-auto max-w-5xl">
        <Timeline
          variant="alternating"
          items={range === 'month' ? THIS_MONTH : [...THIS_MONTH, ...OLDER]}
        />
      </div>
    </div>
  );
};

const ActivityPage = () => (
  <Shell
    topbar={
      <Topbar
        sidebarCollapsed={false}
        onToggleSidebar={() => {}}
        rightActions={
          <>
            <button
              type="button"
              aria-label="Notifications"
              className="rounded-full p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <Bell className="size-5" aria-hidden />
            </button>
            <img
              alt=""
              src={placeholderAvatar('cosmos-activity', 64)}
              className="size-8 rounded-full"
            />
          </>
        }
      />
    }
    sidebar={
      <Sidebar>
        <Sidebar.Brand title="Cosmos" />
        <Sidebar.Section>
          <Sidebar.Item icon={Home} label="Home" />
          <Sidebar.Item icon={ActivityIcon} label="Activity" active />
          <Sidebar.Item icon={GitBranch} label="Deployments" />
          <Sidebar.Item icon={Server} label="Servers" />
          <Sidebar.Item icon={Settings} label="Settings" />
        </Sidebar.Section>
      </Sidebar>
    }
  >
    <ActivityContent />
  </Shell>
);

export const Default: Story = {
  render: () => <ActivityPage />,
};

/** Interaction test, kept off the docs page so Default shows the initial state. */
export const AllTimeShowsOlderMonths: Story = {
  tags: ['!autodocs'],
  render: () => <ActivityPage />,
  play: async ({ canvas }) => {
    const groups = () => canvas.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    await expect(groups()).toEqual(['Today', 'Yesterday', 'Earlier this month']);

    await userEvent.click(canvas.getByRole('radio', { name: 'All time' }));
    await expect(groups()).toEqual([
      'Today',
      'Yesterday',
      'Earlier this month',
      'April 2026',
      'March 2026',
    ]);
    await expect(canvas.getByText('Project Cosmos created')).toBeVisible();

    await userEvent.click(canvas.getByRole('radio', { name: 'This month' }));
    await expect(canvas.queryByText('Project Cosmos created')).toBeNull();
  },
};
