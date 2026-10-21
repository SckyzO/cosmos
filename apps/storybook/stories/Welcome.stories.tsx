import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Activity as ActivityIcon,
  AppWindow,
  ArrowRight,
  BookMarked,
  BookOpen,
  CalendarDays,
  CircleDot,
  ExternalLink,
  FileText,
  FolderGit2,
  LayoutDashboard,
  Mail,
  Settings,
  Tag,
  UserRound,
} from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { expect, within } from 'storybook/test';
import {
  AppearanceSettings,
  applyAppearance,
  Button,
  CodeBlock,
  DataTable,
  HealthDot,
  Input,
  KpiCard,
  ProgressBar,
  StatusBadge,
  Toggle,
  type CosmosAppearance,
} from '../../../packages/react/src';
import type { ColumnDef } from '../../../packages/react/src/table/types';
// Versions come from the packages so the page can't drift from what's published.
import { Sparkline } from '../../../packages/charts/src';
import chartsPkg from '../../../packages/charts/package.json';
import reactPkg from '../../../packages/react/package.json';
import themePkg from '../../../packages/theme/package.json';

// ---------------------------------------------------------------------------
// Welcome page rendered as a regular story (not MDX) so that the preview
// decorators (`withCosmosSurface` + `withThemeByClassName`) actually apply
// and the toolbar theme toggle drives both backgrounds AND every Cosmos
// component rendered inside (KpiCard, Button, DataTable, …).
//
// MDX unattached docs do NOT pass through preview decorators in Storybook 10,
// which is why this used to be Welcome.mdx and broke the dark/light toggle.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Catalog: the sidebar groups, read from Storybook's own index so the counts
// and the entries can't drift from the stories.
// ---------------------------------------------------------------------------

type IndexEntry = { id: string; title: string; type: 'story' | 'docs' };

type CatalogEntry = { name: string; href: string };
type CatalogGroup = { name: string; href: string; entries: CatalogEntry[] };

// index.json lists the entries already in sidebar order (storySort), so the
// groups and their entries keep it.
const catalogGroups = (entries: IndexEntry[]): CatalogGroup[] => {
  const byTitle = new Map<string, { docs?: string; story?: string }>();
  for (const e of entries) {
    if (e.title === 'Welcome') continue;
    const ids = byTitle.get(e.title) ?? {};
    if (e.type === 'docs') ids.docs ??= e.id;
    else ids.story ??= e.id;
    byTitle.set(e.title, ids);
  }
  const groups = new Map<string, CatalogGroup>();
  for (const [title, ids] of byTitle) {
    const [groupName, ...rest] = title.split('/');
    const href = ids.docs ? `./?path=/docs/${ids.docs}` : `./?path=/story/${ids.story}`;
    const group = groups.get(groupName) ?? { name: groupName, href, entries: [] };
    group.entries.push({ name: rest.join(' / ') || groupName, href });
    groups.set(groupName, group);
  }
  return [...groups.values()];
};

