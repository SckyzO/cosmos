import type { Meta, StoryObj } from '@storybook/react-vite';
import { KpiCard } from './KpiCard';

const meta = {
  title: 'Data/Kpi Card',
  component: KpiCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: 'Total', value: '0' },
} satisfies Meta<typeof KpiCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Total Racks', value: '48', sub: 'across 3 sites' },
};

export const NoSub: Story = { args: { label: 'Health Score', value: '94%' } };

export const DangerBorder: Story = {
  args: {
    label: 'CRIT Alerts',
    value: '3',
    sub: '2 escalated',
    className: 'border-red-200 dark:border-red-900/40',
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Total Racks" value="48" sub="across 3 sites" />
      <KpiCard
        label="CRIT Alerts"
        value="3"
        sub="2 escalated"
        className="border-red-200 dark:border-red-900/40"
      />
      <KpiCard label="Health Score" value="94%" />
      <KpiCard label="Nodes Online" value="1 204" sub="of 1 248 total" />
    </div>
  ),
};
