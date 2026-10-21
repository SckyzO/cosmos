import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { LineAreaChart } from './LineAreaChart';
import { HOSTILE, expectNoInjectedImage, hover } from './storybook-helpers';

const HOURS = ['00h', '03h', '06h', '09h', '12h', '15h', '18h', '21h', '24h'];
const WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
const HOURLY = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Line & Area',
  component: LineAreaChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof LineAreaChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/** One series on a category axis: smooth line, gradient fill. */
export const Basic: Story = {
  args: {
    series: [{ name: 'CPU', data: [12, 19, 23, 31, 22, 18, 25, 33, 30] }],
    categories: HOURS,
  },
};

/**
 * Several series overlap, drawn in palette order. The wrapper hides the
 * legend: the series names show in the tooltip.
 */
export const MultiSeries: Story = {
  args: {
    series: [
      { name: 'p50 latency (ms)', data: [42, 45, 48, 61, 58, 52, 55, 63, 50] },
      { name: 'p95 latency (ms)', data: [118, 124, 131, 172, 160, 141, 150, 184, 137] },
      { name: 'p99 latency (ms)', data: [210, 226, 240, 318, 296, 262, 281, 342, 251] },
    ],
    categories: HOURS,
  },
};

/** The fill runs from the line to zero, below the axis too. */
export const NegativeValues: Story = {
  args: {
    series: [
      {
        name: 'Error budget left (%)',
        data: [100, 92, 85, 79, 70, 58, 41, 22, 6, -8, -15, -4],
      },
    ],
    categories: WEEKS,
  },
};

/**
 * A day of hourly samples. There is no datetime axis: the timestamps are
 * categories, and ApexCharts rotates them when they don't fit.
 */
export const HourlySamples: Story = {
  args: {
    series: [
      {
        name: 'Requests/s',
        data: [
          820, 640, 510, 460, 450, 520, 780, 1240, 1810, 2240, 2460, 2580, 2610, 2550, 2490, 2420,
          2380, 2290, 2050, 1760, 1480, 1260, 1050, 910,
        ],
      },
    ],
    categories: HOURLY,
  },
};

/** `height` fits the chart in a dashboard tile. */
export const CompactHeight: Story = {
  args: {
    height: 160,
    series: [{ name: 'Memory (%)', data: [61, 63, 62, 66, 70, 68, 72, 74, 71] }],
    categories: HOURS,
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/**
 * Charts re-read their colors when the theme or accent changes on `<html>`. The
 * y-axis labels used to come back empty after that update: LineAreaChart
 * shared one labels object between both axes and ApexCharts wrote the
 * category formatter onto it.
 */
export const AccentSwitchKeepsYAxisLabels: Story = {
  tags: ['!autodocs'],
  args: Basic.args,
  play: async ({ canvasElement }) => {
    const yLabels = () =>
      [...canvasElement.querySelectorAll('.apexcharts-yaxis-label')].map((el) => el.textContent);
    await waitFor(() => expect(yLabels().length).toBeGreaterThan(0));

    const root = document.documentElement;
    const previous = root.dataset.accent;
    root.dataset.accent = 'teal';
    try {
      // Wait for the update: the series turns teal (brand-500).
      await waitFor(
        () => expect(canvasElement.querySelector('[stroke="#038378"]')).not.toBeNull(),
        {
          timeout: 3000,
        }
      );
      await expect(yLabels()).not.toContain('');
    } finally {
      if (previous) root.dataset.accent = previous;
      else delete root.dataset.accent;
    }
  },
};

/**
 * The tooltip is HTML. Its title is the category, not the point's position on
 * the axis, and the first point sits at the left edge of the plot.
 */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!autodocs'],
  args: {
    series: [{ name: HOSTILE, data: [3, 5, 2] }],
    categories: [HOSTILE, 'B', 'C'],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      hover(canvasElement.querySelector('.apexcharts-grid') as Element, 0.05);
      expect(canvasElement.querySelector('.apexcharts-tooltip-title')?.textContent).toBe(HOSTILE);
    });
    await expect(canvasElement.querySelector('.apexcharts-tooltip-text-y-label')?.textContent).toBe(
      `${HOSTILE}: `
    );
    await expectNoInjectedImage(canvasElement);
  },
};
