import type { Meta, StoryObj } from '@storybook/react-vite';
import { HealthDot } from './HealthDot';
import type { HealthStatus } from './types';

const meta = {
  title: 'Status/Health Dot',
  component: HealthDot,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { status: 'OK' },
} satisfies Meta<typeof HealthDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ok: Story = { args: { status: 'OK' } };
export const Warn: Story = { args: { status: 'WARN' } };
export const Crit: Story = { args: { status: 'CRIT' } };
export const Pulsing: Story = { args: { status: 'CRIT', pulse: true } };

const STATUSES: HealthStatus[] = ['OK', 'WARN', 'CRIT', 'INFO', 'UNKNOWN'];

export const StaticVsPulse: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        {STATUSES.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <HealthDot status={s} />
            <span className="text-xs">{s}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-6">
        {STATUSES.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <HealthDot status={s} pulse />
            <span className="text-xs">{s} (pulse)</span>
          </div>
        ))}
      </div>
    </div>
  ),
};
