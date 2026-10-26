import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReferenceLine } from 'recharts';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MixedChart } from './MixedChart';
import {
  axisTitles,
  barFills,
  barShapes,
  closeTooltip,
  expectAccessibleChart,
  expectEmptyMessage,
  expectFitsNarrowBox,
  expectLegendsOnTheirSide,
  expectLineIntentColor,
  expectMarksAtTheirValues,
  expectNoInjectedImage,
  expectReferenceLabelsFollowTextSize,
  expectRepaintsWithThemeOf,
  HOSTILE,
  LegendSides,
  legendTexts,
  NarrowBox,
  openTooltip,
  referenceBandEls,
  referenceLabels,
  referenceLineEls,
  resolveColor,
  seriesStrokes,
  themeColor,
  tickTexts,
  tooltipCard,
} from './storybook-recharts';

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

/** `xTitle`, `yTitle` and `yRightTitle` name the axes, so the ticks need no unit. */
export const AxisTitles: Story = {
  args: {
    ...RequestsAndLatency.args,
    formatValue: compact.format,
    formatRightValue: (v) => String(Math.round(v)),
    xTitle: 'Time of day',
    yTitle: 'Requests (req/s)',
    yRightTitle: 'p95 latency (ms)',
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(axisTitles(canvasElement)).toEqual({
        x: ['Time of day'],
        y: ['Requests (req/s)', 'p95 latency (ms)'],
      })
    );
  },
};

/** With every series on the right, that is the only axis drawn, and it takes `yRightTitle`. */
export const RightAxisOnly: Story = {
  args: {
    categories: MONTHS,
    yRightTitle: 'Energy (MWh)',
    series: [
      {
        name: 'Energy',
        type: 'column',
        axis: 'right',
        data: [298, 271, 285, 262, 251, 239, 246, 249, 254],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(axisTitles(canvasElement)).toEqual({ x: [], y: ['Energy (MWh)'] });
      expect(tickTexts(canvasElement, 'yAxis').length).toBeGreaterThan(1);
    });
  },
};

/**
 * A series of `type: 'area'` fills under its line, behind the columns: here the
 * capacity as an area, the traffic as columns and the mean as a line.
 */
export const AreaSeries: Story = {
  args: {
    categories: WEEKS,
    series: [
      { name: 'Capacity', type: 'area', data: INCIDENTS.map((v) => v + 8) },
      { name: 'Incidents', type: 'column', data: INCIDENTS },
      { name: '4-week mean', type: 'line', data: ROLLING_4W },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelectorAll('.recharts-area-curve')).toHaveLength(1);
      expect(canvasElement.querySelectorAll('.recharts-line-curve')).toHaveLength(1);
      expect(barShapes(canvasElement)).toHaveLength(1);
    });
    // The area has a gradient fill, in the first color of the palette.
    const area = canvasElement.querySelector('.recharts-area-area') as Element;
    await expect(getComputedStyle(area).fill).toMatch(/^url\(/);
    await expect(resolveColor(seriesStrokes(canvasElement)[0])).toBe(
      themeColor('--color-brand-500')
    );
    // Behind the columns and the line.
    const layers = [
      ...canvasElement.querySelectorAll('.recharts-area, .recharts-bar, .recharts-line'),
    ];
    await expect(layers[0].classList.contains('recharts-area')).toBe(true);
  },
};

/** An area on the right axis reads that axis. */
export const AreaOnTheRightAxis: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: EVERY_4H,
    formatRightValue: (v) => `${Math.round(v)} ms`,
    series: [
      { name: 'Requests', type: 'column', data: [820, 520, 1810, 2460, 2050, 1050] },
      { name: 'p95 latency', type: 'area', axis: 'right', data: [112, 104, 164, 205, 158, 119] },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelectorAll('.recharts-area-curve')).toHaveLength(1);
      expect(tickTexts(canvasElement, 'yAxis').some((t) => t?.endsWith(' ms'))).toBe(true);
    });
  },
};

const STACKED_COLUMNS = [
  { name: 'Reads', type: 'column' as const, data: [30, 24, 36, 28] },
  { name: 'Writes', type: 'column' as const, data: [12, 10, 14, 11] },
];

