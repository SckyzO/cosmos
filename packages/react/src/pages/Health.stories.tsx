import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, Bell, GitBranch, HeartPulse, Home, Server, Settings } from 'lucide-react';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { PageContainer } from '../layout/PageContainer';
import { Shell } from '../layout/Shell';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { flattenChecks } from '../status/health';
import { HealthCheckList } from '../status/HealthCheckList';
import { HealthMatrix } from '../status/HealthMatrix';
import { HealthSummary } from '../status/HealthSummary';
import { placeholderAvatar } from '../storybook-avatars';
import { HEALTH_GROUPS, HEALTH_NOW, MATRIX_COLUMNS, MATRIX_ROWS } from '../storybook-health';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { PageHeader } from '../templates/PageHeader';

// A system health page: the roll-up on top, the checks that explain it, then the services
// across the nodes. Composed from the health components of the Monitoring group.

const meta = {
  title: 'Pages/Examples/Health',
  parameters: portalDocsParams.full(),
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const HealthContent = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshMs, setAutoRefreshMs] = useState(0);
  return (
    <PageContainer width="full" className="space-y-6">
      <PageHeader
        as="h1"
        title="System health"
        description="Checks run every 30 seconds, from the monitoring node."
      />
      <HealthSummary
        checks={flattenChecks(HEALTH_GROUPS)}
        now={HEALTH_NOW}
        refresh={{
          refreshing,
          autoRefreshMs,
          onIntervalChange: setAutoRefreshMs,
          onRefresh: () => {
            setRefreshing(true);
            setTimeout(() => setRefreshing(false), 600);
          },
        }}
      />
      <section aria-labelledby="health-checks" className="space-y-3">
        <div className="flex items-center">
          <h2
            id="health-checks"
            className="m-0 text-base font-semibold text-[var(--color-text-primary)]"
          >
            Checks
          </h2>
          <span className="ml-auto text-sm text-[var(--color-text-secondary)]">
            Sorted by severity
          </span>
        </div>
        <HealthCheckList
          groups={HEALTH_GROUPS}
          sort="severity"
          defaultCollapsedGroups={['db', 'storage']}
          ariaLabel="Checks"
          now={HEALTH_NOW}
        />
      </section>
      <HealthMatrix
        columns={MATRIX_COLUMNS}
        rows={MATRIX_ROWS}
        title="Services by node"
        ariaLabel="Services by node"
        now={HEALTH_NOW}
      />
    </PageContainer>
  );
};

const HealthPage = () => (
  <Shell
    topbar={
      <Topbar
        endActions={
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
              src={placeholderAvatar('cosmos-health', 64)}
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
          <Sidebar.Item icon={HeartPulse} label="Health" active />
          <Sidebar.Item icon={Activity} label="Activity" />
          <Sidebar.Item icon={GitBranch} label="Deployments" />
          <Sidebar.Item icon={Server} label="Servers" />
          <Sidebar.Item icon={Settings} label="Settings" />
        </Sidebar.Section>
      </Sidebar>
    }
  >
    <HealthContent />
  </Shell>
);

export const Default: Story = {
  render: () => <HealthPage />,
};

/** At 375px the page stacks, the matrix scrolls in its own box and the page does not. */
export const Mobile: Story = {
  ...Default,
  globals: mobileViewport,
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(canvas.getByRole('grid', { name: 'Services by node' })).toBeVisible();
  },
};
