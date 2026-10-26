import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReferenceLine } from 'recharts';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { SERIES_FALLBACKS } from './core/colors';
import { LineAreaChart } from './LineAreaChart';
import {
  axisTitles,
  bandSpan,
  closeTooltip,
  expectAccessibleChart,
  expectEmptyMessage,
  expectFitsNarrowBox,
  expectLegendsOnTheirSide,
  expectLineIntentColor,
  expectNoInjectedImage,
  expectReferenceLabelsFollowTextSize,
  expectRepaintsWithTheme,
  expectTextFollowsTextSize,
  HOSTILE,
  LegendSides,
  legendTexts,
  linePixel,
  NarrowBox,
  openTooltip,
  pixelOnAxis,
  referenceBandEls,
  referenceLabels,
  referenceLineEls,
  resolveColor,
  seriesStrokes,
  surface,
  tickTexts,
  tooltipCard,
} from './storybook-recharts';

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
 * categories, and the axis skips the labels that don't fit.
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
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(axisTitles(canvasElement)).toEqual({ x: ['Hour of day'], y: ['CPU usage (%)'] })
    );
  },
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
  play: ({ canvasElement }) => expectTextFollowsTextSize(canvasElement),
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { series: [], categories: [] },
  play: expectEmptyMessage('No data'),
};

/** A chart with no data draws its message without the axis titles. */
export const EmptyDrawsNoAxisTitles: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: [], categories: [], xTitle: 'Hour of day', yTitle: 'CPU usage (%)' },
  play: async (context) => {
    await expectEmptyMessage('No data')(context);
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
  play: expectEmptyMessage('No samples in the last hour'),
};

/**
 * `children` takes Recharts elements, drawn inside the chart after the ones it
 * builds: here a `ReferenceLine` for a threshold, in the units of the series.
 * Colors are CSS variables, so the line follows the theme.
 */
export const ReferenceLineInChildren: Story = {
  args: {
    series: [{ name: 'CPU', data: [12, 19, 23, 31, 22, 18, 25, 33, 30] }],
    categories: HOURS,
    yTitle: 'CPU usage (%)',
    children: (
      <ReferenceLine
        y={28}
        stroke="var(--color-status-warn)"
        strokeDasharray="6 4"
        label={{ value: 'WARN 28%', position: 'insideTopLeft', fill: 'var(--color-text-muted)' }}
      />
    ),
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const line = canvasElement.querySelector('.recharts-reference-line line');
      expect(line).not.toBeNull();
      expect(resolveColor(getComputedStyle(line as Element).stroke)).toBe(
        resolveColor(
          getComputedStyle(document.documentElement).getPropertyValue('--color-status-warn')
        )
      );
      // The label is drawn in a layer of its own, above the series.
      expect(canvasElement.textContent).toContain('WARN 28%');
    });
  },
};

// The point a series curve ends on, from its path: the last pair of numbers.
const curveEnd = (curve: SVGPathElement) => {
  const numbers = (curve.getAttribute('d') ?? '').match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  return { x: numbers[numbers.length - 2], y: numbers[numbers.length - 1] };
};

const SERIES_COUNT = 3;

const curves = (root: HTMLElement) => [
  ...root.querySelectorAll<SVGPathElement>('.recharts-area-curve'),
];

/** `variant="line"` draws the lines alone, with no fill under them. */
export const LineVariant: Story = {
  args: { ...MultiSeries.args, variant: 'line' },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(curves(canvasElement)).toHaveLength(SERIES_COUNT));
    // No gradient, and the area under each line has no fill.
    await expect(canvasElement.querySelectorAll('linearGradient')).toHaveLength(0);
    for (const area of canvasElement.querySelectorAll('.recharts-area-area')) {
      await expect(getComputedStyle(area).fill).toBe('none');
    }
  },
};

