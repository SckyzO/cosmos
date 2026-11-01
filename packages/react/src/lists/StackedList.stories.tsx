import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, Archive, MessageCircle, MoreVertical, Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { placeholderAvatar } from '../storybook-avatars';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectFocusRing,
  expectMirrored,
  expectNoHorizontalOverflow,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';
import { AvatarGroup } from '../ui/AvatarGroup';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { StackedList } from './StackedList';

const meta = {
  title: 'Lists/Stacked List',
  component: StackedList,
  subcomponents: { 'StackedList.Item': StackedList.Item, 'StackedList.Header': StackedList.Header },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof StackedList>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Sample data — neutral, monitoring-flavored, no TUI brand names ───────────
type Service = {
  name: string;
  email: string;
  role: string;
  lastSeen?: string;
  online?: boolean;
  avatar: string;
};

const SERVICES: Service[] = [
  {
    name: 'Aiden Park',
    email: 'aiden.park@example.com',
    role: 'SRE Lead',
    lastSeen: '3h ago',
    avatar: placeholderAvatar('Aiden Park', 96),
  },
  {
    name: 'Mei Tanaka',
    email: 'mei.tanaka@example.com',
    role: 'Platform Engineer',
    lastSeen: '12m ago',
    avatar: placeholderAvatar('Mei Tanaka', 96),
  },
  {
    name: 'Olivier Dubois',
    email: 'olivier.dubois@example.com',
    role: 'Observability',
    online: true,
    avatar: placeholderAvatar('Olivier Dubois', 96),
  },
  {
    name: 'Priya Singh',
    email: 'priya.singh@example.com',
    role: 'Backend Engineer',
    lastSeen: '1d ago',
    avatar: placeholderAvatar('Priya Singh', 96),
  },
];

const Avatar = ({ src }: { src: string }) => (
  <img src={src} alt="" className="size-12 flex-none rounded-full bg-gray-50 dark:bg-gray-800" />
);

const MetaWithTimestamp = ({ role, lastSeen }: { role: string; lastSeen: string }) => (
  <>
    <p className="text-sm/6 text-gray-900 dark:text-white">{role}</p>
    <p className="mt-1 text-xs/5 text-gray-500 dark:text-gray-400">
      Last seen <time>{lastSeen}</time>
    </p>
  </>
);

const MetaWithStatus = ({ role }: { role: string }) => (
  <>
    <p className="text-sm/6 text-gray-900 dark:text-white">{role}</p>
    <div className="mt-1 flex items-center gap-x-1.5">
      <div className="flex-none rounded-full bg-emerald-500/20 p-1">
        <div className="size-1.5 rounded-full bg-emerald-500" />
      </div>
      <p className="text-xs/5 text-gray-500 dark:text-gray-400">Online</p>
    </div>
  </>
);

// ── Stories ──────────────────────────────────────────────────────────────────

export const Simple: Story = {
  render: () => (
    <StackedList>
      {SERVICES.map((s) => (
        <StackedList.Item
          key={s.email}
          avatar={<Avatar src={s.avatar} />}
          title={s.name}
          subtitle={s.email}
          meta={
            s.online ? (
              <MetaWithStatus role={s.role} />
            ) : (
              <MetaWithTimestamp role={s.role} lastSeen={s.lastSeen ?? ''} />
            )
          }
        />
      ))}
    </StackedList>
  ),
};

export const WithLinks: Story = {
  render: () => (
    <StackedList>
      {SERVICES.map((s) => (
        <StackedList.Item
          key={s.email}
          href={`/users/${encodeURIComponent(s.email)}`}
          chevron
          avatar={<Avatar src={s.avatar} />}
          title={s.name}
          subtitle={s.email}
          meta={
            s.online ? (
              <MetaWithStatus role={s.role} />
            ) : (
              <MetaWithTimestamp role={s.role} lastSeen={s.lastSeen ?? ''} />
            )
          }
        />
      ))}
    </StackedList>
  ),
};

export const WithActionsMenu: Story = {
  render: () => (
    <StackedList>
      {SERVICES.map((s) => (
        <StackedList.Item
          key={s.email}
          avatar={<Avatar src={s.avatar} />}
          title={s.name}
          subtitle={s.email}
          meta={
            s.online ? (
              <MetaWithStatus role={s.role} />
            ) : (
              <MetaWithTimestamp role={s.role} lastSeen={s.lastSeen ?? ''} />
            )
          }
          trailing={
            <button
              type="button"
              aria-label={`Actions for ${s.name}`}
              className="flex size-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200"
            >
              <MoreVertical className="size-5" aria-hidden />
            </button>
          }
        />
      ))}
    </StackedList>
  ),
};

export const NoSubtitle: Story = {
  render: () => (
    <StackedList>
      {SERVICES.map((s) => (
        <StackedList.Item key={s.email} avatar={<Avatar src={s.avatar} />} title={s.name} />
      ))}
    </StackedList>
  ),
};

export const NoAvatar: Story = {
  render: () => (
    <StackedList>
      {SERVICES.map((s) => (
        <StackedList.Item
          key={s.email}
          title={s.name}
          subtitle={s.email}
          meta={
            s.online ? (
              <MetaWithStatus role={s.role} />
            ) : (
              <MetaWithTimestamp role={s.role} lastSeen={s.lastSeen ?? ''} />
            )
          }
        />
      ))}
    </StackedList>
  ),
};

export const WithLeadingIcon: Story = {
  render: () => (
    <StackedList>
      {[
        { name: 'api-prod-01', meta: 'us-east-1 · 12 vCPU' },
        { name: 'pg-primary', meta: 'eu-west-3 · 64 GB RAM' },
        { name: 'edge-cdn', meta: 'global · 152 PoPs' },
      ].map((s) => (
        <StackedList.Item
          key={s.name}
          avatar={
            <span className="bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 flex size-12 items-center justify-center rounded-full">
              <Activity className="size-5" aria-hidden />
            </span>
          }
          title={s.name}
          subtitle={s.meta}
        />
      ))}
    </StackedList>
  ),
};

// ── Content rows: badge and details (issues, projects) ───────────────────────

type Issue = {
  title: string;
  author: string;
  ago: string;
  comments: number;
  commenters: string[];
};

const ISSUES: Issue[] = [
  {
    title: 'Prometheus scrape interval drifts under heavy load on multi-AZ pools',
    author: 'Aiden Park',
    ago: '2d ago',
    comments: 24,
    commenters: ['Aiden Park', 'Mei Tanaka', 'Olivier Dubois', 'Priya Singh', 'Marcus Bell'],
  },
  {
    title: 'Grafana provisioning fails with templated datasources after upgrade',
    author: 'Mei Tanaka',
    ago: '5h ago',
    comments: 8,
    commenters: ['Mei Tanaka', 'Aiden Park', 'Olivier Dubois'],
  },
  {
    title: 'Add OTLP receiver support to the OpenTelemetry collector preset',
    author: 'Olivier Dubois',
    ago: '1w ago',
    comments: 3,
    commenters: ['Olivier Dubois', 'Mei Tanaka'],
  },
];

type Project = {
  name: string;
  status: 'Complete' | 'In progress' | 'Archived';
  due: string;
  createdBy: string;
};

const PROJECTS: Project[] = [
  { name: 'GraphQL API', status: 'Complete', due: 'March 17, 2026', createdBy: 'Aiden Park' },
  {
    name: 'New benefits plan',
    status: 'In progress',
    due: 'May 5, 2026',
    createdBy: 'Mei Tanaka',
  },
  {
    name: 'Onboarding emails',
    status: 'Archived',
    due: 'February 12, 2026',
    createdBy: 'Olivier Dubois',
  },
];

const STATUS_INTENT = {
  Complete: 'success' as const,
  'In progress': 'info' as const,
  Archived: 'neutral' as const,
};

// Hidden on phones, where it would squeeze the issue title into a narrow column.
const Commenters = ({ names }: { names: string[] }) => (
  <div className="hidden sm:block">
    <dt className="sr-only">Commenters</dt>
    <dd>
      <AvatarGroup
        aria-label="Commenters"
        size="xs"
        avatars={names.map((name) => ({ name, src: placeholderAvatar(name, 64) }))}
      />
    </dd>
  </div>
);

const CommentCount = ({ count }: { count: number }) => (
  <div className="flex w-16 gap-x-2.5">
    <dt>
      <span className="sr-only">Total comments</span>
      <MessageCircle className="size-6 text-gray-400 dark:text-gray-500" aria-hidden />
    </dt>
    <dd className="text-sm/6 text-gray-900 dark:text-white">{count}</dd>
  </div>
);

const ActionsMenuButton = ({ name }: { name: string }) => (
  <button
    type="button"
    aria-label={`Open options for ${name}`}
    className="flex size-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200"
  >
    <MoreVertical className="size-5" aria-hidden />
  </button>
);

export const IssuesWithAvatarGroup: Story = {
  render: () => (
    <StackedList>
      {ISSUES.map((i) => (
        <StackedList.Item
          key={i.title}
          title={i.title}
          href="#"
          details={[
            <a key="a" href="#" className="relative hover:underline">
              {i.author}
            </a>,
            <time key="t">{i.ago}</time>,
          ]}
          trailing={
            <dl className="flex items-center gap-x-6 sm:gap-x-8">
              <Commenters names={i.commenters} />
              <CommentCount count={i.comments} />
            </dl>
          }
        />
      ))}
    </StackedList>
  ),
};

export const ProjectsWithBadgeAndActions: Story = {
  render: () => (
    <StackedList>
      {PROJECTS.map((p) => (
        <StackedList.Item
          key={p.name}
          title={p.name}
          badge={<Badge intent={STATUS_INTENT[p.status]}>{p.status}</Badge>}
          details={[
            <span key="d">
              Due on <time>{p.due}</time>
            </span>,
            <span key="c">Created by {p.createdBy}</span>,
          ]}
          trailing={
            <>
              <Button variant="secondary" size="xs" className="max-sm:hidden">
                View project<span className="sr-only">, {p.name}</span>
              </Button>
              <ActionsMenuButton name={p.name} />
            </>
          }
        />
      ))}
    </StackedList>
  ),
};

export const ProjectsWithBadgeAndActionsChecks: Story = {
  ...ProjectsWithBadgeAndActions,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    // Each repeated button names its project for screen readers. `hidden`: the
    // button only shows from `sm` up, wider than the test viewport. A `max-sm:` variant hides it:
    // a plain `hidden` loses to the `inline-flex` of Button's own classes.
    for (const p of PROJECTS) {
      const name = new RegExp(`^View project\\s*, ${p.name}$`);
      await expect(canvas.getByRole('button', { name, hidden: true })).toBeInTheDocument();
    }
  },
};

