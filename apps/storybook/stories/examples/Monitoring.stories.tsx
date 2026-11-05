import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Activity,
  Bell,
  Cable,
  CircleAlert,
  CircleQuestionMark,
  FileText,
  Gauge,
  Home,
  Info,
  Plus,
  RotateCw,
  Server,
  Settings,
  TriangleAlert,
} from 'lucide-react';
import {
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type Ref,
} from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  BarChart,
  DonutChart,
  RealtimeChart,
  SemiCircleGauge,
} from '../../../../packages/charts/src';
import {
  AlertBanner,
  Badge,
  Breadcrumb,
  Button,
  CodeBlock,
  CommandPalette,
  CommandPaletteTrigger,
  DataTable,
  DateTime,
  DescriptionList,
  EmptyState,
  HealthBadge,
  HealthCheckList,
  HealthMatrix,
  HeartbeatBar,
  KpiCard,
  LogToolbar,
  LogViewer,
  MonitorRow,
  NotificationsPanel,
  PageContainer,
  PageHeader,
  RowActionButton,
  SectionCard,
  SectionLabel,
  Shell,
  Sidebar,
  SkeletonList,
  SkeletonTable,
  StatusBadge,
  Topbar,
  UptimeBars,
  UptimeStat,
  UserMenu,
  LOG_LEVEL_KEYS,
  countLogLevels,
  type ColumnDef,
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
  ALERT_SEVERITIES,
  ALERTS,
  CLUSTER,
  EVENTS,
  EXTREME_ALERTS,
  EXTREME_CLUSTER,
  EXTREME_COLUMNS,
  EXTREME_EVENTS,
  EXTREME_GAUGES,
  EXTREME_INLET_TEMPS,
  EXTREME_JOBS,
  EXTREME_SERVICES,
  GAUGES,
  INLET_TEMPS,
  INLET_WARNING,
  JOBS,
  NODE_CHECKS,
  NODE_COLUMNS,
  NODE_FACTS,
  NOW,
  PANEL_NOTES,
  POWER_TRACE,
  SCHEDULER_DAYS,
  SCHEDULER_PERIODS,
  SERVICES,
  SETUP_STEPS,
  STALE_CLUSTER,
  STALE_SERVICES,
  STALE_SINCE,
  since,
  type Alert,
  type AlertSeverity,
  type Cluster,
  type GaugeSpec,
  type Service,
} from './monitoring.data';

// A live operations screen: Rackwatch watching the Atlas cluster of a university datacenter. The
// components do the work (the severity panels are `KpiCard`s, the gauges `SemiCircleGauge`s, the
// alerts a `DataTable`, the donuts and the temperatures charts, then the matrix of nodes by rack,
// the service rows, the heartbeats and the log viewer); this file only chooses their options and
// gives them data. Each state is a value of `state`, not a copy of the screen, so the frame around
// the page is the same in all of them. Every relative time is frozen with `now`, and the power
// chart replays a recorded trace, so a story reads the same on every run.

type State = 'content' | 'empty' | 'loading' | 'error' | 'extreme' | 'node';

type MonitoringScreenProps = {
  /** Which state of the screen to show. */
  state?: State;
  /** Called by the error state's "Retry". */
  onRetry?: () => void;
};

// What a state shows of the data that has two sizes: Atlas, and the 2,048 nodes of the extreme case.
const DATA = {
  alerts: ALERTS,
  gauges: GAUGES,
  jobs: JOBS,
  temps: INLET_TEMPS,
  notes: PANEL_NOTES.normal,
  stalledOn: 'OST0012',
};
const EXTREME_DATA = {
  alerts: EXTREME_ALERTS,
  gauges: EXTREME_GAUGES,
  jobs: EXTREME_JOBS,
  temps: EXTREME_INLET_TEMPS,
  notes: PANEL_NOTES.extreme,
  stalledOn: 'the metadata servers',
};

const STALE_TEXT = 'Stale · 4 minutes ago';

const grouped = (value: number) => value.toLocaleString('en-US');

const countOf = (alerts: readonly Alert[], severity: AlertSeverity) =>
  alerts.filter((alert) => alert.severity === severity).length;

// ── Small pieces ─────────────────────────────────────────────────────────────

// Below `sm` the matrix gets a height of its own, so the page keeps the panels, the gauges and
// the alerts in reach instead of one long grid. The matrix scrolls in its own box either way.
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

// The line at the end of a card's header (`SectionCard`'s `action`): a scope, a count, a freshness.
const Aside = ({ children }: { children: ReactNode }) => (
  <span className="text-sm text-[var(--color-text-secondary)]">
    <bdi>{children}</bdi>
  </span>
);

// ── The frame ────────────────────────────────────────────────────────────────

const USER = { name: 'Maya Kowalski', email: 'maya.kowalski@halden.example' };

// The pages of Rackwatch: the sidebar lists them and the command palette goes to them.
const PAGES = [
  { label: 'Overview', icon: Home, group: 'Monitoring' },
  { label: 'Nodes', icon: Server, group: 'Monitoring' },
  { label: 'Services', icon: Activity, group: 'Monitoring' },
  { label: 'Logs', icon: FileText, group: 'Monitoring' },
  { label: 'Alerts', icon: Bell, group: 'Monitoring' },
  { label: 'Exporters', icon: Cable, group: 'Admin' },
  { label: 'Settings', icon: Settings, group: 'Admin' },
] as const;

// The three newest alerts, unread: what the bell counts.
const NOTIFICATIONS = [
  {
    id: 'ecc',
    intent: 'warning',
    title: 'MemoryECCErrors on cn-a03-05',
    subtitle: '12 corrected errors in 10 minutes',
    time: '11 minutes ago',
  },
  {
    id: 'memory',
    intent: 'warning',
    title: 'ClusterMemoryHigh',
    subtitle: '86 % of the memory in use, warning at 80 %',
    time: '17 minutes ago',
  },
  {
    id: 'xid',
    intent: 'danger',
    title: 'GPUXidError on gpu-b01-04',
    subtitle: 'Xid 79: GPU fell off the bus',
    time: '27 minutes ago',
  },
] as const;

