import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertTriangle, Bell, CheckCircle2, Database, Rocket, Server, Wrench } from 'lucide-react';
import { expect, within } from 'storybook/test';
import { Timeline, type TimelineItem } from './Timeline';

const meta = {
  title: 'Data/Timeline',
  component: Timeline,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { items: [] },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

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

export const Dot: Story = {
  args: { items, variant: 'dot' },
  play: async ({ canvas }) => {
    // No `group` on the items: one list, no headers.
    await expect(canvas.getAllByRole('list')).toHaveLength(1);
    await expect(canvas.queryByRole('heading')).toBeNull();
  },
};
export const Avatar: Story = { args: { items, variant: 'avatar' } };
export const Card: Story = { args: { items: items.slice(0, 3), variant: 'card' } };

// Flowbite-style stepper timeline — large icon circles tinted per tone,
// useful for hero activity feeds or onboarding step-by-step views.
const stepperItems: TimelineItem[] = [
  {
    id: '1',
    title: 'server-prod-01 marked CRIT',
    description: 'CPU > 95% — auto-paged to on-call.',
    time: '5m ago',
    icon: AlertTriangle,
    tone: 'danger',
  },
  {
    id: '2',
    title: 'New alert escalated',
    description: 'PagerDuty notified · Acked by sckyzo.',
    time: '12m ago',
    icon: Bell,
    tone: 'warning',
  },
  {
    id: '3',
    title: 'db-primary recovered',
    description: 'Health checks green for 60 consecutive seconds.',
    time: '1h ago',
    icon: CheckCircle2,
    tone: 'success',
  },
  {
    id: '4',
    title: 'Maintenance window started',
    description: 'Scheduled by ops — 23h window.',
    time: '3h ago',
    icon: Wrench,
    tone: 'brand',
  },
];

export const Stepper: Story = { args: { items: stepperItems, variant: 'stepper' } };

// Activity feed with `group` (date headers) and `meta` (author).
const activity: TimelineItem[] = [
  {
    id: 'release',
    group: 'Today',
    title: 'Release 2.4 deployed',
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
];

/**
 * Cards alternate around a centred line, with the time on the other side.
 * Below `md` they stack on one side of the line, time inside the card.
 */
export const Alternating: Story = {
  args: { items: activity, variant: 'alternating' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('list', { name: 'Yesterday' })).toBeVisible();
    // The time is rendered on both sides of the line; one copy shows at a time.
    const times = canvas.getAllByText('14:32').filter((el) => el.checkVisibility());
    await expect(times).toHaveLength(1);
  },
};

/**
 * `group` puts a header above each run of items sharing it, `meta` adds a
 * line under the description. Both work with every variant.
 */
export const GroupedWithMeta: Story = {
  args: { items: activity, variant: 'dot' },
  play: async ({ canvas }) => {
    const headings = canvas.getAllByRole('heading').map((h) => h.textContent);
    await expect(headings).toEqual(['Today', 'Yesterday', 'Earlier this month']);
    const today = within(canvas.getByRole('list', { name: 'Today' }));
    await expect(today.getAllByRole('listitem')).toHaveLength(2);
    await expect(today.getByText('by Sarah Chen')).toBeVisible();
    const yesterday = within(canvas.getByRole('list', { name: 'Yesterday' }));
    await expect(yesterday.getByText('Node pool scaled to 8 nodes')).toBeVisible();
  },
};

/** Only consecutive items share a header: a group seen again starts a new one. */
export const RepeatedGroupStartsNewHeader: Story = {
  tags: ['!autodocs'],
  args: {
    variant: 'card',
    items: [
      { id: '1', group: 'Pinned', title: 'Runbook: database failover' },
      { id: '2', group: 'Recent', title: 'Incident INC-142 opened' },
      { id: '3', group: 'Pinned', title: 'On-call rota for June' },
    ],
  },
  play: async ({ canvas }) => {
    const headings = canvas.getAllByRole('heading').map((h) => h.textContent);
    await expect(headings).toEqual(['Pinned', 'Recent', 'Pinned']);
  },
};