// In a narrow row the badge goes under the title instead of wrapping inside itself.
export const BadgeKeepsOneLineInANarrowRow: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div style={{ width: 296 }}>
      <StackedList>
        {PROJECTS.map((p) => (
          <StackedList.Item
            key={p.name}
            title={p.name}
            badge={<Badge intent={STATUS_INTENT[p.status]}>{p.status}</Badge>}
            trailing={
              <>
                <Button variant="secondary" size="xs">
                  View project
                </Button>
                <ActionsMenuButton name={p.name} />
              </>
            }
          />
        ))}
      </StackedList>
    </div>
  ),
  play: async ({ canvas }) => {
    for (const p of PROJECTS) {
      // One line of the badge's text is under 28px tall.
      await expect(canvas.getByText(p.status).getBoundingClientRect().height).toBeLessThan(28);
    }
  },
};

export const TitleOnlyNoDetails: Story = {
  render: () => (
    <StackedList>
      {ISSUES.slice(0, 2).map((i) => (
        <StackedList.Item key={i.title} title={i.title} href="#" />
      ))}
    </StackedList>
  ),
};

// ── Narrow columns: group headings, timestamp and description ────────────────

const PEOPLE = SERVICES.map((s) => ({ name: s.name, email: s.email, av: s.avatar }));

const PEOPLE_GROUPED: Record<string, typeof PEOPLE> = {
  A: [
    PEOPLE[0]!,
    {
      name: 'Aubrey Pham',
      email: 'aubrey.pham@example.com',
      av: placeholderAvatar('Aubrey Pham', 96),
    },
  ],
  M: [
    PEOPLE[1]!,
    {
      name: 'Marcus Bell',
      email: 'marcus.bell@example.com',
      av: placeholderAvatar('Marcus Bell', 96),
    },
  ],
  O: [PEOPLE[2]!],
  P: [PEOPLE[3]!],
};

const NOTES = [
  {
    name: 'Aiden Park',
    ago: '1d ago',
    body: 'Investigated the prom-stack pod restart loop after the upgrade. Root cause was a stale config map referencing a removed metric exporter.',
    av: placeholderAvatar('Aiden Park', 96),
  },
  {
    name: 'Mei Tanaka',
    ago: '4h ago',
    body: 'Pushed the hotfix for the Grafana datasource provisioning. Need to backport to the LTS branch before Friday.',
    av: placeholderAvatar('Mei Tanaka', 96),
  },
  {
    name: 'Olivier Dubois',
    ago: 'just now',
    body: 'Drafted the runbook for the OTLP receiver promotion. Awaiting review from Aiden.',
    av: placeholderAvatar('Olivier Dubois', 96),
  },
];

export const Narrow: Story = {
  render: () => (
    <div className="max-w-md">
      <StackedList>
        {PEOPLE.map((p) => (
          <StackedList.Item
            key={p.email}
            avatar={<Avatar src={p.av} />}
            title={p.name}
            subtitle={p.email}
          />
        ))}
      </StackedList>
    </div>
  ),
};

export const StickyHeadings: Story = {
  // The list does not scroll: this wrapper does. Nothing in it takes focus, so the wrapper
  // does, as a named region, to be scrolled from the keyboard.
  render: () => (
    <div
      role="region"
      aria-label="People"
      tabIndex={0}
      className="focus-visible:focus-indicator max-h-96 max-w-md overflow-y-auto bg-white focus-visible:ring-inset dark:bg-gray-900"
    >
      <StackedList>
        {Object.entries(PEOPLE_GROUPED).map(([letter, group]) => (
          <Fragment key={letter}>
            <StackedList.Header sticky>{letter}</StackedList.Header>
            {group.map((p) => (
              <StackedList.Item
                key={p.email}
                className="px-3"
                avatar={<Avatar src={p.av} />}
                title={p.name}
                subtitle={p.email}
              />
            ))}
          </Fragment>
        ))}
      </StackedList>
    </div>
  ),
};

export const StickyHeadingsChecks: Story = {
  ...StickyHeadings,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    // One list whose children are all list items, headers included.
    const items = Array.from(canvas.getByRole('list').children);
    await expect(items.map((el) => el.tagName)).toEqual(items.map(() => 'LI'));
    // A pinned heading reads as a band over the rows scrolling under it: a shadow on its edge.
    const heading = canvas.getAllByText('A').find((el) => el.tagName === 'LI')!;
    await expect(getComputedStyle(heading).boxShadow).not.toBe('none');
  },
};

export const NarrowWithActions: Story = {
  render: () => (
    <div className="max-w-md">
      <StackedList>
        {PEOPLE.map((p) => (
          <StackedList.Item
            key={p.email}
            avatar={<Avatar src={p.av} />}
            title={p.name}
            subtitle={p.email}
            trailing={
              <Button variant="secondary" size="xs">
                View<span className="sr-only">, {p.name}</span>
              </Button>
            }
          />
        ))}
      </StackedList>
    </div>
  ),
};

export const NarrowWithActionsChecks: Story = {
  ...NarrowWithActions,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    // Each View button names its person for screen readers.
    for (const p of PEOPLE) {
      const name = new RegExp(`^View\\s*, ${p.name}$`);
      await expect(canvas.getByRole('button', { name })).toBeInTheDocument();
    }
  },
};

