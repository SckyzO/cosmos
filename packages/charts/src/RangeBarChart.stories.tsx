import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReferenceLine } from 'recharts';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { RangeBarChart } from './RangeBarChart';
import type { ChartReferenceLine } from './types';
import {
  axisTitles,
  barFills,
  barShapes,
  closeTooltip,
  expectAccessibleChart,
  expectCategoryArrowKeys,
  expectEmptyMessage,
  expectFitsNarrowBox,
  expectLegendsOnTheirSide,
  expectLineIntentColor,
  expectNoInjectedImage,
  expectReferenceLabelsFollowTextSize,
  expectRepaintsWithThemeOf,
  HOSTILE,
  LegendSides,
  bandSpan,
  legendTexts,
  linePixel,
  NarrowBox,
  openTooltipAt,
  referenceBandEls,
  referenceLabels,
  referenceLineEls,
  resolveColor,
  surface,
  tickTexts,
  tooltipCard,
} from './storybook-recharts';

// Fixed dates (UTC, October 2026) keep the stories and their tests deterministic.
const at = (day: number, hour: number, minute = 0) => Date.UTC(2026, 9, day, hour, minute);

const CHANGES = [
  {
    name: 'Maintenance',
    data: [
      { x: 'api-gateway', y: [at(13, 2), at(13, 4)] },
      { x: 'search-service', y: [at(13, 22), at(14, 0, 30)] },
      { x: 'payment-service', y: [at(14, 1), at(14, 3, 30)] },
    ],
  },
  {
    name: 'Deploy',
    data: [
      { x: 'api-gateway', y: [at(13, 10), at(13, 10, 40)] },
      { x: 'auth-service', y: [at(13, 14), at(13, 14, 30)] },
      { x: 'payment-service', y: [at(13, 16), at(13, 16, 25)] },
      { x: 'checkout-service', y: [at(14, 11), at(14, 11, 45)] },
      { x: 'search-service', y: [at(14, 15), at(14, 15, 30)] },
    ],
  },
  {
    name: 'Incident',
    data: [
      { x: 'auth-service', y: [at(13, 19, 10), at(13, 20)] },
      { x: 'api-gateway', y: [at(14, 8), at(14, 8, 50)] },
      { x: 'checkout-service', y: [at(14, 11, 20), at(14, 13, 5)] },
    ],
  },
] satisfies { name: string; data: { x: string; y: [number, number] }[] }[];

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Range Bar',
  component: RangeBarChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof RangeBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/** One series: a week of planned maintenance windows per rack. No legend. */
export const MaintenanceWindows: Story = {
  args: {
    height: 280,
    series: [
      {
        name: 'Maintenance',
        data: [
          { x: 'PAR1 rack A12', y: [at(12, 22), at(13, 2)] },
          { x: 'PAR1 rack A12', y: [at(16, 21), at(17, 1)] },
          { x: 'PAR1 rack B03', y: [at(14, 1), at(14, 5)] },
          { x: 'FRA2 rack C07', y: [at(13, 20), at(14, 2)] },
          { x: 'LON1 rack D01', y: [at(15, 0), at(15, 3)] },
          { x: 'TYO1 rack E09', y: [at(17, 14), at(17, 20)] },
        ],
      },
    ],
  },
};

/**
 * Two days of changes per service, one series per kind. Each series gets its
 * own lane in the row, so an incident never hides the deploy under it.
 */
export const ChangeTimeline: Story = {
  args: { series: CHANGES },
};

/** `groupRows` draws every series of a row on one lane: one strip per service. */
export const GroupedRows: Story = {
  args: { series: CHANGES, groupRows: true, height: 260 },
};

/**
 * Datacenter availability over a day. `colors` maps the series to severity
 * colors and `formatDate` shows the time only, since it is a single day.
 */
export const SeverityColors: Story = {
  args: {
    groupRows: true,
    height: 240,
    colors: ['#f59e0b', '#ef4444'],
    formatDate: (t) => `${new Date(t).toISOString().slice(11, 16)} UTC`,
    series: [
      {
        name: 'Degraded',
        data: [
          { x: 'DC1 Paris', y: [at(14, 3, 15), at(14, 4)] },
          { x: 'DC2 Frankfurt', y: [at(14, 9, 10), at(14, 9, 45)] },
          { x: 'DC2 Frankfurt', y: [at(14, 10, 20), at(14, 11)] },
          { x: 'DC3 London', y: [at(14, 13, 5), at(14, 13, 30)] },
          { x: 'DC4 Tokyo', y: [at(14, 17), at(14, 19, 30)] },
        ],
      },
      {
        name: 'Outage',
        data: [
          { x: 'DC2 Frankfurt', y: [at(14, 9, 45), at(14, 10, 20)] },
          { x: 'DC3 London', y: [at(14, 13, 30), at(14, 14, 10)] },
        ],
      },
    ],
  },
};

