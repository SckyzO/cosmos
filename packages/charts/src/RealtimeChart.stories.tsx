import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { ReferenceArea } from 'recharts';
import { RealtimeChart, type RealtimeChartProps } from './RealtimeChart';
import {
  axisTitles,
  closeTooltip,
  contrastRatio,
  expectAccessibleChart,
  expectColorsFromTokens,
  expectNoInjectedImage,
  expectRepaintsWithThemeOf,
  HOSTILE,
  openTooltip,
  resolveColor,
  seriesStrokes,
  surface,
  themeColor,
  tickTexts,
  tooltipCard,
} from './storybook-recharts';

// Recorded traces, replayed in a loop: the wrapper's default generator is
// random, which would make every render different.
const CPU = [
  48, 52, 55, 51, 58, 62, 60, 66, 71, 68, 64, 59, 61, 57, 53, 50, 54, 49, 46, 51, 55, 60, 63, 58,
  54, 52, 56, 53, 49, 47,
];
const DISK = [
  76, 77, 77, 78, 79, 79, 80, 81, 81, 82, 83, 84, 84, 85, 86, 87, 88, 89, 90, 91, 91, 92, 88, 84,
  81, 79, 78, 78, 77, 76,
];
const QUEUE = [22, 31, 45, 38, 52, 67, 74, 88, 81, 63, 49, 36, 28, 25, 33, 41];
const pct = (v: number) => `${v}%`;

/** RealtimeChart fed from `trace`, from the start on every mount. */
const Replay = ({ trace, ...props }: RealtimeChartProps & { trace: number[] }) => {
  // The generator must be stable: RealtimeChart restarts its interval when it changes.
  const [generator] = useState(() => {
    let i = 0;
    return () => trace[i++ % trace.length];
  });
  return <RealtimeChart {...props} generator={generator} />;
};

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Realtime',
  component: RealtimeChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof RealtimeChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * A new sample every 2 s scrolls a 30-point window on a 0–100 axis, with the
 * WARN (70) and CRIT (85) thresholds.
 */
export const Basic: Story = {
  render: (args) => <Replay {...args} trace={CPU} />,
};

/** `warnThreshold` and `critThreshold` move the annotation lines. */
export const CustomThresholds: Story = {
  args: { warnThreshold: 80, critThreshold: 90 },
  render: (args) => <Replay {...args} trace={DISK} />,
};

/** `intervalMs` and `windowSize` set the pace and how much history stays on screen. */
export const FastShortWindow: Story = {
  args: { intervalMs: 1000, windowSize: 12 },
  render: (args) => <Replay {...args} trace={QUEUE} />,
};

/** `height` fits the chart in a dashboard tile. */
export const CompactHeight: Story = {
  args: { height: 140 },
  render: (args) => <Replay {...args} trace={CPU} />,
};

/** `formatValue` formats the y-axis labels and the tooltip values. */
export const FormattedValues: Story = {
  args: { formatValue: pct },
  render: (args) => <Replay {...args} trace={CPU} />,
};

/** `min` and `max` set the y axis (default 0–100): a temperature, a latency, a count. */
export const CustomRange: Story = {
  args: {
    min: 20,
    max: 120,
    warnThreshold: 90,
    critThreshold: 105,
    formatValue: (v) => `${v} °C`,
  },
  render: (args) => <Replay {...args} trace={DISK} />,
};

/** `showTimeAxis` labels the x axis, and the tooltip, with the time of each sample. */
export const TimeAxis: Story = {
  args: { showTimeAxis: true },
  render: (args) => <Replay {...args} trace={CPU} />,
};

/** `warnLabel` and `critLabel` rename the threshold labels; an empty string draws the line alone. */
export const ThresholdLabels: Story = {
  render: (args) => (
    <div className="grid gap-4 md:grid-cols-2">
      <Replay {...args} trace={DISK} warnLabel="Avertissement" critLabel="Critique" />
      <Replay {...args} trace={DISK} warnLabel="" critLabel="Limit" />
    </div>
  ),
};