export const WithTruncatedDescription: Story = {
  render: () => (
    <div className="max-w-2xl">
      <StackedList>
        {NOTES.map((n) => (
          <StackedList.Item
            key={n.name + n.body}
            avatar={<Avatar src={n.av} />}
            title={n.name}
            timestamp={<time>{n.ago}</time>}
            description={n.body}
          />
        ))}
      </StackedList>
    </div>
  ),
};

// ── On a card: header slots and rank ─────────────────────────────────────────

export const InCard: Story = {
  render: () => (
    <StackedList card>
      {SERVICES.map((s) => (
        <StackedList.Item
          key={s.email}
          href={`/users/${encodeURIComponent(s.email)}`}
          chevron
          avatar={<Avatar src={s.avatar} />}
          title={s.name}
          subtitle={s.email}
          meta={<MetaWithTimestamp role={s.role} lastSeen={s.lastSeen ?? ''} />}
        />
      ))}
    </StackedList>
  ),
};

export const InCardNoLinks: Story = {
  render: () => (
    <StackedList card>
      {SERVICES.map((s) => (
        <StackedList.Item
          key={s.email}
          avatar={<Avatar src={s.avatar} />}
          title={s.name}
          subtitle={s.email}
          meta={<MetaWithTimestamp role={s.role} lastSeen={s.lastSeen ?? ''} />}
        />
      ))}
    </StackedList>
  ),
};

export const InCardWithHeader: Story = {
  render: () => (
    <StackedList
      card
      title="Team members"
      description="Who is on call this week."
      action={
        <Button variant="secondary" size="xs">
          Invite
        </Button>
      }
    >
      {SERVICES.map((s) => (
        <StackedList.Item
          key={s.email}
          avatar={<Avatar src={s.avatar} />}
          title={s.name}
          subtitle={s.email}
          meta={<MetaWithTimestamp role={s.role} lastSeen={s.lastSeen ?? ''} />}
        />
      ))}
    </StackedList>
  ),
};

const SLOW_ENDPOINTS = [
  { path: '/api/v1/query_range', p95: '1.8 s' },
  { path: '/api/v1/alerts', p95: '940 ms' },
  { path: '/api/v1/series', p95: '610 ms' },
  { path: '/api/v1/labels', p95: '420 ms' },
  { path: '/-/healthy', p95: '12 ms' },
];

/** A "top N" dashboard widget: ranked rows under a card header with an action. */
export const TopNWidget: Story = {
  render: () => (
    <div className="max-w-md">
      <StackedList
        card
        title="Slowest endpoints"
        description="p95 over the last hour"
        action={
          <a
            href="#"
            className="text-brand-600 dark:text-brand-400 focus-visible:focus-indicator rounded-sm text-sm/6 font-medium hover:underline"
          >
            View all
          </a>
        }
      >
        {SLOW_ENDPOINTS.map((e, i) => (
          <StackedList.Item
            key={e.path}
            rank={i + 1}
            title={<span className="font-mono text-xs">{e.path}</span>}
            className="py-3"
            trailing={<bdi className="text-sm/6 text-gray-900 dark:text-white">{e.p95}</bdi>}
          />
        ))}
      </StackedList>
    </div>
  ),
};

export const InCardInsideContainer: Story = {
  render: () => (
    <div className="bg-gray-100 p-8 dark:bg-gray-950">
      <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Team members</h2>
      <StackedList card>
        {SERVICES.map((s) => (
          <StackedList.Item
            key={s.email}
            href={`/users/${encodeURIComponent(s.email)}`}
            chevron
            avatar={<Avatar src={s.avatar} />}
            title={s.name}
            subtitle={s.email}
            meta={<MetaWithTimestamp role={s.role} lastSeen={s.lastSeen ?? ''} />}
          />
        ))}
      </StackedList>
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RootIsUlWithRoleList: Story = {
  tags: ['!dev'],
  render: () => (
    <StackedList data-testid="sl">
      <StackedList.Item title="One" />
    </StackedList>
  ),
  play: async ({ canvasElement }) => {
    const ul = canvasElement.querySelector('ul[data-testid="sl"]');
    await expect(ul).not.toBeNull();
    await expect(ul).toHaveAttribute('role', 'list');
    await expect(ul?.className ?? '').toMatch(/divide-y/);
  },
};

export const ItemRendersTitleAndSubtitle: Story = {
  tags: ['!dev'],
  render: () => (
    <StackedList>
      <StackedList.Item title="Aiden Park" subtitle="aiden@ex.com" />
    </StackedList>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Aiden Park')).toBeInTheDocument();
    await expect(canvas.getByText('aiden@ex.com')).toBeInTheDocument();
  },
};

export const HrefMakesRowLinkAndChevronShows: Story = {
  tags: ['!dev'],
  render: () => (
    <StackedList>
      <StackedList.Item href="/x" chevron title="Linked Row" data-testid="li" />
    </StackedList>
  ),
  play: async ({ canvas, canvasElement }) => {
    const link = canvas.getByRole('link', { name: /linked row/i });
    await expect(link).toHaveAttribute('href', '/x');
    const li = canvasElement.querySelector('[data-testid="li"]');
    await expect(li?.className ?? '').toMatch(/relative/);
    // chevron icon (ChevronRight from lucide) renders as svg with class size-5
    const svg = li?.querySelector('svg.size-5');
    await expect(svg).not.toBeNull();
  },
};

/** On a linked row the full-row overlay must leave the trailing actions clickable. */
export const TrailingStaysClickableOnLinkedRow: Story = {
  tags: ['!dev'],
  render: () => (
    <StackedList>
      <StackedList.Item
        href="/users/aiden.park"
        avatar={<Avatar src={SERVICES[0]!.avatar} />}
        title="Aiden Park"
        subtitle="aiden.park@example.com"
        trailing={
          <button
            type="button"
            aria-label="Actions for Aiden Park"
            className="flex size-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200"
          >
            <MoreVertical className="size-5" aria-hidden />
          </button>
        }
      />
    </StackedList>
  ),
  play: async ({ canvas, canvasElement }) => {
    const hitAt = (el: Element) => {
      const { left, top, width, height } = el.getBoundingClientRect();
      return canvasElement.ownerDocument.elementFromPoint(left + width / 2, top + height / 2);
    };
    const button = canvas.getByRole('button', { name: 'Actions for Aiden Park' });
    await expect(button.contains(hitAt(button))).toBe(true);
    // The rest of the row still goes to the link.
    const link = canvas.getByRole('link', { name: 'Aiden Park' });
    await expect(link.contains(hitAt(canvas.getByText('aiden.park@example.com')))).toBe(true);
  },
};

export const MetaIsHiddenOnMobileViewport: Story = {
  tags: ['!dev'],
  render: () => (
    <StackedList>
      <StackedList.Item title="X" meta={<p data-testid="meta">meta-content</p>} />
    </StackedList>
  ),
  play: async ({ canvasElement }) => {
    const meta = canvasElement.querySelector('[data-testid="meta"]');
    const wrapper = meta?.parentElement;
    // The wrapper has `hidden sm:flex` per TUI pattern
    await expect(wrapper?.className ?? '').toMatch(/hidden/);
    await expect(wrapper?.className ?? '').toMatch(/sm:flex/);
  },
};

// ── Interaction tests: content, narrow and card ──────────────────────────────

export const BadgeRendersInsideTitleRow: Story = {
  tags: ['!dev'],
  render: () => (
    <StackedList>
      <StackedList.Item title="My project" badge={<Badge intent="success">Complete</Badge>} />
    </StackedList>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('My project')).toBeInTheDocument();
    await expect(canvas.getByText('Complete')).toBeInTheDocument();
  },
};

/** A single detail gets no dot separator. */
export const SingleDetailHasNoDot: Story = {
  tags: ['!dev'],
  render: () => (
    <StackedList>
      <StackedList.Item
        title="Rotate the Grafana service account token"
        details={[<time key="t">just now</time>]}
        data-testid="li"
      />
    </StackedList>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('just now')).toBeVisible();
    const dots = canvas.getByTestId('li').querySelectorAll('svg[viewBox="0 0 2 2"]');
    await expect(dots).toHaveLength(0);
  },
};

