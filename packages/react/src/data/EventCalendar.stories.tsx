import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { EventCalendar, type CalendarEvent } from './EventCalendar';
import {
  bothDirections,
  directionBox,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  keyToEnd,
  mobileViewport,
  startEdge,
  startOffset,
} from '../storybook-helpers';

// Thursday, May 7, 2026, 10:42: the day is the one the month highlights, the time is the one of the
// line in the week and day views.
const TODAY = new Date(2026, 4, 7, 10, 42);

const EVENTS: CalendarEvent[] = [
  {
    id: 'dc',
    title: 'Datacenter migration',
    start: new Date(2026, 3, 29),
    end: new Date(2026, 4, 1),
    intent: 'violet',
  },
  { id: 'planning', title: 'Sprint planning', start: new Date(2026, 4, 4) },
  {
    id: 'patching',
    title: 'Kernel patching, rack A',
    start: new Date(2026, 4, 5),
    intent: 'warning',
  },
  { id: 'release', title: 'Release 2.4', start: new Date(2026, 4, 7, 9), intent: 'success' },
  {
    id: 'postmortem',
    title: 'Postmortem: API latency',
    start: new Date(2026, 4, 7, 11),
    intent: 'danger',
  },
  { id: 'one-on-one', title: '1:1 with Sarah', start: new Date(2026, 4, 7, 14), intent: 'violet' },
  { id: 'vendor', title: 'Vendor call', start: new Date(2026, 4, 7, 15), intent: 'info' },
  { id: 'backup', title: 'Backup audit', start: new Date(2026, 4, 7, 16), intent: 'warning' },
  {
    id: 'kubecon',
    title: 'KubeCon trip',
    start: new Date(2026, 4, 9),
    end: new Date(2026, 4, 12),
    intent: 'info',
  },
  { id: 'grafana', title: 'Grafana upgrade', start: new Date(2026, 4, 14) },
  { id: 'capacity', title: 'Capacity review', start: new Date(2026, 4, 19) },
  { id: 'handover', title: 'On-call handover', start: new Date(2026, 4, 21), intent: 'violet' },
  {
    id: 'pentest',
    title: 'Pen test window',
    start: new Date(2026, 4, 25),
    end: new Date(2026, 4, 26),
    intent: 'danger',
  },
  { id: 'report', title: 'Quarterly report', start: new Date(2026, 4, 28), intent: 'success' },
];

const meta = {
  title: 'Data/Event Calendar',
  component: EventCalendar,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // Dates don't survive the JSON controls: keep them out of the panel.
  argTypes: {
    events: { control: false },
    date: { control: false },
    defaultDate: { control: false },
    today: { control: false },
  },
  args: {
    events: EVENTS,
    today: TODAY,
    onEventClick: fn(),
    onDayClick: fn(),
    onDateChange: fn(),
    onViewChange: fn(),
    // The stories read English names: pin the locale rather than follow the browser's.
    locale: 'en-US',
  },
} satisfies Meta<typeof EventCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { events: [] },
};

export const EmptyChecks: Story = {
  ...Empty,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('No events this month');
  },
};

/** The message is a prop, and a month with events shows none. */
export const EmptyMessageOnlyWhenEmpty: Story = {
  tags: ['!dev', '!autodocs'],
  args: { events: [], emptyMessage: 'Nothing planned' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Nothing planned');
    // June 2026 has no event either; the greyed days of May do not count for it.
    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    await expect(canvas.getByRole('status')).toBeVisible();
  },
};

export const MonthWithEventsHasNoEmptyMessage: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('status')).toBeNull();
  },
};

/** The Today button is disabled on the current month: a tooltip says why. */
export const TodayTooltipExplainsDisabled: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const today = canvas.getByRole('button', { name: 'Today' });
    await expect(today).toBeDisabled();
    const tip = within(document.body).getByRole('tooltip', { hidden: true });
    await expect(tip).toHaveTextContent('Already showing the current month');
    await expect(today).toHaveAccessibleDescription('Already showing the current month');
    await userEvent.hover(today.parentElement!);
    await expect(tip).toHaveClass('opacity-100');
    // Away from the current month the button is live, with its own tooltip.
    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    await expect(canvas.getByRole('button', { name: 'Today' })).toBeEnabled();
    await expect(tip).toHaveTextContent('Back to the current month');
  },
};

/**
 * `locale` (a BCP 47 tag) sets the language of the weekday names, the month title and the date in
 * each day's accessible name. Omit it to follow the browser's. The grid stays Gregorian, Monday
 * first, and the button labels stay English.
 */
export const French: Story = {
  args: { locale: 'fr-FR' },
};

/** Without `onEventClick` and `onDayClick`, chips and day numbers are plain text. */
export const ReadOnly: Story = {
  args: { onEventClick: undefined, onDayClick: undefined },
};

export const ReadOnlyChecks: Story = {
  ...ReadOnly,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('Grafana upgrade')[0].closest('button')).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Thursday, May 14, 2026' })).toBeNull();
  },
};

export const WeeksStartOnMonday: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const days = canvas.getAllByRole('group');
    // May 2026 starts on a Friday and ends on a Sunday: five full ISO weeks.
    await expect(days).toHaveLength(35);
    await expect(days[0]).toHaveAccessibleName('Monday, April 27, 2026');
    await expect(days[34]).toHaveAccessibleName('Sunday, May 31, 2026');
    const today = canvas.getByRole('button', { name: 'Thursday, May 7, 2026' });
    await expect(today).toHaveAttribute('aria-current', 'date');
  },
};

