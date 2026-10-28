import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { API_DAYS, daysFrom, SHAKY_DAYS } from '../storybook-uptime';
import {
  bothDirections,
  directionBox,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  inDirection,
  mobileViewport,
  portalDocsParams,
} from '../storybook-helpers';
import { UptimeBars } from './UptimeBars';
import { dayName, fitCount, formatUptime, thresholdLegend } from './uptime';

const meta = {
  title: 'Monitoring/Uptime Bars',
  component: UptimeBars,
  parameters: portalDocsParams.md(),
  tags: ['autodocs'],
  args: { days: API_DAYS, title: 'API' },
} satisfies Meta<typeof UptimeBars>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 90 days: green from 99.9 %, amber from 99 %, red below, grey without data. */
export const Default: Story = {};

/** `legend` writes the thresholds, so the colours are not a secret. */
export const WithLegend: Story = { args: { legend: true } };

/** `period` shows the latest 30, 60 or 90 days. */
export const Periods: Story = {
  render: (args) => (
    <div className="space-y-6">
      {([30, 60, 90] as const).map((period) => (
        <UptimeBars
          key={period}
          {...args}
          period={period}
          title={`Last ${period} days`}
          ariaLabel={`Last ${period} days`}
        />
      ))}
    </div>
  ),
};

/** A service with more trouble: red days, and a stretch under 99 %. */
export const Shaky: Story = { args: { days: SHAKY_DAYS, title: 'DNS resolver', legend: true } };

/** Days with no data are grey: the monitor did not exist yet, or was paused. */
export const NoData: Story = {
  args: {
    days: daysFrom(Object.fromEntries(Array.from({ length: 40 }, (_, i) => [89 - i, null]))),
    title: 'Web UI',
    legend: true,
  },
};

/** Nothing recorded at all: the header says so. */
export const OnlyNoData: Story = {
  args: { days: daysFrom(Object.fromEntries(Array.from({ length: 30 }, (_, i) => [i, null])), 30) },
};

/** `thresholds` moves the limits: here 99.99 % is the bar for green and 99.9 % for amber. */
export const StricterThresholds: Story = {
  args: { thresholds: { good: 0.9999, warning: 0.999 }, legend: true },
};

/** The same data under looser limits. */
export const LooserThresholds: Story = {
  args: { thresholds: { good: 0.99, warning: 0.95 }, legend: true },
};

/** `uptime` replaces the mean of the days when the host has the exact figure. */
export const ExactUptime: Story = { args: { uptime: 0.99987 } };

/** `compact` is the form for a card: no header, captions or legend. */
export const Compact: Story = { args: { compact: true, days: API_DAYS.slice(-30) } };

/** A narrow container drops the oldest days; the caption and the uptime describe what is drawn. */
export const NarrowContainer: Story = {
  render: (args) => (
    <div className="w-60">
      <UptimeBars {...args} />
    </div>
  ),
};

