import {
  ArrowRight,
  Contrast,
  FolderGit2,
  Keyboard,
  Languages,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import {
  AlertBanner,
  Button,
  CodeBlock,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../../../../packages/react/src';
import chartsPkg from '../../../../packages/charts/package.json';
import reactPkg from '../../../../packages/react/package.json';
import themePkg from '../../../../packages/theme/package.json';
import { figuresOf, recipeHref, type CatalogComponent } from './catalog';
import { Code, Section } from './parts';
import { CARD, MONO, PAGE, TEXT_LINK, cx } from './styles';

export const REPO = 'https://github.com/SckyzO/cosmos';

// ── Examples ─────────────────────────────────────────────────────────────────

// A block of a schematic thumbnail: the shape of the screen, drawn with plain boxes.
const Block = ({ className, warn = false }: { className: string; warn?: boolean }) => (
  <span
    className={cx(
      'block rounded-sm',
      warn ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600',
      className
    )}
  />
);

const THUMB = {
  'App Shell': (
    <span className="flex h-full gap-1.5">
      <Block className="w-5 shrink-0" />
      <span className="flex flex-1 flex-col gap-1.5">
        <Block className="h-2.5" />
        <Block className="h-full opacity-60" />
      </span>
    </span>
  ),
  List: (
    <span className="flex h-full flex-col gap-1">
      {[0, 1, 2, 3, 4].map((row) => (
        <Block key={row} className="h-full" />
      ))}
    </span>
  ),
  Detail: (
    <span className="flex h-full flex-col gap-1.5">
      <Block className="h-2.5 w-2/3" />
      <span className="flex flex-1 gap-1.5">
        <Block className="flex-[2] opacity-60" />
        <Block className="flex-1" />
      </span>
    </span>
  ),
  Settings: (
    <span className="flex h-full gap-1.5">
      <span className="flex w-5 shrink-0 flex-col gap-1">
        {[0, 1, 2].map((link) => (
          <Block key={link} className="h-1.5" />
        ))}
      </span>
      <span className="flex flex-1 flex-col gap-1">
        {[0, 1, 2].map((field) => (
          <Block key={field} className="h-full opacity-60" />
        ))}
      </span>
    </span>
  ),
  Dashboard: (
    <span className="flex h-full flex-col gap-1.5">
      <span className="flex h-3.5 gap-1.5">
        {[0, 1, 2].map((tile) => (
          <Block key={tile} className="h-full flex-1" />
        ))}
      </span>
      <Block className="h-full opacity-60" />
    </span>
  ),
  Monitoring: (
    <span className="grid h-full grid-cols-8 gap-0.5">
      {Array.from({ length: 24 }, (_, cell) => (
        <Block key={cell} className="h-full" warn={cell % 7 === 3} />
      ))}
    </span>
  ),
};

type Recipe = { name: keyof typeof THUMB; domain: string };

// The recipes in sidebar order. Their story ids come from the index.
const RECIPES: Recipe[] = [
  { name: 'App Shell', domain: 'Lumen, a project workspace: sidebar, top bar, notifications' },
  { name: 'List', domain: "Folio & Co, a bookshop's orders on a DataTable" },
  { name: 'Detail', domain: 'Relay Desk, a support ticket with its thread and history' },
  { name: 'Settings', domain: 'Granite, a climbing gym network: one long page with anchors' },
  { name: 'Dashboard', domain: 'Harvest Box, meal-kit subscriptions: KPIs and charts' },
  { name: 'Monitoring', domain: 'Rackwatch, an HPC cluster: health, logs, live charts' },
];

// Without the index, the id Storybook gives the recipe's Content story.
const fallbackHref = (name: string) =>
  `./?path=/story/examples-${name.toLowerCase().replace(/\s+/g, '-')}--content`;

const hrefOf = (components: CatalogComponent[] | null, group: string, name: string) =>
  components?.find((c) => c.group === group && c.name === name)?.href;

export const Examples = ({ components }: { components: CatalogComponent[] | null }) => (
  <Section
    id="examples"
    eyebrow="Start from a screen"
    title="Six screens, each in every state"
    lead="Content, empty, loading, error, extreme content and phone. Copy one to start a screen of your own."
  >
    <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {RECIPES.map(({ name, domain }) => (
        <li key={name} className="min-w-0">
          <a
            href={(components && recipeHref(components, name)) ?? fallbackHref(name)}
            className={cx(
              CARD,
              'focus-visible:focus-indicator group flex h-full gap-4 p-3.5 transition-colors hover:border-[var(--color-brand-500)] hover:no-underline max-sm:flex-row sm:flex-col'
            )}
          >
            <span
              aria-hidden
              className="h-20 w-24 shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] p-2 sm:h-24 sm:w-full"
            >
              {THUMB[name]}
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-brand-600 dark:text-brand-400 text-base font-semibold group-hover:underline">
                {name}
              </span>
              <span className="text-sm leading-snug text-[var(--color-text-secondary)]">
                {domain}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
    <p className="mt-5 text-sm text-[var(--color-text-secondary)]">
      Also under Examples: the{' '}
      <a
        href={hrefOf(components, 'Examples', 'Auth / Sign In Form') ?? fallbackHref('Auth')}
        className={TEXT_LINK}
      >
        sign-in, sign-up, password reset and two-step forms
      </a>
      , and{' '}
      <a
        href={hrefOf(components, 'Examples', 'Error Page') ?? fallbackHref('Error Page')}
        className={TEXT_LINK}
      >
        the error page
      </a>
      .
    </p>
  </Section>
);

// ── Get started ──────────────────────────────────────────────────────────────

// Same setup as the cosmos-react README ("Set up the styles").
const INSTALL = 'pnpm add @sckyzo/cosmos-theme @sckyzo/cosmos-react';

const APP_CSS = `/* app.css */
@import 'tailwindcss';

/* Required: let Tailwind scan the components for their classes.
   The path is relative to this file. */
@source '../node_modules/@sckyzo/cosmos-react/dist/**/*.{js,cjs}';

@import '@sckyzo/cosmos-theme/tailwind';
@import '@sckyzo/cosmos-theme/vars';
@import '@sckyzo/cosmos-theme/fonts';`;

const APP_TSX = `import { Button } from '@sckyzo/cosmos-react';

export default () => <Button>Hello Cosmos</Button>;`;

const peers = reactPkg.peerDependencies as Record<string, string>;
// What a consumer installs for an entry, with the range the package asks for.
const peer = (name: string) => `${name} ${peers[name]}`;

type Entry = { name: string; holds: string; install: string };

const entriesOf = (charts: number | null): Entry[] => [
  {
    name: '@sckyzo/cosmos-react',
    holds: 'Every component',
    install: `react, react-dom ${peers['react']}`,
  },
  {
    name: '@sckyzo/cosmos-react/code',
    holds: 'CodeBlock with syntax highlighting',
    install: peer('shiki'),
  },
  {
    name: '@sckyzo/cosmos-react/editor',
    holds: 'RichTextEditor',
    install: `${peer('@tiptap/react')} and its kin`,
  },
  {
    name: '@sckyzo/cosmos-react/map',
    holds: 'MapView, MapMarkerList',
    install: peer('maplibre-gl'),
  },
  {
    name: '@sckyzo/cosmos-charts',
    holds: `${charts === null ? 'The' : charts} chart wrappers drawn with Recharts`,
    install: 'nothing more: Recharts comes with it',
  },
];

const Step = ({ n, title, children }: { n: number; title: string; children: ReactNode }) => (
  <li className="min-w-0">
    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
      <span
        aria-hidden
        className="bg-brand-500 flex size-6 items-center justify-center rounded-full text-xs text-white"
      >
        {n}
      </span>
      {title}
    </p>
    {children}
  </li>
);

export const GetStarted = ({ components }: { components: CatalogComponent[] | null }) => {
  const entries = entriesOf(components && figuresOf(components).charts);
  return (
    <Section id="get-started" eyebrow="Get started" title="Three steps to a styled button">
      <ol className="grid gap-5 lg:grid-cols-3">
        <Step n={1} title="Install">
          <CodeBlock wrap language="bash" code={INSTALL} />
        </Step>
        <Step n={2} title="Import the theme">
          <CodeBlock wrap language="css" code={APP_CSS} />
        </Step>
        <Step n={3} title="Use a component">
          <CodeBlock wrap language="tsx" code={APP_TSX} />
        </Step>
      </ol>
      <p className="mt-4 max-w-prose text-sm text-[var(--color-text-secondary)]">
        Without the <Code>@source</Code> line Tailwind generates none of the classes the components
        use, and they render unstyled. With <Code>@sckyzo/cosmos-charts</Code>, add a second{' '}
        <Code>@source</Code> line for its <Code>dist</Code>.
      </p>
      <div className={cx(CARD, 'mt-8 p-5')}>
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
          What each import brings
        </h3>
        <p className="mt-0.5 mb-4 text-sm text-[var(--color-text-secondary)]">
          The heavy libraries stay optional.
        </p>
        <div className="max-sm:hidden">
          <Table aria-label="What each import brings">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Import</TableHeaderCell>
                <TableHeaderCell>Holds</TableHeaderCell>
                <TableHeaderCell>You install</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.name}>
                  <TableCell>
                    <span className="font-mono text-xs">{entry.name}</span>
                  </TableCell>
                  <TableCell>{entry.holds}</TableCell>
                  <TableCell>{entry.install}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* On a phone a three-column table is mostly scrolling: each import is a line of its own. */}
        <dl className="space-y-3 sm:hidden">
          {entries.map((entry) => (
            <div key={entry.name}>
              <dt className="font-mono text-xs break-all text-[var(--color-text-primary)]">
                {entry.name}
              </dt>
              <dd className="text-sm text-[var(--color-text-secondary)]">
                {entry.holds} · install {entry.install}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
};

// ── What's new ───────────────────────────────────────────────────────────────

const NEWS = [
  {
    title: 'Density',
    text: (
      <>
        Compact, default and comfortable rows and controls, from <Code>data-density</Code>.
      </>
    ),
  },
  {
    title: 'Right to left',
    text: (
      <>
        Every component mirrors under <Code>dir=&quot;rtl&quot;</Code>, and every story is tested
        both ways.
      </>
    ),
  },
  {
    title: 'Corner radius',
    text: (
      <>
        From square to round with <Code>data-radius</Code>, every corner on one scale.
      </>
    ),
  },
  { title: 'Customizer', text: 'A side panel with every appearance setting, ready for your app.' },
  { title: 'Shell layouts', text: 'A boxed 1440px column and a compact 88px sidebar rail.' },
  {
    title: 'Monitoring',
    text: 'JobLog, MonitorRow, uptime bars and stats, a heartbeat bar, and a stale state.',
  },
  { title: 'Editor and maps', text: 'RichTextEditor and MapView, each in an entry of its own.' },
  { title: 'Examples', text: 'Six screen recipes replace the old example pages.' },
];

// Cards shown at first on a phone; the others wait behind a button.
const NEWS_FIRST = 4;

export const WhatsNew = () => {
  const [all, setAll] = useState(false);
  const listId = useId();
  const others = NEWS.length - NEWS_FIRST;
  return (
    <Section
      id="new"
      eyebrow="What's new in 0.4.0"
      title="Density, both reading directions, corners and a Customizer"
      action={
        <a href={`${REPO}/releases`} target="_blank" rel="noreferrer" className={TEXT_LINK}>
          Full release notes <ArrowRight aria-hidden className="inline size-4 rtl:rotate-180" />
        </a>
      }
    >
      <ul id={listId} className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {NEWS.map((item, i) => (
          <li
            key={item.title}
            className={cx(CARD, 'p-4', i >= NEWS_FIRST && !all && 'max-sm:hidden')}
          >
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.text}</p>
          </li>
        ))}
      </ul>
      <Button
        variant="secondary"
        size="sm"
        className="mt-3 sm:hidden"
        aria-expanded={all}
        aria-controls={listId}
        onClick={() => setAll(!all)}
      >
        {all ? 'Show fewer' : `Show the ${others} others`}
      </Button>
      <AlertBanner intent="info" title="Coming from 0.3?" className="mt-6">
        Props and values that named a side now say start and end: <Code>side=&quot;left&quot;</Code>{' '}
        becomes <Code>side=&quot;start&quot;</Code>, <Code>rightSlot</Code> becomes{' '}
        <Code>endSlot</Code>. The release notes list each one.
      </AlertBanner>
    </Section>
  );
};

// ── How it is checked ────────────────────────────────────────────────────────

const CHECKS: { icon: LucideIcon; title: string; text: ReactNode }[] = [
  {
    icon: ShieldCheck,
    title: 'axe on every story.',
    text: 'An accessibility violation fails the build.',
  },
  {
    icon: Contrast,
    title: 'Contrast in three themes.',
    text: 'Light, sand and deep blue, on every story.',
  },
  {
    icon: Languages,
    title: 'Right to left.',
    text: (
      <>
        Every story again with <Code>dir=&quot;rtl&quot;</Code>, with no sideways scroll.
      </>
    ),
  },
  {
    icon: Keyboard,
    title: 'Keyboard first.',
    text: 'Interaction tests cover focus, arrows and Escape.',
  },
];

export const Quality = () => (
  <Section id="quality" eyebrow="How it is checked" title="Tested the way you will use it">
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {CHECKS.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex gap-3">
          <span className="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Icon aria-hidden className="size-5" />
          </span>
          <p className="text-sm text-[var(--color-text-secondary)]">
            <b className="font-semibold text-[var(--color-text-primary)]">{title}</b> {text}
          </p>
        </li>
      ))}
    </ul>
  </Section>
);

// ── Footer ───────────────────────────────────────────────────────────────────

const PACKAGES = [
  {
    name: '@sckyzo/cosmos-theme',
    version: themePkg.version,
    what: 'Tailwind 4 tokens and CSS variables: themes, accents, fonts, density, radius. Installed with cosmos-react.',
  },
  {
    name: '@sckyzo/cosmos-react',
    version: reactPkg.version,
    what: 'React 19 components. ESM, CJS and types, with optional code, editor and map entries.',
  },
  {
    name: '@sckyzo/cosmos-charts',
    version: chartsPkg.version,
    what: 'Chart wrappers drawn with Recharts that follow the theme and accent. Optional, shipped apart.',
  },
];

const RESOURCES = [
  { href: REPO, label: 'Repository' },
  { href: `${REPO}/blob/main/CONTRIBUTING.md`, label: 'Contributing' },
  { href: `${REPO}/issues`, label: 'Issues' },
  { href: `${REPO}/releases`, label: 'Releases' },
];

export const Footer = () => (
  <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-panel)] py-10">
    <div className={PAGE}>
      <ul className="grid gap-3.5 md:grid-cols-3">
        {PACKAGES.map((pkg) => (
          <li key={pkg.name} className={cx(CARD, 'flex flex-col gap-2 p-4')}>
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-sm font-semibold break-all text-[var(--color-text-primary)]">
                {pkg.name}
              </span>
              <span className={cx(MONO, 'text-[var(--color-text-secondary)]')}>v{pkg.version}</span>
            </span>
            <span className="text-sm text-[var(--color-text-secondary)]">{pkg.what}</span>
          </li>
        ))}
      </ul>
      <nav
        aria-label="Resources"
        className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
      >
        <FolderGit2 aria-hidden className="size-4 text-[var(--color-text-secondary)]" />
        {RESOURCES.map(({ href, label }) => (
          <a key={label} href={href} target="_blank" rel="noreferrer" className={TEXT_LINK}>
            {label}
          </a>
        ))}
      </nav>
    </div>
  </footer>
);