/**
 * `stackedColumns` piles the column series on each other instead of grouping
 * them; a line or an area stays free of the stack.
 */
export const StackedColumns: Story = {
  args: {
    categories: ['Q1', 'Q2', 'Q3', 'Q4'],
    stackedColumns: true,
    series: [...STACKED_COLUMNS, { name: 'Target', type: 'line', data: [45, 36, 52, 41] }],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const [reads, writes] = barShapes(canvasElement).map((shapes) =>
        shapes.map((shape) => shape.getBoundingClientRect())
      );
      expect(reads).toHaveLength(4);
      expect(writes).toHaveLength(4);
      // Once the columns have grown.
      expect(reads[0].height).toBeGreaterThan(20);
      reads.forEach((read, i) => {
        // The writes sit on the reads, in the same column.
        expect(writes[i].bottom).toBeCloseTo(read.top, 0);
        expect(writes[i].left).toBeCloseTo(read.left, 0);
      });
    });
    // Only the outer segment of a stack is rounded.
    const [reads, writes] = barShapes(canvasElement);
    await expect(reads[0].getAttribute('d')).not.toContain('a4,4');
    await expect(writes[0].getAttribute('d')).toContain('a4,4');
  },
};

/** Without `stackedColumns`, the columns are grouped side by side, as before. */
export const ColumnsAreGroupedByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  args: { categories: ['Q1', 'Q2', 'Q3', 'Q4'], series: STACKED_COLUMNS },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const [reads, writes] = barShapes(canvasElement).map((shapes) =>
        shapes.map((shape) => shape.getBoundingClientRect())
      );
      expect(reads).toHaveLength(4);
      expect(writes[0].left).toBeGreaterThanOrEqual(reads[0].right - 1);
      expect(writes[0].bottom).toBeCloseTo(reads[0].bottom, 0);
    });
  },
};

/** The columns of each axis stack apart: two stacks side by side when two axes hold columns. */
export const StackedColumnsPerAxis: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['Q1', 'Q2', 'Q3', 'Q4'],
    stackedColumns: true,
    series: [
      ...STACKED_COLUMNS,
      { name: 'Latency', type: 'column', axis: 'right', data: [120, 140, 160, 130] },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const [reads, writes, latency] = barShapes(canvasElement).map((shapes) =>
        shapes.map((shape) => shape.getBoundingClientRect())
      );
      expect(latency).toHaveLength(4);
      // Writes sit on reads; the right-axis column rests on the baseline.
      expect(writes[0].bottom).toBeCloseTo(reads[0].top, 0);
      expect(latency[0].bottom).toBeCloseTo(reads[0].bottom, 0);
    });
  },
};

/**
 * `referenceLines` and `referenceBands` read the left axis: here a weekly
 * incident budget and the band the mean should stay in.
 */
export const ReferenceLines: Story = {
  args: {
    ...SingleAxis.args,
    referenceBands: [{ from: 8, to: 14, label: 'Expected', intent: 'success' }],
    referenceLines: [{ value: 20, label: 'Budget 20', intent: 'danger', dashed: true }],
  },
  play: async (context) => {
    await expectMarksAtTheirValues('yAxis', { lines: [20], bands: [[8, 14]] })(context);
    await waitFor(() =>
      expect(referenceLabels(context.canvasElement)).toEqual(['Budget 20', 'Expected'])
    );
  },
};

/** With every series on the right, that axis is the one the marks read. */
export const ReferenceLinesOnTheRightAxis: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    ...RightAxisOnly.args,
    referenceLines: [{ value: 260, label: 'Target' }],
    referenceBands: [{ from: 240, to: 255, intent: 'success' }],
  },
  play: expectMarksAtTheirValues('yAxis', { lines: [260], bands: [[240, 255]] }),
};

