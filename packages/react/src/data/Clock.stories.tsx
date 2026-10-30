import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  expectTextContrast,
  inEachTheme,
  mobileViewport,
} from '../storybook-helpers';
import { Clock } from './Clock';

// 15 January 2026, 14:05:09 UTC: the captures and the docs read the same.
const NOW = Date.parse('2026-01-15T14:05:09Z');

const meta = {
  title: 'Data/Clock',
  component: Clock,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { now: NOW, timeZone: 'UTC', locale: 'en-US' },
} satisfies Meta<typeof Clock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {
  args: { variant: 'inline', label: 'UTC', showDate: true },
  render: (args) => (
    <p className="text-sm text-gray-700 dark:text-gray-300">
      Server time <Clock {...args} />
    </p>
  ),
};

/** A dashboard widget: the zone, the time and the date. */
export const Card: Story = {
  args: {
    variant: 'card',
    label: 'Paris',
    timeZone: 'Europe/Paris',
    locale: 'fr-FR',
    showDate: true,
  },
  render: (args) => (
    <div className="max-w-xs">
      <Clock {...args} />
    </div>
  ),
};

/** Large, for a wall or a kiosk page. */
export const Display: Story = {
  args: {
    variant: 'display',
    label: 'Tokyo',
    timeZone: 'Asia/Tokyo',
    hour12: false,
    showDate: true,
  },
};

export const TwelveHour: Story = {
  args: { variant: 'card', label: 'New York', timeZone: 'America/New_York', hour12: true },
  render: (args) => (
    <div className="max-w-xs">
      <Clock {...args} />
    </div>
  ),
};

/** Without seconds the clock ticks once a minute, on the minute. */
export const WithoutSeconds: Story = {
  args: { variant: 'card', label: 'London', timeZone: 'Europe/London', showSeconds: false },
  render: (args) => (
    <div className="max-w-xs">
      <Clock {...args} />
    </div>
  ),
};

/** The same instant in three locales: the 24-hour clock, the order of the date and its language. */
export const Locales: Story = {
  args: { variant: 'card', showDate: true },
  render: (args) => (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
      {['en-US', 'fr-FR', 'de-DE'].map((locale) => (
        <Clock {...args} key={locale} locale={locale} label={locale} />
      ))}
    </div>
  ),
};

/** A world clock is a grid of `Clock`s, each named by its zone. */
export const WorldClock: Story = {
  args: { variant: 'card', showSeconds: false, hour12: false, showDate: true },
  render: (args) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ['San Francisco', 'America/Los_Angeles'],
        ['New York', 'America/New_York'],
        ['Paris', 'Europe/Paris'],
        ['Tokyo', 'Asia/Tokyo'],
      ].map(([label, timeZone]) => (
        <Clock {...args} key={timeZone} label={label} timeZone={timeZone} />
      ))}
    </div>
  ),
};

/** Against the clock of the page: the seconds tick on the boundary. */
export const Live: Story = {
  // The picture depends on how long it has been running.
  tags: ['no-capture'],
  args: {
    variant: 'card',
    now: undefined,
    timeZone: undefined,
    label: 'Local time',
    showDate: true,
  },
  render: (args) => (
    <div className="max-w-xs">
      <Clock {...args} />
    </div>
  ),
};

/** At 375px the display clock shrinks to fit and the cards stack. */
export const Mobile: Story = {
  globals: mobileViewport,
  args: {
    variant: 'display',
    label: 'Tokyo',
    timeZone: 'Asia/Tokyo',
    hour12: true,
    showDate: true,
  },
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

/** In a line the clock is phrasing content: a `<div>` is invalid inside the paragraph. */
export const InlineSitsInAParagraph: Story = {
  tags: ['!dev', '!autodocs'],
  args: { variant: 'inline', label: 'UTC', showDate: true },
  render: Inline.render,
  play: async ({ canvas }) => {
    const timer = canvas.getByRole('timer');
    const paragraph = timer.closest('p');
    expect(paragraph).not.toBeNull();
    expect(timer.tagName).toBe('SPAN');
    expect(paragraph?.querySelector('div')).toBeNull();
  },
};

/** A `timer`, not a live region: a screen reader does not read the seconds. */
export const IsATimerNotALiveRegion: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-3">
      <Clock now={NOW} timeZone="UTC" label="inline" />
      <Clock now={NOW} timeZone="UTC" variant="card" label="card" />
      <Clock now={NOW} timeZone="UTC" variant="display" label="display" />
    </div>
  ),
  play: async ({ canvas }) => {
    const timers = canvas.getAllByRole('timer');
    expect(timers).toHaveLength(3);
    for (const timer of timers) {
      expect(timer.closest('[aria-live]:not([aria-live="off"])')).toBeNull();
      expect(timer.querySelector('[aria-live]:not([aria-live="off"])')).toBeNull();
      expect(timer.closest('[role="status"], [role="alert"], [role="log"]')).toBeNull();
    }
  },
};

/** The digits are tabular and the time reads right in a zone, in every theme. */
export const FormatsAndThemes: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-3">
      <Clock now={NOW} timeZone="Asia/Tokyo" locale="fr-FR" variant="card" label="Tokyo" showDate />
      <Clock
        now={NOW}
        timeZone="America/New_York"
        locale="en-US"
        variant="card"
        label="NYC"
        hour12
      />
    </div>
  ),
  play: async ({ canvas }) => {
    expect(canvas.getByText('23:05:09')).toBeInTheDocument();
    expect(canvas.getByText('jeudi 15 janvier 2026')).toBeInTheDocument();
    expect(canvas.getByText(/^09:05:09\sAM$/)).toBeInTheDocument();
    const time = canvas.getByText('23:05:09');
    expect(getComputedStyle(time).fontVariantNumeric).toContain('tabular-nums');
    inEachTheme(() => {
      expectTextContrast(time);
      expectTextContrast(canvas.getByText('Tokyo'));
      expectTextContrast(canvas.getByText('jeudi 15 janvier 2026'));
    });
  },
};

/** With a frozen `now` the clock never ticks. */
export const FrozenNowDoesNotTick: Story = {
  tags: ['!dev', '!autodocs'],
  args: { variant: 'card' },
  play: async ({ canvas }) => {
    expect(canvas.getByText(/^02:05:09\sPM$/)).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(canvas.getByRole('timer').textContent).toContain('09');
  },
};

/** Live, the seconds change on their own, one step at a time. */
export const TicksEachSecond: Story = {
  tags: ['!dev', '!autodocs'],
  args: { now: undefined, timeZone: undefined, hour12: false },
  play: async ({ canvas }) => {
    const timer = canvas.getByRole('timer');
    const first = timer.textContent;
    await waitFor(() => expect(timer.textContent).not.toBe(first), { timeout: 2500 });
    const second = timer.textContent;
    await waitFor(() => expect(timer.textContent).not.toBe(second), { timeout: 2500 });
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** A clock reads the same in a right-to-left page: digits and AM/PM keep their order. */
export const TimeReadsLeftToRightInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) =>
    bothDirections(() => (
      <div className="space-y-2">
        <Clock {...args} showDate label="Tokyo" />
        <Clock {...args} variant="card" hour12={false} />
      </div>
    )),
  play: ({ canvasElement }) => {
    for (const box of canvasElement.querySelectorAll<HTMLElement>('[data-direction]')) {
      const twelve = within(box).getByText(/^02:05:09\sPM$/);
      expectReadsLeftToRight(twelve);
      expectReadsLeftToRight(within(box).getByText('14:05:09'));
    }
  },
};
