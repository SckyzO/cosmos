import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CalendarDays,
  Eye,
  ListChecks,
  MessageSquare,
  Moon,
  Plus,
  Share2,
  Sun,
  Upload,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  Avatar,
  AvatarGroup,
  Badge,
  Breadcrumb,
  Card,
  Checkbox,
  CommandPalette,
  CommandPaletteTrigger,
  EmptyState,
  ErrorState,
  Menu,
  NotificationsPanel,
  PageActionButton,
  PageContainer,
  PageHeader,
  ProgressBar,
  Shell,
  Sidebar,
  Sk,
  ThemeToggle,
  Topbar,
  UserMenu,
  applyAppearance,
  type CosmosAccent,
} from '../../../../packages/react/src';
import {
  expectHamburgerTogglesSidebar,
  expectNoHorizontalOverflow,
  mobileViewport,
  portalDocsParams,
  startOffset,
} from '../../../../packages/react/src/storybook-helpers';
import {
  BUSY_USER,
  BUSY_WORKSPACE,
  NEW_WORKSPACE,
  REVIEW_PAGE,
  TODAY,
  USER,
  WORKSPACE,
  type Due,
  type Icon,
  type NavEntry,
  type Project,
  type ProjectColor,
  type Task,
  type Workspace,
} from './app-shell.data';

// App shell: the frame every screen of an application lives in. `Shell` owns the sidebar state
// (the rail from `lg` up, the drawer below) and shares it with `Sidebar` and `Topbar`; the page
// brings a `PageHeader` as its one `h1` (the Topbar title stays text). The five states below only
// change what sits in the page: the frame, the nav and the Topbar are the same in each.

const meta = {
  title: 'Examples/App Shell',
  parameters: { ...portalDocsParams.full(), layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type ScreenState = 'content' | 'empty' | 'loading' | 'error' | 'extreme';

// ── Small pieces ─────────────────────────────────────────────────────────────

// A project is a coloured square in the sidebar and in task rows.
const DOT: Record<ProjectColor, string> = {
  brand: 'bg-brand-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  cyan: 'bg-cyan-500',
  pink: 'bg-pink-500',
};

const ProjectDot = ({ color, className }: { color: ProjectColor; className?: string }) => (
  <span aria-hidden className={`size-2.5 shrink-0 rounded-sm ${DOT[color]} ${className ?? ''}`} />
);

// `Sidebar.Item` takes an icon component: one per colour, drawn in the icon's 20px box.
const projectIcon = (color: ProjectColor): Icon =>
  function ProjectIcon() {
    return (
      <span aria-hidden className="flex size-5 items-center justify-center">
        <ProjectDot color={color} />
      </span>
    );
  };

const PROJECT_ICON: Record<ProjectColor, Icon> = {
  brand: projectIcon('brand'),
  green: projectIcon('green'),
  amber: projectIcon('amber'),
  violet: projectIcon('violet'),
  cyan: projectIcon('cyan'),
  pink: projectIcon('pink'),
};

// The Topbar's logo, shown while the sidebar (and its own brand) is off screen.
const Logo = () => (
  <span
    aria-hidden
    className="bg-brand-500 flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
  >
    L
  </span>
);

const countBadge = (entry: { id?: string; badge?: string }) =>
  entry.badge ? (
    <Badge size="sm" intent={entry.id === 'inbox' ? 'brand' : 'neutral'}>
      {entry.badge}
    </Badge>
  ) : undefined;

const DUE_INTENT = { today: 'danger', soon: 'warning', later: 'neutral' } as const;

const DueBadge = ({ due }: { due: Due }) => (
  <Badge size="sm" intent={DUE_INTENT[due.urgency]} className="shrink-0">
    {due.label}
  </Badge>
);

// ── Sidebar ──────────────────────────────────────────────────────────────────

const navItem = (entry: NavEntry, active: boolean) => (
  <Sidebar.Item
    key={entry.id}
    icon={entry.icon}
    label={entry.label}
    href={`#${entry.id}`}
    active={active}
    badge={countBadge(entry)}
  />
);

// The nav is data, so the same component draws the everyday workspace, the empty one and the
// one with a nav taller than the screen. Long labels and the badges are `Sidebar`'s to fit.
const AppSidebar = ({
  workspace,
  user,
  collapsed,
}: {
  workspace: Workspace;
  user: typeof USER;
  collapsed: boolean;
}) => (
  <Sidebar
    footer={
      // Collapsed to the 72px rail, the name and email would not fit: the avatar stays. The
      // collapsed state is the Shell's; the screen passes it down.
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={user.name} size="sm" />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              <bdi>{user.name}</bdi>
            </p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              <bdi>{user.email}</bdi>
            </p>
          </div>
        )}
      </div>
    }
  >
    <Sidebar.Brand
      logo={<span className="text-base font-bold">L</span>}
      title={workspace.name}
      subtitle={workspace.plan}
      href="#home"
    />
    <Sidebar.Section>
      {workspace.main.map((entry) => navItem(entry, entry.id === 'home'))}
    </Sidebar.Section>
    <Sidebar.Group label="Projects">
      {workspace.projects.length === 0 && (
        <p className="py-1.5 ps-12 pe-5 text-sm text-[var(--color-text-muted)]">No projects yet</p>
      )}
      {workspace.projects.map((project) => (
        <Sidebar.Item
          key={project.id}
          icon={PROJECT_ICON[project.color]}
          label={project.name}
          href={`#${project.id}`}
          badge={countBadge(project)}
        />
      ))}
      {workspace.projects.length === 0 ? (
        <Sidebar.Item icon={Plus} label="Create project" href="#new-project" />
      ) : (
        navItem(workspace.allProjects, false)
      )}
    </Sidebar.Group>
    <Sidebar.Section label="Workspace">
      {workspace.workspace.map((entry) => navItem(entry, false))}
    </Sidebar.Section>
  </Sidebar>
);