/** The default is still the area, with a gradient fill under each line. */
export const AreaIsTheDefault: Story = {
  tags: ['!dev', '!autodocs'],
  args: MultiSeries.args,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(curves(canvasElement)).toHaveLength(SERIES_COUNT));
    await expect(canvasElement.querySelectorAll('linearGradient')).toHaveLength(SERIES_COUNT);
    for (const area of canvasElement.querySelectorAll('.recharts-area-area')) {
      await expect(getComputedStyle(area).fill).toMatch(/^url\(/);
    }
  },
};

/**
 * `stacked` piles the series on each other, so the top line is their sum: the
 * share of each in a total.
 */
export const Stacked: Story = {
  args: {
    categories: HOURS,
    stacked: true,
    yTitle: 'Requests / s',
    series: [
      { name: 'Reads', data: [120, 90, 160, 210, 180, 240, 200, 170, 130] },
      { name: 'Writes', data: [40, 30, 70, 90, 80, 110, 90, 60, 50] },
      { name: 'Other', data: [20, 25, 15, 30, 35, 25, 40, 30, 20] },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(curves(canvasElement)).toHaveLength(3));
    // The last point of the top line sits at the sum 130 + 50 + 20 = 200.
    await waitFor(() => {
      const top = curves(canvasElement)[2];
      expect(curveEnd(top).y).toBeCloseTo(pixelOnAxis(canvasElement, 'yAxis', 200), 0);
    });
  },
};

/** Without `stacked`, the same series are drawn each from zero. */
export const NotStackedByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Stacked.args, stacked: false },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(curves(canvasElement)).toHaveLength(3));
    await waitFor(() => {
      const top = curves(canvasElement)[2];
      expect(curveEnd(top).y).toBeCloseTo(pixelOnAxis(canvasElement, 'yAxis', 20), 0);
    });
  },
};

/** `markers` draws a dot on every point. */
export const Markers: Story = {
  args: { ...MultiSeries.args, variant: 'line', markers: true },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('.recharts-area-dot')).toHaveLength(
        SERIES_COUNT * HOURS.length
      )
    );
  },
};

/** No dot is drawn by default. */
export const NoMarkersByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  args: MultiSeries.args,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(curves(canvasElement)).toHaveLength(SERIES_COUNT));
    await expect(canvasElement.querySelectorAll('.recharts-area-dot')).toHaveLength(0);
  },
};

/**
 * A series `style` is `solid` (the default smooth curve), `dashed`, or `step`,
 * a line that jumps from one value to the next: a quota, a replica count.
 */
export const SeriesStyles: Story = {
  args: {
    categories: HOURS,
    variant: 'line',
    yTitle: 'Pods',
    series: [
      { name: 'Used', data: [12, 19, 23, 31, 22, 18, 25, 33, 30] },
      { name: 'Forecast', style: 'dashed', data: [14, 18, 24, 29, 25, 21, 24, 30, 32] },
      { name: 'Quota', style: 'step', data: [20, 20, 25, 25, 30, 30, 35, 35, 40] },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(curves(canvasElement)).toHaveLength(3));
    const [solid, dashed, step] = curves(canvasElement);
    await expect(solid.getAttribute('stroke-dasharray')).toBeNull();
    await expect(dashed.getAttribute('stroke-dasharray')).toBe('6 4');
    // A step line has square corners only; the others are smooth curves.
    await expect(step.getAttribute('d')).not.toContain('C');
    await expect(solid.getAttribute('d')).toContain('C');
    await expect(dashed.getAttribute('d')).toContain('C');
  },
};

/**
 * `referenceLines` draws a line at a value of the vertical axis, `intent`
 * picks its color from the theme (`neutral` by default), `dashed` dashes it and
 * `label` names it. A line the data does not reach makes the axis reach it.
 */