export const DetailsRenderDotSeparatorBetweenItems: Story = {
  tags: ['!dev'],
  render: () => (
    <StackedList>
      <StackedList.Item
        title="t"
        details={[
          <span key="a">first</span>,
          <span key="b">second</span>,
          <span key="c">third</span>,
        ]}
        data-testid="li"
      />
    </StackedList>
  ),
  play: async ({ canvasElement }) => {
    const li = canvasElement.querySelector('[data-testid="li"]');
    // Three items + 2 separators between them
    const dots = li?.querySelectorAll('svg[viewBox="0 0 2 2"]') ?? [];
    await expect(dots.length).toBe(2);
  },
};

/**
 * At phone width the details keep one line each: the last one truncates
 * instead of every item breaking in the middle around the dots.
 */
export const DetailsStayOnOneLineWhenNarrow: Story = {
  tags: ['!dev'],
  render: () => (
    <div style={{ width: 320 }}>
      <StackedList>
        <StackedList.Item
          title={PROJECTS[2]!.name}
          details={[
            <span key="d">
              Due on <time>{PROJECTS[2]!.due}</time>
            </span>,
            <span key="c">Created by {PROJECTS[2]!.createdBy}</span>,
          ]}
          trailing={<ActionsMenuButton name={PROJECTS[2]!.name} />}
          data-testid="li"
        />
      </StackedList>
    </div>
  ),
  play: async ({ canvas }) => {
    const items = [
      canvas.getByText(PROJECTS[2]!.due).parentElement!,
      canvas.getByText(`Created by ${PROJECTS[2]!.createdBy}`),
    ];
    for (const item of items) {
      // text-xs/5: a line is 20px tall
      await expect(item.getBoundingClientRect().height).toBeLessThanOrEqual(20);
    }
    const li = canvas.getByTestId('li');
    await expect(li.scrollWidth).toBeLessThanOrEqual(li.clientWidth);
  },
};

/** `meta` stays the end column; only `details` is the dotted line under the title. */
export const MetaAndDetailsAreDistinct: Story = {
  tags: ['!dev'],
  render: () => (
    <StackedList>
      <StackedList.Item
        title="Both"
        meta={<p data-testid="meta">right column</p>}
        details={[<span key="a">under the title</span>]}
      />
    </StackedList>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('meta').parentElement?.className ?? '').toMatch(/hidden/);
    await expect(canvas.getByText('under the title').closest('div')?.className ?? '').toMatch(
      /mt-1/
    );
  },
};

export const RankRendersBeforeTheTitle: Story = {
  tags: ['!dev'],
  render: () => (
    <StackedList>
      <StackedList.Item rank={1} title="First" />
      <StackedList.Item rank={2} title="Second" />
    </StackedList>
  ),
  play: async ({ canvas }) => {
    const first = canvas.getByText('1');
    const title = canvas.getByText('First');
    // Before it along the line: the rank ends where the title starts, or earlier.
    const list = first.closest('ul')!;
    await expect(
      startOffset(first, list) + first.getBoundingClientRect().width
    ).toBeLessThanOrEqual(startOffset(title, list));
    await expect(canvas.getByText('2')).toBeVisible();
  },
};

export const DescriptionTriggersRichLayout: Story = {
  tags: ['!dev'],
  render: () => (
    <StackedList>
      <StackedList.Item
        title="Title"
        description="A long description that will be line-clamped at two lines so the row stays compact even with a paragraph of text."
        timestamp={<time>1h</time>}
        data-testid="li"
      />
    </StackedList>
  ),
  play: async ({ canvasElement }) => {
    const li = canvasElement.querySelector('[data-testid="li"]');
    await expect(li?.querySelector('.line-clamp-2')).not.toBeNull();
    await expect(li?.querySelector('time')).not.toBeNull();
  },
};

/** `trailing` still renders next to the two-row layout of `timestamp` and `description`. */
export const TrailingRendersWithDescription: Story = {
  tags: ['!dev'],
  render: () => (
    <div className="max-w-2xl">
      <StackedList>
        <StackedList.Item
          avatar={<Avatar src={NOTES[1]!.av} />}
          title={NOTES[1]!.name}
          timestamp={<time>{NOTES[1]!.ago}</time>}
          description={NOTES[1]!.body}
          trailing={
            <Button variant="secondary" size="xs">
              Reply
            </Button>
          }
        />
      </StackedList>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText(NOTES[1]!.body)).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Reply' })).toBeVisible();
  },
};

// Alpha channel of a computed CSS colour: `rgba(…, a)`, `oklab(… / a)` or opaque.
const alphaOf = (color: string) => {
  const slash = color.match(/\/\s*([\d.]+)(%?)\s*\)$/);
  if (slash) return Number(slash[1]) / (slash[2] ? 100 : 1);
  const rgba = color.match(/^rgba\(.*,\s*([\d.]+)\)$/);
  return rgba ? Number(rgba[1]) : 1;
};

/** A sticky header must be opaque in dark themes, or the rows scrolling under it show through. */
export const StickyHeaderIsOpaqueInDarkThemes: Story = {
  tags: ['!dev'],
  globals: { theme: 'dark' },
  render: () => (
    <StackedList>
      <StackedList.Header sticky>A</StackedList.Header>
      <StackedList.Item title="Aiden Park" subtitle="aiden.park@example.com" />
    </StackedList>
  ),
  play: async ({ canvas }) => {
    await expect(document.documentElement).toHaveClass('dark');
    const header = canvas.getByText('A');
    await expect(alphaOf(getComputedStyle(header).backgroundColor)).toBe(1);
  },
};

export const HeaderRendersWithBackgroundAndStickyClass: Story = {
  tags: ['!dev'],
  render: () => (
    <StackedList>
      <StackedList.Header sticky data-testid="h">
        A
      </StackedList.Header>
      <StackedList.Item title="One" />
    </StackedList>
  ),
  play: async ({ canvasElement }) => {
    const h = canvasElement.querySelector('[data-testid="h"]');
    await expect(h?.className ?? '').toMatch(/bg-gray-100/);
    await expect(h?.className ?? '').toMatch(/sticky/);
  },
};

export const CardIsASurfaceWithRingAndShadow: Story = {
  tags: ['!dev'],
  render: () => (
    <StackedList card className="card-under-test">
      <StackedList.Item title="x" />
    </StackedList>
  ),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('.card-under-test');
    await expect(card).not.toBeNull();
    const cls = card?.className ?? '';
    await expect(cls).toMatch(/ring-1/);
    await expect(cls).toMatch(/shadow-sm/);
    await expect(cls).toMatch(/rounded-md/);
  },
};

export const CardItemsReceiveHorizontalPadding: Story = {
  tags: ['!dev'],
  render: () => (
    <>
      <StackedList card>
        <StackedList.Item title="In card" data-testid="in-card" />
      </StackedList>
      <StackedList>
        <StackedList.Item title="Bare" data-testid="bare" />
      </StackedList>
    </>
  ),
  play: async ({ canvas }) => {
    const inCard = canvas.getByTestId('in-card').className;
    await expect(inCard).toMatch(/px-4/);
    await expect(inCard).toMatch(/sm:px-6/);
    await expect(canvas.getByTestId('bare').className).not.toMatch(/px-4/);
  },
};

export const CardListKeepsRoleListAndDivider: Story = {
  tags: ['!dev'],
  render: () => (
    <StackedList card data-testid="ul">
      <StackedList.Item title="One" />
      <StackedList.Item title="Two" />
    </StackedList>
  ),
  play: async ({ canvas }) => {
    const ul = canvas.getByTestId('ul');
    await expect(ul.tagName).toBe('UL');
    await expect(ul).toHaveAttribute('role', 'list');
    await expect(ul.className).toMatch(/divide-y/);
  },
};

