import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Activity,
  Bell,
  FileText,
  Gauge,
  Home,
  Plus,
  RotateCw,
  Server,
  Settings,
  Cable,
} from 'lucide-react';
import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { RealtimeChart } from '../../../../packages/charts/src';
import {
  AlertBanner,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  DescriptionList,
  EmptyState,
  ErrorState,
  HealthBadge,
  HealthCheckList,
  HealthMatrix,
  HealthSummary,
  HeartbeatBar,
  LogLevelBadge,
  LogToolbar,
  LogViewer,
  MonitorRow,
  PageContainer,
  PageHeader,
  Shell,
  Sidebar,
  Sk,
  SkeletonList,
  SkeletonTable,
  Topbar,
  UptimeBars,
  UptimeStat,
  LOG_LEVEL_KEYS,
  countLogLevels,
  type HealthStatus,
  type LogLevelKey,
  type LogLine,
} from '../../../../packages/react/src';
import {
  expectNoHorizontalOverflow,
  mobileViewport,
  portalDocsParams,
} from '../../../../packages/react/src/storybook-helpers';
import {
  CLUSTER,
  EVENTS,
  EXTREME_CLUSTER,
  EXTREME_COLUMNS,
  EXTREME_EVENTS,
  EXTREME_INCIDENT,
  EXTREME_SERVICES,
  INCIDENT,
  NODE_CHECKS,
  NODE_COLUMNS,
  NODE_FACTS,
  NOW,
  POWER_TRACE,
  SCHEDULER_DAYS,
  SCHEDULER_PERIODS,
  SERVICES,
  SETUP_STEPS,
  STALE_CLUSTER,
  STALE_SERVICES,
  STALE_SINCE,
  type Cluster,
  type Service,
} from './monitoring.data';

// A live operations screen: Rackwatch watching the Atlas cluster of a university datacenter. The
// health components do the work (the roll-up, the matrix of nodes by rack, the service rows, the
// heartbeats, the log viewer); this file only chooses their options and gives them data. Each
// state is a value of `state`, not a copy of the screen, so the frame around the page is the same
// in all of them. Every relative time is frozen with `now`, and the power chart replays a
// recorded trace, so a story reads the same on every run.

type State = 'content' | 'empty' | 'loading' | 'error' | 'extreme' | 'node';

type MonitoringScreenProps = {
  /** Which state of the screen to show. */
  state?: State;
  /** Called by the error state's "Retry". */
  onRetry?: () => void;
};

// ── Small pieces ─────────────────────────────────────────────────────────────

// Below `sm` the matrix gets a height of its own, so the page keeps the roll-up, the services and
// the events in reach instead of one long grid. The matrix scrolls in its own box either way.
const PHONE = '(max-width: 639px)';
const subscribePhone = (notify: () => void) => {
  const query = window.matchMedia(PHONE);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};
const usePhone = () =>
  useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE).matches,
    () => false
  );

