import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReferenceLine } from 'recharts';
import { expect, userEvent, waitFor } from 'storybook/test';
import { WaterfallChart, type WaterfallDatum } from './WaterfallChart';
import {
  axisTitles,
  closeTooltip,
  expectColorsFromTokens,
  expectEmptyMessage,
  expectFitsNarrowBox,
  expectNoInjectedImage,
  expectRepaintsWithThemeOf,
  hover,
  HOSTILE,
  NarrowBox,
  pixelOnAxis,
  resolveColor,
  surface,
  themeColor,
  tickTexts,
  tooltipCard,
} from './storybook-recharts';

const k = (value: number) => `${value}k`;

// The profit walk of a quarter, in thousands: an opening balance, revenue, a
// subtotal after the refunds, the costs and the closing balance.
const PROFIT_WALK: WaterfallDatum[] = [
  { label: 'Opening', value: 420, kind: 'total' },
  { label: 'Sales', value: 310 },
  { label: 'Services', value: 95 },
  { label: 'Refunds', value: -42 },
  { label: 'Gross profit', kind: 'subtotal' },
  { label: 'Payroll', value: -265 },
  { label: 'Marketing', value: -88 },
  { label: 'Infrastructure', value: -54 },
  { label: 'Tax', value: -61 },
  { label: 'Closing', kind: 'total' },
];

// What PROFIT_WALK draws: the bottom and the top of each bar, then the running
// total after it (where the connector to the next bar sits).
const PROFIT_SPANS: [number, number][] = [
  [0, 420],
  [420, 730],
  [730, 825],
  [783, 825],
  [0, 783],
  [518, 783],
  [430, 518],
  [376, 430],
  [315, 376],
  [0, 315],
];
const PROFIT_RUNNING = [420, 730, 825, 783, 783, 518, 430, 376, 315, 315];

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Waterfall Chart',
  component: WaterfallChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof WaterfallChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── The Recharts DOM ─────────────────────────────────────────────────────────

const bars = (root: HTMLElement) => [
  ...root.querySelectorAll<SVGRectElement>('.recharts-bar-rectangle rect'),
];
const valueLabels = (root: HTMLElement) =>
  [...root.querySelectorAll('.recharts-bar-rectangle text')].map((el) => el.textContent);
const connectors = (root: HTMLElement) => [
  ...root.querySelectorAll<SVGLineElement>('[data-waterfall-connectors] line'),
];
const attr = (el: Element, name: string) => parseFloat(el.getAttribute(name) ?? '');
const near = (actual: number, expected: number, label: string) =>
  expect(Math.abs(actual - expected), label).toBeLessThanOrEqual(1);

// Each bar spans its [low, high], read on the value axis from its tick labels.
const expectBarsAtTheirSpans = (root: HTMLElement, spans: [number, number][]) =>
  waitFor(() => {
    const drawn = bars(root);
    expect(drawn).toHaveLength(spans.length);
    spans.forEach(([low, high], i) => {
      const top = attr(drawn[i], 'y');
      near(top, pixelOnAxis(root, 'yAxis', high), `bar ${i} top`);
      near(top + attr(drawn[i], 'height'), pixelOnAxis(root, 'yAxis', low), `bar ${i} bottom`);
    });
  });

// A connector leaves the right edge of a bar at the running total after it and
// reaches the left edge of the next bar.
const expectConnectorsJoinTheBars = (root: HTMLElement, running: number[]) =>
  waitFor(() => {
    const drawn = bars(root);
    const lines = connectors(root);
    expect(lines).toHaveLength(running.length - 1);
    lines.forEach((line, i) => {
      near(attr(line, 'x1'), attr(drawn[i], 'x') + attr(drawn[i], 'width'), `connector ${i} start`);
      near(attr(line, 'x2'), attr(drawn[i + 1], 'x'), `connector ${i} end`);
      near(attr(line, 'y1'), pixelOnAxis(root, 'yAxis', running[i]), `connector ${i} level`);
      expect(attr(line, 'y2')).toBe(attr(line, 'y1'));
    });
  });

