import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { HeatmapChart } from './HeatmapChart';
import {
  HOSTILE,
  closeTooltip,
  expectNoInjectedImage,
  hover,
  legendTexts,
  Rerender,
  expectNoRedrawOnRerender,
  freshCopy,
  expectAccessibleChart,
  LegendSides,
  expectLegendsOnTheirSide,
  expectMessageOnly,
  axisTitles,
  expectAxisTitles,
  expectTextFollowsTextSize,
  contrastRatio,
  switchTheme,
  themeColor,
} from './storybook-helpers';

const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}h`);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const RACKS = ['rack-a01', 'rack-a02', 'rack-a03', 'rack-a04', 'rack-b01', 'rack-b02', 'rack-b03'];

// Inlet temperature: a daytime bump on top of each rack's baseline, with a
// little deterministic jitter.
const rackTemperatures = (slots: number, hoursPerSlot: number) =>
  RACKS.map((name, r) => ({
    name,
    data: Array.from({ length: slots }, (_, s) => {
      const hour = s * hoursPerSlot;
      const daytime = Math.max(0, Math.sin(((hour - 7) / 24) * 2 * Math.PI));
      return Math.round(21 + r * 1.1 + daytime * (5 + r) + ((r * 7 + s * 3) % 5) * 0.4);
    }),
  }));

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Heatmap',
  component: HeatmapChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof HeatmapChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * One row per series, one column per category. The default scale is five
 * brand steps of the current theme and accent, over buckets with round bounds.
 */
export const RackTemperature: Story = {
  args: {
    categories: HOURS,
    series: rackTemperatures(24, 1),
    formatValue: (v) => `${v} °C`,
  },
};

/** `showValues` prints each value in its cell, in a color readable on it. */
export const CpuPerNode: Story = {
  args: {
    categories: DAYS,
    showValues: true,
    formatValue: (v) => `${v}%`,
    series: [
      { name: 'node-01', data: [62, 71, 68, 74, 81, 34, 28] },
      { name: 'node-02', data: [58, 64, 66, 70, 77, 31, 25] },
      { name: 'node-03', data: [88, 92, 90, 95, 97, 61, 52] },
      { name: 'node-04', data: [41, 45, 39, 48, 52, 22, 18] },
      { name: 'node-05', data: [12, 15, 14, 11, 16, 9, 8] },
      { name: 'node-06', data: [70, 76, 73, 79, 85, 44, 37] },
    ],
  },
};

/** Zero cells take the lowest step: a muted cell that stays visible in dark themes. */
export const IncidentsPerDatacenter: Story = {
  args: {
    categories: DAYS,
    showValues: true,
    height: 240,
    series: [
      { name: 'DC1 Paris', data: [0, 2, 1, 0, 4, 0, 0] },
      { name: 'DC2 Frankfurt', data: [1, 0, 0, 3, 1, 0, 1] },
      { name: 'DC3 London', data: [0, 0, 6, 2, 0, 1, 0] },
      { name: 'DC4 Tokyo', data: [3, 1, 0, 0, 9, 2, 0] },
    ],
  },
};

/** `ranges` sets explicit thresholds, such as alerting levels, with their own colors. */
export const Thresholds: Story = {
  args: {
    categories: HOURS.filter((_, h) => h % 2 === 0),
    series: rackTemperatures(12, 2),
    showValues: true,
    formatValue: (v) => `${v} °C`,
    ranges: [
      { from: 0, to: 27, color: '#10b981', name: 'OK' },
      { from: 27, to: 32, color: '#f59e0b', name: 'WARN ≥ 27 °C' },
      { from: 32, to: 60, color: '#ef4444', name: 'CRIT ≥ 32 °C' },
    ],
  },
};

/** `colors` replaces the brand scale and keeps the automatic buckets. */
export const CustomColors: Story = {
  args: {
    categories: DAYS,
    formatValue: (v) => `${v} ms`,
    colors: ['#3b528b', '#21918c', '#5ec962', '#fde725'],
    series: [
      { name: 'ceph-osd-01', data: [4, 5, 4, 6, 7, 3, 2] },
      { name: 'ceph-osd-02', data: [5, 6, 5, 8, 9, 3, 3] },
      { name: 'ceph-osd-03', data: [12, 14, 11, 18, 21, 6, 5] },
      { name: 'ceph-osd-04', data: [3, 4, 3, 5, 6, 2, 2] },
      { name: 'ceph-osd-05', data: [7, 9, 8, 10, 13, 4, 4] },
    ],
  },
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { series: [], categories: [] },
  play: expectMessageOnly('No data'),
};

/** `xTitle` and `yTitle` name the columns and the rows. */
export const AxisTitles: Story = {
  args: { ...RackTemperature.args, xTitle: 'Hour of day', yTitle: 'Rack' },
  play: expectAxisTitles({ x: 'Hour of day', y: ['Rack'] }),
};

// ── Interaction tests ────────────────────────────────────────────────────────

/**
 * The legend and the tooltip are HTML: range names, row names and categories
 * show as text. The legend lists the ranges, not the rows.
 */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    xTitle: HOSTILE,
    yTitle: HOSTILE,
    series: [
      { name: HOSTILE, data: [3, 5, 2] },
      { name: 'Normal', data: [4, 1, 6] },
    ],
    categories: [HOSTILE, 'B', 'C'],
    ranges: [
      { from: 0, to: 3, color: '#10b981', name: HOSTILE },
      { from: 3, to: 10, color: '#ef4444' },
    ],
  },
  play: async ({ canvasElement }) => {
    // The legend renders on mount: the name must show up as literal text.
    await waitFor(() => expect(legendTexts(canvasElement)).toHaveLength(2));
    await expect(legendTexts(canvasElement)).toEqual([HOSTILE, '3 – 10']);
    await expectNoInjectedImage(canvasElement);
    // Axis titles are SVG text: the same string, drawn as written.
    await waitFor(() => expect(axisTitles(canvasElement)).toEqual({ x: [HOSTILE], y: [HOSTILE] }));
    await expectNoInjectedImage(canvasElement);

    // The tooltip renders on hover of a cell: its column is the title, its
    // row the label. The first row is drawn at the top.
    const cell = () => canvasElement.querySelector(".apexcharts-heatmap-rect[i='0'][j='0']");
    await waitFor(() => {
      hover(cell() as Element);
      expect(canvasElement.querySelector('.apexcharts-tooltip-title')?.textContent).toBe(HOSTILE);
      expect(canvasElement.querySelector('.apexcharts-tooltip-text-y-label')?.textContent).toBe(
        `${HOSTILE}: `
      );
      expect(canvasElement.querySelector('.apexcharts-tooltip-text-y-value')?.textContent).toBe(
        '3'
      );
    });
    await expectNoInjectedImage(canvasElement);
    await closeTooltip(canvasElement, cell);
  },
};

const ACCENT_IDS = [
  'blue',
  'indigo',
  'violet',
  'purple',
  'rose',
  'teal',
  'cyan',
  'graphite',
  'red',
  'orange',
  'amber',
  'green',
];

// A CSS color in any syntax (the deep-blue grays are oklch) as `#rrggbb`.
const toHex = (color: string) => {
  const context = document.createElement('canvas').getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};

