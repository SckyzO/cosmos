import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Bell,
  Box,
  GitBranch,
  Home,
  Layers,
  Search,
  Server,
  Settings as SettingsIcon,
  User,
} from 'lucide-react';
import { Shell } from '../layout/Shell';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { StackedList } from '../lists/StackedList';
import { ActivityFeed } from '../lists/ActivityFeed';
import { HealthDot } from '../status/HealthDot';
import { Badge } from '../ui/Badge';

// TUI Plus "Page Examples / Home Screens" — sidebar shell with a list of
// items in the main column and an activity feed in the secondary panel.
// Composed entirely from existing Cosmos primitives.

const meta = {
  title: 'Pages/Home Screen',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type DeployStatus = 'OK' | 'WARN' | 'CRIT';

const DEPLOYMENTS: Array<{
  org: string;
  repo: string;
  meta: string;
  badge: 'Preview' | 'Production';
  status: DeployStatus;
}> = [
  { org: 'Planetaria', repo: 'ios-app', meta: 'Initiated 1m 32s ago', badge: 'Preview', status: 'WARN' },
  { org: 'Planetaria', repo: 'mobile-api', meta: 'Deployed 3m ago', badge: 'Production', status: 'OK' },
  { org: 'Tailwind Labs', repo: 'tailwindcss.com', meta: 'Deployed 3h ago', badge: 'Preview', status: 'OK' },
  { org: 'Tailwind Labs', repo: 'company-website', meta: 'Deployed 1d ago', badge: 'Preview', status: 'OK' },
  { org: 'Protocol', repo: 'relay-service', meta: 'Deployed 1d ago', badge: 'Production', status: 'OK' },
  { org: 'Planetaria', repo: 'android-app', meta: 'Deployed 5d ago', badge: 'Preview', status: 'OK' },
  { org: 'Protocol', repo: 'api.protocol.chat', meta: 'Failed to deploy 6d ago', badge: 'Preview', status: 'CRIT' },
];

const FEED = [
  { user: 'Michael Foster', when: '1h', repo: 'ios-app', sha: '2d89f0c8' },
  { user: 'Lindsay Walton', when: '3h', repo: 'mobile-api', sha: '249df660' },
  { user: 'Courtney Henry', when: '12h', repo: 'ios-app', sha: '11464223' },
  { user: 'Courtney Henry', when: '2d', repo: 'company-website', sha: 'dad28e95' },
  { user: 'Michael Foster', when: '5d', repo: 'relay-service', sha: '624bc94c' },
];

const Avatar = ({ name }: { name: string }) => (
  <img
    alt=""
    src={`https://i.pravatar.cc/96?u=${encodeURIComponent(name)}`}
    className="size-8 shrink-0 rounded-full bg-gray-200"
  />
);

export const Sidebar_: Story = {
  name: 'Sidebar',
  render: () => (
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
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-base)] py-1.5 pr-3 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
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
                src="https://i.pravatar.cc/64?u=cosmos-home-demo"
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
            <Sidebar.Item icon={Home} label="Home" active />
            <Sidebar.Item icon={GitBranch} label="Deployments" />
            <Sidebar.Item icon={Server} label="Servers" />
            <Sidebar.Item icon={Box} label="Projects" />
            <Sidebar.Item icon={Layers} label="Activity" />
            <Sidebar.Item icon={SettingsIcon} label="Settings" />
          </Sidebar.Section>
        </Sidebar>
      }
      secondary={
        <div>
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Activity feed
            </h3>
            <a href="#" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              View all
            </a>
          </div>
          <div className="px-6 py-4">
            <StackedList>
              {FEED.map((f) => (
                <StackedList.Item
                  key={f.sha}
                  avatar={<Avatar name={f.user} />}
                  title={f.user}
                  subtitle={`Pushed to ${f.repo} (${f.sha})`}
                  meta={
                    <span className="text-xs text-[var(--color-text-muted)]">{f.when}</span>
                  }
                />
              ))}
            </StackedList>
          </div>
        </div>
      }
      secondaryWidthClassName="w-96"
    >
      <div className="bg-[var(--color-bg-base)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Deployments</h2>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            Sort by
          </button>
        </div>
        <ul role="list" className="divide-y divide-[var(--color-border)]">
          {DEPLOYMENTS.map((d) => (
            <li key={d.org + d.repo} className="flex items-center gap-x-4 px-6 py-4">
              <HealthDot status={d.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {d.org} <span className="text-[var(--color-text-muted)]">/</span> {d.repo}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                  Deploys from GitHub · {d.meta}
                </p>
              </div>
              <Badge variant={d.badge === 'Production' ? 'success' : 'neutral'}>{d.badge}</Badge>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  ),
};
