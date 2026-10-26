import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, MessageCircle, MoreVertical } from 'lucide-react';
import { Fragment } from 'react';
import { expect, within } from 'storybook/test';
import { placeholderAvatar } from '../storybook-avatars';
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
              <Button variant="secondary" size="xs" className="hidden sm:inline-flex">
                View project<span className="sr-only">, {p.name}</span>
              </Button>
              <ActionsMenuButton name={p.name} />
            </>
          }
        />
      ))}
    </StackedList>
  ),
  play: async ({ canvas }) => {
    // Each repeated button names its project for screen readers. `hidden`: the
    // button only shows from `sm` up, wider than the test viewport.
    for (const p of PROJECTS) {
      const name = new RegExp(`^View project\\s*, ${p.name}$`);
      await expect(canvas.getByRole('button', { name, hidden: true })).toBeInTheDocument();
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
            trailing={<span className="text-sm/6 text-gray-900 dark:text-white">{e.p95}</span>}
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

/** `meta` stays the right-hand column; only `details` is the dotted line under the title. */
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
    await expect(first.getBoundingClientRect().right).toBeLessThanOrEqual(
      title.getBoundingClientRect().left
    );
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
    // The header sits above the list, and the action at its right edge.
    const heading = canvas.getByRole('heading', { name: 'Slowest endpoints' });
    const list = canvas.getByTestId('with-header');
    await expect(heading.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      list.getBoundingClientRect().top
    );
    await expect(action.getBoundingClientRect().left).toBeGreaterThan(
      heading.getBoundingClientRect().right
    );
    await expect(within(canvas.getByTestId('without')).queryByRole('heading')).toBeNull();
  },
};
