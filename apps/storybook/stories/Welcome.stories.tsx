import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AppWindow,
  ArrowRight,
  BookMarked,
  Code2,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Mail,
  Palette,
  Wrench,
} from 'lucide-react';
import {
  Avatar,
  Button,
  CodeBlock,
  DataTable,
  HealthDot,
  Input,
  KpiCard,
  ProgressBar,
  StatusBadge,
  Toggle,
} from '../../../packages/react/src';
import type { ColumnDef } from '../../../packages/react/src/table/types';

// ---------------------------------------------------------------------------
// Welcome page rendered as a regular story (not MDX) so that the preview
// decorators (`withCosmosSurface` + `withThemeByClassName`) actually apply
// and the toolbar theme toggle drives both backgrounds AND every Cosmos
// component rendered inside (KpiCard, Button, DataTable, …).
//
// MDX unattached docs do NOT pass through preview decorators in Storybook 10,
// which is why this used to be Welcome.mdx and broke the dark/light toggle.
// ---------------------------------------------------------------------------

type Group = {
  id: string;
  name: string;
  count: number;
  contains: string;
};

const groupRows: Group[] = [
  {
    id: 'pages',
    name: 'Pages',
    count: 17,
    contains:
      'Dashboard, Profile, SettingsScreen, AuthLayout, SignIn/Up/Reset/2FA, BlogIndex, BlogPost, DocPage, HomeScreen, DetailScreen, ErrorPage, FormElements, StackedShell, SocialAuthButtons',
  },
  {
    id: 'atoms',
    name: 'Atoms',
    count: 16,
    contains:
      'Button, ButtonGroup, Badge, Avatar, AlertBanner, Backdrop, IconBox, Link, Ribbon, SectionLabel, SelectInput, Spinner, Clipboard, ThemeToggle, ThemeToggleTri, BackToTopFab',
  },
  {
    id: 'forms',
    name: 'Forms',
    count: 25,
    contains:
      'Input, Select, Combobox, Toggle, Checkbox, Radio, NumberInput, StepperInput, SearchInput, PasswordInput, OtpInput, Textarea, DatePicker (single + range), TimePicker, Calendar, FileInput, Dropzone, AvatarUploader, FilterPills, SegmentedControl, ZoomBar, FormRow, FormFooter, ActionPanel, PasswordPolicyChecker',
  },
  {
    id: 'data',
    name: 'Data',
    count: 10,
    contains:
      'KpiCard, CodeBlock, Accordion, Carousel, ImageGrid, VideoEmbed, IntegrationCard, Timeline, DescriptionList',
  },
  { id: 'status', name: 'Status', count: 3, contains: 'HealthBadge, HealthDot, StatusBadge' },
  {
    id: 'feedback',
    name: 'Feedback',
    count: 10,
    contains:
      'AlertBanner, NotificationCard, Toaster, Tooltip, AnnouncementBar, CookieBanner, EmptyState, ErrorState, LoadingState, Skeleton',
  },
  {
    id: 'overlays',
    name: 'Overlays',
    count: 9,
    contains:
      'Modal, Drawer, Dropdown, Popover, CommandPalette, HelpOverlay, ConfirmationModal, NotificationsPanel, UserMenu',
  },
  {
    id: 'navigation',
    name: 'Navigation',
    count: 10,
    contains:
      'Tabs, Breadcrumb, PageBreadcrumb, Pagination, Stepper, ProgressBar, Navbar, VerticalNavigation, StickyScrollNav',
  },
  {
    id: 'actions',
    name: 'Actions',
    count: 5,
    contains:
      'PageActionButton, RefreshButton, RowActionButton, StatefulSaveButton, UnsavedIndicator',
  },
  {
    id: 'layout',
    name: 'Layout',
    count: 11,
    contains:
      'Shell, Sidebar, Topbar, PageHeader, PageCard, SectionCard, Card, ContentNarrow, ColBox, Divider, MediaObject',
  },
  {
    id: 'lists',
    name: 'Lists',
    count: 11,
    contains:
      'StackedList, ContentStackedList, StackedListInCard, NarrowStackedList, ActivityFeed, GridList, List, SimpleRow, ClickableRow, StatusRow',
  },
  {
    id: 'tables',
    name: 'Tables',
    count: 1,
    contains: 'DataTable (sortable, filterable, paginated, with selection + bulk actions)',
  },
  {
    id: 'settings',
    name: 'Settings',
    count: 3,
    contains: 'AccentPicker, OptionPicker, PalettePicker',
  },
  {
    id: 'charts',
    name: 'Charts',
    count: 2,
    contains: 'BarChart, Gallery (@sckyzo/cosmos-charts)',
  },
];