// The threshold labels are `.recharts-label` texts too, and sit among the x titles.
const withoutThresholds = ({ x, y }: { x: (string | null)[]; y: (string | null)[] }) => ({
  x: x.filter((text) => text !== 'WARN' && text !== 'CRIT'),
  y,
});

/** `yTitle` names the y axis, and `xTitle` the time axis. */
export const AxisTitles: Story = {
  args: { showTimeAxis: true, xTitle: 'Time', yTitle: 'CPU usage (%)' },
  render: (args) => <Replay {...args} trace={CPU} />,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(withoutThresholds(axisTitles(canvasElement))).toEqual({
        x: ['Time'],
        y: ['CPU usage (%)'],
      })
    );
  },
};

/**
 * `children` takes Recharts elements, drawn inside the chart: here a
 * `ReferenceArea` shading the band above the critical threshold.
 */
export const ReferenceAreaInChildren: Story = {
  args: {
    children: (
      <ReferenceArea
        y1={85}
        y2={100}
        fill="var(--color-status-crit)"
        fillOpacity={0.1}
        stroke="none"
      />
    ),
  },
  render: (args) => <Replay {...args} trace={CPU} />,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelector('.recharts-reference-area')).not.toBeNull()
    );
  },
};

const thresholdLines = (root: HTMLElement) =>
  root.querySelectorAll('.recharts-reference-line line').length;

/**
 * Samples that arrive while the chart is still being drawn must not drop the
 * threshold lines.
 */
export const ThresholdsSurviveEarlyUpdates: Story = {
  tags: ['!dev'],
  args: { intervalMs: 50 },
  render: (args) => <Replay {...args} trace={CPU} />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.recharts-line-curve')).not.toBeNull());
    // Let the updates settle.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await waitFor(() => expect(thresholdLines(canvasElement)).toBe(2), { timeout: 2000 });
  },
};

/** `formatValue` formats the y-axis labels and the tooltip value. */
export const FormatValueFormatsLabels: Story = {
  tags: ['!dev', '!autodocs'],
  // No new sample during the test.
  args: { formatValue: pct, intervalMs: 60_000 },
  render: (args) => <Replay {...args} trace={CPU} />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(tickTexts(canvasElement, 'yAxis').length).toBeGreaterThan(1));
    for (const label of tickTexts(canvasElement, 'yAxis')) expect(label).toMatch(/^\d+%$/);
    await openTooltip(canvasElement, 0.05);
    await expect(tooltipCard(canvasElement)).toHaveTextContent(/^value\d+%$/);
    await closeTooltip(canvasElement);
  },
};

const thresholdLabel = (root: HTMLElement, text: string) =>
  [...root.querySelectorAll('.recharts-label')].find((el) => el.textContent === text);

/** The WARN and CRIT labels read on the card, in the theme's text color. */
export const ThresholdLabelsReadOnTheCard: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => <Replay {...args} trace={CPU} />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(thresholdLabel(canvasElement, 'CRIT')).toBeDefined());
    for (const text of ['WARN', 'CRIT']) {
      const fill = resolveColor(getComputedStyle(thresholdLabel(canvasElement, text)!).fill);
      expect(fill, text).toBe(themeColor('--color-text-primary'));
      expect(contrastRatio(fill, themeColor('--color-bg-panel')), text).toBeGreaterThanOrEqual(4.5);
    }
  },
};

/** The WARN and CRIT lines take the theme's monitoring status colors. */
export const ThresholdColorsFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => <Replay {...args} trace={CPU} />,
  play: async ({ canvasElement }) => {
    await expectColorsFromTokens(
      () =>
        [...canvasElement.querySelectorAll('.recharts-reference-line line')].map(
          (el) => getComputedStyle(el).stroke
        ),
      ['--color-status-warn', '--color-status-crit'],
      '--color-status-warn'
    );
  },
};

/** The y axis spans `min` to `max`, and the thresholds sit on it. */
export const RangeSetsTheYAxis: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...CustomRange.args, intervalMs: 60_000 },
  render: (args) => <Replay {...args} trace={DISK} />,
  play: async ({ canvasElement }) => {
    const yLabels = () =>
      tickTexts(canvasElement, 'yAxis').map((text) => Number.parseFloat(text ?? ''));
    await waitFor(() => {
      expect(yLabels().length).toBeGreaterThan(1);
      expect(Math.min(...yLabels())).toBe(20);
      expect(Math.max(...yLabels())).toBe(120);
      expect(thresholdLines(canvasElement)).toBe(2);
    });
  },
};

