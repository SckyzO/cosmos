import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ReferenceLine } from 'recharts';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { BarChart } from './BarChart';
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
  expectMarksAtTheirValues,
  expectNoInjectedImage,
  expectReferenceLabelsFollowTextSize,
  expectRepaintsWithThemeOf,
  expectTextFollowsTextSize,
  HOSTILE,
  LegendSides,
  legendTexts,
  loadLateFont,
  NarrowBox,
  openTooltip,
  referenceBandEls,
  referenceLabels,
  referenceLineEls,
  resolveColor,
  surface,
  themeColor,
  tickTexts,
  tooltipCard,
} from './storybook-recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const DCS = ['DC1 Paris', 'DC2 Frankfurt', 'DC3 London', 'DC4 Tokyo'];
const SERVICES = [
  'api-gateway',
  'auth-service',
  'billing-service',
  'catalog-service',
  'checkout-service',
  'inventory-service',
  'notification-service',
  'order-service',
  'payment-service',
  'search-service',
  'shipping-service',
  'user-profile-service',
];

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Bar & Column',
  component: BarChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/** Vertical columns, one series. */
export const SingleSeries: Story = {
  args: {
    categories: MONTHS,
    series: [{ name: 'Incidents', data: [12, 18, 14, 22, 28, 19, 24, 31, 16] }],
  },
};

/** Two series or more are grouped side by side, with a legend. */
export const MultiSeries: Story = {
  args: {
    categories: MONTHS,
    series: [
      { name: 'CRIT', data: [3, 4, 2, 6, 5, 4, 7, 9, 5] },
      { name: 'WARN', data: [9, 14, 12, 16, 23, 15, 17, 22, 11] },
    ],
  },
};

/** `stacked` piles the series on each other. */
export const Stacked: Story = {
  args: {
    categories: MONTHS,
    stacked: true,
    series: [
      { name: 'CRIT', data: [3, 4, 2, 6, 5, 4, 7, 9, 5] },
      { name: 'WARN', data: [9, 14, 12, 16, 23, 15, 17, 22, 11] },
      { name: 'INFO', data: [4, 2, 5, 7, 4, 6, 3, 5, 4] },
    ],
  },
};

/** Columns below zero grow downward from the axis. */
export const NegativeValues: Story = {
  args: {
    categories: MONTHS,
    series: [{ name: 'Net rack change', data: [6, 4, -3, 8, -5, 2, -7, 5, 3] }],
  },
};

/**
 * Long category labels tilt when they don't fit side by side under their
 * columns, and are cut short with an ellipsis: the tooltip keeps the full name.
 */
export const ManyCategories: Story = {
  args: {
    categories: SERVICES,
    series: [{ name: 'Errors (24 h)', data: [182, 64, 23, 41, 137, 58, 12, 96, 151, 37, 44, 19] }],
  },
};

/** `orientation="horizontal"` draws bars rightward. */
export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
    categories: DCS,
    series: [{ name: 'Active racks', data: [42, 38, 26, 19] }],
  },
};

export const HorizontalMultiSeries: Story = {
  args: {
    orientation: 'horizontal',
    categories: DCS,
    series: [
      { name: 'In use', data: [42, 38, 26, 19] },
      { name: 'Available', data: [8, 12, 14, 21] },
    ],
  },
};

export const HorizontalStacked: Story = {
  args: {
    orientation: 'horizontal',
    stacked: true,
    categories: DCS,
    series: [
      { name: 'In use', data: [42, 38, 26, 19] },
      { name: 'Available', data: [8, 12, 14, 21] },
    ],
  },
};

/**
 * Stacked bars with one series below zero face each other across the axis.
 * `formatValue` drops the sign from the axis and the tooltip.
 */
export const HorizontalNegativeStacked: Story = {
  args: {
    orientation: 'horizontal',
    stacked: true,
    categories: DCS,
    formatValue: (v) => `${Math.abs(v)} Gb/s`,
    series: [
      { name: 'Outbound', data: [-31, -27, -19, -12] },
      { name: 'Inbound', data: [42, 35, 28, 16] },
    ],
  },
};

export const HorizontalNegativeStackedChecks: Story = {
  ...HorizontalNegativeStacked,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    // The negative series stacks left of zero and the positive one right of it: they never overlap.
    await waitFor(() => {
      const [outbound, inbound] = barShapes(canvasElement).map((shapes) =>
        shapes[0]?.getBoundingClientRect()
      );
      expect(outbound).toBeDefined();
      expect(inbound).toBeDefined();
      expect((outbound as DOMRect).right).toBeLessThanOrEqual((inbound as DOMRect).left + 1);
    });
  },
};

// A population pyramid: the oldest group on top, each series a side of the central axis.
const AGES = ['75+', '60 to 74', '45 to 59', '30 to 44', '15 to 29', 'Under 15'];
const MEN = [4, 9, 14, 17, 15, 11];
const WOMEN = [6, 11, 15, 17, 14, 10];
const PYRAMID = {
  orientation: 'horizontal',
  mirrored: true,
  categories: AGES,
  formatValue: (v: number) => `${v} k`,
  series: [
    { name: 'Men', data: MEN },
    { name: 'Women', data: WOMEN },
  ],
} as const satisfies Partial<React.ComponentProps<typeof BarChart>>;