export const MultiDayEventRepeats: Story = {
  tags: ['!dev'],
  play: async ({ canvas }) => {
    // Saturday to Tuesday, across a week boundary: the title is written once, on the
    // first day; the other days keep a bare chip that still names the event.
    const title = (day: string) =>
      // The text sits in a `<bdi>` inside the span that hides or shows it.
      within(canvas.getByRole('group', { name: day })).getByText('KubeCon trip').parentElement!;
    for (const day of ['Sunday, May 10, 2026', 'Monday, May 11, 2026', 'Tuesday, May 12, 2026']) {
      await expect(title(day)).toHaveClass('sr-only');
    }
    await expect(title('Saturday, May 9, 2026')).not.toHaveClass('sr-only');
    await expect(canvas.getAllByText('KubeCon trip')).toHaveLength(4);
    // Starts in April: its first shown day, a greyed one, carries the title.
    await expect(
      within(canvas.getByRole('group', { name: 'Wednesday, April 29, 2026' })).getByText(
        'Datacenter migration'
      ).parentElement
    ).not.toHaveClass('sr-only');
    await expect(
      within(canvas.getByRole('group', { name: 'Thursday, April 30, 2026' })).getByText(
        'Datacenter migration'
      ).parentElement
    ).toHaveClass('sr-only');
  },
};

export const BusyDayOpensMore: Story = {
  tags: ['!dev'],
  play: async ({ args, canvas, canvasElement }) => {
    const day = within(canvas.getByRole('group', { name: 'Thursday, May 7, 2026' }));
    await expect(day.getAllByRole('listitem')).toHaveLength(3);
    await expect(day.queryByText('Vendor call')).toBeNull();

    await userEvent.click(day.getByRole('button', { name: '+2 more on Thursday, May 7, 2026' }));
    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(body.getByRole('dialog', { name: 'Events on Thursday, May 7, 2026' }));
    await expect(dialog.getAllByRole('listitem')).toHaveLength(5);

    await userEvent.click(dialog.getByRole('button', { name: /Backup audit/ }));
    await expect(args.onEventClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'backup' }));
    await expect(body.queryByRole('dialog')).toBeNull();
  },
};

export const ClicksFireCallbacks: Story = {
  tags: ['!dev'],
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Thursday, May 14, 2026' }));
    await expect(args.onDayClick).toHaveBeenCalledWith(new Date(2026, 4, 14));
    await userEvent.click(canvas.getByRole('button', { name: 'Grafana upgrade' }));
    await expect(args.onEventClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'grafana' })
    );
  },
};

export const MonthNavigation: Story = {};

export const MonthNavigationChecks: Story = {
  ...MonthNavigation,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas }) => {
    const todayButton = canvas.getByRole('button', { name: 'Today' });
    await expect(canvas.getByRole('heading', { name: 'May 2026' })).toBeVisible();
    await expect(todayButton).toBeDisabled();

    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    await expect(canvas.getByRole('heading', { name: 'June 2026' })).toBeVisible();
    await expect(args.onDateChange).toHaveBeenLastCalledWith(new Date(2026, 5, 1));
    // June 2026 starts on a Monday: no greyed days before the 1st.
    await expect(canvas.getAllByRole('group')[0]).toHaveAccessibleName('Monday, June 1, 2026');

    await userEvent.click(todayButton);
    await expect(canvas.getByRole('heading', { name: 'May 2026' })).toBeVisible();
    await expect(args.onDateChange).toHaveBeenLastCalledWith(new Date(2026, 4, 1));
  },
};

/** `locale="fr-FR"`: French weekday names, month title and day names; the grid does not move. */
export const LocaleNamesTheDatesInFrench: Story = {
  tags: ['!dev', '!autodocs'],
  args: { locale: 'fr-FR' },
  play: async ({ args, canvas, canvasElement }) => {
    // The abbreviations carry a trailing dot in CLDR: `lun.`.
    for (const name of ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'])
      await expect(canvas.getByText(new RegExp(`^${name}\\.?$`))).toBeVisible();
    await expect(canvas.queryByText('Mon')).toBeNull();

    await expect(canvas.getByRole('heading', { name: 'mai 2026' })).toBeVisible();
    // Still Monday first: the same 35 days as in English, from April 27th to May 31st.
    const days = canvas.getAllByRole('group');
    await expect(days).toHaveLength(35);
    await expect(days[0]).toHaveAccessibleName('lundi 27 avril 2026');
    await expect(days[34]).toHaveAccessibleName('dimanche 31 mai 2026');
    const today = canvas.getByRole('button', { name: 'jeudi 7 mai 2026' });
    await expect(today).toHaveTextContent(/^7$/);
    await expect(today).toHaveAttribute('aria-current', 'date');

    // The date inside the "+N more" label and in the list it opens.
    const day = within(canvas.getByRole('group', { name: 'jeudi 7 mai 2026' }));
    await userEvent.click(day.getByRole('button', { name: '+2 more on jeudi 7 mai 2026' }));
    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(body.getByRole('dialog', { name: 'Events on jeudi 7 mai 2026' }));
    await expect(dialog.getByText('jeudi 7 mai 2026')).toBeVisible();
    await userEvent.click(dialog.getByRole('button', { name: /Backup audit/ }));
    await expect(args.onEventClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'backup' }));

    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    await expect(canvas.getByRole('heading', { name: 'juin 2026' })).toBeVisible();
    await expect(canvas.getAllByRole('group')[0]).toHaveAccessibleName('lundi 1 juin 2026');
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
  args: { locale: undefined },
  play: async ({ args, canvas }) => {
    await expect(args.locale).toBeUndefined();
    const monday = new Date(2026, 3, 27);
    await expect(
      canvas.getByText(browserFormat({ weekday: 'short' }).format(monday))
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', {
        name: browserFormat({ month: 'long', year: 'numeric' }).format(TODAY),
      })
    ).toBeVisible();
    const fullDate = browserFormat({
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    await expect(canvas.getAllByRole('group')[0]).toHaveAccessibleName(fullDate.format(monday));
    await expect(canvas.getByRole('button', { name: fullDate.format(TODAY) })).toHaveAttribute(
      'aria-current',
      'date'
    );
  },
};

const CHIP_COLORS = {
  brand: ['bg-brand-50', 'bg-brand-500'],
  success: ['bg-green-50', 'bg-green-500'],
  warning: ['bg-amber-50', 'bg-amber-500'],
  danger: ['bg-red-50', 'bg-red-500'],
  info: ['bg-blue-50', 'bg-blue-500'],
  violet: ['bg-violet-50', 'bg-violet-500'],
} as const;

