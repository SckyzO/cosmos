import type { Meta, StoryObj } from '@storybook/react-vite';
import { BarChart } from './BarChart';

const meta = {
  title: 'Charts/Bar Chart',
  component: BarChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const DCS = ['DC1 Paris', 'DC2 Frankfurt', 'DC3 London', 'DC4 Tokyo'];

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

// ── Stories ──────────────────────────────────────────────────────────────────

export const SingleSeries: Story = {
  render: () => (
    <Wrap>
      <BarChart
        categories={MONTHS}
        series={[{ name: 'Incidents', data: [12, 18, 14, 22, 28, 19, 24, 31, 16] }]}
      />
    </Wrap>
  ),
};

export const MultiSeries: Story = {
  render: () => (
    <Wrap>
      <BarChart
        categories={MONTHS}
        series={[
          { name: 'CRIT', data: [3, 4, 2, 6, 5, 4, 7, 9, 5] },
          { name: 'WARN', data: [9, 14, 12, 16, 23, 15, 17, 22, 11] },
        ]}
      />
    </Wrap>
  ),
};

export const Stacked: Story = {
  render: () => (
    <Wrap>
      <BarChart
        categories={MONTHS}
        stacked
        series={[
          { name: 'CRIT', data: [3, 4, 2, 6, 5, 4, 7, 9, 5] },
          { name: 'WARN', data: [9, 14, 12, 16, 23, 15, 17, 22, 11] },
          { name: 'INFO', data: [4, 2, 5, 7, 4, 6, 3, 5, 4] },
        ]}
      />
    </Wrap>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Wrap>
      <BarChart
        orientation="horizontal"
        categories={DCS}
        series={[{ name: 'Active racks', data: [42, 38, 26, 19] }]}
      />
    </Wrap>
  ),
};

export const HorizontalMultiSeries: Story = {
  render: () => (
    <Wrap>
      <BarChart
        orientation="horizontal"
        categories={DCS}
        series={[
          { name: 'In use', data: [42, 38, 26, 19] },
          { name: 'Available', data: [8, 12, 14, 21] },
        ]}
      />
    </Wrap>
  ),
};

export const HorizontalStacked: Story = {
  render: () => (
    <Wrap>
      <BarChart
        orientation="horizontal"
        stacked
        categories={DCS}
        series={[
          { name: 'In use', data: [42, 38, 26, 19] },
          { name: 'Available', data: [8, 12, 14, 21] },
        ]}
      />
    </Wrap>
  ),
};

export const FormattedValues: Story = {
  render: () => (
    <Wrap>
      <BarChart
        categories={MONTHS}
        formatValue={(v) => `${v} k€`}
        series={[{ name: 'Revenue', data: [120, 145, 132, 168, 195, 178, 210, 234, 198] }]}
      />
    </Wrap>
  ),
};

export const CustomColors: Story = {
  render: () => (
    <Wrap>
      <BarChart
        categories={MONTHS}
        colors={['#10b981', '#f59e0b', '#ef4444']}
        series={[
          { name: 'OK', data: [80, 78, 82, 75, 70, 72, 68, 65, 70] },
          { name: 'WARN', data: [12, 14, 12, 16, 20, 18, 22, 25, 20] },
          { name: 'CRIT', data: [3, 4, 2, 6, 5, 4, 7, 9, 5] },
        ]}
      />
    </Wrap>
  ),
};

export const ShortHeight: Story = {
  render: () => (
    <Wrap>
      <BarChart
        height={200}
        categories={MONTHS}
        series={[{ name: 'Compact', data: [12, 18, 14, 22, 28, 19, 24, 31, 16] }]}
      />
    </Wrap>
  ),
};
