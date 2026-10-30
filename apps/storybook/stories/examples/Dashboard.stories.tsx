import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BarChart3,
  Download,
  Package,
  Settings,
  Store,
  Truck,
  UserMinus,
  Users,
} from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  Card,
  EmptyState,
  ErrorState,
  KpiCard,
  PageActionButton,
  PageContainer,
  PageHeader,
  SegmentedControl,
  Shell,
  Sidebar,
  Sk,
  SkeletonTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableIdentityCell,
  TableRow,
  Topbar,
  TrendDelta,
  UserMenu,
  BarList,
} from '../../../../packages/react/src';
import { DonutChart, LineAreaChart, Sparkline } from '../../../../packages/charts/src';
import {
  expectNoHorizontalOverflow,
  mobileViewport,
  portalDocsParams,
} from '../../../../packages/react/src/storybook-helpers';
import {
  CANCELLATIONS,
  CANCELLATIONS_SUMMARY,
  EXTREME_CANCELLATIONS,
  EXTREME_CANCELLATIONS_SUMMARY,
  EXTREME_CATEGORIES,
  EXTREME_KPIS,
  EXTREME_PERIOD,
  EXTREME_RANGE_ID,
  EXTREME_REGIONS,
  EXTREME_VARIANTS,
  EXTREME_VARIANT_REVENUE,
  EXTREME_VERSUS,
  PLANS,
  RANGES,
  RANGE_OPTIONS,
  REGIONS,
  abbreviate,
  euroShort,
  kpisFor,
  topSeriesWithOther,
  topWithOther,
  type Cancellation,
  type Kpi,
  type RangeId,
  type Region,
} from './dashboard.data';

// Dashboard: an analytics screen. A `PageHeader` (the page's one `h1`) carries the date range and
// the export; the cards below are four `KpiCard`s with a `Sparkline`, a revenue chart, a donut, a
// `BarList` and a table. Each widget is its own `<section>` with its own states, so one that fails
// or has nothing to show does not take the others with it. The five states below only change what
// the widgets show: the frame, the header and the grid are the same in each.

