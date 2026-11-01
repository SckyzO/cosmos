import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import type { Topology } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { BarChart } from './BarChart';
import { BoxPlotChart } from './BoxPlotChart';
import { BumpChart } from './BumpChart';
import { CalendarChart } from './CalendarChart';
import { DonutChart } from './DonutChart';
import { FunnelChart } from './FunnelChart';
import { GradientRadial } from './GradientRadial';
import { HeatmapChart } from './HeatmapChart';
import { LineAreaChart } from './LineAreaChart';
import { MixedChart } from './MixedChart';
import { RadarChart } from './RadarChart';
import { RadialBarChart } from './RadialBarChart';
import { RangeBarChart } from './RangeBarChart';
import { RealtimeChart } from './RealtimeChart';
import { BubbleChart, ScatterChart } from './ScatterChart';
import { SemiCircleGauge } from './SemiCircleGauge';
import { Sparkline } from './Sparkline';
import { StrokedGauge } from './StrokedGauge';
import { SunburstChart } from './SunburstChart';
import { TreemapChart } from './TreemapChart';
import { WaterfallChart } from './WaterfallChart';
import { WorldMap } from './WorldMap';
import { TRACK } from './core/colors';
import {
  animationConditions,
  computedColor,
  expectNoInjectedImage,
  HOSTILE,
  resolveColor,
  switchTheme,
  themeColor,
  tickTexts,
} from './storybook-recharts';
import type { ChartEmptyProps, ChartLoadingProps } from './types';

// What every wrapper takes in common, checked on all of them at once: a wrapper
// that forgets to pass a prop on to the frame drops it without a type error.

const CATEGORIES = ['A', 'B', 'C'];
const TWO_SERIES = [
  { name: 'a', data: [3, 5, 4] },
  { name: 'b', data: [4, 2, 5] },
];
const RANKS = [
  { name: 'a', data: ['A', 'B', 'C'].map((x, i) => ({ x, rank: [1, 2, 1][i] })) },
  { name: 'b', data: ['A', 'B', 'C'].map((x, i) => ({ x, rank: [2, 1, 2][i] })) },
];
const BOX = [
  [1, 2, 3, 4, 5],
  [2, 3, 4, 5, 6],
] as [number, number, number, number, number][];
const RANGE = [{ x: 'api', y: [1700000000000, 1700003600000] as [number, number] }];

// What a wrapper that can have no data, or still be waiting for it, takes besides its data.
type StateProps = ChartEmptyProps & ChartLoadingProps & { ariaLabel?: string };

type Chart = {
  /** What marks its plot in the DOM, when it is not a Recharts SVG. */
  plot?: string;
  /** Drawn with data; the wrappers that can be loading take `loading`. */
  filled: (props?: StateProps) => ReactNode;
  /** Drawn with no data, for the wrappers that can have none. */
  empty?: (props: StateProps) => ReactNode;
};

