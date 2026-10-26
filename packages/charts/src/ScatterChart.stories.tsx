import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReferenceArea } from 'recharts';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { BubbleChart, ScatterChart, type BubblePoint, type ScatterPoint } from './ScatterChart';
import {
  axisTitles,
  closeTooltip,
  expectAccessibleChart,
  expectEmptyMessage,
  expectLegendsOnTheirSide,
  expectNoInjectedImage,
  expectRepaintsWithThemeOf,
  HOSTILE,
  LegendSides,
  legendTexts,
  resolveColor,
  scatterFills,
  scatterSymbols,
  surface,
  tickTexts,
  tooltipCard,
} from './storybook-recharts';

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

/** The axis titles sit under and beside the plot, inside the drawing, with no space left under it. */
export const AxisTitles: Story = {
  args: { ...LatencyVsLoad.args },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(axisTitles(canvasElement)).toEqual({ x: ['CPU load'], y: ['p95 latency'] })
    );
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

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { series: [] },
  play: expectEmptyMessage('No data'),
};

/**
 * `children` takes Recharts elements, drawn inside the chart: here a
 * `ReferenceArea` shading the nodes that are slow under a light load.
 */
export const ReferenceAreaInChildren: Story = {
  args: {
    ...LatencyVsLoad.args,
    children: (
      <ReferenceArea
        x1={0}
        x2={40}
        y1={60}
        y2={140}
        fill="var(--color-status-warn)"
        fillOpacity={0.12}
        stroke="none"
      />
    ),
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelector('.recharts-reference-area')).not.toBeNull()
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

const firstSymbol = (root: HTMLElement) => scatterSymbols(root).flat()[0] as Element;

// While the points draw in, Recharts keys each one by its position, so a frame
// replaces the hovered node and its mouseenter is lost: leave and enter again
// until the tooltip shows.
const hoverFirstPoint = (root: HTMLElement) =>
  waitFor(async () => {
    await userEvent.unhover(firstSymbol(root));
    await userEvent.hover(firstSymbol(root));
    expect(tooltipCard(root)).not.toBeNull();
  });

const leaveFirstPoint = async (root: HTMLElement) => {
  await userEvent.unhover(firstSymbol(root));
  await closeTooltip(root);
};

// The lines of the tooltip: the series name, then one per measure.
const tooltipRows = (root: HTMLElement) =>
  [...(tooltipCard(root)?.querySelectorAll('li') ?? [])].map((li) => li.textContent);

/**
 * The legend and the tooltip are React text: series names, point labels and
 * axis titles with markup show as written.
 */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [
      { name: HOSTILE, data: [{ x: 50, y: 50, label: HOSTILE }] },
      { name: 'Normal', data: [{ x: 20, y: 80 }] },
    ],
    xTitle: HOSTILE,
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(legendTexts(canvasElement)).toContain(HOSTILE));
    await expectNoInjectedImage(canvasElement);
    await hoverFirstPoint(canvasElement);
    // The point's label is the title; then the series, the x row (titled by xTitle) and y.
    await expect(tooltipCard(canvasElement)?.querySelector('p')).toHaveTextContent(HOSTILE);
    await expect(tooltipRows(canvasElement)).toEqual([HOSTILE, `${HOSTILE}50`, 'y50']);
    await expectNoInjectedImage(canvasElement);
    await leaveFirstPoint(canvasElement);
  },
};

/** Same for the bubble chart, whose tooltip adds the size row, titled by sizeTitle. */
export const BubbleHtmlInLabelsRendersAsText: BubbleStory = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [
      { name: HOSTILE, data: [{ x: 50, y: 50, z: 10, label: HOSTILE }] },
      { name: 'Normal', data: [{ x: 20, y: 80, z: 20 }] },
    ],
    sizeTitle: HOSTILE,
  },
  render: (args) => <BubbleChart {...args} />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(legendTexts(canvasElement)).toContain(HOSTILE));
    await expectNoInjectedImage(canvasElement);
    await hoverFirstPoint(canvasElement);
    await expect(tooltipCard(canvasElement)?.querySelector('p')).toHaveTextContent(HOSTILE);
    await expect(tooltipRows(canvasElement)).toEqual([HOSTILE, 'x50', 'y50', `${HOSTILE}10`]);
    await expectNoInjectedImage(canvasElement);
    await leaveFirstPoint(canvasElement);
  },
};

/** The tooltip names the point, its series and its measures through the formatters. */
export const TooltipFormatsTheMeasures: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [{ name: 'DC1 Paris', data: [{ x: 40, y: 85, label: 'par1-node-01' }] }],
    xTitle: 'CPU load',
    yTitle: 'p95 latency',
    formatX: percent,
    formatY: ms,
  },
  play: async ({ canvasElement }) => {
    await hoverFirstPoint(canvasElement);
    await expect(tooltipCard(canvasElement)?.querySelector('p')).toHaveTextContent('par1-node-01');
    await expect(tooltipRows(canvasElement)).toEqual([
      'DC1 Paris',
      'CPU load40 %',
      'p95 latency85 ms',
    ]);
    await leaveFirstPoint(canvasElement);
  },
};

/** `formatX` and `formatY` format the tick labels of their axis. */
export const FormatsFormatTheTicks: Story = {
  tags: ['!dev', '!autodocs'],
  args: LatencyVsLoad.args,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const x = tickTexts(canvasElement, 'xAxis');
      const y = tickTexts(canvasElement, 'yAxis');
      expect(x.length).toBeGreaterThan(2);
      expect(y.length).toBeGreaterThan(2);
      for (const label of x) expect(label).toMatch(/^\d+ %$/);
      for (const label of y) expect(label).toMatch(/^\d+ ms$/);
    });
  },
};