// ── Topbar ───────────────────────────────────────────────────────────────────

const AppTopbar = ({
  title,
  user,
  unread,
  onOpenPalette,
}: {
  title: string;
  user: typeof USER;
  unread: number;
  onOpenPalette: () => void;
}) => {
  // A real app keeps its theme in its own settings. The recipe starts from the class the
  // Storybook toolbar put on <html>, and keeps the accent it picked.
  const [isDark, setIsDark] = useState(() =>
    ['dark', 'deep-blue'].some((theme) => document.documentElement.classList.contains(theme))
  );
  const setDark = (dark: boolean) => {
    setIsDark(dark);
    applyAppearance({
      theme: dark ? 'dark' : 'light',
      accent: (document.documentElement.dataset.accent ?? 'blue') as CosmosAccent,
    });
  };
  return (
    <Topbar
      // Below `lg` the sidebar is off screen: its brand moves to the bar, next to the hamburger.
      brand={
        <span className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]">
          <Logo />
          Lumen
        </span>
      }
      pageTitle={title}
      center={
        // The palette owns the ⌘K hotkey; the trigger opens it on a click. Below `sm` it is
        // an icon, and sits at the end of the free space, next to the actions.
        <div className="flex max-w-md max-sm:max-w-none max-sm:justify-end sm:mx-auto">
          <CommandPaletteTrigger
            placeholder="Search projects, tasks, docs"
            onClick={onOpenPalette}
          />
        </div>
      }
      // What does not fit a phone moves into the "More" menu; the bell and the profile stay.
      moreActions={
        <Menu.Item icon={isDark ? Sun : Moon} onSelect={() => setDark(!isDark)}>
          {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        </Menu.Item>
      }
      endActions={
        <>
          <NotificationsPanel>
            <NotificationsPanel.Trigger count={unread} />
            <NotificationsPanel.Content>
              <NotificationsPanel.Header title="Notifications" />
              {unread === 0 ? (
                <NotificationsPanel.Empty title="You're all caught up" subtitle="Nothing new." />
              ) : (
                <NotificationsPanel.List>
                  <NotificationsPanel.Item
                    intent="info"
                    badgeLabel="New"
                    unread
                    title="Daniel Okafor commented"
                    subtitle="Pricing page copy"
                    time="12 minutes ago"
                  />
                  <NotificationsPanel.Item
                    intent="info"
                    badgeLabel="Assigned"
                    unread
                    title="Lena Hofmann assigned you a task"
                    subtitle="Review pricing page copy"
                    time="Yesterday, 11:05"
                  />
                </NotificationsPanel.List>
              )}
            </NotificationsPanel.Content>
          </NotificationsPanel>
          <ThemeToggle isDark={isDark} onChange={setDark} className="max-sm:hidden" />
          <UserMenu>
            {/* Name hidden: a name of any length would push the search aside. */}
            <UserMenu.Trigger name={user.name} hideName />
            <UserMenu.Content>
              <UserMenu.Header name={user.name} email={user.email} />
              <UserMenu.Items>
                <UserMenu.Item>Profile</UserMenu.Item>
                <UserMenu.Item>Workspace settings</UserMenu.Item>
                <UserMenu.Item intent="danger">Sign out</UserMenu.Item>
              </UserMenu.Items>
            </UserMenu.Content>
          </UserMenu>
        </>
      }
    />
  );
};

