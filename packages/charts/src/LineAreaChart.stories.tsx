import type { Meta, StoryObj } from '@storybook/react-vite';
// The toolbar is an ApexCharts feature the charts do not load.
import 'apexcharts/features/toolbar';
import { expect, waitFor } from 'storybook/test';
import { LineAreaChart } from './LineAreaChart';
import {
  HOSTILE,
  closeTooltip,
  expectNoInjectedImage,
  expectTooltipFollowsTheme,
  hover,
  legendTexts,
  resolveColor,
  Rerender,
  expectNoRedrawOnRerender,
  freshCopy,
  expectAccessibleChart,
  expectPaletteFromTheme,
  LegendSides,
  expectLegendsOnTheirSide,
  expectMessageOnly,
  expectRedrawOnRerender,
  axisTitles,
  expectAxisTitles,
  expectTextFollowsTextSize,
} from './storybook-helpers';

const HOURS = ['00h', '03h', '06h', '09h', '12h', '15h', '18h', '21h', '24h'];
const WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
const HOURLY = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);
const STATUS_COLORS = ['#10b981', '#ef4444'];
const ms = (v: number) => `${v} ms`;

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
 * Several series overlap, drawn in palette order. With two or more series the
 * legend shows above the plot; `showLegend` forces it on or off.
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

/** `colors` overrides the palette, here with the status colors. */
export const CustomColors: Story = {
  args: {
    colors: STATUS_COLORS,
    series: [
      { name: 'Healthy nodes', data: [118, 120, 119, 112, 109, 114, 117, 120, 121] },
      { name: 'Failed nodes', data: [4, 2, 3, 10, 13, 8, 5, 2, 1] },
    ],
    categories: HOURS,
  },
};

/** `formatValue` formats the y-axis labels and the tooltip values. */
export const FormattedValues: Story = {
  args: {
    formatValue: ms,
    series: [{ name: 'p95 latency', data: [118, 124, 131, 172, 160, 141, 150, 184, 137] }],
    categories: HOURS,
  },
};

/** `xTitle` and `yTitle` name the axes, so the tick labels need no unit. */
export const AxisTitles: Story = {
  args: { ...Basic.args, xTitle: 'Hour of day', yTitle: 'CPU usage (%)' },
  play: expectAxisTitles({ x: 'Hour of day', y: ['CPU usage (%)'] }),
};

/**
 * The axis labels, the axis titles, the legend and the tooltip are drawn at the
 * size of the text size setting, as the page's text is: a larger setting makes
 * the chart text larger.
 */
export const TextFollowsTheTextSize: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    ...Basic.args,
    xTitle: 'Hour of day',
    series: [
      { name: 'CPU', data: [31, 40, 28, 51, 42, 109, 100, 120, 130] },
      { name: 'Memory', data: [11, 32, 45, 32, 34, 52, 41, 60, 66] },
    ],
  },
  play: ({ canvasElement }) =>
    expectTextFollowsTextSize(canvasElement, () => canvasElement.querySelector('.apexcharts-grid')),
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { series: [], categories: [] },
  play: expectMessageOnly('No data'),
};

/** A chart with no data draws its message without the axis titles. */
export const EmptyDrawsNoAxisTitles: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: [], categories: [], xTitle: 'Hour of day', yTitle: 'CPU usage (%)' },
  play: async (context) => {
    await expectMessageOnly('No data')(context);
    await expect(axisTitles(context.canvasElement)).toEqual({ x: [], y: [] });
  },
};

/** `emptyMessage` says why there is nothing to draw. */
export const EmptyWithMessage: Story = {
  args: {
    series: [{ name: 'CPU', data: [] }],
    categories: [],
    emptyMessage: 'No samples in the last hour',
  },
  play: expectMessageOnly('No samples in the last hour'),
};

/**
 * `apexOptions` merges raw ApexCharts options over the chart's own, last: here
 * the toolbar, and the grid color, which keeps the dashes the chart sets. The
 * toolbar is one of the ApexCharts features the charts do not load: this file
 * imports `apexcharts/features/toolbar`.
 */
