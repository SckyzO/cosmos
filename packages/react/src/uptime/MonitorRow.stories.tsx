import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { beatsFrom, FLAPPING_BEATS, GAPPY_BEATS, MIXED_BEATS } from '../storybook-uptime';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { MonitorRow, type MonitorRowProps } from './MonitorRow';

const ALL_UP = beatsFrom('u'.repeat(60));

const meta = {
  title: 'Monitoring/Monitor Row',
  component: MonitorRow,
  parameters: portalDocsParams.md(),
  tags: ['autodocs'],
  args: { name: 'API', type: 'HTTP', beats: ALL_UP, uptime: 1 },
} satisfies Meta<typeof MonitorRow>;

export default meta;
type Story = StoryObj<typeof meta>;

type Monitor = MonitorRowProps & { id: string };

// One monitor per case of the mockup: up, degraded, down, paused.
const MONITORS: Monitor[] = [
  { id: 'api', name: 'API', type: 'HTTP', beats: ALL_UP, uptime: 1 },
  {
    id: 'prometheus',
    name: 'Prometheus',
    type: 'keyword',
    beats: beatsFrom('u'.repeat(38) + 'ggguugggguggg'.slice(0, 22)),
    uptime: 0.9992,
  },
  {
    id: 'dns',
    name: 'DNS resolver',
    type: 'DNS',
    beats: beatsFrom('u'.repeat(41) + 'dddudddddd'),
    uptime: 0.974,
  },
  {
    id: 'backup',
    name: 'Backup host',
    type: 'ping',
    beats: GAPPY_BEATS,
    uptime: null,
    paused: true,
  },
];

const Rows = ({ list = MONITORS }: { list?: Monitor[] }) => (
  <ul className="m-0 list-none divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-0">
    {list.map(({ id, ...monitor }) => (
      <li key={id}>
        <MonitorRow {...monitor} />
      </li>
    ))}
  </ul>
);

/** One monitor as a line of a list. The state is a chip named in words. */
export const Default: Story = {
  decorators: [
    (Story) => (
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)]">
        <Story />
      </div>
    ),
  ],
};

/** A list of monitors: up, degraded, down, and paused. */
export const List: Story = { render: () => <Rows /> };

/** The same monitors as tiles of a grid. */
export const Cards: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      {MONITORS.map(({ id, ...monitor }) => (
        <MonitorRow key={id} {...monitor} variant="card" />
      ))}
    </div>
  ),
};

/** A monitor that keeps going down and coming back. */
export const Flapping: Story = {
  render: () => (
    <Rows
      list={[{ id: 'flap', name: 'Edge proxy', type: 'TCP', beats: FLAPPING_BEATS, uptime: 0.931 }]}
    />
  ),
};

/** Long gaps: checks that did not run stand as stubs, and the latest are pending. */
export const LongGaps: Story = {
  render: () => (
    <Rows
      list={[
        {
          id: 'gap',
          name: 'Batch runner',
          type: 'ping',
          beats: GAPPY_BEATS,
          status: 'pending',
          uptime: 0.97,
        },
      ]}
    />
  ),
};

/** A monitor in a maintenance window, and one with no beats at all. */
export const MaintenanceAndNew: Story = {
  render: () => (
    <Rows
      list={[
        {
          id: 'maint',
          name: 'Database',
          type: 'TCP',
          beats: beatsFrom('u'.repeat(50) + 'mmmmmmmmmm'),
          uptime: 1,
        },
        { id: 'new', name: 'New monitor', type: 'HTTP', beats: [], uptime: null },
      ]}
    />
  ),
};

/** The name is a link when `href` is set. */
export const WithLink: Story = { args: { href: '#api', name: 'API' } };

/** The type is any string: a protocol, a kind of check. */
export const TypesAreFreeStrings: Story = {
  render: () => (
    <Rows
      list={['HTTP', 'TCP', 'DNS', 'ping', 'keyword', 'gRPC', 'TLS certificate'].map((type) => ({
        id: type,
        name: `Monitor ${type}`,
        type,
        beats: ALL_UP,
        uptime: 1,
      }))}
    />
  ),
};