const CHARTS: Record<string, Chart> = {
  LineAreaChart: {
    filled: (props) => <LineAreaChart series={TWO_SERIES} categories={CATEGORIES} {...props} />,
    empty: (props) => <LineAreaChart series={[]} categories={[]} {...props} />,
  },
  BarChart: {
    filled: (props) => <BarChart series={TWO_SERIES} categories={CATEGORIES} {...props} />,
    empty: (props) => <BarChart series={[]} categories={[]} {...props} />,
  },
  DonutChart: {
    filled: (props) => <DonutChart series={[5, 3, 2]} labels={['a', 'b', 'c']} {...props} />,
    empty: (props) => <DonutChart series={[]} labels={[]} {...props} />,
  },
  RadialBarChart: {
    filled: (props) => <RadialBarChart series={[60, 40]} labels={['a', 'b']} {...props} />,
    empty: (props) => <RadialBarChart series={[]} labels={[]} {...props} />,
  },
  TreemapChart: {
    filled: (props) => (
      <TreemapChart
        series={[
          {
            data: [
              { x: 'a', y: 5 },
              { x: 'b', y: 3 },
            ],
          },
        ]}
        {...props}
      />
    ),
    empty: (props) => <TreemapChart series={[]} {...props} />,
  },
  SunburstChart: {
    plot: '[data-sunburst] svg',
    filled: () => (
      <SunburstChart
        data={[
          {
            name: 'a',
            children: [
              { name: 'a1', value: 3 },
              { name: 'a2', value: 2 },
            ],
          },
          { name: 'b', value: 4 },
        ]}
      />
    ),
    empty: (props) => <SunburstChart data={[]} {...props} />,
  },
  HeatmapChart: {
    plot: '[role="grid"]',
    filled: (props) => <HeatmapChart series={TWO_SERIES} categories={CATEGORIES} {...props} />,
    empty: (props) => <HeatmapChart series={[]} categories={[]} {...props} />,
  },
  CalendarChart: {
    plot: '[role="grid"]',
    filled: (props) => (
      <CalendarChart
        layout="range"
        data={[
          { day: '2026-03-02', value: 3 },
          { day: '2026-03-09', value: 5 },
        ]}
        {...props}
      />
    ),
    empty: (props) => <CalendarChart data={[]} {...props} />,
  },
  BumpChart: {
    filled: (props) => <BumpChart series={RANKS} {...props} />,
    empty: (props) => <BumpChart series={[]} {...props} />,
  },
  FunnelChart: {
    plot: '[role="list"]',
    filled: (props) => (
      <FunnelChart
        stages={[
          { label: 'a', value: 5 },
          { label: 'b', value: 3 },
        ]}
        {...props}
      />
    ),
    empty: (props) => <FunnelChart stages={[]} {...props} />,
  },
  WaterfallChart: {
    filled: (props) => (
      <WaterfallChart
        data={[
          { label: 'Opening', value: 10, kind: 'total' },
          { label: 'a', value: 5 },
          { label: 'Closing', kind: 'total' },
        ]}
        {...props}
      />
    ),
    empty: (props) => <WaterfallChart data={[]} {...props} />,
  },
  RadarChart: {
    filled: (props) => <RadarChart series={TWO_SERIES} categories={CATEGORIES} {...props} />,
    empty: (props) => <RadarChart series={[]} categories={[]} {...props} />,
  },
  ScatterChart: {
    filled: (props) => (
      <ScatterChart
        series={[
          {
            name: 'a',
            data: [
              { x: 1, y: 2 },
              { x: 2, y: 4 },
            ],
          },
        ]}
        {...props}
      />
    ),
    empty: (props) => <ScatterChart series={[]} {...props} />,
  },
  BubbleChart: {
    filled: (props) => (
      <BubbleChart
        series={[
          {
            name: 'a',
            data: [
              { x: 1, y: 2, z: 3 },
              { x: 2, y: 4, z: 5 },
            ],
          },
        ]}
        {...props}
      />
    ),
    empty: (props) => <BubbleChart series={[]} {...props} />,
  },
  BoxPlotChart: {
    filled: (props) => (
      <BoxPlotChart series={[{ name: 'a', data: BOX }]} categories={['A', 'B']} {...props} />
    ),
    empty: (props) => <BoxPlotChart series={[]} categories={[]} {...props} />,
  },
  RangeBarChart: {
    filled: (props) => <RangeBarChart series={[{ name: 'a', data: RANGE }]} {...props} />,
    empty: (props) => <RangeBarChart series={[]} {...props} />,
  },
  MixedChart: {
    filled: (props) => (
      <MixedChart
        series={[
          { name: 'a', type: 'column', data: [3, 5, 4] },
          { name: 'b', type: 'line', data: [4, 2, 5] },
        ]}
        categories={CATEGORIES}
        {...props}
      />
    ),
    empty: (props) => <MixedChart series={[]} categories={[]} {...props} />,
  },
  Sparkline: {
    filled: (props) => <Sparkline data={[1, 3, 2, 4]} {...props} />,
    empty: (props) => <Sparkline data={[]} {...props} />,
  },
  // Always have data: no empty state.
  GradientRadial: {
    filled: () => <GradientRadial value={84} />,
  },
  SemiCircleGauge: {
    filled: () => <SemiCircleGauge value={42} />,
  },
  StrokedGauge: {
    filled: () => <StrokedGauge value={92} />,
  },
  RealtimeChart: {
    filled: () => <RealtimeChart />,
  },
  // An empty `data` draws the bare map: no empty message.
  WorldMap: {
    filled: () => (
      <WorldMap data={{ FR: 5, DE: 3, US: 9 }} geography={world as unknown as Topology} />
    ),
  },
};