const fills = (root: HTMLElement) => bars(root).map((el) => getComputedStyle(el).fill);

// The pointer over the middle of a bar, until the tooltip names it.
const hoverBar = (root: HTMLElement, index: number, text: string) =>
  waitFor(() => {
    const svg = surface(root) as SVGSVGElement;
    const box = svg.getBoundingClientRect();
    const bar = bars(root)[index].getBoundingClientRect();
    hover(svg, (bar.left + bar.width / 2 - box.left) / box.width);
    expect(tooltipCard(root)).toHaveTextContent(text);
  });

// Tab to the chart, which announces its first bar.
const focusChart = async (root: HTMLElement) => {
  const svg = () => surface(root) as SVGSVGElement;
  await waitFor(() => expect(svg()).toHaveAttribute('role', 'application'));
  await userEvent.tab();
  await expect(svg()).toHaveFocus();
};

const fontSizes = (root: HTMLElement) => [
  ...new Set(
    [...root.querySelectorAll('.recharts-bar-rectangle text')].map((el) =>
      parseFloat(getComputedStyle(el).fontSize)
    )
  ),
];

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * An opening balance walks through gains and losses to a closing total. A step
 * floats between the running total before and after it; the subtotal and the
 * totals stand on zero. The sign sits above each bar, and dashed connectors
 * carry the running total from one bar to the next.
 */
export const Default: Story = {
  args: { data: PROFIT_WALK, formatValue: k, yTitle: 'USD', ariaLabel: 'Profit walk, Q3' },
};

export const DefaultChecks: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await expectBarsAtTheirSpans(canvasElement, PROFIT_SPANS);
    await expectConnectorsJoinTheBars(canvasElement, PROFIT_RUNNING);
    await waitFor(() =>
      expect(valueLabels(canvasElement)).toEqual([
        '420k',
        '+310k',
        '+95k',
        '−42k',
        '783k',
        '−265k',
        '−88k',
        '−54k',
        '−61k',
        '315k',
      ])
    );
  },
};

/** A walk of steps alone starts from zero. */
export const OnlySteps: Story = {
  args: {
    data: [
      { label: 'Trial signups', value: 120 },
      { label: 'Upgrades', value: 80 },
      { label: 'Churn', value: -45 },
      { label: 'Downgrades', value: -20 },
    ],
    formatValue: k,
    ariaLabel: 'Net new accounts',
  },
};

export const OnlyStepsChecks: Story = {
  ...OnlySteps,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await expectBarsAtTheirSpans(canvasElement, [
      [0, 120],
      [120, 200],
      [155, 200],
      [135, 155],
    ]);
    await expectConnectorsJoinTheBars(canvasElement, [120, 200, 155, 135]);
    await waitFor(() =>
      expect(valueLabels(canvasElement)).toEqual(['+120k', '+80k', '−45k', '−20k'])
    );
  },
};

/** A walk can end below zero: the value axis reaches it, and the closing total hangs under the zero line. */
export const NegativeTotal: Story = {
  args: {
    data: [
      { label: 'Opening', value: 150, kind: 'total' },
      { label: 'Revenue', value: 90 },
      { label: 'Payroll', value: -210 },
      { label: 'Write-off', value: -130 },
      { label: 'Closing', kind: 'total' },
    ],
    formatValue: k,
    ariaLabel: 'Cash position',
  },
};

export const NegativeTotalChecks: Story = {
  ...NegativeTotal,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await expectBarsAtTheirSpans(canvasElement, [
      [0, 150],
      [150, 240],
      [30, 240],
      [-100, 30],
      [-100, 0],
    ]);
    await expectConnectorsJoinTheBars(canvasElement, [150, 240, 30, -100, -100]);
    await waitFor(() => {
      expect(tickTexts(canvasElement, 'yAxis').some((tick) => tick?.startsWith('-'))).toBe(true);
      expect(valueLabels(canvasElement).at(-1)).toBe('-100k');
    });
  },
};

const WEEKS = Array.from({ length: 24 }, (_, i): WaterfallDatum => {
  const step = [18, -7, 11, -14, 9, -5][i % 6];
  return { label: `Week ${i + 1}`, value: step };
});