/** `intent` colors an event's chip and dot, `brand` by default; `violet` is a category color. */
export const IntentColorsTheEvent: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    // One event a day, so that no day folds its chips behind "+N more".
    events: [
      ...(Object.keys(CHIP_COLORS) as (keyof typeof CHIP_COLORS)[]).map((intent, i) => ({
        id: intent,
        title: `${intent} event`,
        start: new Date(2026, 4, 4 + i),
        intent,
      })),
      { id: 'default', title: 'default event', start: new Date(2026, 4, 11) },
    ],
  },
  play: async ({ canvas }) => {
    const chip = (title: string) => canvas.getByTitle(title);
    for (const [intent, [bg, dot]] of Object.entries(CHIP_COLORS)) {
      await expect(chip(`${intent} event`)).toHaveClass(bg);
      await expect(chip(`${intent} event`).querySelector('span[aria-hidden]')).toHaveClass(dot);
    }
    await expect(chip('default event')).toHaveClass('bg-brand-50');
    await expect(chip('default event').querySelector('span[aria-hidden]')).toHaveClass(
      'bg-brand-500'
    );
  },
};

/**
 * A timed event writes its start time before its title; an all-day one, a date with no time,
 * writes none. `allDay` forces the answer: a meeting at midnight is `allDay: false`.
 */
export const TimeShownOnTimedEventsOnly: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    events: [
      { id: 'timed', title: 'Release 2.4', start: new Date(2026, 4, 7, 9, 30) },
      { id: 'date', title: 'Grafana upgrade', start: new Date(2026, 4, 7) },
      { id: 'forced', title: 'Offsite', start: new Date(2026, 4, 8, 14), allDay: true },
      { id: 'midnight', title: 'Batch window', start: new Date(2026, 4, 9), allDay: false },
      {
        id: 'run',
        title: 'KubeCon trip',
        start: new Date(2026, 4, 11, 8),
        end: new Date(2026, 4, 13, 18),
      },
    ],
  },
  play: async ({ canvas }) => {
    const chip = (title: string, day: string) =>
      within(canvas.getByRole('group', { name: day })).getByTitle(title);
    // Newer ICU writes a narrow no-break space before AM and PM.
    const text = (el: HTMLElement) => el.textContent!.replace(/\u202f/g, ' ');
    await expect(text(chip('Release 2.4', 'Thursday, May 7, 2026'))).toBe('9:30 AMRelease 2.4');
    await expect(text(chip('Grafana upgrade', 'Thursday, May 7, 2026'))).toBe('Grafana upgrade');
    await expect(text(chip('Offsite', 'Friday, May 8, 2026'))).toBe('Offsite');
    await expect(text(chip('Batch window', 'Saturday, May 9, 2026'))).toBe('12:00 AMBatch window');
    // A timed event over several days has its time on its first day only.
    await expect(text(chip('KubeCon trip', 'Monday, May 11, 2026'))).toBe('8:00 AMKubeCon trip');
    await expect(text(chip('KubeCon trip', 'Tuesday, May 12, 2026'))).toBe('KubeCon trip');
    await expect(text(chip('KubeCon trip', 'Wednesday, May 13, 2026'))).toBe('KubeCon trip');
  },
};

// ── Narrow screens (#291) ────────────────────────────────────────────────────

/**
 * Below `sm` the weekday names shrink to one letter, the chips to dots, and the picked day (today
 * to begin with) lists its events under the grid.
 */
export const Mobile: Story = {
  globals: mobileViewport,
};

export const MobileChecks: Story = {
  ...Mobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas }) => {
    expectNoHorizontalOverflow();
    await expect(canvas.queryByText('Mon')).not.toBeVisible();
    const letters = canvas.getAllByText('M');
    await expect(letters.some((el) => el.checkVisibility())).toBe(true);

    const today = within(canvas.getByRole('region', { name: 'Events on Thursday, May 7, 2026' }));
    await expect(today.getAllByRole('listitem')).toHaveLength(5);
    // No "+N more" popover: the list under the grid shows everything.
    await expect(canvas.queryByRole('button', { name: /more on/ })).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Monday, May 4, 2026' }));
    await expect(args.onDayClick).toHaveBeenCalledWith(new Date(2026, 4, 4));
    const monday = within(canvas.getByRole('region', { name: 'Events on Monday, May 4, 2026' }));
    await expect(monday.getByText('Sprint planning')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Monday, May 4, 2026' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Wednesday, May 13, 2026' }));
    await expect(canvas.getByText('No events')).toBeVisible();
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * The previous month is at the start with a chevron that points to it, the week starts at the
 * start edge, and a day cell keeps its divider on the side the next day is on.
 */
export const MonthNavigationAndWeekMirrorInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => bothDirections(() => <EventCalendar {...args} />),
  play: async ({ canvasElement }) => {
    const button = (box: HTMLElement, name: string) => within(box).getByRole('button', { name });
    expectMirrored(canvasElement, (box) => button(box, 'Previous month'));
    expectMirrored(canvasElement, (box) => button(box, 'Next month'));
    // Monday, the first weekday, and the first cell of the grid, at the start.
    expectMirrored(canvasElement, (box) => box.querySelector('[aria-hidden] > span'));
    const monday = (box: HTMLElement) =>
      within(box).getByRole('group', { name: 'Monday, April 27, 2026' });
    expectMirrored(canvasElement, monday);
    for (const [dir, scale] of [
      ['ltr', 'none'],
      ['rtl', '-1 1'],
    ] as const) {
      const box = directionBox(canvasElement, dir);
      const previous = button(box, 'Previous month');
      const next = button(box, 'Next month');
      expect(startOffset(previous, box)).toBeLessThan(startOffset(next, box));
      // Both chevrons are turned around in right to left, so each still points at its month.
      expect(previous.querySelector('svg')).toHaveClass('lucide-chevron-left');
      expect(next.querySelector('svg')).toHaveClass('lucide-chevron-right');
      for (const control of [previous, next])
        expect(getComputedStyle(control.querySelector('svg')!).scale).toBe(scale);
      // The divider is on the end side of every day but the last of a week.
      expect(getComputedStyle(monday(box)).borderInlineEndWidth).toBe('1px');
      expect(
        getComputedStyle(within(box).getByRole('group', { name: 'Sunday, May 3, 2026' }))
          .borderInlineEndWidth
      ).toBe('0px');
      await userEvent.click(previous);
      await expect(within(box).getByRole('heading', { name: 'April 2026' })).toBeVisible();
    }
  },
};