/** `xTitle` and `yTitle` name the time axis and the rows. */
export const AxisTitles: Story = {
  args: { ...MaintenanceWindows.args, xTitle: 'Time (UTC)', yTitle: 'Rack' },
};

export const AxisTitlesChecks: Story = {
  ...AxisTitles,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(axisTitles(canvasElement)).toEqual({ x: ['Time (UTC)'], y: ['Rack'] })
    );
  },
};

/** The time axis has round UTC ticks: the day at midnight, the time of day between. */
export const TimeAxisTicks: Story = {
  args: { ...MaintenanceWindows.args },
};

export const TimeAxisTicksChecks: Story = {
  ...TimeAxisTicks,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const ticks = tickTexts(canvasElement, 'xAxis');
      expect(ticks.length).toBeGreaterThan(2);
      expect(ticks.length).toBeLessThanOrEqual(9);
      for (const tick of ticks) expect(tick).toMatch(/^(\d\d:\d\d|\d\d \w{3})$/);
    });
  },
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { series: [] },
};

export const EmptyChecks: Story = {
  ...Empty,
  tags: ['!dev', '!autodocs'],
  play: expectEmptyMessage('No data'),
};

/**
 * `children` takes Recharts elements, drawn inside the chart: here a vertical
 * `ReferenceLine` marking a moment on the time axis, in milliseconds.
 */
export const ReferenceLineInChildren: Story = {
  args: {
    series: CHANGES,
    children: (
      <ReferenceLine
        x={at(14, 0)}
        stroke="var(--color-status-warn)"
        strokeDasharray="6 4"
        label={{ value: 'Freeze', position: 'insideTopRight', fill: 'var(--color-text-muted)' }}
      />
    ),
  },
};

export const ReferenceLineInChildrenChecks: Story = {
  ...ReferenceLineInChildren,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.recharts-reference-line line')).not.toBeNull();
      expect(canvasElement.textContent).toContain('Freeze');
    });
  },
};

// The pixels of the vertical grid lines: one per tick of the time axis.
const timeTickPixels = (root: HTMLElement) =>
  [...root.querySelectorAll('.recharts-cartesian-grid-vertical line')].map((line) =>
    parseFloat(line.getAttribute('x1') ?? '')
  );

const INTENT_LINES: ChartReferenceLine[] = [
  { value: at(13, 6), intent: 'success' },
  { value: at(13, 12), intent: 'warning' },
  { value: at(13, 18), intent: 'danger' },
  { value: at(14, 0) },
];

/**
 * The value axis is time, so the marks take timestamps in milliseconds: here
 * "now", and the change freeze window.
 */
export const ReferenceLines: Story = {
  args: {
    series: CHANGES,
    referenceBands: [
      { from: at(13, 18), to: at(14, 6), label: 'Change freeze', intent: 'warning' },
    ],
    referenceLines: [{ value: at(14, 12), label: 'Now', intent: 'danger', dashed: true }],
  },
};

export const ReferenceLinesChecks: Story = {
  ...ReferenceLines,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(referenceLineEls(canvasElement)).toHaveLength(1);
      expect(referenceBandEls(canvasElement)).toHaveLength(1);
    });
    await waitFor(() => expect(referenceLabels(canvasElement)).toEqual(['Change freeze', 'Now']));
  },
};