const meta = {
  title: 'Examples/Dashboard',
  parameters: { ...portalDocsParams.full(), layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type ScreenState = 'content' | 'empty' | 'loading' | 'error' | 'extreme';

// What the widgets draw for a state: the data module's numbers, shaped for the components.
type View = {
  range: RangeId;
  period: string;
  compare: string;
  versus: string;
  kpis: Kpi[];
  revenue: {
    grain: string;
    categories: string[];
    series: { name: string; data: number[]; style?: 'dashed' }[];
    stacked: boolean;
    height: number;
  };
  plans: { labels: string[]; values: number[]; centerValue?: string; height: number };
  regions: Region[];
  cancellations: Cancellation[];
  cancellationsSummary: string;
};

// The palette has eight colours: a ninth slice is "Other" and gets a neutral one, so a series
// never shares its colour with another.
const WITH_OTHER = [
  'var(--color-brand-500, #465fff)',
  'var(--color-chart-2, #06b6d4)',
  'var(--color-chart-3, #8b5cf6)',
  'var(--color-chart-4, #ec4899)',
  'var(--color-chart-5, #64748b)',
  'var(--color-chart-6, #f97316)',
  'var(--color-chart-7, #14b8a6)',
  'var(--color-chart-8, #84cc16)',
  'var(--color-gray-400, #98a2b3)',
];

const viewFor = (state: ScreenState, range: RangeId): View => {
  if (state === 'extreme') {
    // Twelve plan variants: the data groups them into the top eight and "Other".
    const plans = topWithOther(EXTREME_VARIANTS, (variant) => variant.subscribers, 8);
    return {
      range: EXTREME_RANGE_ID,
      period: EXTREME_PERIOD,
      compare: 'previous 90 days',
      versus: EXTREME_VERSUS,
      kpis: EXTREME_KPIS,
      revenue: {
        grain: 'Weekly revenue by plan variant',
        categories: EXTREME_CATEGORIES,
        series: topSeriesWithOther(EXTREME_VARIANT_REVENUE, 8),
        stacked: true,
        height: 360,
      },
      plans: {
        labels: plans.map((plan) => plan.name),
        values: plans.map((plan) => plan.value),
        centerValue: abbreviate(plans.reduce((sum, plan) => sum + plan.value, 0)),
        height: 620,
      },
      regions: EXTREME_REGIONS,
      cancellations: EXTREME_CANCELLATIONS,
      cancellationsSummary: EXTREME_CANCELLATIONS_SUMMARY,
    };
  }
  const data = RANGES[range];
  return {
    range,
    period: data.period,
    compare: data.compare,
    versus: data.versus,
    kpis: kpisFor(range),
    revenue: {
      grain: data.grain,
      categories: data.categories,
      series: [
        { name: 'This period', data: data.revenue },
        { name: 'Previous period', data: data.previous, style: 'dashed' },
      ],
      stacked: false,
      height: 288,
    },
    plans: {
      labels: PLANS.map((plan) => plan.name),
      values: PLANS.map((plan) => plan.subscribers),
      height: 300,
    },
    regions: REGIONS,
    cancellations: CANCELLATIONS,
    cancellationsSummary: CANCELLATIONS_SUMMARY,
  };
};

// ── Frame ────────────────────────────────────────────────────────────────────

const NAV = [
  { label: 'Overview', icon: BarChart3, active: true },
  { label: 'Subscribers', icon: Users },
  { label: 'Plans', icon: Package },
  { label: 'Deliveries', icon: Truck },
  { label: 'Settings', icon: Settings },
];

const DashboardSidebar = () => (
  <Sidebar>
    <Sidebar.Brand logo={<span className="text-base font-bold">H</span>} title="Harvest Box" />
    <Sidebar.Section label="Analytics">
      {NAV.map((entry) => (
        <Sidebar.Item
          key={entry.label}
          icon={entry.icon}
          label={entry.label}
          href={`#${entry.label.toLowerCase()}`}
          active={entry.active}
        />
      ))}
    </Sidebar.Section>
  </Sidebar>
);

const DashboardTopbar = () => (
  <Topbar
    // Below `lg` the sidebar is off screen: its brand moves to the bar, next to the hamburger.
    brand={
      <span className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]">
        <span
          aria-hidden
          className="bg-brand-500 flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
        >
          H
        </span>
        Harvest Box
      </span>
    }
    // The Topbar title is text: the page header below is the one `h1`.
    pageTitle="Overview"
    endActions={
      <UserMenu>
        <UserMenu.Trigger name="Amélie Moreau" hideName />
        <UserMenu.Content>
          <UserMenu.Header name="Amélie Moreau" email="amelie@harvestbox.example" />
          <UserMenu.Items>
            <UserMenu.Item>Account</UserMenu.Item>
            <UserMenu.Item intent="danger">Sign out</UserMenu.Item>
          </UserMenu.Items>
        </UserMenu.Content>
      </UserMenu>
    }
  />
);

// ── Widgets ──────────────────────────────────────────────────────────────────

// A section named by its title, so a screen reader lists the widgets as regions and a test finds
// one by name. The `action` sits beside the title (a link, a menu).
const Widget = ({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) => {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className={className}>
      <Card padding="lg" className="h-full">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-[var(--color-text-primary)]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
        {children}
      </Card>
    </section>
  );
};

const ViewAll = ({ label }: { label: string }) => (
  <a
    href="#all"
    className="text-brand-600 dark:text-brand-400 focus-visible:focus-indicator shrink-0 rounded-sm text-sm font-medium"
  >
    {label}
  </a>
);

// ── KPIs ─────────────────────────────────────────────────────────────────────

// The figure is abbreviated (`€412.9k`) so it fits a card of half a phone; `exactValue` carries
// the full one, as a tooltip and in the card's accessible name. A sparkline fills the `chart`
// slot: Cosmos does not couple `react` to `charts`, so the chart is the app's to pass.
const KpiGrid = ({ view, state }: { view: View; state: ScreenState }) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
    {view.kpis.map((kpi) => {
      const sparkline = (
        <Sparkline
          data={kpi.spark}
          label={kpi.label}
          formatValue={kpi.formatSpark}
          height={48}
          emptyMessage="No data yet"
          ariaLabel={`${kpi.label} over the period`}
        />
      );
      const delta = (
        <TrendDelta
          size="sm"
          value={kpi.delta}
          goodDirection={kpi.goodDirection}
          format={kpi.formatDelta}
          label={view.versus}
        />
      );
      // A new account has no figure yet: a dash, and a line saying why.
      if (state === 'empty')
        return (
          <KpiCard
            key={kpi.id}
            label={kpi.label}
            icon={kpi.icon}
            value="—"
            sub="No data yet"
            className="p-4 sm:p-5"
          />
        );
      return (
        <KpiCard
          key={kpi.id}
          label={kpi.label}
          icon={kpi.icon}
          value={kpi.value}
          exactValue={kpi.exactValue}
          delta={delta}
          chart={sparkline}
          loading={state === 'loading'}
          className="p-4 sm:p-5"
        />
      );
    })}
  </div>
);

