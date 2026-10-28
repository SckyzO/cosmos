import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  expectTextContrast,
  inEachTheme,
  mobileViewport,
} from '../storybook-helpers';
import { Countdown } from './Countdown';

const NOW = Date.parse('2026-01-15T12:00:00Z');
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
// 2 days, 4 hours, 15 minutes and 30 seconds after NOW.
const TARGET = NOW + 2 * DAY + 4 * HOUR + 15 * MINUTE + 30 * SECOND;

const meta = {
  title: 'Data/Countdown',
  component: Countdown,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { target: TARGET, now: NOW },
} satisfies Meta<typeof Countdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tiles: Story = { args: { variant: 'tiles' } };

export const Inline: Story = {
  args: { variant: 'inline' },
  render: (args) => (
    <p className="text-sm">
      <Countdown {...args} />
    </p>
  ),
};

export const Compact: Story = {
  args: { variant: 'compact' },
  render: (args) => (
    <p className="text-sm text-gray-700 dark:text-gray-300">
      Starts in <Countdown {...args} />
    </p>
  ),
};

/** Under a day the compact form is the clock; under an hour the inline one drops to minutes. */
export const Shorter: Story = {
  render: (args) => (
    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
      <p>
        <Countdown {...args} variant="inline" target={NOW + 4 * HOUR + 15 * MINUTE + 30 * SECOND} />
      </p>
      <p>
        <Countdown {...args} variant="inline" target={NOW + 15 * MINUTE + 30 * SECOND} />
      </p>
      <p>
        <Countdown {...args} variant="inline" target={NOW + 30 * SECOND} />
      </p>
      <p>
        <Countdown
          {...args}
          variant="compact"
          target={NOW + 4 * HOUR + 15 * MINUTE + 30 * SECOND}
        />
      </p>
    </div>
  ),
};

/** `labels`, `shortLabels`, `label` and `completedLabel` put it in another language. */
export const French: Story = {
  render: (args) => {
    const fr = {
      labels: { days: 'Jours', hours: 'Heures', minutes: 'Minutes', seconds: 'Secondes' },
      shortLabels: { days: 'j', hours: 'h', minutes: 'min', seconds: 's' },
    };
    return (
      <div className="space-y-4">
        <Countdown {...args} {...fr} />
        <p className="text-sm">
          <Countdown {...args} {...fr} variant="inline" label="Se termine dans" />
        </p>
        <p className="text-sm">
          <Countdown {...args} {...fr} variant="compact" />
        </p>
        <p className="text-sm">
          <Countdown
            {...args}
            {...fr}
            variant="inline"
            target={NOW - SECOND}
            completedLabel="Terminé"
          />
        </p>
      </div>
    );
  },
};

/** Once it has reached zero it stops, and says so. */
export const Ended: Story = {
  render: (args) => (
    <div className="space-y-4">
      <Countdown {...args} target={NOW - DAY} />
      <p className="text-sm">
        <Countdown {...args} target={NOW - DAY} variant="inline" />
      </p>
      <p className="text-sm">
        <Countdown {...args} target={NOW - DAY} variant="compact" />
      </p>
    </div>
  ),
};

/** A coming-soon page is a heading, the tiles and a line: no component of its own. */
export const ComingSoon: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-16 text-center">
      <p className="text-brand-600 dark:text-brand-400 text-sm font-semibold tracking-wider uppercase">
        Launch day
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
        We are almost there
      </h1>
      <p className="text-gray-500 dark:text-gray-400">
        The new console is nearly ready. This page opens it the moment the countdown ends.
      </p>
      <div className="w-full">
        <Countdown {...args} />
      </div>
    </div>
  ),
};

/** Against the clock of the page, to a target 25 seconds away. */
export const Live: Story = {
  // The picture depends on how long it has been running.
  tags: ['no-capture'],
  args: { now: undefined, variant: 'tiles' },
  render: (args) => {
    const [target] = useState(() => Date.now() + 25 * SECOND);
    return <Countdown {...args} target={target} />;
  },
};