/** The colors come from the theme in each of the four themes. */
export const ReferenceIntentsFollowTheTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    ...SingleAxis.args,
    referenceLines: [
      { value: 5, intent: 'success' },
      { value: 12, intent: 'warning' },
      { value: 20, intent: 'danger' },
      { value: 16 },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(referenceLineEls(canvasElement)).toHaveLength(4));
    await expectLineIntentColor(canvasElement, 0, '--color-success-500');
    await expectLineIntentColor(canvasElement, 1, '--color-status-warn');
    await expectLineIntentColor(canvasElement, 2, '--color-status-crit');
    await expectLineIntentColor(canvasElement, 3, '--color-text-muted');
    await expect(referenceBandEls(canvasElement)).toHaveLength(0);
  },
};

/** The text of a label follows the text size setting. */
export const ReferenceLabelsFollowTheTextSize: Story = {
  tags: ['!dev', '!autodocs'],
  args: ReferenceLines.args,
  play: ({ canvasElement }) => expectReferenceLabelsFollowTextSize(canvasElement),
};

/** Labels do not widen the page on a narrow screen. */
export const ReferenceLabelsFitNarrowBox: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...ReferenceLines.args, width: 900 },
  render: (args) => (
    <NarrowBox>
      <MixedChart {...args} />
    </NarrowBox>
  ),
  play: expectFitsNarrowBox,
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { series: [], categories: [] },
  play: expectEmptyMessage('No data'),
};

/**
 * `children` takes Recharts elements, drawn inside the chart. A reference line
 * is read on one axis: `yAxisId` says which, `left` or `right`.
 */
export const ReferenceLineInChildren: Story = {
  args: {
    ...RequestsAndLatency.args,
    children: (
      <ReferenceLine
        yAxisId="right"
        y={180}
        stroke="var(--color-status-warn)"
        strokeDasharray="6 4"
        label={{ value: 'SLO 180 ms', position: 'insideTopLeft', fill: 'var(--color-text-muted)' }}
      />
    ),
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.recharts-reference-line line')).not.toBeNull();
      expect(canvasElement.textContent).toContain('SLO 180 ms');
    });
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/**
 * The legend and the tooltip are React text: a series name, a category or an
 * axis title with markup shows as written, and nothing is injected.
 */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    xTitle: HOSTILE,
    yTitle: HOSTILE,
    yRightTitle: HOSTILE,
    categories: [HOSTILE, 'B', 'C'],
    series: [
      { name: HOSTILE, type: 'column', data: [3, 5, 2] },
      { name: 'Normal', type: 'line', axis: 'right', data: [40, 10, 60] },
    ],
    referenceLines: [{ value: 4, label: HOSTILE }],
    referenceBands: [{ from: 1, to: 2, label: HOSTILE }],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(legendTexts(canvasElement)).toContain(HOSTILE));
    await waitFor(() => expect(referenceLabels(canvasElement)).toEqual([HOSTILE, HOSTILE]));
    await expectNoInjectedImage(canvasElement);
    await waitFor(() =>
      expect(axisTitles(canvasElement)).toEqual({ x: [HOSTILE], y: [HOSTILE, HOSTILE] })
    );
    await openTooltip(canvasElement, 0.1);
    const card = tooltipCard(canvasElement) as HTMLElement;
    await expect(card.querySelector('p')).toHaveTextContent(HOSTILE);
    await expect(card.querySelector('li')).toHaveTextContent(HOSTILE);
    await expectNoInjectedImage(canvasElement);
    await closeTooltip(canvasElement);
  },
};

/** Each value in the tooltip is in the format of the axis of its series. */
export const TooltipFormatsEachAxis: Story = {
  tags: ['!dev', '!autodocs'],
  args: RequestsAndLatency.args,
  play: async ({ canvasElement }) => {
    await openTooltip(canvasElement, 0.5);
    const card = tooltipCard(canvasElement) as HTMLElement;
    await expect(card).toHaveTextContent(/\d\d:00/);
    await expect(card).toHaveTextContent(/Requests\s*[\d.]+K? req\/s/);
    await expect(card).toHaveTextContent(/p95 latency\s*\d+ ms/);
    await closeTooltip(canvasElement);
  },
};