/** At 375px a row stacks: the status and name, then the beats, with the figures on the first line. */
export const MobileRows: Story = {
  render: () => <Rows />,
  globals: mobileViewport,
  play: ({ canvasElement }) => {
    expectNoHorizontalOverflow();
    const rows = canvasElement.querySelectorAll('li > div');
    expect(rows.length).toBe(MONITORS.length);
  },
};

export const MobileCards: Story = {
  render: Cards.render,
  globals: mobileViewport,
  play: () => expectNoHorizontalOverflow(),
};

// ── Tests ────────────────────────────────────────────────────────────────────

/** The state is read from the last beat, overridden by `status`, and paused wins over both. */
export const StateIsNamedInWords: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <ul className="m-0 list-none p-0">
      <li>
        <MonitorRow name="Last up" beats={beatsFrom('dddu')} />
      </li>
      <li>
        <MonitorRow name="Last down" beats={beatsFrom('uudd')} />
      </li>
      <li>
        <MonitorRow name="Forced" beats={beatsFrom('uuuu')} status="degraded" />
      </li>
      <li>
        <MonitorRow name="Paused one" beats={beatsFrom('uuuu')} status="down" paused />
      </li>
      <li>
        <MonitorRow name="Empty" beats={[]} />
      </li>
    </ul>
  ),
  play: async ({ canvas }) => {
    const item = (name: string) => within(canvas.getByText(name).closest('li')!);
    await expect(item('Last up').getByRole('img', { name: 'Up' })).toBeInTheDocument();
    await expect(item('Last down').getByRole('img', { name: 'Down' })).toBeInTheDocument();
    await expect(item('Forced').getByRole('img', { name: 'Degraded' })).toBeInTheDocument();
    await expect(item('Paused one').getByRole('img', { name: 'Paused' })).toBeInTheDocument();
    await expect(item('Paused one').getByText('Paused', { selector: 'span' })).toBeVisible();
    await expect(item('Empty').getByRole('img', { name: 'Pending' })).toBeInTheDocument();
  },
};

/** The uptime and the latency are read in words as well as shown: with a name, and "No data". */
export const FiguresAreNamed: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <ul className="m-0 list-none p-0">
      <li>
        <MonitorRow name="Healthy" beats={ALL_UP} uptime={0.9995} />
      </li>
      <li>
        <MonitorRow name="Down" beats={beatsFrom('uudd')} uptime={0.97} />
      </li>
      <li>
        <MonitorRow name="Fresh monitor" beats={[]} />
      </li>
      <li>
        <MonitorRow name="Fixed latency" beats={ALL_UP} latency={1480} uptime={0.9992} />
      </li>
    </ul>
  ),
  play: async ({ canvas }) => {
    const item = (name: string) => within(canvas.getByText(name).closest('li')!);
    await expect(item('Healthy').getByText('99.95%')).toBeVisible();
    await expect(item('Healthy').getByText(/Latency:/)).toBeInTheDocument();
    // A down monitor has no response time to show.
    await expect(item('Down').getByText('No response time')).toBeInTheDocument();
    await expect(item('Fresh monitor').getByText('No data')).toBeInTheDocument();
    await expect(item('Fixed latency').getByText('1,480 ms')).toBeVisible();
  },
};

/** The beats keep the HeartbeatBar's keyboard model and tooltips inside a row. */
export const BeatsAreReachableInARow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { beats: MIXED_BEATS },
  render: (args) => (
    <div style={{ width: 720 }}>
      <MonitorRow {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const group = within(canvasElement).getByRole('group', { name: 'API: recent checks' });
    await userEvent.tab();
    await waitFor(() => expect(group.contains(document.activeElement)).toBe(true));
    await expect(await body.findByRole('tooltip')).toBeVisible();
    // The bar of a row is 24px high.
    await expect(group.getBoundingClientRect().height).toBe(24);
  },
};
