import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MiniCalendar } from './MiniCalendar';

const meta = {
  title: 'Data/Mini Calendar',
  component: MiniCalendar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  // The stories read English names: pin the locale rather than follow the browser's.
  args: { selected: new Date(2026, 4, 7), onSelect: () => {}, locale: 'en-US' },
} satisfies Meta<typeof MiniCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { today: new Date(2026, 4, 7), selected: new Date(2026, 4, 7), onSelect: () => {} },
};

export const WithEventDots: Story = {
  args: {
    today: new Date(2026, 4, 7),
    selected: new Date(2026, 4, 7),
    eventDays: new Set(['2026-05-12', '2026-05-21', '2026-05-28']),
    onSelect: () => {},
  },
};

/**
 * `locale` (a BCP 47 tag) sets the language of the weekday names, the month title and the
 * accessible name of each day. Omit it to follow the browser's. The grid stays Gregorian, Monday
 * first, and the button labels stay English.
 */
export const French: Story = {
  args: { today: new Date(2026, 4, 7), selected: new Date(2026, 4, 7), locale: 'fr-FR' },
};

export const Controlled: Story = {
  render: () => {
    const [selected, setSelected] = useState(new Date(2026, 4, 7));
    return (
      <div>
        <MiniCalendar today={new Date(2026, 4, 7)} selected={selected} onSelect={setSelected} />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Selected: {selected.toLocaleDateString()}
        </p>
      </div>
    );
  },
};

export const NextMonthFiresOnSelect: Story = {
  args: {
    today: new Date(2026, 4, 7),
    selected: new Date(2026, 4, 7),
    onSelect: fn(),
  },
  play: async ({ args, canvas }) => {
    // Click the "Next month" arrow → June, then click day 10
    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    const cell = canvas.getByRole('button', { name: 'Wednesday, June 10, 2026' });
    await userEvent.click(cell);
    await expect(args.onSelect).toHaveBeenCalled();
  },
};

const FIXED_DAY = {
  today: new Date(2026, 4, 7),
  selected: new Date(2026, 4, 7),
};

/** A day reports its exact date, in the month on display. */
export const DayClickReportsTheDate: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...FIXED_DAY, onSelect: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Sunday, May 10, 2026' }));
    await expect(args.onSelect).toHaveBeenLastCalledWith(new Date(2026, 4, 10));
    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Wednesday, June 10, 2026' }));
    await expect(args.onSelect).toHaveBeenLastCalledWith(new Date(2026, 5, 10));
    await expect(args.onSelect).toHaveBeenCalledTimes(2);
  },
};

/** A day is named by its full date, and says whether it is the selected day or today. */
export const DaysExposeSelectionAndToday: Story = {
  tags: ['!dev', '!autodocs'],
  args: { today: new Date(2026, 4, 7), selected: new Date(2026, 4, 12), onSelect: fn() },
  render: (args) => {
    const [selected, setSelected] = useState(args.selected);
    return <MiniCalendar {...args} selected={selected} onSelect={setSelected} />;
  },
  play: async ({ canvas }) => {
    const today = canvas.getByRole('button', { name: 'Thursday, May 7, 2026' });
    const selected = canvas.getByRole('button', { name: 'Tuesday, May 12, 2026' });
    const other = canvas.getByRole('button', { name: 'Wednesday, May 13, 2026' });

    // The visible text stays the bare day number.
    await expect(today).toHaveTextContent(/^7$/);
    await expect(selected).toHaveTextContent(/^12$/);

    await expect(selected).toHaveAttribute('aria-pressed', 'true');
    await expect(today).toHaveAttribute('aria-pressed', 'false');
    await expect(other).toHaveAttribute('aria-pressed', 'false');
    await expect(today).toHaveAttribute('aria-current', 'date');
    await expect(selected).not.toHaveAttribute('aria-current');
    await expect(other).not.toHaveAttribute('aria-current');
    await expect(canvas.getAllByRole('button', { pressed: true })).toHaveLength(1);

    // Picking another day moves the pressed state; today stays the current date.
    await userEvent.click(other);
    await expect(other).toHaveAttribute('aria-pressed', 'true');
    await expect(selected).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.getAllByRole('button', { pressed: true })).toHaveLength(1);
    await expect(today).toHaveAttribute('aria-current', 'date');
  },
};