// A titled card: the `h2` of a section of the page.
const Panel = ({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) => (
  <section
    aria-label={title}
    className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-5"
  >
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
      <h2 className="m-0 text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
      {aside && <div className="ms-auto text-sm text-[var(--color-text-secondary)]">{aside}</div>}
    </div>
    {children}
  </section>
);

// ── The frame ────────────────────────────────────────────────────────────────

// The Topbar's badge is the cluster's health at a glance, whatever the page: it goes when nothing
// is monitored yet.
const Frame = ({
  health,
  children,
}: {
  health?: { status: HealthStatus; label: string };
  children: ReactNode;
}) => (
  <Shell
    topbar={
      // The page title is text here: the `PageHeader` below holds the one `h1`.
      <Topbar
        pageTitle="Cluster overview"
        endActions={
          <>
            {health && <HealthBadge status={health.status} label={health.label} />}
            <button
              type="button"
              aria-label="Notifications, 3 unread"
              className="focus-visible:focus-indicator rounded-full p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <Bell className="size-5" aria-hidden />
            </button>
            <Avatar name="Maya Kowalski" size="sm" />
          </>
        }
      />
    }
    sidebar={
      <Sidebar>
        <Sidebar.Brand title="Rackwatch" logo={<Gauge className="size-5" aria-hidden />} />
        <Sidebar.Section label="Monitoring">
          <Sidebar.Item icon={Home} label="Overview" active />
          <Sidebar.Item icon={Server} label="Nodes" />
          <Sidebar.Item icon={Activity} label="Services" />
          <Sidebar.Item icon={FileText} label="Logs" />
          <Sidebar.Item
            icon={Bell}
            label="Alerts"
            badge={
              <Badge size="sm" intent="danger">
                3
              </Badge>
            }
          />
        </Sidebar.Section>
        <Sidebar.Section label="Admin">
          <Sidebar.Item icon={Cable} label="Exporters" />
          <Sidebar.Item icon={Settings} label="Settings" />
        </Sidebar.Section>
      </Sidebar>
    }
  >
    <PageContainer width="full" className="flex flex-col gap-6">
      {children}
    </PageContainer>
  </Shell>
);

// ── The overview ─────────────────────────────────────────────────────────────

const Summary = ({
  cluster,
  status,
  stale,
}: {
  cluster: Cluster;
  status?: HealthStatus;
  stale?: boolean;
}) => {
  const [autoRefreshMs, setAutoRefreshMs] = useState(30_000);
  return (
    <HealthSummary
      checks={cluster.checks}
      // The host weighs the checks: three dead nodes in 96 degrade Atlas, they do not stop it.
      status={status}
      now={NOW}
      // While the data source is down, the last answer is what the summary dates itself by.
      checkedAt={stale ? STALE_SINCE : undefined}
      stale={stale ? STALE_SINCE : undefined}
      refresh={{
        autoRefreshMs,
        onIntervalChange: setAutoRefreshMs,
        // A real screen refetches here and sets `refreshing` while it waits.
        onRefresh: () => {},
      }}
    />
  );
};

const Nodes = ({
  cluster,
  extreme,
  stale,
}: {
  cluster: Cluster;
  extreme?: boolean;
  stale?: boolean;
}) => {
  const phone = usePhone();
  return (
    <HealthMatrix
      title={extreme ? 'Nodes by rack · 2,048 nodes' : 'Nodes by rack'}
      ariaLabel="Nodes by rack"
      columns={extreme ? EXTREME_COLUMNS : NODE_COLUMNS}
      rows={cluster.rows}
      // A rack is a row and a node a column: the first header says so.
      rowHeader="Rack"
      // The racks with a problem, worst first; picking one scrolls its row into view.
      attentionStrip
      maxHeight={extreme ? 480 : phone ? 320 : undefined}
      stale={stale ? STALE_SINCE : undefined}
      now={NOW}
    />
  );
};

const Services = ({ services, stale }: { services: Service[]; stale?: boolean }) => {
  const healthy = services.filter((s) => s.beats[s.beats.length - 1]?.status === 'up').length;
  return (
    <Panel title="Services" aside={`${healthy} of ${services.length} healthy`}>
      <ul className="m-0 list-none divide-y divide-[var(--color-border)] p-0">
        {services.map((service) => (
          <li key={service.id}>
            <MonitorRow
              name={service.name}
              type={service.type}
              beats={service.beats}
              uptime={service.uptime}
              latency={service.latency}
              stale={stale ? STALE_SINCE : undefined}
              now={NOW}
            />
          </li>
        ))}
      </ul>
    </Panel>
  );
};

const Scheduler = () => (
  <Panel title="Scheduler · slurmctld" aside={<HealthBadge status="OK" label="Healthy" />}>
    <div className="flex flex-col gap-5">
      <HeartbeatBar beats={SERVICES[0]!.beats} legend ariaLabel="Scheduler: recent checks" />
      <UptimeStat periods={SCHEDULER_PERIODS} responseTime={4} ariaLabel="slurmctld uptime" />
      <UptimeBars days={SCHEDULER_DAYS} period={30} title="Last 30 days" />
    </div>
  </Panel>
);

const Power = () => {
  // The chart asks the generator for every sample. This one replays a recorded trace so the line
  // is the same on every run; a real screen passes the latest reading from its API. It has to be
  // stable: the chart restarts its timer when the generator changes.
  const [generator] = useState(() => {
    let i = 0;
    return () => POWER_TRACE[i++ % POWER_TRACE.length]!;
  });
  return (
    <Panel title="Cluster power" aside={<b className="tabular-nums">452 kW</b>}>
      <RealtimeChart
        ariaLabel="Cluster power over the last hour, 452 kW now"
        generator={generator}
        // A sample every two minutes: a story is gone long before the next one, so it stays still.
        intervalMs={120_000}
        windowSize={POWER_TRACE.length}
        min={350}
        max={550}
        warnThreshold={480}
        critThreshold={520}
        formatValue={(kw) => `${kw} kW`}
        height={200}
      />
    </Panel>
  );
};

const Events = ({
  lines,
  wrap,
  failed,
  onRetry,
}: {
  lines: readonly LogLine[];
  wrap?: boolean;
  failed?: boolean;
  onRetry?: () => void;
}) => {
  // The viewer filters what it is given; the toolbar owns the filters, so both read one state.
  const [levels, setLevels] = useState<readonly LogLevelKey[]>(LOG_LEVEL_KEYS);
  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState(0);
  const [active, setActive] = useState(0);
  const counts = countLogLevels(lines);
  const shown = LOG_LEVEL_KEYS.filter((level) => level !== 'unknown' && counts[level] > 0);

  return (
    <Panel title="Events" aside={failed ? undefined : 'updated 12 s ago'}>
      {failed ? (
        <ErrorState
          compact
          title="Event stream lost"
          description="Last line received 14:28:11."
          onRetry={onRetry}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <ul aria-label="Lines per level" className="m-0 flex list-none flex-wrap gap-3 p-0">
            {shown.map((level) => (
              <li key={level} className="flex items-center gap-1.5 text-sm tabular-nums">
                <LogLevelBadge level={level} />
                {counts[level]}
              </li>
            ))}
          </ul>
          <LogToolbar
            levels={shown}
            levelCounts={counts}
            activeLevels={levels}
            onActiveLevelsChange={setLevels}
            search={search}
            onSearchChange={(text) => {
              setSearch(text);
              setActive(0);
            }}
            matchCount={matches}
            activeMatch={active}
            onActiveMatchChange={setActive}
          />
          <LogViewer
            aria-label="Recent events"
            // Oldest first, as the viewer wants them; it draws the newest on top.
            lines={lines}
            order="newest-first"
            tone="surface"
            height={260}
            wrap={wrap}
            activeLevels={levels}
            search={search}
            activeMatch={active}
            onMatchCountChange={setMatches}
            locale="en-GB"
            timeZone="UTC"
          />
        </div>
      )}
    </Panel>
  );
};

const Overview = ({ state, onRetry }: { state: State; onRetry?: () => void }) => {
  const extreme = state === 'extreme';
  const stale = state === 'error';
  const incident = extreme ? EXTREME_INCIDENT : INCIDENT;
  return (
    <>
      <PageHeader
        as="h1"
        title="Cluster overview"
        description={
          extreme
            ? 'Atlas · Halden University · 2,048 nodes'
            : 'Atlas · Halden University · 8 racks, 96 nodes'
        }
      />

      {stale ? (
        // The data source is down: say so first, with the way out, above the data it explains.
        <AlertBanner
          intent="danger"
          title="Can't reach Prometheus"
          action={
            <Button size="sm" variant="secondary" icon={RotateCw} onClick={onRetry}>
              Retry
            </Button>
          }
        >
          prom-01.rc.halden.example:9090 has not answered for 4 min (connection timed out).
          Rackwatch shows the last data it received. Next attempt in 18 s.
        </AlertBanner>
      ) : (
        <AlertBanner
          intent="danger"
          title={`Active incident ${incident.id}: ${incident.title}`}
          action={
            <Button size="sm" variant="secondary">
              View incident
            </Button>
          }
        >
          {incident.detail}
        </AlertBanner>
      )}

      <Summary
        cluster={extreme ? EXTREME_CLUSTER : stale ? STALE_CLUSTER : CLUSTER}
        // Atlas is degraded, not down; with the data gone, nobody knows. The extreme case lets the
        // worst check decide.
        status={stale ? 'UNKNOWN' : extreme ? undefined : 'WARN'}
        stale={stale}
      />
      <Nodes
        cluster={extreme ? EXTREME_CLUSTER : stale ? STALE_CLUSTER : CLUSTER}
        extreme={extreme}
        stale={stale}
      />

      {stale ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Services services={STALE_SERVICES} stale />
          <Events lines={[]} failed onRetry={onRetry} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-6">
              <Scheduler />
              <Power />
            </div>
            <Services services={extreme ? EXTREME_SERVICES : SERVICES} />
          </div>
          <Events lines={extreme ? EXTREME_EVENTS : EVENTS} wrap={extreme} />
        </>
      )}
    </>
  );
};

