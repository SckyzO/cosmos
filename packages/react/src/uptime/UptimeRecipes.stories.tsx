import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckCircle2, Eye, Search, Target, Wrench } from 'lucide-react';
import { expect } from 'storybook/test';
import { Timeline, type TimelineItem } from '../data/Timeline';
import { ResponseTimeChart } from '../storybook-response-time';
import { responseSeries } from '../storybook-uptime';
import { AlertBanner } from '../ui/AlertBanner';

// Three things the uptime components do not draw themselves: a response-time chart with the down
// periods shaded, the timeline of an incident and the notice of a planned maintenance. Each is a
// composition of components that already exist.

const meta = {
  title: 'Monitoring/Uptime Recipes',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Response time, with the down periods as shaded bands. The stories draw it with a plain SVG,
 * since react ships no chart library: with `@sckyzo/cosmos-charts`, a `LineAreaChart` whose
 * `referenceBands` are the down periods does the same.
 */
export const ResponseTime: Story = {
  render: () => (
    <div className="max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-5">
      <p className="m-0 mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
        Response time, last 24 hours
      </p>
      <ResponseTimeChart
        points={responseSeries(96, 180, [60, 64])}
        ariaLabel="Response time over the last 24 hours, with one outage"
      />
    </div>
  ),
};

const INCIDENT: TimelineItem[] = [
  {
    id: 'resolved',
    title: 'Resolved',
    description: 'The pool is back to normal size and the checks have passed for 30 minutes.',
    time: '11:20',
    icon: CheckCircle2,
    intent: 'success',
  },
  {
    id: 'monitoring',
    title: 'Monitoring',
    description: 'A fix is live. We are watching the error rate and the response times.',
    time: '10:48',
    icon: Eye,
    intent: 'brand',
  },
  {
    id: 'identified',
    title: 'Identified',
    description: 'The database connection pool was exhausted by a runaway job.',
    time: '10:21',
    icon: Target,
    intent: 'warning',
  },
  {
    id: 'investigating',
    title: 'Investigating',
    description: 'Requests to the API are timing out. We are looking into it.',
    time: '10:06',
    icon: Search,
    intent: 'danger',
  },
];

/** An incident, newest update first: Investigating, Identified, Monitoring, Resolved. */
export const Incident: Story = {
  render: () => (
    <div className="max-w-xl">
      <h3 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">
        API timeouts · 15 Jan 2026
      </h3>
      <Timeline items={INCIDENT} variant="stepper" />
    </div>
  ),
  play: async ({ canvas }) => {
    for (const step of ['Investigating', 'Identified', 'Monitoring', 'Resolved']) {
      await expect(canvas.getByText(step)).toBeVisible();
    }
  },
};

/** A planned maintenance: an `AlertBanner`, which monitors in the window show as maintenance. */
export const MaintenanceNotice: Story = {
  render: () => (
    <div className="max-w-3xl">
      <AlertBanner
        intent="info"
        title="Scheduled maintenance"
        action={
          <a
            href="#details"
            className="text-brand-600 dark:text-brand-400 text-sm font-medium underline"
          >
            Details
          </a>
        }
      >
        The database moves to new hardware on 18 January, from 02:00 to 03:00 UTC. The API stays up,
        with a short read-only period.
      </AlertBanner>
    </div>
  ),
};

/** The maintenance window as a timeline entry, next to the incidents. */
export const MaintenanceInTheTimeline: Story = {
  render: () => (
    <div className="max-w-xl">
      <Timeline
        variant="stepper"
        items={[
          {
            id: 'window',
            title: 'Scheduled: database move',
            description: '18 January, 02:00 to 03:00 UTC.',
            time: 'Upcoming',
            icon: Wrench,
            intent: 'brand',
          },
          ...INCIDENT.slice(0, 1),
        ]}
      />
    </div>
  ),
};