/** The arrows step through the months and years; the title goes back to today's month. */
export const MonthNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...FIXED_DAY, onSelect: fn() },
  play: async ({ canvas }) => {
    const days = (month: string, year: number) =>
      canvas.getAllByRole('button', { name: new RegExp(`, ${month} \\d+, ${year}$`) });
    await expect(canvas.getByRole('button', { name: 'May 2026' })).toBeVisible();
    await expect(days('May', 2026)).toHaveLength(31);

    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    await expect(canvas.getByRole('button', { name: 'June 2026' })).toBeVisible();
    await expect(days('June', 2026)).toHaveLength(30);

    // Back past the start of the year.
    for (let i = 0; i < 6; i++)
      await userEvent.click(canvas.getByRole('button', { name: 'Previous month' }));
    await expect(canvas.getByRole('button', { name: 'December 2025' })).toBeVisible();
    await expect(days('December', 2025)).toHaveLength(31);

    await userEvent.click(canvas.getByRole('button', { name: 'December 2025' }));
    await expect(canvas.getByRole('button', { name: 'May 2026' })).toBeVisible();
  },
};

/** Weeks start on Monday: May 1st, 2026 is a Friday and May 3rd a Sunday. */
export const WeeksStartOnMonday: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...FIXED_DAY, onSelect: fn() },
  play: async ({ canvas }) => {
    const left = (el: HTMLElement) => el.getBoundingClientRect().left;
    await expect(left(canvas.getByRole('button', { name: 'Friday, May 1, 2026' }))).toBeCloseTo(
      left(canvas.getByTitle('Fri')),
      0
    );
    await expect(left(canvas.getByRole('button', { name: 'Sunday, May 3, 2026' }))).toBeCloseTo(
      left(canvas.getByTitle('Sun')),
      0
    );
    await expect(left(canvas.getByRole('button', { name: 'Monday, May 4, 2026' }))).toBeCloseTo(
      left(canvas.getByTitle('Mon')),
      0
    );
  },
};

