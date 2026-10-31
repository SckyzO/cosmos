import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Settings, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectMirrored,
  expectReadsLeftToRight,
  portalDocsParams,
  startOffset,
} from '../storybook-helpers';
import { NotificationsPanel, type NotificationsPanelIntent } from './NotificationsPanel';

const meta = {
  title: 'Overlays/Notifications Panel',
  component: NotificationsPanel,
  parameters: portalDocsParams.md(),
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { children: null as ReactNode },
} satisfies Meta<typeof NotificationsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

type Alert = {
  id: string;
  intent: NotificationsPanelIntent;
  title: string;
  subtitle: string;
  caption?: string;
  time?: string;
  unread?: boolean;
};

const SAMPLE_ALERTS: Alert[] = [
  {
    id: '1',
    intent: 'danger',
    title: 'rack-a07-srv03',
    subtitle: 'Rack A07 · Datacenter Paris',
    caption: 'cpu_temp_critical +2',
    time: '2 min ago',
    unread: true,
  },
  {
    id: '2',
    intent: 'danger',
    title: 'rack-b12-srv01',
    subtitle: 'Rack B12 · Datacenter Frankfurt',
    caption: 'disk_full',
    time: '18 min ago',
    unread: true,
  },
  {
    id: '3',
    intent: 'warning',
    title: 'rack-a03-srv11',
    subtitle: 'Rack A03 · Datacenter Paris',
    caption: 'memory_pressure',
    time: '1 h ago',
  },
  {
    id: '4',
    intent: 'warning',
    title: 'rack-c02-srv05',
    subtitle: 'Rack C02 · Datacenter London',
    caption: 'fan_speed_low',
    time: '3 h ago',
  },
  {
    id: '5',
    intent: 'info',
    title: 'rack-a01-srv02',
    subtitle: 'Rack A01 · Datacenter Paris',
    caption: 'maintenance_scheduled',
    time: 'Yesterday',
  },
];

const FullPanel = ({
  alerts = SAMPLE_ALERTS,
  defaultOpen = true,
  muted = false,
  onItemClick,
  onViewAll,
  onMuteToggle,
  onMarkAllRead,
}: {
  alerts?: Alert[];
  defaultOpen?: boolean;
  muted?: boolean;
  onItemClick?: (id: string) => void;
  onViewAll?: () => void;
  onMuteToggle?: () => void;
  onMarkAllRead?: () => void;
}) => {
  const [isMuted, setMuted] = useState(muted);
  const crit = alerts.filter((a) => a.intent === 'danger').length;
  const warn = alerts.filter((a) => a.intent === 'warning').length;
  const info = alerts.filter((a) => a.intent === 'info').length;
  return (
    <NotificationsPanel defaultOpen={defaultOpen}>
      <NotificationsPanel.Trigger count={alerts.length} muted={isMuted} />
      <NotificationsPanel.Content>
        <NotificationsPanel.Header title="Active Alerts" onMarkAllRead={onMarkAllRead}>
          <NotificationsPanel.Counters crit={crit} warn={warn} info={info} />
          <NotificationsPanel.HeaderAction
            icon={isMuted ? VolumeX : Volume2}
            active={isMuted}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            onClick={(e) => {
              e.stopPropagation();
              setMuted((m) => !m);
              onMuteToggle?.();
            }}
          />
          <NotificationsPanel.HeaderAction
            icon={Settings}
            aria-label="Notification settings"
            onClick={(e) => e.stopPropagation()}
          />
        </NotificationsPanel.Header>
        {alerts.length === 0 ? (
          <NotificationsPanel.Empty />
        ) : (
          <NotificationsPanel.List>
            {alerts.map((a) => (
              <NotificationsPanel.Item
                key={a.id}
                intent={a.intent}
                title={a.title}
                subtitle={a.subtitle}
                caption={a.caption}
                time={a.time}
                unread={a.unread}
                onClick={() => onItemClick?.(a.id)}
              />
            ))}
          </NotificationsPanel.List>
        )}
        <NotificationsPanel.Footer onClick={() => onViewAll?.()}>
          View all alerts{' '}
          <span aria-hidden className="inline-block rtl:-scale-x-100">
            →
          </span>
        </NotificationsPanel.Footer>
      </NotificationsPanel.Content>
    </NotificationsPanel>
  );
};

