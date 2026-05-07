import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBadge } from './StatusBadge';
import type { HealthStatus } from './types';

const meta = {
  title: 'Status/Status Badge',
  component: StatusBadge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { status: 'OK' },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ok: Story = { args: { status: 'OK' } };
export const Warn: Story = { args: { status: 'WARN' } };
export const Crit: Story = { args: { status: 'CRIT' } };
export const Unknown: Story = { args: { status: 'UNKNOWN' } };
export const Info: Story = { args: { status: 'INFO' } };

const STATUSES: HealthStatus[] = ['OK', 'WARN', 'CRIT', 'INFO', 'UNKNOWN'];
const SIZES = ['sm', 'md', 'lg'] as const;

export const Matrix: Story = {
  render: () => (
    <div className="space-y-3">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-3">
          <span className="w-8 font-mono text-[10px] text-[var(--color-text-muted)] uppercase">
            {size}
          </span>
          {STATUSES.map((s) => (
            <StatusBadge key={s} status={s} size={size} />
          ))}
        </div>
      ))}
    </div>
  ),
};

export const CustomLabel: Story = { args: { status: 'OK', label: 'Healthy' } };