/**
 * `mirrored` draws two series either side of a central axis, a population
 * pyramid with `orientation="horizontal"`. The values are magnitudes, the first
 * series goes to the negative side, and the labels and the tooltip show them
 * without a sign.
 */
export const Mirrored: Story = {
  args: { ...PYRAMID, series: [...PYRAMID.series], categories: [...PYRAMID.categories] },
};

// Asserts no tick label of the chart in `root` is cut by its edge: the axis made room for them.
const expectLabelsInsideTheChart = (root: HTMLElement) => {
  const chart = (surface(root) as Element).getBoundingClientRect();
  const labels = root.querySelectorAll('.recharts-cartesian-axis-tick-value');
  expect(labels.length).toBeGreaterThan(0);
  for (const label of labels) {
    const box = label.getBoundingClientRect();
    expect(box.left, label.textContent ?? '').toBeGreaterThanOrEqual(chart.left - 0.5);
    expect(box.right, label.textContent ?? '').toBeLessThanOrEqual(chart.right + 0.5);
  }
};

const axisX = (root: HTMLElement) => referenceLineEls(root)[0]?.getBoundingClientRect().left ?? NaN;

// The boxes of the bars of each series, left of the central axis for the first and right of it
// for the second, each starting on it. Waits for the bars to be drawn.
const expectSidesOfTheAxis = (root: HTMLElement, count: number) =>
  waitFor(() => {
    const [men, women] = barShapes(root).map((shapes) =>
      shapes.map((shape) => shape.getBoundingClientRect())
    );
    expect(men).toHaveLength(count);
    expect(women).toHaveLength(count);
    expect(referenceLineEls(root)).toHaveLength(1);
    const line = axisX(root);
    for (const bar of men) expect(Math.abs(bar.right - line)).toBeLessThanOrEqual(1);
    for (const bar of women) expect(Math.abs(bar.left - line)).toBeLessThanOrEqual(1);
  });

export const MirroredChecks: Story = {
  ...Mirrored,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    // The ticks read the same on both sides of zero, with no minus sign.
    await waitFor(() => {
      const ticks = tickTexts(canvasElement, 'xAxis');
      expect(ticks.length).toBeGreaterThan(2);
      for (const tick of ticks) expect(tick).toMatch(/^\d+ k$/);
      expect(ticks).toEqual([...ticks].reverse());
      expectLabelsInsideTheChart(canvasElement);
    });
    // The first series is left of the central axis, the second right of it, both starting on it.
    await expectSidesOfTheAxis(canvasElement, AGES.length);
    await waitFor(() => {
      const [men, women] = barShapes(canvasElement).map((shapes) =>
        shapes.map((shape) => shape.getBoundingClientRect())
      );
      // A bar is as long as its value: the bigger of two is the longer.
      expect(men[3].width).toBeGreaterThan(men[0].width);
      expect(women[3].width / women[0].width).toBeCloseTo(WOMEN[3] / WOMEN[0], 1);
    });
    // The central axis sits at the zero tick, the middle of the plot.
    await waitFor(() => {
      const zero = [
        ...canvasElement.querySelectorAll(
          '.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value'
        ),
      ].find((tick) => tick.textContent === '0 k');
      expect(zero).toBeDefined();
      expect(
        Math.abs(
          (zero as Element).getBoundingClientRect().left +
            (zero as Element).getBoundingClientRect().width / 2 -
            axisX(canvasElement)
        )
      ).toBeLessThanOrEqual(1.5);
    });
    // The tooltip gives the two magnitudes of the row under the pointer, with no sign.
    await openTooltip(canvasElement, 0.5);
    const card = tooltipCard(canvasElement) as HTMLElement;
    const row = AGES.indexOf(card.querySelector('p')?.textContent ?? '');
    await expect(row).toBeGreaterThanOrEqual(0);
    await expect(card).toHaveTextContent(`${MEN[row]} k`);
    await expect(card).toHaveTextContent(`${WOMEN[row]} k`);
    await expect(card.textContent).not.toMatch(/[-\u2212]/);
    await closeTooltip(canvasElement);
  },
};

/** The bars round the end away from the axis, on each side. */
export const MirroredBarsRoundTheirOuterEnd: Story = {
  ...Mirrored,
  tags: ['!dev', '!autodocs'],
  args: { ...Mirrored.args, borderRadius: 6 },
  play: async ({ canvasElement }) => {
    await expectSidesOfTheAxis(canvasElement, AGES.length);
    for (const shape of barShapes(canvasElement).flat()) expect(roundedCorners(shape)).toBe(2);
  },
};