/** The header slots show their title, description and action above the rows; none, no header. */
export const CardHeaderSlotsRender: Story = {
  tags: ['!dev'],
  render: () => (
    <>
      <StackedList
        card
        title="Slowest endpoints"
        description="p95 over the last hour"
        action={<button type="button">View all</button>}
        data-testid="with-header"
      >
        <StackedList.Item title="/api/v1/query_range" />
      </StackedList>
      <div data-testid="without">
        <StackedList card>
          <StackedList.Item title="/api/v1/alerts" />
        </StackedList>
      </div>
    </>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Slowest endpoints' })).toBeVisible();
    await expect(canvas.getByText('p95 over the last hour')).toBeVisible();
    const action = canvas.getByRole('button', { name: 'View all' });
    await expect(action).toBeVisible();
    // The header sits above the list, and the action at its end edge.
    const heading = canvas.getByRole('heading', { name: 'Slowest endpoints' });
    const list = canvas.getByTestId('with-header');
    await expect(heading.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      list.getBoundingClientRect().top
    );
    await expect(startOffset(action, list)).toBeGreaterThan(
      startOffset(heading, list) + heading.getBoundingClientRect().width
    );
    await expect(within(canvas.getByTestId('without')).queryByRole('heading')).toBeNull();
  },
};

// ── Rows that can be picked, starred or marked unread: a mail list ──────────

type Mail = {
  id: string;
  from: string;
  text: string;
  time: string;
  unread: boolean;
  starred: boolean;
};

const MAILS: Mail[] = [
  {
    id: 'm1',
    from: 'Ana Ruiz',
    time: '10:42',
    unread: true,
    starred: true,
    text: 'Review request for the cooling PR. Could you look at the fan curve change before Friday? I added the benchmark.',
  },
  {
    id: 'm2',
    from: 'Ops on-call',
    time: '09:15',
    unread: true,
    starred: false,
    text: 'Disk alert cleared on rack B4. Usage on b4-node-12 is back under 80% after the log rotation, no action needed.',
  },
  {
    id: 'm3',
    from: 'Li Wei',
    time: 'Yesterday',
    unread: false,
    starred: false,
    text: 'Maintenance window on Friday. The window opens at 22:00 UTC and covers racks A1 to A6, the B racks stay up.',
  },
  {
    id: 'm4',
    from: 'Sam Patel',
    time: 'Yesterday',
    unread: false,
    starred: false,
    text: 'Nightly backup finished. 312 GB written at 04:20. The retention settings still need a look before the window.',
  },
  {
    id: 'm5',
    from: 'Mei Tanaka',
    time: 'Mon',
    unread: false,
    starred: true,
    text: 'Capacity review notes. The forecast for Q1 holds if the new racks land before the end of January.',
  },
];

const MailAvatar = ({ name }: { name: string }) => (
  <img
    src={placeholderAvatar(name, 64)}
    alt=""
    className="size-8 flex-none rounded-full bg-gray-50 dark:bg-gray-800"
  />
);

// The host keeps every piece of state: which rows are picked, starred, unread, and which is open.
const InboxDemo = () => {
  const [mails, setMails] = useState(MAILS);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [open, setOpen] = useState<string>();
  const change = (id: string, patch: Partial<Mail>) =>
    setMails((all) => all.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const drop = (ids: Iterable<string>) => {
    const gone = new Set(ids);
    setMails((all) => all.filter((m) => !gone.has(m.id)));
    setPicked((p) => new Set([...p].filter((id) => !gone.has(id))));
  };
  const pick = (id: string, on: boolean) =>
    setPicked((p) => {
      const next = new Set(p);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const all = mails.length > 0 && picked.size === mails.length;

  return (
    <div className="max-w-3xl">
      <StackedList card>
        <StackedList.Header
          checked={all}
          indeterminate={picked.size > 0 && !all}
          onCheckedChange={(on) => setPicked(on ? new Set(mails.map((m) => m.id)) : new Set())}
          actions={
            picked.size > 0 && (
              <>
                <Button variant="secondary" size="xs" icon={Archive} onClick={() => drop(picked)}>
                  <span className="max-sm:sr-only">Archive</span>
                </Button>
                <Button
                  variant="secondary"
                  intent="danger"
                  size="xs"
                  icon={Trash2}
                  onClick={() => drop(picked)}
                >
                  <span className="max-sm:sr-only">Delete</span>
                </Button>
              </>
            )
          }
        >
          {picked.size > 0 ? `${picked.size} selected` : 'Inbox'}
        </StackedList.Header>
        {mails.map((m) => (
          <StackedList.Item
            key={m.id}
            avatar={<MailAvatar name={m.from} />}
            title={m.from}
            timestamp={m.time}
            description={m.text}
            unread={m.unread}
            selected={open === m.id}
            onClick={() => {
              setOpen(m.id);
              change(m.id, { unread: false });
            }}
            checked={picked.has(m.id)}
            onCheckedChange={(on) => pick(m.id, on)}
            starred={m.starred}
            onStarredChange={(starred) => change(m.id, { starred })}
            actions={[
              { label: 'Archive', icon: Archive, onSelect: () => drop([m.id]) },
              { label: 'Delete', icon: Trash2, intent: 'danger', onSelect: () => drop([m.id]) },
            ]}
          />
        ))}
      </StackedList>
    </div>
  );
};

const laptop = { viewport: { value: 'laptop', isRotated: false } } as const;

/**
 * A mail list: a bar with select-all and the count, then rows with a checkbox, an unread dot, a
 * star, and actions that show on hover or focus. The open row has a tint and a bar at its start.
 */
export const Inbox: Story = {
  globals: laptop,
  render: () => <InboxDemo />,
};

/** At phone width the row actions fold into one "More actions" menu and the star stays shown. */
export const InboxNarrow: Story = {
  ...Inbox,
  globals: mobileViewport,
};

/** `unread` has three states: `true` is bold with a dot, `false` the read look, left out as before. */
export const UnreadStates: Story = {
  render: () => (
    <div className="max-w-md">
      <StackedList card>
        <StackedList.Item
          title="Unread"
          description="Bold title, a dot in the start gutter and a stronger description."
          unread
        />
        <StackedList.Item
          title="Read"
          description="A lighter title and the usual description."
          unread={false}
        />
        <StackedList.Item
          title="Not tracked"
          description="Without unread, a row keeps the look it always had."
        />
      </StackedList>
    </div>
  ),
};

// ── Interaction tests: selection, read state, star and actions ───────────────

// What takes the focus or a click. A row must hold none of these inside another.
const CONTROLS =
  'a[href], button, input, select, textarea, [role="menuitem"], [tabindex]:not([tabindex="-1"])';

const expectNoNestedControls = (root: Element) => {
  for (const el of root.querySelectorAll(CONTROLS)) {
    const outer = el.parentElement?.closest(CONTROLS);
    expect(outer, `${el.tagName} ${el.textContent ?? ''} sits inside another control`).toBeNull();
  }
};

// The rows of the inbox, without its header bar.
const mailRows = (canvas: { getAllByRole: (role: string) => HTMLElement[] }) =>
  canvas.getAllByRole('listitem').slice(1);

const hitAt = (el: Element) => {
  const { left, top, width, height } = el.getBoundingClientRect();
  return el.ownerDocument.elementFromPoint(left + width / 2, top + height / 2);
};

/** Checkbox, title, star and actions are siblings: no row holds a control inside another. */
export const InboxHasNoNestedControls: Story = {
  ...Inbox,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const list = canvas.getByRole('list');
    // The bar's checkbox, then per row: checkbox, title, star and two actions.
    await expect(list.querySelectorAll(CONTROLS)).toHaveLength(1 + MAILS.length * 5);
    expectNoNestedControls(list);
  },
};

/** One tab stop per control, in the order they sit on the line: checkbox, title, actions, star. */
export const InboxTabOrder: Story = {
  ...Inbox,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = within(mailRows(canvas)[0]!);
    const order = [
      row.getByRole('checkbox', { name: 'Select Ana Ruiz' }),
      row.getByRole('button', { name: 'Unread: Ana Ruiz' }),
      row.getByRole('button', { name: 'Archive Ana Ruiz' }),
      row.getByRole('button', { name: 'Delete Ana Ruiz' }),
      row.getByRole('button', { name: 'Star Ana Ruiz' }),
      within(mailRows(canvas)[1]!).getByRole('checkbox', { name: 'Select Ops on-call' }),
    ];
    canvas.getByRole('checkbox', { name: 'Select all' }).focus();
    for (const control of order) {
      await userEvent.tab();
      await expect(control).toHaveFocus();
    }
  },
};

/** The bar's checkbox is checked, unchecked or mixed from the rows the host picked. */
export const InboxSelectAllIsTriState: Story = {
  ...Inbox,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const all = canvas.getByRole('checkbox', { name: 'Select all' });
    const rows = () => canvas.getAllByRole('checkbox', { name: /^Select (?!all)/ });
    await expect(all).not.toBeChecked();
    await expect(all).not.toBePartiallyChecked();
    await expect(canvas.getByText('Inbox')).toBeVisible();

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select Ana Ruiz' }));
    await expect(all).toBePartiallyChecked();
    await expect(canvas.getByText('1 selected')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Archive' })).toBeVisible();

    await userEvent.click(all);
    await expect(all).toBeChecked();
    await expect(all).not.toBePartiallyChecked();
    await expect(rows()).toHaveLength(MAILS.length);
    for (const box of rows()) await expect(box).toBeChecked();
    await expect(canvas.getByText(`${MAILS.length} selected`)).toBeVisible();

    await userEvent.click(all);
    await expect(all).not.toBeChecked();
    for (const box of rows()) await expect(box).not.toBeChecked();
    await expect(canvas.queryByRole('button', { name: 'Archive' })).toBeNull();
  },
};

/** A picked row takes a light accent tint; the bulk bar acts on the picked rows. */
export const InboxPickedRowsAreTintedAndActedOn: Story = {
  ...Inbox,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const rows = mailRows(canvas);
    const idle = getComputedStyle(rows[3]!).backgroundColor;
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select Sam Patel' }));
    await waitFor(() => expect(getComputedStyle(rows[3]!).backgroundColor).not.toBe(idle));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select Li Wei' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await waitFor(() => expect(mailRows(canvas)).toHaveLength(MAILS.length - 2));
    await expect(canvas.queryByText('Li Wei')).toBeNull();
    await expect(canvas.queryByText('Sam Patel')).toBeNull();
    await expect(canvas.getByRole('checkbox', { name: 'Select all' })).not.toBeChecked();
  },
};