// The Topbar: the menu button and the page title, the search in the middle, the bell and the
// profile at the end. Nothing is monitored yet when `unread` is 0 and there is no alert badge.
const Frame = ({
  unread,
  alertBadge,
  children,
}: {
  unread: number;
  alertBadge?: number;
  children: ReactNode;
}) => {
  const [paletteOpen, setPaletteOpen] = useState(false);
  return (
    <>
      <Shell
        topbar={
          // The page title is text here: the `PageHeader` below holds the one `h1`.
          <Topbar
            pageTitle="Cluster overview"
            center={
              // The palette owns the Ctrl K hotkey; the trigger opens it on a click. Below `sm` it
              // is an icon, and sits at the end of the free space, next to the actions.
              <div className="flex max-w-lg max-sm:max-w-none max-sm:justify-end sm:mx-auto">
                <CommandPaletteTrigger
                  placeholder="Search nodes, alerts, jobs"
                  onClick={() => setPaletteOpen(true)}
                />
              </div>
            }
            endActions={
              <>
                <NotificationsPanel>
                  <NotificationsPanel.Trigger count={unread} />
                  <NotificationsPanel.Content>
                    <NotificationsPanel.Header title="Notifications" />
                    {unread === 0 ? (
                      <NotificationsPanel.Empty
                        title="You're all caught up"
                        subtitle="No alert yet."
                      />
                    ) : (
                      <NotificationsPanel.List>
                        {NOTIFICATIONS.map((notification) => (
                          <NotificationsPanel.Item key={notification.id} unread {...notification} />
                        ))}
                      </NotificationsPanel.List>
                    )}
                  </NotificationsPanel.Content>
                </NotificationsPanel>
                <UserMenu>
                  {/* Name hidden: a name of any length would push the search aside. */}
                  <UserMenu.Trigger name={USER.name} hideName />
                  <UserMenu.Content>
                    <UserMenu.Header name={USER.name} email={USER.email} />
                    <UserMenu.Items>
                      <UserMenu.Item>Profile</UserMenu.Item>
                      <UserMenu.Item>Notification settings</UserMenu.Item>
                      <UserMenu.Item intent="danger">Sign out</UserMenu.Item>
                    </UserMenu.Items>
                  </UserMenu.Content>
                </UserMenu>
              </>
            }
          />
        }
        sidebar={
          <Sidebar>
            <Sidebar.Brand title="Rackwatch" logo={<Gauge className="size-5" aria-hidden />} />
            {(['Monitoring', 'Admin'] as const).map((group) => (
              <Sidebar.Section key={group} label={group}>
                {PAGES.filter((page) => page.group === group).map((page) => (
                  <Sidebar.Item
                    key={page.label}
                    icon={page.icon}
                    label={page.label}
                    active={page.label === 'Overview'}
                    badge={
                      page.label === 'Alerts' && alertBadge ? (
                        <Badge size="sm" intent="danger">
                          {alertBadge}
                        </Badge>
                      ) : undefined
                    }
                  />
                ))}
              </Sidebar.Section>
            ))}
          </Sidebar>
        }
      >
        {/* A container: the panels and the gauges count their columns from the room the page
            has, whatever the sidebar takes of the window. */}
        <PageContainer width="full" className="@container flex flex-col gap-6">
          {children}
        </PageContainer>
      </Shell>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandPalette.Input placeholder="Search nodes, alerts, jobs" />
        <CommandPalette.List>
          <CommandPalette.Empty>No matching results.</CommandPalette.Empty>
          <CommandPalette.Group heading="Go to">
            {PAGES.map((page) => (
              <CommandPalette.Item
                key={page.label}
                icon={page.icon}
                onSelect={() => setPaletteOpen(false)}
              >
                {page.label}
              </CommandPalette.Item>
            ))}
          </CommandPalette.Group>
          <CommandPalette.Group heading="Critical alerts">
            {ALERTS.filter((alert) => alert.severity === 'Critical').map((alert) => (
              <CommandPalette.Item
                key={alert.id}
                icon={TriangleAlert}
                meta={alert.target}
                onSelect={() => setPaletteOpen(false)}
              >
                {alert.name}
              </CommandPalette.Item>
            ))}
          </CommandPalette.Group>
        </CommandPalette.List>
      </CommandPalette>
    </>
  );
};

// ── The overview ─────────────────────────────────────────────────────────────

// Each severity has its icon and its meaning: the panels of a severity that needs a look take
// the border and the figure of their intent.
const SEVERITY_PANEL = {
  Critical: { icon: TriangleAlert, intent: 'danger' },
  Warning: { icon: CircleAlert, intent: 'warning' },
  Info: { icon: Info, intent: 'neutral', iconIntent: 'info' },
  Unknown: { icon: CircleQuestionMark, intent: 'neutral', iconIntent: 'neutral' },
} as const;

// Four panels, one per severity, each a link to the alerts table filtered on it. Without
// `onPick` (the data is stale and the table is not there) they are plain cards.
const SeverityPanels = ({
  alerts,
  notes,
  stale,
  loading,
  tableId,
  onPick,
}: {
  alerts: readonly Alert[];
  /** The line under the count of each severity. */
  notes?: Record<AlertSeverity, string>;
  stale?: boolean;
  loading?: boolean;
  /** The id of the alerts table: where the links lead. */
  tableId?: string;
  onPick?: (severity: AlertSeverity) => void;
}) => (
  <section
    aria-label="Alerts by severity"
    className="grid grid-cols-1 gap-4 @md:grid-cols-2 @4xl:grid-cols-4"
  >
    {ALERT_SEVERITIES.map((severity) => (
      <KpiCard
        key={severity}
        label={severity}
        value={loading ? '0' : grouped(countOf(alerts, severity))}
        // While loading the line keeps its room, so the card does not grow when the data arrives.
        sub={loading ? '\u00A0' : stale ? STALE_TEXT : notes?.[severity]}
        loading={loading}
        {...SEVERITY_PANEL[severity]}
        // No border or figure in the color of a severity before there is a count to give it.
        {...(loading ? { intent: 'neutral' as const } : {})}
        {...(onPick
          ? {
              href: `#${tableId}`,
              onClick: (event: { preventDefault: () => void }) => {
                // A router would go to the alerts page with the filter in its address.
                event.preventDefault();
                onPick(severity);
              },
            }
          : {})}
      />
    ))}
  </section>
);