/** A weekday name the locale abbreviates with a dot (`lun.`) keeps the dot at its end. */
export const WeekdayNamesKeepTheirOrderInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  args: { locale: 'fr-FR' },
  render: (args) => bothDirections(() => <EventCalendar {...args} />),
  play: ({ canvasElement }) => {
    for (const box of canvasElement.querySelectorAll<HTMLElement>('[data-direction]'))
      expectReadsLeftToRight(within(box).getByText('lun.'));
  },
};

// ── Week and day views (#557) ───────────────────────────────────────────────

const laptop = { viewport: { value: 'laptop', isRotated: false } } as const;
const at = (day: number, hour: number, minute = 0) => new Date(2026, 4, day, hour, minute);
// ICU writes thin and narrow no-break spaces around a dash and before AM and PM.
const plain = (text: string | null) => (text ?? '').replace(/[\u202f\u2009\u00a0]/g, ' ');

// The week of May 4 to 10, 2026, as `today` (Thursday, 10:42) sees it: a standup each morning, a busy
// Thursday afternoon, an event over midnight on Friday, and three events above the grid.
const WEEK_EVENTS: CalendarEvent[] = [
  { id: 'leave', title: 'Maya on leave', start: at(4, 0), end: at(5, 0), intent: 'info' },
  { id: 'lisbon', title: 'Offsite: Lisbon', start: at(6, 0), end: at(8, 0), intent: 'violet' },
  { id: 'close', title: 'Quarter close', start: at(8, 0), intent: 'warning' },
  { id: 'planning', title: 'Sprint planning', start: at(4, 9, 30), end: at(4, 10, 30) },
  { id: 'design', title: 'Design review', start: at(4, 11), end: at(4, 12), intent: 'violet' },
  {
    id: 'lunch-maya',
    title: 'Lunch with Maya',
    start: at(4, 12, 30),
    end: at(4, 13, 30),
    intent: 'info',
  },
  { id: 'sync', title: 'Capacity sync', start: at(4, 15), end: at(4, 16) },
  { id: 'standup-tue', title: 'Standup', start: at(5, 9), end: at(5, 9, 15) },
  { id: 'vendor-call', title: 'Vendor call', start: at(5, 10), end: at(5, 11), intent: 'info' },
  { id: 'kernel', title: 'Kernel patching', start: at(5, 13), end: at(5, 17), intent: 'warning' },
  { id: 'one-sam', title: '1:1 with Sam', start: at(5, 14), end: at(5, 14, 45), intent: 'violet' },
  { id: 'standup-wed', title: 'Standup', start: at(6, 9), end: at(6, 9, 15) },
  {
    id: 'roadmap',
    title: 'Roadmap workshop',
    start: at(6, 10),
    end: at(6, 12, 30),
    intent: 'success',
  },
  {
    id: 'interview',
    title: 'Candidate interview',
    start: at(6, 11),
    end: at(6, 12),
    intent: 'violet',
  },
  { id: 'intro', title: 'Intro call', start: at(6, 11, 30), end: at(6, 12), intent: 'info' },
  { id: 'handover', title: 'On-call handover', start: at(6, 17), end: at(6, 17, 30) },
  { id: 'standup-thu', title: 'Standup', start: at(7, 9), end: at(7, 9, 15) },
  { id: 'release', title: 'Release 2.4', start: at(7, 9, 30), end: at(7, 11), intent: 'success' },
  {
    id: 'postmortem',
    title: 'Postmortem: API latency',
    start: at(7, 11),
    end: at(7, 12),
    intent: 'danger',
  },
  {
    id: 'team-lunch',
    title: 'Team lunch',
    start: at(7, 12, 30),
    end: at(7, 13, 30),
    intent: 'info',
  },
  {
    id: 'pentest',
    title: 'Pen test window',
    start: at(7, 14),
    end: at(7, 16, 30),
    intent: 'danger',
  },
  { id: 'backup', title: 'Backup audit', start: at(7, 14), end: at(7, 15), intent: 'warning' },
  { id: 'capacity', title: 'Capacity review', start: at(7, 14, 30), end: at(7, 15, 30) },
  { id: 'vendor-sync', title: 'Vendor sync', start: at(7, 14, 30), end: at(7, 15), intent: 'info' },
  { id: 'retro', title: 'Retro', start: at(7, 14, 45), end: at(7, 15, 30), intent: 'violet' },
  { id: 'crit', title: 'Design crit', start: at(8, 10), end: at(8, 11), intent: 'violet' },
  { id: 'demo', title: 'Demo day', start: at(8, 15), end: at(8, 16, 30), intent: 'success' },
  { id: 'dinner', title: 'Offsite dinner', start: at(8, 19), end: at(8, 21), intent: 'info' },
  {
    id: 'cutover',
    title: 'Datacenter cutover',
    start: at(8, 22),
    end: at(9, 1, 30),
    intent: 'danger',
  },
  { id: 'run', title: 'Long run', start: at(10, 9), end: at(10, 11), intent: 'success' },
];

// The hour grid scrolls inside the card: the card's height is the caller's.
const gridArgs = { events: WEEK_EVENTS, className: 'h-[640px]' };

/**
 * The week: a grid of 24 hours that scrolls, opened at 7 AM, one column a day, a row of all-day events
 * above it and a line at the current time. Events that overlap sit side by side, as many as the
 * width allows, the rest behind a "+N" button.
 */
export const Week: Story = {
  args: { ...gridArgs, defaultView: 'week' },
  globals: laptop,
};