/** Past twelve bars the labels go and the names tilt; the values stay in the tooltip and the keyboard walk. */
export const ManyBars: Story = {
  args: {
    data: [
      { label: 'Opening', value: 200, kind: 'total' },
      ...WEEKS,
      { label: 'Closing', kind: 'total' },
    ],
    ariaLabel: 'Weekly stock walk',
  },
};

export const ManyBarsChecks: Story = {
  ...ManyBars,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(bars(canvasElement)).toHaveLength(26));
    await expect(valueLabels(canvasElement)).toEqual([]);
    await expect(connectors(canvasElement)).toHaveLength(25);
    await waitFor(() => {
      const names = [...canvasElement.querySelectorAll('.recharts-xAxis-tick-labels text')];
      expect(names).toHaveLength(26);
      for (const name of names) expect(name.getAttribute('transform') ?? '').toContain('rotate');
    });
  },
};

/** `showConnectors={false}` leaves the bars alone. */
export const WithoutConnectors: Story = {
  args: { data: PROFIT_WALK, formatValue: k, showConnectors: false },
};

export const WithoutConnectorsChecks: Story = {
  ...WithoutConnectors,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await expectBarsAtTheirSpans(canvasElement, PROFIT_SPANS);
    await expect(connectors(canvasElement)).toHaveLength(0);
    await expect(canvasElement.querySelector('[data-waterfall-connectors]')).toBeNull();
  },
};

/** `colors` overrides the increases, the decreases and the totals (the subtotals follow the totals). */
export const CustomColors: Story = {
  args: {
    data: PROFIT_WALK,
    formatValue: k,
    colors: { positive: '#0ea5e9', negative: '#a855f7', total: '#334155' },
  },
};

export const CustomColorsChecks: Story = {
  ...CustomColors,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const [positive, negative, total] = ['#0ea5e9', '#a855f7', '#334155'].map(resolveColor);
    await waitFor(() =>
      expect(fills(canvasElement).map(resolveColor)).toEqual([
        total,
        positive,
        positive,
        negative,
        total,
        negative,
        negative,
        negative,
        negative,
        total,
      ])
    );
  },
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { data: [] },
};

export const EmptyChecks: Story = {
  ...Empty,
  tags: ['!dev', '!autodocs'],
  play: expectEmptyMessage('No data'),
};

/** `emptyMessage` says why there is nothing to draw. */
export const EmptyWithMessage: Story = {
  args: { data: [], emptyMessage: 'No movements this quarter' },
};

export const EmptyWithMessageChecks: Story = {
  ...EmptyWithMessage,
  tags: ['!dev', '!autodocs'],
  play: expectEmptyMessage('No movements this quarter'),
};

/** On a phone: no labels above the bars, and the names tilt so that each one stays. */
export const OnNarrowScreen: Story = {
  args: { data: PROFIT_WALK, formatValue: k, ariaLabel: 'Profit walk, Q3' },
  render: (args) => (
    <NarrowBox>
      <WaterfallChart {...args} />
    </NarrowBox>
  ),
};

export const OnNarrowScreenChecks: Story = {
  ...OnNarrowScreen,
  tags: ['!dev', '!autodocs'],
  play: async (context) => {
    await expectFitsNarrowBox(context);
    const { canvasElement } = context;
    await waitFor(() => {
      expect(bars(canvasElement)).toHaveLength(10);
      expect(valueLabels(canvasElement)).toEqual([]);
      const names = [...canvasElement.querySelectorAll('.recharts-xAxis-tick-labels text')];
      expect(names).toHaveLength(10);
      for (const name of names) expect(name.getAttribute('transform') ?? '').toContain('rotate');
    });
    // The values are still one hover away.
    await hoverBar(canvasElement, 5, 'Payroll');
    await expect(tooltipCard(canvasElement)).toHaveTextContent('−265k');
    await closeTooltip(canvasElement);
  },
};

/**
 * `children` takes Recharts elements drawn inside the chart: here a
 * `ReferenceLine` for a target, in the units of the values.
 */
