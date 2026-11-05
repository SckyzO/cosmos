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
import { LabelsProvider } from '../labels/LabelsProvider';

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

const STALE_SINCE = HEALTH_NOW - 4 * 60_000;

/**
 * `stale` is when the last data came in: the status colours go grey, a "Stale · 4 minutes ago" tag
 * joins the banner and the headline is read as stale. The status stays the last known one.
 */
export const Stale: Story = { args: { stale: STALE_SINCE } };

export const StaleCompact: Story = { args: { stale: STALE_SINCE, variant: 'compact' } };

/** The banner and the compact line at 375px: the badges and the button wrap, nothing widens the page. */
const mobile: Story = {
  globals: mobileViewport,
  args: { refresh: { autoRefreshMs: 0, onRefresh: fn(), onIntervalChange: fn() } },
  render: (args) => (
    <div className="flex flex-col gap-3">
      <HealthSummary {...args} checks={OUTAGE} />
      <HealthSummary {...args} variant="compact" />
    </div>
  ),
};

export const MobileChecks: Story = {
  ...mobile,
  tags: ['!dev', '!autodocs'],
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

/** The tag says how old the data is, and the headline is read as stale. */
export const StaleIsWrittenAndRead: Story = {
  ...Stale,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/^Stale/)).toHaveTextContent('Stale · 4 minutes ago');
    await expect(canvas.getByRole('status')).toHaveTextContent('Degraded performance, stale data');
    await expect(canvas.getByText('2 Warning')).toBeVisible();
  },
};

export const FreshDataSaysNothingOfStaleness: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/^Stale/)).toBeNull();
    await expect(canvas.getByRole('status')).toHaveTextContent(/^Degraded performance$/);
  },
};

/** A stale banner takes the neutral surface and its badges go grey, whatever the last status was. */
export const StaleMutesTheStatusColours: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex flex-col gap-3">
      <HealthSummary checks={OUTAGE} now={HEALTH_NOW} stale={STALE_SINCE} ariaLabel="Stale" />
      <HealthSummary checks={UNKNOWN} now={HEALTH_NOW} ariaLabel="Neutral" />
    </div>
  ),
  play: async ({ canvas }) => {
    const stale = canvas.getByRole('group', { name: 'Stale' });
    const neutral = canvas.getByRole('group', { name: 'Neutral' });
    const surface = (el: HTMLElement) => {
      const { backgroundColor, borderColor } = getComputedStyle(el);
      return { backgroundColor, borderColor };
    };
    await expect(surface(stale)).toEqual(surface(neutral));
    const badge = within(stale).getByText('1 Critical').closest('span')!;
    await expect(getComputedStyle(badge.parentElement!).filter).toContain('grayscale');
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

// A wrapped line may end with the separator, never start with it.
export const SeparatorNeverStartsALine: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="box" style={{ width: 300 }}>
      <div className="flex flex-col gap-3">
        <HealthSummary checks={DEGRADED} now={HEALTH_NOW} ariaLabel="Banner" />
        <HealthSummary checks={DEGRADED} now={HEALTH_NOW} ariaLabel="Compact" variant="compact" />
      </div>
    </div>
  ),
  play: ({ canvas }) => {
    const box = canvas.getByTestId('box');
    const dots: { text: Text; at: number; block: HTMLElement }[] = [];
    const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node as Text;
      let block = text.parentElement!;
      while (/^inline/.test(getComputedStyle(block).display)) block = block.parentElement!;
      for (let at = text.data.indexOf('·'); at >= 0; at = text.data.indexOf('·', at + 1)) {
        dots.push({ text, at, block });
      }
    }
    expect(dots.length).toBeGreaterThanOrEqual(2);
    // Every width where the line can break next to a dot, one pixel at a time.
    for (let width = 160; width <= 520; width++) {
      box.style.width = `${width}px`;
      for (const { text, at, block } of dots) {
        const range = document.createRange();
        range.setStart(text, at);
        range.setEnd(text, at + 1);
        const lineStart = block.getBoundingClientRect().left;
        expect(
          range.getBoundingClientRect().left - lineStart,
          `${width}px: a line starts with the separator`
        ).toBeGreaterThan(1);
      }
    }
  },
};

/** The provider writes the headlines, the detail and the status names, and the summary's own `labels` win over it. */
export const TranslatedByLabels: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const checks = [
      { id: 'a', name: 'API', status: 'OK' as const },
      { id: 'b', name: 'Base', status: 'WARN' as const },
    ];
    return (
      <LabelsProvider
        labels={{
          healthSummary: {
            WARN: 'Performances dégradées',
            OK: 'Tout fonctionne',
            group: 'Santé du système',
            noChecks: 'Aucun contrôle',
            allClear: (total) => `${total} contrôles, aucun à surveiller`,
            needAttention: (attention, total) => `${attention} contrôle sur ${total} à surveiller`,
            lastCheck: ' dernier contrôle ',
            staleNote: ', données obsolètes',
          },
          healthStatus: {
            OK: 'OK',
            WARN: 'Alerte',
            CRIT: 'Critique',
            UNKNOWN: 'Inconnu',
            INFO: 'Info',
          },
        }}
      >
        <HealthSummary checks={checks} />
        <HealthSummary checks={[]} ariaLabel="Autre" labels={{ UNKNOWN: 'Statut inconnu' }} />
        <HealthSummary
          checks={[checks[0]!]}
          variant="compact"
          labels={{ group: 'Santé compacte' }}
        />
      </LabelsProvider>
    );
  },
  play: async ({ canvas }) => {
    const group = within(canvas.getByRole('group', { name: 'Santé du système' }));
    await expect(group.getByText('Performances dégradées')).toBeVisible();
    await expect(group.getByText(/1 contrôle sur 2 à surveiller/)).toBeVisible();
    await expect(group.getByText('1 Alerte')).toBeVisible();
    const other = within(canvas.getByRole('group', { name: 'Autre' }));
    await expect(other.getByText('Statut inconnu')).toBeVisible();
    await expect(other.getByText('Aucun contrôle')).toBeVisible();
    await expect(canvas.getByRole('group', { name: 'Santé compacte' })).toBeVisible();
  },
};
