import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { MixedChart } from './MixedChart';
import {
  HOSTILE,
  expectNoInjectedImage,
  hover,
  legendTexts,
  Rerender,
  expectNoRedrawOnRerender,
  freshCopy,
  expectAccessibleChart,
  expectPaletteFromTheme,
} from './storybook-helpers';

const EVERY_2H = Array.from({ length: 12 }, (_, i) => `${String(i * 2).padStart(2, '0')}:00`);
const EVERY_4H = ['00h', '04h', '08h', '12h', '16h', '20h'];
const WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

const INCIDENTS = [14, 9, 17, 12, 21, 18, 11, 8, 15, 19, 13, 10];
// Mean of the last four weeks (fewer at the start).
const ROLLING_4W = INCIDENTS.map((_, i) => {
  const window = INCIDENTS.slice(Math.max(0, i - 3), i + 1);
  return window.reduce((sum, v) => sum + v, 0) / window.length;
});

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 });

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Mixed',
  component: MixedChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof MixedChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * Two units on one chart: requests as columns on the left axis, p95 latency
 * as a line on a second axis (`axis: 'right'`). Each axis has its formatter.
 */
export const RequestsAndLatency: Story = {
  args: {
    categories: EVERY_2H,
    formatValue: (v) => `${compact.format(v)} req/s`,
    formatRightValue: (v) => `${Math.round(v)} ms`,
    series: [
      {
        name: 'Requests',
        type: 'column',
        data: [820, 520, 450, 780, 1810, 2460, 2610, 2490, 2380, 2050, 1480, 1050],
      },
      {
        name: 'p95 latency',
        type: 'line',
        axis: 'right',
        data: [112, 104, 101, 118, 164, 192, 205, 188, 176, 158, 131, 119],
      },
    ],
  },
};

/** Same unit, one axis: weekly incidents and their four-week rolling mean. */
export const SingleAxis: Story = {
  args: {
    categories: WEEKS,
    formatValue: (v) => String(Math.round(v * 10) / 10),
    series: [
      { name: 'Incidents', type: 'column', data: INCIDENTS },
      { name: '4-week mean', type: 'line', data: ROLLING_4W },
    ],
  },
};

/** Several column series group side by side under the line. */
export const GroupedColumns: Story = {
  args: {
    categories: EVERY_4H,
    formatValue: (v) => `${compact.format(v)} IOPS`,
    formatRightValue: (v) => `${v.toFixed(1)} ms`,
    series: [
      { name: 'Read', type: 'column', data: [12400, 9800, 18600, 24100, 22800, 16900] },
      { name: 'Write', type: 'column', data: [6200, 5100, 9400, 13800, 12100, 8700] },
      {
        name: 'Disk latency',
        type: 'line',
        axis: 'right',
        data: [1.8, 1.6, 2.4, 3.9, 3.4, 2.2],
      },
    ],
  },
};

/** `colors` overrides the palette: datacenter energy and its PUE over the year. */
export const CustomColors: Story = {
  args: {
    categories: MONTHS,
    colors: ['#8b5cf6', '#f59e0b'],
    formatValue: (v) => `${Math.round(v)} MWh`,
    formatRightValue: (v) => v.toFixed(2),
    series: [
      {
        name: 'Energy',
        type: 'column',
        data: [298, 271, 285, 262, 251, 239, 246, 249, 254],
      },
      {
        name: 'PUE',
        type: 'line',
        axis: 'right',
        data: [1.31, 1.3, 1.33, 1.36, 1.42, 1.51, 1.58, 1.56, 1.44],
      },
    ],
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** The legend and the tooltip are HTML: series names and categories show as text. */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!autodocs'],
  args: {
    categories: [HOSTILE, 'B', 'C'],
    series: [
      { name: HOSTILE, type: 'column', data: [3, 5, 2] },
      { name: 'Normal', type: 'line', axis: 'right', data: [40, 10, 60] },
    ],
  },
  play: async ({ canvasElement }) => {
    // Legends render on mount: the name must show up as literal text.
    await waitFor(() => expect(legendTexts(canvasElement).length).toBeGreaterThan(1));
    await expect(legendTexts(canvasElement)).toContain(HOSTILE);
    await expectNoInjectedImage(canvasElement);

    // The shared tooltip renders on hover: the title is the category, then
    // one row per series. The chart redraws once after mount and rebuilds an
    // empty tooltip, so hover again until both show.
    const yLabels = () =>
      [...canvasElement.querySelectorAll('.apexcharts-tooltip-text-y-label')].map(
        (el) => el.textContent
      );
    await waitFor(() => {
      hover(canvasElement.querySelector('.apexcharts-bar-area') as Element);
      expect(canvasElement.querySelector('.apexcharts-tooltip-title')?.textContent).toBe(HOSTILE);
      expect(yLabels()).toContain(`${HOSTILE}: `);
    });
    await expectNoInjectedImage(canvasElement);
  },
};

/** The columns and the lines take the default palette of the theme, in series order. */
export const PaletteFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['A', 'B', 'C'],
    series: [
      { name: 'a', type: 'column', data: [3, 5, 4] },
      { name: 'b', type: 'column', data: [3, 5, 4] },
      { name: 'c', type: 'line', data: [3, 5, 4] },
      { name: 'd', type: 'line', data: [3, 5, 4] },
      { name: 'e', type: 'column', data: [3, 5, 4] },
    ],
  },
  play: async ({ canvasElement }) => {
    await expectPaletteFromTheme(() => {
      const byIndex = new Map<number, string | null>();
      for (const el of canvasElement.querySelectorAll(
        '.apexcharts-line[index], .apexcharts-bar-area[index]'
      )) {
        const index = Number(el.getAttribute('index'));
        if (!byIndex.has(index)) byIndex.set(index, el.getAttribute('stroke'));
      }
      return [...byIndex.entries()].sort(([a], [b]) => a - b).map(([, color]) => color);
    });
  },
};

/**
 * A parent render with equal props leaves the chart as drawn; a new height
 * still redraws it.
 */
export const RerenderWithEqualPropsDoesNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    ...RequestsAndLatency.args,
    formatValue: (v) => `${v} rps`,
    formatRightValue: (v) => `${v} ms`,
  },
  render: (args) => (
    <Rerender>{(grown) => <MixedChart {...freshCopy(args)} height={grown ? 400 : 320} />}</Rerender>
  ),
  play: expectNoRedrawOnRerender,
};

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its points. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...RequestsAndLatency.args, ariaLabel: 'Requests and latency every two hours' },
  play: expectAccessibleChart({ keyboard: true }),
};