const catalogColumns: ColumnDef<CatalogGroup>[] = [
  {
    key: 'name',
    label: 'Group',
    width: '6.5rem',
    sortable: true,
    sortValue: (g) => g.name,
    render: (g) => (
      <div className="flex flex-col">
        <a
          href={g.href}
          className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
        >
          {g.name}
        </a>
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
          {g.entries.length} {g.entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>
    ),
  },
  {
    key: 'entries',
    label: 'Entries',
    searchValue: (g) => `${g.name} ${g.entries.map((e) => e.name).join(' ')}`,
    render: (g) => (
      <span className="text-sm leading-relaxed">
        {g.entries.map((e, i) => (
          <Fragment key={e.href}>
            {i > 0 && ', '}
            <a
              href={e.href}
              className="hover:text-brand-600 dark:hover:text-brand-400 text-gray-700 hover:underline dark:text-gray-300"
            >
              {e.name}
            </a>
          </Fragment>
        ))}
      </span>
    ),
  },
];

/** `entries` is `null` while loading and `'error'` when the index couldn't be read. */
const CatalogTable = ({ entries }: { entries: IndexEntry[] | null | 'error' }) => {
  if (entries === null)
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading the story index…</p>;
  if (entries === 'error')
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        The story index (<code>index.json</code>) couldn&apos;t be loaded, so the groups can&apos;t
        be listed here. The sidebar has them all.
      </p>
    );
  const groups = catalogGroups(entries);
  const titles = groups.reduce((n, g) => n + g.entries.length, 0);
  const stories = entries.filter((e) => e.type === 'story' && e.title !== 'Welcome').length;
  return (
    <>
      <p className="mb-3.5 text-sm text-gray-500 dark:text-gray-400">
        Stories are grouped by <strong>responsibility</strong>, not by file location, following
        Storybook&apos;s{' '}
        <a
          href="https://storybook.js.org/docs/writing-stories/naming-components-and-hierarchy"
          target="_blank"
          rel="noreferrer"
          className="text-brand-600 dark:text-brand-400 hover:underline"
        >
          story-hierarchy convention
        </a>
        : <strong>{titles}</strong> entries and <strong>{stories}</strong> stories across{' '}
        <strong>{groups.length}</strong> groups.
      </p>
      <DataTable<CatalogGroup>
        rows={groups}
        columns={catalogColumns}
        rowKey={(g) => g.name}
        pageSize={30}
        defaultSearchValue=""
        onSearchChange={() => {}}
        searchPlaceholder="Filter groups or entries…"
      />
    </>
  );
};

// The preview iframe and index.json sit side by side, in dev and in the
// static build (GitHub Pages serves it under /cosmos/).
const useStoryIndex = () => {
  const [entries, setEntries] = useState<IndexEntry[] | null | 'error'>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('./index.json')
      .then((res) => {
        if (!res.ok) throw new Error(`index.json: HTTP ${res.status}`);
        return res.json() as Promise<{ entries: Record<string, IndexEntry> }>;
      })
      .then((index) => !cancelled && setEntries(Object.values(index.entries)))
      .catch(() => !cancelled && setEntries('error'));
    return () => {
      cancelled = true;
    };
  }, []);
  return entries;
};

const Catalog = () => <CatalogTable entries={useStoryIndex()} />;

// Same setup as the cosmos-react README ("Set up the styles").
const INSTALL = 'pnpm add @sckyzo/cosmos-theme @sckyzo/cosmos-react';

const APP_CSS = `/* app.css */
@import 'tailwindcss';

/* Required: let Tailwind scan the components for their classes.
   The path is relative to this file. */
@source '../node_modules/@sckyzo/cosmos-react/dist/**/*.{js,cjs}';

@import '@sckyzo/cosmos-theme/tailwind';
@import '@sckyzo/cosmos-theme/vars';
@import '@sckyzo/cosmos-theme/fonts';
/* Other fonts, for data-font: fonts/inter, fonts/plex, fonts/montserrat, fonts/open-sans */`;

const APP_TSX = `// App.tsx
import { Button } from '@sckyzo/cosmos-react';

export default () => <Button>Hello Cosmos</Button>;`;

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

// Links styled like Button: a <Button> inside an <a> nests two interactive
// elements (invalid HTML, two tab stops per call to action).
const CTA =
  'inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40';
const CTA_VARIANT = {
  primary: 'bg-brand-500 text-white shadow-sm hover:bg-brand-600',
  secondary:
    'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
  ghost: 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5',
};

// lucide ships no brand icons, so no GitHub logo.
const RESOURCES = [
  {
    href: 'https://github.com/SckyzO/cosmos',
    icon: FolderGit2,
    label: 'GitHub repo',
    desc: 'Source code and pull requests.',
  },
  {
    href: 'https://github.com/SckyzO/cosmos/blob/main/CONTRIBUTING.md',
    icon: BookOpen,
    label: 'Contributing',
    desc: 'Setup, commit rules, theming rules and the PR checklist.',
  },
  {
    href: 'https://github.com/SckyzO/cosmos/issues',
    icon: CircleDot,
    label: 'Issues',
    desc: 'Report a bug or ask for a component.',
  },
  {
    href: 'https://github.com/SckyzO/cosmos/releases',
    icon: Tag,
    label: 'Releases',
    desc: 'Each package release with its changelog.',
  },
];