/** Hiding a series from the legend leaves the central axis in the middle. */
export const MirroredKeepsTheAxisCentred: Story = {
  ...Mirrored,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const symmetric = () => {
      const ticks = tickTexts(canvasElement, 'xAxis');
      expect(ticks.length).toBeGreaterThan(2);
      expect(ticks).toEqual([...ticks].reverse());
    };
    await waitFor(symmetric);
    const drawn = () => barShapes(canvasElement).filter((shapes) => shapes.length > 0);
    await userEvent.click(canvas.getByRole('button', { name: 'Women' }));
    await waitFor(() => {
      expect(drawn().map((shapes) => shapes.length)).toEqual([AGES.length]);
      symmetric();
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Women' }));
    await waitFor(() => expect(drawn()).toHaveLength(2));
  },
};

/**
 * The rules that read a value read its magnitude: `colorByValue` gets 12, not
 * -12, and `negativeColor` has nothing to color, since no value is below zero.
 */
export const MirroredColorRules: Story = {
  ...Mirrored,
  tags: ['!dev', '!autodocs'],
  args: {
    ...Mirrored.args,
    negativeColor: 'var(--color-status-warn)',
    colorByValue: (value) => (value >= 15 ? 'var(--color-status-crit)' : undefined),
  },
  play: async ({ canvasElement }) => {
    const crit = themeColor('--color-status-crit');
    await expectSidesOfTheAxis(canvasElement, AGES.length);
    await waitFor(() => {
      const [men, women] = barShapes(canvasElement).map((shapes) =>
        shapes.map((shape) => resolveColor(getComputedStyle(shape).fill))
      );
      expect(men).toEqual(MEN.map((v) => (v >= 15 ? crit : themeColor('--color-brand-500'))));
      expect(women).toEqual(WOMEN.map((v) => (v >= 15 ? crit : themeColor('--color-chart-2'))));
    });
  },
};

/** The same rule with the categories along the horizontal axis: the first series hangs below it. */
export const MirroredColumns: Story = {
  args: {
    mirrored: true,
    categories: ['Q1', 'Q2', 'Q3', 'Q4'],
    formatValue: (v) => `${v} M€`,
    series: [
      { name: 'Imports', data: [18, 22, 19, 26] },
      { name: 'Exports', data: [24, 21, 27, 30] },
    ],
  },
};

export const MirroredColumnsChecks: Story = {
  ...MirroredColumns,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const ticks = tickTexts(canvasElement, 'yAxis');
      expect(ticks.length).toBeGreaterThan(2);
      for (const tick of ticks) expect(tick).toMatch(/^\d+ M€$/);
      expect(ticks).toEqual([...ticks].reverse());
      expectLabelsInsideTheChart(canvasElement);
    });
    await waitFor(() => {
      const [imports, exports] = barShapes(canvasElement).map((shapes) =>
        shapes.map((shape) => shape.getBoundingClientRect())
      );
      const line = (referenceLineEls(canvasElement)[0] as Element).getBoundingClientRect().top;
      expect(imports).toHaveLength(4);
      expect(exports).toHaveLength(4);
      for (const bar of imports) expect(Math.abs(bar.top - line)).toBeLessThanOrEqual(1);
      for (const bar of exports) expect(Math.abs(bar.bottom - line)).toBeLessThanOrEqual(1);
    });
  },
};

/** On a phone the pyramid keeps its two sides and its labels inside the box. */
export const MirroredNarrow: Story = {
  args: Mirrored.args,
  render: (args) => (
    <NarrowBox>
      <BarChart {...args} />
    </NarrowBox>
  ),
};

export const MirroredFitsNarrowBox: Story = {
  ...MirroredNarrow,
  tags: ['!dev', '!autodocs'],
  args: { ...Mirrored.args, width: 900 },
  play: async (context) => {
    await expectFitsNarrowBox(context);
    await expectSidesOfTheAxis(context.canvasElement, AGES.length);
  },
};

/**
 * `mirrored` is opt-in: without it, a series below zero is what it always was,
 * and the labels keep their sign.
 */
export const NotMirroredByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    orientation: 'horizontal',
    stacked: true,
    categories: DCS,
    series: [
      { name: 'Outbound', data: [-31, -27, -19, -12] },
      { name: 'Inbound', data: [42, 35, 28, 16] },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(tickTexts(canvasElement, 'xAxis').some((tick) => tick?.includes('-'))).toBe(true);
    });
  },
};

export const FormattedValues: Story = {
  args: {
    categories: MONTHS,
    formatValue: (v) => `${v} k€`,
    series: [{ name: 'Revenue', data: [120, 145, 132, 168, 195, 178, 210, 234, 198] }],
  },
};

export const CustomColors: Story = {
  args: {
    categories: MONTHS,
    colors: ['#10b981', '#f59e0b', '#ef4444'],
    series: [
      { name: 'OK', data: [80, 78, 82, 75, 70, 72, 68, 65, 70] },
      { name: 'WARN', data: [12, 14, 12, 16, 20, 18, 22, 25, 20] },
      { name: 'CRIT', data: [3, 4, 2, 6, 5, 4, 7, 9, 5] },
    ],
  },
};