// ── Pages ────────────────────────────────────────────────────────────────────

const PageActions = ({ withNewProject = true }: { withNewProject?: boolean }) => (
  <>
    <PageActionButton icon={UserPlus}>Invite members</PageActionButton>
    {withNewProject && (
      <PageActionButton icon={Plus} variant="primary">
        New project
      </PageActionButton>
    )}
  </>
);

const homeCrumbs = (workspace: Workspace) => (
  <Breadcrumb items={[{ label: workspace.name, href: '#home' }, { label: 'Home' }]} />
);

const TaskRow = ({ task }: { task: Task }) => (
  <li className="py-row-12 flex items-center gap-3 px-4">
    <Checkbox aria-label={`Mark done: ${task.title}`} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
        <bdi>{task.title}</bdi>
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
        <ProjectDot color={task.color} className="size-2" />
        <span className="truncate">
          <bdi>{task.project}</bdi>
        </span>
      </p>
    </div>
    <DueBadge due={task.due} />
  </li>
);

const ProjectCard = ({ project }: { project: Project }) => (
  <Card>
    <p className="flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
      <ProjectDot color={project.color} className="size-3" />
      <span className="truncate">
        <bdi>{project.name}</bdi>
      </span>
    </p>
    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{project.description}</p>
    <ProgressBar
      className="mt-3"
      value={project.progress}
      label="outside"
      aria-label={`${project.name} progress`}
    />
    <div className="mt-3 flex items-center justify-between gap-2">
      <AvatarGroup
        size="sm"
        aria-label={`${project.name} members`}
        avatars={project.members.map((name) => ({ name }))}
      />
      <span className="text-xs text-[var(--color-text-muted)]">{project.updated}</span>
    </div>
  </Card>
);

const SectionTitle = ({ children, action }: { children: string; action?: string }) => (
  <div className="mb-3 flex items-center justify-between gap-3">
    <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{children}</h2>
    {action && (
      <a
        href="#all"
        className="text-brand-600 dark:text-brand-400 focus-visible:focus-indicator rounded-sm text-sm font-medium"
      >
        {action}
      </a>
    )}
  </div>
);

const ActivityFeed = ({ items }: { items: Workspace['activity'] }) => (
  <ul className="divide-y divide-[var(--color-border)] px-4">
    {items.map((item) => (
      <li key={item.id} className="flex gap-3 py-2.5">
        <Avatar name={item.who} size="sm" />
        <p className="min-w-0 text-sm text-[var(--color-text-secondary)]">
          <b className="font-semibold text-[var(--color-text-primary)]">
            <bdi>{item.who}</bdi>
          </b>{' '}
          <bdi>{item.what}</bdi>
          <time className="mt-0.5 block text-xs text-[var(--color-text-muted)]">{item.when}</time>
        </p>
      </li>
    ))}
  </ul>
);

