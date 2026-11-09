import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { BarChart } from './BarChart';
import {
  ChartLabelsProvider,
  englishChartLabels,
  type ChartLabelsInput,
} from './ChartLabelsProvider';
import { HeatmapChart } from './HeatmapChart';
import { LineAreaChart } from './LineAreaChart';
import { MixedChart } from './MixedChart';
import { RadarChart } from './RadarChart';
import { RangeBarChart } from './RangeBarChart';
import { Sparkline } from './Sparkline';
import { frenchChartLabels } from './locales/fr';
import { legendTexts, surface } from './storybook-recharts';

const meta = {
  title: 'Charts/ChartLabelsProvider',
  component: ChartLabelsProvider,
  parameters: { layout: 'padded' },
  // A feature, guide or provider page: not counted as a component (Welcome, README).
  tags: ['autodocs', 'not-a-component'],
  args: { labels: {}, children: null },
} satisfies Meta<typeof ChartLabelsProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

const SERIES = [
  { name: 'CPU', data: [31, 40, 28, 51] },
  { name: 'Mémoire', data: [12, 19, 15, 22] },
];
const CATEGORIES = ['T1', 'T2', 'T3', 'T4'];
const NO_INCIDENTS = [{ name: 'Incidents', data: [] }];

/** The charts of the frame, with only the app's own text (series names, categories) left as given. */
const Charts = () => (
  <div className="flex flex-col gap-6">
    <BarChart series={SERIES} categories={CATEGORIES} height={200} />
    <BarChart series={NO_INCIDENTS} categories={[]} height={100} />
    <Sparkline data={[3, 5, 4, 8]} loading height={48} />
  </div>
);

/** One dictionary at the root translates what the charts write themselves. */
export const French: Story = {
  args: { labels: frenchChartLabels },
  render: (args) => (
    <ChartLabelsProvider {...args}>
      <Charts />
    </ChartLabelsProvider>
  ),
};

/** The text of a chart as a screen reader finds it: the name of its plot, or of its empty or loading block. */
const named = (root: HTMLElement) =>
  [
    ...root.querySelectorAll(
      'svg.recharts-surface[aria-label], [data-chart-empty], [data-chart-loading], [role="grid"]'
    ),
  ].map((el) => el.getAttribute('aria-label'));

export const ProviderTranslatesTheCharts: Story = {
  ...French,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(named(canvasElement)).toEqual([
        'Histogramme\u202f: CPU, Mémoire',
        'Histogramme\u202f: Incidents',
        'Tendance de valeur, chargement',
      ])
    );
    // What the chart writes is translated; the series names are the app's, and stay as given.
    await expect(canvasElement.querySelector('[data-chart-empty]')).toHaveTextContent(
      'Aucune donnée'
    );
    await expect(legendTexts(canvasElement)).toEqual(['CPU', 'Mémoire']);
    await expect(canvasElement.querySelector('[data-chart-loading]')).toHaveAttribute(
      'aria-busy',
      'true'
    );
  },
};

/** The charts that write a name and nothing else you read, under one provider. */
export const NamesFromTheProvider: Story = {
  tags: ['!dev', '!autodocs'],
  args: { labels: frenchChartLabels },
  render: (args) => (
    <ChartLabelsProvider {...args}>
      <div className="grid gap-4 md:grid-cols-2">
        <LineAreaChart series={SERIES} categories={CATEGORIES} height={160} />
        <MixedChart
          series={[
            { name: 'CPU', type: 'column', data: [31, 40, 28, 51] },
            { name: 'Mémoire', type: 'line', data: [12, 19, 15, 22] },
          ]}
          categories={CATEGORIES}
          height={160}
        />
        <RadarChart series={SERIES} categories={CATEGORIES} height={200} />
        <HeatmapChart series={SERIES} categories={CATEGORIES} height={120} />
        <BarChart series={SERIES} categories={CATEGORIES} height={160} />
        <RangeBarChart
          series={[
            { name: 'Maintenance', data: [{ x: 'api', y: [1700000000000, 1700003600000] }] },
          ]}
          height={120}
        />
      </div>
    </ChartLabelsProvider>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(named(canvasElement).sort()).toEqual(
        [
          'Courbes\u202f: CPU, Mémoire',
          'Graphique mixte\u202f: CPU, Mémoire',
          'Radar\u202f: CPU, Mémoire',
          'Carte de chaleur\u202f: CPU, Mémoire',
          'Histogramme\u202f: CPU, Mémoire',
          'Plages\u202f: Maintenance',
        ].sort()
      )
    );
  },
};