// ── Revenue ──────────────────────────────────────────────────────────────────

const RevenueCard = ({
  view,
  state,
  failed,
  onRetry,
}: {
  view: View;
  state: ScreenState;
  failed: boolean;
  onRetry: () => void;
}) => {
  const { revenue } = view;
  const empty = state === 'empty';
  return (
    <Widget
      title="Revenue over time"
      subtitle={empty ? 'Daily revenue' : `${revenue.grain}, ${view.period}`}
      action={!empty && !failed && state !== 'loading' && <ViewAll label="View report" />}
      className="lg:col-span-2"
    >
      {state === 'loading' ? (
        <div className="space-y-3" style={{ height: revenue.height }}>
          <Sk h="h-full" round="rounded-lg" />
        </div>
      ) : failed ? (
        // Only this card failed: the others keep their data, and the way out is in the card.
        <ErrorState
          title="Couldn't load revenue"
          description="The request timed out. Your other widgets are up to date."
          onRetry={onRetry}
          className="min-h-72"
        />
      ) : (
        <LineAreaChart
          series={empty ? [] : revenue.series}
          categories={empty ? [] : revenue.categories}
          stacked={revenue.stacked}
          colors={revenue.stacked ? WITH_OTHER : undefined}
          formatValue={euroShort}
          legendPosition={revenue.stacked ? 'bottom' : 'top'}
          height={revenue.height}
          emptyMessage="No revenue yet"
          ariaLabel={revenue.stacked ? 'Weekly revenue by plan variant' : 'Revenue over time'}
        />
      )}
    </Widget>
  );
};

// ── Plans, regions, cancellations ────────────────────────────────────────────

const PlansCard = ({ view, state }: { view: View; state: ScreenState }) => {
  const { plans } = view;
  const empty = state === 'empty';
  return (
    <Widget title="Subscribers by plan" subtitle={empty ? 'Active today' : 'Active on 29 Oct'}>
      {state === 'loading' ? (
        <div className="flex items-center justify-center" style={{ height: plans.height }}>
          <Sk h="h-48" w="w-48" round="rounded-full" />
        </div>
      ) : (
        <DonutChart
          series={empty ? [] : plans.values}
          labels={empty ? [] : plans.labels}
          colors={WITH_OTHER}
          centerLabel="Subscribers"
          centerValue={plans.centerValue}
          formatValue={abbreviateOrGroup}
          legendValues
          height={plans.height}
          emptyMessage="No subscribers yet"
          ariaLabel="Subscribers by plan"
        />
      )}
    </Widget>
  );
};

// Whole numbers read in full up to the thousands; past that the figure is abbreviated.
const abbreviateOrGroup = (value: number) =>
  value >= 100_000 ? abbreviate(value) : value.toLocaleString('en-US');

