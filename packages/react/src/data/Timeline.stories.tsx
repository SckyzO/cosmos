import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertTriangle, Bell, CheckCircle2, Database, Rocket, Server, Wrench } from 'lucide-react';
import { expect, within } from 'storybook/test';
import { placeholderAvatar } from '../storybook-avatars';
import { expectGraphicContrast, expectTextContrast, inEachTheme } from '../storybook-helpers';
import { Timeline, type TimelineIntent, type TimelineItem } from './Timeline';

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

// Flowbite-style stepper timeline — large icon circles tinted per intent,
// useful for hero activity feeds or onboarding step-by-step views.
const stepperItems: TimelineItem[] = [
  {
    id: '1',
    title: 'server-prod-01 marked CRIT',
    description: 'CPU > 95% — auto-paged to on-call.',
    time: '5m ago',
    icon: AlertTriangle,
    intent: 'danger',
  },
  {
    id: '2',
    title: 'New alert escalated',
    description: 'PagerDuty notified · Acked by sckyzo.',
    time: '12m ago',
    icon: Bell,
    intent: 'warning',
  },
  {
    id: '3',
    title: 'db-primary recovered',
    description: 'Health checks green for 60 consecutive seconds.',
    time: '1h ago',
    icon: CheckCircle2,
    intent: 'success',
  },
  {
    id: '4',
    title: 'Maintenance window started',
    description: 'Scheduled by ops — 23h window.',
    time: '3h ago',
    icon: Wrench,
    intent: 'brand',
  },
];

export const Stepper: Story = { args: { items: stepperItems, variant: 'stepper' } };

// One event per state, the last one without `intent`. The `dot`, `avatar` and `card` variants
// color their marker per item: the dot, a ring around the avatar, the left edge of the card.
type TitledItem = TimelineItem & { title: string };

const intentItems: TitledItem[] = [
  {
    id: '1',
    title: 'server-prod-01 marked CRIT',
    description: 'CPU > 95% — auto-paged to on-call.',
    time: '5m ago',
    icon: AlertTriangle,
    avatarName: 'Ana Costa',
    intent: 'danger',
  },
  {
    id: '2',
    title: 'New alert escalated',
    description: 'PagerDuty notified · Acked by sckyzo.',
    time: '12m ago',
    icon: Bell,
    avatarName: 'Ben Ito',
    intent: 'warning',
  },
  {
    id: '3',
    title: 'db-primary recovered',
    description: 'Health checks green for 60 consecutive seconds.',
    time: '1h ago',
    icon: CheckCircle2,
    avatarName: 'Chloe Dax',
    intent: 'success',
  },
  {
    id: '4',
    title: 'Maintenance window started',
    description: 'Scheduled by ops — 23h window.',
    time: '3h ago',
    icon: Wrench,
    avatarName: 'Dev Rao',
    intent: 'brand',
  },
  {
    id: '5',
    title: 'Runbook reviewed',
    time: '4h ago',
    icon: Server,
    avatarName: 'Eli Moss',
    intent: 'neutral',
  },
  {
    id: '6',
    title: 'Nightly backup finished',
    time: '6h ago',
    icon: Database,
    avatarName: 'Fay Orr',
  },
];

// The palette family behind each intent.
const INTENT_HUE = {
  brand: 'brand',
  success: 'green',
  warning: 'amber',
  danger: 'red',
  neutral: 'gray',
} as const satisfies Record<TimelineIntent, string>;

// Dark themes turn `dark:` on: `deep-blue` as well as `dark`.
const isDarkTheme = () => document.documentElement.matches('.dark, .deep-blue');

// The computed colour of a palette token in the current theme.
const tokenColor = (token: string) => {
  const probe = document.createElement('span');
  probe.style.color = `var(--color-${token})`;
  document.body.append(probe);
  const { color } = getComputedStyle(probe);
  probe.remove();
  return color;
};

// What a ring or an edge takes: `-600` on the light themes, `-500` on the dark ones.
const markerColor = (intent: TimelineIntent) =>
  tokenColor(`${INTENT_HUE[intent]}-${isDarkTheme() ? 500 : 600}`);

// The dot keeps `brand-500` for `brand` and for no `intent`.
const dotColor = (intent?: TimelineIntent) =>
  !intent || intent === 'brand' ? tokenColor('brand-500') : markerColor(intent);

type Canvas = ReturnType<typeof within>;

const rowOf = (canvas: Canvas, item: TitledItem) =>
  canvas.getByText(item.title).closest('li') as HTMLElement;

// A 2px ring reads in `box-shadow` as `<color> 0px 0px 0px 2px`.
const RING_2PX = '0px 0px 0px 2px';

/**
 * `intent` colors the dot of an event: `-600` on the light themes, `-500` on the dark ones. `brand`
 * and no `intent` give the same `brand-500` dot.
 */
export const DotWithIntent: Story = {
  args: { items: intentItems, variant: 'dot' },
  play: async ({ canvas }) => {
    inEachTheme(() => {
      for (const item of intentItems) {
        const dot = rowOf(canvas, item).querySelector('span.rounded-full')!;
        expect(getComputedStyle(dot).backgroundColor).toBe(dotColor(item.intent));
      }
    });
  },
};

