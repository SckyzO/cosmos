import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { RealtimeChart, type RealtimeChartProps } from './RealtimeChart';
import {
  closeTooltip,
  contrastRatio,
  expectColorsFromTokens,
  expectTooltipFollowsTheme,
  hover,
  Rerender,
  expectNoRedrawOnRerender,
  freshCopy,
  expectAccessibleChart,
  expectAxisTitlesIn,
} from './storybook-helpers';

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

/** `yTitle` names the y axis, and `xTitle` the time axis. */
export const AxisTitles: Story = {
  args: { showTimeAxis: true, xTitle: 'Time', yTitle: 'CPU usage (%)' },
  render: (args) => <Replay {...args} trace={CPU} />,
  play: ({ canvasElement }) =>
    expectAxisTitlesIn(canvasElement, { x: 'Time', y: ['CPU usage (%)'] }),
};

// ApexCharts hides an annotation group with this class until its first
// animation ends.
const visibleThresholdLines = (root: HTMLElement) =>
  [...root.querySelectorAll('.apexcharts-yaxis-annotations')]
    .filter((group) => !group.closest('.apexcharts-element-hidden'))
    .flatMap((group) => [...group.querySelectorAll('line')]).length;

/**
 * Samples that arrive while ApexCharts still runs its first render must not
 * drop the threshold lines.
 */
export const ThresholdsSurviveEarlyUpdates: Story = {
  tags: ['!dev'],
  args: { intervalMs: 50 },
  render: (args) => <Replay {...args} trace={CPU} />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.apexcharts-line')).not.toBeNull());
    // Let the first animation (and the updates racing it) settle.
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await waitFor(() => expect(visibleThresholdLines(canvasElement)).toBe(2), { timeout: 2000 });
  },
};

/** The tooltip follows the Cosmos theme: dark in the dark themes, light in the others. */
export const TooltipFollowsTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  render: (args) => <Replay {...args} trace={CPU} />,
  play: async ({ canvasElement }) => {
    await expectTooltipFollowsTheme(canvasElement, () =>
      canvasElement.querySelector('.apexcharts-grid')
    );
  },
};

/** `formatValue` formats the y-axis labels and the tooltip value. */
export const FormatValueFormatsLabels: Story = {
  tags: ['!dev', '!autodocs'],
  // No new sample during the test: the first point stays CPU[0].
  args: { formatValue: pct, intervalMs: 60_000 },
  render: (args) => <Replay {...args} trace={CPU} />,
  play: async ({ canvasElement }) => {
    const yLabels = () =>
      [...canvasElement.querySelectorAll('.apexcharts-yaxis-label')].map((el) => el.textContent);
    await waitFor(() => expect(yLabels().length).toBeGreaterThan(1));
    for (const label of yLabels()) expect(label).toMatch(/^\d+%$/);

    await waitFor(() => {
      hover(canvasElement.querySelector('.apexcharts-grid') as Element, 0.01);
      expect(canvasElement.querySelector('.apexcharts-tooltip-text-y-value')?.textContent).toBe(
        pct(CPU[0])
      );
    });
  },
};

// The WARN and CRIT labels: the text, and the rectangle drawn behind it.
const thresholdLabel = (root: HTMLElement, text: string) =>
  [...root.querySelectorAll('.apexcharts-yaxis-annotation-label')].find(
    (el) => el.textContent === text
  );
const labelFill = (root: HTMLElement, text: string) =>
  thresholdLabel(root, text)?.getAttribute('fill');
const labelBackground = (root: HTMLElement, text: string) =>
  thresholdLabel(root, text)?.previousElementSibling?.getAttribute('fill');

/** The WARN and CRIT labels read on their amber and red backgrounds. */
export const ThresholdLabelsReadOnTheirColor: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => <Replay {...args} trace={CPU} />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(labelBackground(canvasElement, 'CRIT')).toBeTruthy());
    for (const text of ['WARN', 'CRIT']) {
      expect(
        contrastRatio(labelFill(canvasElement, text)!, labelBackground(canvasElement, text)!),
        text
      ).toBeGreaterThanOrEqual(4.5);
    }
  },
};