/** A mark sits at the pixel of its time: a timestamp that is a tick sits on its grid line. */
export const ReferenceMarksSitAtTheirTime: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: CHANGES,
    referenceBands: [{ from: at(13, 6), to: at(13, 18) }],
    referenceLines: [{ value: at(14, 0) }],
  },
  play: async ({ canvasElement }) => {
    const near = (pixel: number) =>
      timeTickPixels(canvasElement).some((x) => Math.abs(x - pixel) < 1);
    await waitFor(() => {
      expect(timeTickPixels(canvasElement).length).toBeGreaterThan(2);
      const [line] = referenceLineEls(canvasElement);
      expect(near(linePixel(line, 'xAxis'))).toBe(true);
      const [start, end] = bandSpan(referenceBandEls(canvasElement)[0], 'xAxis');
      expect(near(start)).toBe(true);
      expect(near(end)).toBe(true);
      // The band is 12 hours wide on a 6 hour grid: two steps.
      const ticks = timeTickPixels(canvasElement);
      expect(end - start).toBeCloseTo(2 * (ticks[1] - ticks[0]), 0);
    });
  },
};

/** The colors come from the theme in each of the four themes. */
export const ReferenceIntentsFollowTheTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: CHANGES, referenceLines: INTENT_LINES },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(referenceLineEls(canvasElement)).toHaveLength(4));
    await expectLineIntentColor(canvasElement, 0, '--color-success-500');
    await expectLineIntentColor(canvasElement, 1, '--color-status-warn');
    await expectLineIntentColor(canvasElement, 2, '--color-status-crit');
    await expectLineIntentColor(canvasElement, 3, '--color-text-muted');
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
      <RangeBarChart {...args} />
    </NarrowBox>
  ),
  play: expectFitsNarrowBox,
};

// ── Interaction tests ────────────────────────────────────────────────────────

/**
 * The legend and the tooltip are React text: a series name, a row label or an
 * axis title with markup shows as written, and nothing is injected.
 */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    xTitle: HOSTILE,
    yTitle: HOSTILE,
    series: [
      {
        name: HOSTILE,
        data: [
          { x: HOSTILE, y: [at(14, 2), at(14, 8)] },
          { x: 'B', y: [at(14, 4), at(14, 6)] },
        ],
      },
      { name: 'Normal', data: [{ x: 'B', y: [at(14, 9), at(14, 12)] }] },
    ],
    referenceLines: [{ value: at(14, 10), label: HOSTILE }],
    referenceBands: [{ from: at(14, 3), to: at(14, 5), label: HOSTILE }],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(legendTexts(canvasElement)).toContain(HOSTILE));
    await waitFor(() => expect(referenceLabels(canvasElement)).toEqual([HOSTILE, HOSTILE]));
    await expectNoInjectedImage(canvasElement);
    await waitFor(() => expect(axisTitles(canvasElement)).toEqual({ x: [HOSTILE], y: [HOSTILE] }));
    // The first row sits in the top half of the plot.
    await openTooltipAt(canvasElement, 0.5, 0.2);
    const card = tooltipCard(canvasElement) as HTMLElement;
    await expect(card.querySelector('p')).toHaveTextContent(HOSTILE);
    await expect(card.querySelector('li')).toHaveTextContent(HOSTILE);
    await expectNoInjectedImage(canvasElement);
    await closeTooltip(canvasElement);
  },
};

const rects = (root: HTMLElement) => barShapes(root).flat();

/** Two ranges of one series on the same row are two bars on one lane. */
export const SeveralRangesOnARow: Story = {
  tags: ['!dev', '!autodocs'],
  args: MaintenanceWindows.args,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const bars = rects(canvasElement);
      expect(bars).toHaveLength(6);
      const first = bars[0].getBoundingClientRect();
      const second = bars[1].getBoundingClientRect();
      // The second window of rack A12 starts after the first one ends, on the same lane.
      expect(second.left).toBeGreaterThan(first.right);
      expect(Math.abs(second.top - first.top)).toBeLessThan(1);
    });
  },
};

/** Without `groupRows` each series has a lane of its own in a row; with it they share one. */
export const LanesPerSeriesOrPerRow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: CHANGES },
  render: (args) => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="lanes">
        <RangeBarChart {...args} />
      </div>
      <div data-testid="grouped">
        <RangeBarChart {...args} groupRows />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const chart = (id: string) =>
      canvasElement.querySelector(`[data-testid="${id}"]`) as HTMLElement;
    // api-gateway has a maintenance (13th, 02:00), a deploy (13th, 10:00) and an incident (14th).
    const laneOf = (root: HTMLElement) =>
      [...new Set(rects(root).map((el) => Math.round(el.getBoundingClientRect().top)))].length;
    await waitFor(() => {
      expect(rects(chart('lanes')).length).toBe(11);
      expect(rects(chart('grouped')).length).toBe(11);
      // Five rows: three lanes in each row, or one.
      expect(laneOf(chart('lanes'))).toBeGreaterThan(laneOf(chart('grouped')));
      expect(laneOf(chart('grouped'))).toBe(5);
    });
  },
};