// The home: a greeting, the tasks due this week and the recent projects in the main column,
// the activity feed beside them from `xl`.
const HomePage = ({ workspace }: { workspace: Workspace }) => (
  <>
    <PageHeader
      as="h1"
      title="Good morning, Priya"
      breadcrumb={homeCrumbs(workspace)}
      description={TODAY}
      meta={
        <>
          <PageHeader.MetaItem icon={ListChecks}>
            {workspace.dueThisWeek} tasks due this week
          </PageHeader.MetaItem>
          <PageHeader.MetaItem icon={Eye}>
            {workspace.needReview} need your review
          </PageHeader.MetaItem>
        </>
      }
      actions={<PageActions />}
    />
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="min-w-0 space-y-6">
        <section>
          <SectionTitle>My tasks due this week</SectionTitle>
          <Card padding="none">
            <ul className="divide-y divide-[var(--color-border)]">
              {workspace.tasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </ul>
          </Card>
        </section>
        <section>
          <SectionTitle action="All projects">Recent projects</SectionTitle>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
            {workspace.projects.slice(0, 3).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      </div>
      <section>
        <SectionTitle action="See all">Activity</SectionTitle>
        <Card padding="none">
          <ActivityFeed items={workspace.activity} />
        </Card>
      </section>
    </div>
  </>
);

// A new workspace: the page keeps its frame and the empty parts say what to do next.
const EmptyHome = ({ workspace }: { workspace: Workspace }) => (
  <>
    <PageHeader
      as="h1"
      title="Welcome to Lumen, Priya"
      breadcrumb={homeCrumbs(workspace)}
      description={TODAY}
      actions={<PageActions withNewProject={false} />}
    />
    <div className="mt-6 space-y-6">
      <Card>
        <EmptyState
          intent="brand"
          title="Create your first project"
          description="Projects hold your tasks, docs and discussions. Start from scratch or bring your tasks over from a CSV file."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <PageActionButton icon={Plus} variant="primary">
                New project
              </PageActionButton>
              <PageActionButton icon={Upload}>Import tasks</PageActionButton>
            </div>
          }
        />
      </Card>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section>
          <SectionTitle>My tasks due this week</SectionTitle>
          <Card>
            <EmptyState
              compact
              icon={ListChecks}
              title="No tasks yet"
              description="Tasks assigned to you show up here."
            />
          </Card>
        </section>
        <section>
          <SectionTitle>Activity</SectionTitle>
          <Card>
            <EmptyState
              compact
              icon={MessageSquare}
              title="Nothing has happened yet"
              description="Updates from your team appear here."
            />
          </Card>
        </section>
      </div>
    </div>
  </>
);

// The first load: the header is known (it is the page), what comes from the server is not.
// `aria-busy` marks the region, the status line tells a screen reader what is going on.
const LoadingHome = ({ workspace }: { workspace: Workspace }) => (
  <>
    <PageHeader as="h1" title="Home" breadcrumb={homeCrumbs(workspace)} />
    <div aria-busy="true" className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <p role="status" className="sr-only">
        Loading your workspace…
      </p>
      <div className="min-w-0 space-y-6">
        <Card padding="none">
          <ul className="divide-y divide-[var(--color-border)]">
            {['w-3/5', 'w-2/3', 'w-1/2', 'w-3/5'].map((width, i) => (
              <li key={i} className="py-row-12 flex items-center gap-3 px-4">
                <Sk h="h-[18px]" w="w-[18px]" />
                <Sk w={width} />
                <Sk w="w-16" round="rounded-full" className="ms-auto" />
              </li>
            ))}
          </ul>
        </Card>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
          {[0, 1, 2].map((i) => (
            <Sk key={i} h="h-40" round="rounded-2xl" />
          ))}
        </div>
      </div>
      <Card padding="none">
        <ul className="divide-y divide-[var(--color-border)] px-4">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex gap-3 py-3">
              <Sk h="h-8" w="w-8" round="rounded-full" />
              <div className="flex-1 space-y-2">
                <Sk w="w-5/6" />
                <Sk h="h-3" w="w-1/3" />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  </>
);

// The request failed, the frame did not: the nav and its counts are what was last loaded and
// every link works. The error sits where the content would, with its way out.
const ErrorHome = ({ workspace, onRetry }: { workspace: Workspace; onRetry: () => void }) => (
  <>
    <PageHeader
      as="h1"
      title="Good morning, Priya"
      breadcrumb={homeCrumbs(workspace)}
      description={TODAY}
      actions={<PageActions />}
    />
    <Card className="mt-6">
      <ErrorState
        title="We couldn't load your workspace"
        description="The server took too long to answer (error 504). Your changes are safe; check your connection and try again."
        onRetry={onRetry}
      />
    </Card>
  </>
);

// Everything at its limit: a title on two lines, a breadcrumb folded into a menu, a thread
// with counts past 999.
const ReviewPage = () => (
  <>
    <PageHeader
      as="h1"
      title={REVIEW_PAGE.title}
      breadcrumb={<Breadcrumb maxItems={3} items={REVIEW_PAGE.trail} />}
      meta={
        <>
          <PageHeader.MetaItem icon={CalendarDays}>{REVIEW_PAGE.due}</PageHeader.MetaItem>
          <PageHeader.MetaItem icon={MessageSquare}>{REVIEW_PAGE.comments}</PageHeader.MetaItem>
        </>
      }
      actions={
        <>
          <PageActionButton icon={Share2}>Share</PageActionButton>
          <PageActionButton variant="primary">Approve</PageActionButton>
        </>
      }
    />
    <section className="mt-6">
      <SectionTitle>Open comments</SectionTitle>
      <Card padding="none">
        <ul className="divide-y divide-[var(--color-border)]">
          {REVIEW_PAGE.threads.map((thread) => (
            <li key={thread.id} className="py-row-12 flex items-center gap-3 px-4">
              <Avatar name={thread.who} size="sm" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-text-primary)]">
                <bdi>{thread.title}</bdi>
              </p>
              <DueBadge due={thread.due} />
              <Badge size="sm" icon={MessageSquare} className="shrink-0">
                {thread.replies}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  </>
);

// ── The screen ───────────────────────────────────────────────────────────────

// `state` is the page's state; the frame is the same in all of them. The screen owns the three
// things the frame needs state for: the palette, the collapsed rail and the way out of an error.
const AppShellScreen = ({
  state: initial,
  defaultSidebarOpen,
}: {
  state: ScreenState;
  defaultSidebarOpen?: boolean;
}) => {
  const [state, setState] = useState(initial);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const workspace =
    state === 'empty' ? NEW_WORKSPACE : state === 'extreme' ? BUSY_WORKSPACE : WORKSPACE;
  const user = state === 'extreme' ? BUSY_USER : USER;

  const page = {
    content: <HomePage workspace={workspace} />,
    empty: <EmptyHome workspace={workspace} />,
    loading: <LoadingHome workspace={workspace} />,
    // "Try again" would refetch; the recipe goes straight to the loaded page.
    error: <ErrorHome workspace={workspace} onRetry={() => setState('content')} />,
    extreme: <ReviewPage />,
  }[state];

  return (
    <>
      <Shell
        sidebarCollapsed={collapsed}
        onCollapsedChange={setCollapsed}
        defaultSidebarOpen={defaultSidebarOpen}
        topbar={
          <AppTopbar
            title={state === 'extreme' ? REVIEW_PAGE.topbarTitle : 'Home'}
            user={user}
            unread={workspace.unread}
            onOpenPalette={() => setPaletteOpen(true)}
          />
        }
        sidebar={<AppSidebar workspace={workspace} user={user} collapsed={collapsed} />}
      >
        <PageContainer width="full">{page}</PageContainer>
      </Shell>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandPalette.Input placeholder="Search projects, tasks, docs" />
        <CommandPalette.List>
          <CommandPalette.Empty>No matching results.</CommandPalette.Empty>
          <CommandPalette.Group heading="Go to">
            {workspace.main.map((entry) => (
              <CommandPalette.Item
                key={entry.id}
                icon={entry.icon}
                onSelect={() => setPaletteOpen(false)}
              >
                {entry.label}
              </CommandPalette.Item>
            ))}
          </CommandPalette.Group>
          {workspace.projects.length > 0 && (
            <CommandPalette.Group heading="Projects">
              {workspace.projects.map((project) => (
                <CommandPalette.Item
                  key={project.id}
                  icon={PROJECT_ICON[project.color]}
                  onSelect={() => setPaletteOpen(false)}
                >
                  {project.name}
                </CommandPalette.Item>
              ))}
            </CommandPalette.Group>
          )}
        </CommandPalette.List>
      </CommandPalette>
    </>
  );
};

// ── Stories: one per state ───────────────────────────────────────────────────

/** The home of a workspace in use, with the sidebar, the Topbar and the page header around it. */
export const Content: Story = {
  render: () => <AppShellScreen state="content" />,
};

/** A new workspace: the nav and the Topbar are unchanged, the page invites to create a project. */
export const Empty: Story = {
  render: () => <AppShellScreen state="empty" />,
};

/** The first load: the frame is live, the page is skeletons. */
export const Loading: Story = {
  render: () => <AppShellScreen state="loading" />,
};

/** The page failed to load: `ErrorState` with "Try again", the nav still usable. */
export const LoadError: Story = {
  name: 'Error',
  render: () => <AppShellScreen state="error" />,
};

/**
 * Long workspace and user names, counts past 999, a nav taller than the screen, a breadcrumb
 * folded into a menu and a title on two lines.
 */
export const ExtremeContent: Story = {
  render: () => <AppShellScreen state="extreme" />,
};

/** At 375px the sidebar is off screen: the Topbar shows the hamburger, the logo and the actions. */
export const Phone: Story = {
  globals: mobileViewport,
  render: () => <AppShellScreen state="content" />,
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

/** The hamburger's other half: the sidebar open as a drawer over a backdrop. */
export const PhoneSidebarOpen: Story = {
  globals: mobileViewport,
  render: () => <AppShellScreen state="content" defaultSidebarOpen />,
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

// ── Hidden tests ─────────────────────────────────────────────────────────────

const body = () => within(document.body);

/** The Topbar title is text: the page header is the one `h1`, in every state and at every width. */
export const HasOneH1: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <AppShellScreen state="content" />,
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Good morning, Priya' })
    ).toBeVisible();
  },
};

const ONE_H1 = {
  empty: 'Welcome to Lumen, Priya',
  loading: 'Home',
  error: 'Good morning, Priya',
  extreme: REVIEW_PAGE.title,
} as const;

// Each state, at desktop width and on the phone, has exactly one h1: the page header's.
const oneH1Per = (state: keyof typeof ONE_H1): Story => ({
  tags: ['!dev', '!autodocs'],
  render: () => <AppShellScreen state={state} />,
  play: async ({ canvas }) => {
    const h1 = canvas.getAllByRole('heading', { level: 1 });
    await expect(h1).toHaveLength(1);
    await expect(h1[0]).toHaveTextContent(ONE_H1[state]);
  },
});

export const EmptyHasOneH1: Story = oneH1Per('empty');
export const LoadingHasOneH1: Story = oneH1Per('loading');
export const ErrorHasOneH1: Story = oneH1Per('error');
export const ExtremeHasOneH1: Story = oneH1Per('extreme');

/** On the phone the Topbar hides its title; the page header is still the one `h1`. */
export const PhoneHasOneH1: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  render: () => <AppShellScreen state="content" />,
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await expect(canvas.getByRole('heading', { level: 1 })).toBeVisible();
  },
};