// ── The other states ─────────────────────────────────────────────────────────

// Nothing is monitored yet: one way forward (add an exporter), and the steps that lead there as a
// numbered list inside the empty state.
const EmptyPage = () => (
  <>
    <PageHeader as="h1" title="Cluster overview" />
    <EmptyState
      intent="brand"
      icon={Cable}
      title="Add your first exporter"
      description="Rackwatch reads the metrics Prometheus already scrapes. Connect one exporter and your racks appear here within a minute."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button icon={Plus}>Add exporter</Button>
          <Button variant="ghost">Read the setup guide</Button>
        </div>
      }
    >
      <p className="m-0 mb-3 text-xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
        Three steps, about ten minutes
      </p>
      <ol aria-label="Setup steps" className="m-0 flex list-none flex-col gap-4 p-0">
        {SETUP_STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span
              aria-hidden
              className="bg-brand-500/10 text-brand-600 dark:text-brand-400 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="m-0 text-sm font-medium text-[var(--color-text-primary)]">
                {step.title}
              </p>
              <p className="m-0 text-sm text-[var(--color-text-secondary)]">{step.text}</p>
              <code className="mt-1.5 block rounded-md bg-gray-100 px-2 py-1 font-mono text-xs break-all text-[var(--color-text-primary)] dark:bg-gray-800">
                {step.code}
              </code>
            </div>
          </li>
        ))}
      </ol>
    </EmptyState>
  </>
);