export const ShortHeight: Story = {
  args: {
    height: 200,
    categories: MONTHS,
    series: [{ name: 'Compact', data: [12, 18, 14, 22, 28, 19, 24, 31, 16] }],
  },
};

/**
 * `xTitle` and `yTitle` name the axes as drawn: under the horizontal one, beside
 * the vertical one, so a horizontal chart puts its values under `xTitle`.
 */
export const AxisTitles: Story = {
  args: { ...SingleSeries.args },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="vertical">
        <BarChart
          categories={MONTHS}
          series={[{ name: 'Deploys', data: [12, 19, 23, 31, 22, 18, 25, 33, 30] }]}
          xTitle="Month"
          yTitle="Deployments"
        />
      </div>
      <div data-testid="horizontal">
        <BarChart
          orientation="horizontal"
          categories={DCS}
          series={[{ name: 'Active racks', data: [42, 38, 26, 19] }]}
          xTitle="Active racks"
          yTitle="Datacenter"
        />
      </div>
    </div>
  ),
};

export const AxisTitlesChecks: Story = {
  ...AxisTitles,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const chart = (id: string) =>
      canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
    await waitFor(() => {
      expect(axisTitles(chart('vertical'))).toEqual({ x: ['Month'], y: ['Deployments'] });
      expect(axisTitles(chart('horizontal'))).toEqual({
        x: ['Active racks'],
        y: ['Datacenter'],
      });
    });
  },
};

/** `borderRadius` rounds the end of a bar away from the axis; only the outer end of a stack. */
export const BorderRadius: Story = {
  args: {
    categories: MONTHS.slice(0, 6),
    stacked: true,
    borderRadius: 8,
    series: [
      { name: 'CRIT', data: [3, 4, 2, 6, 5, 4] },
      { name: 'WARN', data: [9, 14, 12, 16, 23, 15] },
      { name: 'INFO', data: [4, 2, 5, 7, 4, 6] },
    ],
  },
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { series: [], categories: [] },
};

export const EmptyChecks: Story = {
  ...Empty,
  tags: ['!dev', '!autodocs'],
  play: expectEmptyMessage('No data'),
};

/** `emptyMessage` says why there is nothing to draw. */
export const EmptyWithMessage: Story = {
  args: { series: [{ name: 'Incidents', data: [] }], categories: [], emptyMessage: 'No incidents' },
};

export const EmptyWithMessageChecks: Story = {
  ...EmptyWithMessage,
  tags: ['!dev', '!autodocs'],
  play: expectEmptyMessage('No incidents'),
};

/**
 * `loading` draws a skeleton of the chart's height in place of the plot, until the data is there.
 * It is a busy group named by `ariaLabel` and the word "loading", and it holds still under
 * `prefers-reduced-motion`.
 */
export const Loading: Story = {
  args: { ...SingleSeries.args, loading: true, height: 240, ariaLabel: 'Incidents per month' },
};