/** From `lg` up the hamburger collapses the sidebar to its rail and expands it again. */
export const HamburgerCollapsesTheSidebar: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <AppShellScreen state="content" />,
  play: async ({ canvas }) => expectHamburgerTogglesSidebar(canvas),
};

/** On the phone the hamburger opens the sidebar over a backdrop; the backdrop closes it. */
export const HamburgerTogglesTheSidebar: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  render: () => <AppShellScreen state="content" />,
  play: async () => {
    const hamburger = body().getByRole('button', { name: 'Open navigation' });
    await expect(body().queryByRole('dialog')).toBeNull();

    await userEvent.click(hamburger);
    const dialog = await body().findByRole('dialog', { name: 'Navigation menu' });
    await waitFor(() => expect(startOffset(dialog, document.documentElement)).toBe(0));
    await expect(within(dialog).getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(within(dialog).getByText('Fernhill Studio')).toBeVisible();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    const backdrop = document.body.querySelector<HTMLElement>(
      'div[aria-hidden][class*="bg-gray-500"]'
    );
    await expect(backdrop).not.toBeNull();

    await userEvent.click(backdrop!);
    await waitFor(() => expect(dialog).not.toBeVisible());
    await expect(body().queryByRole('dialog')).toBeNull();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  },
};

/** The Close button of the drawer closes it as well. */
export const PhoneDrawerCloses: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  render: () => <AppShellScreen state="content" defaultSidebarOpen />,
  play: async () => {
    const dialog = await body().findByRole('dialog', { name: 'Navigation menu' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close navigation' }));
    await waitFor(() => expect(dialog).not.toBeVisible());
  },
};

/** The trigger in the Topbar opens the palette; Escape closes it. */
export const TriggerOpensThePalette: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <AppShellScreen state="content" />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Search projects, tasks, docs/ }));
    const palette = await body().findByRole('dialog', { name: 'Command palette' });
    await expect(within(palette).getByRole('option', { name: 'My tasks' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body().queryByRole('dialog')).toBeNull());
  },
};

