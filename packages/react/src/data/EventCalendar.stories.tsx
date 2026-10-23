import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { EventCalendar, type CalendarEvent } from './EventCalendar';

const TODAY = new Date(2026, 4, 7);

const EVENTS: CalendarEvent[] = [
  {
    id: 'dc',
    title: 'Datacenter migration',
    start: new Date(2026, 3, 29),
    end: new Date(2026, 4, 1),
    tone: 'violet',
  },
  { id: 'planning', title: 'Sprint planning', start: new Date(2026, 4, 4) },
  {
    id: 'patching',
    title: 'Kernel patching, rack A',
    start: new Date(2026, 4, 5),
    tone: 'warning',
  },
  { id: 'release', title: 'Release 2.4', start: new Date(2026, 4, 7, 9), tone: 'success' },
  {
    id: 'postmortem',
    title: 'Postmortem: API latency',
    start: new Date(2026, 4, 7, 11),
    tone: 'danger',
  },
  { id: 'one-on-one', title: '1:1 with Sarah', start: new Date(2026, 4, 7, 14), tone: 'violet' },
  { id: 'vendor', title: 'Vendor call', start: new Date(2026, 4, 7, 15), tone: 'info' },
  { id: 'backup', title: 'Backup audit', start: new Date(2026, 4, 7, 16), tone: 'warning' },
  {
    id: 'kubecon',
    title: 'KubeCon trip',
    start: new Date(2026, 4, 9),
    end: new Date(2026, 4, 12),
    tone: 'info',
  },
  { id: 'grafana', title: 'Grafana upgrade', start: new Date(2026, 4, 14) },
  { id: 'capacity', title: 'Capacity review', start: new Date(2026, 4, 19) },
  { id: 'handover', title: 'On-call handover', start: new Date(2026, 4, 21), tone: 'violet' },
  {
    id: 'pentest',
    title: 'Pen test window',
    start: new Date(2026, 4, 25),
    end: new Date(2026, 4, 26),
    tone: 'danger',
  },
  { id: 'report', title: 'Quarterly report', start: new Date(2026, 4, 28), tone: 'success' },
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
  play: async ({ canvas }) => {
    // Saturday to Tuesday, across a week boundary.
    for (const day of [
      'Saturday, May 9, 2026',
      'Sunday, May 10, 2026',
      'Monday, May 11, 2026',
      'Tuesday, May 12, 2026',
    ]) {
      const cell = within(canvas.getByRole('group', { name: day }));
      await expect(cell.getByText('KubeCon trip')).toBeVisible();
    }
    await expect(canvas.getAllByText('KubeCon trip')).toHaveLength(4);
    // Starts in April: shown on the greyed days before the 1st too.
    await expect(
      within(canvas.getByRole('group', { name: 'Wednesday, April 29, 2026' })).getByText(
        'Datacenter migration'
      )
    ).toBeVisible();
  },
};

export const BusyDayOpensMore: Story = {
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