const RegionsCard = ({ view, state }: { view: View; state: ScreenState }) => {
  const items = state === 'empty' ? [] : view.regions;
  return (
    <Widget
      title="Top regions"
      subtitle={state === 'empty' ? 'Deliveries' : 'Deliveries, last 30 days'}
      className="lg:col-span-2"
    >
      <BarList
        aria-label="Top regions by deliveries"
        sort="desc"
        loading={state === 'loading'}
        emptyMessage="No deliveries yet"
        formatValue={abbreviateOrGroup}
        items={items.map((region) => ({
          id: region.name,
          label: region.name,
          value: region.deliveries,
          delta: <TrendDelta size="sm" value={region.delta} />,
        }))}
      />
    </Widget>
  );
};

// A dashboard widget is a short, fixed list: a `Table` with no sorting or paging. It scrolls
// sideways in its own box if it must, but on a phone a row of five cells is hard to read, so below
// `sm` the same rows are drawn as a list (both are in the page, CSS shows one).
const CancellationsTable = ({ rows }: { rows: Cancellation[] }) => (
  <Table
    aria-label="Recent cancellations"
    className="table-fixed"
    containerClassName="max-sm:hidden"
  >
    <TableHead>
      <TableRow>
        <TableHeaderCell className="w-[30%]">Customer</TableHeaderCell>
        <TableHeaderCell className="w-[15%]">Plan</TableHeaderCell>
        <TableHeaderCell className="w-[25%]">Reason</TableHeaderCell>
        <TableHeaderCell className="w-[14%]">Date</TableHeaderCell>
        <TableHeaderCell numeric className="w-[16%]">
          MRR lost
        </TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.id}>
          <TableCell>
            <TableIdentityCell title={row.customer} subtitle={row.email} />
          </TableCell>
          <TableCell>
            <span title={row.plan} className="block truncate">
              {row.plan}
            </span>
          </TableCell>
          {/* A reason is the customer's answer, not a status: text, not a `Badge`. */}
          <TableCell>
            <span title={row.reason} className="block truncate">
              {row.reason}
            </span>
          </TableCell>
          <TableCell className="whitespace-nowrap">{row.date}</TableCell>
          <TableCell
            numeric
            className="whitespace-nowrap"
          >{`-${euroShort(row.mrrLost)}`}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const CancellationsList = ({ rows }: { rows: Cancellation[] }) => (
  <ul aria-label="Recent cancellations" className="divide-y divide-[var(--color-border)] sm:hidden">
    {rows.map((row) => (
      <li key={row.id} className="py-row-12 first:pt-0 last:pb-0">
        <div className="flex items-start justify-between gap-3">
          <TableIdentityCell title={row.customer} subtitle={row.email} className="max-w-full" />
          <span className="shrink-0 text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">{`-${euroShort(row.mrrLost)}`}</span>
        </div>
        <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">
          <bdi>{row.plan}</bdi> · <bdi>{row.date}</bdi>
        </p>
        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
          <bdi>{row.reason}</bdi>
        </p>
      </li>
    ))}
  </ul>
);

const CancellationsCard = ({ view, state }: { view: View; state: ScreenState }) => (
  <Widget
    title="Recent cancellations"
    subtitle={state === 'empty' ? 'Last 7 days' : view.cancellationsSummary}
    action={
      state === 'content' || state === 'error' || state === 'extreme' ? (
        <ViewAll label="View all" />
      ) : undefined
    }
    className="lg:col-span-3"
  >
    {state === 'loading' ? (
      <SkeletonTable rows={5} cols={5} />
    ) : state === 'empty' ? (
      <EmptyState
        compact
        icon={UserMinus}
        title="No cancellations yet"
        description="Subscribers who cancel will be listed here with their reason."
      />
    ) : (
      <>
        <CancellationsTable rows={view.cancellations} />
        <CancellationsList rows={view.cancellations} />
      </>
    )}
  </Widget>
);