const EMPTY_NAMES = Object.keys(CHARTS).filter((name) => CHARTS[name].empty);

const Grid = ({ names, children }: { names: string[]; children: (name: string) => ReactNode }) => (
  <div className="grid gap-4 md:grid-cols-2">
    {names.map((name) => (
      <div key={name} data-chart={name}>
        {children(name)}
      </div>
    ))}
  </div>
);

const meta = {
  title: 'Charts/All charts',
  parameters: { layout: 'padded' },
  tags: ['!dev', '!autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const noData = (root: HTMLElement, name: string) =>
  root.querySelector(`[data-chart="${name}"] [data-chart-empty]`);

// A wrapper draws its plot with an SVG, or with a grid of its own.
const plot = (name: string) => CHARTS[name].plot ?? 'svg.recharts-surface';

const expectEveryNoData = (root: HTMLElement, text: string) =>
  waitFor(() =>
    expect(
      Object.fromEntries(EMPTY_NAMES.map((name) => [name, noData(root, name)?.textContent]))
    ).toEqual(Object.fromEntries(EMPTY_NAMES.map((name) => [name, text])))
  );

const emptyCharts = (props: ChartEmptyProps) => (
  <Grid names={EMPTY_NAMES}>{(name) => CHARTS[name].empty?.(props)}</Grid>
);

/** Without data, every chart draws the default message in place of the plot, and nothing around it. */
export const EmptyChartsShowTheDefaultMessage: Story = {
  render: () => emptyCharts({}),
  play: async ({ canvasElement }) => {
    await expectEveryNoData(canvasElement, 'No data');
    // Nothing around the message: no axis, grid line or legend, which are SVG.
    for (const name of EMPTY_NAMES) {
      await expect(canvasElement.querySelector(`[data-chart="${name}"] svg`), name).toBeNull();
    }
  },
};

/** `emptyMessage` replaces the default message, on every chart that can be empty. */
export const EmptyMessageReplacesTheDefault: Story = {
  render: () => emptyCharts({ emptyMessage: 'Nothing to show' }),
  play: ({ canvasElement }) => expectEveryNoData(canvasElement, 'Nothing to show'),
};

/** An empty `emptyMessage` draws nothing at all. */
export const EmptyStringDrawsNothing: Story = {
  render: () => emptyCharts({ emptyMessage: '' }),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(EMPTY_NAMES.filter((name) => noData(canvasElement, name) !== null)).toEqual(
        EMPTY_NAMES
      )
    );
    for (const name of EMPTY_NAMES) await expect(noData(canvasElement, name)).toBeEmptyDOMElement();
  },
};

/** The message is plain text: markup in it shows as written. */
export const HtmlInEmptyMessageRendersAsText: Story = {
  render: () => emptyCharts({ emptyMessage: HOSTILE }),
  play: async ({ canvasElement }) => {
    await expectEveryNoData(canvasElement, HOSTILE);
    await expectNoInjectedImage(canvasElement);
  },
};

/** The message uses the muted text color of the theme, and follows theme changes. */
export const EmptyMessageFollowsTheme: Story = {
  globals: { theme: 'dark' },
  render: () => emptyCharts({}),
  play: async ({ canvasElement }) => {
    for (const theme of ['dark', '', 'sand', 'deep-blue']) {
      const restore = switchTheme(theme);
      try {
        await waitFor(() => {
          const message = (name: string) => noData(canvasElement, name);
          const colors = EMPTY_NAMES.map((name) =>
            resolveColor(getComputedStyle(message(name) as Element).color)
          );
          expect(colors).toEqual(EMPTY_NAMES.map(() => themeColor('--color-text-muted')));
        });
      } finally {
        restore();
      }
    }
  },
};

/** A chart that goes from its data to the message and back when its series empty and fill again. */
const Toggle = ({ name }: { name: string }) => {
  const [filled, setFilled] = useState(true);
  return (
    <div data-chart={name}>
      <button type="button" onClick={() => setFilled((value) => !value)}>
        {name}
      </button>
      {filled ? CHARTS[name].filled() : CHARTS[name].empty?.({})}
    </div>
  );
};