/**
 * In the dark themes the lowest step of the default scale stays a cell of its
 * own on the card, whatever the accent: its fill is at least 1.5:1 against the
 * card, where the darkest brand steps sit at 1.3:1.
 */
export const LowestStepStaysVisibleInDark: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['a', 'b', 'c'],
    series: [
      { name: 'x', data: [0, 5, 10] },
      { name: 'y', data: [2, 6, 9] },
    ],
  },
  play: async ({ canvasElement }) => {
    const lowestFill = () =>
      canvasElement.querySelector('.apexcharts-heatmap-rect')?.getAttribute('fill') ?? '';
    // The chart redraws a moment after <html> changes: wait for the new fill
    // (every accent has its own) before judging it.
    let drawn = '';
    for (const theme of ['dark', 'deep-blue']) {
      const restore = switchTheme(theme);
      try {
        for (const accent of ACCENT_IDS) {
          document.documentElement.setAttribute('data-accent', accent);
          await waitFor(() => expect(lowestFill()).not.toBe(drawn));
          drawn = lowestFill();
          const ratio = contrastRatio(toHex(drawn), toHex(themeColor('--color-gray-900')));
          expect(ratio, `${theme} ${accent}`).toBeGreaterThanOrEqual(1.5);
        }
      } finally {
        document.documentElement.removeAttribute('data-accent');
        restore();
      }
    }
  },
};

/** The axis labels, the axis title and the legend follow the text size setting. */
export const TextFollowsTheTextSize: Story = {
  tags: ['!dev', '!autodocs'],
  args: { categories: DAYS, series: rackTemperatures(7, 24), xTitle: 'Day' },
  play: ({ canvasElement }) => expectTextFollowsTextSize(canvasElement),
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
      {(legendPosition) => <HeatmapChart {...args} legendPosition={legendPosition} />}
    </LegendSides>
  ),
  play: expectLegendsOnTheirSide,
};

/**
 * A parent render with equal props leaves the chart as drawn; a new height
 * still redraws it.
 */
export const RerenderWithEqualPropsDoesNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...RackTemperature.args, formatValue: (v) => `${v} °C` },
  render: (args) => (
    <Rerender>
      {(grown) => <HeatmapChart {...freshCopy(args)} height={grown ? 400 : 320} />}
    </Rerender>
  ),
  play: expectNoRedrawOnRerender,
};

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its points. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...RackTemperature.args, ariaLabel: 'Rack temperature per hour' },
  play: expectAccessibleChart({ keyboard: true }),
};
