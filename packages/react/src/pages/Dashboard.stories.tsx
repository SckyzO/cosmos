import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Activity,
  Bell,
  Box,
  Database,
  FileText,
  LayoutDashboard,
  Layers,
  Moon,
  Network,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Shell } from '../layout/Shell';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { PageHeader } from '../templates/PageHeader';
import { PageBreadcrumb } from '../templates/PageBreadcrumb';
import { SectionCard } from '../templates/SectionCard';
import { KpiCard } from '../data/KpiCard';
import { Timeline, type TimelineItem } from '../data/Timeline';
import { PageActionButton } from '../ui/PageActionButton';
import { Button } from '../ui/Button';
import { StatusBadge } from '../status/StatusBadge';
import { RowActionButton } from '../ui/RowActionButton';
import { DataTable } from '../table/DataTable';
import type { ColumnDef } from '../table/types';
import type { HealthStatus } from '../status/types';

const meta = {
  title: 'Pages/Dashboard',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Mock data ────────────────────────────────────────────────────────────────

type AlertRow = {
  id: string;
  severity: HealthStatus;
  name: string;
  type: string;
  location: string;
  rack: string;
  room: string;
};

const SEVERITIES: HealthStatus[] = ['CRIT', 'WARN', 'OK', 'INFO'];
const TYPES = ['cpu', 'memory', 'temp', 'power', 'disk'];
const ROOMS = ['Room A', 'Room B', 'Room C'];

const ROWS: AlertRow[] = Array.from({ length: 28 }, (_, i) => ({
  id: `alert-${i + 1}`,
  severity: SEVERITIES[i % SEVERITIES.length],
  name: `node-${100 + i}`,
  type: TYPES[i % TYPES.length],
  location: `DC${(i % 3) + 1}`,
  rack: `rack-${String((i % 12) + 1).padStart(2, '0')}`,
  room: ROOMS[i % ROOMS.length],
}));

const COLUMNS: ColumnDef<AlertRow>[] = [
  {
    key: 'severity',
    label: 'Severity',
    width: '14%',
    sortable: true,
    filterable: true,
    sortValue: (r) => r.severity,
    filterValue: (r) => r.severity,
    render: (r) => <StatusBadge status={r.severity} size="md" />,
  },
  {
    key: 'name',
    label: 'Name',
    width: '22%',
    sortable: true,
    sortValue: (r) => r.name,
    render: (r) => <span className="font-medium text-gray-900 dark:text-white">{r.name}</span>,
  },
  {
    key: 'type',
    label: 'Type',
    width: '14%',
    sortable: true,
    filterable: true,
    sortValue: (r) => r.type,
    filterValue: (r) => r.type,
    render: (r) => r.type,
  },
  {
    key: 'location',
    label: 'Location',
    width: '14%',
    sortable: true,
    filterable: true,
    sortValue: (r) => r.location,
    filterValue: (r) => r.location,
    render: (r) => r.location,
  },
  {
    key: 'rack',
    label: 'Rack',
    width: '12%',
    sortable: true,
    sortValue: (r) => r.rack,
    render: (r) => r.rack,
  },
  {
    key: 'room',
    label: 'Room',
    width: '12%',
    sortable: true,
    filterable: true,
    sortValue: (r) => r.room,
    filterValue: (r) => r.room,
    render: (r) => r.room,
  },
];

const TIMELINE: TimelineItem[] = [
  {
    id: '1',
    title: 'server-prod-01 marked CRIT',
    description: 'CPU > 95% for 5 minutes',
    time: '5m ago',
    icon: Server,
  },
  {
    id: '2',
    title: 'New alert escalated',
    description: 'PagerDuty notified — on-call',
    time: '12m ago',
    icon: Bell,
  },
  {
    id: '3',
    title: 'db-primary recovered',
    description: 'Replication lag back to 0',
    time: '1h ago',
    icon: Database,
  },
  {
    id: '4',
    title: 'Maintenance window started',
    description: 'DC2 / Room B rack 04',
    time: '3h ago',
    icon: Activity,
  },
];

// ── Reusable shell ───────────────────────────────────────────────────────────

const ThemeToggle = () => (
  <button
    type="button"
    onClick={() => document.documentElement.classList.toggle('dark')}
    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
    aria-label="Toggle theme"
  >
    <Moon className="h-4 w-4" />
  </button>
);

const IconButton = ({ icon: Icon, label }: { icon: typeof Bell; label: string }) => (
  <button
    type="button"
    aria-label={label}
    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
  >
    <Icon className="h-4 w-4" />
  </button>
);

const Nav = () => (
  <div className="py-3">
    <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active />
    <Sidebar.SubMenu icon={Layers} label="Library" defaultOpen>
      <Sidebar.Item icon={Box} label="Tokens" depth={1} />
      <Sidebar.Item icon={Layers} label="Components" depth={1} />
      <Sidebar.Item icon={FileText} label="Templates" depth={1} />
    </Sidebar.SubMenu>
    <Sidebar.SubMenu icon={Server} label="Infrastructure">
      <Sidebar.Item icon={Server} label="Servers" depth={1} />
      <Sidebar.Item icon={Network} label="Network" depth={1} />
      <Sidebar.Item icon={ShieldCheck} label="Health checks" depth={1} />
    </Sidebar.SubMenu>
    <Sidebar.Section label="Account">
      <Sidebar.Item
        icon={Bell}
        label="Notifications"
        badge={
          <span className="bg-brand-500 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white">
            3
          </span>
        }
      />
    </Sidebar.Section>
  </div>
);

// Lightweight inline charts — the Cosmos charts are dynamic and would slow
// the dashboard story start. Use small SVG mock placeholders that look
// realistic at a glance. Real charts are showcased under Charts/Gallery.
const MiniChart = ({
  variant,
  height = 120,
}: {
  variant: 'line' | 'bars' | 'donut';
  height?: number;
}) => {
  if (variant === 'donut') {
    return (
      <svg viewBox="0 0 100 100" className="mx-auto block" style={{ height, width: height }}>
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className="text-gray-200 dark:text-gray-800"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#465fff"
          strokeWidth="14"
          strokeDasharray="180 251"
          strokeDashoffset="0"
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="56" textAnchor="middle" className="fill-current text-base font-bold">
          71%
        </text>
      </svg>
    );
  }
  if (variant === 'bars') {
    const bars = [40, 65, 50, 80, 60, 90, 70, 85, 75];
    return (
      <svg viewBox={`0 0 ${bars.length * 16} 100`} className="block w-full" style={{ height }}>
        {bars.map((h, i) => (
          <rect
            key={i}
            x={i * 16 + 2}
            y={100 - h}
            width="12"
            height={h}
            rx="2"
            className="fill-brand-500"
            opacity={0.7 + (i / bars.length) * 0.3}
          />
        ))}
      </svg>
    );
  }
  // line + area
  const points = '0,80 30,55 60,68 90,40 120,52 150,30 180,42 210,28 240,38';
  return (
    <svg
      viewBox="0 0 240 100"
      className="block w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#465fff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#465fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${points} 240,100`} fill="url(#grad)" />
      <polyline points={points} fill="none" stroke="#465fff" strokeWidth="2" />
    </svg>
  );
};

// ── The Dashboard story ──────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <Shell
      topbar={
        <Topbar
          pageTitle="Analytics Dashboard"
          rightActions={
            <>
              <IconButton icon={Bell} label="Notifications" />
              <ThemeToggle />
              <IconButton icon={User} label="User profile" />
            </>
          }
        />
      }
      sidebar={
        <Sidebar>
          <Sidebar.Brand
            logo={<Box className="h-5 w-5" />}
            title="Cosmos"
            subtitle="Design system"
          />
          <Nav />
        </Sidebar>
      }
    >
      <div className="space-y-6 p-6">
        {/* Page header with breadcrumb + actions */}
        <PageHeader
          title="Production Dashboard"
          breadcrumb={
            <PageBreadcrumb
              items={[
                { label: 'Home', href: '#' },
                { label: 'Monitoring', href: '#' },
                { label: 'Production' },
              ]}
            />
          }
          actions={
            <>
              <PageActionButton icon={RefreshCw}>Refresh</PageActionButton>
              <PageActionButton icon={Plus} variant="primary">
                New alert rule
              </PageActionButton>
            </>
          }
        />

        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total Racks" value="48" sub="across 3 sites" />
          <KpiCard
            label="CRIT Alerts"
            value="3"
            sub="2 escalated"
            className="border-red-200 dark:border-red-900/40"
          />
          <KpiCard label="Health Score" value="94%" />
          <KpiCard label="Nodes Online" value="1 204" sub="of 1 248 total" />
        </div>

        {/* Mid row : 2/3 charts + 1/3 timeline */}
        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard
            title="CPU usage — last 24h"
            desc="cluster-wide average"
            className="lg:col-span-2"
          >
            <div className="text-brand-500">
              <MiniChart variant="line" height={180} />
            </div>
          </SectionCard>
          <SectionCard title="Recent activity" desc="system events">
            <Timeline items={TIMELINE} variant="dot" />
          </SectionCard>
        </div>

        {/* Secondary KPIs row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard title="Memory utilisation" desc="rolling 1h">
            <MiniChart variant="bars" height={140} />
          </SectionCard>
          <SectionCard title="Disk health" desc="OK / WARN / CRIT split">
            <div className="text-[var(--color-text-secondary)]">
              <MiniChart variant="donut" height={140} />
            </div>
          </SectionCard>
          <SectionCard title="Throughput" desc="requests / second">
            <MiniChart variant="line" height={140} />
          </SectionCard>
        </div>

        {/* Alerts table */}
        <SectionCard title="Active alerts" desc="sortable, filterable, paginated">
          <DataTable
            rows={ROWS}
            columns={COLUMNS}
            rowKey={(r) => r.id}
            renderRowAction={() => <RowActionButton>View</RowActionButton>}
            pageSize={10}
          />
        </SectionCard>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-[var(--color-text-muted)]">
            Story composed from real Cosmos components — Shell, Topbar, Sidebar (with brand,
            sub-menus, badges), PageHeader + PageBreadcrumb, KpiCard × 4, SectionCard × 4, Timeline,
            DataTable.
          </p>
          <Button variant="ghost" size="sm">
            View raw stories →
          </Button>
        </div>
      </div>
    </Shell>
  ),
};