/** `locale="fr-FR"`: French weekday names, month title and day names; the grid does not move. */
export const LocaleNamesTheDatesInFrench: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...FIXED_DAY, onSelect: fn(), locale: 'fr-FR' },
  play: async ({ canvas }) => {
    // The abbreviations carry a trailing dot in CLDR: `lun.`.
    for (const name of ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'])
      await expect(canvas.getByTitle(new RegExp(`^${name}\\.?$`))).toBeVisible();
    await expect(canvas.queryByTitle('Mon')).toBeNull();

    await expect(canvas.getByRole('button', { name: 'mai 2026' })).toBeVisible();
    const today = canvas.getByRole('button', { name: 'jeudi 7 mai 2026' });
    await expect(today).toHaveTextContent(/^7$/);
    await expect(today).toHaveAttribute('aria-current', 'date');
    await expect(canvas.queryByRole('button', { name: 'Thursday, May 7, 2026' })).toBeNull();

    // Still Monday first: the 1st of May 2026 is a Friday, under the fifth weekday.
    const left = (el: HTMLElement) => el.getBoundingClientRect().left;
    await expect(left(canvas.getByRole('button', { name: 'vendredi 1 mai 2026' }))).toBeCloseTo(
      left(canvas.getByTitle(/^ven\.?$/)),
      0
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    await expect(canvas.getByRole('button', { name: 'juin 2026' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'mercredi 10 juin 2026' })).toBeVisible();
  },
};

// The default locale as the runtime resolves it, to build what the component must show.
const browserFormat = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(new Intl.DateTimeFormat().resolvedOptions().locale, {
    ...options,
    calendar: 'gregory',
  });

/** Without `locale`, the names follow the browser's locale, whatever it is. */
export const DefaultLocaleFollowsTheBrowser: Story = {
  tags: ['!dev', '!autodocs'],
  // The stories pin en-US: lift it, the default is what this story is about.
  args: { ...FIXED_DAY, onSelect: fn(), locale: undefined },
  play: async ({ args, canvas }) => {
    await expect(args.locale).toBeUndefined();
    const monday = new Date(2026, 4, 4);
    await expect(
      canvas.getByTitle(browserFormat({ weekday: 'short' }).format(monday))
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', {
        name: browserFormat({ month: 'long', year: 'numeric' }).format(FIXED_DAY.today),
      })
    ).toBeVisible();
    const fullDate = browserFormat({
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    await expect(
      canvas.getByRole('button', { name: fullDate.format(FIXED_DAY.today) })
    ).toHaveAttribute('aria-current', 'date');
  },
};

// ── Controlled or not (#151) ─────────────────────────────────────────────────
// Only `undefined` means uncontrolled. The uncontrolled instance starts from its
// default and moves on its own; the controlled one, held at a fixed value, reports
// the change and keeps showing the value it is given.

const MAY_7 = new Date(2026, 4, 7);

export const DefaultSelectedOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onSelect: fn() },
  render: (args) => (
    <div className="flex flex-wrap gap-4">
      <div role="group" aria-label="Uncontrolled" className="w-72">
        <MiniCalendar
          today={MAY_7}
          locale="en-US"
          defaultSelected={new Date(2026, 4, 12)}
          onSelect={args.onSelect}
        />
      </div>
      <div role="group" aria-label="Controlled" className="w-72">
        <MiniCalendar today={MAY_7} locale="en-US" selected={MAY_7} onSelect={args.onSelect} />
      </div>
      <div role="group" aria-label="No selection" className="w-72">
        <MiniCalendar today={MAY_7} locale="en-US" />
      </div>
    </div>
  ),
  play: async ({ args, canvas }) => {
    const own = within(canvas.getByRole('group', { name: 'Uncontrolled' }));
    const may12 = own.getByRole('button', { name: 'Tuesday, May 12, 2026' });
    await expect(may12).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(own.getByRole('button', { name: 'Thursday, May 14, 2026' }));
    await expect(args.onSelect).toHaveBeenLastCalledWith(new Date(2026, 4, 14));
    await expect(own.getByRole('button', { name: 'Thursday, May 14, 2026' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(may12).toHaveAttribute('aria-pressed', 'false');

    const held = within(canvas.getByRole('group', { name: 'Controlled' }));
    await userEvent.click(held.getByRole('button', { name: 'Thursday, May 14, 2026' }));
    await expect(args.onSelect).toHaveBeenLastCalledWith(new Date(2026, 4, 14));
    await expect(held.getByRole('button', { name: 'Thursday, May 7, 2026' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    // Nothing selected: it opens on today's month, no day pressed.
    const bare = within(canvas.getByRole('group', { name: 'No selection' }));
    await expect(bare.getByRole('button', { name: 'May 2026' })).toBeVisible();
    await expect(bare.queryByRole('button', { pressed: true })).toBeNull();
  },
};

/** Selected is a filled cell, today an outlined one; the event dot sits under the number. */
export const SelectedTodayAndEventDot: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    today: new Date(2026, 4, 7),
    selected: new Date(2026, 4, 12),
    eventDays: new Set(['2026-05-12', '2026-05-14']),
    onSelect: fn(),
  },
  play: async ({ canvas }) => {
    const today = getComputedStyle(canvas.getByRole('button', { name: 'Thursday, May 7, 2026' }));
    const selected = getComputedStyle(
      canvas.getByRole('button', { name: 'Tuesday, May 12, 2026' })
    );
    const transparent = 'rgba(0, 0, 0, 0)';
    await expect(selected.backgroundColor).not.toBe(transparent);
    await expect(today.backgroundColor).toBe(transparent);
    await expect(today.borderTopColor).not.toBe(transparent);
    await expect(today.borderTopWidth).toBe('1px');
    await expect(selected.borderTopColor).toBe(transparent);

    // The dot is under the digits, not over them.
    const cell = canvas.getByRole('button', { name: 'Thursday, May 14, 2026' });
    const dot = cell.querySelector('span')!;
    const range = document.createRange();
    range.selectNodeContents(cell.firstChild!);
    await expect(dot.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      range.getBoundingClientRect().bottom
    );
  },
};

/** The weekday labels have room between them, and their short name stays available as a tooltip. */
export const WeekdayLabelsDoNotTouch: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...FIXED_DAY, onSelect: fn() },
  play: async ({ canvas }) => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name) =>
      canvas.getByTitle(name)
    );
    for (let i = 1; i < labels.length; i++) {
      const gap =
        labels[i].getBoundingClientRect().left - labels[i - 1].getBoundingClientRect().right;
      const textWidth = (el: HTMLElement) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return range.getBoundingClientRect().width;
      };
      // The letters of two neighbours are further apart than a few pixels.
      await expect(gap + (labels[i].offsetWidth - textWidth(labels[i])) / 2).toBeGreaterThan(8);
    }
  },
};
