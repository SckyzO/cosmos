import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
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

// UNKNOWN is gray-400 in the dark themes, where gray-500 sinks into the surface.
const PALETTE_500: Record<HealthStatus, string> = {
  OK: 'bg-green-500',
  WARN: 'bg-amber-500',
  CRIT: 'bg-red-500',
  INFO: 'bg-blue-500',
  UNKNOWN: 'bg-gray-500 dark:bg-gray-400',
};

// Each dot must paint the theme's 500 step of its status hue, the palette the
// status pills use, not a fixed hex from another Tailwind version.
export const MatchesThemePalette: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex gap-4">
      {STATUSES.map((s) => (
        <div key={s} data-status={s} className="flex items-center gap-2">
          <HealthDot status={s} />
          <span data-probe className={`h-2.5 w-2.5 ${PALETTE_500[s]}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const s of STATUSES) {
      const row = canvasElement.querySelector(`[data-status="${s}"]`)!;
      const dot = row.querySelector('.rounded-full')!;
      const probe = row.querySelector('[data-probe]')!;
      await expect(`${s} ${getComputedStyle(dot).backgroundColor}`).toBe(
        `${s} ${getComputedStyle(probe).backgroundColor}`
      );
    }
  },
};

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

// Color alone told sighted users the status; assistive tech got nothing (#151).
export const StatusIsAvailableAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: { status: 'CRIT' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('CRIT')).toHaveClass('sr-only');
  },
};

export const Labelled: Story = { args: { status: 'CRIT', label: 'Database: critical' } };

// With a label the dot is an image with that name (and no duplicate status
// text); without one, the status text stays the name.
export const LabelNamesTheDot: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex gap-4">
      <HealthDot status="CRIT" label="Database: critical" />
      <HealthDot status="OK" />
    </div>
  ),
  play: async ({ canvas }) => {
    const dot = canvas.getByRole('img', { name: 'Database: critical' });
    await expect(dot.querySelector('.sr-only')).toBeNull();
    await expect(canvas.getAllByRole('img')).toHaveLength(1);
    await expect(canvas.getByText('OK')).toHaveClass('sr-only');
  },
};