const groupLinks: Record<string, string> = {
  pages: 'pages-dashboard--docs',
  atoms: 'atoms-button--docs',
  forms: 'forms-input--docs',
  data: 'data-kpi-card--docs',
  status: 'status-status-badge--docs',
  feedback: 'feedback-toast--docs',
  overlays: 'overlays-modal--docs',
  navigation: 'navigation-tabs--docs',
  actions: 'actions-page-action-button--docs',
  layout: 'layout-shell--docs',
  lists: 'lists-stacked-list--docs',
  tables: 'tables-datatable--docs',
  settings: 'settings-accent-picker--docs',
  charts: 'charts-bar-chart--docs',
};

const groupColumns: ColumnDef<Group>[] = [
  {
    key: 'name',
    label: 'Group',
    width: '14%',
    sortable: true,
    sortValue: (r) => r.name,
    filterable: true,
    filterValue: (r) => r.name,
    render: (r) => (
      <a
        href={`./?path=/docs/${groupLinks[r.id]}`}
        className="font-semibold text-[var(--color-brand-500)] hover:underline"
      >
        {r.name}
      </a>
    ),
  },
  {
    key: 'count',
    label: 'Count',
    width: '8%',
    align: 'right',
    sortable: true,
    sortValue: (r) => r.count,
    render: (r) => (
      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{r.count}</span>
    ),
  },
  {
    key: 'contains',
    label: 'Components',
    sortable: false,
    filterable: true,
    filterValue: (r) => r.contains,
    searchValue: (r) => `${r.name} ${r.contains}`,
    render: (r) => <span className="text-sm leading-snug">{r.contains}</span>,
  },
];

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

const PreviewCard = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex min-h-[110px] flex-col gap-2.5 rounded-lg border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
    <span className="font-mono text-[0.65rem] tracking-widest text-gray-500 uppercase dark:text-gray-400">
      {label}
    </span>
    <div className="flex flex-1 flex-wrap items-center justify-start gap-2">{children}</div>
  </div>
);

const TemplateCard = ({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  desc: string;
}) => (
  <a
    href={href}
    className="group flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 text-gray-900 transition hover:-translate-y-px hover:border-[var(--color-brand-500)] hover:no-underline dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
  >
    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--color-brand-500)_12%,transparent)] text-[var(--color-brand-500)]">
      <Icon size={18} />
    </span>
    <span className="text-base font-semibold">{title}</span>
    <span className="flex-1 text-sm leading-snug text-gray-500 dark:text-gray-400">{desc}</span>
    <span className="font-mono text-[0.7rem] tracking-wide text-[var(--color-brand-500)] uppercase">
      Open template →
    </span>
  </a>
);