export const LoadingChecks: Story = {
  ...Loading,
  tags: ['!dev', '!autodocs'],
  args: { ...Loading.args, width: 300 },
  play: async ({ canvasElement }) => {
    const block = await waitFor(() => {
      const found = canvasElement.querySelector<HTMLElement>('[data-chart-loading]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    await expect(block).toHaveAttribute('aria-busy', 'true');
    await expect(block).toHaveAccessibleName('Incidents per month, loading');
    // The size the chart would have: `height` and `width`.
    const { width, height } = block.getBoundingClientRect();
    await expect([width, height]).toEqual([300, 240]);
    await expect(canvasElement.querySelector('svg')).toBeNull();
    await expect(canvasElement.querySelector('[data-chart-empty]')).toBeNull();
  },
};

/** The skeleton is cut to its box, like the chart it stands for: a narrow screen never scrolls sideways. */
export const LoadingFitsNarrowBox: Story = {
  ...Loading,
  tags: ['!dev', '!autodocs'],
  args: { ...Loading.args, width: 900 },
  render: (args) => (
    <NarrowBox>
      <BarChart {...args} />
    </NarrowBox>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>('[data-testid="box"]') as HTMLElement;
    await waitFor(() => expect(canvasElement.querySelector('[data-chart-loading]')).not.toBeNull());
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    const block = canvasElement.querySelector('[data-chart-loading]') as Element;
    await expect(block.getBoundingClientRect().width).toBeLessThanOrEqual(375);
    const root = document.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/**
 * `children` takes Recharts elements, drawn inside the chart after the ones it
 * builds: here a `ReferenceLine` for a threshold, in the units of the values.
 */
export const ReferenceLineInChildren: Story = {
  args: {
    ...SingleSeries.args,
    children: (
      <ReferenceLine
        y={25}
        stroke="var(--color-status-warn)"
        strokeDasharray="6 4"
        label={{ value: 'Budget 25', position: 'insideTopLeft', fill: 'var(--color-text-muted)' }}
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
      expect(canvasElement.textContent).toContain('Budget 25');
    });
  },
};

// The fill of every bar of the first series, as the browser resolves it.
const fills = (root: HTMLElement) =>
  (barShapes(root)[0] ?? []).map((bar) => resolveColor(getComputedStyle(bar).fill));

const INCIDENTS = [12, 18, 14, 22, 28, 19, 24, 31, 16];

/**
 * `colorByValue` gives a bar its own color from its value and the index of its
 * category: here the months above 25 turn to the critical color. Return
 * `undefined` to keep the series color.
 */
export const ColorByValue: Story = {
  args: {
    categories: MONTHS,
    series: [{ name: 'Incidents', data: INCIDENTS }],
    colorByValue: (value) => (value > 25 ? 'var(--color-status-crit)' : undefined),
  },
};

export const ColorByValueChecks: Story = {
  ...ColorByValue,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const crit = themeColor('--color-status-crit');
    const brand = themeColor('--color-brand-500');
    await waitFor(() => {
      expect(fills(canvasElement)).toEqual(INCIDENTS.map((v) => (v > 25 ? crit : brand)));
    });
    // The tooltip chip of a bar is the color of the bar.
    await openTooltip(canvasElement, 0.83);
    const chip = tooltipCard(canvasElement)?.querySelector('li span');
    await expect(resolveColor(getComputedStyle(chip as Element).backgroundColor)).toBe(crit);
    await closeTooltip(canvasElement);
  },
};

/** `distributed` gives every category a color of the palette (`colors` cycles), where a series has one. */
export const Distributed: Story = {
  args: {
    categories: DCS,
    series: [{ name: 'Active racks', data: [42, 38, 26, 19] }],
    distributed: true,
  },
};

export const DistributedChecks: Story = {
  ...Distributed,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(fills(canvasElement)).toEqual(
        ['--color-brand-500', '--color-chart-2', '--color-chart-3', '--color-chart-4'].map(
          themeColor
        )
      )
    );
  },
};

/** `colors` sets the palette `distributed` draws from, and starts over after the last. */
export const DistributedWithColors: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: DCS,
    series: [{ name: 'Active racks', data: [42, 38, 26, 19] }],
    distributed: true,
    colors: ['#10b981', '#f59e0b', '#ef4444'],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(fills(canvasElement)).toEqual(
        ['#10b981', '#f59e0b', '#ef4444', '#10b981'].map(resolveColor)
      )
    );
  },
};

/** `negativeColor` colors the bars below zero, for diverging bars. */
export const NegativeColor: Story = {
  args: {
    categories: MONTHS,
    series: [{ name: 'Net rack change', data: [6, 4, -3, 8, -5, 2, -7, 5, 3] }],
    negativeColor: 'var(--color-status-crit)',
  },
};

export const NegativeColorChecks: Story = {
  ...NegativeColor,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const crit = themeColor('--color-status-crit');
    const brand = themeColor('--color-brand-500');
    await waitFor(() =>
      expect(fills(canvasElement)).toEqual(
        [6, 4, -3, 8, -5, 2, -7, 5, 3].map((v) => (v < 0 ? crit : brand))
      )
    );
  },
};

/** On horizontal bars the negative color applies the same way. */
export const HorizontalNegativeColor: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    orientation: 'horizontal',
    categories: DCS,
    series: [{ name: 'Delta', data: [12, -8, 5, -14] }],
    negativeColor: 'var(--color-status-warn)',
  },
  play: async ({ canvasElement }) => {
    const warn = themeColor('--color-status-warn');
    const brand = themeColor('--color-brand-500');
    await waitFor(() => expect(fills(canvasElement)).toEqual([brand, warn, brand, warn]));
  },
};

/** `colorByValue` wins over `negativeColor` and `distributed` when it returns a color. */
export const ColorByValueWinsOverTheOtherRules: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: DCS,
    series: [{ name: 'Delta', data: [12, -8, 5, -14] }],
    distributed: true,
    negativeColor: '#ef4444',
    colorByValue: (_value, index) => (index === 1 ? '#10b981' : undefined),
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(fills(canvasElement)).toEqual([
        themeColor('--color-brand-500'),
        resolveColor('#10b981'),
        themeColor('--color-chart-3'),
        resolveColor('#ef4444'),
      ])
    );
  },
};

/** `referenceLines` and `referenceBands` read the vertical axis: a budget, a safe range. */
export const ReferenceLines: Story = {
  args: {
    ...SingleSeries.args,
    yTitle: 'Incidents',
    referenceBands: [{ from: 0, to: 15, label: 'Within target', intent: 'success' }],
    referenceLines: [
      { value: 25, label: 'Budget 25', intent: 'warning', dashed: true },
      { value: 35, label: 'Breach', intent: 'danger' },
    ],
  },
};

export const ReferenceLinesChecks: Story = {
  ...ReferenceLines,
  tags: ['!dev', '!autodocs'],
  play: async (context) => {
    await expectMarksAtTheirValues('yAxis', { lines: [25, 35], bands: [[0, 15]] })(context);
    await waitFor(() =>
      expect(referenceLabels(context.canvasElement)).toEqual([
        'Breach',
        'Budget 25',
        'Within target',
      ])
    );
    await expect(
      referenceLineEls(context.canvasElement).map((line) => line.getAttribute('stroke-dasharray'))
    ).toEqual(['6 4', null]);
  },
};