export const ReferenceLines: Story = {
  args: {
    series: [{ name: 'CPU', data: [12, 19, 23, 31, 22, 18, 25, 33, 30] }],
    categories: HOURS,
    yTitle: 'CPU usage (%)',
    referenceLines: [
      { value: 40, label: 'Critical 40%', intent: 'danger' },
      { value: 28, label: 'Warning 28%', intent: 'warning', dashed: true },
      { value: 15, label: 'Baseline', dashed: true },
      { value: 8, label: 'Floor', intent: 'success' },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(referenceLineEls(canvasElement)).toHaveLength(4));
    await waitFor(() =>
      expect(referenceLabels(canvasElement)).toEqual([
        'Baseline',
        'Critical 40%',
        'Floor',
        'Warning 28%',
      ])
    );
    const lines = referenceLineEls(canvasElement);
    // Only the lines asked to be dashed are.
    await expect(lines.map((line) => line.getAttribute('stroke-dasharray'))).toEqual([
      null,
      '6 4',
      '6 4',
      null,
    ]);
  },
};

/** Each intent takes its color from the theme, and follows a theme switch. */
export const ReferenceLineIntentsFollowTheTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    ...ReferenceLines.args,
    referenceLines: [
      { value: 8, intent: 'success' },
      { value: 28, intent: 'warning' },
      { value: 40, intent: 'danger' },
      { value: 15 },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(referenceLineEls(canvasElement)).toHaveLength(4));
    await expectLineIntentColor(canvasElement, 0, '--color-success-500');
    await expectLineIntentColor(canvasElement, 1, '--color-status-warn');
    await expectLineIntentColor(canvasElement, 2, '--color-status-crit');
    await expectLineIntentColor(canvasElement, 3, '--color-text-muted');
  },
};

/** A line sits at the pixel its value has on the axis: the ticks and the line share one scale. */
export const ReferenceLinesSitAtTheirValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    ...Basic.args,
    referenceLines: [{ value: 10 }, { value: 22.5 }, { value: 30 }],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const lines = referenceLineEls(canvasElement);
      expect(lines).toHaveLength(3);
      [10, 22.5, 30].forEach((value, i) =>
        expect(linePixel(lines[i], 'yAxis')).toBeCloseTo(
          pixelOnAxis(canvasElement, 'yAxis', value),
          0
        )
      );
    });
  },
};

/** A line beyond the data stretches the axis to reach it, instead of vanishing. */
export const ReferenceLineBeyondTheDataExtendsTheAxis: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Basic.args, referenceLines: [{ value: 80, label: 'Limit 80%', intent: 'danger' }] },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const [line] = referenceLineEls(canvasElement);
      expect(line).toBeDefined();
      const ticks = tickTexts(canvasElement, 'yAxis').map(Number);
      expect(Math.max(...ticks)).toBeGreaterThanOrEqual(80);
      expect(linePixel(line, 'yAxis')).toBeCloseTo(pixelOnAxis(canvasElement, 'yAxis', 80), 0);
    });
  },
};

/**
 * `referenceBands` shades the plot between two values, behind the series, in
 * the color of its `intent`.
 */
export const ReferenceBands: Story = {
  args: {
    series: [
      { name: 'CPU', data: [12, 19, 23, 31, 22, 18, 25, 33, 30] },
      { name: 'Memory', data: [34, 36, 41, 39, 44, 47, 43, 49, 52] },
    ],
    categories: HOURS,
    yTitle: 'Usage (%)',
    referenceBands: [
      { from: 0, to: 20, label: 'Idle', intent: 'success' },
      { from: 20, to: 40, label: 'Busy' },
      { from: 40, to: 60, label: 'Saturated', intent: 'danger' },
    ],
    referenceLines: [{ value: 40, label: 'Alert at 40%', intent: 'warning', dashed: true }],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(referenceBandEls(canvasElement)).toHaveLength(3));
    await waitFor(() =>
      expect(referenceLabels(canvasElement)).toEqual(['Alert at 40%', 'Busy', 'Idle', 'Saturated'])
    );
    // A band covers its values on the axis, from the lower to the higher.
    const bands = referenceBandEls(canvasElement);
    [
      [0, 20],
      [20, 40],
      [40, 60],
    ].forEach(([from, to], i) => {
      const [top, bottom] = bandSpan(bands[i], 'yAxis');
      expect(top).toBeCloseTo(pixelOnAxis(canvasElement, 'yAxis', to), 0);
      expect(bottom).toBeCloseTo(pixelOnAxis(canvasElement, 'yAxis', from), 0);
    });
    // The band sits behind the series: the area is drawn after it.
    const order = [...canvasElement.querySelectorAll('.recharts-reference-area, .recharts-area')];
    const isBand = order.map((el) => el.classList.contains('recharts-reference-area'));
    await expect(isBand.indexOf(false)).toBeGreaterThan(isBand.lastIndexOf(true));
  },
};