const IntentCol = ({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ElementType;
  title: string;
  items: Array<{ href: string; label: string; external?: boolean }>;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
    <div className="mb-2.5 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
      <Icon size={16} className="text-[var(--color-brand-500)]" />
      {title}
    </div>
    <ul className="m-0 list-none p-0">
      {items.map((item) => (
        <li key={item.label} className="py-1 text-sm">
          <a
            href={item.href}
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noreferrer' : undefined}
            className="text-[var(--color-brand-500)] hover:underline"
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const PkgCard = ({
  name,
  version,
  what,
  install,
}: {
  name: string;
  version: string;
  what: string;
  install: string;
}) => (
  <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
    <div className="flex items-baseline justify-between">
      <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
        {name}
      </span>
      <span className="font-mono text-[0.7rem] text-gray-500 dark:text-gray-400">{version}</span>
    </div>
    <span className="flex-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{what}</span>
    <code className="overflow-x-auto rounded border border-gray-200 bg-gray-50 px-2.5 py-1.5 font-mono text-xs whitespace-nowrap text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100">
      {install}
    </code>
  </div>
);

// ---------------------------------------------------------------------------
// The Welcome page itself
// ---------------------------------------------------------------------------

const WelcomePage = () => (
  <div className="mx-auto max-w-[1180px] px-5 pb-16">
    {/* Hero: status bar */}
    <div className="mt-6 flex items-center justify-between gap-4 rounded-md border border-gray-200 bg-white px-3.5 py-2 font-mono text-xs dark:border-gray-800 dark:bg-gray-900">
      <span className="font-bold tracking-[0.18em] text-gray-900 dark:text-gray-100">COSMOS</span>
      <span className="text-gray-500 dark:text-gray-400">
        <span className="mr-1.5 inline-block size-[7px] animate-pulse rounded-full bg-emerald-500" />
        v0.1.0 · 133 components · 128 stories · build live
      </span>
    </div>

    {/* Hero: title + lead + CTAs */}
    <h1 className="mt-3 mb-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-gray-100">
      Cosmos design system
    </h1>
    <p className="max-w-prose text-base leading-relaxed text-gray-500 dark:text-gray-400">
      Components, patterns and templates powering rackscope, monitoring-hub and the
      monitoring-hub-website. One source of truth, three npm packages, zero visual drift across
      surfaces.
    </p>
    <div className="mt-6 flex flex-wrap gap-2.5">
      <a href="./?path=/docs/atoms-button--docs">
        <Button variant="primary" icon={ArrowRight} iconPosition="right">
          Explore components
        </Button>
      </a>
      <a href="#get-started">
        <Button variant="secondary">Get started</Button>
      </a>
      <a href="https://github.com/SckyzO/cosmos" target="_blank" rel="noreferrer">
        <Button variant="ghost" icon={ExternalLink}>
          View on GitHub
        </Button>
      </a>
    </div>

    {/* Live preview */}
    <section className="mt-12">
      <h2 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold tracking-widest text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
        Live preview
      </h2>
      {/* 3x3 grid — row 1: interaction primitives, row 2: monitoring/status DNA,
       *  row 3: data display. sm:grid-cols-2 → md:grid-cols-3 keeps the layout
       *  tidy at smaller widths. */}
      <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3">
        {/* Row 1 — Interaction */}
        <PreviewCard label="Button">
          <Button variant="primary" size="sm">
            Primary
          </Button>
          <Button variant="secondary" size="sm">
            Secondary
          </Button>
          <Button variant="danger" size="sm">
            Danger
          </Button>
        </PreviewCard>
        <PreviewCard label="CodeBlock">
          {/* Dev snippet — signature "made for engineers". Replaces the Badge
           *  card which doubled up visually with StatusBadge (row 2). */}
          <div className="w-full">
            <CodeBlock language="bash" code="$ docker pull sckyzo/cosmos:0.1.0" />
          </div>
        </PreviewCard>
        <PreviewCard label="Toggle">
          <Toggle checked onChange={() => {}} label="Auto-refresh" />
        </PreviewCard>

        {/* Row 2 — Status / monitoring DNA */}
        <PreviewCard label="StatusBadge">
          {/* Matrix at SM — the full status set (OK / WARN / CRIT / INFO / UNKNOWN)
           *  in the inline size used inside tables and lists. */}
          <StatusBadge status="OK" size="sm" />
          <StatusBadge status="WARN" size="sm" />
          <StatusBadge status="CRIT" size="sm" />
          <StatusBadge status="INFO" size="sm" />
          <StatusBadge status="UNKNOWN" size="sm" />
        </PreviewCard>
        <PreviewCard label="HealthDot">
          <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
            <HealthDot status="OK" /> 24 nodes
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
            <HealthDot status="WARN" /> 3 nodes
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
            <HealthDot status="CRIT" pulse /> 1 node
          </span>
        </PreviewCard>
        <PreviewCard label="ProgressBar">
          <div className="flex w-full flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-300">CPU utilization</span>
              <span className="font-mono text-gray-500 dark:text-gray-400">78%</span>
            </div>
            <ProgressBar value={78} intent="warning" />
          </div>
        </PreviewCard>

        {/* Row 3 — Data display */}
        <PreviewCard label="Input">
          {/* Inline field + action pattern (e.g. "Invite teammate" / "Add tag") —
           *  shows that Input composes with Button without needing a dedicated
           *  attached-suffix variant. */}
          <div className="flex w-full items-center gap-2">
            <div className="flex-1">
              <Input placeholder="user@example.com" icon={Mail} />
            </div>
            <Button variant="primary" size="sm">
              Invite
            </Button>
          </div>
        </PreviewCard>
        <PreviewCard label="Avatar">
          {/* Size scale (xs → xl) — baseline-aligned so the progression reads
           *  like a typography ramp. Initials only so the comparison stays
           *  about size, not identity. */}
          <div className="flex flex-wrap items-end gap-3">
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <Avatar size={s} name="JD" />
                <span className="font-mono text-[10px] tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  {s}
                </span>
              </div>
            ))}
          </div>
        </PreviewCard>
        <PreviewCard label="KpiCard">
          <div className="w-full">
            <KpiCard label="Total Racks" value="48" sub="across 3 sites" />
          </div>
        </PreviewCard>
      </div>
    </section>

    {/* Page templates */}
    <section className="mt-12">
      <h2 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold tracking-widest text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
        Page templates
      </h2>
      <div className="grid [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
        <TemplateCard
          href="./?path=/docs/pages-dashboard--docs"
          icon={LayoutDashboard}
          title="Dashboard"
          desc="KPI grid, charts, status rows. The default landing for monitoring apps."
        />
        <TemplateCard
          href="./?path=/docs/pages-blog-index--docs"
          icon={FileText}
          title="Blog"
          desc="Article index + single post layouts (5 variants). Used by the website."
        />
        <TemplateCard
          href="./?path=/docs/pages-doc-page--docs"
          icon={BookMarked}
          title="DocPage"
          desc="RTFM-style technical documentation layout with sticky nav and code blocks."
        />
        <TemplateCard
          href="./?path=/docs/pages-stacked-shell--docs"
          icon={AppWindow}
          title="App Shell"
          desc="Sidebar + topbar + content area. The root layout for every page."
        />
      </div>
    </section>

    {/* Get started */}
    <section id="get-started" className="mt-12">
      <h2 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold tracking-widest text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
        Get started
      </h2>
      <pre className="mb-3 overflow-x-auto rounded-md border border-gray-200 bg-white p-4 font-mono text-sm leading-relaxed dark:border-gray-800 dark:bg-gray-900">
        {`pnpm add @sckyzo/cosmos-theme @sckyzo/cosmos-react`}
      </pre>
      <pre className="mb-3 overflow-x-auto rounded-md border border-gray-200 bg-white p-4 font-mono text-sm leading-relaxed dark:border-gray-800 dark:bg-gray-900">
        {`// app.css
@import '@sckyzo/cosmos-theme/tailwind';

// App.tsx
import { Button } from '@sckyzo/cosmos-react';

export default () => <Button variant="primary">Hello Cosmos</Button>;`}
      </pre>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Dark mode toggles automatically via the <code>data-theme</code> attribute set by{' '}
        <a
          href="./?path=/docs/atoms-theme-toggle--docs"
          className="text-[var(--color-brand-500)] hover:underline"
        >
          <code>&lt;ThemeToggle /&gt;</code>
        </a>
        . Storybook's toolbar toggle uses the same mechanism.
      </p>
    </section>

    {/* Where to next? */}
    <section className="mt-12">
      <h2 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold tracking-widest text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
        Where to next?
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        <IntentCol
          icon={Palette}
          title="I'm a designer"
          items={[
            { href: './?path=/docs/pages-dashboard--docs', label: 'Pages templates' },
            { href: './?path=/docs/settings-accent-picker--docs', label: 'Color tokens' },
            { href: './?path=/docs/atoms-badge--docs', label: 'Status & tones' },
            { href: './?path=/docs/layout-card--docs', label: 'Layout primitives' },
          ]}
        />
        <IntentCol
          icon={Code2}
          title="I'm a developer"
          items={[
            { href: '#get-started', label: 'Quick start' },
            { href: './?path=/docs/atoms-button--docs', label: 'Atoms catalog' },
            { href: './?path=/docs/forms-input--docs', label: 'Forms & Tables' },
            { href: './?path=/docs/charts-bar-chart--docs', label: 'Charts gallery' },
          ]}
        />
        <IntentCol
          icon={Wrench}
          title="I want to contribute"
          items={[
            { href: 'https://github.com/SckyzO/cosmos', label: 'Repo layout', external: true },
            {
              href: 'https://github.com/SckyzO/cosmos/blob/main/.claude/CLAUDE.md',
              label: 'Repo conventions',
              external: true,
            },
            {
              href: 'https://github.com/SckyzO/cosmos/blob/main/README.md',
              label: 'Running tests',
              external: true,
            },
            {
              href: 'https://github.com/SckyzO/cosmos/issues',
              label: 'Open an issue',
              external: true,
            },
          ]}
        />
      </div>
    </section>

    {/* Packages */}
    <section className="mt-12">
      <h2 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold tracking-widest text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
        Packages
      </h2>
      <div className="grid gap-3.5 md:grid-cols-3">
        <PkgCard
          name="@sckyzo/cosmos-theme"
          version="v0.1.0"
          what="Tailwind 4 theme tokens + CSS variables. Required by the other two packages."
          install="pnpm add @sckyzo/cosmos-theme"
        />
        <PkgCard
          name="@sckyzo/cosmos-react"
          version="v0.0.0"
          what="React 19 component library. Peer-depends on the theme. Ships ESM only."
          install="pnpm add @sckyzo/cosmos-react"
        />
        <PkgCard
          name="@sckyzo/cosmos-charts"
          version="v0.0.0"
          what="Opinionated ApexCharts wrappers themed for Cosmos. Optional, shipped separately."
          install="pnpm add @sckyzo/cosmos-charts"
        />
      </div>
    </section>

    {/* Resources */}
    <section className="mt-12">
      <h2 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold tracking-widest text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
        Resources
      </h2>
      <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm">
        {[
          ['https://github.com/SckyzO/cosmos', 'GitHub repo'],
          ['https://github.com/SckyzO/cosmos/issues', 'Issues'],
          ['https://github.com/SckyzO/cosmos/releases', 'Releases'],
          ['https://tailwindui.com/components', 'Tailwind UI (inspiration)'],
          ['https://flowbite.com/docs/components/', 'Flowbite (inspiration)'],
          ['https://storybook.js.org/docs', 'Storybook docs'],
        ].map(([href, label], i, arr) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-brand-500)] hover:underline"
            >
              {label}
            </a>
            {i < arr.length - 1 && <span className="ml-5 text-gray-400">·</span>}
          </li>
        ))}
      </ul>
    </section>

    {/* All sidebar groups (DataTable) */}
    <section className="mt-12">
      <h2 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold tracking-widest text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
        All sidebar groups
      </h2>
      <div className="mb-3.5 text-sm text-gray-500 dark:text-gray-400">
        Stories are grouped by <strong>responsibility</strong>, not by file location — mirroring the
        Storybook{' '}
        <a
          href="https://storybook.js.org/docs/writing-stories/naming-components-and-hierarchy"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--color-brand-500)] hover:underline"
        >
          story-hierarchy convention
        </a>
        . Total: <strong>{groupRows.reduce((s, g) => s + g.count, 0)}</strong> components across{' '}
        <strong>{groupRows.length}</strong> groups.
      </div>
      <DataTable<Group>
        rows={groupRows}
        columns={groupColumns}
        rowKey={(r) => r.id}
        pageSize={20}
        defaultSearchValue=""
        onSearchChange={() => {}}
        searchPlaceholder="Filter groups or components…"
      />
    </section>
  </div>
);

const meta = {
  title: 'Welcome',
  component: WelcomePage,
  parameters: {
    layout: 'padded',
    docs: { story: { inline: true } },
  },
  tags: ['!autodocs'],
} satisfies Meta<typeof WelcomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Welcome',
};