/** The empty workspace names its next step and offers it. */
export const EmptyOffersAProject: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <AppShellScreen state="empty" />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Create your first project')).toBeVisible();
    await expect(canvas.getAllByRole('button', { name: 'New project' }).length).toBeGreaterThan(0);
    // The nav says the same, in its own words.
    await expect(canvas.getByText('No projects yet')).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Create project' })).toBeVisible();
  },
};

/** The first load shows skeletons in a busy region, and the nav is already there. */
export const LoadingIsBusyWithTheNavPresent: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <AppShellScreen state="loading" />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status', { name: '' })).toHaveTextContent(
      'Loading your workspace'
    );
    const busy = document.querySelector('[aria-busy="true"]');
    await expect(busy).not.toBeNull();
    await expect(busy!.querySelectorAll('.animate-pulse').length).toBeGreaterThan(5);
    await expect(canvas.getByRole('link', { name: /My tasks/ })).toBeVisible();
  },
};

/** The error keeps the nav usable (links, counts) and "Try again" brings the page back. */
export const ErrorKeepsTheNavAndRetries: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <AppShellScreen state="error" />,
  play: async ({ canvas }) => {
    const alert = canvas.getByRole('alert');
    await expect(within(alert).getByText("We couldn't load your workspace")).toBeVisible();
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    await expect(within(nav).getByRole('link', { name: /Inbox/ })).toHaveAttribute(
      'href',
      '#inbox'
    );
    await expect(within(nav).getByText('12')).toBeVisible();
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(canvas.getByText('My tasks due this week')).toBeVisible();
  },
};

/** Long names are cut, counts stay short, the nav scrolls and the breadcrumb folds. */
export const ExtremeContentFits: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <AppShellScreen state="extreme" />,
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
    // The workspace name is cut by the brand, not wrapped or overflowing.
    const name = within(nav).getByText(/Fernhill Studio International/);
    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    await expect(within(nav).getAllByText('999+').length).toBeGreaterThan(0);
    // More rows than the screen holds: the nav scrolls.
    const scroller = [nav, ...nav.querySelectorAll<HTMLElement>('*')].find(
      (el) => getComputedStyle(el).overflowY === 'auto' && el.scrollHeight > el.clientHeight
    );
    await expect(scroller).toBeDefined();
    // The trail folds into a menu and the title takes two lines or more.
    await expect(canvas.getByRole('button', { name: /more pages/ })).toBeVisible();
    const h1 = canvas.getByRole('heading', { level: 1 });
    await expect(h1.getBoundingClientRect().height).toBeGreaterThan(
      1.5 * parseFloat(getComputedStyle(h1).lineHeight)
    );
    // Past 9999 the bell says so rather than growing.
    await expect(canvas.getByText('9999+')).toBeVisible();
  },
};
