import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { API_DAYS } from '../storybook-uptime';
import {
  bothDirections,
  directionBox,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';
import { UptimeStat, type UptimePeriod } from './UptimeStat';

const DAY = 24 * 3_600_000;

const PERIODS: UptimePeriod[] = [
  { label: '24 hours', uptime: 1, duration: DAY },
  { label: '7 days', uptime: 0.9998, duration: 7 * DAY },
  { label: '30 days', uptime: 0.9991, duration: 30 * DAY },
  { label: '1 year', uptime: 0.9962, duration: 365 * DAY },
];

const meta = {
  title: 'Monitoring/Uptime Stat',
  component: UptimeStat,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    periods: PERIODS,
    responseTime: 182,
    certificate: { daysLeft: 12 },
  },
} satisfies Meta<typeof UptimeStat>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The `row`: each period coloured by the thresholds, the response time, and a certificate close to expiry. */
export const Row: Story = {};

/** A certificate with weeks left is plain text: the warning is for under `warnBelow` days (14 by default). */
export const CertificateOk: Story = { args: { certificate: { daysLeft: 62 } } };

/** The host sets its own limit: here a warning under 30 days. */
export const CertificateWarnBelow: Story = {
  args: { certificate: { daysLeft: 25, warnBelow: 30 } },
};

export const CertificateExpired: Story = { args: { certificate: { daysLeft: -3 } } };

/** Only what the host has: two periods and no certificate. */
export const PeriodsOnly: Story = {
  args: { periods: PERIODS.slice(0, 2), responseTime: undefined, certificate: undefined },
};

/** A period with no data reads "—", and says "No data" to a screen reader. */
export const NoDataPeriod: Story = {
  args: {
    periods: [...PERIODS.slice(0, 3), { label: '1 year', uptime: null, duration: 365 * DAY }],
  },
};

/** `thresholds` moves the limits for every period. */
export const StricterThresholds: Story = {
  args: { thresholds: { good: 0.9999, warning: 0.999 } },
};

/** The `card`: one period's uptime and the downtime it stands for. */
export const Card: Story = {
  args: { variant: 'card', periods: [PERIODS[2]!], label: 'API uptime, 30 days' },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
};

/** With `days`, the card draws them as compact bars under the figure. */
export const CardWithDays: Story = {
  ...Card,
  args: { ...Card.args, days: API_DAYS.slice(-30) },
};

/** Three cards in a row, one per level. */
export const CardLevels: Story = {
  render: (args) => (
    <div className="grid gap-4 sm:grid-cols-3">
      <UptimeStat
        {...args}
        variant="card"
        label="API, 30 days"
        periods={[{ label: '30 days', uptime: 0.9998, duration: 30 * DAY }]}
      />
      <UptimeStat
        {...args}
        variant="card"
        label="DNS, 30 days"
        periods={[{ label: '30 days', uptime: 0.9941, duration: 30 * DAY }]}
      />
      <UptimeStat
        {...args}
        variant="card"
        label="Backups, 30 days"
        periods={[{ label: '30 days', uptime: 0.962, duration: 30 * DAY }]}
      />
    </div>
  ),
};

/** At 375px the row folds to two columns and the page does not scroll sideways. */
export const MobileRow: Story = {
  globals: mobileViewport,
};

export const MobileRowChecks: Story = {
  ...MobileRow,
  tags: ['!dev', '!autodocs'],
  play: () => expectNoHorizontalOverflow(),
};

export const MobileCard: Story = {
  ...CardWithDays,
  globals: mobileViewport,
};

export const MobileCardChecks: Story = {
  ...MobileCard,
  tags: ['!dev', '!autodocs'],
  play: () => expectNoHorizontalOverflow(),
};

// ── Tests ────────────────────────────────────────────────────────────────────

const fill = (el: Element) => getComputedStyle(el).color;