/** The same grid, one column. The five events of Thursday afternoon fit side by side. */
export const Day: Story = {
  args: { ...gridArgs, defaultView: 'day' },
  globals: laptop,
};

/**
 * With `onSlotClick`, a click on an empty slot gives the start of its 30-minute slot (a click on the
 * all-day row says `allDay`), and the grid takes one tab stop for a cursor: arrow keys move it, Enter
 * picks the slot.
 */
export const WeekWithSlots: Story = {
  args: { ...gridArgs, defaultView: 'week', onSlotClick: fn() },
  globals: laptop,
};

/** The week in French: the title, the weekdays and the times come from `locale`. */
export const FrenchWeek: Story = {
  args: { ...gridArgs, defaultView: 'week', locale: 'fr-FR' },
  globals: laptop,
};

export const WeekEmpty: Story = {
  args: { ...gridArgs, defaultView: 'week', events: [] },
  globals: laptop,
};

export const WeekChecks: Story = {
  ...Week,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('heading', { name: /^May 4\s*–\s*10, 2026$/ })).toBeVisible();
    await expect(canvas.getByRole('radiogroup', { name: 'Calendar view' })).toBeVisible();
    await expect(canvas.getByRole('radio', { name: 'Week' })).toBeChecked();
    await expect(canvas.getByRole('button', { name: 'Today' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Previous week' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Next week' })).toBeVisible();

    // One group a day, Monday first, and one for the all-day events.
    const days = canvas.getAllByRole('group', { name: /^\w+, May \d+, 2026$/ });
    await expect(days).toHaveLength(7);
    await expect(days[0]).toHaveAccessibleName('Monday, May 4, 2026');
    await expect(days[6]).toHaveAccessibleName('Sunday, May 10, 2026');
    const allDay = within(canvas.getByRole('group', { name: 'All-day events' }));
    await expect(allDay.getAllByRole('listitem')).toHaveLength(3);
    await expect(
      allDay.getByRole('button', { name: /^Offsite: Lisbon\s*,\s*May 6\s*–\s*8, 2026$/ })
    ).toBeVisible();
    await expect(allDay.getByRole('button', { name: 'Quarter close' })).toBeVisible();

    // Timed events are listed under their day, in time order; all-day ones are not.
    const thursday = within(canvas.getByRole('group', { name: 'Thursday, May 7, 2026' }));
    await expect(thursday.queryByText('Offsite: Lisbon')).toBeNull();
    const titles = thursday
      .getAllByRole('listitem')
      .map((item) => item.querySelector('bdi')!.textContent);
    await expect(titles).toEqual([
      'Standup',
      'Release 2.4',
      'Postmortem: API latency',
      'Team lunch',
      'Pen test window',
      'Backup audit',
    ]);
    await expect(
      thursday.getByRole('button', { name: /^Release 2\.4\s*9:30\s*–\s*11:00\s*AM$/ })
    ).toBeVisible();

    // The line is at 10:42, in today's column, and says so in the gutter.
    const line = canvasElement.querySelector<HTMLElement>('[data-calendar-now]')!;
    await expect(canvasElement.querySelectorAll('[data-calendar-now]')).toHaveLength(1);
    await expect(canvas.getByRole('group', { name: 'Thursday, May 7, 2026' }).contains(line)).toBe(
      true
    );
    await expect(parseFloat(line.style.top)).toBeCloseTo((642 / 60) * 48 - 1, 1);
    await expect(plain(canvas.getByText(/^10:42/).textContent)).toBe('10:42 AM');

    // Opens at 7 AM: nothing starts before 9, so there is no earlier hour to show.
    const area = canvas.getByRole('group', { name: /^Schedule for/ });
    await expect(area.scrollTop).toBe(7 * 48);
  },
};

export const DayChecks: Story = {
  ...Day,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Thursday, May 7, 2026' })).toBeVisible();
    await expect(canvas.getByRole('radio', { name: 'Day' })).toBeChecked();
    await expect(canvas.getByRole('button', { name: 'Previous day' })).toBeVisible();
    await expect(canvas.getAllByRole('group', { name: /^\w+, May \d+, 2026$/ })).toHaveLength(1);

    const group = canvas.getByRole('group', { name: 'Thursday, May 7, 2026' });
    const items = within(group).getAllByRole('listitem');
    await expect(items.map((item) => item.querySelector('bdi')!.textContent)).toEqual([
      'Standup',
      'Release 2.4',
      'Postmortem: API latency',
      'Team lunch',
      'Pen test window',
      'Backup audit',
      'Capacity review',
      'Vendor sync',
      'Retro',
    ]);
    // Everything fits, so there is no "+N".
    await expect(within(group).queryByRole('button', { name: /more on/ })).toBeNull();

    // 48px an hour: Release 2.4 runs from 9:30 to 11:00, minus a 2px gap under it.
    const release = items[1];
    await expect(getComputedStyle(release).top).toBe(`${9.5 * 48}px`);
    await expect(getComputedStyle(release).height).toBe(`${1.5 * 48 - 2}px`);
    // A 15-minute event keeps the height of a line.
    await expect(getComputedStyle(items[0]).height).toBe('20px');

    // The five of the afternoon share the width without touching.
    const afternoon = items.slice(4).map((item) => item.getBoundingClientRect());
    for (const [i, a] of afternoon.entries())
      for (const b of afternoon.slice(i + 1))
        await expect(a.right <= b.left + 0.5 || b.right <= a.left + 0.5).toBe(true);
    await expect(afternoon[0].width).toBeGreaterThan(72);
  },
};