/** The text of a label follows the text size setting, as the axes do. */
export const ReferenceLabelsFollowTheTextSize: Story = {
  tags: ['!dev', '!autodocs'],
  args: ReferenceBands.args,
  play: ({ canvasElement }) => expectReferenceLabelsFollowTextSize(canvasElement),
};

/** Labels do not widen the page on a narrow screen. */
export const ReferenceLabelsFitNarrowBox: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...ReferenceBands.args, width: 900 },
  render: (args) => (
    <NarrowBox>
      <LineAreaChart {...args} />
    </NarrowBox>
  ),
  play: expectFitsNarrowBox,
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
    await waitFor(() => expect(canvasElement.querySelector('.recharts-area')).not.toBeNull());
    await expect(legendTexts(canvasElement)).toEqual([]);
  },
};

/** A click on a legend entry hides its series and shows it again; the keyboard does the same. */
export const LegendTogglesSeries: Story = {
  tags: ['!autodocs'],
  args: MultiSeries.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const curves = () => canvasElement.querySelectorAll('.recharts-area-curve').length;
    await waitFor(() => expect(curves()).toBe(3));
    const p95 = canvas.getByRole('button', { name: 'p95 latency (ms)' });
    await expect(p95).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(p95);
    await waitFor(() => expect(curves()).toBe(2));
    await expect(p95).toHaveAttribute('aria-pressed', 'false');
    // Series keep their order and their color when one is hidden.
    await expect(legendTexts(canvasElement)).toEqual([
      'p50 latency (ms)',
      'p95 latency (ms)',
      'p99 latency (ms)',
    ]);
    p95.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(curves()).toBe(3));
    await expect(p95).toHaveAttribute('aria-pressed', 'true');
  },
};

/** Each series line takes the color of its index in `colors`. */
export const ColorsOverridePalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: CustomColors.args,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(seriesStrokes(canvasElement).map(resolveColor)).toEqual(
        STATUS_COLORS.map(resolveColor)
      )
    );
  },
};

/** `formatValue` formats the y-axis labels and the tooltip values. */
export const FormatValueFormatsLabels: Story = {
  tags: ['!dev', '!autodocs'],
  args: FormattedValues.args,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(tickTexts(canvasElement, 'yAxis').length).toBeGreaterThan(1));
    for (const label of tickTexts(canvasElement, 'yAxis')) expect(label).toMatch(/^\d+ ms$/);
    await openTooltip(canvasElement, 0.07);
    await expect(tooltipCard(canvasElement)).toHaveTextContent('118 ms');
    await closeTooltip(canvasElement);
  },
};

