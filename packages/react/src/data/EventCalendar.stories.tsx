import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { EventCalendar, type CalendarEvent } from './EventCalendar';
import {
  bothDirections,
  directionBox,
  expectMirrored,
  expectNoHorizontalOverflow,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';

const TODAY = new Date(2026, 4, 7);

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
    month: { control: false },
    defaultMonth: { control: false },
    today: { control: false },
  },
  args: {
    events: EVENTS,
    today: TODAY,
    onEventClick: fn(),
    onDayClick: fn(),
    onMonthChange: fn(),
    // The stories read English names: pin the locale rather than follow the browser's.
    locale: 'en-US',
  },
} satisfies Meta<typeof EventCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { events: [] },
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
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('Grafana upgrade')[0].closest('button')).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Thursday, May 14, 2026' })).toBeNull();
  },
};

export const WeeksStartOnMonday: Story = {
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

    await userEvent.click(dialog.getByRole('button', { name: 'Backup audit' }));
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

export const MonthNavigation: Story = {
  play: async ({ args, canvas }) => {
    const todayButton = canvas.getByRole('button', { name: 'Today' });
    await expect(canvas.getByRole('heading', { name: 'May 2026' })).toBeVisible();
    await expect(todayButton).toBeDisabled();

    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    await expect(canvas.getByRole('heading', { name: 'June 2026' })).toBeVisible();
    await expect(args.onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 5, 1));
    // June 2026 starts on a Monday: no greyed days before the 1st.
    await expect(canvas.getAllByRole('group')[0]).toHaveAccessibleName('Monday, June 1, 2026');

    await userEvent.click(todayButton);
    await expect(canvas.getByRole('heading', { name: 'May 2026' })).toBeVisible();
    await expect(args.onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 4, 1));
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
    await userEvent.click(dialog.getByRole('button', { name: 'Backup audit' }));
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

// ── Narrow screens (#291) ────────────────────────────────────────────────────

/**
 * Below `sm` the weekday names shrink to one letter, the chips to dots, and the picked day (today
 * to begin with) lists its events under the grid.
 */
export const Mobile: Story = {
  globals: mobileViewport,
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
