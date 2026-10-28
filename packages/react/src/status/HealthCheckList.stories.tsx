import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent } from 'storybook/test';
import { Card } from '../ui/Card';
import { DescriptionList } from '../data/DescriptionList';
import {
  DEPENDENCY_TREE,
  EVERY_STATUS,
  HEALTH_GROUPS,
  HEALTH_NOW,
  LONG_MESSAGE,
  MANY_GROUPS,
} from '../storybook-health';
import { expectNoHorizontalOverflow, mobileViewport } from '../storybook-helpers';
import { InEachDensity, expectDensitySteps } from '../storybook-density';
import { HealthCheckList } from './HealthCheckList';
import { StatusBadge } from './StatusBadge';

const meta = {
  title: 'Monitoring/Health Check List',
  component: HealthCheckList,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { groups: HEALTH_GROUPS, now: HEALTH_NOW },
} satisfies Meta<typeof HealthCheckList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Four groups, in the order given. A row with an output has a toggle on its name. */
export const Default: Story = {};

/** One check of each status, outside any group. The status is a word, not only a colour. */
export const EveryStatus: Story = { args: { groups: undefined, checks: EVERY_STATUS } };

/** Thirty-two checks in four groups, a few failing. */
export const ManyChecks: Story = { args: { groups: MANY_GROUPS } };

/** A message that wraps, with an unbreakable URL in it: the row grows, nothing is cut. */
export const LongMessage: Story = {
  args: {
    groups: undefined,
    checks: [
      {
        id: 'tls',
        name: 'Payment gateway certificate chain',
        status: 'CRIT',
        target: 'https://pay.example.test/health',
        message: LONG_MESSAGE,
        latency: 5000,
        checkedAt: HEALTH_NOW - 30_000,
      },
      { id: 'ok', name: 'Primary DB', status: 'OK', message: 'Reachable', latency: 3 },
    ],
  },
};

/** `sort="severity"`: the groups with the worst check first, and in each the failing checks. */
export const SeveritySort: Story = { args: { sort: 'severity' } };

/** Groups collapse, and the OK ones start closed: the failing ones are what is left to read. */
export const GroupsCollapsed: Story = {
  args: { sort: 'severity', defaultCollapsedGroups: ['db', 'storage'] },
};

/** One small card per check, for a wall screen. The edge of each card carries its status. */
export const Grid: Story = { args: { variant: 'grid', sort: 'severity' } };

export const GridEveryStatus: Story = {
  args: { variant: 'grid', groups: undefined, checks: EVERY_STATUS },
};

/**
 * A dependency tree, read through nested groups: the API needs a database and an identity
 * provider, the database needs its storage. Each header shows the worst status under it, so a
 * failing leaf shows on every level above.
 */
export const DependencyTree: Story = {
  args: { groups: DEPENDENCY_TREE },
};

/** The same tree, worst branch first. */
export const DependencyTreeBySeverity: Story = {
  args: { groups: DEPENDENCY_TREE, sort: 'severity' },
};