// ── Stories ──────────────────────────────────────────────────────────────────

export const Open: Story = {
  render: () => (
    <div className="flex h-[420px] items-start justify-end">
      <FullPanel />
    </div>
  ),
};

export const Closed: Story = {
  render: () => (
    <div className="flex h-32 items-start justify-end">
      <FullPanel defaultOpen={false} />
    </div>
  ),
};

// The badge is visible text, so the trigger's accessible name contains it (Label in Name): the
// count follows the name, and without a badge the name is the bare "Notifications".
export const Empty: Story = {
  render: () => (
    <div className="flex h-[420px] items-start justify-end">
      <FullPanel alerts={[]} />
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Notifications' });
    await expect(trigger.textContent).toBe('');
  },
};

export const Muted: Story = {
  render: () => (
    <div className="flex h-[420px] items-start justify-end">
      <FullPanel muted />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: 'Notifications (muted), 5' })
    ).toHaveTextContent('5');
  },
};

export const HighCount: Story = {
  render: () => (
    <div className="flex h-32 items-start justify-end">
      <NotificationsPanel defaultOpen={false}>
        <NotificationsPanel.Trigger count={12345} />
      </NotificationsPanel>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Notifications, 9999+' })).toHaveTextContent(
      '9999+'
    );
  },
};

export const AlignStart: Story = {
  render: () => (
    <div className="flex h-[420px] items-start justify-start">
      <NotificationsPanel defaultOpen align="start">
        <NotificationsPanel.Trigger count={3} />
        <NotificationsPanel.Content>
          <NotificationsPanel.Header title="Active Alerts" />
          <NotificationsPanel.List>
            {SAMPLE_ALERTS.slice(0, 3).map((a) => (
              <NotificationsPanel.Item
                key={a.id}
                intent={a.intent}
                title={a.title}
                subtitle={a.subtitle}
              />
            ))}
          </NotificationsPanel.List>
        </NotificationsPanel.Content>
      </NotificationsPanel>
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

// The interaction tests below stay off the docs page (`!autodocs`): their play
// functions take focus, which scrolls the docs page down to their iframe.
export const TriggerOpensPanel: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-[420px] items-start justify-end">
      <FullPanel defaultOpen={false} />
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /^notifications/i });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // Panel is in a portal, query document instead of canvas
    await expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  },
};

export const ItemClickFiresHandler: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => {
    const extra = args as unknown as { onItemClick: (id: string) => void };
    return (
      <div className="flex h-[420px] items-start justify-end">
        <FullPanel defaultOpen={false} onItemClick={extra.onItemClick} />
      </div>
    );
  },
  args: { onItemClick: fn() } as never,
  play: async ({ args, canvas }) => {
    const extra = args as unknown as { onItemClick: ReturnType<typeof fn> };
    // Open the panel via the trigger to make rect computation deterministic.
    await userEvent.click(canvas.getByRole('button', { name: /^notifications/i }));
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    const dialog = document.querySelector('[role="dialog"]')!;
    // Find the first alert item (it has a badge text like "CRIT" / "WARN")
    const items = Array.from(dialog.querySelectorAll('button')).filter((b) =>
      b.textContent?.match(/CRIT|WARN|INFO|OK/)
    );
    await userEvent.click(items[0]);
    await expect(extra.onItemClick).toHaveBeenCalledTimes(1);
  },
};

export const EscapeKeyCloses: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-[420px] items-start justify-end">
      <FullPanel defaultOpen={false} />
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^notifications/i }));
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
  },
};