/** Past what the width holds (72px a column, two at least), the rest of the group is a "+N". */
export const WeekOverlapChecks: Story = {
  ...Week,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas, canvasElement }) => {
    const group = canvas.getByRole('group', { name: 'Thursday, May 7, 2026' });
    const thursday = within(group);
    // Five events overlap from 2 PM: two columns fit, so three are behind the button.
    const [pentest, backup] = ['Pen test window', 'Backup audit'].map(
      (name) => thursday.getByRole('button', { name: new RegExp(`^${name}`) }).parentElement!
    );
    const a = pentest.getBoundingClientRect();
    const b = backup.getBoundingClientRect();
    await expect(a.right <= b.left + 0.5 || b.right <= a.left + 0.5).toBe(true);
    await expect(Math.min(a.width, b.width)).toBeGreaterThanOrEqual(72 - 2);
    await expect(thursday.queryByText('Retro')).toBeNull();

    const more = thursday.getByRole('button', { name: '+3 more on Thursday, May 7, 2026' });
    await expect(more).toHaveTextContent('+3');
    await userEvent.click(more);
    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(body.getByRole('dialog', { name: 'Events on Thursday, May 7, 2026' }));
    // The list is the whole day, all-day events included: nine timed and one all-day.
    await expect(dialog.getAllByRole('listitem')).toHaveLength(10);
    await userEvent.click(dialog.getByRole('button', { name: /^2:45\s*PM\s*Retro/ }));
    await expect(args.onEventClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'retro' }));
    await expect(body.queryByRole('dialog')).toBeNull();
  },
};

/** An event over midnight is cut at 24:00 and picks up at 00:00, square where it was cut. */
export const WeekMidnightChecks: Story = {
  ...Week,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const friday = within(canvas.getByRole('group', { name: 'Friday, May 8, 2026' }));
    const saturday = within(canvas.getByRole('group', { name: 'Saturday, May 9, 2026' }));
    const first = friday.getByRole('button', { name: /^Datacenter cutover/ });
    const second = saturday.getByRole('button', { name: /^Datacenter cutover/ });
    await expect(plain(first.textContent)).toMatch(/10:00 PM – 1:30 AM, continues on the next day/);
    await expect(plain(second.textContent)).toMatch(/, continued from the previous day/);
    // 22:00 to midnight on Friday, midnight to 1:30 on Saturday.
    await expect(getComputedStyle(first.parentElement!).top).toBe(`${22 * 48}px`);
    await expect(getComputedStyle(first.parentElement!).height).toBe(`${2 * 48 - 2}px`);
    await expect(getComputedStyle(second.parentElement!).top).toBe('0px');
    await expect(getComputedStyle(second.parentElement!).height).toBe(`${1.5 * 48 - 2}px`);
    // Square at the cut, round at the other end.
    await expect(getComputedStyle(first).borderBottomLeftRadius).toBe('0px');
    await expect(getComputedStyle(first).borderTopRightRadius).not.toBe('0px');
    await expect(getComputedStyle(second).borderTopLeftRadius).toBe('0px');
    await expect(getComputedStyle(second).borderBottomRightRadius).not.toBe('0px');
  },
};

/** The grid opens an hour before the first event when that is earlier than 8 AM. */
export const WeekOpensBeforeAnEarlyEvent: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    ...gridArgs,
    defaultView: 'week',
    events: [
      { id: 'flight', title: 'Flight to Lisbon', start: at(7, 6, 30), end: at(7, 9) },
      { id: 'late', title: 'Dinner', start: at(7, 20), end: at(7, 22) },
    ],
  },
  play: async ({ canvas }) => {
    // 6:30 is in the hour of 6, so it opens on 5.
    await expect(canvas.getByRole('group', { name: /^Schedule for/ }).scrollTop).toBe(5 * 48);
  },
};