/**
 * `intent` draws a 2px ring around the avatar, over initials or an image. Without it the avatar
 * has no ring.
 */
export const AvatarWithIntent: Story = {
  args: { items: intentItems, variant: 'avatar' },
  play: async ({ canvas }) => {
    inEachTheme(() => {
      for (const item of intentItems) {
        const { boxShadow } = getComputedStyle(rowOf(canvas, item).querySelector('[role="img"]')!);
        if (item.intent) {
          expect(boxShadow).toContain(markerColor(item.intent));
          expect(boxShadow).toContain(RING_2PX);
        } else {
          expect(boxShadow).not.toContain(RING_2PX);
        }
      }
    });
  },
};

/**
 * `intent` gives the card a 4px left edge in its color, the other three sides stay the 1px gray
 * frame. Without it the card is the plain frame.
 */
export const CardWithIntent: Story = {
  args: { items: intentItems, variant: 'card' },
  play: async ({ canvas }) => {
    // A live style object: it reads the theme `inEachTheme` has switched to.
    const plain = getComputedStyle(rowOf(canvas, intentItems[5]));
    inEachTheme(() => {
      for (const item of intentItems) {
        const card = getComputedStyle(rowOf(canvas, item));
        if (item.intent) {
          expect(card.borderLeftWidth).toBe('4px');
          expect(card.borderLeftColor).toBe(markerColor(item.intent));
          // The other sides keep the 1px gray of a card with no intent.
          for (const side of ['Top', 'Right', 'Bottom'] as const) {
            expect(card[`border${side}Width`]).toBe('1px');
            expect(card[`border${side}Color`]).toBe(plain[`border${side}Color`]);
          }
        } else {
          expect(card.borderLeftWidth).toBe('1px');
          expect(card.borderLeftColor).toBe(card.borderTopColor);
        }
      }
    });
  },
};

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
    intent: 'success',
  },
  {
    id: 'alert-rule',
    group: 'Today',
    title: 'Alert rule updated: API latency p95',
    description: 'Threshold raised from 300 ms to 400 ms.',
    meta: 'by Marcus Lee',
    time: '11:05',
    icon: Bell,
    intent: 'warning',
  },
  {
    id: 'incident',
    group: 'Yesterday',
    title: 'Incident INC-142 opened',
    description: 'API p95 latency above 800 ms for 10 minutes.',
    meta: 'by Alertmanager',
    time: '22:47',
    icon: AlertTriangle,
    intent: 'danger',
  },
  {
    id: 'scale',
    group: 'Yesterday',
    title: 'Node pool scaled to 8 nodes',
    description: 'The autoscaler reacted to sustained CPU load.',
    meta: 'by Autoscaler',
    time: '18:10',
    icon: Server,
    intent: 'brand',
  },
  {
    id: 'grafana',
    group: 'Earlier this month',
    title: 'Grafana upgraded to 12.2',
    meta: 'by Marcus Lee',
    time: 'May 4',
    icon: Wrench,
    intent: 'neutral',
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
  tags: ['!dev', '!autodocs'],
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

// The 10px gray-400 timestamps fell under 4.5:1 on light and sand (#151).
const timeContrastIn = (theme: string): Story => ({
  ...Dot,
  tags: ['!dev', '!autodocs'],
  globals: { theme },
  play: async ({ canvas }) => {
    expectTextContrast(canvas.getAllByText('5m ago')[0]);
  },
});

export const TimeContrastInLight = timeContrastIn('light');
export const TimeContrastInSand = timeContrastIn('sand');
export const TimeContrastInDeepBlue = timeContrastIn('deep-blue');

const INTENT_CIRCLES = {
  brand: ['bg-brand-100', 'text-brand-700'],
  success: ['bg-green-100', 'text-green-700'],
  warning: ['bg-amber-100', 'text-amber-700'],
  danger: ['bg-red-100', 'text-red-700'],
  neutral: ['bg-gray-100', 'text-gray-700'],
} as const;

/** `intent` tints the icon circle of the `stepper` and `alternating` variants, `brand` by default. */
export const IntentTintsTheIconCircle: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const items: TimelineItem[] = [
      ...(Object.keys(INTENT_CIRCLES) as (keyof typeof INTENT_CIRCLES)[]).map((intent) => ({
        id: intent,
        title: `${intent} step`,
        icon: Bell,
        intent,
      })),
      { id: 'default', title: 'default step', icon: Bell },
    ];
    return (
      <div className="space-y-8">
        <Timeline variant="stepper" items={items} />
        <Timeline variant="alternating" items={[{ ...items[3], id: 'alt' }]} />
      </div>
    );
  },
  play: async ({ canvas }) => {
    const circle = (title: string, index = 0) =>
      canvas.getAllByText(title)[index].closest('li')!.querySelector('span.rounded-full')!;
    for (const [intent, classes] of Object.entries(INTENT_CIRCLES)) {
      await expect(circle(`${intent} step`)).toHaveClass(...classes);
    }
    await expect(circle('default step')).toHaveClass(...INTENT_CIRCLES.brand);
    // The alternating variant reads it too: this one is the `danger` item.
    await expect(circle('danger step', 1)).toHaveClass(...INTENT_CIRCLES.danger);
  },
};