/** Opening from the keyboard moves focus into the panel; Escape brings it back. */
export const KeyboardFocusManagement: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-[420px] items-start justify-end">
      <FullPanel defaultOpen={false} />
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /^notifications/i });
    const dialog = () => document.querySelector('[role="dialog"]');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(dialog()).not.toBeNull());
    await waitFor(() => expect(dialog()!.contains(document.activeElement)).toBe(true));
    await userEvent.tab();
    await expect(dialog()!.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog()).toBeNull());
    await expect(document.activeElement).toBe(trigger);
  },
};

/** In a scrolling container, the open panel stays under its trigger, flush with its right edge. */
export const StaysUnderTriggerOnScroll: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="scroller" className="h-80 overflow-y-auto">
      <div className="flex justify-end px-6 pt-6 pb-[600px]">
        <NotificationsPanel>
          <NotificationsPanel.Trigger />
          <NotificationsPanel.Content>
            <NotificationsPanel.Empty />
          </NotificationsPanel.Content>
        </NotificationsPanel>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /^notifications/i });
    await userEvent.click(trigger);
    const panel = await waitFor(() => document.querySelector<HTMLElement>('[role="dialog"]')!);
    const before = trigger.getBoundingClientRect().top;
    canvas.getByTestId('scroller').scrollTop = 30;
    await expect(trigger.getBoundingClientRect().top).toBeCloseTo(before - 30, 0);
    await waitFor(() => {
      const t = trigger.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      expect(p.top).toBeCloseTo(t.bottom + 8, 0);
      // Flush with the trigger's end edge: its right in ltr, its left in rtl.
      expect(endOffset(panel, trigger)).toBeCloseTo(0, 0);
    });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
  },
};

/** Each `intent` gives the item its icon color, chip and badge; the badge label stays CRIT, WARN, INFO, OK. */
export const ItemIntentsKeepTheirLook: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-[420px] items-start justify-end">
      <NotificationsPanel defaultOpen>
        <NotificationsPanel.Trigger />
        <NotificationsPanel.Content>
          <NotificationsPanel.Header title="Active Alerts" />
          <NotificationsPanel.List>
            <NotificationsPanel.Item intent="danger" title="danger item" />
            <NotificationsPanel.Item intent="warning" title="warning item" />
            <NotificationsPanel.Item intent="info" title="info item" />
            <NotificationsPanel.Item intent="success" title="success item" />
            <NotificationsPanel.Item intent="danger" title="custom item" badgeLabel="DOWN" />
          </NotificationsPanel.List>
        </NotificationsPanel.Content>
      </NotificationsPanel>
    </div>
  ),
  play: async () => {
    const body = within(document.body);
    const item = async (title: string) => (await body.findByText(title)).closest('button')!;
    // The badge takes Badge's solid fill for the intent.
    const cases = [
      ['danger item', 'red', 'CRIT', ['bg-red-600', 'text-white']],
      ['warning item', 'amber', 'WARN', ['bg-amber-500', 'text-gray-900']],
      ['info item', 'blue', 'INFO', ['bg-blue-600', 'text-white']],
      ['success item', 'green', 'OK', ['bg-green-500', 'text-gray-900']],
    ] as const;
    for (const [title, color, label, badge] of cases) {
      const row = await item(title);
      await expect(row.querySelector('svg')).toHaveClass(
        color === 'green' ? 'text-green-600' : `text-${color}-500`
      );
      await expect(row.querySelector('div.rounded-full')).toHaveClass(`bg-${color}-500/15`);
      // The badge is the pill around the label's own span.
      await expect(within(row).getByText(label).parentElement).toHaveClass(...badge);
    }
    // The label is only a default.
    await expect(within(await item('custom item')).getByText('DOWN').parentElement).toHaveClass(
      'bg-red-600'
    );
  },
};

