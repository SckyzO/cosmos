import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useId, useState } from 'react';
import { expect } from 'storybook/test';
import { expectNoHorizontalOverflow, mobileViewport } from '../storybook-helpers';
import {
  ProgressBar,
  type ProgressBarIntent,
  type ProgressBarSegment,
  type ProgressBarSize,
} from './ProgressBar';
import { SectionLabel } from './SectionLabel';

const meta = {
  title: 'Feedback/Progress Bar',
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
          <SectionLabel className="w-6">{s}</SectionLabel>
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
          <SectionLabel className="w-16">{i}</SectionLabel>
          <ProgressBar
            value={75}
            intent={i}
            label="outside"
            aria-label={`${i} progress`}
            className="flex-1"
          />
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
  tags: ['!dev'],
  args: { value: 250, max: 100, label: 'outside' },
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar');
    // Value 250/100 → clamps to 100%
    await expect(bar).toHaveAttribute('aria-valuenow', '100');
  },
};

// ── Segments ─────────────────────────────────────────────────────────────────

const STORAGE = [
  { label: 'Documents', value: 40, valueLabel: '40 GB' },
  { label: 'Images', value: 25, intent: 'success', valueLabel: '25 GB' },
  { label: 'Backups', value: 15, intent: 'warning', valueLabel: '15 GB' },
] satisfies ProgressBarSegment[];

// The segment elements of a bar, and the track they share.
const partsOf = (bar: HTMLElement) =>
  Array.from(bar.querySelectorAll<HTMLElement>('[data-segment]'));

export const Segments: Story = {
  render: () => (
    <div className="max-w-md">
      <ProgressBar segments={STORAGE} aria-label="Storage by type" />
    </div>
  ),
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar', { name: 'Storage by type' });
    await expect(bar).toHaveAttribute('aria-valuenow', '80');
    await expect(bar).toHaveAttribute(
      'aria-valuetext',
      'Documents 40 GB, Images 25 GB, Backups 15 GB, Free 20'
    );
    // Parts share the track in proportion, with a 2px gap between neighbours (and the free room).
    const [docs, images, backups] = partsOf(bar).map((el) => el.getBoundingClientRect().width);
    await expect(docs / images).toBeCloseTo(40 / 25, 1);
    await expect(images / backups).toBeCloseTo(25 / 15, 1);
    const free = bar.getBoundingClientRect().width - (docs + images + backups) - 3 * 2;
    await expect(free / docs).toBeCloseTo(20 / 40, 1);
  },
};

export const SegmentsWithLegend: Story = {
  render: () => (
    <div className="max-w-md">
      <ProgressBar
        segments={STORAGE}
        legend
        free={{ valueLabel: '20 GB' }}
        label="outside"
        aria-label="Storage by type"
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const items = canvas.getAllByRole('listitem').map((li) => li.textContent);
    await expect(items).toEqual(['Documents40 GB', 'Images25 GB', 'Backups15 GB', 'Free20 GB']);
    await expect(canvas.getByText('80%')).toBeVisible();
  },
};

export const SegmentsSizes: Story = {
  render: () => (
    <div className="max-w-md space-y-3">
      {(['xs', 'sm', 'md', 'lg'] as ProgressBarSize[]).map((s) => (
        <ProgressBar key={s} segments={STORAGE} size={s} aria-label={`Size ${s}`} />
      ))}
    </div>
  ),
};

export const SegmentsFullAndOver: Story = {
  render: () => (
    <div className="max-w-md space-y-5">
      <ProgressBar
        aria-label="Exactly full"
        legend
        segments={[
          { label: 'Used', value: 70 },
          { label: 'Reserved', value: 30, intent: 'warning' },
        ]}
      />
      <div>
        <div className="mb-1 flex items-baseline justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">Budget · over 100%, clamped</span>
          <span className="font-semibold text-red-700 dark:text-red-400">112%</span>
        </div>
        <ProgressBar
          aria-label="Over budget"
          size="sm"
          segments={[
            { label: 'Planned', value: 70 },
            { label: 'Unplanned', value: 42, intent: 'danger' },
          ]}
        />
      </div>
    </div>
  ),
};

export const SegmentsClampToMax: Story = {
  tags: ['!dev'],
  render: () => (
    <div className="w-80">
      <ProgressBar
        aria-label="Over budget"
        legend
        segments={[
          { label: 'Planned', value: 70 },
          { label: 'Unplanned', value: 42, intent: 'danger' },
        ]}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar');
    await expect(bar).toHaveAttribute('aria-valuenow', '100');
    // 70 + 42 is held to 100: the second part is cut to 30, and nothing is left on the track.
    await expect(bar).toHaveAttribute('aria-valuetext', 'Planned 70, Unplanned 30');
    const [planned, unplanned] = partsOf(bar).map((el) => el.getBoundingClientRect().width);
    await expect(planned / unplanned).toBeCloseTo(70 / 30, 1);
    // The parts and the one gap fill the track exactly: no overflow.
    await expect(planned + unplanned + 2).toBeCloseTo(bar.getBoundingClientRect().width, 0);
    await expect(canvas.queryByText('Free')).toBeNull();
  },
};

export const SegmentsAreNamedByTheirParts: Story = {
  tags: ['!dev'],
  render: () => (
    <div className="w-80">
      <ProgressBar
        aria-label="Seats"
        segments={[
          { label: 'Active', value: 72 },
          { label: 'Invited', value: 12, intent: 'warning' },
          { label: 'Empty', value: 0 },
        ]}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar', { name: 'Seats' });
    await expect(bar).toHaveAttribute('aria-valuetext', 'Active 72, Invited 12, Empty 0, Free 16');
    await expect(bar).toHaveAttribute('aria-valuemax', '100');
    // A part with nothing in it draws nothing.
    await expect(partsOf(bar)).toHaveLength(2);
  },
};

export const SegmentsOnNarrowScreen: Story = {
  tags: ['!autodocs'],
  globals: mobileViewport,
  render: () => (
    <ProgressBar
      segments={STORAGE}
      legend
      free={{ valueLabel: '20 GB' }}
      label="outside"
      aria-label="Storage by type"
    />
  ),
  play: async () => {
    expectNoHorizontalOverflow();
  },
};
