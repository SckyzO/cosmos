import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useId, useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectMirrored,
  expectReadsLeftToRight,
  expectGraphicContrast,
  expectNoHorizontalOverflow,
  expectTextContrast,
  inEachTheme,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';
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

const INTENTS: ProgressBarIntent[] = ['neutral', 'brand', 'success', 'warning', 'danger'];

export const Intents: Story = {
  render: () => (
    <div className="space-y-3">
      {INTENTS.map((i) => (
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

export const NeutralGauge: Story = {
  args: { value: 64, intent: 'neutral', label: 'inside', size: 'lg', 'aria-label': 'Space used' },
  parameters: {
    docs: {
      description: {
        story:
          '`neutral` is for a gauge that carries no meaning (space used, a quota): a gray fill on the same track, with no color to read as good or bad.',
      },
    },
  },
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

/** The fill of `neutral` is gray and set apart from its track in every theme; the track is the same as ever. */
export const NeutralFillIsGray: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="w-80 space-y-2">
      <ProgressBar value={50} intent="neutral" label="inside" size="lg" aria-label="Neutral" />
      <ProgressBar value={50} aria-label="Brand" />
      <ProgressBar value={50} intent="brand" aria-label="Explicit brand" />
      <ProgressBar
        aria-label="Neutral part"
        segments={[
          { label: 'Used', value: 30, intent: 'neutral' },
          { label: 'Cached', value: 20 },
        ]}
      />
      {/* What the fill is meant to be: the gray palette of the issue, drawn by a plain element. */}
      <div data-probe="" className="h-2 bg-gray-500 dark:bg-gray-400" />
    </div>
  ),
  play: async ({ canvas }) => {
    const fillOf = (name: string) =>
      canvas.getByRole('progressbar', { name }).firstElementChild as HTMLElement;
    const colorOf = (el: Element) => getComputedStyle(el).backgroundColor;
    const probe = document.querySelector<HTMLElement>('[data-probe]')!;
    inEachTheme(() => {
      const neutral = fillOf('Neutral');
      expect(colorOf(neutral)).toBe(colorOf(probe));
      expect(colorOf(neutral)).not.toBe(colorOf(fillOf('Brand')));
      // The track doesn't change with the intent.
      expect(colorOf(canvas.getByRole('progressbar', { name: 'Neutral' }))).toBe(
        colorOf(canvas.getByRole('progressbar', { name: 'Brand' }))
      );
      // The fill still reads against the track (WCAG 1.4.11).
      expectGraphicContrast(neutral, 'backgroundColor');
      // So does the label inside it (white on the light fill, dark on the light gray of dark).
      expectTextContrast(canvas.getByText('50%'));
      // A neutral part of a segmented bar is the same gray.
      const part = canvas
        .getByRole('progressbar', { name: 'Neutral part' })
        .querySelector<HTMLElement>('[data-segment]')!;
      expect(colorOf(part)).toBe(colorOf(probe));
    });
    // `brand` is the default, as before.
    await expect(fillOf('Brand').className).toBe(fillOf('Explicit brand').className);
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

const trackOf = (box: HTMLElement) => within(box).getAllByRole('progressbar')[0]!;

/** The fill grows from the start edge: the left one, the right one in right to left. */
export const FillGrowsFromTheStartEdge: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <ProgressBar value={40} label="outside" labelContent="2 of 5 done" aria-label="Upload" />
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const track = trackOf(box);
      const fill = track.firstElementChild!;
      expect(startOffset(fill, track)).toBeCloseTo(0, 1);
      expect(fill.getBoundingClientRect().width).toBeCloseTo(
        track.getBoundingClientRect().width * 0.4,
        0
      );
      expect(endOffset(fill, track)).toBeGreaterThan(0);
      // The label ends the line, and the words in it keep their order.
      const label = within(box).getByText('2 of 5 done');
      expect(endOffset(label, box)).toBeLessThan(startOffset(label, box));
      expectReadsLeftToRight(label.parentElement!);
    }
    expectMirrored(canvasElement, (box) => within(box).getByText('2 of 5 done'));
    expectMirrored(canvasElement, (box) => trackOf(box).firstElementChild);
  },
};

/** The parts of a segmented bar are laid out from the start edge, and the legend values keep their order. */
export const SegmentsAndLegendFollowTheDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <ProgressBar
        segments={[
          { value: 30, label: 'Documents', valueLabel: '1.5 MB' },
          { value: 20, label: 'Photos', valueLabel: '1.0 MB', intent: 'success' },
        ]}
        legend
        aria-label="Storage by type"
      />
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const track = trackOf(box);
      const [first, second] = [...track.querySelectorAll('[data-segment]')];
      expect(startOffset(first!, track)).toBeCloseTo(0, 1);
      expect(startOffset(second!, track)).toBeGreaterThan(startOffset(first!, track));
      const swatches = box.querySelectorAll('li > span[aria-hidden]');
      expect(startOffset(swatches[0]!, box)).toBeLessThan(startOffset(swatches[1]!, box));
      expectReadsLeftToRight(within(box).getByText('1.5 MB').parentElement!);
    }
    expectMirrored(canvasElement, (box) => within(box).getByText('Documents'));
  },
};

/**
 * The indeterminate bar enters at the start edge and leaves past the end one: its keyframes move
 * `inset-inline-start`, so the sweep is mirrored with the direction.
 */
export const IndeterminateBarSweepsTowardTheEnd: Story = {
  tags: ['!dev', '!autodocs'],
  // The story drives the animation itself: keep it running.
  parameters: { settleMotion: false },
  render: () => bothDirections(() => <ProgressBar indeterminate aria-label="Loading" />),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const track = trackOf(directionBox(canvasElement, dir));
      const bar = track.firstElementChild!;
      await waitFor(() => expect(bar.getAnimations().length).toBeGreaterThan(0));
      const sweep = bar.getAnimations()[0]!;
      sweep.pause();
      const duration = Number(sweep.effect!.getComputedTiming().duration);
      sweep.currentTime = 0;
      const width = track.getBoundingClientRect().width;
      // Starting: a third of the track before the start edge.
      expect(startOffset(bar, track), `${dir}: start of the sweep`).toBeLessThan(-width / 4);
      sweep.currentTime = duration - 1;
      // Ending: past the end edge.
      expect(startOffset(bar, track), `${dir}: end of the sweep`).toBeGreaterThan(width * 0.9);
      sweep.play();
    }
  },
};

/** The stripes of the fill move toward the end of the line: the other way round in right to left. */
export const StripesMoveTowardTheEnd: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => bothDirections(() => <ProgressBar value={60} striped aria-label="Syncing" />),
  play: ({ canvasElement }) => {
    const names = { ltr: 'progressStripes', rtl: 'progressStripesRtl' } as const;
    for (const dir of ['ltr', 'rtl'] as const) {
      const fill = trackOf(directionBox(canvasElement, dir)).firstElementChild!;
      expect(getComputedStyle(fill).animationName).toBe(names[dir]);
    }
  },
};