/** A certificate under its threshold shows a warning, in words and with an icon; above it, none. */
export const CertificateWarningShowsUnderItsThreshold: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="space-y-4">
      <div data-testid="soon">
        <UptimeStat {...args} ariaLabel="Soon" certificate={{ daysLeft: 13 }} />
      </div>
      <div data-testid="at">
        <UptimeStat {...args} ariaLabel="At" certificate={{ daysLeft: 14 }} />
      </div>
      <div data-testid="custom">
        <UptimeStat {...args} ariaLabel="Custom" certificate={{ daysLeft: 25, warnBelow: 30 }} />
      </div>
      <div data-testid="far">
        <UptimeStat {...args} ariaLabel="Far" certificate={{ daysLeft: 60, warnBelow: 30 }} />
      </div>
      <div data-testid="expired">
        <UptimeStat {...args} ariaLabel="Expired" certificate={{ daysLeft: -1 }} />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const warning = (id: string) =>
      within(canvas.getByTestId(id)).queryByRole('img', { name: 'Warning' });
    await expect(warning('soon')).toBeInTheDocument();
    await expect(within(canvas.getByTestId('soon')).getByText('13 days left')).toBeVisible();
    // At the threshold it is not under it.
    await expect(warning('at')).toBeNull();
    // The host's limit moves it.
    await expect(warning('custom')).toBeInTheDocument();
    await expect(warning('far')).toBeNull();
    await expect(warning('expired')).toBeInTheDocument();
    await expect(within(canvas.getByTestId('expired')).getByText('Expired')).toBeVisible();
  },
};

/** Each period is named by its label and coloured by its level. */
export const PeriodsAreLabelledAndColouredByThresholds: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    periods: [
      { label: '24 hours', uptime: 1 },
      { label: '7 days', uptime: 0.9995 },
      { label: '30 days', uptime: 0.995 },
      { label: '1 year', uptime: 0.95 },
      { label: 'Since launch', uptime: null },
    ],
    responseTime: 182,
    certificate: undefined,
  },
  play: async ({ canvas }) => {
    const value = (label: string) =>
      canvas.getByText(label).closest('dt')!.nextElementSibling!.firstElementChild!;
    await expect(canvas.getByRole('group', { name: 'Uptime' })).toBeInTheDocument();
    await expect(canvas.getByText('100%')).toBeVisible();
    await expect(canvas.getByText('99.95%')).toBeVisible();
    await expect(canvas.getByText('99.5%')).toBeVisible();
    await expect(canvas.getByText('95%')).toBeVisible();
    await expect(canvas.getByText('No data')).toBeInTheDocument();
    await expect(canvas.getByText('182 ms')).toBeVisible();
    // 100 % and 99.95 % are the same green; amber and red are neither it nor each other.
    await expect(fill(value('24 hours'))).toBe(fill(value('7 days')));
    const others = new Set([fill(value('7 days')), fill(value('30 days')), fill(value('1 year'))]);
    await expect(others.size).toBe(3);
  },
};

/** An override moves the colour of a period. */
export const AnOverrideMovesTheColours: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    periods: [{ label: '30 days', uptime: 0.995 }],
    certificate: undefined,
    responseTime: undefined,
  },
  render: (args) => (
    <div className="space-y-4">
      <div data-testid="default">
        <UptimeStat {...args} />
      </div>
      <div data-testid="lenient">
        <UptimeStat {...args} thresholds={{ good: 0.99 }} />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const figure = (id: string) => within(canvas.getByTestId(id)).getByText('99.5%');
    await expect(fill(figure('default'))).not.toBe(fill(figure('lenient')));
  },
};

/** The card says the downtime its uptime stands for, and none for a perfect period. */
export const CardSaysTheDowntime: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="max-w-sm space-y-4">
      <UptimeStat {...args} variant="card" label="Some downtime" periods={[PERIODS[2]!]} />
      <UptimeStat {...args} variant="card" label="Perfect" periods={[PERIODS[0]!]} />
      <UptimeStat
        {...args}
        variant="card"
        label="No duration"
        periods={[{ label: '30 days', uptime: 0.9991 }]}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Some downtime')).toBeVisible();
    await expect(canvas.getByText('39 min down')).toBeVisible();
    await expect(canvas.getByText('No downtime')).toBeVisible();
    // Without a duration it cannot say how long, and says nothing.
    await expect(canvas.getAllByText('99.91%')).toHaveLength(2);
    await expect(canvas.getAllByText(/ down$/)).toHaveLength(1);
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The periods run from the start of the line, and each figure keeps its percent sign after its number. */
export const FiguresRunFromTheStartOfTheLine: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => bothDirections(() => <UptimeStat {...args} />),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const canvas = within(box);
      const day = canvas.getByText('24 hours');
      const year = canvas.getByText('1 year');
      expect(startOffset(day, box), `${dir}: first period`).toBeLessThan(startOffset(year, box));
      for (const figure of ['100%', '99.98%', '99.91%', '99.62%'])
        expectReadsLeftToRight(canvas.getByText(figure));
      expectReadsLeftToRight(canvas.getByText('182 ms'));
    }
    expectMirrored(canvasElement, (box) => within(box).getByText('24 hours'));
    expectMirrored(canvasElement, (box) => within(box).getByText('1 year'));
  },
};