const REQUESTS = [1820, 1940, 1880, 2050, 2210, 2140, 2290, 2380, 2310, 2420, 2390, 2460];

const AutoRefreshToggle = () => {
  const [on, setOn] = useState(true);
  return <Toggle checked={on} onChange={setOn} label="Auto-refresh" />;
};

const PreviewCard = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex min-h-[110px] min-w-0 flex-col gap-2.5 rounded-lg border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
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
    <span className="text-brand-600 dark:text-brand-400 font-mono text-[0.7rem] tracking-wide uppercase">
      Open template →
    </span>
  </a>
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

// The picker drives the same <html> class and attributes as the toolbar menus,
// so the whole page, live preview included, follows it. It starts from the
// toolbar's values and remounts when they change.
const ThemesShowcase = (initial: CosmosAppearance) => {
  const [appearance, setAppearance] = useState(initial);
  const update = (patch: Partial<CosmosAppearance>) => {
    const next = { ...appearance, ...patch };
    setAppearance(next);
    applyAppearance(next);
  };
  return (
    <div className="grid gap-6 rounded-lg border border-gray-200 bg-white p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] dark:border-gray-800 dark:bg-gray-900">
      <div className="space-y-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
          4 themes × 12 accent colors, with WCAG AA tokens in every pair. Plus six fonts and four
          text sizes.
        </p>
        <p>
          The theme is one class on <code>&lt;html&gt;</code>; the accent, the font and the text
          size are the <code>data-accent</code>, <code>data-font</code> and{' '}
          <code>data-text-size</code> attributes. Every component follows: pick one here and this
          page changes with it.
        </p>
        <p>
          Ship the picker with <code>AppearanceSettings</code> on a settings page, or{' '}
          <code>AppearanceMenu</code> behind an icon in a top bar.
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <a
            href="./?path=/story/foundations-appearance--default"
            className="text-brand-600 dark:text-brand-400 hover:underline"
          >
            Foundations/Appearance →
          </a>
          <a
            href="./?path=/story/settings-appearance-menu--in-topbar"
            className="text-brand-600 dark:text-brand-400 hover:underline"
          >
            Appearance menu →
          </a>
        </p>
      </div>
      <AppearanceSettings
        {...appearance}
        onThemeChange={(theme) => update({ theme })}
        onAccentChange={(accent) => update({ accent })}
        onFontChange={(font) => update({ font })}
        onTextSizeChange={(textSize) => update({ textSize })}
      />
    </div>
  );
};

