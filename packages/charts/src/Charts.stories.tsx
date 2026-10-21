import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { BarChart } from './BarChart';
import { LineAreaChart } from './LineAreaChart';
import { RealtimeChart } from './RealtimeChart';
import { RadialBarChart } from './RadialBarChart';
import { GradientRadial } from './GradientRadial';
import { SemiCircleGauge } from './SemiCircleGauge';
import { StrokedGauge } from './StrokedGauge';
import { DonutChart } from './DonutChart';
import { Sparkline, SparklineGroup } from './Sparkline';
import { TreemapChart } from './TreemapChart';

const meta = {
  title: 'Charts/Gallery',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
    <p className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">{title}</p>
    {children}
  </div>
);

export const LineArea: Story = {
  render: () => (
    <Card title="LineAreaChart">
      <LineAreaChart
        series={[{ name: 'CPU', data: [12, 19, 23, 31, 22, 18, 25, 33, 30] }]}
        categories={['00h', '03h', '06h', '09h', '12h', '15h', '18h', '21h', '24h']}
      />
    </Card>
  ),
};

export const Realtime: Story = {
  render: () => (
    <Card title="RealtimeChart — updates every 2s">
      <RealtimeChart />
    </Card>
  ),
};

export const Radials: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card title="RadialBarChart">
        <RadialBarChart series={[78, 62, 88, 41]} labels={['CPU', 'Mem', 'Disk', 'Net']} />
      </Card>
      <Card title="GradientRadial">
        <GradientRadial value={84} label="Health" />
      </Card>
      <Card title="SemiCircleGauge">
        <SemiCircleGauge value={67} label="Load" />
      </Card>
      <Card title="StrokedGauge">
        <StrokedGauge value={92} label="Uptime" />
      </Card>
    </div>
  ),
};

export const Donuts: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="DonutChart — bottom legend">
        <DonutChart series={[44, 23, 18, 9, 6]} labels={['CRIT', 'WARN', 'OK', 'INFO', 'UNK']} />
      </Card>
      <Card title="DonutChart — right legend">
        <DonutChart
          series={[44, 23, 18, 9, 6]}
          labels={['CRIT', 'WARN', 'OK', 'INFO', 'UNK']}
          rightLegend
        />
      </Card>
    </div>
  ),
};

export const Sparklines: Story = {
  render: () => (
    <SparklineGroup
      items={[
        { label: 'Requests/s', value: '2.3k', data: [10, 22, 18, 25, 30, 28, 35, 31, 29] },
        { label: 'Errors/min', value: '12', data: [3, 5, 4, 8, 6, 9, 7, 11, 8], color: '#ef4444' },
        {
          label: 'Latency p95',
          value: '184ms',
          data: [120, 130, 110, 150, 160, 170, 165, 184],
          color: '#f59e0b',
        },
        { label: 'Active users', value: '341', data: [300, 320, 280, 340, 360, 350, 341] },
      ]}
    />
  ),
};

export const SingleSparkline: Story = {
  render: () => (
    <Card title="Sparkline — standalone">
      <Sparkline data={[10, 22, 18, 25, 30, 28, 35, 31, 29, 36, 32, 40]} variant="area" />
    </Card>
  ),
};

