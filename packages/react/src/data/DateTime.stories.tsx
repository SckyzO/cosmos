import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarDays, Clock } from 'lucide-react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  expectTextContrast,
  expectTextContrastOnTint,
  inEachTheme,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';
import { DateTime } from './DateTime';

const meta = {
  title: 'Data/Date Time',
  component: DateTime,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: '2026-01-15T14:05:09Z', timeZone: 'UTC', locale: 'en-US' },
} satisfies Meta<typeof DateTime>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default `datetime` preset, in the given zone. */
export const Default: Story = {};

/** `date`, `time`, `datetime`, `long` and `full`. */
export const Presets: Story = {
  render: (args) => (
    <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-2 text-sm text-gray-900 dark:text-white">
      {(['date', 'time', 'datetime', 'long', 'full'] as const).map((format) => (
        <div key={format} className="contents">
          <dt className="text-gray-500 dark:text-gray-400">{format}</dt>
          <dd>
            <DateTime {...args} format={format} />
          </dd>
        </div>
      ))}
    </dl>
  ),
};

/**
 * Four more presets: `short` (the numeric date, in the locale's order), `monthDay`, `weekday` and
 * `iso`, which is year, month, day in every locale.
 */
export const MorePresets: Story = {
  render: (args) => (
    <dl className="grid grid-cols-[6rem_1fr_1fr] gap-x-4 gap-y-2 text-sm text-gray-900 dark:text-white">
      {(['short', 'monthDay', 'weekday', 'iso'] as const).map((format) => (
        <div key={format} className="contents">
          <dt className="text-gray-500 dark:text-gray-400">{format}</dt>
          <dd>
            <DateTime {...args} format={format} />
          </dd>
          <dd>
            <DateTime {...args} format={format} locale="fr-FR" />
          </dd>
        </div>
      ))}
    </dl>
  ),
};

/** `variant="stacked"`: the date, and the time under it in a smaller muted line. */
export const Stacked: Story = {
  args: { variant: 'stacked' },
  render: (args) => (
    <div className="flex flex-wrap items-start gap-8 text-sm text-gray-900 dark:text-white">
      <DateTime {...args} />
      <DateTime {...args} format="long" />
      <DateTime {...args} icon={CalendarDays} />
      <DateTime {...args} format="date" />
    </div>
  ),
};

/** `variant="badge"`: a neutral pill, with an optional leading icon. */
export const AsABadge: Story = {
  args: { variant: 'badge' },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <DateTime {...args} format="date" />
      <DateTime {...args} format="date" icon={CalendarDays} />
      <DateTime {...args} format="time" icon={Clock} />
      <DateTime {...args} icon={CalendarDays} />
    </div>
  ),
};

/** `icon` leads the text on every variant. */
export const WithAnIcon: Story = {
  render: (args) => (
    <div className="space-y-2 text-sm text-gray-900 dark:text-white">
      <DateTime {...args} icon={CalendarDays} />
      <DateTime {...args} icon={CalendarDays} variant="stacked" />
    </div>
  ),
};

/** `hour12` forces the clock, `showZone` adds the zone's short name after the time. */
export const Hour12AndZone: Story = {
  render: (args) => (
    <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm text-gray-900 dark:text-white">
      <dt className="text-gray-500 dark:text-gray-400">hour12 false</dt>
      <dd>
        <DateTime {...args} hour12={false} />
      </dd>
      <dt className="text-gray-500 dark:text-gray-400">hour12 true, fr-FR</dt>
      <dd>
        <DateTime {...args} hour12 locale="fr-FR" />
      </dd>
      <dt className="text-gray-500 dark:text-gray-400">showZone</dt>
      <dd>
        <DateTime {...args} showZone />
      </dd>
      <dt className="text-gray-500 dark:text-gray-400">showZone, Tokyo</dt>
      <dd>
        <DateTime {...args} showZone timeZone="Asia/Tokyo" />
      </dd>
    </dl>
  ),
};

/** The language of the month, the order of the parts and the clock follow `locale`. */
export const Locales: Story = {
  render: (args) => (
    <ul className="space-y-2 text-sm text-gray-900 dark:text-white">
      {['en-US', 'en-GB', 'fr-FR', 'de-DE', 'ja-JP'].map((locale) => (
        <li key={locale} className="flex gap-4">
          <span className="w-16 text-gray-500 dark:text-gray-400">{locale}</span>
          <DateTime {...args} locale={locale} format="long" />
        </li>
      ))}
    </ul>
  ),
};