// A plain SVG line, as the stories of KpiCard draw: react stays chart-free. In an app, give the
// card a `Sparkline` from @sckyzo/cosmos-charts.
const LatencyTrend = () => {
  const points = [38, 41, 40, 44, 52, 61, 58, 73, 69, 84];
  const max = Math.max(...points);
  const path = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${36 - (p / max) * 32}`)
    .join(' ');
  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      role="img"
      aria-label="Latency, last 10 checks"
      className="text-brand-600 dark:text-brand-400 block h-10 w-28"
    >
      <polyline
        points={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

/** One check on its own, as a card: no component of its own, a `Card` with a `DescriptionList`. */
export const SingleCheckCard: Story = {
  render: () => (
    <Card className="max-w-md">
      <Card.Header>
        <span className="font-semibold text-[var(--color-text-primary)]">Prometheus API</span>
        <StatusBadge status="WARN" label="Warning" />
      </Card.Header>
      <Card.Body>
        <DescriptionList compact>
          <DescriptionList.Item label="Endpoint" mono>
            GET http://prometheus:9090/-/ready
          </DescriptionList.Item>
          <DescriptionList.Item label="Expected status">200</DescriptionList.Item>
          <DescriptionList.Item label="Interval">30 s</DescriptionList.Item>
          <DescriptionList.Item label="Last result">p95 1.8 s, above 1 s</DescriptionList.Item>
          <DescriptionList.Item label="Latency">
            <span className="flex items-center gap-3">
              1,820 ms
              <LatencyTrend />
            </span>
          </DescriptionList.Item>
        </DescriptionList>
      </Card.Body>
    </Card>
  ),
};

/** At 375px the rows stack, a long message wraps and nothing widens the page. */
export const Mobile: Story = {
  globals: mobileViewport,
  args: { groups: HEALTH_GROUPS.slice(0, 2), sort: 'severity' },
  play: () => expectNoHorizontalOverflow(),
};

export const MobileGrid: Story = {
  globals: mobileViewport,
  args: { variant: 'grid', groups: HEALTH_GROUPS.slice(0, 2), sort: 'severity' },
  play: () => expectNoHorizontalOverflow(),
};

export const MobileLongMessage: Story = {
  ...LongMessage,
  globals: mobileViewport,
  play: () => expectNoHorizontalOverflow(),
};

// ── Tests ────────────────────────────────────────────────────────────────────

const rowNames = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('li')).map(
    (row) => row.querySelector('.font-medium')?.textContent
  );

/** Every status is spelled out in a badge. */
export const ConveysStatusAsText: Story = {
  ...EveryStatus,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    for (const name of ['OK', 'Info', 'Unknown', 'Critical', 'Warning']) {
      await expect(canvas.getByText(name, { selector: 'span' })).toBeVisible();
    }
  },
};

/** `sort="severity"` orders the rows: critical, warning, unknown, info, OK. */
export const SeveritySortOrdersTheRows: Story = {
  ...EveryStatus,
  tags: ['!dev', '!autodocs'],
  args: { ...EveryStatus.args, sort: 'severity' },
  play: async ({ canvasElement }) => {
    await expect(rowNames(canvasElement)).toEqual([
      'Payment gateway',
      'Job queue',
      'Search index',
      'Certificate renewal',
      'Primary DB',
    ]);
  },
};

/** Groups are sorted too, the one holding the worst check first. */
export const SeveritySortOrdersTheGroups: Story = {
  tags: ['!dev', '!autodocs'],
  args: { sort: 'severity' },
  play: async ({ canvas }) => {
    const headers = canvas.getAllByRole('button', { expanded: true }).map((b) => b.textContent);
    await expect(headers[0]).toMatch(/^Queue/);
    await expect(headers[1]).toMatch(/^External APIs/);
    await expect(headers.at(-1)).toMatch(/^Cache and storage/);
  },
};

/** A group header shows the worst status and the counts, and collapses by keyboard. */
export const GroupHeaderShowsWorstAndCollapses: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const header = canvas.getByRole('button', { name: /^External APIs/ });
    await expect(header).toHaveTextContent('Warning');
    await expect(header).toHaveTextContent('1 Warning · 2 OK');
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByText('Alertmanager')).toBeVisible();

    header.focus();
    await userEvent.keyboard('{Enter}');
    await expect(header).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.getByText('Alertmanager')).not.toBeVisible();

    await userEvent.keyboard(' ');
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByText('Alertmanager')).toBeVisible();
  },
};

/** A nested group rolls the worst status of its leaves up to every header above. */
export const NestedHeadersShowTheWorstBelow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { groups: DEPENDENCY_TREE },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /^API/ })).toHaveTextContent('Critical');
    await expect(canvas.getByRole('button', { name: /^Database/ })).toHaveTextContent('Warning');
    await expect(canvas.getByRole('button', { name: /^Block storage/ })).toHaveTextContent(
      'Warning'
    );
    await expect(canvas.getByRole('button', { name: /^Cache/ })).toHaveTextContent('OK');
  },
};

/** A row with an output opens it in a code block, and closes it again. */
export const OutputToggles: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole('button', { name: 'Job queue' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByText(/oldest=94s/)).toBeNull();
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByText(/oldest=94s/)).toBeVisible();
    await userEvent.click(toggle);
    await expect(canvas.queryByText(/oldest=94s/)).toBeNull();
  },
};

/** The collapsed groups are the host's to own. */
export const CollapsedGroupsControlled: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => {
    const [collapsed, setCollapsed] = useState<string[]>(['db']);
    return (
      <>
        <p data-testid="collapsed">{collapsed.join(',')}</p>
        <HealthCheckList
          {...args}
          collapsedGroups={collapsed}
          onCollapsedGroupsChange={setCollapsed}
        />
      </>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /^Database/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await userEvent.click(canvas.getByRole('button', { name: /^Queue/ }));
    await expect(canvas.getByTestId('collapsed')).toHaveTextContent('db,queue');
  },
};

/** A check row and a group header follow the page's `data-density`; the header is a control. */
export const RowsFollowPageDensity: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <InEachDensity>
      <HealthCheckList groups={HEALTH_GROUPS} now={HEALTH_NOW} />
    </InEachDensity>
  ),
  play: async ({ canvas }) => {
    await expectDensitySteps(canvas, (scope) => scope.getByText('Job queue').closest('li')!);
    await expectDensitySteps(canvas, (scope) => scope.getByRole('button', { name: /Queue/ }), {
      control: true,
    });
  },
};