/** The WARN and CRIT lines and labels take the theme's monitoring status colors. */
export const ThresholdColorsFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => <Replay {...args} trace={CPU} />,
  play: async ({ canvasElement }) => {
    const tokens = ['--color-status-warn', '--color-status-crit'];
    await expectColorsFromTokens(
      () =>
        [...canvasElement.querySelectorAll('.apexcharts-yaxis-annotations line')].map((el) =>
          el.getAttribute('stroke')
        ),
      tokens,
      '--color-status-warn'
    );
    await expectColorsFromTokens(
      () => [labelBackground(canvasElement, 'WARN'), labelBackground(canvasElement, 'CRIT')],
      tokens,
      '--color-status-crit'
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
      [...canvasElement.querySelectorAll('.apexcharts-yaxis-label')].map((el) =>
        Number.parseFloat(el.textContent ?? '')
      );
    await waitFor(() => {
      expect(yLabels().length).toBeGreaterThan(1);
      expect(Math.min(...yLabels())).toBe(20);
      expect(Math.max(...yLabels())).toBe(120);
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
    const xLabels = (id: string) =>
      [...canvasElement.querySelectorAll(`[data-testid="${id}"] .apexcharts-xaxis-label`)]
        .map((el) => el.textContent)
        .filter(Boolean);
    await waitFor(() => expect(xLabels('timed').length).toBeGreaterThan(1));
    for (const label of xLabels('timed')) expect(label).toMatch(CLOCK_TIME);
    await expect(xLabels('plain')).toEqual([]);
    await waitFor(() => {
      hover(canvasElement.querySelector('[data-testid="timed"] .apexcharts-grid') as Element, 0.5);
      expect(
        canvasElement.querySelector('[data-testid="timed"] .apexcharts-tooltip-title')?.textContent
      ).toMatch(CLOCK_TIME);
    });
    await closeTooltip(canvasElement, () =>
      canvasElement.querySelector('[data-testid="timed"] .apexcharts-grid')
    );
  },
};

/** The threshold labels take the text given, and a threshold with an empty one has a line only. */
export const ThresholdLabelProps: Story = {
  tags: ['!dev', '!autodocs'],
  render: ThresholdLabels.render,
  play: async ({ canvasElement }) => {
    const labels = (side: number) =>
      [
        ...canvasElement.querySelectorAll(
          `.grid > :nth-child(${side}) .apexcharts-yaxis-annotation-label`
        ),
      ]
        .map((el) => el.textContent)
        // ApexCharts keeps an empty label element where there is no text.
        .filter(Boolean);
    await waitFor(() => expect(labels(1)).toEqual(['Avertissement', 'Critique']));
    await waitFor(() => expect(labels(2)).toEqual(['Limit']));
    // Both lines are still drawn.
    await expect(
      canvasElement.querySelectorAll('.grid > :nth-child(2) .apexcharts-yaxis-annotations line')
    ).toHaveLength(2);
  },
};

// The line is a smooth path: one `C` command per segment, so one more point
// than segments.
const pointCount = (root: HTMLElement) => {
  const d = root.querySelector('.apexcharts-line')?.getAttribute('d') ?? '';
  return d ? (d.match(/C/g) ?? []).length + 1 : 0;
};

// y of the line's first point.
const firstPointY = (root: HTMLElement) =>
  Number(
    /^M\s*[\d.]+[\s,]+([\d.]+)/.exec(
      root.querySelector('.apexcharts-line')?.getAttribute('d') ?? ''
    )?.[1]
  );

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

/**
 * A parent render with equal props leaves the chart as drawn; a new height
 * still redraws it.
 */
export const RerenderWithEqualPropsDoesNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Basic.args, intervalMs: 60_000, formatValue: pct },
  render: (args) => (
    <Rerender>
      {(grown) => <RealtimeChart {...freshCopy(args)} height={grown ? 400 : 320} />}
    </Rerender>
  ),
  play: expectNoRedrawOnRerender,
};

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its points. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ariaLabel: 'Live CPU usage' },
  render: (args) => <Replay {...args} trace={CPU} />,
  play: expectAccessibleChart({ keyboard: true }),
};