export const RawApexOptions: Story = {
  args: {
    series: [{ name: 'CPU', data: [12, 19, 23, 31, 22, 18, 25, 33, 30] }],
    categories: HOURS,
    apexOptions: { chart: { toolbar: { show: true } }, grid: { borderColor: '#f59e0b' } },
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelector('.apexcharts-menu-icon')).not.toBeNull()
    );
    const gridlines = () => [...canvasElement.querySelectorAll('.apexcharts-gridline')];
    await waitFor(() => expect(gridlines().length).toBeGreaterThan(0));
    for (const line of gridlines()) {
      expect(resolveColor(line.getAttribute('stroke') ?? '')).toBe(resolveColor('#f59e0b'));
      expect(line.getAttribute('stroke-dasharray')).toBe('4');
    }
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** A multi-series chart shows one legend entry per series, in order. */
export const LegendListsEverySeries: Story = {
  tags: ['!autodocs'],
  args: MultiSeries.args,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(legendTexts(canvasElement)).toEqual([
        'p50 latency (ms)',
        'p95 latency (ms)',
        'p99 latency (ms)',
      ])
    );
  },
};

/** A single series has nothing to tell apart: no legend unless forced. */
export const SingleSeriesHasNoLegend: Story = {
  tags: ['!dev', '!autodocs'],
  args: Basic.args,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.apexcharts-series')).not.toBeNull());
    await expect(legendTexts(canvasElement)).toEqual([]);
  },
};

/** Each series line takes the color of its index in `colors`. */
export const ColorsOverridePalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: CustomColors.args,
  play: async ({ canvasElement }) => {
    // Each series draws its gradient fill, then its line: an unfilled path.
    const strokes = () =>
      [...canvasElement.querySelectorAll('.apexcharts-series')].map((series) =>
        resolveColor(
          series.querySelector('.apexcharts-area[fill="none"]')?.getAttribute('stroke') ?? ''
        )
      );
    await waitFor(() => expect(strokes()).toEqual(STATUS_COLORS));
  },
};

/** `formatValue` formats the y-axis labels and the tooltip values. */
export const FormatValueFormatsLabels: Story = {
  tags: ['!dev', '!autodocs'],
  args: FormattedValues.args,
  play: async ({ canvasElement }) => {
    const yLabels = () =>
      [...canvasElement.querySelectorAll('.apexcharts-yaxis-label')].map((el) => el.textContent);
    await waitFor(() => expect(yLabels().length).toBeGreaterThan(1));
    for (const label of yLabels()) expect(label).toMatch(/^\d+ ms$/);

    await waitFor(() => {
      hover(canvasElement.querySelector('.apexcharts-grid') as Element, 0.05);
      expect(canvasElement.querySelector('.apexcharts-tooltip-text-y-value')?.textContent).toBe(
        '118 ms'
      );
    });
  },
};

/**
 * Charts re-read their colors when the theme or accent changes on `<html>`. The
 * y-axis labels used to come back empty after that update: LineAreaChart
 * shared one labels object between both axes and ApexCharts wrote the
 * category formatter onto it.
 */
export const AccentSwitchKeepsYAxisLabels: Story = {
  tags: ['!dev', '!autodocs'],
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
 * The legend and the tooltip are HTML. The tooltip title is the category, not
 * the point's position on the axis, and the first point sits at the left edge
 * of the plot.
 */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    xTitle: HOSTILE,
    yTitle: HOSTILE,
    series: [
      { name: HOSTILE, data: [3, 5, 2] },
      { name: 'B', data: [1, 2, 4] },
    ],
    categories: [HOSTILE, 'B', 'C'],
  },
  play: async ({ canvasElement }) => {
    // Legends render on mount: the name must show up as literal text.
    await waitFor(() => expect(legendTexts(canvasElement)).toContain(HOSTILE));
    await expectNoInjectedImage(canvasElement);
    // Axis titles are SVG text: the same string, drawn as written.
    await waitFor(() => expect(axisTitles(canvasElement)).toEqual({ x: [HOSTILE], y: [HOSTILE] }));
    await expectNoInjectedImage(canvasElement);

    const grid = () => canvasElement.querySelector('.apexcharts-grid');
    await waitFor(() => {
      hover(grid() as Element, 0.05);
      expect(canvasElement.querySelector('.apexcharts-tooltip-title')?.textContent).toBe(HOSTILE);
      // The shared tooltip fills its series rows after the title.
      expect(canvasElement.querySelector('.apexcharts-tooltip-text-y-label')?.textContent).toBe(
        `${HOSTILE}: `
      );
    });
    await expectNoInjectedImage(canvasElement);
    await closeTooltip(canvasElement, grid);
  },
};

/** The tooltip follows the Cosmos theme: dark in the dark themes, light in the others. */
export const TooltipFollowsTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { categories: HOURS, series: [{ name: 'CPU', data: [3, 5, 2, 6, 4, 7, 5, 6, 4] }] },
  play: async ({ canvasElement }) => {
    await expectTooltipFollowsTheme(canvasElement, () =>
      canvasElement.querySelector('.apexcharts-grid')
    );
  },
};