/** On horizontal bars the values run along the horizontal axis, and so do the lines and bands. */
export const HorizontalReferenceLines: Story = {
  args: {
    ...Horizontal.args,
    xTitle: 'Racks',
    referenceBands: [{ from: 30, to: 50, label: 'Target', intent: 'success' }],
    referenceLines: [{ value: 40, label: 'Capacity 40', intent: 'danger', dashed: true }],
  },
};

export const HorizontalReferenceLinesChecks: Story = {
  ...HorizontalReferenceLines,
  tags: ['!dev', '!autodocs'],
  play: async (context) => {
    await expectMarksAtTheirValues('xAxis', { lines: [40], bands: [[30, 50]] })(context);
    await waitFor(() =>
      expect(referenceLabels(context.canvasElement)).toEqual(['Capacity 40', 'Target'])
    );
  },
};

/** The line and band colors come from the theme in each of the four themes. */
export const ReferenceIntentsFollowTheTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    ...SingleSeries.args,
    referenceLines: [
      { value: 8, intent: 'success' },
      { value: 25, intent: 'warning' },
      { value: 35, intent: 'danger' },
      { value: 15 },
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
      <BarChart {...args} />
    </NarrowBox>
  ),
  play: expectFitsNarrowBox,
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** One legend entry per series, in order. */
export const LegendListsEverySeries: Story = {
  tags: ['!dev', '!autodocs'],
  args: MultiSeries.args,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(legendTexts(canvasElement)).toEqual(['CRIT', 'WARN']));
  },
};

/** A click on a legend entry hides its series and shows it again; the stack closes up. */
export const LegendTogglesSeries: Story = {
  tags: ['!dev', '!autodocs'],
  args: Stacked.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const drawn = () => barShapes(canvasElement).filter((shapes) => shapes.length > 0).length;
    await waitFor(() => expect(drawn()).toBe(3));
    const warn = canvas.getByRole('button', { name: 'WARN' });
    await expect(warn).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(warn);
    await waitFor(() => expect(drawn()).toBe(2));
    await expect(warn).toHaveAttribute('aria-pressed', 'false');
    await expect(legendTexts(canvasElement)).toEqual(['CRIT', 'WARN', 'INFO']);
    warn.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(drawn()).toBe(3));
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
      { name: 'Normal', data: [4, 1, 6] },
    ],
    categories: [HOSTILE, 'B', 'C'],
    referenceLines: [{ value: 5, label: HOSTILE }],
    referenceBands: [{ from: 1, to: 2, label: HOSTILE }],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(legendTexts(canvasElement)).toContain(HOSTILE));
    await waitFor(() => expect(referenceLabels(canvasElement)).toEqual([HOSTILE, HOSTILE]));
    await expectNoInjectedImage(canvasElement);
    await waitFor(() => expect(axisTitles(canvasElement)).toEqual({ x: [HOSTILE], y: [HOSTILE] }));
    await openTooltip(canvasElement, 0.1);
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
  args: { ...MultiSeries.args, formatValue: (v) => `${v} kW` },
  play: async ({ canvasElement }) => {
    await openTooltip(canvasElement, 0.08);
    const card = tooltipCard(canvasElement) as HTMLElement;
    await expect(card).toHaveAttribute('aria-live', 'polite');
    await expect(card).toHaveTextContent('Jan');
    await expect(card).toHaveTextContent('CRIT');
    await expect(card).toHaveTextContent('3 kW');
    await expect(card).toHaveTextContent('9 kW');
    await closeTooltip(canvasElement);
  },
};

/** `formatValue` formats the value axis labels, whichever axis that is. */
export const FormatValueFormatsLabels: Story = {
  tags: ['!dev', '!autodocs'],
  args: FormattedValues.args,
  render: (args) => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="vertical">
        <BarChart {...args} />
      </div>
      <div data-testid="horizontal">
        <BarChart
          orientation="horizontal"
          formatValue={(v) => `${v} k€`}
          categories={DCS}
          series={[{ name: 'Revenue', data: [42, 38, 26, 19] }]}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const y = tickTexts(
        canvasElement.querySelector('[data-testid="vertical"]') as HTMLElement,
        'yAxis'
      );
      const x = tickTexts(
        canvasElement.querySelector('[data-testid="horizontal"]') as HTMLElement,
        'xAxis'
      );
      expect(y.length).toBeGreaterThan(1);
      expect(x.length).toBeGreaterThan(1);
      for (const label of [...y, ...x]) expect(label).toMatch(/^\d+ k€$/);
    });
  },
};

/**
 * Colors are CSS variables handed to the SVG: a theme or accent switch on
 * `<html>` repaints the chart with no observer and no redraw.
 */
