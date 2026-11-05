import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
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
import {
  bothDirections,
  directionBox,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  mobileViewport,
} from '../storybook-helpers';
import { InEachDensity, expectDensitySteps } from '../storybook-density';
import {
  SlowFolds,
  clipOf,
  expectFoldClosed,
  expectFoldOpen,
  finishAnimations,
  foldOf,
  closedRotation,
  rotationOf,
} from '../storybook-folds';
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

/**
 * A check's output and a group unfold and fold back in 200 ms: the height runs from 0 to its size
 * while the content fades in and slides 4 px, and the chevron turns with it. A closed one is out of
 * the tab order and of the accessibility tree from the first frame.
 */
export const Folds: Story = {
  parameters: { settleMotion: false },
  args: { sort: 'severity' },
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
              <bdi>1,820 ms</bdi>
              <LatencyTrend />
            </span>
          </DescriptionList.Item>
        </DescriptionList>
      </Card.Body>
    </Card>
  ),
};

/** At 375px the rows stack, a long message wraps and nothing widens the page. */
const mobile: Story = {
  globals: mobileViewport,
  args: { groups: HEALTH_GROUPS.slice(0, 2), sort: 'severity' },
};

export const MobileChecks: Story = {
  ...mobile,
  tags: ['!dev', '!autodocs'],
  play: () => expectNoHorizontalOverflow(),
};

const mobileGrid: Story = {
  globals: mobileViewport,
  args: { variant: 'grid', groups: HEALTH_GROUPS.slice(0, 2), sort: 'severity' },
};

export const MobileGridChecks: Story = {
  ...mobileGrid,
  tags: ['!dev', '!autodocs'],
  play: () => expectNoHorizontalOverflow(),
};

const mobileLongMessage: Story = {
  ...LongMessage,
  globals: mobileViewport,
};

export const MobileLongMessageChecks: Story = {
  ...mobileLongMessage,
  tags: ['!dev', '!autodocs'],
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
      await expect(canvas.getByText(name, { selector: 'span > bdi' })).toBeVisible();
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
    // Closed again, the block is folded, not unmounted: out of the page's reach and not shown.
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.getByText(/oldest=94s/)).not.toBeVisible();
  },
};

/**
 * A group's panel and a check's output are folds: closed, they are inert and out of the
 * accessibility tree at once, while the height is still moving, with their content mounted; open,
 * they are reachable at once and unclipped once at rest. Slowed to 2 s to read the middle.
 */
export const FoldsAreInertAtOnceAndKeepTheirContent: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: (args) => (
    <SlowFolds>
      <HealthCheckList {...args} />
    </SlowFolds>
  ),
  play: async ({ canvas }) => {
    // A group: open and at rest to begin with.
    const header = canvas.getByRole('button', { name: /^External APIs/ });
    const panel = foldOf(header);
    await expectFoldOpen(panel);
    await expect(canvas.getByRole('button', { name: 'Job queue' })).toBeVisible();

    // Closing: inert and hidden at once, the height still moving, the rows still mounted.
    await userEvent.click(header);
    await expect(header).toHaveAttribute('aria-expanded', 'false');
    expectFoldClosed(panel);
    await expect(panel.getBoundingClientRect().height).toBeGreaterThan(0);
    await expect(panel.getAnimations().length).toBeGreaterThan(0);
    await expect(getComputedStyle(clipOf(panel)).overflow).toBe('hidden');
    await expect(canvas.getByText('Alertmanager')).toBeInTheDocument();
    await finishAnimations(panel);
    await expect(panel.getBoundingClientRect().height).toBe(0);
    await expect(canvas.getByText('Alertmanager')).not.toBeVisible();

    // Opening: reachable at once, clipping while it moves, then at rest.
    await userEvent.click(header);
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    await expect(panel.inert).toBe(false);
    await expect(getComputedStyle(clipOf(panel)).overflow).toBe('hidden');
    await finishAnimations(panel);
    await expectFoldOpen(panel);
    await expect(panel.getBoundingClientRect().height).toBeGreaterThan(0);

    // An output: not mounted before it is first opened, then mounted for good.
    const toggle = canvas.getByRole('button', { name: 'Job queue' });
    const output = foldOf(toggle);
    expectFoldClosed(output);
    await expect(canvas.queryByText(/oldest=94s/)).toBeNull();
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(output.inert).toBe(false);
    await expect(canvas.getByText(/oldest=94s/)).toBeInTheDocument();
    await finishAnimations(output);
    await expectFoldOpen(output);
    await userEvent.click(toggle);
    expectFoldClosed(output);
    await expect(canvas.getByText(/oldest=94s/)).toBeInTheDocument();
    await finishAnimations(output);
    await expect(output.getBoundingClientRect().height).toBe(0);
    await expect(canvas.getByText(/oldest=94s/)).not.toBeVisible();
  },
};