/** A chart's own `labels` win over the provider, and the name the app passes in over both. */
export const OwnLabelsWinOverTheProvider: Story = {
  tags: ['!dev', '!autodocs'],
  args: { labels: frenchChartLabels },
  render: (args) => (
    <ChartLabelsProvider {...args}>
      <BarChart
        series={NO_INCIDENTS}
        categories={[]}
        height={100}
        labels={{ empty: 'Rien à signaler' }}
      />
      <Sparkline
        data={[3, 5, 4, 8]}
        loading
        height={48}
        labels={{ loading: (name) => `${name} (en cours)` }}
      />
      <BarChart
        series={SERIES}
        categories={CATEGORIES}
        height={160}
        ariaLabel="Charge par trimestre"
      />
    </ChartLabelsProvider>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(named(canvasElement)).toEqual([
        'Histogramme\u202f: Incidents',
        'Tendance de valeur (en cours)',
        'Charge par trimestre',
      ])
    );
    await expect(canvasElement.querySelector('[data-chart-empty]')).toHaveTextContent(
      'Rien à signaler'
    );
  },
};

/** A nested provider replaces the keys it gives and keeps the outer one's others. */
export const NestedProviderOverridesKeyByKey: Story = {
  tags: ['!dev', '!autodocs'],
  args: { labels: frenchChartLabels },
  render: (args) => (
    <ChartLabelsProvider {...args}>
      <ChartLabelsProvider labels={{ chart: { empty: 'Vide' }, barChart: { name: () => 'Inner' } }}>
        <BarChart series={NO_INCIDENTS} categories={[]} height={100} />
        <Sparkline data={[3, 5, 4, 8]} loading height={48} />
      </ChartLabelsProvider>
    </ChartLabelsProvider>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(named(canvasElement)).toEqual(['Inner', 'Tendance de valeur, chargement'])
    );
    await expect(canvasElement.querySelector('[data-chart-empty]')).toHaveTextContent('Vide');
  },
};

/** A key set to `undefined` keeps the default, as a key left out does. */
export const UndefinedKeepsTheDefault: Story = {
  tags: ['!dev', '!autodocs'],
  args: { labels: { chart: { empty: undefined }, barChart: { name: undefined } } },
  render: (args) => (
    <ChartLabelsProvider {...args}>
      <BarChart
        series={NO_INCIDENTS}
        categories={[]}
        height={100}
        labels={{ empty: undefined, loading: undefined }}
      />
    </ChartLabelsProvider>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(named(canvasElement)).toEqual(['Bar chart: Incidents']));
    await expect(canvasElement.querySelector('[data-chart-empty]')).toHaveTextContent('No data');
  },
};

const ENGLISH_CHARTS = (
  <>
    <BarChart series={SERIES} categories={CATEGORIES} height={160} />
    <BarChart series={NO_INCIDENTS} categories={[]} height={100} />
    <Sparkline data={[3, 5, 4, 8]} loading height={48} />
  </>
);

const expectEnglish = (root: HTMLElement) =>
  waitFor(() => {
    expect(named(root)).toEqual([
      'Bar chart: CPU, Mémoire',
      'Bar chart: Incidents',
      'Trend of value, loading',
    ]);
    expect(root.querySelector('[data-chart-empty]')).toHaveTextContent('No data');
  });

/** With no provider, the charts write the English of `englishChartLabels`. */
export const NoProviderWritesEnglish: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => ENGLISH_CHARTS,
  play: async ({ canvasElement }) => {
    await expectEnglish(canvasElement);
  },
};

/** `englishChartLabels` is what every chart writes with no provider: a translation starts from it. */
export const EnglishLabelsAreTheDefaults: Story = {
  tags: ['!dev', '!autodocs'],
  args: { labels: englishChartLabels },
  render: (args) => <ChartLabelsProvider {...args}>{ENGLISH_CHARTS}</ChartLabelsProvider>,
  play: async ({ canvasElement }) => {
    await expectEnglish(canvasElement);
    await expect(englishChartLabels.chart.empty).toBe('No data');
    await expect(surface(canvasElement)).not.toBeNull();
  },
};

/** An empty `labels` prop and an empty provider change nothing. */
export const EmptyDictionaryKeepsEnglish: Story = {
  tags: ['!dev', '!autodocs'],
  args: { labels: {} satisfies ChartLabelsInput },
  render: (args) => <ChartLabelsProvider {...args}>{ENGLISH_CHARTS}</ChartLabelsProvider>,
  play: async ({ canvasElement }) => {
    await expectEnglish(canvasElement);
  },
};
