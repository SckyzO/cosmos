import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, Bell, GitBranch, HeartPulse, Home, Server, Settings } from 'lucide-react';
import { expect } from 'storybook/test';
import { PageContainer } from '../layout/PageContainer';
import { Shell } from '../layout/Shell';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { placeholderAvatar } from '../storybook-avatars';
import { ResponseTimeChart } from '../storybook-response-time';
import {
  API_DAYS,
  beatsFrom,
  FLAPPING_BEATS,
  GAPPY_BEATS,
  MIXED_BEATS,
  responseSeries,
} from '../storybook-uptime';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { PageHeader } from '../templates/PageHeader';
import { HeartbeatBar } from '../uptime/HeartbeatBar';
import { MonitorRow, type MonitorRowProps } from '../uptime/MonitorRow';
import { UptimeBars } from '../uptime/UptimeBars';
import { UptimeStat } from '../uptime/UptimeStat';

// A monitors dashboard: the list of monitors with their recent checks, then the detail of one,
// with its uptime, its checks, its response time and its 30 days. Composed from the uptime
// components of the Monitoring group.

const meta = {
  title: 'Pages/Examples/Monitors',
  parameters: portalDocsParams.full(),
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const DAY = 24 * 3_600_000;

type Monitor = MonitorRowProps & { id: string };

const MONITORS: Monitor[] = [
  { id: 'api', name: 'API', type: 'HTTP', beats: MIXED_BEATS, uptime: 0.9992 },
  { id: 'web', name: 'Web app', type: 'HTTP', beats: beatsFrom('u'.repeat(60)), uptime: 1 },
  {
    id: 'prometheus',
    name: 'Prometheus',
    type: 'keyword',
    beats: beatsFrom('u'.repeat(38) + 'ggguugggguggg'),
    uptime: 0.9992,
  },
  {
    id: 'dns',
    name: 'DNS resolver',
    type: 'DNS',
    beats: beatsFrom('u'.repeat(41) + 'dddudddddd'),
    uptime: 0.974,
  },
  { id: 'edge', name: 'Edge proxy', type: 'TCP', beats: FLAPPING_BEATS, uptime: 0.931 },
  {
    id: 'backup',
    name: 'Backup host',
    type: 'ping',
    beats: GAPPY_BEATS,
    uptime: null,
    paused: true,
  },
];

const MonitorsContent = () => (
  <PageContainer width="full" className="space-y-6">
    <PageHeader
      as="h1"
      title="Monitors"
      description="Each monitor checks its target every minute."
    />

    <ul className="m-0 list-none divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-0">
      {MONITORS.map(({ id, ...monitor }) => (
        <li key={id}>
          <MonitorRow {...monitor} />
        </li>
      ))}
    </ul>

    <section aria-labelledby="monitor-detail" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2
          id="monitor-detail"
          className="m-0 text-base font-semibold text-[var(--color-text-primary)]"
        >
          API
        </h2>
        <span className="text-2xs rounded bg-gray-100 px-1.5 font-mono leading-[18px] text-[var(--color-text-secondary)] dark:bg-gray-800">
          HTTP
        </span>
        <span className="font-mono text-sm break-all text-[var(--color-text-secondary)]">
          https://api.example.test/health
        </span>
      </div>

      <UptimeStat
        periods={[
          { label: '24 hours', uptime: 0.9992, duration: DAY },
          { label: '7 days', uptime: 0.9998, duration: 7 * DAY },
          { label: '30 days', uptime: 0.9991, duration: 30 * DAY },
          { label: '1 year', uptime: 0.9962, duration: 365 * DAY },
        ]}
        responseTime={182}
        certificate={{ daysLeft: 12 }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-5">
          <p className="m-0 mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            Recent checks
          </p>
          <HeartbeatBar beats={MIXED_BEATS} legend ariaLabel="API: recent checks" />
        </div>
        <div className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-5">
          <p className="m-0 mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            Response time, last 24 hours
          </p>
          <ResponseTimeChart
            points={responseSeries(96, 180, [60, 64])}
            ariaLabel="API response time over the last 24 hours, with one outage"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-5">
        <UptimeBars days={API_DAYS} period={30} title="Last 30 days" legend />
      </div>
    </section>
  </PageContainer>
);

const MonitorsPage = () => (
  <Shell
    topbar={
      <Topbar
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
              src={placeholderAvatar('cosmos-monitors', 64)}
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
          <Sidebar.Item icon={HeartPulse} label="Monitors" active />
          <Sidebar.Item icon={Activity} label="Activity" />
          <Sidebar.Item icon={GitBranch} label="Deployments" />
          <Sidebar.Item icon={Server} label="Servers" />
          <Sidebar.Item icon={Settings} label="Settings" />
        </Sidebar.Section>
      </Sidebar>
    }
  >
    <MonitorsContent />
  </Shell>
);

export const Default: Story = {
  render: () => <MonitorsPage />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Monitors' })).toBeVisible();
    await expect(canvas.getByRole('heading', { level: 2, name: 'API' })).toBeVisible();
  },
};

/** At 375px the rows stack, the stats fold to two columns and the page holds still. */
export const Mobile: Story = {
  ...Default,
  globals: mobileViewport,
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(canvas.getByText('Recent checks')).toBeVisible();
  },
};