/** The same instant on the wall clock of three zones; Tokyo is already on the 16th. */
export const TimeZones: Story = {
  args: { value: '2026-01-15T20:30:00Z', format: 'long', locale: 'fr-FR' },
  render: (args) => (
    <ul className="space-y-2 text-sm text-gray-900 dark:text-white">
      {['UTC', 'America/New_York', 'Asia/Tokyo'].map((timeZone) => (
        <li key={timeZone} className="flex gap-4">
          <span className="w-40 text-gray-500 dark:text-gray-400">{timeZone}</span>
          <DateTime {...args} timeZone={timeZone} />
        </li>
      ))}
    </ul>
  ),
};

/** A `format` that is not a preset is `Intl.DateTimeFormat` options. */
export const IntlOptions: Story = {
  args: { format: { weekday: 'long', day: 'numeric', month: 'long' }, locale: 'fr-FR' },
};

/**
 * `tooltip` shows the full date and zone. The `<time>` becomes a tab stop, so a keyboard reaches
 * the tooltip: turn it on for a date the reader is likely to ask about, not for a whole table.
 */
export const WithTooltip: Story = {
  args: { tooltip: true, format: 'date' },
};

/** A value that does not parse draws a dash, not "Invalid Date". */
export const InvalidValue: Story = { args: { value: 'soon' } };

/** At 375px a long format wraps instead of widening the page. */
export const Mobile: Story = {
  globals: mobileViewport,
  args: { format: 'full', locale: 'fr-FR', timeZone: 'Asia/Tokyo' },
};

export const MobileChecks: Story = {
  ...Mobile,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

/** It is a `<time>` whose `dateTime` is the ISO instant, whatever the zone and the format. */
export const RendersTimeElement: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-1 text-sm text-gray-900 dark:text-white">
      <div data-testid="utc">
        <DateTime value={Date.UTC(2026, 0, 15, 14, 5, 9)} timeZone="UTC" locale="en-US" />
      </div>
      <div data-testid="tokyo">
        <DateTime value="2026-01-15T14:05:09Z" timeZone="Asia/Tokyo" locale="fr-FR" format="time" />
      </div>
      <div data-testid="date">
        <DateTime
          value={new Date('2026-01-15T14:05:09Z')}
          format="date"
          locale="en-US"
          timeZone="UTC"
        />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const time = (id: string) => within(canvas.getByTestId(id)).getByText(/./).closest('time');
    for (const id of ['utc', 'tokyo', 'date']) {
      expect(time(id)?.tagName).toBe('TIME');
      expect(time(id)?.getAttribute('dateTime')).toBe('2026-01-15T14:05:09.000Z');
    }
    expect(time('tokyo')?.textContent).toBe('23:05');
    expect(time('date')?.textContent).toBe('Jan 15, 2026');
    // Plain text: out of the tab order unless it has a tooltip.
    expect(time('utc')?.hasAttribute('tabindex')).toBe(false);
    // The text is readable in every theme.
    inEachTheme(() => expectTextContrast(time('utc') as HTMLElement));
  },
};

/** The test of `MorePresets`, hidden: each preset's text, and `iso` the same in every locale. */
export const MorePresetsWriteTheirText: Story = {
  ...MorePresets,
  tags: ['!dev', '!autodocs'],
  play: ({ canvas }) => {
    for (const text of ['01/15/2026', '15/01/2026', 'Jan 15', 'Thursday', 'jeudi'])
      expect(canvas.getByText(text)).toBeVisible();
    // `iso` is in the English and the French column alike.
    expect(canvas.getAllByText('2026-01-15')).toHaveLength(2);
  },
};

/** The test of `Stacked`, hidden: one `<time>`, the date over the time, the time smaller and muted. */
export const StackedPutsTheTimeUnderTheDate: Story = {
  ...Stacked,
  tags: ['!dev', '!autodocs'],
  play: ({ canvas, canvasElement }) => {
    const times = canvasElement.querySelectorAll('time');
    expect(times).toHaveLength(4);
    const date = canvas.getAllByText('Jan 15, 2026')[0]!;
    const time = canvas.getAllByText('2:05 PM')[0]!;
    // Both lines are in the one `<time>`, with the instant in its `dateTime`.
    expect(date.closest('time')).toBe(time.closest('time'));
    expect(date.closest('time')!.getAttribute('dateTime')).toBe('2026-01-15T14:05:09.000Z');
    expect(date.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      time.getBoundingClientRect().top
    );
    expect(
      Math.abs(date.getBoundingClientRect().left - time.getBoundingClientRect().left)
    ).toBeLessThan(1);
    expect(parseFloat(getComputedStyle(time).fontSize)).toBeLessThan(
      parseFloat(getComputedStyle(date).fontSize)
    );
    expect(getComputedStyle(time).color).not.toBe(getComputedStyle(date).color);
    // A format with a date only stays one line.
    const dateOnly = times[3]!;
    expect(dateOnly.textContent).toBe('Jan 15, 2026');
    inEachTheme(() => {
      expectTextContrast(date);
      expectTextContrast(time);
    });
  },
};