export const TargetLineInChildren: Story = {
  args: {
    data: PROFIT_WALK,
    formatValue: k,
    children: (
      <ReferenceLine
        y={600}
        stroke="var(--color-status-warn)"
        strokeDasharray="6 4"
        label={{
          value: 'Target 600k',
          position: 'insideTopRight',
          fill: 'var(--color-text-muted)',
        }}
      />
    ),
  },
};

export const TargetLineInChildrenChecks: Story = {
  ...TargetLineInChildren,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const line = canvasElement.querySelector('.recharts-reference-line-line');
      expect(line).not.toBeNull();
      near(attr(line as Element, 'y1'), pixelOnAxis(canvasElement, 'yAxis', 600), 'target line');
      expect(canvasElement.textContent).toContain('Target 600k');
    });
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** A subtotal is the running total from zero, however many cuts came before it. */
export const SubtotalIsTheRunningTotalFromZero: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    data: [
      { label: 'Opening', value: 100, kind: 'total' },
      { label: 'A', value: 50 },
      { label: 'First cut', kind: 'subtotal' },
      { label: 'B', value: 25 },
      { label: 'Second cut', kind: 'subtotal' },
    ],
    formatValue: k,
  },
  play: async ({ canvasElement }) => {
    await expectBarsAtTheirSpans(canvasElement, [
      [0, 100],
      [100, 150],
      [0, 150],
      [150, 175],
      [0, 175],
    ]);
    // Both subtotals are drawn lighter than a total, in the total's color.
    const drawn = bars(canvasElement);
    await expect(drawn[2].getAttribute('fill-opacity')).toBe('0.55');
    await expect(drawn[0].getAttribute('fill-opacity')).toBe('1');
    await expect(fills(canvasElement)[2]).toBe(fills(canvasElement)[0]);
    await waitFor(() =>
      expect(valueLabels(canvasElement)).toEqual(['100k', '+50k', '150k', '+25k', '175k'])
    );
  },
};

/** A total with a value sets the running total, at the start or in the middle of the walk. */
export const TotalWithAValueSetsTheRunningTotal: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    data: [
      { label: 'Opening', value: 200, kind: 'total' },
      { label: 'Spend', value: -50 },
      { label: 'Known balance', value: 120, kind: 'total' },
      { label: 'Income', value: 30 },
      { label: 'Closing', kind: 'total' },
    ],
    formatValue: k,
  },
  play: async ({ canvasElement }) => {
    await expectBarsAtTheirSpans(canvasElement, [
      [0, 200],
      [150, 200],
      [0, 120],
      [120, 150],
      [0, 150],
    ]);
    await expectConnectorsJoinTheBars(canvasElement, [200, 150, 120, 150, 150]);
  },
};

/** Increases take the success color, decreases the error color, totals the accent. */
export const ColorsFollowTheKind: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: PROFIT_WALK },
  play: async ({ canvasElement }) => {
    // Opening (total), Sales (increase), Refunds (decrease).
    const drawn = () => [0, 1, 3].map((i) => fills(canvasElement)[i]);
    await waitFor(() => expect(bars(canvasElement)).toHaveLength(10));
    await expectColorsFromTokens(
      drawn,
      ['--color-brand-500', '--color-success-500', '--color-error-500'],
      '--color-success-500'
    );
  },
};

/**
 * The color is never alone: every bar carries its sign or its total in text,
 * and the tooltip names the kind in words.
 */