// ── Page ─────────────────────────────────────────────────────────────────────

const DashboardPage = ({ state: initial }: { state: ScreenState }) => {
  const [range, setRange] = useState<RangeId>(initial === 'extreme' ? EXTREME_RANGE_ID : '30d');
  // The retry of the failed card: the recipe goes straight to the loaded chart.
  const [revenueFailed, setRevenueFailed] = useState(initial === 'error');
  const state = initial;
  const view = viewFor(state, range);
  const empty = state === 'empty';
  const loading = state === 'loading';

  return (
    <>
      <PageHeader
        as="h1"
        title="Subscription analytics"
        description={
          empty
            ? 'Your numbers appear here as soon as orders come in'
            : loading
              ? undefined
              : `${view.period} · compared with the ${view.compare}`
        }
        actions={
          <>
            <SegmentedControl
              aria-label="Date range"
              size="sm"
              options={RANGE_OPTIONS}
              value={view.range}
              onChange={setRange}
            />
            <PageActionButton icon={Download} disabled={empty}>
              Export
            </PageActionButton>
            {/* The one call to action of a new account sits in the header, not in each widget. */}
            {empty && (
              <PageActionButton icon={Store} variant="primary">
                Connect your store
              </PageActionButton>
            )}
          </>
        }
      />
      {/* While the first load runs the region is busy, and a status line says so: the skeletons
          themselves say nothing to a screen reader. */}
      <div aria-busy={loading || undefined} className="mt-6 space-y-4 sm:space-y-6">
        {loading && (
          <p role="status" className="sr-only">
            Loading analytics…
          </p>
        )}
        <KpiGrid view={view} state={state} />
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <RevenueCard
            view={view}
            state={state}
            failed={revenueFailed}
            onRetry={() => setRevenueFailed(false)}
          />
          <PlansCard view={view} state={state} />
        </div>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
          <RegionsCard view={view} state={state} />
          <CancellationsCard view={view} state={state} />
        </div>
      </div>
    </>
  );
};

const DashboardScreen = ({ state }: { state: ScreenState }) => (
  <Shell topbar={<DashboardTopbar />} sidebar={<DashboardSidebar />}>
    <PageContainer width="full">
      <DashboardPage state={state} />
    </PageContainer>
  </Shell>
);

// ── Stories: one per state ───────────────────────────────────────────────────

/** Four KPIs with a trend and a sparkline, revenue, plans, regions and the latest cancellations. */
export const Content: Story = {
  render: () => <DashboardScreen state="content" />,
};

/** A new account: every widget says what is missing, and the header holds the one call to action. */
export const Empty: Story = {
  render: () => <DashboardScreen state="empty" />,
};

/** The first load: skeletons where the numbers go, the header and the frame already live. */
export const Loading: Story = {
  render: () => <DashboardScreen state="loading" />,
};

/** A partial failure: the revenue card shows an error with a retry, the other widgets keep their data. */
export const LoadError: Story = {
  name: 'Error',
  render: () => <DashboardScreen state="error" />,
};

/**
 * Millions of euros with their exact value in a tooltip, negative deltas, twelve plan variants
 * grouped into the top eight and "Other", long plan and region names.
 */
export const ExtremeContent: Story = {
  render: () => <DashboardScreen state="extreme" />,
};

