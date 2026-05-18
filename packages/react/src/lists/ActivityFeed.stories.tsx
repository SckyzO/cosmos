import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Check, Send, ThumbsUp, User } from 'lucide-react';
import { ActivityFeed } from './ActivityFeed';

const meta = {
  title: 'Lists/Activity Feed',
  component: ActivityFeed,
  subcomponents: { 'ActivityFeed.Item': ActivityFeed.Item },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof ActivityFeed>;

export default meta;
type Story = StoryObj<typeof meta>;

// TUI Plus pattern "Simple with icons" — colored circle icons + connector
// + content + timestamp.
export const SimpleWithIcons: Story = {
  render: () => (
    <div className="max-w-2xl bg-white p-8 dark:bg-gray-900">
      <ActivityFeed>
        <ActivityFeed.Item
          icon={User}
          intent="neutral"
          timestamp={<time dateTime="2026-09-20">Sep 20</time>}
        >
          Applied to <span className="font-medium text-gray-900 dark:text-white">Front End Developer</span>
        </ActivityFeed.Item>
        <ActivityFeed.Item
          icon={ThumbsUp}
          intent="info"
          timestamp={<time dateTime="2026-09-22">Sep 22</time>}
        >
          Advanced to phone screening by{' '}
          <span className="font-medium text-gray-900 dark:text-white">Bethany Blake</span>
        </ActivityFeed.Item>
        <ActivityFeed.Item
          icon={Check}
          intent="success"
          timestamp={<time dateTime="2026-09-28">Sep 28</time>}
        >
          Completed phone screening with{' '}
          <span className="font-medium text-gray-900 dark:text-white">Martha Gardner</span>
        </ActivityFeed.Item>
        <ActivityFeed.Item
          icon={ThumbsUp}
          intent="info"
          timestamp={<time dateTime="2026-09-30">Sep 30</time>}
        >
          Advanced to interview by{' '}
          <span className="font-medium text-gray-900 dark:text-white">Bethany Blake</span>
        </ActivityFeed.Item>
        <ActivityFeed.Item
          icon={Check}
          intent="success"
          timestamp={<time dateTime="2026-10-04">Oct 4</time>}
        >
          Completed interview with{' '}
          <span className="font-medium text-gray-900 dark:text-white">Katherine Snyder</span>
        </ActivityFeed.Item>
      </ActivityFeed>
    </div>
  ),
};

// Mixed intents — danger + warning + info + success in one feed.
export const MixedIntents: Story = {
  render: () => (
    <div className="max-w-2xl bg-white p-8 dark:bg-gray-900">
      <ActivityFeed>
        <ActivityFeed.Item icon={Send} intent="info" timestamp="2m ago">
          Triggered alert pipeline run
        </ActivityFeed.Item>
        <ActivityFeed.Item icon={Check} intent="success" timestamp="1m ago">
          All probes returned green
        </ActivityFeed.Item>
      </ActivityFeed>
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RootIsUlWithRoleList: Story = {
  render: () => (
    <ActivityFeed data-testid="af">
      <ActivityFeed.Item icon={User}>x</ActivityFeed.Item>
    </ActivityFeed>
  ),
  play: async ({ canvasElement }) => {
    const ul = canvasElement.querySelector('ul[data-testid="af"]');
    await expect(ul).not.toBeNull();
    await expect(ul).toHaveAttribute('role', 'list');
  },
};

export const LastItemHidesConnector: Story = {
  render: () => (
    <ActivityFeed>
      <ActivityFeed.Item icon={User} data-testid="i1">a</ActivityFeed.Item>
      <ActivityFeed.Item icon={User} data-testid="i2">b</ActivityFeed.Item>
    </ActivityFeed>
  ),
  play: async ({ canvasElement }) => {
    const i1 = canvasElement.querySelector('[data-testid="i1"]');
    const i2 = canvasElement.querySelector('[data-testid="i2"]');
    // i1 has connector (span with bg-gray-200), i2 does not (last item).
    await expect(i1?.querySelector('.bg-gray-200')).not.toBeNull();
    await expect(i2?.querySelector('.bg-gray-200')).toBeNull();
  },
};

export const IntentSuccessColorsCircleGreen: Story = {
  render: () => (
    <ActivityFeed>
      <ActivityFeed.Item icon={Check} intent="success" data-testid="i">
        Done
      </ActivityFeed.Item>
    </ActivityFeed>
  ),
  play: async ({ canvasElement }) => {
    const circle = canvasElement.querySelector('[data-testid="i"] .rounded-full');
    await expect(circle?.className ?? '').toMatch(/bg-green-500/);
  },
};
