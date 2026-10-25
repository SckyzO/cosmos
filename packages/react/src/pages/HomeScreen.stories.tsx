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
} from 'lucide-react';
import { placeholderAvatar } from '../storybook-avatars';
import { Shell } from '../layout/Shell';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { PageContainer } from '../layout/PageContainer';
import { StackedList } from '../lists/StackedList';
import { HealthDot } from '../status/HealthDot';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { expectHamburgerTogglesSidebar, portalDocsParams } from '../storybook-helpers';

// TUI Plus "Page Examples / Home Screens" — sidebar shell with a list of
// items in the main column and an activity feed in the secondary panel.
// Composed entirely from existing Cosmos primitives.

const meta = {
  title: 'Pages/Home Screen',
  parameters: portalDocsParams.full(),
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
  {
    org: 'Planetaria',
    repo: 'ios-app',
    meta: 'Initiated 1m 32s ago',
    badge: 'Preview',
    status: 'WARN',
  },
  {
    org: 'Planetaria',
    repo: 'mobile-api',
    meta: 'Deployed 3m ago',
    badge: 'Production',
    status: 'OK',
  },
  {
    org: 'Tailwind Labs',
    repo: 'tailwindcss.com',
    meta: 'Deployed 3h ago',
    badge: 'Preview',
    status: 'OK',
  },
  {
    org: 'Tailwind Labs',
    repo: 'company-website',
    meta: 'Deployed 1d ago',
    badge: 'Preview',
    status: 'OK',
  },
  {
    org: 'Protocol',
    repo: 'relay-service',
    meta: 'Deployed 1d ago',
    badge: 'Production',
    status: 'OK',
  },
  {
    org: 'Planetaria',
    repo: 'android-app',
    meta: 'Deployed 5d ago',
    badge: 'Preview',
    status: 'OK',
  },
  {
    org: 'Protocol',
    repo: 'api.protocol.chat',
    meta: 'Failed to deploy 6d ago',
    badge: 'Preview',
    status: 'CRIT',
  },
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
    src={placeholderAvatar(name, 96)}
    className="size-8 shrink-0 rounded-full bg-gray-200"
  />
);

export const Sidebar_: Story = {
  name: 'Sidebar',
  render: () => (
    <Shell
      topbar={
        <Topbar
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
                src={placeholderAvatar('cosmos-home-demo', 64)}
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
        <PageContainer width="full">
          {/* py-3 + text-base: level with the Deployments card header. */}
          <div className="flex items-center justify-between py-3">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              Activity feed
            </h3>
            <a href="#" className="text-brand-600 dark:text-brand-400 text-sm font-semibold">
              View all
            </a>
          </div>
          <div className="mt-4">
            <StackedList>
              {FEED.map((f) => (
                <StackedList.Item
                  key={f.sha}
                  avatar={<Avatar name={f.user} />}
                  title={f.user}
                  subtitle={`Pushed to ${f.repo} (${f.sha})`}
                  meta={<span className="text-xs text-[var(--color-text-muted)]">{f.when}</span>}
                />
              ))}
            </StackedList>
          </div>
        </PageContainer>
      }
      // The feed column only fits from xl; below that the list takes the width.
      secondaryWidthClassName="hidden w-96 xl:block"
    >
      {/* Page padding keeps the card off the sidebar and the top bar. */}
      <div className="p-6">
        <Card padding="none">
          <Card.Header>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Deployments
            </h2>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              Sort by
            </button>
          </Card.Header>
          <ul role="list" className="divide-y divide-[var(--color-border)]">
            {DEPLOYMENTS.map((d) => (
              <li key={d.org + d.repo} className="flex items-center gap-x-4 px-4 py-4">
                <HealthDot status={d.status} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {d.org} <span className="text-[var(--color-text-muted)]">/</span> {d.repo}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                    Deploys from GitHub · {d.meta}
                  </p>
                </div>
                <Badge intent={d.badge === 'Production' ? 'success' : 'neutral'}>{d.badge}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Shell>
  ),
};

/** The Topbar hamburger collapses the sidebar and expands it again: Shell wires it. */
export const HamburgerTogglesTheSidebar: Story = {
  ...Sidebar_,
  name: undefined,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => expectHamburgerTogglesSidebar(canvas),
};