/** At 375px the KPIs sit two by two with abbreviated values and the table becomes a list. */
export const Phone: Story = {
  globals: mobileViewport,
  render: () => <DashboardScreen state="content" />,
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

// ── Hidden tests ─────────────────────────────────────────────────────────────

const body = () => within(document.body);

type Canvas = Parameters<NonNullable<Story['play']>>[0]['canvas'];

// The KPI card that shows `value`.
const kpiCard = (canvas: Canvas, value: string) =>
  canvas.getByText(value).closest('div.rounded-2xl') as HTMLElement;

// DataTable draws a table and a list of cards and shows one: the copy that is displayed.
const shown = (elements: HTMLElement[]) => elements.find((el) => el.checkVisibility())!;

// A widget is a region named by its title.
const widget = (canvas: Canvas, name: string) => canvas.getByRole('region', { name });

/** Content: one `h1`, four KPIs whose exact value is in their text, and every widget drawn. */
export const ContentShowsEveryWidget: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DashboardScreen state="content" />,
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Subscription analytics' })
    ).toBeVisible();
    await expect(canvas.getByText('€412.9k')).toBeVisible();
    await expect(canvas.getByText('2.4%')).toBeVisible();
    await expect(canvas.getByText('€46.80')).toBeVisible();
    await expect(
      await canvas.findByRole('application', { name: 'Revenue over time' })
    ).toBeVisible();
    await expect(
      await canvas.findByRole('application', { name: 'Subscribers by plan' })
    ).toBeVisible();
    await expect(within(widget(canvas, 'Top regions')).getAllByRole('listitem')).toHaveLength(
      REGIONS.length
    );
    await expect(
      within(widget(canvas, 'Recent cancellations')).getAllByRole('row').length
    ).toBeGreaterThan(CANCELLATIONS.length);
  },
};

/** The abbreviated figure carries its exact value for screen readers, and a tooltip shows it. */
export const KpiExactValueIsInTheName: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DashboardScreen state="content" />,
  play: async ({ canvas }) => {
    const value = canvas.getByText('€412.9k');
    const card = kpiCard(canvas, '€412.9k');
    await expect(card).toHaveTextContent('exact value €412,860.00');
    await expect(kpiCard(canvas, '38.2k')).toHaveTextContent('exact value 38,214');
    await userEvent.hover(value);
    await waitFor(() =>
      expect(
        body()
          .getAllByRole('tooltip')
          .map((tip) => tip.textContent)
      ).toContainEqual(expect.stringContaining('€412,860.00'))
    );
  },
};

/** Churn is the metric where a drop is good news: its delta reads "decrease" and is not red. */
export const ChurnDropIsGoodNews: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DashboardScreen state="content" />,
  play: async ({ canvas }) => {
    const pill = within(kpiCard(canvas, '2.4%')).getByText(/decrease/).parentElement!;
    await expect(pill).toHaveTextContent('-0.3 pt');
    await expect(pill.className).toMatch(/green/);
  },
};

/** The range control rewrites the period under the title. */
export const RangeChangesThePeriod: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DashboardScreen state="content" />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/· compared with the previous 30 days/)).toBeVisible();
    await userEvent.click(canvas.getByRole('radio', { name: '7d' }));
    await expect(
      await canvas.findByText(/23 – 29 Oct 2026 · compared with the previous 7 days/)
    ).toBeVisible();
    await expect(canvas.getByRole('radio', { name: '7d' })).toBeChecked();
  },
};

/** Empty: each widget says what it lacks, and "Connect your store" appears once, in the header. */
export const EmptyHasOneCallToAction: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DashboardScreen state="empty" />,
  play: async ({ canvas }) => {
    const header = canvas.getByRole('heading', { level: 1 }).closest('div')!.parentElement!;
    await expect(canvas.getAllByRole('button', { name: 'Connect your store' })).toHaveLength(1);
    await expect(within(header).getByRole('button', { name: 'Connect your store' })).toBeVisible();
    await expect(
      within(widget(canvas, 'Revenue over time')).getByText('No revenue yet')
    ).toBeVisible();
    await expect(
      within(widget(canvas, 'Subscribers by plan')).getByText('No subscribers yet')
    ).toBeVisible();
    await expect(
      within(widget(canvas, 'Top regions')).getByText('No deliveries yet')
    ).toBeVisible();
    await expect(
      shown(within(widget(canvas, 'Recent cancellations')).getAllByText('No cancellations yet'))
    ).toBeVisible();
    await expect(canvas.getAllByText('No data yet')).toHaveLength(4);
  },
};