export const ChartsGoFromDataToMessageAndBack: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      {EMPTY_NAMES.map((name) => (
        <Toggle key={name} name={name} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const showing = (name: string) => noData(canvasElement, name) !== null;
    const drawn = (name: string) =>
      canvasElement.querySelector(`[data-chart="${name}"] ${plot(name)}`) !== null;
    await waitFor(() => expect(EMPTY_NAMES.filter(drawn)).toEqual(EMPTY_NAMES));
    expect(EMPTY_NAMES.filter(showing)).toEqual([]);
    for (const name of EMPTY_NAMES) await userEvent.click(canvas.getByRole('button', { name }));
    await waitFor(() => expect(EMPTY_NAMES.filter(showing)).toEqual(EMPTY_NAMES));
    for (const name of EMPTY_NAMES) await userEvent.click(canvas.getByRole('button', { name }));
    await waitFor(() => expect(EMPTY_NAMES.filter(showing)).toEqual([]));
    await waitFor(() => expect(EMPTY_NAMES.filter(drawn)).toEqual(EMPTY_NAMES));
    // The axes hidden for the message come back with the data.
    for (const name of [
      'LineAreaChart',
      'BarChart',
      'MixedChart',
      'ScatterChart',
      'BoxPlotChart',
    ]) {
      await waitFor(() => {
        const chart = canvasElement.querySelector<HTMLElement>(`[data-chart="${name}"]`);
        expect(chart).not.toBeNull();
        expect(tickTexts(chart as HTMLElement, 'yAxis')).not.toEqual([]);
      });
    }
  },
};

// ── Loading ───────────────────────────────────────────────────────────────────

// The wrappers that can have no data are the ones that can still be waiting for it.
const LOADING_NAMES = EMPTY_NAMES;

const skeleton = (root: HTMLElement, name: string) =>
  root.querySelector<HTMLElement>(`[data-chart="${name}"] [data-chart-loading]`);

const loadingCharts = (props: StateProps = {}) => (
  <Grid names={LOADING_NAMES}>{(name) => CHARTS[name].filled({ loading: true, ...props })}</Grid>
);

/**
 * While `loading`, every chart draws a skeleton in place of its plot: a busy
 * group named by the chart's `ariaLabel` and the word "loading", and nothing
 * of the chart itself.
 */
export const LoadingChartsDrawASkeleton: Story = {
  render: () => loadingCharts({ ariaLabel: 'Probe' }),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(LOADING_NAMES.filter((name) => skeleton(canvasElement, name))).toEqual(LOADING_NAMES)
    );
    for (const name of LOADING_NAMES) {
      const block = skeleton(canvasElement, name) as HTMLElement;
      await expect(block, name).toHaveAttribute('aria-busy', 'true');
      await expect(block, name).toHaveAttribute('role', 'group');
      await expect(block, name).toHaveAccessibleName('Probe, loading');
      const { width, height } = block.getBoundingClientRect();
      await expect(width, name).toBeGreaterThan(100);
      await expect(height, name).toBeGreaterThan(40);
      // Nothing of the chart: no plot, no axis or legend (SVG or HTML), no message.
      const chart = canvasElement.querySelector(`[data-chart="${name}"]`) as HTMLElement;
      await expect(chart.querySelector(plot(name)), name).toBeNull();
      await expect(chart.querySelector('svg'), name).toBeNull();
      await expect(chart.querySelector('[data-chart-empty]'), name).toBeNull();
      await expect(chart.querySelectorAll('[aria-busy]'), name).toHaveLength(1);
    }
  },
};

/** A chart that is loading has no data yet: the skeleton wins over the empty message. */
export const LoadingWinsOverNoData: Story = {
  render: () => (
    <Grid names={LOADING_NAMES}>
      {(name) => CHARTS[name].empty?.({ loading: true, emptyMessage: 'Nothing to show' })}
    </Grid>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(LOADING_NAMES.filter((name) => skeleton(canvasElement, name))).toEqual(LOADING_NAMES)
    );
    for (const name of LOADING_NAMES) await expect(noData(canvasElement, name), name).toBeNull();
  },
};