/** Each axis formats its own labels. */
export const AxesFormatTheirOwnLabels: Story = {
  tags: ['!dev', '!autodocs'],
  args: RequestsAndLatency.args,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const ticks = [...canvasElement.querySelectorAll('.recharts-yAxis-tick-labels')].map((axis) =>
        [...axis.querySelectorAll('.recharts-cartesian-axis-tick-value')].map((t) => t.textContent)
      );
      expect(ticks).toHaveLength(2);
      for (const label of ticks[0]) expect(label).toMatch(/req\/s$/);
      for (const label of ticks[1]) expect(label).toMatch(/ ms$/);
    });
  },
};

/** A click on a legend entry hides its series, column or line, and shows it again. */
export const LegendTogglesSeries: Story = {
  tags: ['!autodocs'],
  args: RequestsAndLatency.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lines = () => canvasElement.querySelectorAll('.recharts-line-curve').length;
    const columns = () => barShapes(canvasElement).flat().length;
    await waitFor(() => {
      expect(lines()).toBe(1);
      expect(columns()).toBeGreaterThan(0);
    });
    const latency = canvas.getByRole('button', { name: 'p95 latency' });
    await userEvent.click(latency);
    await waitFor(() => expect(lines()).toBe(0));
    await expect(latency).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(canvas.getByRole('button', { name: 'Requests' }));
    await waitFor(() => expect(columns()).toBe(0));
    await userEvent.click(canvas.getByRole('button', { name: 'Requests' }));
    await userEvent.click(latency);
    await waitFor(() => {
      expect(lines()).toBe(1);
      expect(columns()).toBeGreaterThan(0);
    });
  },
};

const MIXED_PALETTE = {
  categories: ['A', 'B', 'C'],
  series: [
    { name: 'a', type: 'column', data: [3, 5, 4] },
    { name: 'b', type: 'column', data: [3, 5, 4] },
    { name: 'c', type: 'line', data: [3, 5, 4] },
    { name: 'd', type: 'line', data: [3, 5, 4] },
    { name: 'e', type: 'column', data: [3, 5, 4] },
  ],
} satisfies Story['args'];

/** The columns and the lines take the default palette of the theme, in series order. */
export const PaletteFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: MIXED_PALETTE,
  play: async ({ canvasElement }) => {
    const tokens = [
      '--color-brand-500',
      '--color-chart-2',
      '--color-chart-3',
      '--color-chart-4',
      '--color-chart-5',
    ];
    const css = (token: string) =>
      resolveColor(getComputedStyle(document.documentElement).getPropertyValue(token).trim());
    await waitFor(() => {
      const columns = barFills(canvasElement).map(resolveColor);
      const lines = seriesStrokes(canvasElement).map(resolveColor);
      expect(columns).toEqual([css(tokens[0]), css(tokens[1]), css(tokens[4])]);
      expect(lines).toEqual([css(tokens[2]), css(tokens[3])]);
    });
  },
};

/** `colors` overrides the palette, one color per series. */
export const ColorsOverridePalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: CustomColors.args,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(barFills(canvasElement).map(resolveColor)).toEqual([resolveColor('#8b5cf6')]);
      expect(seriesStrokes(canvasElement).map(resolveColor)).toEqual([resolveColor('#f59e0b')]);
    });
  },
};

/** A theme or accent switch on `<html>` repaints the chart with no observer and no redraw. */
export const RepaintsWithTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: SingleAxis.args,
  play: ({ canvasElement }) =>
    expectRepaintsWithThemeOf(canvasElement, () => barFills(canvasElement)[0]),
};

/** `legendPosition` puts the legend on each side of the plot. */
export const LegendOnEachSide: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['A', 'B', 'C'],
    series: [
      { name: 'a', type: 'column', data: [3, 5, 4] },
      { name: 'b', type: 'line', data: [4, 2, 5] },
    ],
  },
  render: (args) => (
    <LegendSides>
      {(legendPosition) => <MixedChart {...args} legendPosition={legendPosition} />}
    </LegendSides>
  ),
  play: expectLegendsOnTheirSide,
};

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its points. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    ...RequestsAndLatency.args,
    // The legend's buttons would take the first Tab.
    showLegend: false,
    ariaLabel: 'Requests and latency every two hours',
  },
  play: expectAccessibleChart({ keyboard: true }),
};
