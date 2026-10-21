import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkline, SparklineGroup } from './Sparkline';

const REQUESTS = [10, 22, 18, 25, 30, 28, 35, 31, 29, 36, 32, 40];
const SERVICES = [
  {
    name: 'api-gateway',
    rate: '2.3k req/s',
    trend: [1900, 1960, 2010, 2050, 2120, 2160, 2210, 2240, 2280, 2300],
  },
  {
    name: 'auth-service',
    rate: '840 req/s',
    trend: [790, 800, 805, 812, 818, 825, 829, 834, 838, 840],
  },
  {
    name: 'checkout-service',
    rate: '312 req/s',
    trend: [280, 290, 305, 330, 352, 340, 326, 318, 314, 312],
    color: '#f59e0b',
  },
  {
    name: 'payment-service',
    rate: '96 req/s',
    trend: [160, 152, 147, 139, 128, 117, 109, 102, 98, 96],
    color: '#ef4444',
  },
];

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
    <p className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
      {title}
    </p>
    {children}
  </div>
);

const meta = {
  title: 'Charts/Sparkline',
  component: Sparkline,
  subcomponents: { SparklineGroup },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { data: REQUESTS },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/** No axes, no grid: the shape of the trend, in the accent by default. */
export const Area: Story = {
  render: (args) => (
    <Card title="Requests/s">
      <Sparkline {...args} />
    </Card>
  ),
};

export const Line: Story = {
  args: { variant: 'line', data: [120, 130, 110, 150, 160, 170, 165, 184, 176, 168, 181, 179] },
  render: (args) => (
    <Card title="Latency p95">
      <Sparkline {...args} />
    </Card>
  ),
};

/** `color` overrides the accent, for a metric with a status. */
export const CustomColor: Story = {
  args: { color: '#ef4444', data: [3, 5, 4, 8, 6, 9, 7, 11, 8, 12, 10, 14] },
  render: (args) => (
    <Card title="Errors/min">
      <Sparkline {...args} />
    </Card>
  ),
};

/** `SparklineGroup` lays out KPI cards: label, value and a sparkline each. */
export const KpiGroup: Story = {
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

/** `width` and `height` shrink a line sparkline into a table cell. */
export const InTable: Story = {
  render: () => (
    <Card title="Traffic by service">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
            <th className="pb-2 font-medium">Service</th>
            <th className="pb-2 font-medium">Rate</th>
            <th className="pb-2 font-medium">Last 10 min</th>
          </tr>
        </thead>
        <tbody>
          {SERVICES.map((s) => (
            <tr key={s.name} className="border-t border-gray-100 dark:border-gray-800">
              <td className="py-2 font-mono text-xs text-gray-900 dark:text-white">{s.name}</td>
              <td className="py-2 text-gray-700 dark:text-gray-300">{s.rate}</td>
              <td className="py-2">
                <Sparkline data={s.trend} color={s.color} variant="line" width={120} height={32} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  ),
};