/**
 * The legend and the tooltip are React text: a series name, a category or an
 * axis title with markup shows as written, and nothing is injected.
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
    referenceLines: [{ value: 4, label: HOSTILE }],
    referenceBands: [{ from: 1, to: 2, label: HOSTILE }],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(legendTexts(canvasElement)).toContain(HOSTILE));
    await waitFor(() => expect(referenceLabels(canvasElement)).toEqual([HOSTILE, HOSTILE]));
    await expectNoInjectedImage(canvasElement);
    await waitFor(() => expect(axisTitles(canvasElement)).toEqual({ x: [HOSTILE], y: [HOSTILE] }));
    await openTooltip(canvasElement, 0.07);
    const card = tooltipCard(canvasElement) as HTMLElement;
    // The title is the category, and the first row is the first series' name.
    await expect(card.querySelector('p')).toHaveTextContent(HOSTILE);
    await expect(card.querySelector('li')).toHaveTextContent(HOSTILE);
    await expectNoInjectedImage(canvasElement);
    await closeTooltip(canvasElement);
  },
};

/** The tooltip is a card in the colors of the theme, a live region for screen readers. */
export const TooltipCardShowsTheSeries: Story = {
  tags: ['!dev', '!autodocs'],
  args: { categories: HOURS, series: [{ name: 'CPU', data: [3, 5, 2, 6, 4, 7, 5, 6, 4] }] },
  play: async ({ canvasElement }) => {
    await openTooltip(canvasElement, 0.07);
    const card = tooltipCard(canvasElement) as HTMLElement;
    await expect(card).toHaveAttribute('aria-live', 'polite');
    await expect(card).toHaveTextContent('00h');
    await expect(card).toHaveTextContent('CPU');
    await expect(card).toHaveTextContent('3');
    await closeTooltip(canvasElement);
  },
};

/**
 * Colors are CSS variables handed to the SVG: a theme or accent switch on
 * `<html>` repaints the chart with no observer and no redraw.
 */
export const RepaintsWithTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: Basic.args,
  play: ({ canvasElement }) => expectRepaintsWithTheme(canvasElement),
};

/** The lines take the default palette of the theme: the accent, then the hues after it. */
export const PaletteFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['A', 'B', 'C'],
    series: ['a', 'b', 'c', 'd', 'e'].map((name) => ({ name, data: [3, 5, 4] })),
  },
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
    await waitFor(() =>
      expect(seriesStrokes(canvasElement).map(resolveColor)).toEqual(tokens.map(css))
    );
  },
};

/**
 * The hex a series color falls back to is what the theme gives in the default
 * accent: the fallback is a safety net that looks the same.
 */
export const PaletteFallbacksMatchTheTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: Basic.args,
  play: async () => {
    const tokens = [
      '--color-brand-500',
      ...SERIES_FALLBACKS.slice(1).map((_, i) => `--color-chart-${i + 2}`),
    ];
    const html = document.documentElement;
    const previous = html.getAttribute('data-accent');
    html.removeAttribute('data-accent');
    try {
      for (const [i, token] of tokens.entries()) {
        await expect(
          resolveColor(getComputedStyle(html).getPropertyValue(token).trim()),
          token
        ).toBe(resolveColor(SERIES_FALLBACKS[i]));
      }
    } finally {
      if (previous !== null) html.setAttribute('data-accent', previous);
    }
  },
};

/** An accent that looks like a palette hue takes its place: the teal accent has no teal series. */
export const PaletteSkipsTheAccentHue: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['A', 'B', 'C'],
    series: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((name) => ({ name, data: [3, 5, 4] })),
  },
  play: async ({ canvasElement }) => {
    const html = document.documentElement;
    const previous = html.getAttribute('data-accent');
    html.setAttribute('data-accent', 'teal');
    try {
      await waitFor(() => {
        const strokes = seriesStrokes(canvasElement).map(resolveColor);
        expect(strokes).toHaveLength(8);
        expect(strokes[0]).toBe(resolveColor('#038378'));
        // The default palette's teal (#14b8a6) is gone; the reserve (#d946ef) is in.
        expect(strokes).not.toContain(resolveColor('#14b8a6'));
        expect(strokes).toContain(resolveColor('#d946ef'));
      });
    } finally {
      if (previous === null) html.removeAttribute('data-accent');
      else html.setAttribute('data-accent', previous);
    }
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

/** A chart wider than its box is cut to it, so a narrow screen never scrolls sideways. */
export const NoHorizontalOverflow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...MultiSeries.args, width: 900 },
  render: (args) => (
    <div data-testid="box" style={{ width: 375 }}>
      <LineAreaChart {...args} />
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
  args: { ...Basic.args, ariaLabel: 'CPU usage per hour' },
  play: expectAccessibleChart({ keyboard: true }),
};