/** The test of `AsABadge`, hidden: a neutral pill, the icon before the date, readable in every theme. */
export const BadgeIsANeutralPill: Story = {
  ...AsABadge,
  tags: ['!dev', '!autodocs'],
  play: ({ canvasElement }) => {
    const badges = [...canvasElement.querySelectorAll('time')].map((time) =>
      time.closest('span.rounded-full')!
    );
    expect(badges).toHaveLength(4);
    for (const badge of badges) {
      expect(badge.querySelector('time')).not.toBeNull();
      expect(parseFloat(getComputedStyle(badge).borderTopLeftRadius)).toBeGreaterThanOrEqual(
        badge.getBoundingClientRect().height
      );
    }
    expect(badges[0]!.querySelector('svg')).toBeNull();
    expect(badges[1]!.querySelector('svg')).not.toBeNull();
    // The icon comes before the date.
    expect(
      badges[1]!.querySelector('svg')!.compareDocumentPosition(badges[1]!.querySelector('time')!) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    inEachTheme(() => {
      for (const badge of badges) expectTextContrastOnTint(badge.querySelector('bdi')!);
    });
  },
};

/** The test of `Hour12AndZone`, hidden: the clock follows `hour12`, the zone follows `showZone`. */
export const Hour12AndShowZoneChangeTheText: Story = {
  ...Hour12AndZone,
  tags: ['!dev', '!autodocs'],
  play: ({ canvasElement }) => {
    const texts = [...canvasElement.querySelectorAll('time')].map((time) =>
      (time.textContent ?? '').replace(/\s/g, ' ')
    );
    expect(texts[0]).toBe('Jan 15, 2026, 14:05');
    expect(texts[1]).toMatch(/^15 janv\. 2026.* 0?2:05 PM$/i);
    expect(texts[2]).toBe('Jan 15, 2026, 2:05 PM UTC');
    expect(texts[3]).toBe('Jan 15, 2026, 11:05 PM GMT+9');
  },
};

/** The icon leads the text, on the start side in both directions, inline and stacked. */
export const IconLeadsTheTextInBothDirections: Story = {
  ...WithAnIcon,
  tags: ['!dev', '!autodocs'],
  render: (args) =>
    bothDirections(() => (
      <div className="space-y-2">
        <DateTime {...args} icon={CalendarDays} />
        <DateTime {...args} icon={CalendarDays} variant="stacked" />
      </div>
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      for (const time of box.querySelectorAll('time')) {
        const icon = time.parentElement!.querySelector('svg')!;
        expect(startOffset(icon, box), `${dir}: the icon leads`).toBeLessThan(
          startOffset(time, box)
        );
      }
    }
  },
};

/** With `tooltip`, a keyboard focuses the `<time>` and the tooltip gives the full date and zone. */
export const TooltipOnFocus: Story = {
  tags: ['!dev', '!autodocs'],
  args: { tooltip: true, format: 'date' },
  play: async ({ canvas }) => {
    // The text sits in a `<bdi>` inside the `<time>`.
    const time = canvas.getByText('Jan 15, 2026').closest('time')!;
    expect(time.getAttribute('tabindex')).toBe('0');
    await userEvent.tab();
    expect(time).toHaveFocus();
    const tooltip = await within(document.body).findByRole('tooltip');
    await waitFor(() => expect(getComputedStyle(tooltip).opacity).toBe('1'));
    expect(tooltip.textContent?.replace(/\s/g, ' ')).toBe(
      'Thursday, January 15, 2026 at 2:05:09 PM UTC'
    );
    expect(time.getAttribute('aria-describedby')).toBe(tooltip.id);
  },
};

/** A value that is no date draws a dash and no `<time>`. */
export const InvalidValueHasNoTimeElement: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: 'soon', tooltip: true },
  play: async ({ canvas }) => {
    expect(canvas.getByText('—').tagName).toBe('SPAN');
    expect(canvas.queryByRole('tooltip')).toBeNull();
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** A date and a time keep their order in a right-to-left page. */
export const ValueReadsLeftToRightInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) =>
    bothDirections(() => (
      <div className="space-y-2">
        <DateTime {...args} />
        <DateTime {...args} format="time" />
      </div>
    )),
  play: ({ canvasElement }) => {
    const times = canvasElement.querySelectorAll('time');
    expect(times).toHaveLength(4);
    for (const time of times) expectReadsLeftToRight(time);
  },
};