// The status a gauge is in, from its value and its two thresholds: the same rule as its arc.
const gaugeStatus = (
  gauge: GaugeSpec
): { status: HealthStatus; label: string; intent: 'success' | 'warning' | 'danger' } =>
  gauge.value >= gauge.critAt
    ? { status: 'CRIT', label: 'Critical', intent: 'danger' }
    : gauge.value >= gauge.warnAt
      ? { status: 'WARN', label: 'Warning', intent: 'warning' }
      : { status: 'OK', label: 'OK', intent: 'success' };

// A gauge with its zones on the track and its arc in the color of the zone the value is in. The
// card says the zone too: its border takes the status's intent, and the status stands by the title.
// No icon: four cards share the row, and the title needs the room (a path can be long).
const GaugePanel = ({ gauge, loading }: { gauge: GaugeSpec; loading?: boolean }) => {
  const { status, label, intent } = gaugeStatus(gauge);
  return (
    <SectionCard
      as="h2"
      size="md"
      title={gauge.title}
      desc={gauge.scope}
      // No status before there is a value to give it.
      intent={loading ? 'neutral' : intent}
      badge={loading ? undefined : <StatusBadge status={status} label={label} />}
      loading={loading}
      className="min-w-0"
    >
      {/* At the bottom of the card: the gauges of a row line up when a title takes two lines. */}
      <div className="flex h-full flex-col justify-end">
        <SemiCircleGauge
          ariaLabel={gauge.title}
          value={gauge.value}
          max={gauge.max}
          warnAt={gauge.warnAt}
          critAt={gauge.critAt}
          showZones
          formatValue={gauge.format}
        />
        <p className="m-0 mt-3 text-center text-xs text-[var(--color-text-secondary)]">
          <bdi>{gauge.note}</bdi>
        </p>
      </div>
    </SectionCard>
  );
};

// Four across when the page has the room, two, then one: never three and a stray one.
const Gauges = ({ gauges, loading }: { gauges: readonly GaugeSpec[]; loading?: boolean }) => (
  <section
    aria-label="Cluster load"
    className="grid grid-cols-1 gap-4 @md:grid-cols-2 @4xl:grid-cols-4"
  >
    {gauges.map((gauge) => (
      <GaugePanel key={gauge.id} gauge={gauge} loading={loading} />
    ))}
  </section>
);

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
      className="h-full"
    />
  );
};

// The status colors of the theme, for the slices: a chart that means a status passes them.
const NODE_STATE_COLORS = [
  'var(--color-success-500)',
  'var(--color-status-warn)',
  'var(--color-status-crit)',
  'var(--color-gray-500)',
];

// The nodes of the matrix by state, counted from its checks so the donut and the matrix agree.
const nodeStates = (cluster: Cluster) =>
  (['OK', 'WARN', 'CRIT', 'UNKNOWN'] as const).map(
    (status) => cluster.checks.filter((check) => check.status === status).length
  );

const NodeStates = ({ cluster, stale }: { cluster: Cluster; stale?: boolean }) => {
  const series = nodeStates(cluster);
  const [ok = 0, warn = 0, crit = 0, unknown = 0] = series;
  return (
    <SectionCard
      as="h2"
      size="md"
      title="Node states"
      // The last counts received: dimmed, and their age by the title.
      stale={stale}
      staleLabel={STALE_TEXT}
      className="min-w-0 flex-[1_1_15rem]"
    >
      <DonutChart
        series={series}
        labels={['OK', 'Warning', 'Critical', 'Unknown']}
        colors={NODE_STATE_COLORS}
        centerLabel="nodes"
        formatValue={grouped}
        legendValues
        height={280}
        ariaLabel={`${grouped(ok + warn + crit + unknown)} nodes: ${grouped(ok)} OK, ${grouped(warn)} warning, ${grouped(crit)} critical, ${grouped(unknown)} unknown`}
      />
    </SectionCard>
  );
};

// The matrix is 52.5rem wide, what its 12 columns need: the states go beside it when the page has
// that and 15rem more (from a 1440px window with the sidebar open), and under it otherwise.
const NodesRow = ({
  cluster,
  extreme,
  stale,
}: {
  cluster: Cluster;
  extreme?: boolean;
  stale?: boolean;
}) => (
  <div className="flex flex-wrap items-stretch gap-6">
    <div className="min-w-0 flex-[3_1_52.5rem]">
      <Nodes cluster={cluster} extreme={extreme} stale={stale} />
    </div>
    <NodeStates cluster={cluster} stale={stale} />
  </div>
);

// ── Alerts ───────────────────────────────────────────────────────────────────

const SEVERITY_INTENT = {
  Critical: 'danger',
  Warning: 'warning',
  Info: 'info',
  Unknown: 'neutral',
} as const;

// The columns of the table. The severity is what the tabs filter on, and the name carries the
// summary under it: the one cell that wraps, and the one column with no width, so it takes what the
// others leave. Together they fit the page from a 1280px window with the sidebar open.
const ALERT_COLUMNS: ColumnDef<Alert>[] = [
  {
    key: 'severity',
    label: 'Severity',
    width: '6.75rem',
    filterValue: (alert) => alert.severity,
    render: (alert) => (
      <Badge size="sm" intent={SEVERITY_INTENT[alert.severity]}>
        {alert.severity}
      </Badge>
    ),
  },
  {
    key: 'name',
    label: 'Alert',
    minWidth: '12rem',
    mobile: 'title',
    searchValue: (alert) => `${alert.name} ${alert.summary}`,
    render: (alert) => (
      <span className="block min-w-0">
        <span className="block font-mono text-xs font-semibold [overflow-wrap:anywhere] text-[var(--color-text-primary)]">
          <bdi>{alert.name}</bdi>
        </span>
        <span className="block text-xs text-[var(--color-text-secondary)]">
          <bdi>{alert.summary}</bdi>
        </span>
      </span>
    ),
  },
  {
    key: 'target',
    label: 'Target',
    width: '20%',
    minWidth: '9rem',
    render: (alert) => (
      <span title={alert.target} className="block max-w-[18rem] truncate font-mono text-xs">
        <bdi>{alert.target}</bdi>
      </span>
    ),
  },
  {
    key: 'started',
    label: 'Started',
    width: '5rem',
    // The card of a phone keeps "For": how long says as much, in a line less.
    mobile: 'hidden',
    render: (alert) => (
      <span className="tabular-nums">
        <DateTime value={alert.startedAt} format="time" locale="en-GB" timeZone="UTC" />
      </span>
    ),
  },
  {
    key: 'for',
    label: 'For',
    width: '6.5rem',
    render: (alert) => (
      <span className="whitespace-nowrap tabular-nums">
        <bdi>{since(alert.startedAt)}</bdi>
      </span>
    ),
  },
  {
    key: 'state',
    label: 'State',
    width: '8rem',
    render: (alert) => (
      <span className={alert.acknowledged ? 'text-[var(--color-text-secondary)]' : undefined}>
        {alert.acknowledged ? 'Acknowledged' : 'Firing'}
      </span>
    ),
  },
];

