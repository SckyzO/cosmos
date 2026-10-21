import type { Meta, StoryObj } from '@storybook/react-vite';
import { GradientRadial } from './GradientRadial';
import { RadialBarChart } from './RadialBarChart';
import { SemiCircleGauge } from './SemiCircleGauge';
import { StrokedGauge } from './StrokedGauge';

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
    <p className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
      {title}
    </p>
    {children}
  </div>
);

const meta = {
  title: 'Charts/Radial & Gauges',
  component: RadialBarChart,
  subcomponents: { GradientRadial, SemiCircleGauge, StrokedGauge },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // Storybook 10 requires `args` when `component` is set and the props have
  // required fields. The gauge stories render their own component and ignore
  // them.
  args: { series: [78, 62, 88, 41], labels: ['CPU', 'Mem', 'Disk', 'Net'] },
} satisfies Meta<typeof RadialBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/** The four radial wrappers side by side. */
export const Overview: Story = {
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

/** One track per series, values in percent; the center shows their average. */
export const MultipleSeries: Story = {
  render: (args) => (
    <Card title="Node usage">
      <RadialBarChart {...args} />
    </Card>
  ),
};

/** `GradientRadial` fades from the accent to green along the arc. */
export const Gradient: Story = {
  render: () => (
    <Card title="Cluster health">
      <GradientRadial value={84} label="Health" />
    </Card>
  ),
};

/** `SemiCircleGauge` draws a half circle, in the accent by default. */
export const SemiCircle: Story = {
  render: () => (
    <Card title="Load average">
      <SemiCircleGauge value={67} label="Load" />
    </Card>
  ),
};

/** `color` maps a gauge to a status. */
export const SemiCircleStatusColors: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="web-01">
        <SemiCircleGauge value={42} label="CPU" color="#10b981" />
      </Card>
      <Card title="web-02">
        <SemiCircleGauge value={78} label="CPU" color="#f59e0b" />
      </Card>
      <Card title="db-01">
        <SemiCircleGauge value={94} label="CPU" color="#ef4444" />
      </Card>
    </div>
  ),
};

/** `StrokedGauge` splits the arc into dashes with round caps. */
export const Stroked: Story = {
  render: () => (
    <Card title="Monthly uptime">
      <StrokedGauge value={92} label="Uptime" />
    </Card>
  ),
};