const CLOCK_TIME = /^\d\d:\d\d:\d\d$/;

/** The x axis is hidden by default; `showTimeAxis` labels it, and the tooltip title, with the clock. */
export const TimeAxisIsOptIn: Story = {
  tags: ['!dev', '!autodocs'],
  args: { intervalMs: 60_000 },
  render: (args) => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="plain">
        <Replay {...args} trace={CPU} />
      </div>
      <div data-testid="timed">
        <Replay {...args} trace={CPU} showTimeAxis />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const chart = (id: string) =>
      canvasElement.querySelector(`[data-testid="${id}"]`) as HTMLElement;
    await waitFor(() => expect(tickTexts(chart('timed'), 'xAxis').length).toBeGreaterThan(1));
    for (const label of tickTexts(chart('timed'), 'xAxis')) expect(label).toMatch(CLOCK_TIME);
    await expect(tickTexts(chart('plain'), 'xAxis')).toEqual([]);
    await openTooltip(chart('timed'), 0.5);
    await expect(tooltipCard(chart('timed'))?.querySelector('p')).toHaveTextContent(CLOCK_TIME);
    await closeTooltip(chart('timed'));
    // Without the axis the tooltip has no title.
    await openTooltip(chart('plain'), 0.5);
    await expect(tooltipCard(chart('plain'))?.querySelector('p')).toBeNull();
    await closeTooltip(chart('plain'));
  },
};

/** The threshold labels take the text given, and a threshold with an empty one has a line only. */
export const ThresholdLabelProps: Story = {
  tags: ['!dev', '!autodocs'],
  render: ThresholdLabels.render,
  play: async ({ canvasElement }) => {
    const labels = (side: number) =>
      [...canvasElement.querySelectorAll(`.grid > :nth-child(${side}) .recharts-label`)]
        .map((el) => el.textContent)
        .filter(Boolean);
    await waitFor(() => expect(labels(1)).toEqual(['Avertissement', 'Critique']));
    await waitFor(() => expect(labels(2)).toEqual(['Limit']));
    // Both lines are still drawn.
    await expect(
      canvasElement.querySelectorAll('.grid > :nth-child(2) .recharts-reference-line line')
    ).toHaveLength(2);
  },
};

// The line is a smooth path: one `C` command per segment, so one more point
// than segments.
const pointCount = (root: HTMLElement) => {
  const d = root.querySelector('.recharts-line-curve')?.getAttribute('d') ?? '';
  return d ? (d.match(/C/g) ?? []).length + 1 : 0;
};

// y of the line's first point.
const firstPointY = (root: HTMLElement) =>
  Number(
    /^M\s*[\d.]+[\s,]+([\d.]+)/.exec(
      root.querySelector('.recharts-line-curve')?.getAttribute('d') ?? ''
    )?.[1]
  );

/**
 * A sample moves the window under the line without animating it: the path is
 * already the one of the new window a moment after the tick, and stays put.
 */
export const TicksDoNotAnimate: Story = {
  tags: ['!dev', '!autodocs'],
  args: { intervalMs: 1500 },
  render: (args) => <Replay {...args} trace={CPU} />,
  play: async ({ canvasElement }) => {
    const path = () => canvasElement.querySelector('.recharts-line-curve')?.getAttribute('d');
    await waitFor(() => expect(path()).toBeTruthy());
    const before = path();
    await waitFor(() => expect(path()).not.toBe(before), { timeout: 3000 });
    const after = path();
    await new Promise((resolve) => setTimeout(resolve, 200));
    await expect(path()).toBe(after);
  },
};

/**
 * Two charts on the default generator both start their walk at 50: the walk
 * used to be module state, so the second chart continued the first one's.
 */