/** The lines take the default palette of the theme. */
export const PaletteFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['A', 'B', 'C'],
    series: ['a', 'b', 'c', 'd', 'e'].map((name) => ({ name, data: [3, 5, 4] })),
  },
  play: async ({ canvasElement }) => {
    await expectPaletteFromTheme(() =>
      [...canvasElement.querySelectorAll('.apexcharts-area[fill="none"]')].map((el) =>
        el.getAttribute('stroke')
      )
    );
  },
};

/** `legendPosition` puts the legend on each side of the plot. */
export const LegendOnEachSide: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['A', 'B', 'C'],
    series: [
      { name: 'a', data: [3, 5, 4] },
      { name: 'b', data: [4, 2, 5] },
    ],
  },
  render: (args) => (
    <LegendSides>
      {(legendPosition) => <LineAreaChart {...args} legendPosition={legendPosition} />}
    </LegendSides>
  ),
  play: expectLegendsOnTheirSide,
};

/** An `apexOptions` that does not override the formatters leaves the escaping of the chart in place. */
export const ApexOptionsKeepLabelsEscaped: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    ...HtmlInLabelsRendersAsText.args,
    apexOptions: {
      chart: { toolbar: { show: true } },
      legend: { fontSize: '16px' },
      tooltip: { x: { show: true } },
    },
  },
  play: HtmlInLabelsRendersAsText.play,
};

/** A function in `apexOptions` replaces the chart's own, here the y-axis label formatter. */
export const ApexOptionsReplaceAFormatter: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: HOURS,
    series: [{ name: 'CPU', data: [3, 5, 2, 6, 4, 7, 5, 6, 4] }],
    apexOptions: { yaxis: { labels: { formatter: ms } } },
  },
  play: async ({ canvasElement }) => {
    const labels = () =>
      [...canvasElement.querySelectorAll('.apexcharts-yaxis-label')].map((el) => el.textContent);
    await waitFor(() => {
      expect(labels().length).toBeGreaterThan(1);
      for (const label of labels()) expect(label).toMatch(/ ms$/);
    });
  },
};

const RAW_SERIES = [{ name: 'CPU', data: [3, 5, 2, 6, 4, 7, 5, 6, 4] }];

const RAW_OPTIONS = {
  chart: { toolbar: { show: true } },
  grid: { borderColor: '#f59e0b' },
  colors: ['#7c3aed'],
  xaxis: { labels: { rotate: -45 } },
  yaxis: { labels: { formatter: ms } },
};

/**
 * Equal `apexOptions` on a parent render leave the chart as drawn, a copy of it
 * as well as the same object: ApexCharts compares the options deeply, the
 * functions in them by identity.
 */
export const RerenderWithEqualApexOptionsDoesNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: { categories: HOURS, series: RAW_SERIES, apexOptions: RAW_OPTIONS },
  render: (args) => (
    <Rerender>
      {(grown) => <LineAreaChart {...freshCopy(args)} height={grown ? 360 : 320} />}
    </Rerender>
  ),
  play: expectNoRedrawOnRerender,
};

export const RerenderWithTheSameApexOptionsDoesNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: { categories: HOURS, series: RAW_SERIES, apexOptions: RAW_OPTIONS },
  render: (args) => (
    <Rerender>{(grown) => <LineAreaChart {...args} height={grown ? 360 : 320} />}</Rerender>
  ),
  play: expectNoRedrawOnRerender,
};

/** A function made during render in `apexOptions` redraws the chart on every render, like `formatValue`. */
export const InlineFunctionInApexOptionsRedraws: Story = {
  tags: ['!dev', '!autodocs'],
  args: { categories: HOURS, series: RAW_SERIES },
  render: (args) => (
    <Rerender>
      {() => (
        <LineAreaChart
          {...freshCopy(args)}
          apexOptions={{ yaxis: { labels: { formatter: (value: number) => `${value} ms` } } }}
        />
      )}
    </Rerender>
  ),
  play: expectRedrawOnRerender,
};

/**
 * A parent render with equal props leaves the chart as drawn; a new height
 * still redraws it.
 */
export const RerenderWithEqualPropsDoesNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Basic.args, colors: STATUS_COLORS, formatValue: ms },
  render: (args) => (
    <Rerender>
      {(grown) => <LineAreaChart {...freshCopy(args)} height={grown ? 400 : 320} />}
    </Rerender>
  ),
  play: expectNoRedrawOnRerender,
};

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its points. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Basic.args, ariaLabel: 'CPU usage per hour' },
  play: expectAccessibleChart({ keyboard: true }),
};