// The alerts, by severity and the oldest first, eleven to a page: the four informational ones are
// behind them, and under their own tab. A click on a panel above sets the filter of the tabs and
// moves the focus to the card's title. While a critical alert fires and no one has acknowledged
// it, the card is the one the page is about: the danger halo, and the count by the title.
const AlertsTable = ({
  alerts,
  filters,
  onFiltersChange,
  onToggleAcknowledged,
  id,
  ref,
  headingRef,
}: {
  alerts: Alert[];
  filters: Record<string, Set<string>>;
  onFiltersChange: (filters: Record<string, Set<string>>) => void;
  onToggleAcknowledged: (id: string) => void;
  /** Where the panels above lead. */
  id: string;
  ref: Ref<HTMLDivElement>;
  headingRef: Ref<HTMLHeadingElement>;
}) => {
  const firing = alerts.filter(
    (alert) => alert.severity === 'Critical' && !alert.acknowledged
  ).length;
  return (
    <div id={id} ref={ref} className="scroll-mt-6">
      <SectionCard
        as="h2"
        size="md"
        title="Alerts"
        titleRef={headingRef}
        intent={firing > 0 ? 'danger' : 'neutral'}
        halo={firing > 0}
        badge={
          firing > 0 ? (
            <Badge size="sm" intent="danger">
              {`${grouped(firing)} critical firing`}
            </Badge>
          ) : undefined
        }
        flush
      >
        <DataTable
          rows={alerts}
          columns={ALERT_COLUMNS}
          rowKey={(alert) => alert.id}
          pageSize={11}
          aria-label="Alert list"
          filterTabs={{
            columnKey: 'severity',
            allCount: alerts.length,
            options: ALERT_SEVERITIES.map((severity) => ({
              value: severity,
              label: severity,
              count: countOf(alerts, severity),
            })),
          }}
          filters={filters}
          onFiltersChange={onFiltersChange}
          renderRowAction={(alert) => {
            const action = alert.acknowledged ? 'Unack' : 'Ack';
            return (
              <RowActionButton
                hideChevron
                // The name starts with the word on the button, and says which alert it is for.
                aria-label={`${action} ${alert.name} on ${alert.target}`}
                onClick={() => onToggleAcknowledged(alert.id)}
              >
                {action}
              </RowActionButton>
            );
          }}
          mobileLayout="cards"
        />
      </SectionCard>
    </div>
  );
};

// ── Temperatures and jobs ────────────────────────────────────────────────────

const celsius = (value: number) => `${value} °C`;

// What a screen reader gets of the bars: the racks over the warning, and by how much.
const temperatureName = (temps: { rack: string; celsius: number }[]) => {
  const hot = temps.filter((rack) => rack.celsius > INLET_WARNING);
  const hottest = hot.reduce((a, b) => (b.celsius > a.celsius ? b : a), hot[0]!);
  return hot.length === 0
    ? `Inlet temperature by rack; every rack is under the ${celsius(INLET_WARNING)} warning`
    : hot.length === 1
      ? `Inlet temperature by rack; ${hottest.rack} is above the ${celsius(INLET_WARNING)} warning at ${celsius(hottest.celsius)}`
      : `Inlet temperature by rack; ${hot.length} racks are above the ${celsius(INLET_WARNING)} warning, the hottest at ${celsius(hottest.celsius)}`;
};

const Temperatures = ({
  temps,
  loading,
}: {
  temps: { rack: string; celsius: number }[];
  loading?: boolean;
}) => (
  <SectionCard
    as="h2"
    size="md"
    title="Inlet temperature by rack"
    action={<Aside>{`Warning above ${celsius(INLET_WARNING)}`}</Aside>}
    className="min-w-0 flex-[2_1_35rem]"
  >
    <BarChart
      categories={temps.map((rack) => rack.rack)}
      series={[{ name: 'Inlet temperature', data: temps.map((rack) => rack.celsius) }]}
      // The warning line, and the racks over it in the critical color.
      referenceLines={[
        { value: INLET_WARNING, label: celsius(INLET_WARNING), intent: 'warning', dashed: true },
      ]}
      colorByValue={(value) => (value > INLET_WARNING ? 'var(--color-status-crit)' : undefined)}
      formatValue={celsius}
      loading={loading}
      height={240}
      ariaLabel={loading ? 'Inlet temperature by rack' : temperatureName(temps)}
    />
  </SectionCard>
);

const JOB_COLORS = ['var(--color-brand-500)', 'var(--color-chart-2)', 'var(--color-status-crit)'];

const Jobs = ({
  jobs,
  stalledOn,
  loading,
}: {
  jobs: typeof JOBS;
  stalledOn: string;
  loading?: boolean;
}) => {
  const total = jobs.Running + jobs.Pending + jobs.Stalled;
  return (
    <SectionCard as="h2" size="md" title="Jobs" className="min-w-0 flex-[1_1_18rem]">
      <div className="flex flex-col gap-3">
        <DonutChart
          series={[jobs.Running, jobs.Pending, jobs.Stalled]}
          labels={['Running', 'Pending', 'Stalled']}
          colors={JOB_COLORS}
          centerLabel="jobs"
          formatValue={grouped}
          legendValues
          loading={loading}
          height={280}
          ariaLabel={`${grouped(total)} jobs: ${grouped(jobs.Running)} running, ${grouped(jobs.Pending)} pending, ${grouped(jobs.Stalled)} stalled`}
        />
        {!loading && (
          <p className="m-0 text-xs text-[var(--color-text-secondary)]">
            <bdi>
              {grouped(jobs.Stalled)} stalled jobs wait on {stalledOn}.
            </bdi>
          </p>
        )}
      </div>
    </SectionCard>
  );
};

