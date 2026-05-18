import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import {
  Box,
  ChevronRight,
  Component,
  Layers,
  MousePointerClick,
  Package,
  Palette,
  Pencil,
  Rocket,
  Search,
  Settings as SettingsIcon,
  Square,
  ThumbsDown,
  ThumbsUp,
  Type,
} from 'lucide-react';
import { Shell } from '../layout/Shell';
import { Divider } from '../layout/Divider';
import { MediaObject } from '../layout/MediaObject';
import { Navbar } from '../navigation/Navbar';
import { Stepper } from '../navigation/Stepper';
import { VerticalNavigation } from '../navigation/VerticalNavigation';
import { DescriptionList } from '../data/DescriptionList';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CodeBlock } from '../ui/CodeBlock';
import { IconBox } from '../ui/IconBox';

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

// ── Sidebar nav (left rail, built on VerticalNavigation) ────────────────────

const DocSidebar = () => (
  <VerticalNavigation className="px-4 py-6" aria-label="Docs sidebar">
    <VerticalNavigation.Section label="Getting started">
      <VerticalNavigation.Item icon={Rocket} href="#install">
        Installation
      </VerticalNavigation.Item>
      <VerticalNavigation.Item icon={Palette} href="#theming">
        Theming
      </VerticalNavigation.Item>
      <VerticalNavigation.Item icon={Type} href="#tokens">
        Tokens
      </VerticalNavigation.Item>
      <VerticalNavigation.Item icon={SettingsIcon} href="#dark">
        Dark mode
      </VerticalNavigation.Item>
    </VerticalNavigation.Section>
    <VerticalNavigation.Section label="Components">
      <VerticalNavigation.Item icon={MousePointerClick} active href="#button">
        Button
      </VerticalNavigation.Item>
      <VerticalNavigation.Item icon={Square} href="#card">
        Card
      </VerticalNavigation.Item>
      <VerticalNavigation.Item icon={Layers} href="#dropdown">
        Dropdown
      </VerticalNavigation.Item>
      <VerticalNavigation.Item icon={Box} href="#modal" badge="new">
        Modal
      </VerticalNavigation.Item>
      <VerticalNavigation.Item icon={Package} href="#drawer">
        Drawer
      </VerticalNavigation.Item>
      <VerticalNavigation.Item icon={Component} href="#divider">
        Divider
      </VerticalNavigation.Item>
    </VerticalNavigation.Section>
  </VerticalNavigation>
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
  { id: 'install', label: 'Install' },
  { id: 'overview', label: 'Overview' },
  { id: 'variants', label: 'Variants' },
  { id: 'anatomy', label: 'Anatomy' },
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
            <div className="flex items-center gap-x-3">
              <IconBox
                icon={MousePointerClick}
                size="lg"
                bg="bg-brand-500/10 dark:bg-brand-500/15"
                color="text-brand-600 dark:text-brand-400"
              />
              <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Button
              </h1>
            </div>
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
              <SectionHeading id="install">Install</SectionHeading>
              <p className="mt-4 text-[var(--color-text-secondary)]">
                Three steps to drop Button into a Cosmos-powered app.
              </p>
              <div className="mt-6">
                <Stepper variant="panels" current={1}>
                  <Stepper.Step description="pnpm add @sckyzo/cosmos-react">
                    Install the package
                  </Stepper.Step>
                  <Stepper.Step description="Make sure the Tailwind preset is loaded">
                    Import the theme
                  </Stepper.Step>
                  <Stepper.Step description="<Button>Save</Button>">
                    Render anywhere
                  </Stepper.Step>
                </Stepper>
              </div>
            </section>

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
              <SectionHeading id="anatomy">Anatomy</SectionHeading>
              <p className="mt-4 text-[var(--color-text-secondary)]">
                Three internal slots compose every Button: a leading or trailing
                icon, a label, and an optional loading spinner that replaces the
                icon when <code className="rounded bg-[var(--color-bg-panel)] px-1 py-0.5 font-mono text-sm">loading</code>{' '}
                is true.
              </p>
              <Card padding="lg" className="mt-6 space-y-5">
                <MediaObject align="center">
                  <MediaObject.Image>
                    <IconBox
                      icon={Box}
                      size="md"
                      bg="bg-emerald-500/10 dark:bg-emerald-500/15"
                      color="text-emerald-600 dark:text-emerald-400"
                    />
                  </MediaObject.Image>
                  <MediaObject.Body>
                    <MediaObject.Title>Container</MediaObject.Title>
                    <MediaObject.Description>
                      A <code className="font-mono text-xs">button</code> element
                      with rounded corners, padding from the size prop, and
                      colors from the variant.
                    </MediaObject.Description>
                  </MediaObject.Body>
                </MediaObject>
                <MediaObject align="center">
                  <MediaObject.Image>
                    <IconBox
                      icon={ThumbsUp}
                      size="md"
                      bg="bg-amber-500/10 dark:bg-amber-500/15"
                      color="text-amber-600 dark:text-amber-400"
                    />
                  </MediaObject.Image>
                  <MediaObject.Body>
                    <MediaObject.Title>Icon slot</MediaObject.Title>
                    <MediaObject.Description>
                      Pass any Lucide icon component via{' '}
                      <code className="font-mono text-xs">icon</code>; place it
                      left or right with{' '}
                      <code className="font-mono text-xs">iconPosition</code>.
                    </MediaObject.Description>
                  </MediaObject.Body>
                </MediaObject>
                <MediaObject align="center">
                  <MediaObject.Image>
                    <IconBox
                      icon={Type}
                      size="md"
                      bg="bg-sky-500/10 dark:bg-sky-500/15"
                      color="text-sky-600 dark:text-sky-400"
                    />
                  </MediaObject.Image>
                  <MediaObject.Body>
                    <MediaObject.Title>Label</MediaObject.Title>
                    <MediaObject.Description>
                      Children render as the visible label. Keep it short and
                      action-oriented — verbs over nouns.
                    </MediaObject.Description>
                  </MediaObject.Body>
                </MediaObject>
              </Card>
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
              <div className="mt-6">
                <DescriptionList
                  inCard
                  title="Props"
                  description="Every prop is optional except children."
                >
                  <DescriptionList.Item label={<code className="font-mono">variant</code>}>
                    <code className="font-mono text-xs">
                      &apos;primary&apos; | &apos;secondary&apos; | &apos;ghost&apos; |
                      &apos;danger&apos; | &apos;soft&apos;
                    </code>
                    <span className="block text-[var(--color-text-muted)]">
                      Default <code className="font-mono">&apos;primary&apos;</code> · Visual style
                      conveying hierarchy and intent.
                    </span>
                  </DescriptionList.Item>
                  <DescriptionList.Item label={<code className="font-mono">size</code>}>
                    <code className="font-mono text-xs">
                      &apos;xs&apos; | &apos;sm&apos; | &apos;md&apos; | &apos;lg&apos; |
                      &apos;xl&apos;
                    </code>
                    <span className="block text-[var(--color-text-muted)]">
                      Default <code className="font-mono">&apos;md&apos;</code> · Height, padding
                      and text size.
                    </span>
                  </DescriptionList.Item>
                  <DescriptionList.Item label={<code className="font-mono">shape</code>}>
                    <code className="font-mono text-xs">
                      &apos;rounded&apos; | &apos;pill&apos; | &apos;circle&apos;
                    </code>
                    <span className="block text-[var(--color-text-muted)]">
                      Default <code className="font-mono">&apos;rounded&apos;</code> · Use
                      <code className="font-mono">&apos;circle&apos;</code> for icon-only buttons.
                    </span>
                  </DescriptionList.Item>
                  <DescriptionList.Item label={<code className="font-mono">icon</code>}>
                    <code className="font-mono text-xs">ElementType</code>
                    <span className="block text-[var(--color-text-muted)]">
                      Any Lucide icon component.
                    </span>
                  </DescriptionList.Item>
                  <DescriptionList.Item label={<code className="font-mono">iconPosition</code>}>
                    <code className="font-mono text-xs">&apos;left&apos; | &apos;right&apos;</code>
                    <span className="block text-[var(--color-text-muted)]">
                      Default <code className="font-mono">&apos;left&apos;</code>.
                    </span>
                  </DescriptionList.Item>
                  <DescriptionList.Item label={<code className="font-mono">loading</code>}>
                    <code className="font-mono text-xs">boolean</code>
                    <span className="block text-[var(--color-text-muted)]">
                      Default <code className="font-mono">false</code> · Replaces the icon with a
                      spinner and disables clicks.
                    </span>
                  </DescriptionList.Item>
                </DescriptionList>
              </div>
            </section>
          </div>

          <Divider.Row
            className="mt-16"
            title="Was this helpful?"
            actions={
              <>
                <Button size="xs" variant="secondary" icon={ThumbsUp} aria-label="Helpful" />
                <Button size="xs" variant="secondary" icon={ThumbsDown} aria-label="Not helpful" />
              </>
            }
          />

          {/* Footer: edit on GitHub */}
          <footer className="mt-6 flex items-center justify-end text-sm">
            <a
              href="#edit"
              className="inline-flex items-center gap-2 font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
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