/** Not loading, no chart draws a skeleton: `loading` is off by default and `false` is off. */
export const NoSkeletonUnlessLoading: Story = {
  render: () => (
    <Grid names={LOADING_NAMES}>{(name) => CHARTS[name].filled({ loading: false })}</Grid>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        LOADING_NAMES.filter((name) =>
          canvasElement.querySelector(`[data-chart="${name}"] ${plot(name)}`)
        )
      ).toEqual(LOADING_NAMES)
    );
    await expect(canvasElement.querySelector('[data-chart-loading]')).toBeNull();
    await expect(canvasElement.querySelector('[aria-busy="true"]')).toBeNull();
  },
};

/** A chart that goes from loading to its data and back as `loading` flips: its hooks run the same either way. */
const LoadingToggle = ({ name }: { name: string }) => {
  const [loading, setLoading] = useState(true);
  return (
    <div data-chart={name}>
      <button type="button" onClick={() => setLoading((value) => !value)}>
        {name}
      </button>
      {CHARTS[name].filled({ loading })}
    </div>
  );
};

export const ChartsGoFromLoadingToDataAndBack: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      {LOADING_NAMES.map((name) => (
        <LoadingToggle key={name} name={name} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const loading = (name: string) => skeleton(canvasElement, name) !== null;
    const drawn = (name: string) =>
      canvasElement.querySelector(`[data-chart="${name}"] ${plot(name)}`) !== null;
    await waitFor(() => expect(LOADING_NAMES.filter(loading)).toEqual(LOADING_NAMES));
    for (const name of LOADING_NAMES) await userEvent.click(canvas.getByRole('button', { name }));
    await waitFor(() => expect(LOADING_NAMES.filter(drawn)).toEqual(LOADING_NAMES));
    expect(LOADING_NAMES.filter(loading)).toEqual([]);
    await expect(canvasElement.querySelector('[aria-busy="true"]')).toBeNull();
    for (const name of LOADING_NAMES) await userEvent.click(canvas.getByRole('button', { name }));
    await waitFor(() => expect(LOADING_NAMES.filter(loading)).toEqual(LOADING_NAMES));
    await waitFor(() => expect(LOADING_NAMES.filter(drawn)).toEqual([]));
  },
};

/** The skeleton is the theme's track gray, and follows theme changes. */
export const LoadingSkeletonFollowsTheTheme: Story = {
  globals: { theme: 'dark' },
  render: () => loadingCharts(),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(LOADING_NAMES.filter((name) => skeleton(canvasElement, name))).toEqual(LOADING_NAMES)
    );
    for (const theme of ['dark', '', 'sand', 'deep-blue']) {
      const restore = switchTheme(theme);
      try {
        const expected = computedColor(TRACK);
        const colors = LOADING_NAMES.map(
          (name) => getComputedStyle(skeleton(canvasElement, name) as Element).backgroundColor
        );
        await expect(colors, theme || 'light').toEqual(LOADING_NAMES.map(() => expected));
      } finally {
        restore();
      }
    }
  },
};

/**
 * The skeleton pulses, and only where motion is welcome: the rule that animates
 * it sits under `prefers-reduced-motion: no-preference`, so a reader who asked
 * for less motion gets a still block.
 */
export const LoadingPulsesOnlyWhereMotionIsAllowed: Story = {
  // Keeps the animation: the story tests would otherwise set its duration to 0.
  parameters: { settleMotion: false },
  render: () => loadingCharts(),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(LOADING_NAMES.filter((name) => skeleton(canvasElement, name))).toEqual(LOADING_NAMES)
    );
    for (const name of LOADING_NAMES) {
      const block = skeleton(canvasElement, name) as HTMLElement;
      const conditions = animationConditions(block);
      await expect(conditions.length, `${name}: a rule animates it`).toBeGreaterThan(0);
      for (const around of conditions) {
        await expect(around.join(' and '), name).toContain('prefers-reduced-motion: no-preference');
      }
      // With no preference set, it does run.
      await expect(block.getAnimations(), name).toHaveLength(1);
    }
  },
};
