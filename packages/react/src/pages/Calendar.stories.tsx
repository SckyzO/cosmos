import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { Bell, CalendarDays, GitBranch, Home, Plus, Server, Settings } from 'lucide-react';
import { expect, userEvent, within } from 'storybook/test';
import { EventCalendar, type CalendarEvent } from '../data/EventCalendar';
import { MiniCalendar } from '../data/MiniCalendar';
import { Shell } from '../layout/Shell';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { PageHeader } from '../templates/PageHeader';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { placeholderAvatar } from '../storybook-avatars';
import { portalDocsParams } from '../storybook-helpers';

// Team calendar: the month view in the main column, and a side column with a
// MiniCalendar to jump to a date and the events coming up from the picked day.
// Composed from existing Cosmos primitives.

const meta = {
  title: 'Pages/Calendar',
  parameters: portalDocsParams.full(),
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const TODAY = new Date(2026, 4, 7);

const EVENTS: CalendarEvent[] = [
  { id: 'planning', title: 'Sprint planning', start: new Date(2026, 4, 4) },
  {
    id: 'patching',
    title: 'Kernel patching, rack A',
    start: new Date(2026, 4, 5),
    tone: 'warning',
  },
  { id: 'release', title: 'Release 2.4', start: new Date(2026, 4, 7), tone: 'success' },
  {
    id: 'postmortem',
    title: 'Postmortem: API latency',
    start: new Date(2026, 4, 7),
    tone: 'danger',
  },
  { id: 'one-on-one', title: '1:1 with Sarah', start: new Date(2026, 4, 7), tone: 'violet' },
  { id: 'vendor', title: 'Vendor call', start: new Date(2026, 4, 7), tone: 'info' },
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
  { id: 'drill', title: 'Failover drill', start: new Date(2026, 5, 10), tone: 'warning' },
  { id: 'offsite', title: 'Team offsite', start: new Date(2026, 5, 17), tone: 'violet' },
];

const UPCOMING_COUNT = 4;

const DOT: Record<NonNullable<CalendarEvent['tone']>, string> = {
  brand: 'bg-brand-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  violet: 'bg-violet-500',
};

const shortDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Every day an event covers, for the MiniCalendar dots.
const eventDays = (events: CalendarEvent[]) => {
  const days = new Set<string>();
  for (const e of events) {
    const end = e.end ?? e.start;
    for (let d = e.start; d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))
      days.add(dayKey(d));
  }
  return days;
};

const Upcoming = ({ from }: { from: Date }) => {
  const next = EVENTS.filter((e) => (e.end ?? e.start) >= from)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, UPCOMING_COUNT);
  return (
    <Card padding="none">
      <Card.Header>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Upcoming</h3>
        <span className="text-xs text-[var(--color-text-muted)]">From {shortDate(from)}</span>
      </Card.Header>
      {next.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
          Nothing planned yet.
        </p>
      ) : (
        <ul aria-label="Upcoming events" className="divide-y divide-[var(--color-border)]">
          {next.map((e) => (
            <li key={e.id} className="flex items-start gap-3 px-4 py-3">
              <span
                aria-hidden
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[e.tone ?? 'brand']}`}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                  {e.title}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {shortDate(e.start)}
                  {e.end && ` – ${shortDate(e.end)}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

const CalendarContent = () => {
  const [month, setMonth] = useState(TODAY);
  const [selected, setSelected] = useState(TODAY);
  const days = useMemo(() => eventDays(EVENTS), []);
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Calendar"
        description="Releases, maintenance windows and on-call for the platform team."
        actions={<Button icon={Plus}>New event</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <EventCalendar
          events={EVENTS}
          today={TODAY}
          month={month}
          onMonthChange={setMonth}
          onDayClick={setSelected}
          onEventClick={(e) => setSelected(e.start)}
        />
        <aside
          aria-label="Calendar sidebar"
          className="grid content-start gap-6 md:grid-cols-2 xl:grid-cols-1"
        >
          <MiniCalendar
            today={TODAY}
            selected={selected}
            eventDays={days}
            onSelect={(d) => {
              setSelected(d);
              setMonth(d);
            }}
          />
          <Upcoming from={selected} />
        </aside>
      </div>
    </div>
  );
};

const CalendarPage = () => (
  <Shell
    topbar={
      <Topbar
        sidebarCollapsed={false}
        onToggleSidebar={() => {}}
        rightActions={
          <>
            <button
              type="button"
              aria-label="Notifications"
              className="rounded-full p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <Bell className="size-5" aria-hidden />
            </button>
            <img
              alt=""
              src={placeholderAvatar('cosmos-calendar', 64)}
              className="size-8 rounded-full"
            />
          </>
        }
      />
    }
    sidebar={
      <Sidebar>
        <Sidebar.Brand title="Cosmos" />
        <Sidebar.Section>
          <Sidebar.Item icon={Home} label="Home" />
          <Sidebar.Item icon={CalendarDays} label="Calendar" active />
          <Sidebar.Item icon={GitBranch} label="Deployments" />
          <Sidebar.Item icon={Server} label="Servers" />
          <Sidebar.Item icon={Settings} label="Settings" />
        </Sidebar.Section>
      </Sidebar>
    }
  >
    <CalendarContent />
  </Shell>
);

export const Default: Story = {
  render: () => <CalendarPage />,
};

/** Interaction test, kept off the docs page so Default shows the initial state. */
export const PickingADayUpdatesUpcoming: Story = {
  tags: ['!autodocs'],
  render: () => <CalendarPage />,
  play: async ({ canvas }) => {
    const side = within(canvas.getByRole('complementary', { name: 'Calendar sidebar' }));
    const upcoming = () => within(side.getByRole('list', { name: 'Upcoming events' }));
    await expect(upcoming().getAllByRole('listitem')[0]).toHaveTextContent('Release 2.4');

    // Picking a day in the side calendar moves the month view and the list.
    await userEvent.click(side.getByRole('button', { name: 'Next month' }));
    await userEvent.click(side.getByRole('button', { name: 'Wednesday, June 10, 2026' }));
    await expect(canvas.getByRole('heading', { name: 'June 2026' })).toBeVisible();
    await expect(upcoming().getAllByRole('listitem')[0]).toHaveTextContent('Failover drill');

    // Clicking a day in the month view updates the list too.
    await userEvent.click(canvas.getByRole('button', { name: 'Today' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Thursday, May 21, 2026' }));
    await expect(upcoming().getAllByRole('listitem')[0]).toHaveTextContent('On-call handover');
  },
};
