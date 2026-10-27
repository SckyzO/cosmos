import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  beatsFrom,
  FLAPPING_BEATS,
  GAPPY_BEATS,
  MIXED_BEATS,
  UPTIME_NOW,
} from '../storybook-uptime';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { HeartbeatBar } from './HeartbeatBar';
import { BEAT_NAME, type BeatStatus } from './types';
import { beatName, fitCount, formatBeatTime } from './uptime';

const meta = {
  title: 'Monitoring/Heartbeat Bar',
  component: HeartbeatBar,
  parameters: portalDocsParams.md(),
  tags: ['autodocs'],
  args: { beats: MIXED_BEATS },
} satisfies Meta<typeof HeartbeatBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Thin bars, the default. The down beats are taller than the rest. */
export const Default: Story = {};

/** The `legend` writes the statuses, and what sets a down beat apart besides its colour. */
export const WithLegend: Story = { args: { legend: true } };

export const Blocks: Story = { args: { variant: 'blocks', legend: true } };

export const Dots: Story = { args: { variant: 'dots', legend: true } };

/** `size="sm"` is 24px high, the height inside a `MonitorRow`. */
export const Small: Story = { args: { size: 'sm' } };

/** Every variant at both heights. */
export const VariantsAndHeights: Story = {
  render: (args) => (
    <div className="space-y-5">
      {(['bars', 'blocks', 'dots'] as const).flatMap((variant) =>
        (['md', 'sm'] as const).map((size) => (
          <div key={`${variant}-${size}`} className="flex items-center gap-4">
            <span className="w-28 shrink-0 text-sm text-[var(--color-text-secondary)]">
              {variant} · {size === 'md' ? '32' : '24'} px
            </span>
            <HeartbeatBar
              {...args}
              beats={MIXED_BEATS.slice(-40)}
              variant={variant}
              size={size}
              ariaLabel={`${variant}, ${size}`}
            />
          </div>
        ))
      )}
    </div>
  ),
};

const EVERY_STATUS = beatsFrom('uuuuuuuuggggmmmmdddddpppp');

/** One of each status, in the three variants: colour, and for a down beat, shape. */
export const EveryStatus: Story = {
  render: (args) => (
    <div className="space-y-5">
      {(['bars', 'blocks', 'dots'] as const).map((variant) => (
        <HeartbeatBar
          key={variant}
          {...args}
          beats={EVERY_STATUS}
          variant={variant}
          legend
          ariaLabel={`Every status, ${variant}`}
        />
      ))}
    </div>
  ),
};

/** A monitor that keeps going down and coming back. */
export const Flapping: Story = { args: { beats: FLAPPING_BEATS, legend: true } };

/** Long gaps: checks that did not run (pending) stand as stubs, between answers. */
export const LongGaps: Story = { args: { beats: GAPPY_BEATS, legend: true } };

/** Fewer beats than the width holds: the bar is as long as the history. */
export const FewBeats: Story = { args: { beats: MIXED_BEATS.slice(-8) } };

/** No check has run yet. */
export const NoBeats: Story = { args: { beats: [] } };

/** A narrow container keeps the newest beats and drops the oldest. */
export const NarrowContainer: Story = {
  render: (args) => (
    <div className="w-60">
      <HeartbeatBar {...args} />
    </div>
  ),
};

/** At 375px the bar keeps the latest history and the page does not scroll sideways. */
export const Mobile: Story = {
  globals: mobileViewport,
  args: { legend: true },
  play: ({ canvasElement }) => {
    expectNoHorizontalOverflow();
    const strip = canvasElement.querySelector<HTMLElement>('[role="group"]')!;
    const marks = strip.querySelectorAll('[role="img"]');
    expect(marks.length).toBeLessThan(MIXED_BEATS.length);
    expect(marks.length).toBe(fitCount(strip.clientWidth, 5, 3));
  },
};

export const MobileDots: Story = {
  ...Mobile,
  args: { variant: 'dots', legend: true },
  play: ({ canvasElement }) => {
    expectNoHorizontalOverflow();
    const strip = canvasElement.querySelector<HTMLElement>('[role="group"]')!;
    expect(strip.querySelectorAll('[role="img"]').length).toBe(fitCount(strip.clientWidth, 9, 5));
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

const marksOf = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[role="img"]')];

/** Resized narrower, the bar keeps the newest beats; wider again, it gets the older ones back. */
export const KeepsTheNewestBeatsWhenNarrow: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div data-testid="box" style={{ width: 600 }}>
      <HeartbeatBar {...args} />
    </div>
  ),
  play: async ({ canvasElement, canvas }) => {
    const box = canvas.getByTestId('box');
    const strip = canvas.getByRole('group');
    // 600px hold 75 beats: the whole history of 60 is drawn.
    await waitFor(() => expect(marksOf(canvasElement)).toHaveLength(MIXED_BEATS.length));

    box.style.width = '120px';
    await waitFor(() => expect(marksOf(canvasElement)).toHaveLength(fitCount(120, 5, 3)));
    const kept = marksOf(canvasElement);
    // The beats that stay are the last ones of the history, in order, ending on the newest.
    const names = kept.map((mark) => mark.getAttribute('aria-label'));
    await expect(names).toEqual(MIXED_BEATS.slice(-kept.length).map(beatName));
    await expect(strip).toHaveAccessibleName(new RegExp(`^Last ${kept.length} checks: `));
    await expect(strip.scrollWidth).toBeLessThanOrEqual(strip.clientWidth);

    box.style.width = '600px';
    await waitFor(() => expect(marksOf(canvasElement)).toHaveLength(MIXED_BEATS.length));
  },
};