// The first load: the page header and the frame are there, skeletons stand where the summary, the
// matrix and the events go. One busy region and one status message say it to a screen reader.
const LoadingPage = () => (
  <>
    <PageHeader as="h1" title="Cluster overview" description="Loading…" />
    <div aria-busy="true" className="flex flex-col gap-6">
      <p role="status" className="sr-only">
        Loading cluster status…
      </p>
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] px-5 py-4">
        <Sk h="h-11" w="w-11" round="rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Sk h="h-5" w="w-1/3" />
          <Sk h="h-4" w="w-1/2" />
        </div>
      </div>
      <Panel title="Nodes by rack">
        <SkeletonTable rows={8} cols={12} />
      </Panel>
      <Panel title="Events">
        <SkeletonList rows={6} showAction={false} />
      </Panel>
    </div>
  </>
);

// One node, opened from the matrix. On a phone it is a page of its own: what the node is, then
// its health checks, the failing ones first.
const NodePage = () => (
  <>
    <PageHeader
      as="h1"
      title="gpu-b01-04"
      breadcrumb={<Breadcrumb items={[{ label: 'Nodes', href: '#' }, { label: 'gpu-b01-04' }]} />}
      description="Critical · checked 12 s ago"
      actions={
        <>
          <Button>Acknowledge</Button>
          <Button variant="secondary">Open logs</Button>
        </>
      }
    />
    <DescriptionList compact>
      {NODE_FACTS.map((fact) => (
        <DescriptionList.Item key={fact.label} label={fact.label}>
          {fact.value}
        </DescriptionList.Item>
      ))}
    </DescriptionList>
    <Panel title="Health checks" aside="2 need attention">
      <HealthCheckList
        groups={NODE_CHECKS}
        sort="severity"
        defaultCollapsedGroups={['system', 'network']}
        ariaLabel="Health checks of gpu-b01-04"
        now={NOW}
      />
    </Panel>
  </>
);