/** The four tiles share the width and shrink their digits and captions at 375px. */
export const Mobile: Story = {
  globals: mobileViewport,
  args: {
    target: NOW + 123 * DAY + 4 * HOUR,
    labels: { days: 'Jours', hours: 'Heures', minutes: 'Minutes', seconds: 'Secondes' },
  },
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

/** `timer`s that are not live regions, in the three forms. */
export const IsATimerNotALiveRegion: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="space-y-3">
      <Countdown {...args} variant="tiles" />
      <Countdown {...args} variant="inline" />
      <Countdown {...args} variant="compact" />
    </div>
  ),
  play: async ({ canvas }) => {
    const timers = canvas.getAllByRole('timer');
    expect(timers).toHaveLength(3);
    for (const timer of timers) {
      expect(timer.closest('[aria-live]:not([aria-live="off"])')).toBeNull();
      expect(timer.querySelector('[aria-live]:not([aria-live="off"])')).toBeNull();
    }
    // The compact one has no text a screen reader can use in "02:04:15", so it carries the full count.
    expect(timers[2]!.getAttribute('aria-label')).toBe('2 days 4 hours 15 minutes 30 seconds');
  },
};

/** The parts, the forms and the contrast, in every theme. */
export const PartsAndThemes: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="space-y-3">
      <Countdown {...args} variant="tiles" />
      <p data-testid="inline" className="text-sm">
        <Countdown {...args} variant="inline" />
      </p>
      <p data-testid="compact" className="text-sm">
        <Countdown {...args} variant="compact" />
      </p>
    </div>
  ),
  play: async ({ canvas }) => {
    for (const [value, caption] of [
      ['02', 'Days'],
      ['04', 'Hours'],
      ['15', 'Minutes'],
      ['30', 'Seconds'],
    ] as const) {
      const digits = canvas.getByText(value);
      expect(digits.nextElementSibling?.textContent).toBe(caption);
      expect(getComputedStyle(digits).fontVariantNumeric).toContain('tabular-nums');
    }
    expect(canvas.getByTestId('inline').textContent).toBe('Ends in 2d 4h');
    expect(canvas.getByTestId('compact').textContent).toBe('2d 04:15:30');
    inEachTheme(() => {
      expectTextContrast(canvas.getByText('02'));
      expectTextContrast(canvas.getByText('Days'));
      expectTextContrast(canvas.getByText('2d 4h'));
      expectTextContrast(canvas.getByText('Ends in', { exact: false }));
    });
  },
};

/** Frozen with `now`, it neither ticks nor completes before its time. */
export const FrozenNowDoesNotTick: Story = {
  tags: ['!dev', '!autodocs'],
  args: { variant: 'compact', onComplete: fn() },
  play: async ({ canvas, args }) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(canvas.getByRole('timer').textContent).toBe('2d 04:15:30');
    expect(args.onComplete).not.toHaveBeenCalled();
  },
};

/** At zero it calls `onComplete` once, shows zeros and stops. */
export const CallsOnCompleteOnceAndStops: Story = {
  tags: ['!dev', '!autodocs'],
  args: { now: undefined, variant: 'compact', onComplete: fn() },
  render: (args) => {
    const [target] = useState(() => Date.now() + 1500);
    return <Countdown {...args} target={target} />;
  },
  play: async ({ canvas, args }) => {
    const timer = canvas.getByRole('timer');
    expect(args.onComplete).not.toHaveBeenCalled();
    expect(timer.textContent).toMatch(/^00:00:0[12]$/);
    await waitFor(() => expect(args.onComplete).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(timer.textContent).toBe('00:00:00');
    // It stays at zero, and does not call again.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(timer.textContent).toBe('00:00:00');
    expect(args.onComplete).toHaveBeenCalledTimes(1);
  },
};

/** A target already past completes at once, once. */
export const CompletesAtOnceWhenPast: Story = {
  tags: ['!dev', '!autodocs'],
  args: { target: NOW - SECOND, variant: 'inline', onComplete: fn() },
  play: async ({ canvas, args }) => {
    expect(canvas.getByRole('timer').textContent).toBe('Ended');
    await waitFor(() => expect(args.onComplete).toHaveBeenCalledTimes(1));
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The compact and inline forms keep their order ("2d 04:15:30") in a right-to-left page. */
export const PartsReadLeftToRightInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) =>
    bothDirections(() => (
      <div className="space-y-2">
        <Countdown {...args} variant="compact" />
        <Countdown {...args} variant="inline" label="Ends in" />
      </div>
    )),
  play: ({ canvasElement }) => {
    for (const box of canvasElement.querySelectorAll<HTMLElement>('[data-direction]')) {
      expectReadsLeftToRight(within(box).getByText('2d 04:15:30'));
      expectReadsLeftToRight(within(box).getByText('2d 4h'));
    }
  },
};