export const WeekEmptyChecks: Story = {
  ...WeekEmpty,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('No events this week');
    // Seven columns of hours are still drawn, with the line in today's.
    await expect(canvas.getAllByRole('group', { name: /^\w+, May \d+, 2026$/ })).toHaveLength(7);
    await userEvent.click(canvas.getByRole('radio', { name: 'Day' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('No events this day');
  },
};

/** The toolbar moves by the period of the view, and a view switch keeps to the current period. */
export const ViewsAndNavigationChecks: Story = {
  tags: ['!dev', '!autodocs'],
  args: gridArgs,
  play: async ({ args, canvas }) => {
    // From the current month to the current week, then the current day.
    await userEvent.click(canvas.getByRole('radio', { name: 'Week' }));
    await expect(args.onViewChange).toHaveBeenLastCalledWith('week');
    await expect(canvas.getByRole('heading', { name: /^May 4\s*–\s*10, 2026$/ })).toBeVisible();
    await expect(args.onDateChange).toHaveBeenLastCalledWith(at(4, 0));
    await userEvent.click(canvas.getByRole('radio', { name: 'Day' }));
    await expect(canvas.getByRole('heading', { name: 'Thursday, May 7, 2026' })).toBeVisible();
    await expect(args.onDateChange).toHaveBeenLastCalledWith(at(7, 0));

    await userEvent.click(canvas.getByRole('button', { name: 'Next day' }));
    await expect(canvas.getByRole('heading', { name: 'Friday, May 8, 2026' })).toBeVisible();
    await expect(args.onDateChange).toHaveBeenLastCalledWith(at(8, 0));
    await expect(canvas.getByRole('button', { name: 'Today' })).toBeEnabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Today' }));
    await expect(canvas.getByRole('heading', { name: 'Thursday, May 7, 2026' })).toBeVisible();

    // Weeks: forward, back past the start, back to today.
    await userEvent.click(canvas.getByRole('radio', { name: 'Week' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Next week' }));
    await expect(canvas.getByRole('heading', { name: /^May 11\s*–\s*17, 2026$/ })).toBeVisible();
    await expect(args.onDateChange).toHaveBeenLastCalledWith(at(11, 0));
    await expect(canvas.queryByRole('group', { name: 'Monday, May 4, 2026' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Previous week' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Previous week' }));
    await expect(canvas.getByRole('heading', { name: /^Apr 27\s*–\s*May 3, 2026$/ })).toBeVisible();
    await expect(args.onDateChange).toHaveBeenLastCalledWith(new Date(2026, 3, 27));

    // From a week that is not the current one, the month is the one its Thursday is in.
    await userEvent.click(canvas.getByRole('radio', { name: 'Month' }));
    await expect(canvas.getByRole('heading', { name: 'April 2026' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Today' }));
    await expect(canvas.getByRole('heading', { name: 'May 2026' })).toBeVisible();
  },
};

/** With `view` set and no host to follow it, the toolbar reports the pick and the view stays. */
export const ControlledViewChecks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...gridArgs, view: 'week' },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Day' }));
    await expect(args.onViewChange).toHaveBeenCalledWith('day');
    await expect(canvas.getByRole('heading', { name: /^May 4\s*–\s*10, 2026$/ })).toBeVisible();
  },
};

/** The week in French: titles, weekdays, hours and times are `locale`'s, the grid does not move. */
export const FrenchWeekChecks: Story = {
  ...FrenchWeek,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: /^4\s*[–-]\s*10 mai 2026$/ })).toBeVisible();
    const days = canvas.getAllByRole('group', { name: /^[a-zé]+ \d+ [a-zé]+ 2026$/ });
    await expect(days[0]).toHaveAccessibleName('lundi 4 mai 2026');
    await expect(days[6]).toHaveAccessibleName('dimanche 10 mai 2026');
    await expect(canvas.getAllByText(/^lun\.?$/)[0]).toBeVisible();
    const thursday = within(canvas.getByRole('group', { name: 'jeudi 7 mai 2026' }));
    await expect(
      thursday.getByRole('button', { name: /^Release 2\.4\s*09:30\s*[–-]\s*11:00$/ })
    ).toBeVisible();
    await expect(canvas.getByText(/^09\s*h$/)).toBeVisible();
  },
};

export const WeekSlotClickChecks: Story = {
  ...WeekWithSlots,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas }) => {
    // A pointer press at a minute of the day, in an empty part of its column.
    const press = async (group: HTMLElement, minutes: number) => {
      const rect = group.getBoundingClientRect();
      await userEvent.pointer({
        keys: '[MouseLeft]',
        target: group,
        coords: { clientX: rect.left + 8, clientY: rect.top + (minutes / 60) * 48 },
      });
    };
    const wednesday = canvas.getByRole('group', { name: 'Wednesday, May 6, 2026' });
    await press(wednesday, 8 * 60 + 15);
    await expect(args.onSlotClick).toHaveBeenLastCalledWith(at(6, 8, 0), { allDay: false });
    await press(wednesday, 8 * 60 + 45);
    await expect(args.onSlotClick).toHaveBeenLastCalledWith(at(6, 8, 30), { allDay: false });
    await press(wednesday, 23 * 60 + 59);
    await expect(args.onSlotClick).toHaveBeenLastCalledWith(at(6, 23, 30), { allDay: false });
    await expect(args.onSlotClick).toHaveBeenCalledTimes(3);

    // An event takes its own click: no slot is chosen under it.
    await userEvent.click(canvas.getByRole('button', { name: /^Roadmap workshop/ }));
    await expect(args.onEventClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'roadmap' })
    );
    await expect(args.onSlotClick).toHaveBeenCalledTimes(3);

    // A click in the all-day row, in a day with no event there: the day, flagged all-day.
    const saturday = canvas
      .getByRole('group', { name: 'Saturday, May 9, 2026' })
      .getBoundingClientRect();
    const row = canvas.getByRole('group', { name: 'All-day events' }).getBoundingClientRect();
    const cell = document.elementFromPoint(
      saturday.left + saturday.width / 2,
      row.top + row.height / 2
    )!;
    await userEvent.click(cell);
    await expect(args.onSlotClick).toHaveBeenLastCalledWith(at(9, 0), { allDay: true });
  },
};

/** One tab stop for a cursor on the slots; the status line says where it is. */
export const WeekKeyboardCursorChecks: Story = {
  ...WeekWithSlots,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas }) => {
    const grid = canvas.getByRole('application', { name: /^Schedule for/ });
    const status = canvas.getByRole('status');
    await expect(status.textContent).toBe('');
    // A focus the test gives by hand is not inside the `act` of a user event: let React draw it.
    grid.focus();
    await waitFor(() => expect(status).toHaveTextContent(/^Thursday, May 7, 2026, .*Press Enter/));

    await userEvent.keyboard('{Home}');
    await expect(plain(status.textContent)).toMatch(/^Thursday, May 7, 2026, 12:00 AM\./);
    await userEvent.keyboard('{ArrowDown}');
    await expect(plain(status.textContent)).toMatch(/12:30 AM\./);
    // The next day is the arrow toward the end of the line, whichever way the page reads.
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(plain(status.textContent)).toMatch(/^Friday, May 8, 2026, 12:30 AM\./);
    await userEvent.keyboard('{Enter}');
    await expect(args.onSlotClick).toHaveBeenLastCalledWith(at(8, 0, 30), { allDay: false });
    await userEvent.keyboard('{End}');
    await expect(plain(status.textContent)).toMatch(/11:30 PM\./);
    await userEvent.keyboard('{ArrowUp}');
    await expect(plain(status.textContent)).toMatch(/11:00 PM\./);

    // Past the last day of the week, the next week comes up with the cursor on its first day.
    await userEvent.keyboard(`{${keyToEnd()}}{${keyToEnd()}}`);
    await expect(plain(status.textContent)).toMatch(/^Sunday, May 10, 2026, 11:00 PM\./);
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(canvas.getByRole('heading', { name: /^May 11\s*–\s*17, 2026$/ })).toBeVisible();
    await expect(args.onDateChange).toHaveBeenLastCalledWith(at(11, 0));
    await expect(plain(status.textContent)).toMatch(/^Monday, May 11, 2026, 11:00 PM\./);
    await userEvent.keyboard('{PageUp}');
    await expect(canvas.getByRole('heading', { name: /^May 4\s*–\s*10, 2026$/ })).toBeVisible();
    await expect(plain(status.textContent)).toMatch(/^Monday, May 4, 2026, 11:00 PM\./);

    // The slot is drawn where the status says it is, and the grid sits still when it leaves.
    await expect(grid.querySelector('[class*="ring-2"]')).not.toBeNull();
    grid.blur();
    await waitFor(() => expect(status.textContent).toBe(''));
    await expect(grid.querySelector('[class*="ring-2"]')).toBeNull();
  },
};