/** The chevron turns a quarter as the block opens: the same icon in both states, not a swap. */
export const ChevronTurnsWithTheBlock: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const group = canvas.getByRole('button', { name: /^External APIs/ });
    const check = canvas.getByRole('button', { name: 'Job queue' });
    const icon = group.querySelector('svg')!;
    await expect(rotationOf(icon)).toBe('90deg');
    await expect(rotationOf(check.querySelector('svg')!)).toBe(
      closedRotation(check.querySelector('svg')!)
    );
    await userEvent.click(group);
    await userEvent.click(check);
    await expect(group.querySelector('svg')).toBe(icon);
    await expect(rotationOf(icon)).toBe(closedRotation(icon));
    await expect(rotationOf(check.querySelector('svg')!)).toBe('90deg');
  },
};

/** Closed, an output takes no room: a row and a card are as tall as the same check with none. */
export const ClosedOutputTakesNoRoom: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [withOutput, without] = [
      EVERY_STATUS.find((c) => c.id === 'crit')!,
      { ...EVERY_STATUS.find((c) => c.id === 'crit')!, id: 'plain', output: undefined },
    ];
    return (
      <div className="max-w-md space-y-4">
        {(['list', 'grid'] as const).map((variant) => (
          <div key={variant} data-variant={variant} className="space-y-4">
            <HealthCheckList variant={variant} checks={[withOutput]} now={HEALTH_NOW} />
            <HealthCheckList variant={variant} checks={[without]} now={HEALTH_NOW} />
          </div>
        ))}
      </div>
    );
  },
  play: ({ canvasElement }) => {
    for (const variant of ['list', 'grid']) {
      const box = canvasElement.querySelector(`[data-variant="${variant}"]`)!;
      const [withOutput, without] = [...box.querySelectorAll('li')];
      expect(withOutput!.getBoundingClientRect().height, variant).toBe(
        without!.getBoundingClientRect().height
      );
    }
  },
};

/** With the Animations setting on "Reduced", a block opens and closes at once: nothing animates. */
export const ReducedMotionFoldsAtOnce: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  globals: { motion: 'reduced' },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('button', { name: /^External APIs/ });
    const panel = foldOf(group);
    await expect(getComputedStyle(panel).transitionDuration).toBe('0s');
    await userEvent.click(group);
    expectFoldClosed(panel);
    await expect(panel.getAnimations({ subtree: true })).toHaveLength(0);
    await expect(panel.getBoundingClientRect().height).toBe(0);
    await userEvent.click(group);
    await expect(panel.getAnimations({ subtree: true })).toHaveLength(0);
    await expect(getComputedStyle(clipOf(panel)).overflow).toBe('visible');
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

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * The rows and the group headers follow the page: the status first, at the start, and the chevron
 * of a closed group turns around. The target, the message and the latency keep their order.
 */
export const RowsAndGroupsFollowTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultCollapsedGroups: ['db'] },
  render: (args) => bothDirections(() => <HealthCheckList {...args} />),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const canvas = within(box);
      const closed = canvas
        .getAllByRole('button', { expanded: false })
        .find((button) => button.textContent?.includes('Database'))!;
      expect(rotationOf(closed.querySelector('svg')!), `${dir}: closed group`).toBe(
        dir === 'rtl' ? '180deg' : 'none'
      );
      const open = canvas
        .getAllByRole('button', { expanded: true })
        .find((button) => button.textContent?.includes('Queue'))!;
      expect(rotationOf(open.querySelector('svg')!), `${dir}: open group`).toBe('90deg');
      expectReadsLeftToRight(canvas.getByText('312 jobs waiting (limit 200)'));
      expectReadsLeftToRight(canvas.getByText('redis://queue:6379/0'));
    }
    expectMirrored(canvasElement, (box) => within(box).getByText('Job queue'));
    expectMirrored(canvasElement, (box) => within(box).getByText('Queue'));
  },
};

// The width each message of EVERY_STATUS is drawn at.
const messageWidths = (canvasElement: HTMLElement) =>
  EVERY_STATUS.filter((check) => check.message).map(
    (check) =>
      within(canvasElement).getByText(check.message!).parentElement!.getBoundingClientRect().width
  );

/**
 * In a card about as wide as a tablet, the columns follow the list's own width, not the screen's:
 * the message keeps room to be read instead of one character per line.
 */
export const MessageKeepsRoomInACard: Story = {
  tags: ['!dev', '!autodocs'],
  args: { groups: undefined, checks: EVERY_STATUS },
  render: (args) => (
    <div style={{ width: 700 }}>
      <HealthCheckList {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const width of messageWidths(canvasElement)) {
      await expect(width).toBeGreaterThanOrEqual(192);
    }
  },
};

/** With room, a row stays one line of columns: the message beside the name. */
export const WideListKeepsItsColumns: Story = {
  tags: ['!dev', '!autodocs'],
  args: { groups: undefined, checks: EVERY_STATUS },
  render: (args) => (
    <div style={{ width: 1100 }}>
      <HealthCheckList {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const name = canvas.getByText('Job queue').getBoundingClientRect();
    const message = canvas.getByText('312 jobs waiting (limit 200)').getBoundingClientRect();
    await expect(Math.abs(message.top - name.top)).toBeLessThan(4);
  },
};