const plainItems: TitledItem[] = intentItems.map(({ intent: _intent, ...item }) => item);

/** Without `intent` the dot, avatar and card variants render as they did before the prop. */
export const NoIntentRendersAsToday: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-8">
      {(['dot', 'avatar', 'card'] as const).map((variant) => (
        <div key={variant} data-variant={variant}>
          <Timeline variant={variant} items={plainItems} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const rows = (variant: string) =>
      Array.from(canvasElement.querySelectorAll<HTMLElement>(`[data-variant="${variant}"] li`));
    inEachTheme(() => {
      // Every dot is the brand one, whatever the item.
      for (const row of rows('dot')) {
        const dot = row.querySelector('span.rounded-full')!;
        expect(getComputedStyle(dot).backgroundColor).toBe(tokenColor('brand-500'));
      }
      for (const row of rows('avatar')) {
        const { boxShadow } = getComputedStyle(row.querySelector('[role="img"]')!);
        expect(boxShadow).not.toContain(RING_2PX);
      }
      for (const row of rows('card')) {
        const card = getComputedStyle(row);
        for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
          expect(card[`border${side}Width`]).toBe('1px');
          expect(card[`border${side}Color`]).toBe(card.borderTopColor);
        }
        expect(card.padding).toBe('12px');
      }
    });
  },
};

/** The ring is drawn around the avatar, so an avatar with an image keeps it. */
export const AvatarWithImageKeepsTheRing: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    variant: 'avatar',
    items: [
      {
        id: 'image',
        title: 'Deploy rolled back',
        avatarName: 'Ana Costa',
        avatarSrc: placeholderAvatar('Ana Costa', 64),
        intent: 'danger',
      },
    ],
  },
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole('listitem').querySelector('[role="img"]')!;
    // The picture shows, not the initials.
    await expect(avatar.querySelector('img')).not.toBeNull();
    await expect(canvas.queryByText('AC')).toBeNull();
    inEachTheme(() => {
      const { boxShadow } = getComputedStyle(avatar);
      expect(boxShadow).toContain(markerColor('danger'));
      expect(boxShadow).toContain(RING_2PX);
    });
  },
};

/** The thicker edge of an `intent` card takes its padding from the left: titles start at the same place. */
export const CardTitlesAlign: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    variant: 'card',
    items: [
      { id: 'plain', title: 'Plain card' },
      { id: 'edged', title: 'Card with intent', intent: 'warning' },
    ],
  },
  play: async ({ canvas }) => {
    const offset = (title: string) =>
      canvas.getByText(title).getBoundingClientRect().left -
      canvas.getByText(title).closest('li')!.getBoundingClientRect().left;
    await expect(offset('Card with intent')).toBe(offset('Plain card'));
    // 1px border + 12px padding.
    await expect(offset('Plain card')).toBe(13);
  },
};

/** The icon in the dot reaches 3:1 against the fill (WCAG 1.4.11), for every intent in the four themes. */
export const DotIconContrast: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: intentItems, variant: 'dot' },
  play: async ({ canvas }) => {
    inEachTheme(() => {
      for (const item of intentItems) {
        try {
          expectGraphicContrast(rowOf(canvas, item).querySelector('svg')!, 'color');
        } catch (error) {
          throw new Error(`${item.intent ?? 'no intent'}: ${(error as Error).message}`, {
            cause: error,
          });
        }
      }
    });
  },
};

/** The `dot` variant: a 24px indicator, the time on the title row, a gap between entries. */
export const DotLayout: Story = {
  ...Dot,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const rows = canvas.getAllByRole('listitem');
    const indicator = rows[0].querySelector('span.rounded-full')!.getBoundingClientRect();
    await expect(indicator.width).toBe(24);
    await expect(indicator.height).toBe(24);
    // The time is a sibling of the title, not a line under the description.
    const time = canvas.getByText('5m ago');
    const title = canvas.getByText('server-prod-01 marked CRIT');
    await expect(time.parentElement).toBe(title.parentElement);
    // Entries are apart: the gap under an entry's last line, none under the last entry.
    const body = (row: HTMLElement) => row.lastElementChild as HTMLElement;
    await expect(getComputedStyle(body(rows[0])).paddingBottom).toBe('24px');
    await expect(getComputedStyle(body(rows[rows.length - 1])).paddingBottom).toBe('0px');
  },
};

/** Timeline and ActivityFeed share one time style: small, tabular, muted, not mono nor uppercase. */
export const TimeStyle: Story = {
  ...Card,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const style = getComputedStyle(canvas.getByText('5m ago'));
    await expect(style.fontVariantNumeric).toContain('tabular-nums');
    await expect(style.textTransform).toBe('none');
    await expect(style.fontFamily).not.toMatch(/mono/i);
    // text-2xs: 11px at the default text size.
    await expect(style.fontSize).toBe('11px');
  },
};
