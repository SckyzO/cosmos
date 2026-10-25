import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ApexOptions } from 'apexcharts';
import { useState, type ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { BarChart } from './BarChart';
import { BoxPlotChart } from './BoxPlotChart';
import { DonutChart } from './DonutChart';
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
  HOSTILE,
  expectLegendMarkersUnstroked,
  resolveColor,
  expectNoFrame,
  expectNoInjectedImage,
  switchTheme,
  themeColor,
} from './storybook-helpers';
import { tickTexts } from './storybook-recharts';
import type { ChartEmptyProps } from './types';

// What every wrapper takes in common, checked on all of them at once: a wrapper
// that forgets to pass a prop on to ApexChart drops it without a type error.
// `LineAreaChart` and `Sparkline` draw with Recharts: they take `children`, not
// `apexOptions`, and have their own empty state, so the checks of the ApexCharts
// options leave them out.

const CATEGORIES = ['A', 'B', 'C'];
const TWO_SERIES = [
  { name: 'a', data: [3, 5, 4] },
  { name: 'b', data: [4, 2, 5] },
];
const BOX = [
  [1, 2, 3, 4, 5],
  [2, 3, 4, 5, 6],
] as [number, number, number, number, number][];
const RANGE = [{ x: 'api', y: [1700000000000, 1700003600000] as [number, number] }];

type Chart = {
  /** Drawn with Recharts: no `apexOptions`, no ApexCharts DOM. */
  recharts?: true;
  /** Drawn with data. */
  filled: (apexOptions?: ApexOptions) => ReactNode;
  /** Drawn with no data, for the wrappers that can have none. */
  empty?: (props: ChartEmptyProps) => ReactNode;
};

const CHARTS: Record<string, Chart> = {
  LineAreaChart: {
    recharts: true,
    filled: () => <LineAreaChart series={TWO_SERIES} categories={CATEGORIES} />,
    empty: (props) => <LineAreaChart series={[]} categories={[]} {...props} />,
  },
  BarChart: {
    filled: (apexOptions) => (
      <BarChart series={TWO_SERIES} categories={CATEGORIES} apexOptions={apexOptions} />
    ),
    empty: (props) => <BarChart series={[]} categories={[]} {...props} />,
  },
  DonutChart: {
    recharts: true,
    filled: () => <DonutChart series={[5, 3, 2]} labels={['a', 'b', 'c']} />,
    empty: (props) => <DonutChart series={[]} labels={[]} {...props} />,
  },
  RadialBarChart: {
    filled: (apexOptions) => (
      <RadialBarChart series={[60, 40]} labels={['a', 'b']} apexOptions={apexOptions} />
    ),
    empty: (props) => <RadialBarChart series={[]} labels={[]} {...props} />,
  },
  TreemapChart: {
    filled: (apexOptions) => (
      <TreemapChart
        series={[
          {
            data: [
              { x: 'a', y: 5 },
              { x: 'b', y: 3 },
            ],
          },
        ]}
        apexOptions={apexOptions}
      />
    ),
    empty: (props) => <TreemapChart series={[]} {...props} />,
  },
  HeatmapChart: {
    filled: (apexOptions) => (
      <HeatmapChart series={TWO_SERIES} categories={CATEGORIES} apexOptions={apexOptions} />
    ),
    empty: (props) => <HeatmapChart series={[]} categories={[]} {...props} />,
  },
  RadarChart: {
    recharts: true,
    filled: () => <RadarChart series={TWO_SERIES} categories={CATEGORIES} />,
    empty: (props) => <RadarChart series={[]} categories={[]} {...props} />,
  },
  ScatterChart: {
    filled: (apexOptions) => (
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
        apexOptions={apexOptions}
      />
    ),
    empty: (props) => <ScatterChart series={[]} {...props} />,
  },
  BubbleChart: {
    filled: (apexOptions) => (
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
        apexOptions={apexOptions}
      />
    ),
    empty: (props) => <BubbleChart series={[]} {...props} />,
  },
  BoxPlotChart: {
    filled: (apexOptions) => (
      <BoxPlotChart
        series={[{ name: 'a', data: BOX }]}
        categories={['A', 'B']}
        apexOptions={apexOptions}
      />
    ),
    empty: (props) => <BoxPlotChart series={[]} categories={[]} {...props} />,
  },
  RangeBarChart: {
    filled: (apexOptions) => (
      <RangeBarChart series={[{ name: 'a', data: RANGE }]} apexOptions={apexOptions} />
    ),
    empty: (props) => <RangeBarChart series={[]} {...props} />,
  },
  MixedChart: {
    filled: (apexOptions) => (
      <MixedChart
        series={[
          { name: 'a', type: 'column', data: [3, 5, 4] },
          { name: 'b', type: 'line', data: [4, 2, 5] },
        ]}
        categories={CATEGORIES}
        apexOptions={apexOptions}
      />
    ),
    empty: (props) => <MixedChart series={[]} categories={[]} {...props} />,
  },
  Sparkline: {
    recharts: true,
    filled: () => <Sparkline data={[1, 3, 2, 4]} />,
    empty: (props) => <Sparkline data={[]} {...props} />,
  },
  // Always have data: no empty state.
  GradientRadial: {
    filled: (apexOptions) => <GradientRadial value={84} apexOptions={apexOptions} />,
  },
  SemiCircleGauge: {
    filled: (apexOptions) => <SemiCircleGauge value={42} apexOptions={apexOptions} />,
  },
  StrokedGauge: {
    filled: (apexOptions) => <StrokedGauge value={92} apexOptions={apexOptions} />,
  },
  RealtimeChart: {
    filled: (apexOptions) => <RealtimeChart apexOptions={apexOptions} />,
  },
};