export const RepaintsWithTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: SingleSeries.args,
  play: ({ canvasElement }) =>
    expectRepaintsWithThemeOf(canvasElement, () => barFills(canvasElement)[0]),
};

/** The bars take the default palette of the theme: the accent, then the hues after it. */
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
    await waitFor(() => expect(barFills(canvasElement).map(resolveColor)).toEqual(tokens.map(css)));
  },
};

/**
 * The default palette has eight categorical colors: the accent first, then
 * hues apart from each other, none of them green, amber or red in the first
 * places, so series never read as statuses. Past eight the colors repeat.
 */
export const EightSeriesPalette: Story = {
  args: {
    categories: MONTHS.slice(0, 5),
    stacked: true,
    legendPosition: 'bottom',
    series: ['web', 'api', 'batch', 'cache', 'queue', 'search', 'auth', 'mail'].map(
      (name, index) => ({ name, data: [4, 6, 5, 7, 3].map((v) => v + index) })
    ),
  },
};

export const EightSeriesPaletteChecks: Story = {
  ...EightSeriesPalette,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const fills = barFills(canvasElement).map(resolveColor);
      expect(fills).toHaveLength(8);
      expect(new Set(fills).size).toBe(8);
    });
  },
};

/** With the cyan accent the palette drops the cyan and the teal, which would repeat the accent. */
export const EightSeriesPaletteCyanAccent: Story = {
  ...EightSeriesPalette,
  globals: { accent: 'cyan' },
  play: undefined,
};

export const EightSeriesPaletteCyanAccentChecks: Story = {
  ...EightSeriesPaletteCyanAccent,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const fills = barFills(canvasElement).map(resolveColor);
      expect(fills).toHaveLength(8);
      expect(new Set(fills).size).toBe(8);
      expect(fills).not.toContain(resolveColor('#06b6d4'));
      expect(fills).not.toContain(resolveColor('#14b8a6'));
    });
  },
};

/** `colors` overrides the palette, one color per series. */
export const ColorsOverridePalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: CustomColors.args,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(barFills(canvasElement).map(resolveColor)).toEqual(
        ['#10b981', '#f59e0b', '#ef4444'].map(resolveColor)
      )
    );
  },
};

const gap = (root: HTMLElement) => {
  const [first, second] = barShapes(root).map((shapes) => shapes[0]?.getBoundingClientRect());
  return second && first ? second.left - first.right : NaN;
};

/**
 * The bars of a group are told apart by a gap between them. A stacked one keeps
 * its segments flush, and a single series has no group.
 */
export const GroupedBarsHaveAGap: Story = {
  tags: ['!dev', '!autodocs'],
  args: MultiSeries.args,
  render: (args) => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="grouped">
        <BarChart {...args} />
      </div>
      <div data-testid="stacked">
        <BarChart {...args} stacked />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const chart = (id: string) =>
      canvasElement.querySelector(`[data-testid="${id}"]`) as HTMLElement;
    await waitFor(() => {
      expect(gap(chart('grouped'))).toBeGreaterThanOrEqual(2);
      // Stacked, the second segment is above the first: same column.
      const [low, high] = barShapes(chart('stacked')).map((shapes) =>
        shapes[0]?.getBoundingClientRect()
      );
      expect(Math.abs((low?.left ?? 0) - (high?.left ?? 1))).toBeLessThan(1);
      expect(Math.abs((high?.bottom ?? 0) - (low?.top ?? 1))).toBeLessThan(1);
    });
  },
};

// A rounded corner is an arc with a radius; a square one has `a0,0`.
const roundedCorners = (shape?: Element) =>
  (shape?.getAttribute('d')?.match(/a(?!0,0 )\d/g) ?? []).length;

/** Only the outer end of a stack is rounded: the segments inside it stay square. */
export const OnlyTheOuterEndOfAStackIsRounded: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Stacked.args, borderRadius: 6 },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const [crit, warn, info] = barShapes(canvasElement).map((shapes) => shapes[0]);
      expect(roundedCorners(crit)).toBe(0);
      expect(roundedCorners(warn)).toBe(0);
      expect(roundedCorners(info)).toBe(2);
    });
  },
};

/** A bar below zero rounds its bottom end; a horizontal one, its right (or left) end. */
export const RoundedEndFollowsTheSign: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...NegativeValues.args, borderRadius: 6 },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const shapes = barShapes(canvasElement)[0];
      expect(shapes).toHaveLength(9);
      for (const shape of shapes) expect(roundedCorners(shape)).toBe(2);
      // Third value is -3: the arcs sit at the bottom of the bar (after the left edge's `V`).
      const d = shapes[2].getAttribute('d') as string;
      expect(d.indexOf('a6,6')).toBeGreaterThan(d.indexOf('V'));
    });
  },
};