const WelcomePage = ({
  appearance = { theme: 'dark', accent: 'blue' },
}: {
  appearance?: CosmosAppearance;
}) => (
  <div className="mx-auto max-w-[1180px] px-5 pb-16">
    {/* Hero: title + lead + CTAs */}
    <h1 className="mt-8 mb-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-gray-100">
      Cosmos design system
    </h1>
    <p className="max-w-prose text-base leading-relaxed text-gray-500 dark:text-gray-400">
      React 19 components, a Tailwind 4 theme and ApexCharts wrappers, built for dashboards and
      monitoring tools. Four themes and twelve accent colors, switched with a class and an attribute
      on <code>&lt;html&gt;</code>.
    </p>
    <div className="mt-6 flex flex-wrap gap-2.5">
      <a href="./?path=/docs/atoms-button--docs" className={`${CTA} ${CTA_VARIANT.primary}`}>
        Explore components
        <ArrowRight className="size-4" aria-hidden />
      </a>
      <a href="#get-started" className={`${CTA} ${CTA_VARIANT.secondary}`}>
        Get started
      </a>
      <a
        href="https://github.com/SckyzO/cosmos"
        target="_blank"
        rel="noreferrer"
        className={`${CTA} ${CTA_VARIANT.ghost}`}
      >
        <ExternalLink className="size-4" aria-hidden />
        View on GitHub
      </a>
    </div>

    {/* Appearance */}
    <section className="mt-12">
      <h2 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold tracking-widest text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
        Appearance
      </h2>
      <ThemesShowcase key={Object.values(appearance).join('-')} {...appearance} />
    </section>

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
          <div className="w-full">
            <CodeBlock language="bash" code="$ pnpm add @sckyzo/cosmos-react" />
          </div>
        </PreviewCard>
        <PreviewCard label="Toggle">
          <AutoRefreshToggle />
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
        <PreviewCard label="Sparkline">
          <div className="w-full">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-300">Requests/s</span>
              <span className="font-mono text-gray-500 dark:text-gray-400">2.4k</span>
            </div>
            <Sparkline data={REQUESTS} height={48} />
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
          desc="KPI cards, charts and status rows: the landing page of a monitoring app."
        />
        <TemplateCard
          href="./?path=/docs/pages-calendar--docs"
          icon={CalendarDays}
          title="Calendar"
          desc="Month view with colored events, a mini calendar and the next events."
        />
        <TemplateCard
          href="./?path=/docs/pages-activity--docs"
          icon={ActivityIcon}
          title="Activity"
          desc="Deploys, incidents and changes on an alternating timeline, grouped by day."
        />
        <TemplateCard
          href="./?path=/docs/pages-settings-screen--docs"
          icon={Settings}
          title="Settings"
          desc="Sections in tabs, each with its labels on the left and the form on the right."
        />
        <TemplateCard
          href="./?path=/docs/pages-profile--docs"
          icon={UserRound}
          title="Profile"
          desc="Account details, username and password, appearance and local storage."
        />
        <TemplateCard
          href="./?path=/docs/pages-doc-page--docs"
          icon={BookMarked}
          title="Doc page"
          desc="Documentation with a sidebar nav, the article and a table of contents."
        />
        <TemplateCard
          href="./?path=/docs/pages-blog-index--docs"
          icon={FileText}
          title="Blog"
          desc="Five blog section layouts for a landing page, with a matching post page."
        />
        <TemplateCard
          href="./?path=/docs/pages-stacked-shell--docs"
          icon={AppWindow}
          title="Stacked shell"
          desc="Top navbar, no sidebar, full-width content under a page header."
        />
      </div>
    </section>

    {/* Get started */}
    <section id="get-started" className="mt-12">
      <h2 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold tracking-widest text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
        Get started
      </h2>
      <div className="mb-3 space-y-3">
        <CodeBlock language="bash" code={INSTALL} />
        <CodeBlock language="css" code={APP_CSS} />
        <CodeBlock language="tsx" code={APP_TSX} />
      </div>
      <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
        Without the <code>@source</code> line Tailwind generates none of the classes the components
        use, and they render unstyled. With <code>@sckyzo/cosmos-charts</code>, add a second{' '}
        <code>@source</code> line for its <code>dist</code>.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        The theme is a class on <code>&lt;html&gt;</code> (none for light, <code>sand</code>,{' '}
        <code>dark</code> or <code>deep-blue</code>) and the accent a <code>data-accent</code>{' '}
        attribute: <code>&lt;html class=&quot;sand&quot; data-accent=&quot;teal&quot;&gt;</code>.
        Your app's theme switcher sets both. The toolbar's theme and accent menus do the same here,
        and{' '}
        <a
          href="./?path=/story/foundations-appearance--default"
          className="text-brand-600 dark:text-brand-400 hover:underline"
        >
          Foundations/Appearance
        </a>{' '}
        lets you try every combination from one page.
      </p>
    </section>

    {/* Packages */}
    <section className="mt-12">
      <h2 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold tracking-widest text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
        Packages
      </h2>
      <div className="grid gap-3.5 md:grid-cols-3">
        <PkgCard
          name="@sckyzo/cosmos-theme"
          version={`v${themePkg.version}`}
          what="Tailwind 4 tokens, CSS variables, 4 themes and 12 accents. Installed with cosmos-react."
          install="pnpm add @sckyzo/cosmos-theme"
        />
        <PkgCard
          name="@sckyzo/cosmos-react"
          version={`v${reactPkg.version}`}
          what="React 19 component library. Depends on the theme. Ships ESM, CJS and types."
          install="pnpm add @sckyzo/cosmos-react"
        />
        <PkgCard
          name="@sckyzo/cosmos-charts"
          version={`v${chartsPkg.version}`}
          what="ApexCharts wrappers that follow the Cosmos theme and accent. Optional, shipped separately."
          install="pnpm add @sckyzo/cosmos-charts"
        />
      </div>
    </section>

    {/* Resources */}
    <section className="mt-12">
      <h2 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold tracking-widest text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
        Resources
      </h2>
      <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-4">
        {RESOURCES.map(({ href, icon: Icon, label, desc }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3.5 transition hover:border-[var(--color-brand-500)] hover:no-underline dark:border-gray-800 dark:bg-gray-900"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--color-brand-500)_12%,transparent)] text-[var(--color-brand-500)]">
              <Icon size={16} aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-brand-600 dark:text-brand-400 text-sm font-semibold group-hover:underline">
                {label}
              </span>
              <span className="text-xs leading-snug text-gray-500 dark:text-gray-400">{desc}</span>
            </span>
          </a>
        ))}
      </div>
    </section>

    {/* All sidebar groups */}
    <section className="mt-12">
      <h2 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold tracking-widest text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
        All sidebar groups
      </h2>
      <Catalog />
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
  render: (_args, { globals }) => (
    <WelcomePage
      appearance={{
        theme: globals.theme || 'dark',
        accent: globals.accent || 'blue',
        font: globals.font || 'outfit',
        textSize: globals.textSize || 'md',
      }}
    />
  ),
};