/** Loading: the region is busy, a status line says so, and the widgets hold skeletons. */
export const LoadingIsBusy: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DashboardScreen state="loading" />,
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('status')[0]).toHaveTextContent('Loading analytics');
    const busy = document.querySelector<HTMLElement>('main [aria-busy="true"], [aria-busy="true"]');
    await expect(busy).not.toBeNull();
    await expect(busy!.querySelectorAll('.animate-pulse').length).toBeGreaterThan(12);
    // The header is already there.
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Subscription analytics' })
    ).toBeVisible();
    await expect(canvas.getAllByRole('radio')).toHaveLength(4);
  },
};

/** Error: only the revenue card fails; the KPIs and the other widgets keep their data. */
export const ErrorIsLimitedToRevenue: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DashboardScreen state="error" />,
  play: async ({ canvas }) => {
    const alerts = canvas.getAllByRole('alert');
    await expect(alerts).toHaveLength(1);
    const revenue = widget(canvas, 'Revenue over time');
    await expect(within(revenue).getByRole('alert')).toHaveTextContent("Couldn't load revenue");
    await expect(canvas.getByText('€412.9k')).toBeVisible();
    await expect(
      await canvas.findByRole('application', { name: 'Subscribers by plan' })
    ).toBeVisible();
    await expect(
      within(widget(canvas, 'Top regions')).getAllByRole('listitem').length
    ).toBeGreaterThan(0);
    await expect(
      within(widget(canvas, 'Recent cancellations')).getAllByRole('row').length
    ).toBeGreaterThan(1);
  },
};

/** "Try again" brings the revenue chart back and leaves the rest as it was. */
export const ErrorRetryRestoresRevenue: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DashboardScreen state="error" />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(
      await canvas.findByRole('application', { name: 'Revenue over time' })
    ).toBeVisible();
  },
};

/**
 * Extreme: millions with their exact value, negative deltas, twelve variants grouped into eight
 * and "Other" in both charts, and a long name cut instead of widening the page.
 */
export const ExtremeContentFits: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DashboardScreen state="extreme" />,
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(canvas.getByText('€12.4M')).toBeVisible();
    await expect(kpiCard(canvas, '€12.4M')).toHaveTextContent('exact value €12,418,906.40');
    await expect(canvas.getAllByText(/decrease/).length).toBeGreaterThanOrEqual(3);
    // Top 8 + Other: nine legend entries in each chart, never twelve.
    const revenue = await canvas.findByRole('application', {
      name: 'Weekly revenue by plan variant',
    });
    await waitFor(() =>
      expect(
        revenue.closest('.recharts-wrapper')?.querySelectorAll('.recharts-legend-wrapper button')
      ).toHaveLength(9)
    );
    const plans = widget(canvas, 'Subscribers by plan');
    await waitFor(() =>
      expect(plans.querySelectorAll('.recharts-legend-wrapper button')).toHaveLength(9)
    );
    await expect(within(plans).getByText('Other')).toBeVisible();
    // A long customer name is truncated by the cell, with the full name as its title.
    const name = shown(
      within(widget(canvas, 'Recent cancellations')).getAllByText(
        'Maximilian von Hohenzollern-Sigmaringen'
      )
    );
    await expect(name).toHaveAttribute('title', 'Maximilian von Hohenzollern-Sigmaringen');
  },
};

/** On the phone the table is a list of cards: the customer heads each one, no table is left. */
export const PhoneCancellationsAreAList: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  render: () => <DashboardScreen state="content" />,
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const card = widget(canvas, 'Recent cancellations');
    await expect(within(card).queryByRole('table')).toBeNull();
    await expect(within(card).getAllByRole('listitem')).toHaveLength(CANCELLATIONS.length);
    await expect(shown(within(card).getAllByText('Camille Dubois'))).toBeVisible();
    // Two columns of KPIs: the first two cards share a row.
    const first = kpiCard(canvas, '€412.9k');
    const second = kpiCard(canvas, '38.2k');
    await expect(first.getBoundingClientRect().top).toBe(second.getBoundingClientRect().top);
  },
};
