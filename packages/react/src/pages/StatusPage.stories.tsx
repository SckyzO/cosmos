import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckCircle2, Eye, Search, Target } from 'lucide-react';
import { expect } from 'storybook/test';
import { Timeline, type TimelineItem } from '../data/Timeline';
import { PageContainer } from '../layout/PageContainer';
import type { HealthCheck } from '../status/health';
import { HealthSummary } from '../status/HealthSummary';
import type { HealthStatus } from '../status/types';
import { API_DAYS, daysFrom, SHAKY_DAYS, UPTIME_NOW } from '../storybook-uptime';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { AlertBanner } from '../ui/AlertBanner';
import { UptimeBars } from '../uptime/UptimeBars';
import type { UptimeDay } from '../uptime/types';

// A public status page: the roll-up of the services, a maintenance notice, the services in
// groups with their 90 days of uptime, and the incidents of the last weeks. Composed from the
// health and uptime components of the Monitoring group.

const meta = {
  title: 'Pages/Examples/Status Page',
  parameters: portalDocsParams.full(),
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Service = { id: string; name: string; status: HealthStatus; days: UptimeDay[] };
type ServiceGroup = { id: string; name: string; services: Service[] };

const GROUPS: ServiceGroup[] = [
  {
    id: 'core',
    name: 'Core services',
    services: [
      { id: 'api', name: 'API', status: 'OK', days: API_DAYS },
      {
        id: 'web',
        name: 'Web app',
        status: 'OK',
        days: daysFrom({ 41: 0.9981, 40: 0.9994, 9: 0.9996 }, 90, { 41: 1 }),
      },
      { id: 'db', name: 'Database', status: 'OK', days: daysFrom({ 77: 0.9992 }) },
    ],
  },
  {
    id: 'network',
    name: 'Network',
    services: [
      { id: 'dns', name: 'DNS resolver', status: 'WARN', days: SHAKY_DAYS },
      { id: 'cdn', name: 'CDN', status: 'OK', days: daysFrom({ 30: 0.9993 }) },
    ],
  },
];

const checks: HealthCheck[] = GROUPS.flatMap((group) =>
  group.services.map((service) => ({
    id: service.id,
    name: service.name,
    status: service.status,
    checkedAt: UPTIME_NOW - 45_000,
  }))
);

const INCIDENTS: TimelineItem[] = [
  {
    id: 'resolved',
    group: '15 January',
    title: 'API timeouts: resolved',
    description: 'The pool is back to normal size and the checks have passed for 30 minutes.',
    time: '11:20',
    icon: CheckCircle2,
    intent: 'success',
  },
  {
    id: 'monitoring',
    group: '15 January',
    title: 'API timeouts: monitoring',
    description: 'A fix is live. We are watching the error rate.',
    time: '10:48',
    icon: Eye,
    intent: 'brand',
  },
  {
    id: 'identified',
    group: '15 January',
    title: 'API timeouts: identified',
    description: 'The database connection pool was exhausted by a runaway job.',
    time: '10:21',
    icon: Target,
    intent: 'warning',
  },
  {
    id: 'investigating',
    group: '15 January',
    title: 'API timeouts: investigating',
    description: 'Requests to the API are timing out.',
    time: '10:06',
    icon: Search,
    intent: 'danger',
  },
];

const StatusContent = () => (
  <PageContainer width="narrow" className="space-y-6">
    <header>
      <h1 className="m-0 text-2xl font-semibold text-[var(--color-text-primary)]">Cosmos status</h1>
      <p className="m-0 mt-1 text-sm text-[var(--color-text-secondary)]">
        The state of Cosmos services, and what happened in the last 90 days.
      </p>
    </header>

    <HealthSummary
      checks={checks}
      now={UPTIME_NOW}
      labels={{ WARN: 'Some systems are degraded', OK: 'All systems operational' }}
    />

    <AlertBanner intent="info" title="Scheduled maintenance">
      The database moves to new hardware on 18 January, from 02:00 to 03:00 UTC. The API stays up,
      with a short read-only period.
    </AlertBanner>

    {GROUPS.map((group) => (
      <section
        key={group.id}
        aria-labelledby={`group-${group.id}`}
        className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)]"
      >
        <h2
          id={`group-${group.id}`}
          className="m-0 border-b border-[var(--color-border)] px-5 py-3 text-base font-semibold text-[var(--color-text-primary)]"
        >
          {group.name}
        </h2>
        <ul className="m-0 list-none divide-y divide-[var(--color-border)] p-0">
          {group.services.map((service) => (
            <li key={service.id} className="px-5 py-4">
              <UptimeBars days={service.days} title={service.name} />
            </li>
          ))}
        </ul>
        {group.id === 'network' && (
          <p className="m-0 border-t border-[var(--color-border)] px-5 py-3 text-sm text-[var(--color-text-secondary)]">
            Green: 99.9% and up. Amber: 99% to 99.9%. Red: below 99%. Grey: no data.
          </p>
        )}
      </section>
    ))}

    <section aria-labelledby="past-incidents" className="space-y-3">
      <h2
        id="past-incidents"
        className="m-0 text-base font-semibold text-[var(--color-text-primary)]"
      >
        Past incidents
      </h2>
      <Timeline items={INCIDENTS} variant="stepper" />
    </section>
  </PageContainer>
);

export const Default: Story = {
  render: () => <StatusContent />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Cosmos status' })).toBeVisible();
    await expect(canvas.getByText('Some systems are degraded')).toBeVisible();
  },
};

/** At 375px the services stack, the oldest days are dropped and the page holds still. */
export const Mobile: Story = {
  ...Default,
  globals: mobileViewport,
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(canvas.getByText('Past incidents')).toBeVisible();
  },
};