/** Without `onSlotClick` the grid is a region you can scroll with the keyboard, and nothing else. */
export const WeekWithoutSlotsChecks: Story = {
  ...Week,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('application')).toBeNull();
    const region = canvas.getByRole('group', { name: /^Schedule for/ });
    await expect(region).toHaveAttribute('tabindex', '0');
    // Only the events and the toolbar are the other stops: no status line.
    await expect(canvas.queryByRole('status')).toBeNull();
  },
};

/** The columns read from the end side, the hours are on the start side, events start at the start. */
export const WeekMirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...gridArgs, defaultView: 'week' },
  globals: laptop,
  render: (args) => bothDirections(() => <EventCalendar {...args} />),
  play: async ({ canvasElement }) => {
    const group = (box: HTMLElement, name: string) => within(box).getByRole('group', { name });
    // Monday first, at the start edge; the hours too.
    expectMirrored(canvasElement, (box) => group(box, 'Monday, May 4, 2026'));
    expectMirrored(canvasElement, (box) => within(box).getAllByText(/^9\s*AM$/)[0]);
    expectMirrored(canvasElement, (box) => group(box, 'All-day events'));
    // An event keeps to the start side of its column.
    expectMirrored(canvasElement, (box) =>
      within(group(box, 'Thursday, May 7, 2026')).getByRole('button', { name: /^Release 2\.4/ })
    );
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const monday = group(box, 'Monday, May 4, 2026').getBoundingClientRect();
      const sunday = group(box, 'Sunday, May 10, 2026').getBoundingClientRect();
      expect(startEdge(monday, box)).toBeLessThan(startEdge(sunday, box));
    }
  },
};

// ── The week and the day on a phone ─────────────────────────────────────────

/**
 * Below `sm` a week is a strip of its seven days, a dot for each event, and the grid of the picked
 * day under it; Previous and Next move by a week. The view keeps its name: this is how the week fits.
 */
export const WeekMobile: Story = {
  args: { ...gridArgs, defaultView: 'week', onSlotClick: fn() },
  globals: mobileViewport,
};

/** The day is the same grid, one column wide already. */
export const DayMobile: Story = {
  args: { ...gridArgs, defaultView: 'day' },
  globals: mobileViewport,
};

export const WeekMobileChecks: Story = {
  ...WeekMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas }) => {
    expectNoHorizontalOverflow();
    // The view picker sits under the title and spans the card.
    const heading = canvas.getByRole('heading', { name: /^May 4\s*–\s*10, 2026$/ });
    const picker = canvas.getByRole('radiogroup', { name: 'Calendar view' });
    await expect(picker.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      heading.getBoundingClientRect().bottom
    );
    await expect(picker.getBoundingClientRect().width).toBeGreaterThan(
      heading.parentElement!.getBoundingClientRect().width - 40
    );

    // The week is the strip, today picked, and one column of hours under it.
    const strip = within(canvas.getByRole('group', { name: 'Days of the week' }));
    await expect(strip.getAllByRole('button')).toHaveLength(7);
    const thursday = strip.getByRole('button', { name: 'Thursday, May 7, 2026' });
    await expect(thursday).toHaveAttribute('aria-pressed', 'true');
    await expect(thursday).toHaveAttribute('aria-current', 'date');
    await expect(canvas.getAllByRole('group', { name: /^\w+, May \d+, 2026$/ })).toHaveLength(1);
    await expect(canvas.getByRole('group', { name: 'Thursday, May 7, 2026' })).toBeVisible();
    // Only the offsite runs through Thursday: the row lists the picked day's all-day events.
    await expect(
      within(canvas.getByRole('group', { name: 'All-day events' })).getAllByRole('listitem')
    ).toHaveLength(1);

    // Picking a day swaps the grid, and tells the host.
    await userEvent.click(strip.getByRole('button', { name: 'Friday, May 8, 2026' }));
    await expect(args.onDayClick).toHaveBeenCalledWith(at(8, 0));
    await expect(strip.getByRole('button', { name: 'Friday, May 8, 2026' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(thursday).toHaveAttribute('aria-pressed', 'false');
    const friday = within(canvas.getByRole('group', { name: 'Friday, May 8, 2026' }));
    await expect(friday.getByRole('button', { name: /^Demo day/ })).toBeVisible();
    await expect(canvas.queryByRole('group', { name: 'Thursday, May 7, 2026' })).toBeNull();
    await expect(
      within(canvas.getByRole('group', { name: 'All-day events' })).getAllByRole('listitem')
    ).toHaveLength(2);

    // The arrows go a week; the picked day falls back to the first day of the new one.
    await userEvent.click(canvas.getByRole('button', { name: 'Next week' }));
    await expect(canvas.getByRole('heading', { name: /^May 11\s*–\s*17, 2026$/ })).toBeVisible();
    await expect(
      within(canvas.getByRole('group', { name: 'Days of the week' })).getByRole('button', {
        name: 'Monday, May 11, 2026',
      })
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(args.onDateChange).toHaveBeenLastCalledWith(at(11, 0));
  },
};

export const DayMobileChecks: Story = {
  ...DayMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    // No strip in the day: its grid is already one column.
    await expect(canvas.queryByRole('group', { name: 'Days of the week' })).toBeNull();
    const group = canvas.getByRole('group', { name: 'Thursday, May 7, 2026' });
    await expect(group).toBeVisible();
    // The five events of the afternoon: the column is as wide as the phone, so 72px a column
    // fits as many as the width gives, and the rest are behind a "+N".
    const items = within(group).getAllByRole('listitem');
    const more = within(group).queryByRole('button', { name: /more on/ });
    await expect(items.length + (more ? Number(more.textContent!.replace('+', '')) : 0)).toBe(9);
    for (const item of items) {
      const box = item.getBoundingClientRect();
      await expect(box.right).toBeLessThanOrEqual(group.getBoundingClientRect().right + 1);
    }
  },
};