/** A click on a legend entry hides its points and shows them again. */
export const LegendTogglesSeries: Story = {
  tags: ['!autodocs'],
  args: MultiSeries.args,
  play: async ({ canvasElement }) => {
    const drawn = () => scatterSymbols(canvasElement).flat().length;
    await waitFor(() => expect(drawn()).toBe(54));
    const frankfurt = within(canvasElement).getByRole('button', { name: 'DC2 Frankfurt' });
    await userEvent.click(frankfurt);
    await waitFor(() => expect(drawn()).toBe(36));
    await expect(frankfurt).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(frankfurt);
    await waitFor(() => expect(drawn()).toBe(54));
  },
};

const palette = (token: string) =>
  resolveColor(getComputedStyle(document.documentElement).getPropertyValue(token).trim());
const PALETTE_TOKENS = [
  '--color-brand-500',
  '--color-chart-2',
  '--color-chart-3',
  '--color-chart-4',
  '--color-chart-5',
];

/** The markers take the default palette of the theme. */
export const PaletteFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: ['a', 'b', 'c', 'd', 'e'].map((name, i) => ({ name, data: [{ x: i, y: 5 - i }] })),
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(scatterFills(canvasElement).map(resolveColor)).toEqual(PALETTE_TOKENS.map(palette))
    );
  },
};

/** The bubbles take the default palette of the theme. */
export const BubblePaletteFromTheme: BubbleStory = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: ['a', 'b', 'c', 'd', 'e'].map((name, i) => ({
      name,
      data: [{ x: i, y: 5 - i, z: 3 }],
    })),
  },
  render: (args) => <BubbleChart {...args} />,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(scatterFills(canvasElement).map(resolveColor)).toEqual(PALETTE_TOKENS.map(palette))
    );
  },
};

/** `colors` overrides the palette, one color per series. */
export const ColorsOverridePalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: StatusColors.args,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(scatterFills(canvasElement).map(resolveColor)).toEqual(
        ['#10b981', '#f59e0b', '#ef4444'].map(resolveColor)
      )
    );
  },
};

/** A theme or accent switch on `<html>` repaints the chart with no observer and no redraw. */
export const RepaintsWithTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: LatencyVsLoad.args,
  play: ({ canvasElement }) =>
    expectRepaintsWithThemeOf(canvasElement, () => scatterFills(canvasElement)[0]),
};

// The size of a bubble is its width: the bigger the measure, the bigger the bubble.
const sizes = (root: HTMLElement) =>
  scatterSymbols(root)
    .flat()
    .map((el) => el.getBoundingClientRect().width);

/** The bubble size follows `z`: a larger measure draws a larger bubble. */
export const BubbleSizeFollowsTheMeasure: BubbleStory = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [
      {
        name: 'a',
        data: [
          { x: 1, y: 2, z: 1 },
          { x: 2, y: 4, z: 50 },
          { x: 3, y: 3, z: 100 },
        ],
      },
    ],
  },
  render: (args) => <BubbleChart {...args} />,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const [small, medium, large] = sizes(canvasElement);
      expect(small).toBeLessThan(medium);
      expect(medium).toBeLessThan(large);
    });
  },
};

/** The points of a scatter chart are all the same size. */
export const ScatterPointsHaveOneSize: Story = {
  tags: ['!dev', '!autodocs'],
  args: LatencyVsLoad.args,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const all = sizes(canvasElement);
      expect(all.length).toBe(18);
      expect(new Set(all.map((size) => Math.round(size))).size).toBe(1);
    });
  },
};

/** `legendPosition` puts the legend on each side of the plot. */
export const LegendOnEachSide: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [
      {
        name: 'a',
        data: [
          { x: 1, y: 2 },
          { x: 2, y: 4 },
        ],
      },
      {
        name: 'b',
        data: [
          { x: 1, y: 3 },
          { x: 2, y: 1 },
        ],
      },
    ],
  },
  render: (args) => (
    <LegendSides>
      {(legendPosition) => <ScatterChart {...args} legendPosition={legendPosition} />}
    </LegendSides>
  ),
  play: expectLegendsOnTheirSide,
};

/** `legendPosition` puts the legend on each side of the plot. */
export const BubbleLegendOnEachSide: BubbleStory = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [
      {
        name: 'a',
        data: [
          { x: 1, y: 2, z: 3 },
          { x: 2, y: 4, z: 5 },
        ],
      },
      {
        name: 'b',
        data: [
          { x: 1, y: 3, z: 4 },
          { x: 2, y: 1, z: 2 },
        ],
      },
    ],
  },
  render: (args) => (
    <LegendSides>
      {(legendPosition) => <BubbleChart {...args} legendPosition={legendPosition} />}
    </LegendSides>
  ),
  play: expectLegendsOnTheirSide,
};

/** A chart wider than its box is cut to it, so a narrow screen never scrolls sideways. */
export const NoHorizontalOverflow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...MultiSeries.args, width: 900 },
  render: (args) => (
    <div data-testid="box" style={{ width: 375 }}>
      <ScatterChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>('[data-testid="box"]') as HTMLElement;
    await waitFor(() => expect(surface(canvasElement)).not.toBeNull());
    await waitFor(() => {
      expect(box.scrollWidth, 'the box scrolls sideways').toBeLessThanOrEqual(box.clientWidth);
      expect(surface(canvasElement)?.getBoundingClientRect().width).toBeLessThanOrEqual(375);
    });
    const root = document.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its points. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...LatencyVsLoad.args, ariaLabel: 'Latency against CPU load' },
  play: expectAccessibleChart({ keyboard: true }),
};
