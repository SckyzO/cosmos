import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { HEALTH_GROUPS, HEALTH_NOW, checksOf } from '../storybook-health';
import {
  bothDirections,
  directionBox,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  mobileViewport,
} from '../storybook-helpers';
import { flattenChecks } from './health';
import { HealthSummary } from './HealthSummary';

const meta = {
  title: 'Monitoring/Health Summary',
  component: HealthSummary,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { checks: flattenChecks(HEALTH_GROUPS), now: HEALTH_NOW },
} satisfies Meta<typeof HealthSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

const OPERATIONAL = checksOf({ OK: 14 });
const DEGRADED = checksOf({ OK: 12, WARN: 2 });
const OUTAGE = checksOf({ OK: 11, WARN: 2, CRIT: 1 });
const UNKNOWN = checksOf({ OK: 10, UNKNOWN: 4 });
const NOTICES = checksOf({ OK: 13, INFO: 1 });

/** Two warnings among fourteen checks: "Degraded performance". The worst status wins. */
export const Banner: Story = {};

export const AllOperational: Story = { args: { checks: OPERATIONAL } };

export const MajorOutage: Story = { args: { checks: OUTAGE } };

/** A check nobody could run weighs more than one that passes, and less than a warning. */
export const Unknown: Story = { args: { checks: UNKNOWN } };

/** An info check alone does not degrade the system. */
export const Notices: Story = { args: { checks: NOTICES } };

export const NoChecks: Story = { args: { checks: [] } };

/** The banner of each status, from the best to the worst. */
export const EveryStatusBanner: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {[OPERATIONAL, NOTICES, UNKNOWN, DEGRADED, OUTAGE].map((checks, i) => (
        <HealthSummary key={i} {...args} checks={checks} />
      ))}
    </div>
  ),
};

/** One line, for a card or a topbar, for each status. */
export const EveryStatusCompact: Story = {
  args: { variant: 'compact' },
  render: (args) => (
    <div className="flex max-w-3xl flex-col gap-3">
      {[OPERATIONAL, NOTICES, UNKNOWN, DEGRADED, OUTAGE].map((checks, i) => (
        <HealthSummary key={i} {...args} checks={checks} />
      ))}
    </div>
  ),
};

/** The host weighs the checks differently: a warning on a backup job is not a degradation. */
export const StatusOverride: Story = {
  args: { checks: DEGRADED, status: 'OK' },
};

export const CustomLabels: Story = {
  args: {
    checks: OUTAGE,
    labels: { CRIT: 'Service disruption', WARN: 'Some services are slow' },
  },
};

/** The refresh button of the page, with its auto-refresh menu. */
export const WithRefresh: Story = {
  args: {
    refresh: { autoRefreshMs: 0, onRefresh: fn(), onIntervalChange: fn() },
  },
};

export const CompactWithRefresh: Story = {
  args: {
    variant: 'compact',
    refresh: { autoRefreshMs: 30_000, onRefresh: fn(), onIntervalChange: fn() },
  },
};

/** The banner and the compact line at 375px: the badges and the button wrap, nothing widens the page. */
export const Mobile: Story = {
  globals: mobileViewport,
  args: { refresh: { autoRefreshMs: 0, onRefresh: fn(), onIntervalChange: fn() } },
  render: (args) => (
    <div className="flex flex-col gap-3">
      <HealthSummary {...args} checks={OUTAGE} />
      <HealthSummary {...args} variant="compact" />
    </div>
  ),
  play: () => expectNoHorizontalOverflow(),
};

// ── Tests ────────────────────────────────────────────────────────────────────

/** The worst status of the checks is the one shown, for each variant. */
export const WorstStatusWins: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex flex-col gap-3">
      <HealthSummary checks={DEGRADED} now={HEALTH_NOW} ariaLabel="Degraded" />
      <HealthSummary checks={OUTAGE} now={HEALTH_NOW} ariaLabel="Outage" />
      <HealthSummary checks={UNKNOWN} now={HEALTH_NOW} ariaLabel="Unknown" variant="compact" />
      <HealthSummary checks={OPERATIONAL} now={HEALTH_NOW} ariaLabel="Operational" />
    </div>
  ),
  play: async ({ canvas }) => {
    const headline = (name: string) =>
      canvas.getByRole('group', { name }).querySelector('[role="status"]');
    await expect(headline('Degraded')).toHaveTextContent('Degraded performance');
    await expect(headline('Outage')).toHaveTextContent('Major outage');
    await expect(headline('Unknown')).toHaveTextContent('Status unknown');
    await expect(headline('Operational')).toHaveTextContent('All systems operational');
  },
};

/** The `status` prop wins over the checks, and the counts keep reading them. */
export const StatusPropOverrides: Story = {
  tags: ['!dev', '!autodocs'],
  args: { checks: OUTAGE, status: 'WARN' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Degraded performance');
    await expect(canvas.queryByText('Major outage')).toBeNull();
    await expect(canvas.getByText('1 Critical')).toBeVisible();
  },
};

/** The status, the counts and the last check are all text. */
export const ConveysStatusAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: { checks: DEGRADED },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('12 OK')).toBeVisible();
    await expect(canvas.getByText('2 Warning')).toBeVisible();
    await expect(canvas.getByText(/2 of 14 checks need attention/)).toBeVisible();
    await expect(canvas.getByRole('group')).toHaveTextContent(/last check 30 seconds ago/);
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The icon and the headline start the line and the refresh button ends it; the counts keep their order. */
export const BannerAndCompactFollowTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="space-y-3">
        <HealthSummary checks={DEGRADED} now={HEALTH_NOW} ariaLabel="Banner" />
        <HealthSummary
          checks={DEGRADED}
          now={HEALTH_NOW}
          ariaLabel="Compact"
          variant="compact"
          refresh={{ autoRefreshMs: 0, onRefresh: fn(), onIntervalChange: fn() }}
        />
      </div>
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      for (const name of ['Banner', 'Compact']) {
        const summary = within(box).getByRole('group', { name });
        expectReadsLeftToRight(summary.querySelector('bdi')!);
      }
      // The banner's badges, "12 OK" and not "OK 12".
      const badges = within(within(box).getByRole('group', { name: 'Banner' })).getAllByText(
        /^\d+ (OK|Warning|Critical|Unknown|Info)$/
      );
      expect(badges.length, `${dir}: badges`).toBeGreaterThan(1);
      for (const badge of badges) expectReadsLeftToRight(badge);
    }
    expectMirrored(canvasElement, (box) =>
      within(within(box).getByRole('group', { name: 'Compact' })).getByRole('button', {
        name: /Refresh/,
      })
    );
    expectMirrored(canvasElement, (box) =>
      within(within(box).getByRole('group', { name: 'Banner' })).getByRole('status')
    );
  },
};