export const Treemap: Story = {
  render: () => (
    <Card title="TreemapChart">
      <TreemapChart
        series={[
          {
            data: [
              { x: 'DC1', y: 218 },
              { x: 'DC2', y: 152 },
              { x: 'DC3', y: 96 },
              { x: 'edge-east', y: 64 },
              { x: 'edge-west', y: 48 },
              { x: 'lab', y: 22 },
            ],
          },
        ]}
      />
    </Card>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

/**
 * Charts re-read their colors when the theme or accent changes on <html>. The
 * y-axis labels used to come back empty after that update: LineAreaChart
 * shared one labels object between both axes and ApexCharts wrote the
 * category formatter onto it.
 */
export const AccentSwitchKeepsYAxisLabels: Story = {
  render: LineArea.render,
  play: async ({ canvasElement }) => {
    const yLabels = () =>
      [...canvasElement.querySelectorAll('.apexcharts-yaxis-label')].map((el) => el.textContent);
    await waitFor(() => expect(yLabels().length).toBeGreaterThan(0));

    const root = document.documentElement;
    const previous = root.dataset.accent;
    root.dataset.accent = 'teal';
    try {
      // Wait for the update: the series turns teal (brand-500).
      await waitFor(
        () => expect(canvasElement.querySelector('[stroke="#038378"]')).not.toBeNull(),
        {
          timeout: 3000,
        }
      );
      await expect(yLabels()).not.toContain('');
    } finally {
      if (previous) root.dataset.accent = previous;
      else delete root.dataset.accent;
    }
  },
};

// Series names, categories and labels are data, not markup. ApexCharts writes
// legends and tooltips with innerHTML, so the wrappers escape what goes there.
const HOSTILE = '<img src=x onerror="window.__cosmosChartInjected=1">';

const expectNoInjectedImage = async (root: HTMLElement) => {
  await expect(root.querySelector('img')).toBeNull();
  await expect(
    (window as { __cosmosChartInjected?: number }).__cosmosChartInjected
  ).toBeUndefined();
};

// ApexCharts picks the hovered point from the pointer coordinates.
const hover = (el: Element, xRatio = 0.5) => {
  const { left, top, width, height } = el.getBoundingClientRect();
  el.dispatchEvent(
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: left + width * xRatio,
      clientY: top + height / 2,
    })
  );
};

const chartOf = (root: HTMLElement, seriesSelector: string) =>
  root.querySelector(seriesSelector)?.closest('.apexcharts-canvas') as HTMLElement;

export const HtmlInLabelsRendersAsText: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="BarChart">
        <BarChart
          series={[
            { name: HOSTILE, data: [3, 5, 2] },
            { name: 'Normal', data: [4, 1, 6] },
          ]}
          categories={[HOSTILE, 'B', 'C']}
        />
      </Card>
      <Card title="DonutChart">
        <DonutChart series={[40, 60]} labels={[HOSTILE, 'Normal']} />
      </Card>
      <Card title="LineAreaChart">
        <LineAreaChart
          series={[{ name: HOSTILE, data: [3, 5, 2] }]}
          categories={[HOSTILE, 'B', 'C']}
        />
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('.apexcharts-legend-text').length).toBeGreaterThan(2)
    );
    // Legends render on mount: the name must show up as literal text.
    const legendTexts = [...canvasElement.querySelectorAll('.apexcharts-legend-text')].map(
      (el) => el.textContent
    );
    await expect(legendTexts).toContain(HOSTILE);
    await expectNoInjectedImage(canvasElement);

    // Tooltips render on hover: title (category) and series name.
    const barChart = chartOf(canvasElement, '.apexcharts-bar-series');
    hover(barChart.querySelector('.apexcharts-bar-area') as Element);
    await waitFor(() =>
      expect(barChart.querySelector('.apexcharts-tooltip-title')?.textContent).toBe(HOSTILE)
    );
    await expectNoInjectedImage(canvasElement);

    // Same for the area chart, whose first point sits at the left edge of the
    // plot. The title is the category, not the point's position on the axis.
    const areaChart = chartOf(canvasElement, '.apexcharts-area-series');
    hover(areaChart.querySelector('.apexcharts-grid') as Element, 0.05);
    await waitFor(() =>
      expect(areaChart.querySelector('.apexcharts-tooltip-title')?.textContent).toBe(HOSTILE)
    );
    await expect(areaChart.querySelector('.apexcharts-tooltip-text-y-label')?.textContent).toBe(
      `${HOSTILE}: `
    );
    await expectNoInjectedImage(canvasElement);
  },
};
