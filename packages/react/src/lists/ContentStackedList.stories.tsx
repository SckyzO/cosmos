import type { Meta, StoryObj } from '@storybook/react-vite';
import { MessageCircle, MoreVertical } from 'lucide-react';
import { expect } from 'storybook/test';
import { placeholderAvatar } from '../storybook-avatars';
import { Badge } from '../ui/Badge';
import { ContentStackedList } from './ContentStackedList';

const meta = {
  title: 'Lists/Content Stacked List',
  component: ContentStackedList,
  subcomponents: { 'ContentStackedList.Item': ContentStackedList.Item },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof ContentStackedList>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Sample data (neutral, monitoring-flavored) ───────────────────────────────

type Issue = {
  title: string;
  author: string;
  authorHref: string;
  ago: string;
  comments: number;
  commenters: string[];
  href: string;
};

const ISSUES: Issue[] = [
  {
    title: 'Prometheus scrape interval drifts under heavy load on multi-AZ pools',
    author: 'Aiden Park',
    authorHref: '#',
    ago: '2d ago',
    comments: 24,
    commenters: [
      placeholderAvatar('Aiden Park', 64),
      placeholderAvatar('Mei Tanaka', 64),
      placeholderAvatar('Olivier Dubois', 64),
      placeholderAvatar('Priya Singh', 64),
      placeholderAvatar('Ben', 64),
    ],
    href: '#',
  },
  {
    title: 'Grafana provisioning fails with templated datasources after upgrade',
    author: 'Mei Tanaka',
    authorHref: '#',
    ago: '5h ago',
    comments: 8,
    commenters: [
      placeholderAvatar('Mei Tanaka', 64),
      placeholderAvatar('Aiden Park', 64),
      placeholderAvatar('Olivier Dubois', 64),
    ],
    href: '#',
  },
  {
    title: 'Add OTLP receiver support to the OpenTelemetry collector preset',
    author: 'Olivier Dubois',
    authorHref: '#',
    ago: '1w ago',
    comments: 3,
    commenters: [placeholderAvatar('Olivier Dubois', 64), placeholderAvatar('Mei Tanaka', 64)],
    href: '#',
  },
];

type Project = {
  name: string;
  status: 'Complete' | 'In progress' | 'Archived';
  due: string;
  createdBy: string;
};

const PROJECTS: Project[] = [
  {
    name: 'GraphQL API',
    status: 'Complete',
    due: 'March 17, 2026',
    createdBy: 'Aiden Park',
  },
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

const STATUS_VARIANT = {
  Complete: 'success' as const,
  'In progress': 'info' as const,
  Archived: 'neutral' as const,
};

// ── Stories — Pattern 3 (avatar group + count, issue/discussion list) ───────

const AvatarGroup = ({ urls }: { urls: string[] }) => (
  <div className="flex -space-x-0.5">
    <dt className="sr-only">Commenters</dt>
    {urls.map((src) => (
      <dd key={src}>
        <img
          alt=""
          src={src}
          className="size-6 rounded-full bg-gray-50 ring-2 ring-white dark:ring-gray-900"
        />
      </dd>
    ))}
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

export const IssuesWithAvatarGroup: Story = {
  render: () => (
    <ContentStackedList>
      {ISSUES.map((i) => (
        <ContentStackedList.Item
          key={i.title}
          title={i.title}
          href={i.href}
          meta={[
            <a key="a" href={i.authorHref} className="hover:underline">
              {i.author}
            </a>,
            <time key="t">{i.ago}</time>,
          ]}
          trailing={
            <dl className="flex items-center gap-x-6 sm:gap-x-8">
              <AvatarGroup urls={i.commenters} />
              <CommentCount count={i.comments} />
            </dl>
          }
        />
      ))}
    </ContentStackedList>
  ),
};

// ── Stories — Pattern 5 (badge + button + actions menu, project list) ────────

const ActionsMenuButton = ({ name }: { name: string }) => (
  <button
    type="button"
    aria-label={`Open options for ${name}`}
    className="flex size-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200"
  >
    <MoreVertical className="size-5" aria-hidden />
  </button>
);

export const ProjectsWithBadgeAndActions: Story = {
  render: () => (
    <ContentStackedList>
      {PROJECTS.map((p) => (
        <ContentStackedList.Item
          key={p.name}
          title={p.name}
          badge={<Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>}
          meta={[
            <span key="d">
              Due on <time>{p.due}</time>
            </span>,
            <span key="c">Created by {p.createdBy}</span>,
          ]}
          trailing={
            <>
              <a
                href="#"
                className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 sm:block dark:bg-gray-800 dark:text-white dark:ring-white/10 dark:hover:bg-gray-700"
              >
                View project
              </a>
              <ActionsMenuButton name={p.name} />
            </>
          }
        />
      ))}
    </ContentStackedList>
  ),
};

// ── Variants ─────────────────────────────────────────────────────────────────

export const TitleWithoutLink: Story = {
  render: () => (
    <ContentStackedList>
      <ContentStackedList.Item
        title="Static issue title (no href)"
        meta={[<span key="a">Aiden Park</span>, <time key="t">2d ago</time>]}
      />
    </ContentStackedList>
  ),
};

export const TitleOnlyNoMeta: Story = {
  render: () => (
    <ContentStackedList>
      {ISSUES.slice(0, 2).map((i) => (
        <ContentStackedList.Item key={i.title} title={i.title} href={i.href} />
      ))}
    </ContentStackedList>
  ),
};

export const SingleMetaItem: Story = {
  render: () => (
    <ContentStackedList>
      <ContentStackedList.Item
        title="Single meta item — no dot separator should appear"
        meta={[<time key="t">just now</time>]}
      />
    </ContentStackedList>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RootIsUlWithRoleList: Story = {
  render: () => (
    <ContentStackedList data-testid="csl">
      <ContentStackedList.Item title="x" />
    </ContentStackedList>
  ),
  play: async ({ canvasElement }) => {
    const ul = canvasElement.querySelector('ul[data-testid="csl"]');
    await expect(ul).not.toBeNull();
    await expect(ul).toHaveAttribute('role', 'list');
    await expect(ul?.className ?? '').toMatch(/divide-y/);
  },
};

export const HrefMakesTitleLink: Story = {
  render: () => (
    <ContentStackedList>
      <ContentStackedList.Item title="Linkable title" href="/x" />
    </ContentStackedList>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /linkable title/i });
    await expect(link).toHaveAttribute('href', '/x');
  },
};

export const BadgeRendersInsideTitleRow: Story = {
  render: () => (
    <ContentStackedList>
      <ContentStackedList.Item
        title="My project"
        badge={<Badge variant="success">Complete</Badge>}
      />
    </ContentStackedList>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('My project')).toBeInTheDocument();
    await expect(canvas.getByText('Complete')).toBeInTheDocument();
  },
};

export const MetaRendersDotSeparatorBetweenItems: Story = {
  render: () => (
    <ContentStackedList>
      <ContentStackedList.Item
        title="t"
        meta={[<span key="a">first</span>, <span key="b">second</span>, <span key="c">third</span>]}
        data-testid="li"
      />
    </ContentStackedList>
  ),
  play: async ({ canvasElement }) => {
    const li = canvasElement.querySelector('[data-testid="li"]');
    // Three items + 2 separators between them
    const dots = li?.querySelectorAll('svg[viewBox="0 0 2 2"]') ?? [];
    await expect(dots.length).toBe(2);
  },
};