const NARROW_BOX: Story['render'] = (args) => (
  <div style={{ width: 200 }}>
    <HeartbeatBar {...args} />
  </div>
);

/** One tab stop, on the newest beat; arrows, Home and End move between beats. */
export const KeyboardNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  render: NARROW_BOX,
  play: async ({ canvasElement, canvas }) => {
    const stops = () => canvasElement.querySelectorAll('[role="img"][tabindex="0"]');
    const marks = () => marksOf(canvasElement);
    await waitFor(() => expect(marks().length).toBeGreaterThan(3));
    await expect(stops()).toHaveLength(1);
    await expect(stops()[0]).toBe(marks().at(-1));

    await userEvent.tab();
    await expect(marks().at(-1)).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    await expect(marks().at(-2)).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(marks().at(-1)).toHaveFocus();
    // The ends stop the arrows.
    await userEvent.keyboard('{ArrowRight}');
    await expect(marks().at(-1)).toHaveFocus();

    await userEvent.keyboard('{Home}');
    await expect(marks()[0]).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(marks()[0]).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(marks().at(-1)).toHaveFocus();

    // The tab stop followed the focus: still one.
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await expect(stops()).toHaveLength(1);
    await expect(stops()[0]).toBe(marks().at(-3));

    // Tab leaves the bar, and coming back lands on the beat it remembered.
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
    await userEvent.tab({ shift: true });
    await expect(marks().at(-3)).toHaveFocus();
    await expect(canvas.getByRole('group')).toBeVisible();
  },
};

/** Focusing or hovering a beat shows its time, status, latency and message; Escape hides it. */
export const TooltipOnABeat: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    beats: [
      ...beatsFrom('uuu'),
      { time: UPTIME_NOW, status: 'down', latency: 5003, message: 'Timeout after 5 s' },
    ],
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.queryByRole('tooltip')).toBeNull();

    await userEvent.tab();
    const tip = await body.findByRole('tooltip');
    await expect(tip).toHaveTextContent('Down');
    await expect(tip).toHaveTextContent(formatBeatTime(UPTIME_NOW));
    await expect(tip).toHaveTextContent('5,003 ms');
    await expect(tip).toHaveTextContent('Timeout after 5 s');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('tooltip')).toBeNull());

    // The pointer shows it too, on the beat under it.
    const marks = marksOf(canvasElement);
    await userEvent.hover(marks[1]!);
    await expect(await body.findByRole('tooltip')).toHaveTextContent('Up');
    await userEvent.unhover(marks[1]!);
    await waitFor(() => expect(body.queryByRole('tooltip')).toBeNull());
  },
};

/** Every status is in the name of its beat and in the legend, whatever its colour. */
export const StatusesReadWithoutColour: Story = {
  tags: ['!dev', '!autodocs'],
  args: { beats: EVERY_STATUS, legend: true, variant: 'blocks' },
  play: async ({ canvas, canvasElement }) => {
    const statuses = ['up', 'degraded', 'maintenance', 'down', 'pending'] as const;
    for (const status of statuses) {
      const beat = EVERY_STATUS.find((b) => b.status === status)!;
      await expect(
        canvas.getAllByRole('img', { name: new RegExp(`^${BEAT_NAME[beat.status]}, `) }).length
      ).toBeGreaterThan(0);
    }
    const legend = within(canvas.getByRole('list', { name: 'Legend' }));
    for (const status of Object.keys(BEAT_NAME) as BeatStatus[]) {
      await expect(legend.getByText(new RegExp(`^${BEAT_NAME[status]}`))).toBeVisible();
    }
    await expect(legend.getByText('Down (crossed block)')).toBeVisible();
    // A down beat has a shape of its own: the cross, a block of the others has not.
    const blocks = marksOf(canvasElement);
    const down = blocks.find((m) => m.getAttribute('aria-label')?.startsWith('Down'))!;
    const up = blocks.find((m) => m.getAttribute('aria-label')?.startsWith('Up'))!;
    await expect(getComputedStyle(down).backgroundImage).toContain('linear-gradient');
    await expect(getComputedStyle(up).backgroundImage).toBe('none');
  },
};

/** A down bar is taller than an up bar; a down dot is square where the others are round. */
export const DownBeatsDifferByShape: Story = {
  tags: ['!dev', '!autodocs'],
  args: { beats: beatsFrom('uudu'), variant: 'bars' },
  play: async ({ canvasElement }) => {
    const heights = () => marksOf(canvasElement).map((m) => m.getBoundingClientRect().height);
    await waitFor(() => expect(heights()).toHaveLength(4));
    const [up, , down] = heights() as [number, number, number];
    await expect(down).toBeGreaterThan(up);
  },
};

export const DownDotIsSquare: Story = {
  tags: ['!dev', '!autodocs'],
  args: { beats: beatsFrom('uudu'), variant: 'dots' },
  play: async ({ canvasElement }) => {
    const [up, , down] = marksOf(canvasElement) as [HTMLElement, HTMLElement, HTMLElement];
    await expect(getComputedStyle(up).borderTopLeftRadius).not.toBe(
      getComputedStyle(down).borderTopLeftRadius
    );
    await expect(parseFloat(getComputedStyle(down).borderTopLeftRadius)).toBeLessThan(3);
  },
};