/** At 375px the oldest days are dropped, "N days ago" and the uptime follow, the page holds still. */
export const Mobile: Story = {
  globals: mobileViewport,
  args: { legend: true },
  play: async ({ canvas, canvasElement }) => {
    expectNoHorizontalOverflow();
    const strip = canvasElement.querySelector<HTMLElement>('[role="group"]')!;
    const shown = strip.querySelectorAll('[role="img"]').length;
    await expect(shown).toBeLessThan(90);
    await expect(shown).toBe(fitCount(strip.clientWidth, 4, 2));
    await expect(canvas.getByText(`${shown} days ago`)).toBeVisible();
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

const daysOf = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[role="img"]')];

const fill = (el: Element) => getComputedStyle(el).backgroundColor;

/** Resized, the bar keeps the newest days; the caption and the uptime are those of the days left. */
export const KeepsTheNewestDaysWhenNarrow: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div data-testid="box" style={{ width: 900 }}>
      <UptimeBars {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const box = canvas.getByTestId('box');
    await waitFor(() => expect(daysOf(canvasElement)).toHaveLength(90));
    await expect(canvas.getByText('90 days ago')).toBeVisible();

    // 30 days' room: the 30 newest days, the oldest of the three amber days out of the picture.
    box.style.width = `${30 * 6}px`;
    await waitFor(() => expect(daysOf(canvasElement)).toHaveLength(fitCount(30 * 6, 4, 2)));
    const kept = daysOf(canvasElement);
    await expect(kept.map((d) => d.getAttribute('aria-label'))).toEqual(
      API_DAYS.slice(-kept.length).map(dayName)
    );
    await expect(kept.at(-1)).toHaveAccessibleName(dayName(API_DAYS.at(-1)!));
    await expect(canvas.getByText(`${kept.length} days ago`)).toBeVisible();
    await expect(canvas.getByText('Today')).toBeVisible();

    // The figure is the mean of the days that are still drawn.
    const shown = API_DAYS.slice(-kept.length);
    const mean = shown.reduce((sum, d) => sum + (d.uptime ?? 0), 0) / shown.length;
    await expect(canvas.getByText(`${formatUptime(mean)} uptime`)).toBeVisible();

    box.style.width = '900px';
    await waitFor(() => expect(daysOf(canvasElement)).toHaveLength(90));
  },
};

/** One tab stop, on today; arrows, Home and End move between days; the tooltip names the day. */
export const KeyboardAndTooltip: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div style={{ width: 300 }}>
      <UptimeBars {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const days = () => daysOf(canvasElement);
    const stops = () => canvasElement.querySelectorAll('[role="img"][tabindex="0"]');
    await waitFor(() => expect(days().length).toBeGreaterThan(5));
    await expect(stops()).toHaveLength(1);
    await expect(stops()[0]).toBe(days().at(-1));

    await userEvent.tab();
    await expect(days().at(-1)).toHaveFocus();
    // The tooltip says the date, the uptime and the incidents.
    const tip = await body.findByRole('tooltip');
    await expect(tip).toHaveTextContent(API_DAYS.at(-1)!.uptime === 1 ? '100% uptime' : 'uptime');
    await expect(tip).toHaveTextContent('no incident');

    await userEvent.keyboard('{ArrowLeft}');
    await expect(days().at(-2)).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(days()[0]).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(days()[0]).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(days().at(-1)).toHaveFocus();
    await expect(stops()).toHaveLength(1);

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('tooltip')).toBeNull());
  },
};

/** An incident of a day is in its tooltip, as it is in its name. */
export const TooltipSaysTheIncidents: Story = {
  tags: ['!dev', '!autodocs'],
  args: { days: daysFrom({ 0: 0.972 }, 30, { 0: 2 }), period: 30 },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const today = daysOf(canvasElement).at(-1)!;
    await expect(today).toHaveAccessibleName('Jan 15, 2026: 97.2% uptime, 2 incidents');
    await userEvent.hover(today);
    const tip = await body.findByRole('tooltip');
    await expect(tip).toHaveTextContent('Jan 15, 2026');
    await expect(tip).toHaveTextContent('97.2% uptime · 2 incidents');
  },
};

/** The thresholds colour the days: one fill per level, and no data is grey. */
export const ThresholdsColourTheDays: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    days: [
      { date: '2026-01-11', uptime: 1 },
      { date: '2026-01-12', uptime: 0.9995 },
      { date: '2026-01-13', uptime: 0.995 },
      { date: '2026-01-14', uptime: 0.95 },
      { date: '2026-01-15', uptime: null },
    ],
    period: 30,
  },
  play: async ({ canvasElement }) => {
    const [full, good, warning, bad, none] = daysOf(canvasElement) as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    // 100 % and 99.95 % are both green.
    await expect(fill(full)).toBe(fill(good));
    const fills = new Set([fill(good), fill(warning), fill(bad), fill(none)]);
    await expect(fills.size).toBe(4);
    await expect(none).toHaveAccessibleName('Jan 15, 2026: No data');
  },
};

