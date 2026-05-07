import type { Meta, StoryObj } from '@storybook/react-vite';
import { HealthBadge } from './HealthBadge';
import type { HealthStatus } from './types';

const meta = {
  title: 'Status/Health Badge',
  component: HealthBadge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { status: 'OK' },
} satisfies Meta<typeof HealthBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ok: Story = { args: { status: 'OK' } };
export const Warn: Story = { args: { status: 'WARN' } };
export const Crit: Story = { args: { status: 'CRIT' } };
export const Info: Story = { args: { status: 'INFO' } };
export const Unknown: Story = { args: { status: 'UNKNOWN' } };

const STATUSES: HealthStatus[] = ['OK', 'WARN', 'CRIT', 'INFO', 'UNKNOWN'];

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {STATUSES.map((s) => (
        <HealthBadge key={s} status={s} />
      ))}
    </div>
  ),
};