// The ones that take `apexOptions`.
const NAMES = Object.keys(CHARTS).filter((name) => !CHARTS[name].recharts);
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
  root.querySelector(
    `[data-chart="${name}"] ${CHARTS[name].recharts ? '[data-chart-empty]' : '.apexcharts-text-nodata'}`
  );

// The Recharts wrappers draw a plot with an SVG; the ApexCharts ones always do.
const plot = (name: string) => (CHARTS[name].recharts ? 'svg.recharts-surface' : '.apexcharts-svg');

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
    await expectNoFrame(canvasElement);
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
      expect(
        EMPTY_NAMES.filter((name) =>
          CHARTS[name].recharts
            ? noData(canvasElement, name) !== null
            : canvasElement.querySelector(`[data-chart="${name}"] ${plot(name)}`) !== null
        )
      ).toEqual(EMPTY_NAMES)
    );
    for (const name of EMPTY_NAMES) {
      const message = noData(canvasElement, name);
      if (CHARTS[name].recharts) await expect(message).toBeEmptyDOMElement();
      else await expect(message).toBeNull();
    }
  },
};

/** The message is SVG text: markup in it shows as written. */
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
          const fills = EMPTY_NAMES.map((name) =>
            CHARTS[name].recharts
              ? resolveColor(getComputedStyle(message(name) as Element).color)
              : message(name)?.getAttribute('fill')
          );
          expect(fills).toEqual(
            EMPTY_NAMES.map((name) =>
              themeColor(CHARTS[name].recharts ? '--color-text-muted' : '--color-text-secondary')
            )
          );
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
    for (const name of ['BarChart', 'MixedChart']) {
      await waitFor(() =>
        expect(
          [...canvasElement.querySelectorAll(`[data-chart="${name}"] .apexcharts-yaxis-label`)]
            .filter((el) => !el.closest('[style*="display: none"]'))
            .map((el) => el.textContent)
            .join('')
        ).not.toBe('')
      );
    }
    await waitFor(() => {
      const chart = canvasElement.querySelector<HTMLElement>('[data-chart="LineAreaChart"]');
      expect(chart).not.toBeNull();
      expect(tickTexts(chart as HTMLElement, 'yAxis')).not.toEqual([]);
    });
  },
};

// The wrappers that draw a legend with two series, through `chartLegend`.
const LEGEND_NAMES = [
  'BarChart',
  'HeatmapChart',
  'ScatterChart',
  'BubbleChart',
  'BoxPlotChart',
  'RangeBarChart',
  'MixedChart',
];

/** No legend swatch of any chart has an outline: ApexCharts' white ring glares in the dark themes. */
export const LegendSwatchesHaveNoOutline: Story = {
  globals: { theme: 'dark' },
  render: () => (
    <Grid names={LEGEND_NAMES}>
      {(name) => CHARTS[name].filled({ legend: { show: true, showForSingleSeries: true } })}
    </Grid>
  ),
  play: async ({ canvasElement }) => {
    for (const name of LEGEND_NAMES) {
      const chart = canvasElement.querySelector<HTMLElement>(`[data-chart="${name}"]`)!;
      await waitFor(() => expect(chart.querySelector('.apexcharts-svg')).not.toBeNull());
      await expectLegendMarkersUnstroked(chart);
    }
  },
};

const deepFreeze = <T,>(value: T): T => {
  if (typeof value === 'object' && value !== null) {
    for (const entry of Object.values(value)) deepFreeze(entry);
    Object.freeze(value);
  }
  return value;
};

const titles = (root: HTMLElement) =>
  Object.fromEntries(
    NAMES.map((name) => [
      name,
      root.querySelector(`[data-chart="${name}"] .apexcharts-title-text`)?.textContent,
    ])
  );

/** `apexOptions` reaches ApexCharts from every wrapper: here, a title none of them sets. */
export const ApexOptionsReachEveryChart: Story = {
  render: () => (
    <Grid names={NAMES}>{(name) => CHARTS[name].filled({ title: { text: 'Raw title' } })}</Grid>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(titles(canvasElement)).toEqual(
        Object.fromEntries(NAMES.map((name) => [name, 'Raw title']))
      )
    );
  },
};

/**
 * ApexCharts writes to the options it is given: every wrapper hands it a copy,
 * so an object that is frozen draws all the same and comes out as it went in.
 */
export const ApexOptionsAreNotChanged: Story = {
  render: () => {
    const options = deepFreeze({
      title: { text: 'Raw title' },
      chart: { toolbar: { show: false } },
      xaxis: { labels: { rotate: 0 } },
      colors: ['#7c3aed', '#0ea5e9'],
    });
    return <Grid names={NAMES}>{(name) => CHARTS[name].filled(options)}</Grid>;
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(titles(canvasElement)).toEqual(
        Object.fromEntries(NAMES.map((name) => [name, 'Raw title']))
      )
    );
  },
};
