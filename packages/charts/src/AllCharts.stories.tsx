import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
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
import { TreemapChart } from './TreemapChart';
import {
  expectNoInjectedImage,
  HOSTILE,
  resolveColor,
  switchTheme,
  themeColor,
  tickTexts,
} from './storybook-recharts';
import type { ChartEmptyProps } from './types';

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

type Chart = {
  /** What marks its plot in the DOM, when it is not a Recharts SVG. */
  plot?: string;
  /** Drawn with data. */
  filled: () => ReactNode;
  /** Drawn with no data, for the wrappers that can have none. */
  empty?: (props: ChartEmptyProps) => ReactNode;
};

const CHARTS: Record<string, Chart> = {
  LineAreaChart: {
    filled: () => <LineAreaChart series={TWO_SERIES} categories={CATEGORIES} />,
    empty: (props) => <LineAreaChart series={[]} categories={[]} {...props} />,
  },
  BarChart: {
    filled: () => <BarChart series={TWO_SERIES} categories={CATEGORIES} />,
    empty: (props) => <BarChart series={[]} categories={[]} {...props} />,
  },
  DonutChart: {
    filled: () => <DonutChart series={[5, 3, 2]} labels={['a', 'b', 'c']} />,
    empty: (props) => <DonutChart series={[]} labels={[]} {...props} />,
  },
  RadialBarChart: {
    filled: () => <RadialBarChart series={[60, 40]} labels={['a', 'b']} />,
    empty: (props) => <RadialBarChart series={[]} labels={[]} {...props} />,
  },
  TreemapChart: {
    filled: () => (
      <TreemapChart
        series={[
          {
            data: [
              { x: 'a', y: 5 },
              { x: 'b', y: 3 },
            ],
          },
        ]}
      />
    ),
    empty: (props) => <TreemapChart series={[]} {...props} />,
  },
  HeatmapChart: {
    plot: '[role="grid"]',
    filled: () => <HeatmapChart series={TWO_SERIES} categories={CATEGORIES} />,
    empty: (props) => <HeatmapChart series={[]} categories={[]} {...props} />,
  },
  CalendarChart: {
    plot: '[role="grid"]',
    filled: () => (
      <CalendarChart
        layout="range"
        data={[
          { day: '2026-03-02', value: 3 },
          { day: '2026-03-09', value: 5 },
        ]}
      />
    ),
    empty: (props) => <CalendarChart data={[]} {...props} />,
  },
  BumpChart: {
    filled: () => <BumpChart series={RANKS} />,
    empty: (props) => <BumpChart series={[]} {...props} />,
  },
  FunnelChart: {
    plot: '[role="list"]',
    filled: () => (
      <FunnelChart
        stages={[
          { label: 'a', value: 5 },
          { label: 'b', value: 3 },
        ]}
      />
    ),
    empty: (props) => <FunnelChart stages={[]} {...props} />,
  },
  RadarChart: {
    filled: () => <RadarChart series={TWO_SERIES} categories={CATEGORIES} />,
    empty: (props) => <RadarChart series={[]} categories={[]} {...props} />,
  },
  ScatterChart: {
    filled: () => (
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
      />
    ),
    empty: (props) => <ScatterChart series={[]} {...props} />,
  },
  BubbleChart: {
    filled: () => (
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
      />
    ),
    empty: (props) => <BubbleChart series={[]} {...props} />,
  },
  BoxPlotChart: {
    filled: () => <BoxPlotChart series={[{ name: 'a', data: BOX }]} categories={['A', 'B']} />,
    empty: (props) => <BoxPlotChart series={[]} categories={[]} {...props} />,
  },
  RangeBarChart: {
    filled: () => <RangeBarChart series={[{ name: 'a', data: RANGE }]} />,
    empty: (props) => <RangeBarChart series={[]} {...props} />,
  },
  MixedChart: {
    filled: () => (
      <MixedChart
        series={[
          { name: 'a', type: 'column', data: [3, 5, 4] },
          { name: 'b', type: 'line', data: [4, 2, 5] },
        ]}
        categories={CATEGORIES}
      />
    ),
    empty: (props) => <MixedChart series={[]} categories={[]} {...props} />,
  },
  Sparkline: {
    filled: () => <Sparkline data={[1, 3, 2, 4]} />,
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