/** An override moves the limits: the 99.5 % day is green under a 99 % limit, red under 99.9 %. */
export const AnOverrideMovesTheThresholds: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    days: [
      { date: '2026-01-14', uptime: 1 },
      { date: '2026-01-15', uptime: 0.995 },
    ],
    period: 30,
  },
  render: (args) => (
    <div className="space-y-4">
      <div data-testid="default">
        <UptimeBars {...args} ariaLabel="Default" />
      </div>
      <div data-testid="lenient">
        <UptimeBars {...args} thresholds={{ good: 0.99 }} ariaLabel="Lenient" />
      </div>
      <div data-testid="strict">
        <UptimeBars {...args} thresholds={{ warning: 0.999 }} ariaLabel="Strict" />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const [fullDefault, dayDefault] = daysOf(canvas.getByTestId('default'));
    const [, dayLenient] = daysOf(canvas.getByTestId('lenient'));
    const [, dayStrict] = daysOf(canvas.getByTestId('strict'));
    // By default 99.5 % is amber, so it differs from the green of 100 %.
    await expect(fill(dayDefault!)).not.toBe(fill(fullDefault!));
    // A 99 % limit for green makes it green: the colour of the 100 % day.
    await expect(fill(dayLenient!)).toBe(fill(fullDefault!));
    // A 99.9 % limit for amber makes it red: neither the green nor the amber.
    await expect(fill(dayStrict!)).not.toBe(fill(dayDefault!));
    await expect(fill(dayStrict!)).not.toBe(fill(fullDefault!));
    // The header follows too: the same days read the same figure, in another colour.
    await expect(canvas.getByTestId('lenient').textContent).toContain('99.75% uptime');
  },
};

/** The legend and the names of the days say the levels in words. */
export const LevelsReadWithoutColour: Story = {
  tags: ['!dev', '!autodocs'],
  args: { legend: true, thresholds: { good: 0.9995, warning: 0.995 } },
  play: async ({ canvas }) => {
    const legend = within(canvas.getByRole('list', { name: 'Legend' }));
    for (const { label } of thresholdLegend({ good: 0.9995, warning: 0.995 })) {
      await expect(legend.getByText(label)).toBeVisible();
    }
    await expect(
      canvas.getByRole('img', { name: 'Dec 19, 2025: 97.2% uptime, 2 incidents' })
    ).toBeInTheDocument();
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * The header follows the page (the title at the start, the uptime at the end, its figure in
 * order), while the days keep their time order: the oldest at the left, "Today" at the right.
 */
export const DaysKeepTheirOrderAndHeaderFollowsThePage: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) =>
    bothDirections(() => (
      <div style={{ width: 480 }}>
        <UptimeBars {...args} />
      </div>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const canvas = within(box);
      await waitFor(() => expect(canvas.getAllByRole('img').length).toBeGreaterThan(5));
      const days = canvas.getAllByRole('img');
      expect(days[0]!.getBoundingClientRect().left, `${dir}: oldest day`).toBeLessThan(
        days.at(-1)!.getBoundingClientRect().left
      );
      const ago = canvas.getByText(/days ago$/);
      const today = canvas.getByText('Today');
      expect(ago.getBoundingClientRect().left, `${dir}: caption`).toBeLessThan(
        today.getBoundingClientRect().left
      );
      expectReadsLeftToRight(canvas.getByText(/% uptime$/));
    }
    expectMirrored(canvasElement, (box) => within(box).getByText('API'));
  },
};

/** ArrowLeft goes to the previous day, the one on the left, whatever the direction of the page. */
export const ArrowsFollowTheScreen: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div style={{ width: 480 }}>
      <UptimeBars {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const days = () => within(canvasElement).getAllByRole('img');
    await waitFor(() => expect(days().length).toBeGreaterThan(5));
    for (const dir of ['ltr', 'rtl'] as const) {
      await inDirection(dir, async () => {
        days().at(-1)!.focus();
        await userEvent.keyboard('{ArrowLeft}');
        await expect(days().at(-2)).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}');
        await expect(days().at(-1)).toHaveFocus();
      });
    }
  },
};