// ── Services, scheduler, power, events ───────────────────────────────────────

const Services = ({ services, stale }: { services: Service[]; stale?: boolean }) => {
  const healthy = services.filter((s) => s.beats[s.beats.length - 1]?.status === 'up').length;
  return (
    <SectionCard
      as="h2"
      size="md"
      title="Services"
      action={<Aside>{`${healthy} of ${services.length} healthy`}</Aside>}
      className="min-w-0"
    >
      <ul className="m-0 list-none divide-y divide-[var(--color-border)] p-0">
        {services.map((service) => (
          <li key={service.id}>
            <MonitorRow
              name={service.name}
              type={service.type}
              beats={service.beats}
              uptime={service.uptime}
              latency={service.latency}
              // Each row says it is stale, by its state too: no card-wide label on top of them.
              stale={stale ? STALE_SINCE : undefined}
              now={NOW}
            />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
};

const Scheduler = () => (
  <SectionCard
    as="h2"
    size="md"
    title="Scheduler · slurmctld"
    action={<HealthBadge status="OK" label="Healthy" />}
    className="min-w-0"
  >
    <div className="flex flex-col gap-5">
      <HeartbeatBar beats={SERVICES[0]!.beats} legend ariaLabel="Scheduler: recent checks" />
      <UptimeStat periods={SCHEDULER_PERIODS} responseTime={4} ariaLabel="slurmctld uptime" />
      <UptimeBars days={SCHEDULER_DAYS} period={30} title="Last 30 days" />
    </div>
  </SectionCard>
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
    <SectionCard
      as="h2"
      size="md"
      title="Cluster power"
      action={
        <Aside>
          <b className="tabular-nums">452 kW</b>
        </Aside>
      }
      className="min-w-0"
    >
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
    </SectionCard>
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
    <SectionCard
      as="h2"
      size="md"
      title="Events"
      action={failed ? undefined : <Aside>updated 12 s ago</Aside>}
      // The stream is lost: the card keeps its header and says so, with the way back.
      error={failed}
      errorMessage="Event stream lost"
      errorDescription="Last line received 14:28:11."
      onRetry={onRetry}
      className="min-w-0"
    >
      <div className="flex flex-col gap-3">
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
    </SectionCard>
  );
};

const Overview = ({ state, onRetry }: { state: State; onRetry?: () => void }) => {
  const extreme = state === 'extreme';
  const stale = state === 'error';
  const data = extreme ? EXTREME_DATA : DATA;
  const cluster = extreme ? EXTREME_CLUSTER : stale ? STALE_CLUSTER : CLUSTER;

  // The alerts table is controlled by the screen: a click on a severity panel sets its filter, and
  // the acknowledgements are kept here, as a real screen would send them to its API.
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [acknowledged, setAcknowledged] = useState<ReadonlySet<string>>(
    () => new Set(data.alerts.filter((alert) => alert.acknowledged).map((alert) => alert.id))
  );
  const rows = useMemo(
    () => data.alerts.map((alert) => ({ ...alert, acknowledged: acknowledged.has(alert.id) })),
    [data.alerts, acknowledged]
  );
  const toggleAcknowledged = (id: string) =>
    setAcknowledged((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const titleId = useId();
  const tableRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const showAlerts = (severity: AlertSeverity) => {
    setFilters({ severity: new Set([severity]) });
    tableRef.current?.scrollIntoView({ block: 'start' });
    headingRef.current?.focus({ preventScroll: true });
  };

  const notes = {
    Critical: `+${rows.filter((alert) => alert.severity === 'Critical' && NOW - alert.startedAt <= 3_600_000).length} in the last hour`,
    Warning: `${rows.filter((alert) => alert.severity === 'Warning' && alert.acknowledged).length} acknowledged`,
    Info: data.notes.Info,
    Unknown: data.notes.Unknown,
  };

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

      {stale && (
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
      )}

      <SeverityPanels
        alerts={rows}
        notes={notes}
        stale={stale}
        tableId={titleId}
        onPick={stale ? undefined : showAlerts}
      />
      {!stale && <Gauges gauges={data.gauges} />}
      <NodesRow cluster={cluster} extreme={extreme} stale={stale} />

      {stale ? (
        // What reads the source live (the table, the charts, the scheduler) waits for it; the
        // services and the events say they are stale or lost.
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Services services={STALE_SERVICES} stale />
          <Events lines={[]} failed onRetry={onRetry} />
        </div>
      ) : (
        <>
          <AlertsTable
            ref={tableRef}
            headingRef={headingRef}
            id={titleId}
            alerts={rows}
            filters={filters}
            onFiltersChange={setFilters}
            onToggleAcknowledged={toggleAcknowledged}
          />
          <div className="flex flex-wrap items-stretch gap-6">
            <Temperatures temps={data.temps} />
            <Jobs jobs={data.jobs} stalledOn={data.stalledOn} />
          </div>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <Scheduler />
            <Services services={extreme ? EXTREME_SERVICES : SERVICES} />
          </div>
          <Power />
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
      <SectionLabel size="lg" className="mb-3">
        Three steps, about ten minutes
      </SectionLabel>
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
              <CodeBlock code={step.code} wrap className="mt-1.5" />
            </div>
          </li>
        ))}
      </ol>
    </EmptyState>
  </>
);

// The first load: the page header and the frame are there, skeletons stand where the panels, the
// gauges, the matrix, the table, the charts and the events go. One busy group and one status
// message say it to a screen reader. The page is taller than a window and holds nothing to focus
// yet, so the group takes the focus itself: it is what the arrow keys scroll the page by.
const LoadingPage = () => (
  <>
    <PageHeader as="h1" title="Cluster overview" description="Loading…" />
    <div
      role="group"
      aria-label="Cluster overview, loading"
      aria-busy="true"
      tabIndex={0}
      className="focus-visible:focus-indicator flex flex-col gap-6 rounded-sm"
    >
      <p role="status" className="sr-only">
        Loading cluster status…
      </p>
      <SeverityPanels alerts={[]} loading />
      <Gauges gauges={GAUGES} loading />
      <div className="flex flex-wrap items-stretch gap-6">
        <SectionCard as="h2" size="md" title="Nodes by rack" className="min-w-0 flex-[3_1_52.5rem]">
          <SkeletonTable rows={8} cols={12} />
        </SectionCard>
        <SectionCard as="h2" size="md" title="Node states" className="min-w-0 flex-[1_1_15rem]">
          <DonutChart series={[]} labels={[]} loading height={220} ariaLabel="Node states" />
        </SectionCard>
      </div>
      <SectionCard as="h2" size="md" title="Alerts" flush>
        <DataTable
          rows={[]}
          columns={ALERT_COLUMNS}
          rowKey={(alert) => alert.id}
          loading
          loadingRows={5}
          aria-label="Alert list"
        />
      </SectionCard>
      <div className="flex flex-wrap items-stretch gap-6">
        <Temperatures temps={INLET_TEMPS} loading />
        <Jobs jobs={JOBS} stalledOn="" loading />
      </div>
      <SectionCard as="h2" size="md" title="Events">
        <SkeletonList rows={6} showAction={false} />
      </SectionCard>
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
    <SectionCard as="h2" size="md" title="Health checks" action={<Aside>2 need attention</Aside>}>
      <HealthCheckList
        groups={NODE_CHECKS}
        sort="severity"
        defaultCollapsedGroups={['system', 'network']}
        ariaLabel="Health checks of gpu-b01-04"
        now={NOW}
      />
    </SectionCard>
  </>
);

// ── The screen ───────────────────────────────────────────────────────────────

const MonitoringScreen = ({ state = 'content', onRetry }: MonitoringScreenProps) => {
  // The retry buttons call it with no argument, not with the click: a host gets "retry", not an event.
  const retry = onRetry && (() => onRetry());
  // Nothing to count yet: no unread alert, no badge on the Alerts item.
  const noData = state === 'empty' || state === 'loading';
  const alerts = state === 'extreme' ? EXTREME_ALERTS : ALERTS;
  return (
    <Frame
      unread={noData ? 0 : NOTIFICATIONS.length}
      alertBadge={noData ? undefined : countOf(alerts, 'Critical')}
    >
      {state === 'empty' ? (
        <EmptyPage />
      ) : state === 'loading' ? (
        <LoadingPage />
      ) : state === 'node' ? (
        <NodePage />
      ) : (
        <Overview state={state} onRetry={retry} />
      )}
    </Frame>
  );
};

// ── Stories ──────────────────────────────────────────────────────────────────

const meta = {
  title: 'Examples/Monitoring',
  component: MonitoringScreen,
  parameters: { ...portalDocsParams.full(), layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof MonitoringScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// The order of the stories is the order the story tests run them in, and it matters (#583). Before
// each story the tests set its viewport (`setViewport` of addon-vitest) while the page of the story
// before it is still mounted. The extreme state is 7,459 elements: resizing it to the phone's 393px
// took 1.4 s on a quiet machine, against 20 to 50 ms for any other page, and several times that
// under load, enough for the first phone story after it to time out at 15 s. So the stories of the
// extreme state, here and at the end of the file, stay after every story at the phone viewport.

/** Alerts by severity, four gauges, nine nodes out of 96 needing attention, the alerts table, inlet temperatures and jobs, four services, the scheduler, the power draw and the last events. */
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

/** On a phone: the severity panels and the gauges come first, the matrix scrolls in a box of its own and the alerts are cards. */
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

/** 2,048 nodes with 300 critical at once, 616 alerts with very long names and targets, very long hostnames, events that wrap. */
export const ExtremeContent: Story = {
  args: { state: 'extreme' },
};

// ── Tests ────────────────────────────────────────────────────────────────────

const body = () => within(document.body);

// A color the theme defines, as the browser computes it: what a gauge's arc is painted with.
const themeColor = (name: string) => {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};

// The severity of each row of a table, in the order it shows them.
const severitiesOf = (table: HTMLElement) =>
  within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.querySelector('td')?.textContent);

/** The content state: one h1, the severity panels, the gauges, the matrix and node states, the alerts, the charts, the services and the events. */
export const ContentShowsTheScreen: Story = {
  tags: ['!dev', '!autodocs'],
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    // No incident banner and no roll-up: nothing on the page is announced as an alert.
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(canvas.queryByRole('group', { name: 'System health' })).toBeNull();

    // One panel per severity, each a link with its count.
    const panels = canvas.getByRole('region', { name: 'Alerts by severity' });
    for (const [name, count] of [
      ['Critical', '4'],
      ['Warning', '6'],
      ['Info', '4'],
      ['Unknown', '1'],
    ] as const) {
      await expect(
        within(panels).getByRole('link', { name: new RegExp(`^${name}\\s*${count}`) })
      ).toBeVisible();
    }

    // Four gauges, each named by its value, with the status of its zone written under the arc.
    for (const [title, name, status] of [
      ['CPU load', /^CPU load: 72 %/, 'OK'],
      ['Memory', /^Memory: 86 %/, 'Warning'],
      ['Power', /^Power: 452 kW/, 'OK'],
      ['Lustre /scratch', /^Lustre \/scratch: 93 %/, 'Critical'],
    ] as const) {
      const gauge = canvas.getByRole('region', { name: title });
      await expect(within(gauge).getByRole('img', { name })).toBeVisible();
      await expect(within(gauge).getByText(status)).toBeVisible();
    }

    const grid = canvas.getByRole('grid', { name: 'Nodes by rack' });
    await expect(within(grid).getAllByRole('rowheader')).toHaveLength(8);
    await expect(canvas.getByRole('columnheader', { name: 'Rack' })).toBeVisible();
    // The strip lists the racks with a problem: six of the eight.
    await expect(
      within(canvas.getByRole('list', { name: 'Needs attention' })).getAllByRole('button')
    ).toHaveLength(6);
    await expect(
      canvas.getByLabelText('96 nodes: 87 OK, 5 warning, 3 critical, 1 unknown')
    ).toBeVisible();

    // The alerts: eleven rows of the fifteen, the filter tabs with their counts.
    const table = canvas.getByRole('table', { name: 'Alert list' });
    await expect(within(table).getAllByRole('row')).toHaveLength(12);
    for (const tab of ['All 15', 'Critical 4', 'Warning 6', 'Info 4', 'Unknown 1']) {
      await expect(canvas.getByRole('tab', { name: tab })).toBeVisible();
    }

    await expect(
      canvas.getByLabelText('Inlet temperature by rack; C01 is above the 27 °C warning at 29 °C')
    ).toBeVisible();
    await expect(
      canvas.getByLabelText('1,614 jobs: 1,284 running, 316 pending, 14 stalled')
    ).toBeVisible();

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

/** The first load: a busy region with skeletons, a status message, no data and no alert badge. */
export const LoadingIsBusy: Story = {
  tags: ['!dev', '!autodocs'],
  args: { state: 'loading' },
  play: async ({ canvas }) => {
    // The table says "Loading…" in a status of its own: the page's message is the one that names it.
    const status = canvas.getByText('Loading cluster status…');
    await expect(status).toHaveAttribute('role', 'status');
    const busy = status.closest('[aria-busy]');
    await expect(busy).toHaveAttribute('aria-busy', 'true');
    await expect(busy!.querySelectorAll('.animate-pulse').length).toBeGreaterThan(10);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Cluster overview' })).toBeVisible();
    await expect(canvas.queryByRole('grid')).toBeNull();
    await expect(canvas.queryByRole('log')).toBeNull();
    // The panels, the charts and the table are busy, and none shows a figure yet.
    await expect(canvas.queryByRole('img', { name: /^CPU load/ })).toBeNull();
    await expect(canvas.getByRole('group', { name: 'Node states, loading' })).toHaveAttribute(
      'aria-busy',
      'true'
    );
    await expect(canvas.queryByRole('tab')).toBeNull();
  },
};

/** The source is down: a banner with Retry, and the last data shown stale and announced as such. */
export const ErrorKeepsTheLastDataStale: Story = {
  tags: ['!dev', '!autodocs'],
  args: { state: 'error', onRetry: fn() },
  play: async ({ args, canvas }) => {
    const [banner] = canvas.getAllByRole('alert');
    await expect(banner).toHaveTextContent("Can't reach Prometheus");

    // The panels keep their last counts, read as stale, and no longer lead to a table.
    const panels = canvas.getByRole('region', { name: 'Alerts by severity' });
    await expect(within(panels).getByText('Critical').closest('div')).toHaveTextContent('4');
    await expect(panels.textContent?.match(/Stale · 4 minutes ago/g)).toHaveLength(4);
    await expect(within(panels).queryByRole('link')).toBeNull();
    await expect(canvas.queryByRole('region', { name: 'Cluster load' })).toBeNull();

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

    // The retry says "retry" and nothing else: the host is not handed the click.
    await userEvent.click(within(banner!).getByRole('button', { name: 'Retry' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
    await expect(args.onRetry).toHaveBeenCalledWith();
  },
};

/** The Topbar: the title, the search with its shortcut in the middle, the bell with its count and the profile; no health badge. */
export const TopbarHasSearchBellAndProfile: Story = {
  tags: ['!dev', '!autodocs'],
  args: {},
  play: async ({ canvas }) => {
    const bar = within(canvas.getByRole('banner'));
    await expect(bar.getByText('Cluster overview')).toBeVisible();
    const search = bar.getByRole('button', { name: /^Search nodes, alerts, jobs/ });
    await expect(search).toHaveTextContent(/Ctrl K|⌘K/);
    await expect(bar.getByRole('button', { name: 'Notifications, 3' })).toBeVisible();
    await expect(bar.getByRole('button', { name: /Maya Kowalski/ })).toBeVisible();
    // The roll-up badge is gone from the bar.
    await expect(bar.queryByText(/Degraded|Major outage/)).toBeNull();

    // The search opens the palette, which goes to the pages and the critical alerts.
    await userEvent.click(search);
    const palette = await body().findByRole('dialog', { name: 'Command palette' });
    await waitFor(() =>
      expect(within(palette).getByRole('option', { name: 'Overview' })).toBeVisible()
    );
    await waitFor(() =>
      expect(within(palette).getByRole('option', { name: /LustreOSTOffline/ })).toBeVisible()
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body().queryByRole('dialog')).toBeNull());

    // The bell lists the three unread alerts.
    await userEvent.click(bar.getByRole('button', { name: 'Notifications, 3' }));
    await expect(await body().findByText('GPUXidError on gpu-b01-04')).toBeVisible();
    await expect(body().getByText('MemoryECCErrors on cn-a03-05')).toBeVisible();
    await userEvent.keyboard('{Escape}');
  },
};

/** Each gauge draws its zones on the track, and paints its arc in the color of the zone its value is in. */
export const GaugesDrawZonesAndStatusArcs: Story = {
  tags: ['!dev', '!autodocs'],
  args: {},
  play: async ({ canvas, canvasElement }) => {
    const gauges = ['CPU load', 'Memory', 'Power', 'Lustre /scratch'].map((title) =>
      canvas.getByRole('region', { name: title })
    );
    for (const gauge of gauges) {
      await waitFor(() => expect(gauge.querySelectorAll('[data-chart-zones]')).toHaveLength(1));
      await expect(
        [...gauge.querySelectorAll('[data-zone]')].map((zone) => zone.getAttribute('data-zone'))
      ).toEqual(['ok', 'warn', 'crit']);
    }
    // OK, warning, OK, critical: the arc takes the color of its status.
    const ok = themeColor('--color-success-500');
    const warn = themeColor('--color-status-warn');
    const crit = themeColor('--color-status-crit');
    await waitFor(() =>
      expect(
        [...canvasElement.querySelectorAll('.recharts-radial-bar-sector')].map(
          (arc) => getComputedStyle(arc).fill
        )
      ).toEqual([ok, warn, ok, crit])
    );
  },
};

/** The tabs of the table filter by severity, one at a time, and "All" brings the first eleven back. */
export const AlertTabsShowOneSeverity: Story = {
  tags: ['!dev', '!autodocs'],
  args: {},
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Alert list' });
    await expect(severitiesOf(table)).toHaveLength(11);
    await expect(severitiesOf(table)).not.toContain('Info');

    await userEvent.click(canvas.getByRole('tab', { name: 'Critical 4' }));
    await expect(canvas.getByRole('tab', { name: 'Critical 4' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(severitiesOf(table)).toEqual(['Critical', 'Critical', 'Critical', 'Critical']);

    // The informational alerts are behind the others under "All": their tab shows all four.
    await userEvent.click(canvas.getByRole('tab', { name: 'Info 4' }));
    await expect(severitiesOf(table)).toEqual(['Info', 'Info', 'Info', 'Info']);

    await userEvent.click(canvas.getByRole('tab', { name: 'All 15' }));
    await expect(severitiesOf(table)).toHaveLength(11);
  },
};

/** A panel leads to the table filtered on its severity, with no navigation, and puts the focus on the table's heading. */
export const PanelFiltersTheAlerts: Story = {
  tags: ['!dev', '!autodocs'],
  args: {},
  play: async ({ canvas }) => {
    const hash = window.location.hash;
    const panels = canvas.getByRole('region', { name: 'Alerts by severity' });
    await userEvent.click(within(panels).getByRole('link', { name: /^Warning\s*6/ }));

    await expect(canvas.getByRole('tab', { name: 'Warning 6' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    const table = canvas.getByRole('table', { name: 'Alert list' });
    await expect(severitiesOf(table)).toEqual(Array(6).fill('Warning'));
    await expect(window.location.hash).toBe(hash);
    await expect(document.activeElement).toBe(
      canvas.getByRole('heading', { level: 2, name: 'Alerts' })
    );

    // Another panel replaces the filter.
    await userEvent.click(within(panels).getByRole('link', { name: /^Unknown\s*1/ }));
    await expect(severitiesOf(table)).toEqual(['Unknown']);
  },
};

/** Ack and Unack toggle one alert: its button, its state, and the acknowledged count of the Warning panel. */
export const AcknowledgeTogglesAnAlert: Story = {
  tags: ['!dev', '!autodocs'],
  args: {},
  play: async ({ canvas }) => {
    const warning = () =>
      within(canvas.getByRole('region', { name: 'Alerts by severity' })).getByRole('link', {
        name: /^Warning/,
      });
    const row = (name: string) => canvas.getByRole('button', { name }).closest('tr')!;
    const ack = 'Ack NTPClockSkew on mds-c02-09';
    const unack = 'Unack NTPClockSkew on mds-c02-09';

    await expect(warning()).toHaveTextContent('2 acknowledged');
    await expect(row(ack)).toHaveTextContent('Firing');

    await userEvent.click(canvas.getByRole('button', { name: ack }));
    await expect(canvas.getByRole('button', { name: unack })).toHaveTextContent('Unack');
    await expect(row(unack)).toHaveTextContent('Acknowledged');
    await expect(warning()).toHaveTextContent('3 acknowledged');

    await userEvent.click(canvas.getByRole('button', { name: unack }));
    await expect(row(ack)).toHaveTextContent('Firing');
    await expect(warning()).toHaveTextContent('2 acknowledged');
  },
};

/** On a phone the panels, the gauges and the matrix stack in that order, and the matrix scrolls in a box of its own. */
export const PhoneStacksTheBlocks: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  args: {},
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const panels = canvas.getByRole('region', { name: 'Alerts by severity' });
    const gauges = canvas.getByRole('region', { name: 'Cluster load' });
    const strip = canvas.getByRole('list', { name: 'Needs attention' });
    const grid = canvas.getByRole('grid', { name: 'Nodes by rack' });
    const before = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & window.Node.DOCUMENT_POSITION_FOLLOWING);
    await expect(before(panels, gauges)).toBe(true);
    await expect(before(gauges, strip)).toBe(true);
    await expect(before(strip, grid)).toBe(true);
    // One panel and one gauge to a row.
    await expect(
      new Set([...panels.children].map((card) => card.getBoundingClientRect().left)).size
    ).toBe(1);
    await expect(
      new Set([...gauges.children].map((card) => card.getBoundingClientRect().left)).size
    ).toBe(1);
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

/** Extreme content: the counts, the cut names, the nines, the long alerts and events that wrap. */
export const ExtremeContentHoldsTogether: Story = {
  tags: ['!dev', '!autodocs'],
  args: { state: 'extreme' },
  play: async ({ canvas }) => {
    // Four-digit counts in the panels, from the 616 alerts of the 2,048 nodes.
    const panels = canvas.getByRole('region', { name: 'Alerts by severity' });
    await expect(within(panels).getByRole('link', { name: /^Critical\s*303/ })).toBeVisible();
    await expect(within(panels).getByRole('link', { name: /^Unknown\s*102/ })).toBeVisible();
    await expect(canvas.getByRole('tab', { name: /^All 6\d\d$/ })).toBeVisible();

    // The gauges hold a title that is a path, and three of them are at the top of their range.
    const scratch = canvas.getByRole('region', { name: /^Lustre \/scratch\/atlas/ });
    await expect(within(scratch).getByText('Critical')).toBeVisible();
    await expect(
      within(canvas.getByRole('region', { name: 'Power' })).getByText('Critical')
    ).toBeVisible();

    // 64 racks in a box that scrolls, under a header that stays.
    const grid = canvas.getByRole('grid', { name: 'Nodes by rack' });
    await expect(within(grid).getAllByRole('rowheader')).toHaveLength(64);
    const box = grid.parentElement!;
    await expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
    await expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);

    // The long alert wraps inside its cell, the long target is cut, the page does not widen.
    const table = canvas.getByRole('table', { name: 'Alert list' });
    await expect(
      within(table).getByText(/^atlas-MDT0000 lost quorum after the 03:12 power-feed failover/)
    ).toBeVisible();
    const target = within(table)
      .getByText(/^mds-c02-001\.fs\.atlas/)
      .closest('span.truncate')!;
    await expect(target.scrollWidth).toBeGreaterThan(target.clientWidth);
    expectNoHorizontalOverflow();

    // A monitor name that does not fit is cut, and still there whole for a reader.
    const services = canvas.getByRole('region', { name: 'Services' });
    const name = within(services)
      .getByText(/^slurmctld-backup-primary-failover/)
      .closest('span.truncate')!;
    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    // 99.999% reads 99.99%: an uptime is cut, never rounded up to 100%.
    await expect(within(services).getAllByText('99.99%')).toHaveLength(2);

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