/** The star is a toggle with `aria-pressed`; a starred one stays shown, an empty one shows on hover. */
export const InboxStarToggles: Story = {
  ...Inbox,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const starred = canvas.getByRole('button', { name: 'Star Ana Ruiz' });
    const empty = canvas.getByRole('button', { name: 'Star Ops on-call' });
    await expect(starred).toHaveAttribute('aria-pressed', 'true');
    await expect(empty).toHaveAttribute('aria-pressed', 'false');
    // At rest: the state shows without a hover, the empty star waits for one.
    await expect(getComputedStyle(starred).opacity).toBe('1');
    await expect(getComputedStyle(empty).opacity).toBe('0');
    // A filled star and an outlined one differ by more than their color.
    await expect(getComputedStyle(starred.querySelector('svg')!).fill).not.toBe('none');
    await expect(getComputedStyle(empty.querySelector('svg')!).fill).toBe('none');

    await userEvent.click(empty);
    await expect(empty).toHaveAttribute('aria-pressed', 'true');
    await expect(getComputedStyle(empty.querySelector('svg')!).fill).not.toBe('none');
    await userEvent.click(empty);
    await expect(empty).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(starred);
    await expect(starred).toHaveAttribute('aria-pressed', 'false');
  },
};

/** Hidden by opacity, never by `display` or `visibility`: a keyboard reaches them and they show. */
export const InboxActionsAreReachableWhileHidden: Story = {
  ...Inbox,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = mailRows(canvas)[1]!;
    const archive = within(row).getByRole('button', { name: 'Archive Ops on-call' });
    const strip = archive.parentElement!;
    await expect(getComputedStyle(strip).opacity).toBe('0');
    await expect(getComputedStyle(archive).display).not.toBe('none');
    await expect(getComputedStyle(archive).visibility).toBe('visible');

    // Tab from the row's checkbox: the title, then the first action, which brings them in.
    within(row).getByRole('checkbox', { name: 'Select Ops on-call' }).focus();
    for (let i = 0; i < 2; i += 1) await userEvent.tab();
    await expect(archive).toHaveFocus();
    await waitFor(() => expect(getComputedStyle(strip).opacity).toBe('1'));
    // The next row's own actions stay out.
    const next = within(mailRows(canvas)[2]!).getByRole('button', { name: 'Archive Li Wei' });
    await expect(getComputedStyle(next.parentElement!).opacity).toBe('0');

    // Back out through the title and the checkbox to the previous row: they hide again.
    for (let i = 0; i < 3; i += 1) await userEvent.tab({ shift: true });
    await expect(
      within(mailRows(canvas)[0]!).getByRole('button', { name: 'Star Ana Ruiz' })
    ).toHaveFocus();
    await waitFor(() => expect(getComputedStyle(strip).opacity).toBe('0'));
  },
};

/** The open row has `aria-current` on its title, a tint and a 3px bar at its start edge. */
export const InboxOpenRowIsMarked: Story = {
  ...Inbox,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const list = canvas.getByRole('list');
    const rows = mailRows(canvas);
    await expect(list.querySelectorAll('[aria-current]')).toHaveLength(0);
    await expect(list.querySelectorAll('[data-row-bar]')).toHaveLength(0);
    const idle = getComputedStyle(rows[2]!).backgroundColor;

    await userEvent.click(within(rows[2]!).getByRole('button', { name: 'Li Wei' }));
    const title = within(rows[2]!).getByRole('button', { name: 'Li Wei' });
    await expect(title).toHaveAttribute('aria-current', 'true');
    await expect(list.querySelectorAll('[aria-current]')).toHaveLength(1);
    await expect(getComputedStyle(rows[2]!).backgroundColor).not.toBe(idle);
    const bar = rows[2]!.querySelector<HTMLElement>('[data-row-bar]')!;
    await expect(bar).toBeInTheDocument();
    await expect(bar).toHaveAttribute('aria-hidden', 'true');
    await expect(bar.getBoundingClientRect().width).toBe(3);
    await expect(startOffset(bar, rows[2]!)).toBe(0);
    // The whole padding box: the row's own height less the divider above it.
    await expect(bar.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      rows[2]!.getBoundingClientRect().height - 1
    );

    // Opening another row moves the mark.
    await userEvent.click(within(rows[4]!).getByRole('button', { name: 'Mei Tanaka' }));
    await expect(list.querySelectorAll('[aria-current]')).toHaveLength(1);
    await expect(rows[2]!.querySelector('[data-row-bar]')).toBeNull();
    await expect(rows[4]!.querySelector('[data-row-bar]')).not.toBeNull();
  },
};

/** Unread is bold with a dot and "Unread" for a screen reader; titles stay aligned, read or not. */
export const InboxUnreadLooks: Story = {
  ...Inbox,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const list = canvas.getByRole('list');
    const rows = mailRows(canvas);
    const unread = within(rows[0]!).getByRole('button', { name: 'Unread: Ana Ruiz' });
    const read = within(rows[2]!).getByRole('button', { name: 'Li Wei' });
    await expect(getComputedStyle(unread).fontWeight).toBe('700');
    await expect(getComputedStyle(read).fontWeight).toBe('500');

    const dot = rows[0]!.querySelector<HTMLElement>('[data-row-dot]')!;
    await expect(dot).toBeVisible();
    await expect(dot).toHaveAttribute('aria-hidden', 'true');
    await expect(rows[2]!.querySelector('[data-row-dot]')).toBeNull();
    // The dot sits in the start gutter, ahead of the checkbox: nothing moves for it.
    const box = within(rows[0]!).getByRole('checkbox').closest('label')!;
    await expect(startOffset(dot, list)).toBeLessThan(startOffset(box, list));
    await expect(startOffset(unread, list)).toBe(startOffset(read, list));

    // Opening an unread row marks it read: the dot goes, the weight drops.
    await userEvent.click(unread);
    await waitFor(() => expect(rows[0]!.querySelector('[data-row-dot]')).toBeNull());
    await expect(within(rows[0]!).getByRole('button', { name: 'Ana Ruiz' })).toHaveStyle({
      fontWeight: '500',
    });
  },
};