/** The tooltip lists every range of the row, each with its start and end through `formatDate`. */
export const TooltipListsTheRangesOfARow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...SeverityColors.args },
  play: async ({ canvasElement }) => {
    // DC2 Frankfurt: a degraded window, an outage, a second degraded window.
    await openTooltipAt(canvasElement, 0.5, 0.3);
    const card = tooltipCard(canvasElement) as HTMLElement;
    await expect(card.querySelector('p')).toHaveTextContent(/^DC\d/);
    const items = [...card.querySelectorAll('li')].map((li) => li.textContent);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(item).toMatch(/\d\d:\d\d UTC – \d\d:\d\d UTC$/);
    await closeTooltip(canvasElement);
  },
};

/** A click on a legend entry hides its ranges and shows them again. */
export const LegendTogglesSeries: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: CHANGES },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(rects(canvasElement)).toHaveLength(11));
    const deploy = canvas.getByRole('button', { name: 'Deploy' });
    await userEvent.click(deploy);
    await waitFor(() => expect(rects(canvasElement)).toHaveLength(6));
    await expect(deploy).toHaveAttribute('aria-pressed', 'false');
    await expect(legendTexts(canvasElement)).toEqual(['Maintenance', 'Deploy', 'Incident']);
    await userEvent.click(deploy);
    await waitFor(() => expect(rects(canvasElement)).toHaveLength(11));
  },
};

/** With `groupRows`, a hidden series leaves the lane it shared. */
export const LegendTogglesSeriesInGroupedRows: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: CHANGES, groupRows: true },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(rects(canvasElement)).toHaveLength(11));
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Incident' }));
    await waitFor(() => expect(rects(canvasElement)).toHaveLength(8));
  },
};

/** The bars take the default palette of the theme, one color per series. */
export const PaletteFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: ['a', 'b', 'c', 'd', 'e'].map((name) => ({
      name,
      data: [{ x: 'api', y: [1700000000000, 1700003600000] as [number, number] }],
    })),
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
    await waitFor(() => expect(barFills(canvasElement).map(resolveColor)).toEqual(tokens.map(css)));
  },
};

/** A theme or accent switch on `<html>` repaints the chart with no observer and no redraw. */
export const RepaintsWithTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: MaintenanceWindows.args,
  play: ({ canvasElement }) =>
    expectRepaintsWithThemeOf(canvasElement, () => barFills(canvasElement)[0]),
};

/** `legendPosition` puts the legend on each side of the plot. */
export const LegendOnEachSide: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [
      { name: 'a', data: [{ x: 'api', y: [1700000000000, 1700003600000] as [number, number] }] },
      { name: 'b', data: [{ x: 'api', y: [1700000000000, 1700003600000] as [number, number] }] },
    ],
  },
  render: (args) => (
    <LegendSides>
      {(legendPosition) => <RangeBarChart {...args} legendPosition={legendPosition} />}
    </LegendSides>
  ),
  play: expectLegendsOnTheirSide,
};

/** A chart wider than its box is cut to it, so a narrow screen never scrolls sideways. */
export const NoHorizontalOverflow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: CHANGES, width: 900 },
  render: (args) => (
    <div data-testid="box" style={{ width: 375, maxWidth: '100%' }}>
      <RangeBarChart {...args} />
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

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its rows, ArrowDown to the next. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...MaintenanceWindows.args, ariaLabel: 'Maintenance windows' },
  play: expectAccessibleChart({ keyboard: true, next: '{ArrowDown}' }),
};

/**
 * The rows run down the chart: ArrowDown and ArrowRight go to the next row,
 * ArrowUp and ArrowLeft to the previous one. Recharts 3.10.1 reads them the
 * other way round and ignores Up and Down: the frame corrects it.
 */
export const ArrowKeysWalkTheRows: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...MaintenanceWindows.args, ariaLabel: 'Maintenance windows' },
  play: expectCategoryArrowKeys([
    'PAR1 rack A12',
    'PAR1 rack B03',
    'FRA2 rack C07',
    'LON1 rack D01',
    'TYO1 rack E09',
  ]),
};
