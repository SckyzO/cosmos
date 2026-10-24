import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useId, useState } from 'react';
import { expect } from 'storybook/test';
import { ProgressBar, type ProgressBarIntent, type ProgressBarSize } from './ProgressBar';

const meta = {
  title: 'Navigation/Progress Bar',
  component: ProgressBar,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: 42, max: 100, 'aria-label': 'Upload progress' },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-3">
      {(['xs', 'sm', 'md', 'lg'] as ProgressBarSize[]).map((s) => (
        <div key={s} className="flex items-center gap-3">
          <span className="w-6 font-mono text-[10px] text-gray-500 uppercase dark:text-gray-400">
            {s}
          </span>
          <ProgressBar value={62} size={s} aria-label={`Size ${s}`} className="flex-1" />
        </div>
      ))}
    </div>
  ),
};

export const Intents: Story = {
  render: () => (
    <div className="space-y-3">
      {(['brand', 'success', 'warning', 'danger'] as ProgressBarIntent[]).map((i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-16 font-mono text-[10px] text-gray-500 uppercase dark:text-gray-400">
            {i}
          </span>
          <ProgressBar value={75} intent={i} aria-label={`${i} progress`} className="flex-1" />
        </div>
      ))}
    </div>
  ),
};

export const LabelOutside: Story = {
  args: { value: 67, label: 'outside' },
};

export const LabelInside: Story = {
  args: { value: 42, label: 'inside', size: 'lg' },
};

export const LabelInsideForcesOutsideOnSmallSize: Story = {
  args: {
    value: 30,
    label: 'inside',
    size: 'sm',
    labelContent: '30 / 100 — auto-falls back to outside',
  },
};

export const CustomLabel: Story = {
  args: {
    value: 1.2,
    max: 5,
    label: 'outside',
    intent: 'success',
    labelContent: '1.2 GB of 5 GB',
  },
};

export const Striped: Story = {
  args: { value: 60, striped: true, intent: 'brand' },
};

export const StripedSuccess: Story = {
  args: { value: 100, striped: true, intent: 'success', label: 'inside', size: 'lg' },
};

export const Indeterminate: Story = {
  args: { indeterminate: true, intent: 'brand' },
};

export const IndeterminateStriped: Story = {
  args: { indeterminate: true, striped: true, intent: 'warning' },
};

export const Animated: Story = {
  // Its value depends on how long it has been running: no capture can be stable.
  tags: ['no-capture'],
  render: () => {
    const [value, setValue] = useState(0);
    useEffect(() => {
      const id = window.setInterval(() => {
        setValue((v) => (v >= 100 ? 0 : v + 7));
      }, 600);
      return () => window.clearInterval(id);
    }, []);
    return (
      <div className="space-y-3">
        <ProgressBar value={value} intent="brand" label="outside" aria-label="Upload progress" />
        <p className="text-xs text-[var(--color-text-muted)]">
          Updates every 600 ms with a smooth width transition.
        </p>
      </div>
    );
  },
};

// The visible label names the bar: `aria-labelledby` points at it.
const QuotaRow = ({
  label,
  usage,
  value,
  intent,
}: {
  label: string;
  usage: string;
  value: number;
  intent: ProgressBarIntent;
}) => {
  const labelId = useId();
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span id={labelId} className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{usage}</span>
      </div>
      <ProgressBar value={value} intent={intent} aria-labelledby={labelId} />
    </div>
  );
};

export const QuotaUsage: Story = {
  render: () => (
    <div className="max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <QuotaRow label="Storage" usage="3.4 / 10 GB" value={34} intent="brand" />
      <QuotaRow label="API requests" usage="9 200 / 10 000" value={92} intent="warning" />
      <QuotaRow label="Bandwidth" usage="490 / 500 MB" value={98} intent="danger" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar', { name: 'Storage' })).toHaveAttribute(
      'aria-valuenow',
      '34'
    );
    await expect(canvas.getByRole('progressbar', { name: 'Bandwidth' })).toHaveAttribute(
      'aria-valuenow',
      '98'
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RoleProgressbar: Story = {
  args: { value: 50 },
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar');
    await expect(bar).toHaveAttribute('aria-valuenow', '50');
    await expect(bar).toHaveAccessibleName('Upload progress');
    await expect(bar).toHaveAttribute('aria-valuemin', '0');
    await expect(bar).toHaveAttribute('aria-valuemax', '100');
  },
};

export const IndeterminateAriaBusy: Story = {
  args: { indeterminate: true },
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar');
    await expect(bar).toHaveAttribute('aria-busy', 'true');
    await expect(bar).not.toHaveAttribute('aria-valuenow');
  },
};

export const ClampsOverflow: Story = {
  args: { value: 250, max: 100, label: 'outside' },
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar');
    // Value 250/100 → clamps to 100%
    await expect(bar).toHaveAttribute('aria-valuenow', '100');
  },
};
