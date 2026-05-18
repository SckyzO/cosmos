import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { ChevronRight, Pencil, Search, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Shell } from '../layout/Shell';
import { Navbar } from '../navigation/Navbar';
import { VerticalNavigation } from '../navigation/VerticalNavigation';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CodeBlock } from '../ui/CodeBlock';

// Pages/DocPage — component documentation template (RTFM).
// Style: Stripe Docs × Linear Docs × Tailwind Docs, dressed in Cosmos tokens.
// 3-col layout: left sidebar nav (VerticalNavigation) + center body + right TOC.

const meta = {
  title: 'Pages/Doc Page',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Reusable building blocks ────────────────────────────────────────────────

type DocSection = { id: string; label: string };

const docNavbar = () => (
  <Navbar theme="light">
    <Navbar.Brand>
      <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
        Cosmos
      </span>
      <Navbar.Items>
        <Navbar.Item theme="light" active href="#docs">
          Docs
        </Navbar.Item>
        <Navbar.Item theme="light" href="#components">
          Components
        </Navbar.Item>
        <Navbar.Item theme="light" href="#changelog">
          Changelog
        </Navbar.Item>
      </Navbar.Items>
    </Navbar.Brand>
    <Navbar.Actions>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      >
        <Search className="size-4" aria-hidden />
        Search…
        <kbd className="ml-2 rounded border border-[var(--color-border)] bg-[var(--color-bg-panel)] px-1.5 py-0.5 font-mono text-xs">
          ⌘K
        </kbd>
      </button>
    </Navbar.Actions>
  </Navbar>
);

const Breadcrumbs = ({ items }: { items: string[] }) => (
  <nav aria-label="Breadcrumb" className="text-sm">
    <ol className="flex items-center gap-x-1.5 text-[var(--color-text-secondary)]">
      {items.map((item, i) => (
        <li key={item} className="flex items-center gap-x-1.5">
          {i > 0 && <ChevronRight className="size-3.5 text-[var(--color-text-muted)]" aria-hidden />}
          <span
            className={
              i === items.length - 1
                ? 'font-medium text-[var(--color-text-primary)]'
                : 'hover:text-[var(--color-text-primary)]'
            }
          >
            {item}
          </span>
        </li>
      ))}
    </ol>
  </nav>
);

const useActiveSection = (ids: string[]) => {
  const [active, setActive] = useState<string>(ids[0] ?? '');
  useEffect(() => {
    if (ids.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
};

const SectionHeading = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2
    id={id}
    className="scroll-mt-24 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] [&_a.anchor]:opacity-0 hover:[&_a.anchor]:opacity-100"
  >
    {children}
    <a
      href={`#${id}`}
      aria-label={`Link to ${id}`}
      className="anchor ml-2 text-[var(--color-text-muted)] transition-opacity"
    >
      #
    </a>
  </h2>
);

const PropRow = ({
  name,
  type,
  defaultValue,
  description,
}: {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
}) => (
  <tr className="border-b border-[var(--color-border)] last:border-0">
    <td className="py-3 pr-4 align-top">
      <code className="font-mono text-sm font-medium text-[var(--color-text-primary)]">
        {name}
      </code>
    </td>
    <td className="py-3 pr-4 align-top">
      <code className="font-mono text-xs text-[var(--color-text-secondary)]">{type}</code>
    </td>
    <td className="py-3 pr-4 align-top">
      <code className="font-mono text-xs text-[var(--color-text-secondary)]">
        {defaultValue}
      </code>
    </td>
    <td className="py-3 align-top text-sm text-[var(--color-text-secondary)]">
      {description}
    </td>
  </tr>
);

// ── Sidebar nav (left rail) ─────────────────────────────────────────────────

type SidebarGroup = { label: string; items: { label: string; active?: boolean }[] };

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    label: 'Getting started',
    items: [
      { label: 'Installation' },
      { label: 'Theming' },
      { label: 'Tokens' },
      { label: 'Dark mode' },
    ],
  },
  {
    label: 'Components',
    items: [
      { label: 'Button', active: true },
      { label: 'Card' },
      { label: 'Dropdown' },
      { label: 'Modal' },
      { label: 'Drawer' },
      { label: 'Divider' },
    ],
  },
  {
    label: 'Recipes',
    items: [
      { label: 'Settings form' },
      { label: 'Dashboard layout' },
      { label: 'Empty states' },
    ],
  },
];

const DocSidebar = () => (
  <nav aria-label="Docs sidebar" className="space-y-6 px-4 py-6">
    {SIDEBAR_GROUPS.map((g) => (
      <div key={g.label}>
        <div className="px-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {g.label}
        </div>
        <ul role="list" className="-mx-2 mt-2 space-y-1">
          {g.items.map((it) => (
            <li key={it.label}>
              <a
                href="#"
                aria-current={it.active ? 'page' : undefined}
                className={[
                  'block rounded-md px-2 py-1.5 text-sm',
                  it.active
                    ? 'bg-[var(--color-bg-panel)] font-medium text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-panel)] hover:text-[var(--color-text-primary)]',
                ].join(' ')}
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </nav>
);

// ── TOC (right rail) ────────────────────────────────────────────────────────

const TocRail = ({ sections, active }: { sections: DocSection[]; active: string }) => (
  <nav aria-label="On this page" className="px-4 py-6">
    <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
      On this page
    </div>
    <ul role="list" className="mt-3 space-y-2 text-sm">
      {sections.map((s) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className={
              active === s.id
                ? 'font-medium text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }
          >
            {s.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

// ── Story body (Button doc — default story) ─────────────────────────────────

const BUTTON_SECTIONS: DocSection[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'variants', label: 'Variants' },
  { id: 'sizes', label: 'Sizes' },
  { id: 'with-icons', label: 'With icons' },
  { id: 'states', label: 'States' },
  { id: 'api', label: 'API' },
];

const PreviewBox = ({ children }: { children: React.ReactNode }) => (
  <Card padding="lg" className="not-prose">
    <div className="flex flex-wrap items-center gap-3">{children}</div>
  </Card>
);

const ButtonDocBody = () => {
  const active = useActiveSection(BUTTON_SECTIONS.map((s) => s.id));
  return (
    <div className="grid min-h-screen grid-cols-1 bg-[var(--color-bg-base)] lg:grid-cols-[260px_1fr_240px]">
      {/* Left sidebar */}
      <aside className="hidden border-r border-[var(--color-border)] lg:block">
        <div className="sticky top-0 max-h-screen overflow-y-auto">
          <DocSidebar />
        </div>
      </aside>

      {/* Center body */}
      <main className="min-w-0 px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs items={['Docs', 'Components', 'Button']} />

          <header className="mt-4">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Button
            </h1>
            <p className="mt-3 text-lg text-[var(--color-text-secondary)]">
              Trigger an action with a click. Use Button anywhere a user makes a
              binary commit — submit, cancel, delete, save.
            </p>
            <div className="mt-4 flex items-center gap-x-3 text-sm">
              <Badge variant="success">Stable</Badge>
              <span className="text-[var(--color-text-muted)]">·</span>
              <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                v1.0.0
              </span>
              <span className="text-[var(--color-text-muted)]">·</span>
              <span className="text-[var(--color-text-secondary)]">
                Source:{' '}
                <a href="#" className="text-brand-600 hover:underline dark:text-brand-400">
                  packages/react/src/ui/Button.tsx
                </a>
              </span>
            </div>
          </header>

          <div className="mt-12 space-y-12">
            <section>
              <SectionHeading id="overview">Overview</SectionHeading>
              <p className="mt-4 text-[var(--color-text-secondary)]">
                Buttons are the primary way users trigger actions in a Cosmos
                interface. Use the appropriate <code className="rounded bg-[var(--color-bg-panel)] px-1 py-0.5 font-mono text-sm">variant</code>{' '}
                to communicate intent, and pair it with the right{' '}
                <code className="rounded bg-[var(--color-bg-panel)] px-1 py-0.5 font-mono text-sm">size</code>{' '}
                for the surrounding layout density.
              </p>
              <div className="mt-6">
                <PreviewBox>
                  <Button>Save changes</Button>
                  <Button variant="secondary">Cancel</Button>
                </PreviewBox>
              </div>
              <div className="mt-4">
                <CodeBlock
                  language="tsx"
                  code={`<Button>Save changes</Button>
<Button variant="secondary">Cancel</Button>`}
                />
              </div>
            </section>

            <section>
              <SectionHeading id="variants">Variants</SectionHeading>
              <p className="mt-4 text-[var(--color-text-secondary)]">
                Five variants cover the visual hierarchy needed for a dashboard:
                primary, secondary, ghost, soft, and danger.
              </p>
              <div className="mt-6">
                <PreviewBox>
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="soft">Soft</Button>
                  <Button variant="danger">Danger</Button>
                </PreviewBox>
              </div>
            </section>

            <section>
              <SectionHeading id="sizes">Sizes</SectionHeading>
              <p className="mt-4 text-[var(--color-text-secondary)]">
                Five sizes (<code className="rounded bg-[var(--color-bg-panel)] px-1 py-0.5 font-mono text-sm">xs</code>,{' '}
                <code className="rounded bg-[var(--color-bg-panel)] px-1 py-0.5 font-mono text-sm">sm</code>,{' '}
                <code className="rounded bg-[var(--color-bg-panel)] px-1 py-0.5 font-mono text-sm">md</code>,{' '}
                <code className="rounded bg-[var(--color-bg-panel)] px-1 py-0.5 font-mono text-sm">lg</code>,{' '}
                <code className="rounded bg-[var(--color-bg-panel)] px-1 py-0.5 font-mono text-sm">xl</code>),
                matching TUI Plus.
              </p>
              <div className="mt-6">
                <PreviewBox>
                  <Button size="xs">xs</Button>
                  <Button size="sm">sm</Button>
                  <Button size="md">md</Button>
                  <Button size="lg">lg</Button>
                  <Button size="xl">xl</Button>
                </PreviewBox>
              </div>
            </section>

            <section>
              <SectionHeading id="with-icons">With icons</SectionHeading>
              <p className="mt-4 text-[var(--color-text-secondary)]">
                Pass a Lucide icon via{' '}
                <code className="rounded bg-[var(--color-bg-panel)] px-1 py-0.5 font-mono text-sm">icon</code>{' '}
                and choose its position with{' '}
                <code className="rounded bg-[var(--color-bg-panel)] px-1 py-0.5 font-mono text-sm">
                  iconPosition
                </code>
                .
              </p>
              <div className="mt-6">
                <PreviewBox>
                  <Button icon={ThumbsUp}>Like</Button>
                  <Button icon={ChevronRight} iconPosition="right">
                    Next
                  </Button>
                </PreviewBox>
              </div>
            </section>

            <section>
              <SectionHeading id="states">States</SectionHeading>
              <div className="mt-6">
                <PreviewBox>
                  <Button>Default</Button>
                  <Button disabled>Disabled</Button>
                  <Button loading>Loading</Button>
                </PreviewBox>
              </div>
            </section>

            <section>
              <SectionHeading id="api">API</SectionHeading>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      <th className="py-2 pr-4">Prop</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Default</th>
                      <th className="py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <PropRow
                      name="variant"
                      type="'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'"
                      defaultValue="'primary'"
                      description="Visual style; conveys hierarchy and intent."
                    />
                    <PropRow
                      name="size"
                      type="'xs' | 'sm' | 'md' | 'lg' | 'xl'"
                      defaultValue="'md'"
                      description="Height + horizontal padding + text size."
                    />
                    <PropRow
                      name="shape"
                      type="'rounded' | 'pill' | 'circle'"
                      defaultValue="'rounded'"
                      description="Corner radius. Use 'circle' for icon-only buttons."
                    />
                    <PropRow
                      name="icon"
                      type="ElementType"
                      defaultValue="—"
                      description="Lucide icon component."
                    />
                    <PropRow
                      name="iconPosition"
                      type="'left' | 'right'"
                      defaultValue="'left'"
                      description="Icon position relative to children."
                    />
                    <PropRow
                      name="loading"
                      type="boolean"
                      defaultValue="false"
                      description="Replace the icon with a spinner and disable clicks."
                    />
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Footer: helpfulness + edit on GitHub */}
          <footer className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-[var(--color-border)] pt-8 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
              <span>Was this helpful?</span>
              <Button size="xs" variant="secondary" icon={ThumbsUp} aria-label="Helpful" />
              <Button size="xs" variant="secondary" icon={ThumbsDown} aria-label="Not helpful" />
            </div>
            <a
              href="#edit"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <Pencil className="size-4" aria-hidden />
              Edit this page on GitHub
            </a>
          </footer>
        </div>
      </main>

      {/* Right TOC */}
      <aside className="hidden border-l border-[var(--color-border)] xl:block">
        <div className="sticky top-0 max-h-screen overflow-y-auto">
          <TocRail sections={BUTTON_SECTIONS} active={active} />
        </div>
      </aside>
    </div>
  );
};

// ── Story exports ───────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <Shell topbar={docNavbar() as never}>
      <ButtonDocBody />
    </Shell>
  ),
};

// Variant 2 — single column (no sidebar, no TOC). For mobile previews or
// standalone "deep dive" pages.
export const WithoutSidebar: Story = {
  render: () => (
    <Shell topbar={docNavbar() as never}>
      <div className="bg-[var(--color-bg-base)] px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs items={['Docs', 'Components', 'Button']} />
          <header className="mt-4">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Button
            </h1>
            <p className="mt-3 text-lg text-[var(--color-text-secondary)]">
              Standalone documentation page without left sidebar or TOC. Useful
              for mobile screens or deep-dive articles.
            </p>
            <div className="mt-4 flex items-center gap-x-3 text-sm">
              <Badge variant="success">Stable</Badge>
              <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                v1.0.0
              </span>
            </div>
          </header>
          <div className="mt-10">
            <PreviewBox>
              <Button>Save changes</Button>
              <Button variant="secondary">Cancel</Button>
            </PreviewBox>
          </div>
          <div className="mt-4">
            <CodeBlock
              language="tsx"
              code={`<Button>Save changes</Button>
<Button variant="secondary">Cancel</Button>`}
            />
          </div>
        </div>
      </div>
    </Shell>
  ),
};

// Variant 3 — changelog timeline. Demonstrates the same doc shell hosting a
// chronological list of releases (date + version + diff bullets).
type Release = {
  version: string;
  date: string;
  added: string[];
  changed?: string[];
  fixed?: string[];
};

const RELEASES: Release[] = [
  {
    version: '1.1.0',
    date: '2026-05-18',
    added: [
      'New `Combobox` component with keyboard navigation',
      'New `ActivityFeed` and `GridList` list patterns',
      'Doc page template (this very page)',
    ],
    changed: ['`Button` gains `xs` and `xl` sizes plus `soft` variant'],
    fixed: ['`Modal.Alert` horizontal layout grays out properly in dark mode'],
  },
  {
    version: '1.0.0',
    date: '2026-05-12',
    added: [
      '80+ React components covering Tailwind UI Plus / Application UI',
      'Tokenised theme with light + dark + OLED variants',
      'Storybook 10 with vitest browser-mode test runner',
    ],
  },
  {
    version: '0.9.0',
    date: '2026-04-28',
    added: ['Cosmos enters public beta'],
    changed: ['Package renamed `@sckyzo/cosmos-react`'],
  },
];

export const Changelog: Story = {
  render: () => (
    <Shell topbar={docNavbar() as never}>
      <div className="bg-[var(--color-bg-base)]">
        <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
          <Breadcrumbs items={['Docs', 'Changelog']} />
          <header className="mt-4">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Changelog
            </h1>
            <p className="mt-3 text-lg text-[var(--color-text-secondary)]">
              Every release of Cosmos, what shipped, what changed, what we fixed.
            </p>
          </header>

          <div className="mt-12 space-y-12">
            {RELEASES.map((r) => (
              <article key={r.version} className="border-l-2 border-[var(--color-border)] pl-6">
                <div className="flex items-baseline gap-x-3">
                  <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                    v{r.version}
                  </h2>
                  <time
                    dateTime={r.date}
                    className="font-mono text-xs text-[var(--color-text-secondary)]"
                  >
                    {r.date}
                  </time>
                </div>
                {r.added.length > 0 && (
                  <div className="mt-4">
                    <Badge variant="success" size="sm">
                      Added
                    </Badge>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-text-secondary)]">
                      {r.added.map((i) => <li key={i}>{i}</li>)}
                    </ul>
                  </div>
                )}
                {r.changed && r.changed.length > 0 && (
                  <div className="mt-4">
                    <Badge variant="info" size="sm">
                      Changed
                    </Badge>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-text-secondary)]">
                      {r.changed.map((i) => <li key={i}>{i}</li>)}
                    </ul>
                  </div>
                )}
                {r.fixed && r.fixed.length > 0 && (
                  <div className="mt-4">
                    <Badge variant="warning" size="sm">
                      Fixed
                    </Badge>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-text-secondary)]">
                      {r.fixed.map((i) => <li key={i}>{i}</li>)}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  ),
};