/** `unread` puts a dot before the title and tints the row; `time` is a line under the text. */
export const UnreadAndTime: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-[480px] items-start justify-end">
      <FullPanel onMarkAllRead={fn()} />
    </div>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog');
    const rows = Array.from(dialog.querySelectorAll('button')).filter((b) =>
      b.textContent?.match(/CRIT|WARN|INFO|OK/)
    );
    const unread = rows[0]!;
    const read = rows[2]!;
    await expect(within(unread).getByText('2 min ago')).toBeVisible();
    await expect(unread).toHaveTextContent('Unread:');
    await expect(unread).toHaveClass('dark:bg-brand-500/10');
    await expect(read).not.toHaveTextContent('Unread:');
    await expect(read).not.toHaveClass('dark:bg-brand-500/10');
  },
};

/** "Mark all as read" is in the header only when `onMarkAllRead` is given, and keeps the panel open. */
export const MarkAllReadFiresHandler: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="flex h-[480px] items-start justify-end">
      <FullPanel onMarkAllRead={(args as unknown as { onMarkAllRead: () => void }).onMarkAllRead} />
    </div>
  ),
  args: { onMarkAllRead: fn() } as never,
  play: async ({ args }) => {
    const onMarkAllRead = (args as unknown as { onMarkAllRead: ReturnType<typeof fn> })
      .onMarkAllRead;
    const dialog = await within(document.body).findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Mark all as read' }));
    await expect(onMarkAllRead).toHaveBeenCalledTimes(1);
    await expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  },
};

export const NoMarkAllReadByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-[480px] items-start justify-end">
      <FullPanel />
    </div>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog');
    await expect(within(dialog).queryByRole('button', { name: 'Mark all as read' })).toBeNull();
  },
};

/**
 * The unread badge sits at the end corner of the trigger, the panel lines up with its end edge,
 * the unread dot and the text start an item and its badge ends it, and the texts keep their order.
 */
export const TriggerAndItemsFollowTheDirection: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams.md(),
  render: () =>
    bothDirections(() => (
      <div className="flex h-[480px] justify-center pt-4">
        <FullPanel
          alerts={[
            { ...SAMPLE_ALERTS[0]!, title: 'rack-a07 (3 of 5).', time: '2 min ago', unread: true },
          ]}
        />
      </div>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const trigger = within(box).getByRole('button', { name: /^notifications/i });
      await waitFor(() =>
        expect(document.querySelector(`[role="dialog"][dir="${dir}"]`)).not.toBeNull()
      );
      const panel = document.querySelector<HTMLElement>(`[role="dialog"][dir="${dir}"]`)!;
      expect(endOffset(panel, trigger), `${dir}: flush with the end edge`).toBeCloseTo(0, 0);
      // The count badge hangs at the end corner of the trigger.
      const badge = trigger.querySelector('span span:last-child')!;
      expect(endOffset(badge, trigger)).toBeLessThan(startOffset(badge, trigger));
      // An item: dot, icon and text from the start, the level badge at the end.
      const item = within(panel)
        .getAllByRole('button')
        .find((b) => b.textContent?.includes('rack-a07'))!;
      const dot = item.querySelector('.bg-brand-500')!;
      const level = within(item).getByText('CRIT');
      expect(startOffset(dot, item)).toBeLessThan(endOffset(dot, item));
      expect(endOffset(level, item)).toBeLessThan(startOffset(level, item));
      expect(getComputedStyle(item).textAlign).toBe('start');
      expectReadsLeftToRight(within(item).getByText('rack-a07 (3 of 5).').closest('p')!);
      expectReadsLeftToRight(within(item).getByText('2 min ago').closest('p')!);
    }
    expectMirrored(canvasElement, (box) =>
      within(box)
        .getByRole('button', { name: /^notifications/i })
        .querySelector('span span:last-child')
    );
  },
};

// The ping around the count grows to twice its size: at the end of a row (a topbar without
// padding, a toolbar that scrolls) it must not widen what holds the bell. Frozen at its widest.
export const PingStaysInsideTheBell: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="box" className="flex justify-end overflow-x-auto" style={{ width: 200 }}>
      <FullPanel defaultOpen={false} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const ping = canvasElement.querySelector<HTMLElement>('.animate-ping')!;
    ping.style.animation = 'none';
    ping.style.transform = 'scale(2)';
    const box = canvas.getByTestId('box');
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
  },
};
