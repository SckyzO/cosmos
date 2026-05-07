import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, Database, Server } from 'lucide-react';
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
