import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Check, Send, ThumbsUp, User } from 'lucide-react';
import { bothDirections, directionBox, endOffset, expectMirrored } from '../storybook-helpers';
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
    <div className="max-w-2xl bg-[var(--color-bg-panel)] p-8">
      <ActivityFeed>
        <ActivityFeed.Item
          icon={User}
          intent="neutral"
          timestamp={<time dateTime="2026-09-20">Sep 20</time>}
        >
          Applied to{' '}
          <span className="font-medium text-gray-900 dark:text-white">Front End Developer</span>
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
    <div className="max-w-2xl bg-[var(--color-bg-panel)] p-8">
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
  tags: ['!dev'],
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
  tags: ['!dev'],
  render: () => (
    <ActivityFeed>
      <ActivityFeed.Item icon={User} data-testid="i1">
        a
      </ActivityFeed.Item>
      <ActivityFeed.Item icon={User} data-testid="i2">
        b
      </ActivityFeed.Item>
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
    const circle = canvasElement.querySelector('[data-testid="i"] [data-slot="disc"]');
    await expect(circle).toHaveClass('bg-green-100', 'text-green-700');
  },
};

export const TimestampStyle: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <ActivityFeed>
      <ActivityFeed.Item icon={User} timestamp="5m ago">
        Someone did something
      </ActivityFeed.Item>
    </ActivityFeed>
  ),
  play: async ({ canvas }) => {
    const style = getComputedStyle(canvas.getByText('5m ago'));
    await expect(style.fontVariantNumeric).toContain('tabular-nums');
    await expect(style.textTransform).toBe('none');
    await expect(style.fontFamily).not.toMatch(/mono/i);
    // text-2xs: 11px at the default text size.
    await expect(style.fontSize).toBe('11px');
  },
};

export const RingFollowsTheSurface: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="surface" className="bg-[var(--color-bg-panel)] p-8">
      <ActivityFeed>
        <ActivityFeed.Item icon={Check} intent="success" data-testid="i" timestamp="1m ago">
          Done
        </ActivityFeed.Item>
      </ActivityFeed>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const disc = canvasElement.querySelector('[data-testid="i"] [data-slot="disc"]')!;
    const outer = disc.parentElement!;
    const panel = getComputedStyle(
      canvasElement.querySelector('[data-testid="surface"]')!
    ).backgroundColor;
    // The halo is the surface colour, in the theme being rendered, not a fixed white or gray-900.
    await expect(getComputedStyle(outer).boxShadow).toContain(panel);
    // The tint sits on an opaque base: nothing behind the disc (the connector) shows through.
    await expect(getComputedStyle(outer).backgroundColor).toBe(panel);
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The disc and its connector are at the start, the text follows them and the time is at the end. */
export const DiscsAndTimesMirrorInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <ActivityFeed>
        <ActivityFeed.Item icon={User} timestamp={<time dateTime="2026-09-20">Sep 20</time>}>
          Applied to <span className="font-medium">Front End Developer</span>
        </ActivityFeed.Item>
        <ActivityFeed.Item
          icon={Check}
          intent="success"
          timestamp={<time dateTime="2026-09-22">Sep 22</time>}
        >
          Completed phone screening
        </ActivityFeed.Item>
      </ActivityFeed>
    )),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => box.querySelector('[data-slot="disc"]'));
    // The connector runs down the middle of the disc, on the same side.
    expectMirrored(canvasElement, (box) => box.querySelector('span.w-0\\.5'), 0);
    expectMirrored(canvasElement, (box) => box.querySelector('p, div.text-sm'));
    const ltr = directionBox(canvasElement, 'ltr');
    const rtl = directionBox(canvasElement, 'rtl');
    const time = (box: HTMLElement) => box.querySelector('time')!;
    expect(endOffset(time(rtl), rtl)).toBeCloseTo(endOffset(time(ltr), ltr), 0);
  },
};
