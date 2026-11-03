import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  expectTextContrast,
  expectTextContrastOnTint,
  inEachTheme,
  mobileViewport,
} from '../storybook-helpers';
import type { Intent } from '../ui/intent';
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

/** `sm`, `md` (the default) and `lg` tiles: a card, a section, a hero. */
export const Sizes: Story = {
  render: (args) => (
    <div className="space-y-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Countdown key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

/**
 * `variant="card"` is one bordered card with a caption over the clock, like `Clock`'s. The days
 * show while there are some, and leave once there are none.
 */
export const Card: Story = {
  args: { variant: 'card' },
  render: (args) => (
    <div className="grid max-w-xl gap-4 sm:grid-cols-2">
      <Countdown {...args} />
      <Countdown
        {...args}
        target={NOW + 4 * HOUR + 15 * MINUTE + 30 * SECOND}
        label="Sale ends in"
      />
    </div>
  ),
};

/** `units` picks the tiles. Without days, 2 days 4 hours read 52 hours. */
export const HidingDays: Story = {
  render: (args) => (
    <div className="space-y-4">
      <Countdown {...args} units={['hours', 'minutes', 'seconds']} />
      <Countdown {...args} variant="card" units={['hours', 'minutes', 'seconds']} />
    </div>
  ),
};

/**
 * `intent` colors the count, and `urgentBelow` (seconds) turns it `danger` for the last stretch:
 * here a `warning` countdown goes red in its last hour.
 */
export const Urgent: Story = {
  render: (args) => (
    <div className="space-y-4">
      <Countdown {...args} intent="warning" urgentBelow={HOUR / SECOND} />
      <Countdown
        {...args}
        intent="warning"
        urgentBelow={HOUR / SECOND}
        target={NOW + 20 * MINUTE + 5 * SECOND}
      />
      <Countdown
        {...args}
        variant="card"
        intent="warning"
        urgentBelow={HOUR / SECOND}
        target={NOW + 20 * MINUTE + 5 * SECOND}
        label="Session expires in"
      />
    </div>
  ),
};

/** Every `intent`, on the tiles and the card. */
export const Intents: Story = {
  render: (args) => (
    <div className="space-y-6">
      {(['neutral', 'brand', 'info', 'success', 'warning', 'danger'] as const).map((intent) => (
        <div key={intent} className="grid items-start gap-4 sm:grid-cols-[2fr_1fr]">
          <Countdown {...args} intent={intent} size="sm" />
          <Countdown {...args} variant="card" intent={intent} label={intent} />
        </div>
      ))}
    </div>
  ),
};

/** `variant="display"` is for a wall screen or a kiosk: huge digits, centred. */
export const Display: Story = {
  args: { variant: 'display', label: 'Doors open in' },
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
};

export const MobileChecks: Story = {
  ...Mobile,
  tags: ['!dev', '!autodocs'],
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

// ── Sizes, card, display, units and intent ───────────────────────────────────

const rect = (el: Element) => el.getBoundingClientRect();
const fontSize = (el: Element) => parseFloat(getComputedStyle(el).fontSize);

/** The test of `Sizes`, hidden: the tiles grow with `size`, and `md` is what the tiles always were. */
export const SizesGrowTheTiles: Story = {
  ...Sizes,
  tags: ['!dev', '!autodocs'],
  play: ({ canvasElement }) => {
    const timers = canvasElement.querySelectorAll('[role="timer"]');
    const [sm, md, lg] = [...timers].map((timer) => {
      const tile = timer.firstElementChild!;
      return { height: rect(tile).height, digits: fontSize(tile.firstElementChild!) };
    });
    expect(sm!.height).toBeLessThan(md!.height);
    expect(md!.height).toBeLessThan(lg!.height);
    expect(sm!.digits).toBeLessThan(md!.digits);
    expect(md!.digits).toBeLessThan(lg!.digits);
    // `md`: text-2xl, then text-4xl from `sm` up (the test window is wider than 640px).
    expect(md!.digits).toBe(36);
    // Four tiles of one width, whatever the size.
    for (const timer of timers) {
      const widths = [...timer.children].map((tile) => Math.round(rect(tile).width));
      expect(new Set(widths).size).toBe(1);
      expect(widths).toHaveLength(4);
    }
  },
};

/** The test of `Card`, hidden: the caption over the clock, in a bordered card, days only while there are some. */
export const CardReadsAsAClock: Story = {
  ...Card,
  tags: ['!dev', '!autodocs'],
  play: ({ canvas }) => {
    const [first, second] = canvas.getAllByRole('timer');
    expect(first!.textContent).toBe('Ends in2d 04:15:30');
    // Under a day the days are gone, and the caption is the one given.
    expect(second!.textContent).toBe('Sale ends in04:15:30');
    const caption = canvas.getByText('Ends in');
    const clock = canvas.getByText('2d 04:15:30');
    expect(rect(caption).bottom).toBeLessThanOrEqual(rect(clock).top);
    expect(getComputedStyle(first!).borderTopWidth).toBe('1px');
    expect(getComputedStyle(clock).fontVariantNumeric).toContain('tabular-nums');
    expect(first!.getAttribute('aria-label')).toBe('2 days 4 hours 15 minutes 30 seconds');
    expect(second!.getAttribute('aria-label')).toBe('4 hours 15 minutes 30 seconds');
  },
};

/** The test of `HidingDays`, hidden: three tiles, the hours take the days. */
export const UnitsRollTheDaysIntoTheHours: Story = {
  ...HidingDays,
  tags: ['!dev', '!autodocs'],
  play: ({ canvas }) => {
    const [tiles, card] = canvas.getAllByRole('timer');
    expect(tiles!.children).toHaveLength(3);
    expect(within(tiles!).queryByText('Days')).toBeNull();
    // 2 days and 4 hours.
    expect(within(tiles!).getByText('52').nextElementSibling?.textContent).toBe('Hours');
    expect(card!.textContent).toBe('Ends in52:15:30');
  },
};

/**
 * The test of `Urgent`, hidden: under `urgentBelow` seconds the digits take the `danger` color,
 * from it up they keep the `intent`'s. The probes are the two colors written out.
 */
export const UrgentBelowTurnsTheCountDanger: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div>
      <span data-probe="danger" className="text-red-700 dark:text-red-400" />
      <span data-probe="warning" className="text-amber-700 dark:text-amber-400" />
      <div data-case="far">
        <Countdown
          {...args}
          variant="card"
          intent="warning"
          urgentBelow={600}
          target={NOW + 601 * SECOND}
        />
      </div>
      <div data-case="edge">
        <Countdown
          {...args}
          variant="card"
          intent="warning"
          urgentBelow={600}
          target={NOW + 600 * SECOND}
        />
      </div>
      <div data-case="near">
        <Countdown
          {...args}
          variant="card"
          intent="warning"
          urgentBelow={600}
          target={NOW + 599 * SECOND}
        />
      </div>
      <div data-case="over">
        <Countdown {...args} variant="card" intent="warning" target={NOW + 5 * SECOND} />
      </div>
    </div>
  ),
  play: ({ canvasElement }) => {
    const root = canvasElement;
    const colour = (probe: string) =>
      getComputedStyle(root.querySelector(`[data-probe="${probe}"]`)!).color;
    const digits = (id: string) =>
      getComputedStyle(root.querySelector(`[data-case="${id}"] [role="timer"] > span:last-child`)!)
        .color;
    inEachTheme(() => {
      expect(digits('far')).toBe(colour('warning'));
      // `urgentBelow` is a strict bound: exactly 600 seconds left is not urgent yet.
      expect(digits('edge')).toBe(colour('warning'));
      expect(digits('near')).toBe(colour('danger'));
      // Without `urgentBelow` the count never turns.
      expect(digits('over')).toBe(colour('warning'));
    });
  },
};

/** Every intent reads on its own tint, in the four themes, on the tiles and the card. */
export const IntentsReadInEveryTheme: Story = {
  ...Intents,
  tags: ['!dev', '!autodocs'],
  play: ({ canvasElement }) => {
    inEachTheme(() => {
      for (const timer of canvasElement.querySelectorAll('[role="timer"]')) {
        for (const text of timer.querySelectorAll('span')) expectTextContrastOnTint(text);
      }
    });
  },
};

/** `intent` tints the tile and the card with the color of the intent, and leaves `neutral` as it was. */
export const IntentTintsTheBox: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div>
      {(['neutral', 'danger'] as const).map((intent: Intent) => (
        <div key={intent} data-case={intent}>
          <Countdown {...args} intent={intent} />
        </div>
      ))}
    </div>
  ),
  play: ({ canvasElement }) => {
    const tile = (id: string) =>
      canvasElement.querySelector(`[data-case="${id}"] [role="timer"] > div`)!;
    expect(getComputedStyle(tile('neutral')).backgroundColor).not.toBe(
      getComputedStyle(tile('danger')).backgroundColor
    );
    expect(getComputedStyle(tile('danger')).borderTopColor).not.toBe(
      getComputedStyle(tile('neutral')).borderTopColor
    );
  },
};

