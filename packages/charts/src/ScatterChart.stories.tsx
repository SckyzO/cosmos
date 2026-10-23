import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { BubbleChart, ScatterChart, type BubblePoint, type ScatterPoint } from './ScatterChart';
import {
  HOSTILE,
  expectNoInjectedImage,
  hover,
  legendTexts,
  Rerender,
  expectNoRedrawOnRerender,
  freshCopy,
  expectAccessibleChart,
} from './storybook-helpers';

// Deterministic noise in (-1, 1): the same points on every run and screenshot.
const noise = (i: number) => (Math.sin(i * 12.9898) * 43758.5453) % 1;

/** `count` nodes whose p95 latency climbs with their CPU load. */
const nodes = (prefix: string, count: number, seed: number, baseMs: number): ScatterPoint[] =>
  Array.from({ length: count }, (_, i) => {
    const load = Math.round(12 + 84 * Math.abs(noise(seed + i)));
    return {
      x: load,
      y: Math.round(baseMs + 0.014 * load ** 2 + 9 * noise(seed + i + 97)),
      label: `${prefix}-${String(i + 1).padStart(2, '0')}`,
    };
  });

/** The same nodes, sized by the requests they serve. */
const withRequests = (points: ScatterPoint[], seed: number): BubblePoint[] =>
  points.map((point, i) => ({
    ...point,
    z: Math.round(300 + 2900 * Math.abs(noise(seed + i))),
  }));

const PARIS = nodes('par1-node', 18, 3, 24);
const FRANKFURT = nodes('fra1-node', 18, 41, 31);
const LONDON = nodes('lon1-node', 18, 87, 38);

const percent = (v: number) => `${v} %`;
const ms = (v: number) => `${v} ms`;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Scatter & Bubble',
  component: ScatterChart,
  subcomponents: { BubbleChart },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof ScatterChart>;

export default meta;
type Story = StoryObj<typeof meta>;
type BubbleStory = StoryObj<typeof BubbleChart>;

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * One point per node: p95 latency against CPU load. `label` names the point
 * in the tooltip; `xTitle` and `yTitle` title the axes and the tooltip rows.
 */
export const LatencyVsLoad: Story = {
  args: {
    series: [{ name: 'DC1 Paris', data: PARIS }],
    xTitle: 'CPU load',
    yTitle: 'p95 latency',
    formatX: percent,
    formatY: ms,
  },
};

/** Two series or more get a legend, one color each. */
export const MultiSeries: Story = {
  args: {
    series: [
      { name: 'DC1 Paris', data: PARIS },
      { name: 'DC2 Frankfurt', data: FRANKFURT },
      { name: 'DC3 London', data: LONDON },
    ],
    xTitle: 'CPU load',
    yTitle: 'p95 latency',
    formatX: percent,
    formatY: ms,
  },
};

/** `colors` overrides the palette, here with the status colors. */
export const StatusColors: Story = {
  args: {
    series: [
      { name: 'Healthy', data: PARIS.filter((p) => p.y < 70) },
      { name: 'Degraded', data: PARIS.filter((p) => p.y >= 70 && p.y < 120) },
      { name: 'Critical', data: PARIS.filter((p) => p.y >= 120) },
    ],
    colors: ['#10b981', '#f59e0b', '#ef4444'],
    xTitle: 'CPU load',
    yTitle: 'p95 latency',
    formatX: percent,
    formatY: ms,
  },
};

/**
 * `BubbleChart` adds a third measure, `z`, drawn as the bubble size: here the
 * requests each node serves. `sizeTitle` and `formatSize` label it in the
 * tooltip.
 */
export const Bubble: BubbleStory = {
  args: {
    series: [
      { name: 'DC1 Paris', data: withRequests(PARIS.slice(0, 10), 5) },
      { name: 'DC2 Frankfurt', data: withRequests(FRANKFURT.slice(0, 10), 61) },
    ],
    xTitle: 'CPU load',
    yTitle: 'p95 latency',
    sizeTitle: 'Requests',
    formatX: percent,
    formatY: ms,
    formatSize: (v) => `${(v / 1000).toFixed(1)}k req/s`,
  },
  render: (args) => <BubbleChart {...args} />,
};

// ── Interaction tests ────────────────────────────────────────────────────────

// The text of the tooltip lines: the series name, then one per row.
const tooltipLabels = (root: HTMLElement) =>
  [...root.querySelectorAll('.apexcharts-tooltip-text-y-label')].map((el) => el.textContent);

// The points listen for the pointer once their entry animation is over.
const hoverFirstPoint = (root: HTMLElement) =>
  hover(root.querySelector('.apexcharts-series-markers .apexcharts-marker') as Element);

/**
 * The legend and the tooltip are HTML: series names, point labels and axis
 * titles show as text.
 */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!autodocs'],
  args: {
    series: [
      { name: HOSTILE, data: [{ x: 50, y: 50, label: HOSTILE }] },
      { name: 'Normal', data: [{ x: 20, y: 80 }] },
    ],
    xTitle: HOSTILE,
  },
  play: async ({ canvasElement }) => {
    // Legends render on mount: the name must show up as literal text.
    await waitFor(() => expect(legendTexts(canvasElement).length).toBeGreaterThan(1));
    await expect(legendTexts(canvasElement)).toContain(HOSTILE);
    await expectNoInjectedImage(canvasElement);

    // Tooltips render on hover: the point's label as title, then the series
    // name and the x row, titled by xTitle.
    await waitFor(
      () => {
        hoverFirstPoint(canvasElement);
        expect(canvasElement.querySelector('.apexcharts-tooltip-title')?.textContent).toBe(HOSTILE);
        expect(tooltipLabels(canvasElement)).toEqual([HOSTILE, `${HOSTILE}:`, 'y:']);
      },
      { timeout: 3000 }
    );
    await expectNoInjectedImage(canvasElement);
  },
};

/** Same for the bubble chart, whose tooltip adds the size row, titled by sizeTitle. */
export const BubbleHtmlInLabelsRendersAsText: BubbleStory = {
  tags: ['!autodocs'],
  args: {
    series: [
      { name: HOSTILE, data: [{ x: 50, y: 50, z: 10, label: HOSTILE }] },
      { name: 'Normal', data: [{ x: 20, y: 80, z: 20 }] },
    ],
    sizeTitle: HOSTILE,
  },
  render: (args) => <BubbleChart {...args} />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(legendTexts(canvasElement).length).toBeGreaterThan(1));
    await expect(legendTexts(canvasElement)).toContain(HOSTILE);
    await expectNoInjectedImage(canvasElement);

    await waitFor(
      () => {
        hoverFirstPoint(canvasElement);
        expect(canvasElement.querySelector('.apexcharts-tooltip-title')?.textContent).toBe(HOSTILE);
        expect(tooltipLabels(canvasElement)).toEqual([HOSTILE, 'x:', 'y:', `${HOSTILE}:`]);
      },
      { timeout: 3000 }
    );
    await expectNoInjectedImage(canvasElement);
  },
};

/**
 * A parent render with equal props leaves the chart as drawn; a new height
 * still redraws it.
 */
export const RerenderWithEqualPropsDoesNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...LatencyVsLoad.args, formatX: (v) => `${v} rps`, formatY: (v) => `${v} ms` },
  render: (args) => (
    <Rerender>
      {(grown) => <ScatterChart {...freshCopy(args)} height={grown ? 400 : 320} />}
    </Rerender>
  ),
  play: expectNoRedrawOnRerender,
};

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its points. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...LatencyVsLoad.args, ariaLabel: 'Latency against CPU load' },
  play: expectAccessibleChart({ keyboard: true }),
};