export const TooltipSaysTheSignAndTheKind: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: PROFIT_WALK, formatValue: k },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(bars(canvasElement)).toHaveLength(10));
    // A decrease: the label, the signed value, the kind and the running total after it.
    await hoverBar(canvasElement, 5, 'Payroll');
    const card = tooltipCard(canvasElement) as HTMLElement;
    await expect(card).toHaveAttribute('aria-live', 'polite');
    await expect(card).toHaveTextContent('Payroll');
    await expect(card).toHaveTextContent('−265k');
    await expect(card).toHaveTextContent('Decrease');
    await expect(card).toHaveTextContent('Running total');
    await expect(card).toHaveTextContent('518k');
    // An increase.
    await hoverBar(canvasElement, 1, 'Sales');
    await expect(tooltipCard(canvasElement)).toHaveTextContent('+310k');
    await expect(tooltipCard(canvasElement)).toHaveTextContent('Increase');
    await expect(tooltipCard(canvasElement)).toHaveTextContent('730k');
    // A total and a subtotal show the running total, with no step to add it to.
    await hoverBar(canvasElement, 9, 'Closing');
    await expect(tooltipCard(canvasElement)).toHaveTextContent('Total');
    await expect(tooltipCard(canvasElement)).toHaveTextContent('315k');
    await expect(tooltipCard(canvasElement)).not.toHaveTextContent('Running total');
    await hoverBar(canvasElement, 4, 'Gross profit');
    await expect(tooltipCard(canvasElement)).toHaveTextContent('Subtotal');
    await expect(tooltipCard(canvasElement)).toHaveTextContent('783k');
    await closeTooltip(canvasElement);
  },
};

/** `formatValue` gets the magnitude: the sign is written apart, with a real minus. */
export const FormatValueGetsTheMagnitude: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    data: [
      { label: 'Opening', value: 1000, kind: 'total' },
      { label: 'Fees', value: -250 },
    ],
    formatValue: (value) => `${value} €`,
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(valueLabels(canvasElement)).toEqual(['1000 €', '−250 €']));
    await waitFor(() => {
      const ticks = tickTexts(canvasElement, 'yAxis');
      expect(ticks.length).toBeGreaterThan(1);
      for (const tick of ticks) expect(tick).toMatch(/^-?\d+ €$/);
    });
  },
};

/** Tab reaches the chart once; the arrow keys walk the bars and announce each with its label, sign and kind. */
export const KeyboardWalksTheBars: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: PROFIT_WALK, formatValue: k, ariaLabel: 'Profit walk, Q3' },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(surface(canvasElement)).toHaveAttribute('aria-label', 'Profit walk, Q3')
    );
    await focusChart(canvasElement);
    const on = (...parts: string[]) =>
      waitFor(() => {
        for (const part of parts) expect(tooltipCard(canvasElement)).toHaveTextContent(part);
      });
    await on('Opening', 'Total', '420k');
    await userEvent.keyboard('{ArrowRight}');
    await on('Sales', '+310k', 'Increase', '730k');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    await on('Gross profit', 'Subtotal', '783k');
    await userEvent.keyboard('{ArrowRight}');
    await on('Payroll', '−265k', 'Decrease', '518k');
    await userEvent.keyboard('{ArrowLeft}');
    await on('Gross profit');
    await userEvent.tab();
    await closeTooltip(canvasElement);
  },
};