// A fixed index, so the test doesn't depend on the stories that exist.
const FIXTURE: IndexEntry[] = [
  { id: 'welcome--default', title: 'Welcome', type: 'story' },
  { id: 'pages-dashboard--docs', title: 'Pages/Dashboard', type: 'docs' },
  { id: 'pages-dashboard--default', title: 'Pages/Dashboard', type: 'story' },
  { id: 'atoms-button--docs', title: 'Atoms/Button', type: 'docs' },
  { id: 'atoms-button--variants', title: 'Atoms/Button', type: 'story' },
  { id: 'atoms-button--states', title: 'Atoms/Button', type: 'story' },
  { id: 'atoms-badge--default', title: 'Atoms/Badge', type: 'story' },
];

/** The catalog groups the index in sidebar order and links each entry. Test only. */
export const CatalogFromIndex: Story = {
  tags: ['!dev'],
  render: () => <CatalogTable entries={FIXTURE} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('p')).toHaveTextContent(
      '3 entries and 4 stories across 2 groups'
    );
    const groups = canvas.getAllByRole('link', { name: /^(Pages|Atoms|Welcome)$/ });
    await expect(groups.map((a) => a.textContent)).toEqual(['Pages', 'Atoms']);
    // An entry links its docs page, or its first story when it has none.
    await expect(canvas.getByRole('link', { name: 'Button' })).toHaveAttribute(
      'href',
      './?path=/docs/atoms-button--docs'
    );
    await expect(canvas.getByRole('link', { name: 'Badge' })).toHaveAttribute(
      'href',
      './?path=/story/atoms-badge--default'
    );
    await expect(canvas.getByText('2 entries')).toBeVisible();
  },
};

/** Without the index, the catalog says so instead of showing an empty table. Test only. */
export const CatalogWithoutIndex: Story = {
  tags: ['!dev'],
  render: () => <CatalogTable entries="error" />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/couldn.t be loaded/)).toBeVisible();
  },
};