/** Without `unread` a row looks as it did: semi-bold title, no dot, nothing said to a screen reader. */
export const UnreadOmittedKeepsTheCurrentLook: Story = {
  ...UnreadStates,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const rows = canvas.getAllByRole('listitem');
    await expect(getComputedStyle(canvas.getByText('Unread')).fontWeight).toBe('700');
    await expect(getComputedStyle(canvas.getByText('Read')).fontWeight).toBe('500');
    const plain = canvas.getByText('Not tracked');
    await expect(getComputedStyle(plain).fontWeight).toBe('600');
    await expect(rows[0]!.querySelector('[data-row-dot]')).not.toBeNull();
    await expect(rows[1]!.querySelector('[data-row-dot]')).toBeNull();
    await expect(rows[2]!.querySelector('[data-row-dot]')).toBeNull();
    await expect(rows[2]!.querySelector('.sr-only')).toBeNull();
    await expect(rows[0]!.querySelector('.sr-only')).toHaveTextContent('Unread');
    // Read or unread, the three titles start at the same place.
    const list = canvas.getByRole('list');
    await expect(startOffset(canvas.getByText('Unread'), list)).toBe(
      startOffset(canvas.getByText('Not tracked'), list)
    );
  },
};

/** The title's hit area covers the row; the checkbox, star and actions stay above it. */
export const InboxHitAreas: Story = {
  ...Inbox,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = within(mailRows(canvas)[0]!);
    const title = row.getByRole('button', { name: 'Unread: Ana Ruiz' });
    // The description and the avatar are under the overlay: a click on them goes to the title.
    await expect(title.contains(hitAt(row.getByText(/Could you look/)))).toBe(true);
    await expect(title.contains(hitAt(mailRows(canvas)[0]!.querySelector('img')!))).toBe(true);
    const box = row.getByRole('checkbox', { name: 'Select Ana Ruiz' }).closest('label')!;
    await expect(box.contains(hitAt(box))).toBe(true);
    for (const name of ['Star Ana Ruiz', 'Archive Ana Ruiz', 'Delete Ana Ruiz']) {
      const control = row.getByRole('button', { name });
      await expect(control.contains(hitAt(control)), name).toBe(true);
    }
  },
};

/** Bringing in the bulk buttons or a row's actions moves and resizes nothing; the controls line up. */
export const InboxDoesNotShiftOnState: Story = {
  ...Inbox,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const header = canvas.getAllByRole('listitem')[0]!;
    const rows = mailRows(canvas);
    const heights = () => [header, ...rows].map((el) => el.getBoundingClientRect().height);
    const mid = (el: Element) => {
      const { top, height } = el.getBoundingClientRect();
      return top + height / 2;
    };
    const rest = heights();

    // The bulk buttons come in with the first picked row.
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select Sam Patel' }));
    await expect(canvas.getByRole('button', { name: 'Archive' })).toBeVisible();
    await expect(heights()).toEqual(rest);

    // A row's actions come in with focus, in the place of the time.
    const row = within(rows[1]!);
    const archive = row.getByRole('button', { name: 'Archive Ops on-call' });
    archive.focus();
    await waitFor(() => expect(getComputedStyle(archive.parentElement!).opacity).toBe('1'));
    await expect(heights()).toEqual(rest);

    // On the title's line, level with its text; the checkbox box is level with it too.
    const title = row.getByRole('button', { name: 'Unread: Ops on-call' });
    await expect(Math.abs(mid(archive) - mid(title))).toBeLessThanOrEqual(3);
    await expect(Math.abs(mid(row.getByText('09:15')) - mid(title))).toBeLessThanOrEqual(3);
    const box = row.getByRole('checkbox').closest('label')!;
    await expect(Math.abs(mid(box) - mid(title))).toBeLessThanOrEqual(3);
    // The star sits on the row's own middle.
    const star = row.getByRole('button', { name: 'Star Ops on-call' });
    await expect(Math.abs(mid(star) - mid(rows[1]!))).toBeLessThanOrEqual(2);
  },
};

/** Only the title shows the row ring on focus: a focused checkbox, star or action has its own. */
export const InboxFocusRingIsOnTheTitle: Story = {
  ...Inbox,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const li = mailRows(canvas)[2]!;
    const row = within(li);
    await expectFocusRing(row.getByRole('button', { name: 'Li Wei' }), { ring: li, inset: true });
    await userEvent.tab();
    await expect(row.getByRole('button', { name: 'Archive Li Wei' })).toHaveFocus();
    await expect(getComputedStyle(li).boxShadow).toBe('none');
  },
};

/** At phone width the actions are one menu, the star stays shown and every target is 24px. */
export const InboxNarrowFoldsTheActions: Story = {
  ...InboxNarrow,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const rows = mailRows(canvas);
    await expect(canvas.queryByRole('button', { name: /^Archive/ })).toBeNull();
    await expect(canvas.getAllByRole('button', { name: /^More actions / })).toHaveLength(
      MAILS.length
    );
    // No hover on a phone: an empty star is shown too.
    const star = within(rows[2]!).getByRole('button', { name: 'Star Li Wei' });
    await expect(getComputedStyle(star).opacity).toBe('1');
    const more = within(rows[2]!).getByRole('button', { name: 'More actions Li Wei' });
    for (const control of [star, more, within(rows[2]!).getByRole('checkbox').closest('label')!]) {
      const { width, height } = control.getBoundingClientRect();
      await expect(Math.min(width, height)).toBeGreaterThanOrEqual(24);
    }
    // The bar's buttons go icon-only, so selecting rows does not widen the page.
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select Li Wei' }));
    await expect(canvas.getByRole('button', { name: 'Archive' })).toBeVisible();
    expectNoHorizontalOverflow();

    await userEvent.click(more);
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    const menu = await within(document.body).findByRole('menu');
    const items = within(menu).getAllByRole('menuitem');
    await expect(items.map((item) => item.textContent)).toEqual(['Archive', 'Delete']);
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Archive' }));
    await waitFor(() =>
      expect(canvas.queryByRole('checkbox', { name: 'Select Li Wei' })).toBeNull()
    );
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
    expectNoHorizontalOverflow();
  },
};

/** The menu opens from the keyboard and Escape returns the focus to its button. */
export const InboxNarrowMenuIsKeyboardReachable: Story = {
  ...InboxNarrow,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = within(mailRows(canvas)[1]!);
    row.getByRole('button', { name: 'Star Ops on-call' }).focus();
    await userEvent.tab();
    const more = row.getByRole('button', { name: 'More actions Ops on-call' });
    await expect(more).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const menu = await within(document.body).findByRole('menu');
    await expect(within(menu).getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
    await expect(more).toHaveFocus();
  },
};

// A line of what the host was told, to check the callbacks of the rows.
const Log = ({ entries }: { entries: string[] }) => <output>{entries.join(', ')}</output>;

const ClickDemo = () => {
  const [clicks, setClicks] = useState<string[]>([]);
  return (
    <>
      <StackedList>
        <StackedList.Item
          title="Disk alert"
          subtitle="rack B4"
          onClick={() => setClicks((c) => [...c, 'title'])}
          data-testid="li"
        />
      </StackedList>
      <Log entries={clicks} />
    </>
  );
};

/** `onClick` makes the title a button; the row itself no longer carries the handler. */
export const OnClickMakesTheTitleAButton: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ClickDemo />,
  play: async ({ canvas }) => {
    const title = canvas.getByRole('button', { name: 'Disk alert' });
    await expect(title.closest('li')).toBe(canvas.getByTestId('li'));
    await userEvent.click(title);
    await expect(canvas.getByRole('status')).toHaveTextContent(/^title$/);
    // The rest of the row is not the button: its own click does not reach the handler.
    await userEvent.click(canvas.getByText('rack B4'));
    await userEvent.click(canvas.getByTestId('li'));
    await expect(canvas.getByRole('status')).toHaveTextContent(/^title$/);
    // From the keyboard, like any button.
    title.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await expect(canvas.getByRole('status')).toHaveTextContent('title, title, title');
    await expect(canvas.getAllByRole('button')).toHaveLength(1);
  },
};

