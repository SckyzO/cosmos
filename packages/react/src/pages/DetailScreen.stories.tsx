import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  Bell,
  GitBranch,
  Home,
  Layers,
  Search,
  Server,
  Settings as SettingsIcon,
} from 'lucide-react';
import { placeholderAvatar } from '../storybook-avatars';
import { Shell } from '../layout/Shell';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { Tabs } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { HealthDot } from '../status/HealthDot';
import { KpiCard } from '../data/KpiCard';
import { ContentNarrow } from '../templates/ContentNarrow';

// TUI Plus "Page Examples / Detail Screens" — sub-nav tabs + header with
// repo title/status + KPIs row + activity table. Built from Cosmos primitives.

const meta = {
  title: 'Pages/Detail Screen',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity' },
  { value: 'settings', label: 'Settings' },
  { value: 'collaborators', label: 'Collaborators' },
  { value: 'notifications', label: 'Notifications' },
];

const ACTIVITY = [
  {
    user: 'Michael Foster',
    commit: '2d89f0c8',
    status: 'OK' as const,
    duration: '25s',
    when: '45 minutes ago',
  },
  {
    user: 'Lindsay Walton',
    commit: '249df660',
    status: 'OK' as const,
    duration: '1m 32s',
    when: '3 hours ago',
  },
  {
    user: 'Courtney Henry',
    commit: '11464223',
    status: 'CRIT' as const,
    duration: '1m 4s',
    when: '12 hours ago',
  },
  {
    user: 'Courtney Henry',
    commit: 'dad28e95',
    status: 'OK' as const,
    duration: '2m 15s',
    when: '2 days ago',
  },
];

const Avatar = ({ name }: { name: string }) => (
  <img
    alt=""
    src={placeholderAvatar(name, 96)}
    className="size-8 shrink-0 rounded-full bg-gray-200"
  />
);

export const Sidebar_: Story = {
  name: 'Sidebar',
  render: () => {
    const [tab, setTab] = useState('overview');
    return (
      <Shell
        topbar={
          <Topbar
            sidebarCollapsed={false}
            onToggleSidebar={() => {}}
            center={
              <div className="relative max-w-md">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="search"
                  placeholder="Search"
                  className="focus:ring-brand-500/40 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-base)] py-1.5 pr-3 pl-9 text-sm focus:ring-2 focus:outline-none"
                />
              </div>
            }
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
                  src={placeholderAvatar('cosmos-detail-demo', 64)}
                  className="size-8 rounded-full"
                />
              </>
            }
          />
        }
        sidebar={
          <Sidebar>
            <Sidebar.Brand title="Acme" />
            <Sidebar.Section>
              <Sidebar.Item icon={Home} label="Home" />
              <Sidebar.Item icon={GitBranch} label="Deployments" active />
              <Sidebar.Item icon={Server} label="Servers" />
              <Sidebar.Item icon={Layers} label="Activity" />
              <Sidebar.Item icon={SettingsIcon} label="Settings" />
            </Sidebar.Section>
          </Sidebar>
        }
      >
        <div className="bg-[var(--color-bg-base)]">
          {/* Sub-tab navigation */}
          <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-panel)] px-6">
            <Tabs value={tab} onChange={setTab}>
              <Tabs.List className="border-0">
                {TABS.map((t) => (
                  <Tabs.Trigger key={t.value} value={t.value}>
                    {t.label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs>
          </div>

          {/* Header block */}
          <div className="border-b border-[var(--color-border)] px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <HealthDot status="OK" />
                <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Planetaria <span className="text-[var(--color-text-muted)]">/</span> mobile-api
                </h1>
              </div>
              <Badge variant="success">Production</Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Deploys from GitHub via main branch
            </p>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-1 gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Number of deploys" value="405" />
            <KpiCard label="Average deploy time" value="3.65 mins" />
            <KpiCard label="Number of servers" value="3" />
            <KpiCard label="Success rate" value="98.5%" />
          </div>

          {/* Latest activity */}
          <ContentNarrow maxWidth={9999} className="px-6 pb-10">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              Latest activity
            </h3>
            <div className="mt-4 overflow-hidden ring-1 ring-[var(--color-border)] sm:rounded-md">
              <table className="min-w-full divide-y divide-[var(--color-border)]">
                <thead className="bg-[var(--color-bg-panel)]">
                  <tr>
                    {['User', 'Commit', 'Status', 'Duration', 'Deployed at'].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-bg-base)]">
                  {ACTIVITY.map((row) => (
                    <tr key={row.commit}>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <Avatar name={row.user} />
                          <span className="font-medium text-[var(--color-text-primary)]">
                            {row.user}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                        <span className="font-mono">{row.commit}</span>{' '}
                        <Badge variant="neutral" size="sm">
                          main
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <HealthDot status={row.status} />
                          <span className="text-[var(--color-text-primary)]">
                            {row.status === 'CRIT' ? 'Error' : 'Completed'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                        {row.duration}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[var(--color-text-secondary)]">
                        {row.when}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentNarrow>
        </div>
      </Shell>
    );
  },
};