/** The labels need room: they go below 480px and past twelve bars, and `showLabels` forces either way. */
export const LabelsFollowTheRoom: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: PROFIT_WALK, formatValue: k },
  render: (args) => {
    const twelve = Array.from({ length: 12 }, (_, i): WaterfallDatum => ({
      label: `S${i}`,
      value: 5,
    }));
    return (
      <div className="flex flex-col gap-4">
        <div data-testid="wide" style={{ width: 640 }}>
          <WaterfallChart {...args} />
        </div>
        <div data-testid="narrow" style={{ width: 460 }}>
          <WaterfallChart {...args} />
        </div>
        <div data-testid="narrow-forced" style={{ width: 460 }}>
          <WaterfallChart {...args} showLabels />
        </div>
        <div data-testid="twelve" style={{ width: 800 }}>
          <WaterfallChart {...args} data={twelve} />
        </div>
        <div data-testid="thirteen" style={{ width: 800 }}>
          <WaterfallChart {...args} data={[...twelve, { label: 'S12', value: 5 }]} />
        </div>
        <div data-testid="thirteen-forced" style={{ width: 800 }}>
          <WaterfallChart {...args} data={[...twelve, { label: 'S12', value: 5 }]} showLabels />
        </div>
        <div data-testid="wide-off" style={{ width: 800 }}>
          <WaterfallChart {...args} showLabels={false} />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const at = (id: string) =>
      canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`) as HTMLElement;
    await waitFor(() => {
      expect(valueLabels(at('wide'))).toHaveLength(10);
      expect(bars(at('narrow'))).toHaveLength(10);
      expect(valueLabels(at('narrow'))).toEqual([]);
      expect(valueLabels(at('narrow-forced'))).toHaveLength(10);
      expect(valueLabels(at('twelve'))).toHaveLength(12);
      expect(bars(at('thirteen'))).toHaveLength(13);
      expect(valueLabels(at('thirteen'))).toEqual([]);
      expect(valueLabels(at('thirteen-forced'))).toHaveLength(13);
      expect(bars(at('wide-off'))).toHaveLength(10);
      expect(valueLabels(at('wide-off'))).toEqual([]);
    });
  },
};

/** The axis titles are plain text under and beside the plot. */
export const AxisTitles: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: PROFIT_WALK, formatValue: k, xTitle: 'Line item', yTitle: 'USD' },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(axisTitles(canvasElement)).toEqual({ x: ['Line item'], y: ['USD'] })
    );
  },
};

/**
 * A label, an axis title or a category with markup shows as written: the
 * tooltip is React text, and nothing is injected.
 */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    xTitle: HOSTILE,
    yTitle: HOSTILE,
    data: [
      { label: HOSTILE, value: 40, kind: 'total' },
      { label: 'Gain', value: 12 },
      { label: HOSTILE, value: -8 },
      { label: 'End', kind: 'total' },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(bars(canvasElement)).toHaveLength(4));
    await waitFor(() => expect(axisTitles(canvasElement)).toEqual({ x: [HOSTILE], y: [HOSTILE] }));
    await expectNoInjectedImage(canvasElement);
    await hoverBar(canvasElement, 2, 'onerror');
    const card = tooltipCard(canvasElement) as HTMLElement;
    await expect(card.querySelector('p')).toHaveTextContent(HOSTILE);
    await expectNoInjectedImage(canvasElement);
    await closeTooltip(canvasElement);
  },
};

/** The values above the bars and the tooltip follow the text size setting. */
export const TextFollowsTheTextSize: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: PROFIT_WALK, formatValue: k },
  play: async ({ canvasElement }) => {
    const html = document.documentElement;
    const previous = html.getAttribute('data-text-size');
    const px = (el: Element | null) => parseFloat(el ? getComputedStyle(el).fontSize : '');
    await waitFor(() => expect(fontSizes(canvasElement)).toEqual([12]));
    await hoverBar(canvasElement, 1, 'Sales');
    await expect(px(tooltipCard(canvasElement))).toBe(12);
    try {
      html.setAttribute('data-text-size', 'lg');
      await waitFor(() => expect(fontSizes(canvasElement)).toEqual([13.5]));
      await waitFor(() => expect(px(tooltipCard(canvasElement))).toBe(13.5));
      const tick = canvasElement.querySelector(
        '.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value'
      );
      await expect(px(tick)).toBe(13.5);
    } finally {
      if (previous === null) html.removeAttribute('data-text-size');
      else html.setAttribute('data-text-size', previous);
      await closeTooltip(canvasElement);
    }
  },
};

/** Colors are CSS variables: a theme or accent switch on `<html>` repaints the chart with no redraw. */
export const RepaintsWithTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { data: PROFIT_WALK },
  play: ({ canvasElement }) =>
    expectRepaintsWithThemeOf(canvasElement, () => fills(canvasElement)[0]),
};

/** Every text of the chart reads on the card in the four themes (axe checks the contrast of the values above the bars). */
export const TextReadsInTheFourThemes: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: PROFIT_WALK, formatValue: k },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(valueLabels(canvasElement)).toHaveLength(10));
    for (const label of canvasElement.querySelectorAll('.recharts-bar-rectangle text')) {
      await expect(resolveColor(getComputedStyle(label).fill)).toBe(
        themeColor('--color-text-primary')
      );
    }
  },
};