// ── The screen ───────────────────────────────────────────────────────────────

const MonitoringScreen = ({ state = 'content', onRetry }: MonitoringScreenProps) => {
  const health: Record<State, { status: HealthStatus; label: string } | undefined> = {
    content: { status: 'WARN', label: 'Degraded' },
    extreme: { status: 'CRIT', label: 'Major outage' },
    node: { status: 'WARN', label: 'Degraded' },
    error: { status: 'UNKNOWN', label: 'Unknown' },
    empty: undefined,
    loading: undefined,
  };
  return (
    <Frame health={health[state]}>
      {state === 'empty' ? (
        <EmptyPage />
      ) : state === 'loading' ? (
        <LoadingPage />
      ) : state === 'node' ? (
        <NodePage />
      ) : (
        <Overview state={state} onRetry={onRetry} />
      )}
    </Frame>
  );
};

// ── Stories ──────────────────────────────────────────────────────────────────

const meta = {
  title: 'Examples/Monitoring',
  component: MonitoringScreen,
  parameters: { ...portalDocsParams.full(), layout: 'fullscreen' },
  // The shell shows its sidebar from 1024px.
  globals: { viewport: { value: 'tw-xl', isRotated: false } },
  tags: ['autodocs'],
} satisfies Meta<typeof MonitoringScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An incident, nine nodes out of 96 needing attention, four services, the scheduler, the power draw and the last events. */
export const Content: Story = {
  args: {},
};

/** Nothing is monitored yet: one call to add an exporter, and the three steps to get there. */
export const Empty: Story = {
  args: { state: 'empty' },
};

/** The first load: the frame and the header are live, skeletons stand where the data goes. */
export const Loading: Story = {
  args: { state: 'loading' },
};

/** Prometheus is down: the last data stays, marked stale, under a banner with Retry. */
export const LoadError: Story = {
  name: 'Error',
  args: { state: 'error' },
};

/** 2,048 nodes with 300 critical at once, very long hostnames, a long incident title, events that wrap. */
export const ExtremeContent: Story = {
  args: { state: 'extreme' },
};

/** On a phone: the incident and the roll-up come first, the matrix scrolls in a box of its own. */
export const Phone: Story = {
  globals: mobileViewport,
  args: {},
};

