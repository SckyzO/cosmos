import type { Meta, StoryObj } from '@storybook/react-vite';
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