/** At zero the card says so in place of its caption, and keeps its zeros. */
export const EndedCardSaysSo: Story = {
  tags: ['!dev', '!autodocs'],
  args: { variant: 'card', target: NOW - DAY },
  play: ({ canvas }) => {
    expect(canvas.getByRole('timer').textContent).toBe('Ended00:00:00');
  },
};

/** `card` and `display` are timers named by the full count, like `compact`. */
export const CardAndDisplayAreTimers: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="space-y-3">
      <Countdown {...args} variant="card" />
      <Countdown {...args} variant="display" label={null} />
    </div>
  ),
  play: ({ canvas }) => {
    const timers = canvas.getAllByRole('timer');
    expect(timers).toHaveLength(2);
    for (const timer of timers) {
      expect(timer.closest('[aria-live]:not([aria-live="off"])')).toBeNull();
      expect(timer.getAttribute('aria-label')).toBe('2 days 4 hours 15 minutes 30 seconds');
    }
    // `label={null}` leaves no caption.
    expect(timers[1]!.textContent).toBe('2d 04:15:30');
  },
};

/** The test of `Display`, hidden: digits much larger than the card's, centred, and it reads in every theme. */
export const DisplayIsHuge: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="space-y-3">
      <Countdown {...args} variant="card" />
      <Countdown {...args} variant="display" />
    </div>
  ),
  play: ({ canvas }) => {
    const [card, display] = canvas.getAllByRole('timer');
    const digits = (timer: Element) => timer.lastElementChild!;
    expect(fontSize(digits(display!))).toBeGreaterThanOrEqual(fontSize(digits(card!)) * 1.5);
    expect(getComputedStyle(display!).alignItems).toBe('center');
    inEachTheme(() => {
      expectTextContrast(digits(display!));
      expectTextContrast(display!.firstElementChild!);
    });
  },
};

/** At 375px the card, the display and the large tiles stay in the page. */
export const WideFormsFitThePhone: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  args: {
    target: NOW + 123 * DAY + 4 * HOUR,
    labels: { days: 'Jours', hours: 'Heures', minutes: 'Minutes', seconds: 'Secondes' },
  },
  render: (args) => (
    <div className="space-y-4">
      <Countdown {...args} size="lg" />
      <Countdown {...args} variant="card" />
      <Countdown {...args} variant="display" />
    </div>
  ),
  play: async () => {
    expectNoHorizontalOverflow();
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
        <Countdown {...args} variant="card" />
        <Countdown {...args} variant="display" />
      </div>
    )),
  play: ({ canvasElement }) => {
    for (const box of canvasElement.querySelectorAll<HTMLElement>('[data-direction]')) {
      for (const clock of within(box).getAllByText('2d 04:15:30')) expectReadsLeftToRight(clock);
      expectReadsLeftToRight(within(box).getByText('2d 4h'));
    }
  },
};