/** Long labels are cut short and the tooltip keeps the full name. */
export const LongLabelsAreTrimmed: Story = {
  tags: ['!dev', '!autodocs'],
  args: ManyCategories.args,
  render: (args) => (
    <div style={{ width: 640 }}>
      <BarChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const ticks = tickTexts(canvasElement, 'xAxis');
      expect(ticks).toHaveLength(SERVICES.length);
      expect(ticks).toContain('api-gateway');
      expect(ticks).toContain('user-profile-…');
    });
    await openTooltip(canvasElement, 0.97);
    await expect(tooltipCard(canvasElement)).toHaveTextContent('user-profile-service');
    await closeTooltip(canvasElement);
  },
};

/** The axis labels, the axis title and the legend follow the text size setting. */
export const TextFollowsTheTextSize: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...MultiSeries.args, xTitle: 'Month' },
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
      {(legendPosition) => <BarChart {...args} legendPosition={legendPosition} />}
    </LegendSides>
  ),
  play: expectLegendsOnTheirSide,
};

/** A chart wider than its box is cut to it, so a narrow screen never scrolls sideways. */
export const NoHorizontalOverflow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...MultiSeries.args, width: 900 },
  render: (args) => (
    <div data-testid="box" style={{ width: 375, maxWidth: '100%' }}>
      <BarChart {...args} />
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
  args: { ...SingleSeries.args, ariaLabel: 'Incidents per month' },
  play: expectAccessibleChart({ keyboard: true }),
};

/**
 * Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys
 * walk its bars. With the bars horizontal the categories run down the chart,
 * and ArrowDown goes to the next one.
 */
export const HorizontalNamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Horizontal.args, ariaLabel: 'Active racks per datacenter' },
  play: expectAccessibleChart({ keyboard: true, next: '{ArrowDown}' }),
};

/**
 * With the categories on the vertical axis, ArrowDown and ArrowRight go to the
 * next category and ArrowUp and ArrowLeft to the previous one. Recharts 3.10.1
 * reads them the other way round and ignores Up and Down: the frame corrects it.
 */
export const HorizontalArrowKeysWalkTheCategories: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Horizontal.args, ariaLabel: 'Active racks per datacenter' },
  play: expectCategoryArrowKeys(DCS),
};

const LATE_FAMILY = 'CosmosLateFont';

const lateFontChart = (id: string) => (
  <div data-testid={id} style={{ fontFamily: `${LATE_FAMILY}, sans-serif` }}>
    <BarChart
      orientation="horizontal"
      categories={SERVICES}
      series={[
        { name: 'Errors (24 h)', data: [182, 64, 23, 41, 137, 58, 12, 96, 151, 37, 44, 19] },
      ]}
      height={420}
    />
  </div>
);

/**
 * The same chart twice, in a font that is not loaded yet; the second one mounts
 * on demand. The first is one element, made once: React leaves it alone when
 * the second mounts, so only the font can make it measure its labels again.
 */
const LateFontCharts = () => {
  const [second, setSecond] = useState(false);
  const [early] = useState(() => lateFontChart('early'));
  return (
    <div>
      <button type="button" onClick={() => setSecond(true)}>
        Mount the second chart
      </button>
      {early}
      {second && lateFontChart('late')}
    </div>
  );
};

/** Where the plot starts, from the left edge of the chart: the room the axis labels take. */
const plotLeft = (root: HTMLElement) => {
  const grid = root.querySelector('.recharts-cartesian-grid')?.getBoundingClientRect();
  const left = surface(root)?.getBoundingClientRect().left;
  return grid && left !== undefined ? Math.round(grid.left - left) : NaN;
};

/**
 * `YAxis width="auto"` measures its labels when the chart mounts. A web font
 * that arrives later changes their width, so the frame mounts the chart again
 * once: a chart drawn before the font loaded ends up with the axis of one drawn
 * after.
 */
export const AxisWidthFollowsALateFont: Story = {
  tags: ['!dev', '!autodocs'],
  args: ManyCategories.args,
  render: () => <LateFontCharts />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chart = (id: string) =>
      canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`) as HTMLElement;
    await waitFor(() => expect(tickTexts(chart('early'), 'yAxis')).toHaveLength(SERVICES.length));
    // A monospace font, much wider than the fallback: the labels need more room.
    const unload = await loadLateFont(LATE_FAMILY, 'JetBrains Mono');
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Mount the second chart' }));
      await waitFor(() => expect(tickTexts(chart('late'), 'yAxis')).toHaveLength(SERVICES.length));
      await waitFor(() => expect(plotLeft(chart('early'))).toBe(plotLeft(chart('late'))));
    } finally {
      unload();
    }
  },
};

// A line inside a band: the band's label sits at its bottom and the line's at the top, so the two
// never print over each other.
export const BandAndLineLabelsDontOverlap: Story = {
  tags: ['!dev', '!autodocs'],
  args: HorizontalReferenceLines.args,
  render: (args) => (
    <div style={{ width: 360 }}>
      <BarChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const labels = await waitFor(() => {
      const found = [...canvasElement.querySelectorAll('.recharts-reference-label')];
      expect(found).toHaveLength(2);
      return found.map((label) => label.getBoundingClientRect());
    });
    const [a, b] = labels;
    const apart = a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
    await expect(apart).toBe(true);
  },
};
