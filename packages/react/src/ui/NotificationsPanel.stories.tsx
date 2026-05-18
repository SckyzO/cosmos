import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Settings, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { NotificationsPanel, type NotificationSeverity } from './NotificationsPanel';

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
  severity: NotificationSeverity;
  title: string;
  subtitle: string;
  caption?: string;
};

const SAMPLE_ALERTS: Alert[] = [
  {
    id: '1',
    severity: 'crit',
    title: 'rack-a07-srv03',
    subtitle: 'Rack A07 · Datacenter Paris',
    caption: 'cpu_temp_critical +2',
  },
  {
    id: '2',
    severity: 'crit',
    title: 'rack-b12-srv01',
    subtitle: 'Rack B12 · Datacenter Frankfurt',
    caption: 'disk_full',
  },
  {
    id: '3',
    severity: 'warn',
    title: 'rack-a03-srv11',
    subtitle: 'Rack A03 · Datacenter Paris',
    caption: 'memory_pressure',
  },
  {
    id: '4',
    severity: 'warn',
    title: 'rack-c02-srv05',
    subtitle: 'Rack C02 · Datacenter London',
    caption: 'fan_speed_low',
  },
  {
    id: '5',
    severity: 'info',
    title: 'rack-a01-srv02',
    subtitle: 'Rack A01 · Datacenter Paris',
    caption: 'maintenance_scheduled',
  },
];

const FullPanel = ({
  alerts = SAMPLE_ALERTS,
  defaultOpen = true,
  muted = false,
  onItemClick,
  onViewAll,
  onMuteToggle,
}: {
  alerts?: Alert[];
  defaultOpen?: boolean;
  muted?: boolean;
  onItemClick?: (id: string) => void;
  onViewAll?: () => void;
  onMuteToggle?: () => void;
}) => {
  const [isMuted, setMuted] = useState(muted);
  const crit = alerts.filter((a) => a.severity === 'crit').length;
  const warn = alerts.filter((a) => a.severity === 'warn').length;
  const info = alerts.filter((a) => a.severity === 'info').length;
  return (
    <NotificationsPanel defaultOpen={defaultOpen}>
      <NotificationsPanel.Trigger count={alerts.length} muted={isMuted} />
      <NotificationsPanel.Content>
        <NotificationsPanel.Header title="Active Alerts">
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
                severity={a.severity}
                title={a.title}
                subtitle={a.subtitle}
                caption={a.caption}
                onClick={() => onItemClick?.(a.id)}
              />
            ))}
          </NotificationsPanel.List>
        )}
        <NotificationsPanel.Footer onClick={() => onViewAll?.()}>
          View all alerts →
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

export const Empty: Story = {
  render: () => (
    <div className="flex h-[420px] items-start justify-end">
      <FullPanel alerts={[]} />
    </div>
  ),
};

export const Muted: Story = {
  render: () => (
    <div className="flex h-[420px] items-start justify-end">
      <FullPanel muted />
    </div>
  ),
};

export const HighCount: Story = {
  render: () => (
    <div className="flex h-32 items-start justify-end">
      <NotificationsPanel defaultOpen={false}>
        <NotificationsPanel.Trigger count={12345} />
      </NotificationsPanel>
    </div>
  ),
};

export const AlignLeft: Story = {
  render: () => (
    <div className="flex h-[420px] items-start justify-start">
      <NotificationsPanel defaultOpen align="left">
        <NotificationsPanel.Trigger count={3} />
        <NotificationsPanel.Content>
          <NotificationsPanel.Header title="Active Alerts" />
          <NotificationsPanel.List>
            {SAMPLE_ALERTS.slice(0, 3).map((a) => (
              <NotificationsPanel.Item
                key={a.id}
                severity={a.severity}
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

export const TriggerOpensPanel: Story = {
  render: () => (
    <div className="flex h-[420px] items-start justify-end">
      <FullPanel defaultOpen={false} />
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /^notifications$/i });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // Panel is in a portal, query document instead of canvas
    await expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  },
};

export const ItemClickFiresHandler: Story = {
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
    await userEvent.click(canvas.getByRole('button', { name: /^notifications$/i }));
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    const dialog = document.querySelector('[role="dialog"]')!;
    // Find the first severity item (it has a badge text like "CRIT" / "WARN")
    const items = Array.from(dialog.querySelectorAll('button')).filter((b) =>
      b.textContent?.match(/CRIT|WARN|INFO|OK/)
    );
    await userEvent.click(items[0]);
    await expect(extra.onItemClick).toHaveBeenCalledTimes(1);
  },
};

export const EscapeKeyCloses: Story = {
  render: () => (
    <div className="flex h-[420px] items-start justify-end">
      <FullPanel defaultOpen={false} />
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^notifications$/i }));
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
  },
};
