import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBadge } from './StatusBadge';
import { HealthDot } from './HealthDot';
import { HealthBadge } from './HealthBadge';
import type { HealthStatus } from './types';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Status/Indicators',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const STATUSES = ['OK', 'WARN', 'CRIT', 'UNKNOWN'] as const satisfies readonly HealthStatus[];
const SIZES = ['sm', 'md', 'lg'] as const;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const StatusBadgeMatrix: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="StatusBadge — all states × all sizes">
        <div className="space-y-4">
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
      </SectionCard>
    </Wrap>
  ),
};

export const HealthDotPulsing: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="HealthDot — static / pulsing">
        <div className="flex flex-wrap gap-8">
          {STATUSES.map((s) => (
            <div key={s} className="flex items-center gap-3">
              <HealthDot status={s} />
              <span className="text-sm text-[var(--color-text-secondary)]">{s} (static)</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-8">
          {STATUSES.map((s) => (
            <div key={s} className="flex items-center gap-3">
              <HealthDot status={s} pulse />
              <span className="text-sm text-[var(--color-text-secondary)]">{s} (pulse)</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const HealthBadgeAll: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="HealthBadge — icon + label">
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((s) => (
            <HealthBadge key={s} status={s} />
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};