export const DefaultGeneratorIsPerInstance: Story = {
  tags: ['!dev', '!autodocs'],
  // Every step of the walk goes up: a second chart that continued the first
  // one's walk would start at the 95 ceiling.
  beforeEach: () => {
    const random = Math.random;
    Math.random = () => 1;
    return () => {
      Math.random = random;
    };
  },
  render: () => (
    <>
      <div data-chart="a">
        <RealtimeChart />
      </div>
      <div data-chart="b">
        <RealtimeChart />
      </div>
    </>
  ),
  play: async ({ canvasElement }) => {
    const chart = (id: string) => canvasElement.querySelector<HTMLElement>(`[data-chart="${id}"]`)!;
    await waitFor(() => expect(pointCount(chart('b'))).toBe(30));
    expect(firstPointY(chart('b'))).toBeCloseTo(firstPointY(chart('a')), 1);
  },
};

/** `windowSize` is read after the first render too: the window shrinks and grows with it. */
export const WindowSizeChanges: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => {
    const [windowSize, setWindowSize] = useState(12);
    return (
      <>
        <button onClick={() => setWindowSize(6)}>Shorter</button>
        <button onClick={() => setWindowSize(18)}>Longer</button>
        <Replay {...args} trace={CPU} windowSize={windowSize} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(pointCount(canvasElement)).toBe(12));
    await userEvent.click(canvas.getByRole('button', { name: 'Shorter' }));
    await waitFor(() => expect(pointCount(canvasElement)).toBe(6));
    await userEvent.click(canvas.getByRole('button', { name: 'Longer' }));
    await waitFor(() => expect(pointCount(canvasElement)).toBe(18));
  },
};

/** A theme or accent switch on `<html>` repaints the chart with no observer and no redraw. */
export const RepaintsWithTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { showTimeAxis: true, intervalMs: 60_000 },
  render: (args) => <Replay {...args} trace={CPU} />,
  play: ({ canvasElement }) =>
    expectRepaintsWithThemeOf(canvasElement, () => seriesStrokes(canvasElement)[0]),
};

/** The labels and the axis titles are SVG text: markup in them shows as written. */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!autodocs'],
  args: {
    showTimeAxis: true,
    xTitle: HOSTILE,
    yTitle: HOSTILE,
    warnLabel: HOSTILE,
    critLabel: '',
    intervalMs: 60_000,
  },
  render: (args) => <Replay {...args} trace={CPU} />,
  play: async ({ canvasElement }) => {
    // The x title, and the threshold label that sits among the same texts.
    await waitFor(() =>
      expect(axisTitles(canvasElement)).toEqual({ x: [HOSTILE, HOSTILE], y: [HOSTILE] })
    );
    await waitFor(() => expect(thresholdLabel(canvasElement, HOSTILE)).toBeDefined());
    await expectNoInjectedImage(canvasElement);
  },
};

/** A chart wider than its box is cut to it, so a narrow screen never scrolls sideways. */
export const NoHorizontalOverflow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { width: 900 },
  render: (args) => (
    <div data-testid="box" style={{ width: 375, maxWidth: '100%' }}>
      <Replay {...args} trace={CPU} />
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
  args: { ariaLabel: 'Live CPU usage' },
  render: (args) => <Replay {...args} trace={CPU} />,
  play: expectAccessibleChart({ keyboard: true }),
};

// The lowest value of the y axis is drawn on the bottom edge of the plot: with no time axis under
// it, the chart keeps room for its label, which is not cut by the edge of the chart.
export const LowestLabelStaysInTheChart: Story = {
  tags: ['!dev', '!autodocs'],
  args: { min: 20, max: 120, formatValue: (v) => `${v} °C` },
  render: (args) => <Replay {...args} trace={DISK} />,
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg.recharts-surface')!.getBoundingClientRect();
    const labels = await waitFor(() => {
      const found = [
        ...canvasElement.querySelectorAll(
          '.recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value'
        ),
      ];
      expect(found.length).toBeGreaterThan(1);
      return found;
    });
    for (const label of labels) {
      const box = label.getBoundingClientRect();
      await expect(box.bottom, label.textContent ?? '').toBeLessThanOrEqual(svg.bottom);
    }
  },
};
