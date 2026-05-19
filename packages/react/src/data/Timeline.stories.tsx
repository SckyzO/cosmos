import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertTriangle, Bell, CheckCircle2, Database, Server, Wrench } from 'lucide-react';
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

export const Dot: Story = { args: { items, variant: 'dot' } };
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