const LinkClickDemo = () => {
  const [clicks, setClicks] = useState<string[]>([]);
  return (
    <>
      <StackedList>
        <StackedList.Item
          title="Disk alert"
          href="#alert"
          onClick={(event) => {
            event.preventDefault();
            setClicks((c) => [...c, event.currentTarget.tagName]);
          }}
        />
      </StackedList>
      <Log entries={clicks} />
    </>
  );
};

/** With `href` the title stays a link, and `onClick` runs on it, so a router can take the click. */
export const OnClickRunsOnTheLink: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LinkClickDemo />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button')).toBeNull();
    await userEvent.click(canvas.getByRole('link', { name: 'Disk alert' }));
    // The handler is on the link itself, not on the row the click bubbles to.
    await expect(canvas.getByRole('status')).toHaveTextContent(/^A$/);
  },
};

const ControlledDemo = () => {
  const [told, setTold] = useState<string[]>([]);
  const tell = (entry: string) => setTold((t) => [...t, entry]);
  return (
    <>
      <StackedList>
        <StackedList.Item
          title="Controlled"
          checked={false}
          onCheckedChange={(on) => tell(`Controlled checked ${on}`)}
          starred={false}
          onStarredChange={(on) => tell(`Controlled starred ${on}`)}
        />
        <StackedList.Item
          title="Uncontrolled"
          defaultChecked
          onCheckedChange={(on) => tell(`Uncontrolled checked ${on}`)}
          defaultStarred
          onStarredChange={(on) => tell(`Uncontrolled starred ${on}`)}
        />
        <StackedList.Item title="Neither" />
      </StackedList>
      <Log entries={told} />
    </>
  );
};

/** `checked` and `starred` follow the controlled pattern: only `undefined` leaves them to the row. */
export const CheckedAndStarredCanBeControlled: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ControlledDemo />,
  play: async ({ canvas }) => {
    // A row with neither has no checkbox and no star.
    await expect(canvas.getAllByRole('checkbox')).toHaveLength(2);
    await expect(canvas.getAllByRole('button', { name: /^Star / })).toHaveLength(2);

    const controlled = canvas.getByRole('checkbox', { name: 'Select Controlled' });
    await userEvent.click(controlled);
    // The host did not pass the new value back: the row keeps showing the old one.
    await expect(controlled).not.toBeChecked();
    const star = canvas.getByRole('button', { name: 'Star Controlled' });
    await userEvent.click(star);
    await expect(star).toHaveAttribute('aria-pressed', 'false');

    const own = canvas.getByRole('checkbox', { name: 'Select Uncontrolled' });
    await expect(own).toBeChecked();
    await userEvent.click(own);
    await expect(own).not.toBeChecked();
    const ownStar = canvas.getByRole('button', { name: 'Star Uncontrolled' });
    await expect(ownStar).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(ownStar);
    await expect(ownStar).toHaveAttribute('aria-pressed', 'false');

    // Both told the host the state they moved to, as the controlled pattern says.
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Controlled checked true, Controlled starred true, Uncontrolled checked false, Uncontrolled starred false'
    );
  },
};

const ActionsDemo = () => {
  const [done, setDone] = useState<string[]>([]);
  return (
    <>
      <StackedList>
        <StackedList.Item
          title="Disk alert"
          actions={[
            { label: 'Archive', icon: Archive, onSelect: () => setDone((d) => [...d, 'archive']) },
            {
              label: 'Delete',
              icon: Trash2,
              intent: 'danger',
              disabled: true,
              onSelect: () => setDone((d) => [...d, 'delete']),
            },
          ]}
        />
      </StackedList>
      <Log entries={done} />
    </>
  );
};

/** Each action is data: its label names the button, its `onSelect` runs on a click. */
export const ActionsRunTheirCallback: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ActionsDemo />,
  play: async ({ canvas }) => {
    const archive = canvas.getByRole('button', { name: 'Archive Disk alert' });
    const remove = canvas.getByRole('button', { name: 'Delete Disk alert' });
    await expect(archive.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(remove).toBeDisabled();
    await userEvent.click(archive);
    await userEvent.click(archive);
    await expect(canvas.getByRole('status')).toHaveTextContent('archive, archive');
  },
};

/** The header bar and the rows lay out from the start edge: the checkbox, the dot, the open bar. */
export const InboxMirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <StackedList card>
        <StackedList.Header
          checked={false}
          onCheckedChange={() => {}}
          actions={<button type="button">Archive</button>}
        >
          Inbox
        </StackedList.Header>
        <StackedList.Item
          title="Ana Ruiz"
          timestamp="10:42"
          description="Review request for the cooling PR."
          unread
          selected
          onClick={() => {}}
          checked={false}
          onCheckedChange={() => {}}
          starred
          onStarredChange={() => {}}
          actions={[{ label: 'Archive', icon: Archive, onSelect: () => {} }]}
        />
      </StackedList>
    )),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) =>
      within(box).getByRole('checkbox', { name: 'Select all' }).closest('label')
    );
    expectMirrored(canvasElement, (box) =>
      within(box).getByRole('checkbox', { name: 'Select Ana Ruiz' }).closest('label')
    );
    expectMirrored(canvasElement, (box) => box.querySelector('[data-row-dot]'));
    expectMirrored(canvasElement, (box) => box.querySelector('[data-row-bar]'));
    expectMirrored(canvasElement, (box) =>
      within(box).getByRole('button', { name: 'Unread: Ana Ruiz' })
    );
    const ltr = directionBox(canvasElement, 'ltr');
    const rtl = directionBox(canvasElement, 'rtl');
    const end = (box: HTMLElement) => ({
      star: endOffset(within(box).getByRole('button', { name: 'Star Ana Ruiz' }), box),
      time: endOffset(within(box).getByText('10:42'), box),
      bulk: endOffset(within(box).getByRole('button', { name: 'Archive' }), box),
    });
    expect(end(rtl).star).toBeCloseTo(end(ltr).star, 0);
    expect(end(rtl).time).toBeCloseTo(end(ltr).time, 0);
    expect(end(rtl).bulk).toBeCloseTo(end(ltr).bulk, 0);
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The rank, the avatar and the text are at the start; the meta, the chevron and a card's action at the end. */
export const RowsMirrorInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <StackedList
        card
        title="Slowest endpoints"
        description="p95 over the last hour"
        action={<button type="button">View all</button>}
      >
        <StackedList.Item
          rank={1}
          avatar={
            <img
              alt=""
              src={placeholderAvatar('Aiden Park', 96)}
              className="size-10 flex-none rounded-full"
            />
          }
          title="/api/v1/query_range"
          subtitle="Aiden Park"
          meta={<p className="text-xs">1.8 s</p>}
          href="#row"
          chevron
        />
      </StackedList>
    )),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => within(box).getByText('Slowest endpoints'));
    expectMirrored(canvasElement, (box) => within(box).getByText('1'));
    expectMirrored(canvasElement, (box) => box.querySelector('img'));
    expectMirrored(canvasElement, (box) => within(box).getByText('/api/v1/query_range'));
    expectMirrored(canvasElement, (box) => within(box).getByText('Aiden Park'));
    const ltr = directionBox(canvasElement, 'ltr');
    const rtl = directionBox(canvasElement, 'rtl');
    const end = (box: HTMLElement) => ({
      action: endOffset(within(box).getByRole('button', { name: 'View all' }), box),
      meta: endOffset(within(box).getByText('1.8 s'), box),
      chevron: endOffset(box.querySelector('svg.lucide-chevron-right')!, box),
    });
    expect(end(rtl).action).toBeCloseTo(end(ltr).action, 0);
    expect(end(rtl).meta).toBeCloseTo(end(ltr).meta, 0);
    expect(end(rtl).chevron).toBeCloseTo(end(ltr).chevron, 0);
    expect(getComputedStyle(ltr.querySelector('svg.lucide-chevron-right')!).scale).toBe('none');
    expect(getComputedStyle(rtl.querySelector('svg.lucide-chevron-right')!).scale).toBe('-1 1');
  },
};
