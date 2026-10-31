import type { Meta, StoryObj } from '@storybook/react-vite';
import { Profiler, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  expectTextContrast,
  inEachTheme,
  mobileViewport,
} from '../storybook-helpers';
import { RelativeTime } from './RelativeTime';

// The captures and the docs read the same: every picture is against this moment.
const NOW = Date.parse('2026-01-15T12:00:00Z');
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const meta = {
  title: 'Data/Relative Time',
  component: RelativeTime,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: NOW - 5 * MINUTE, now: NOW, locale: 'en-US' },
} satisfies Meta<typeof RelativeTime>;

export default meta;
type Story = StoryObj<typeof meta>;

const ages = [
  0,
  -30 * SECOND,
  -MINUTE,
  -5 * MINUTE,
  -3 * HOUR,
  -DAY,
  -3 * DAY,
  -2 * 7 * DAY,
  -60 * DAY,
  -400 * DAY,
  2 * HOUR,
  DAY,
  4 * DAY,
];

export const Default: Story = {};

/** From the second to the year; `numeric: 'auto'` gives "now" and "yesterday". */
export const Scale: Story = {
  render: (args) => (
    <ul className="space-y-1 text-sm text-gray-900 dark:text-white">
      {ages.map((age) => (
        <li key={age}>
          <RelativeTime {...args} value={NOW + age} />
        </li>
      ))}
    </ul>
  ),
};

/** The language follows `locale`. */
export const Locales: Story = {
  render: (args) => (
    <ul className="space-y-1 text-sm text-gray-900 dark:text-white">
      {['en-US', 'fr-FR', 'es-ES', 'de-DE'].map((locale) => (
        <li key={locale} className="flex gap-4">
          <span className="w-16 text-gray-500 dark:text-gray-400">{locale}</span>
          <RelativeTime {...args} locale={locale} value={NOW - 3 * DAY} />
          <RelativeTime {...args} locale={locale} value={NOW + 2 * HOUR} />
        </li>
      ))}
    </ul>
  ),
};

/**
 * `tooltip` gives the full date and zone, in the zone you pick. The `<time>` becomes a tab stop:
 * use it for a date a reader may ask about, not for every row of a log.
 */
export const WithTooltip: Story = {
  args: { tooltip: true, timeZone: 'Asia/Tokyo', locale: 'fr-FR' },
};

/** The use it is made for: a line of an activity feed. */
export const InAFeed: Story = {
  render: (args) => (
    <ul className="max-w-sm divide-y divide-gray-200 text-sm dark:divide-gray-800">
      {[
        ['server-prod-01 marked CRIT', NOW - 5 * MINUTE],
        ['New alert escalated', NOW - 12 * MINUTE],
        ['db-primary recovered', NOW - 3 * HOUR],
        ['Maintenance window started', NOW - 26 * HOUR],
      ].map(([title, at]) => (
        <li key={title} className="flex justify-between gap-3 py-2 text-gray-900 dark:text-white">
          <span className="min-w-0">{title}</span>
          <RelativeTime
            {...args}
            value={at as number}
            className="text-gray-500 dark:text-gray-400"
          />
        </li>
      ))}
    </ul>
  ),
};

/**
 * Live, against the clock of the page: "58 seconds ago" reads "1 minute ago" two seconds later,
 * with no frozen `now`. Every instance shares one timer.
 */
export const Live: Story = {
  // The picture depends on how long it has been running.
  tags: ['no-capture'],
  args: { now: undefined },
  render: (args) => {
    const [start] = useState(() => Date.now());
    return (
      <ul className="space-y-1 text-sm text-gray-900 dark:text-white">
        <li>
          <RelativeTime {...args} value={start - 58 * SECOND} />
        </li>
        <li>
          <RelativeTime {...args} value={start} />
        </li>
        <li>
          <RelativeTime {...args} value={start + 10 * SECOND} />
        </li>
      </ul>
    );
  },
};

export const Mobile: Story = {
  globals: mobileViewport,
  args: { tooltip: true, locale: 'fr-FR', value: NOW - 400 * DAY },
};

export const MobileChecks: Story = {
  ...Mobile,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

/** It is a `<time>` with the ISO `dateTime` of the value, readable in every theme. */
export const RendersTimeElement: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    // The text sits in a `<bdi>` inside the `<time>`.
    const time = canvas.getByText('5 minutes ago').closest('time')!;
    expect(time.tagName).toBe('TIME');
    expect(time.getAttribute('dateTime')).toBe(new Date(NOW - 5 * MINUTE).toISOString());
    expect(time.hasAttribute('tabindex')).toBe(false);
    inEachTheme(() => expectTextContrast(time));
  },
};

/** Frozen with `now`, it never moves; it still starts from the value. */
export const FrozenNowSetsNoTimer: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: NOW - 58 * SECOND },
  play: async ({ canvas }) => {
    expect(canvas.getByText('58 seconds ago')).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 2200));
    expect(canvas.getByText('58 seconds ago')).toBeInTheDocument();
  },
};

/** The text moves on by itself: 58 seconds ago becomes "1 minute ago" within two seconds. */
export const RefreshesWhenTheTextChanges: Story = {
  tags: ['!dev', '!autodocs'],
  args: { now: undefined },
  render: (args) => {
    const [start] = useState(() => Date.now());
    return <RelativeTime {...args} value={start - 58_200} />;
  },
  play: async ({ canvas }) => {
    expect(canvas.getByText(/^5\d seconds ago$/)).toBeInTheDocument();
    await waitFor(() => expect(canvas.getByText('1 minute ago')).toBeInTheDocument(), {
      timeout: 3000,
    });
  },
};

// Commits of the profiled tree below: a state in the story itself would re-render what it counts.
const commits = { count: 0 };

/** An old date wakes rarely: two hours ago is not re-rendered while the story waits two seconds. */
export const RendersOnlyWhenTheTextChanges: Story = {
  tags: ['!dev', '!autodocs'],
  args: { now: undefined },
  render: (args) => {
    const [start] = useState(() => Date.now());
    commits.count = 0;
    return (
      <Profiler id="old" onRender={() => commits.count++}>
        <RelativeTime {...args} value={start - 2 * HOUR} />
      </Profiler>
    );
  },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText('2 hours ago')).toBeInTheDocument());
    const before = commits.count;
    expect(before).toBeGreaterThan(0);
    await new Promise((resolve) => setTimeout(resolve, 2200));
    expect(commits.count).toBe(before);
  },
};

/** With a tooltip the `<time>` takes focus and the tooltip gives the full date in the asked zone. */
export const TooltipOnFocus: Story = {
  tags: ['!dev', '!autodocs'],
  args: { tooltip: true, timeZone: 'Asia/Tokyo', locale: 'en-US' },
  play: async ({ canvas }) => {
    await userEvent.tab();
    expect(canvas.getByText('5 minutes ago').closest('time')).toHaveFocus();
    const tooltip = await within(document.body).findByRole('tooltip');
    expect(tooltip.textContent?.replace(/\s/g, ' ')).toBe(
      'Thursday, January 15, 2026 at 8:55:00 PM GMT+9'
    );
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** "5 minutes ago" keeps its order in a right-to-left page. */
export const ValueReadsLeftToRightInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => bothDirections(() => <RelativeTime {...args} />),
  play: ({ canvasElement }) => {
    const times = canvasElement.querySelectorAll('time');
    expect(times).toHaveLength(2);
    for (const time of times) expectReadsLeftToRight(time);
  },
};