export const PhoneChecks: Story = {
  ...Phone,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

/** A node opened from the matrix, on a phone: its health checks, the failing ones first. */
export const PhoneNode: Story = {
  globals: mobileViewport,
  args: { state: 'node' },
};

export const PhoneNodeChecks: Story = {
  ...PhoneNode,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

/** The content state: one h1, the incident, the roll-up, the matrix, the services, the chart and the events. */
export const ContentShowsTheScreen: Story = {
  tags: ['!dev', '!autodocs'],
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Active incident INC-2041');
    const summary = canvas.getByRole('group', { name: 'System health' });
    await expect(summary).toHaveTextContent('Degraded performance');
    await expect(summary).toHaveTextContent('9 of 96 checks need attention');
    await expect(within(summary).getByText('3 Critical')).toBeVisible();

    const grid = canvas.getByRole('grid', { name: 'Nodes by rack' });
    await expect(within(grid).getAllByRole('rowheader')).toHaveLength(8);
    await expect(canvas.getByRole('columnheader', { name: 'Rack' })).toBeVisible();
    // The strip lists the racks with a problem: six of the eight.
    await expect(
      within(canvas.getByRole('list', { name: 'Needs attention' })).getAllByRole('button')
    ).toHaveLength(6);

    const services = canvas.getByRole('region', { name: 'Services' });
    await expect(services).toHaveTextContent('3 of 4 healthy');
    await expect(within(services).getAllByRole('listitem')).toHaveLength(4);
    await expect(within(services).getByRole('img', { name: 'Degraded' })).toBeVisible();

    await expect(canvas.getByLabelText('Scheduler: recent checks')).toBeVisible();
    await expect(canvas.getByLabelText(/^Cluster power over the last hour/)).toBeVisible();
    await expect(canvas.getByRole('log', { name: 'Recent events' })).toBeVisible();
    await expect(canvas.getByText('NVRM: Xid 79, GPU has fallen off the bus')).toBeVisible();
  },
};

/** Nothing monitored: the title and the action of the empty state, three numbered steps, no matrix. */
export const EmptyOffersTheFirstExporter: Story = {
  tags: ['!dev', '!autodocs'],
  args: { state: 'empty' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Add your first exporter')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Add exporter' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Read the setup guide' })).toBeVisible();
    const steps = canvas.getByRole('list', { name: 'Setup steps' });
    await expect(within(steps).getAllByRole('listitem')).toHaveLength(3);
    await expect(within(steps).getByText('Install node_exporter')).toBeVisible();
    await expect(canvas.queryByRole('grid')).toBeNull();
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
};

/** The first load: a busy region with skeletons, a status message, no data and no health badge. */
export const LoadingIsBusy: Story = {
  tags: ['!dev', '!autodocs'],
  args: { state: 'loading' },
  play: async ({ canvas }) => {
    const status = canvas.getByRole('status');
    await expect(status).toHaveTextContent('Loading cluster status…');
    const busy = status.closest('[aria-busy]');
    await expect(busy).toHaveAttribute('aria-busy', 'true');
    await expect(busy!.querySelectorAll('.animate-pulse').length).toBeGreaterThan(10);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Cluster overview' })).toBeVisible();
    await expect(canvas.queryByRole('grid')).toBeNull();
    await expect(canvas.queryByRole('log')).toBeNull();
    await expect(canvas.queryByRole('group', { name: 'System health' })).toBeNull();
  },
};

/** The source is down: a banner with Retry, and the last data shown stale and announced as such. */
export const ErrorKeepsTheLastDataStale: Story = {
  tags: ['!dev', '!autodocs'],
  args: { state: 'error', onRetry: fn() },
  play: async ({ args, canvas }) => {
    const [banner] = canvas.getAllByRole('alert');
    await expect(banner).toHaveTextContent("Can't reach Prometheus");

    // The roll-up keeps its last status and is read as stale: the live headline says so.
    const summary = canvas.getByRole('group', { name: 'System health' });
    await expect(within(summary).getByRole('status')).toHaveTextContent('stale data');
    await expect(summary).toHaveTextContent('Stale · 4 minutes ago');
    await expect(summary).toHaveTextContent('last check 4 minutes ago');

    // Every cell of the matrix is named as stale.
    await expect(canvas.getByRole('button', { name: 'A03 on 12: Critical, stale' })).toBeVisible();
    const grid = canvas.getByRole('grid', { name: 'Nodes by rack' });
    await expect(within(grid).getAllByRole('button').length).toBe(96);
    for (const cell of within(grid).getAllByRole('button')) {
      await expect(cell.getAttribute('aria-label')).toMatch(/, stale$/);
    }

    // Every monitor too: its state chip and a tag under its name.
    const services = canvas.getByRole('region', { name: 'Services' });
    await expect(within(services).getAllByRole('img', { name: /, stale$/ })).toHaveLength(4);
    await expect(services.textContent?.match(/Stale · /g)).toHaveLength(4);

    // The event stream is lost, and has its own way back.
    await expect(canvas.getByText('Event stream lost')).toBeVisible();

    await userEvent.click(within(banner!).getByRole('button', { name: 'Retry' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

/** Extreme content: the counts, the cut names, the nines, the long incident and events that wrap. */
export const ExtremeContentHoldsTogether: Story = {
  tags: ['!dev', '!autodocs'],
  args: { state: 'extreme' },
  play: async ({ canvas }) => {
    const summary = canvas.getByRole('group', { name: 'System health' });
    await expect(summary).toHaveTextContent('Major outage');
    await expect(summary).toHaveTextContent('616 of 2048 checks need attention');
    await expect(within(summary).getByText('300 Critical')).toBeVisible();

    // 64 racks in a box that scrolls, under a header that stays.
    const grid = canvas.getByRole('grid', { name: 'Nodes by rack' });
    await expect(within(grid).getAllByRole('rowheader')).toHaveLength(64);
    const box = grid.parentElement!;
    await expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
    await expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);

    // The long incident wraps inside its banner, the page does not widen.
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      'the scheduler is draining every partition except debug-short'
    );
    expectNoHorizontalOverflow();

    // A monitor name that does not fit is cut, and still there whole for a reader.
    const name = canvas.getByText(/^slurmctld-backup-primary-failover/).closest('span.truncate')!;
    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    // 99.999% reads 99.99%: an uptime is cut, never rounded up to 100%.
    await expect(
      within(canvas.getByRole('region', { name: 'Services' })).getAllByText('99.99%')
    ).toHaveLength(2);

    // Events wrap in full.
    await expect(canvas.getByText(/^LustreError 11-0/)).toBeVisible();
    await expect(canvas.getByText(/^error: node gpu-b01-04\.rack-b01/)).toBeVisible();
  },
};

/** Picking a rack in the attention strip scrolls its row into view and puts the focus on its worst node. */
export const AttentionChipScrollsItsRackIntoView: Story = {
  tags: ['!dev', '!autodocs'],
  args: { state: 'extreme' },
  play: async ({ canvas }) => {
    // The last rack with a problem, the furthest down the grid.
    const rack = [...EXTREME_CLUSTER.rows]
      .reverse()
      .find((row) =>
        Object.values(row.cells).some((c) => c?.status === 'WARN' || c?.status === 'CRIT')
      )!;
    const grid = canvas.getByRole('grid', { name: 'Nodes by rack' });
    const box = grid.parentElement!;
    const header = within(grid).getByRole('rowheader', { name: rack.label });
    const inView = () => {
      const row = header.getBoundingClientRect();
      const view = box.getBoundingClientRect();
      return row.top >= view.top && row.bottom <= view.bottom;
    };
    await expect(inView()).toBe(false);

    const strip = canvas.getByRole('list', { name: 'Needs attention' });
    await userEvent.click(
      within(strip).getByRole('button', { name: new RegExp(`^${rack.label}\\s*:`) })
    );

    await waitFor(() => expect(inView()).toBe(true));
    await expect(document.activeElement?.getAttribute('aria-label')).toMatch(
      new RegExp(`^${rack.label} on `)
    );
  },
};

/** On a phone the incident and the roll-up come before the matrix, which scrolls in a box of its own. */
export const PhoneOrdersIncidentSummaryAndMatrix: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  args: {},
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const incident = canvas.getByRole('alert');
    const summary = canvas.getByRole('group', { name: 'System health' });
    const strip = canvas.getByRole('list', { name: 'Needs attention' });
    const grid = canvas.getByRole('grid', { name: 'Nodes by rack' });
    const before = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & window.Node.DOCUMENT_POSITION_FOLLOWING);
    await expect(before(incident, summary)).toBe(true);
    await expect(before(summary, strip)).toBe(true);
    await expect(before(strip, grid)).toBe(true);
    // The matrix is compacted: a box shorter than its grid, scrolled by itself.
    const box = grid.parentElement!;
    await expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
  },
};

/** A node on a phone: the failing check is open to read first, and the healthy groups are folded. */
export const PhoneNodeListsFailingChecksFirst: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  args: { state: 'node' },
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(canvas.getByRole('heading', { level: 1, name: 'gpu-b01-04' })).toBeVisible();
    const checks = canvas.getByRole('region', { name: 'Health checks' });
    await expect(checks).toHaveTextContent('2 need attention');
    await expect(within(checks).getByText('GPU 3 · Xid errors')).toBeVisible();
    await expect(within(checks).getByText('DRAIN: Xid 79 on GPU 3, 0 jobs left')).toBeVisible();
    // Healthy groups start folded: their checks are not in the way.
    await expect(within(checks).getByText('InfiniBand ib0')).not.toBeVisible();
  },
};
