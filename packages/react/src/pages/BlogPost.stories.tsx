import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Link as LinkIcon,
  User,
} from 'lucide-react';
import { Shell } from '../layout/Shell';
import { Navbar } from '../navigation/Navbar';
import { ContentNarrow } from '../templates/ContentNarrow';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CodeBlock } from '../ui/CodeBlock';
import { GridList } from '../lists/GridList';

// Pages/BlogPost — refined article reading template.
// Composed exclusively from Cosmos primitives + tokens.
// Three variants: Default (hero image + sticky TOC), Minimal (text-only short),
// WithoutHeroImage (text-first, no top image).

const meta = {
  title: 'Pages/Blog Post',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Hooks ────────────────────────────────────────────────────────────────────

const useReadingProgress = () => {
  useEffect(() => {
    const target =
      (document.querySelector('main.flex-1.overflow-auto') as HTMLElement | null) ??
      document.documentElement;
    const update = () => {
      const max = target.scrollHeight - target.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, target.scrollTop / max)) : 0;
      document.documentElement.style.setProperty('--cosmos-post-p', String(p));
    };
    target.addEventListener('scroll', update, { passive: true });
    update();
    return () => target.removeEventListener('scroll', update);
  }, []);
};

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

// ── Shared building blocks ───────────────────────────────────────────────────

const BLOG_POST_CSS = `
.cosmos-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--color-brand, rgb(99 102 241));
  transform-origin: left;
  transform: scaleX(var(--cosmos-post-p, 0));
  transition: transform 90ms linear;
  z-index: 60;
}
.cosmos-anchor {
  margin-left: 0.4em;
  color: var(--color-text-muted);
  opacity: 0;
  transition: opacity 150ms ease;
  text-decoration: none;
}
h2:hover > .cosmos-anchor { opacity: 1; }
`;

const blogNavbar = () => (
  <Navbar theme="light">
    <Navbar.Brand>
      <a
        href="#"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to blog
      </a>
    </Navbar.Brand>
    <Navbar.Actions>
      <a
        href="#"
        className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      >
        RSS
      </a>
    </Navbar.Actions>
  </Navbar>
);

type Section = { id: string; label: string };

const SectionHeading = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2
    id={id}
    className="scroll-mt-24 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]"
  >
    {children}
    <a href={`#${id}`} aria-label={`Link to ${id}`} className="cosmos-anchor">
      #
    </a>
  </h2>
);

const ArticleMeta = ({
  author,
  date,
  readTime,
}: {
  author: string;
  date: string;
  readTime: string;
}) => (
  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-[var(--color-text-secondary)]">
    <span className="inline-flex items-center gap-1.5">
      <User className="size-4" aria-hidden /> {author}
    </span>
    <span className="inline-flex items-center gap-1.5">
      <Calendar className="size-4" aria-hidden />
      <time dateTime={date}>{date}</time>
    </span>
    <span className="inline-flex items-center gap-1.5">
      <Clock className="size-4" aria-hidden /> {readTime}
    </span>
  </div>
);

const ShareRow = () => (
  <div className="flex items-center gap-3 text-sm">
    <span className="text-[var(--color-text-secondary)]">Share</span>
    <button
      type="button"
      onClick={() => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
    >
      <LinkIcon className="size-3.5" aria-hidden /> Copy link
    </button>
  </div>
);

type Author = {
  name: string;
  role: string;
  img: string;
  bio: string;
};

const AuthorCard = ({ author }: { author: Author }) => (
  <Card padding="lg">
    <div className="flex items-start gap-4">
      <img
        alt=""
        src={author.img}
        className="size-14 shrink-0 rounded-full bg-gray-100"
      />
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
          Written by
        </div>
        <p className="mt-1 text-base font-semibold text-[var(--color-text-primary)]">
          {author.name}
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">{author.role}</p>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{author.bio}</p>
        <a
          href="#"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          Read more from {author.name.split(' ')[0]}
          <ArrowRight className="size-3.5" aria-hidden />
        </a>
      </div>
    </div>
  </Card>
);

type RelatedPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tag: string;
  cover: string;
};

const RELATED: RelatedPost[] = [
  {
    slug: 'releasing-cosmos-1-0',
    title: 'Releasing Cosmos 1.0 — a design system for monitoring',
    excerpt: 'After six months in private beta, Cosmos hits 1.0 with 80+ components.',
    date: 'May 18, 2026',
    tag: 'Release',
    cover: 'https://picsum.photos/seed/related-1/800/500',
  },
  {
    slug: 'tailwind-4-token-bridge',
    title: 'Bridging Tailwind 4 themes and CSS variables',
    excerpt: 'One set of design tokens, two consumers (utilities + runtime).',
    date: 'May 2, 2026',
    tag: 'Theming',
    cover: 'https://picsum.photos/seed/related-2/800/500',
  },
  {
    slug: 'monitoring-as-design',
    title: 'Monitoring is a design problem first',
    excerpt: 'Why most monitoring UIs feel hostile, and how to fix it.',
    date: 'Apr 25, 2026',
    tag: 'Opinion',
    cover: 'https://picsum.photos/seed/related-3/800/500',
  },
];

const RelatedArticles = () => (
  <div>
    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
      Continue reading
    </h3>
    <div className="mt-6">
      <GridList cols={3}>
        {RELATED.map((p) => (
          <GridList.Card key={p.slug} className="overflow-hidden">
            <a href={`#/${p.slug}`} className="group block">
              <img
                alt=""
                src={p.cover}
                className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="p-5">
                <div className="flex items-center gap-x-3 text-xs">
                  <span className="text-[var(--color-text-secondary)]">{p.date}</span>
                  <Badge variant="neutral" size="sm">
                    {p.tag}
                  </Badge>
                </div>
                <h4 className="mt-2 text-base font-semibold text-[var(--color-text-primary)]">
                  {p.title}
                </h4>
                <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                  {p.excerpt}
                </p>
              </div>
            </a>
          </GridList.Card>
        ))}
      </GridList>
    </div>
  </div>
);

// ── Shared post data ────────────────────────────────────────────────────────

const POST = {
  slug: 'visual-diff-pipeline',
  title: 'Visual diffing UI components without flake',
  tag: 'Tooling',
  date: '2026-05-12',
  dateLabel: 'May 12, 2026',
  readTime: '6 min read',
  cover: 'https://picsum.photos/seed/cosmos-diff/1600/700',
  lead:
    'A small Playwright + Storybook setup that compares every component variant against a reference, with no per-pixel snapshots and no flake.',
  author: {
    name: 'Lindsay Walton',
    role: 'Front-end Developer · Cosmos team',
    img: 'https://i.pravatar.cc/192?u=lindsay',
    bio: 'Lindsay maintains the Cosmos visual diff pipeline and writes about testing rigs that survive contact with real codebases.',
  } satisfies Author,
};

const CODE_SAMPLE = `import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  colorScheme: 'light',
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.locator(selector).first().screenshot({ path: out });
await browser.close();`;

const SECTIONS: Section[] = [
  { id: 'context', label: 'Context' },
  { id: 'setup', label: 'The setup' },
  { id: 'why', label: 'Why no per-pixel' },
  { id: 'tradeoffs', label: 'Trade-offs' },
];

// ── Article body (shared between Default + WithoutHeroImage) ────────────────

const ArticleBody = ({ withHero = true }: { withHero?: boolean }) => (
  <article className="bg-[var(--color-bg-base)]">
    {/* Hero image (optional) */}
    {withHero && (
      <div className="border-b border-[var(--color-border)]">
        <ContentNarrow maxWidth={1152} className="px-6 pt-10 pb-8">
          <img
            alt=""
            src={POST.cover}
            className="aspect-[3/1] w-full rounded-2xl object-cover"
          />
        </ContentNarrow>
      </div>
    )}

    {/* Header — kicker + title + lead + meta + share */}
    <ContentNarrow maxWidth={760} className="px-6 pt-12 pb-8">
      {/* Kicker (date + tag) above the title */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
        <Badge variant="brand" size="sm">
          {POST.tag}
        </Badge>
        <span aria-hidden>·</span>
        <time dateTime={POST.date}>{POST.dateLabel}</time>
      </div>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-5xl">
        {POST.title}
      </h1>
      <p className="mt-5 text-xl leading-relaxed text-[var(--color-text-secondary)]">
        {POST.lead}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-y-3">
        <ArticleMeta
          author={POST.author.name}
          date={POST.dateLabel}
          readTime={POST.readTime}
        />
        <ShareRow />
      </div>
    </ContentNarrow>
  </article>
);

const ProseBody = () => (
  <div className="prose-cosmos space-y-6 text-base leading-relaxed text-[var(--color-text-secondary)]">
    <p id="context">
      Most visual regression setups either render a perfect-pixel snapshot for every
      variant — which makes the suite flaky as soon as anti-aliasing or font hinting
      shifts — or skip visual coverage entirely and rely on interaction tests that
      cannot catch a regressed border or a swapped <code className="rounded bg-[var(--color-bg-panel)] px-1 py-0.5 font-mono text-sm">color</code>{' '}
      token.
    </p>

    <SectionHeading id="setup">The setup</SectionHeading>
    <p>
      Cosmos ships a Playwright helper that takes one screenshot per major variant,
      against a reference rendered by the upstream design source. The diff is read
      by a human at the &quot;does this still look right?&quot; level — not at the
      pixel level.
    </p>

    <div className="not-prose my-8">
      <CodeBlock language="ts" code={CODE_SAMPLE} />
    </div>

    <blockquote className="border-l-2 border-brand-500 pl-5 text-xl italic leading-relaxed text-[var(--color-text-primary)]">
      Pixels are noisy. Structure is not. The diff your team can trust is the one
      that looks at structure.
    </blockquote>

    <SectionHeading id="why">Why no per-pixel diffs</SectionHeading>
    <p>
      Per-pixel diffs fail on every browser update, every font tweak, every shadow
      recalculation. The maintenance cost greatly exceeds the bugs caught. Sampling
      one screenshot per variant catches structural regressions (missing border,
      wrong padding, swapped color) without the noise.
    </p>

    <SectionHeading id="tradeoffs">Trade-offs</SectionHeading>
    <p>
      The obvious one: subtle visual drift in a single variant can slip through
      until the next sampled run. We accept it because the alternative — a
      perpetually-flaky pixel suite — gets ignored by the team within a quarter,
      and that drift slips through anyway.
    </p>
    <p>
      Read more in the{' '}
      <a
        href="#"
        className="text-brand-600 underline decoration-brand-500/40 underline-offset-2 hover:decoration-brand-500 dark:text-brand-400"
      >
        Cosmos roadmap §4.2
      </a>
      .
    </p>
  </div>
);

const TocRail = ({ sections, active }: { sections: Section[]; active: string }) => (
  <nav aria-label="On this page" className="px-2">
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

// ── Variant 1: Default — hero image + sticky TOC + full chrome ──────────────

const DefaultBody = () => {
  useReadingProgress();
  const active = useActiveSection(SECTIONS.map((s) => s.id));
  return (
    <>
      <style>{BLOG_POST_CSS}</style>
      <div className="cosmos-progress" aria-hidden />
      <ArticleBody withHero />
      {/* Body + sticky TOC (3-col on lg+) */}
      <div className="bg-[var(--color-bg-base)] pb-16">
        <ContentNarrow maxWidth={1152} className="px-6">
          <div className="grid grid-cols-12 gap-x-8">
            <div className="col-span-12 lg:col-span-8">
              <ProseBody />
              {/* Footer block — author + share + related */}
              <div className="mt-16 space-y-12">
                <AuthorCard author={POST.author} />
                <RelatedArticles />
              </div>
            </div>
            <aside className="hidden lg:col-span-4 lg:block">
              <div className="sticky top-8">
                <TocRail sections={SECTIONS} active={active} />
              </div>
            </aside>
          </div>
        </ContentNarrow>
      </div>
    </>
  );
};

export const Default: Story = {
  render: () => (
    <Shell topbar={blogNavbar() as never}>
      <DefaultBody />
    </Shell>
  ),
};

// ── Variant 2: Minimal — short article, no hero, no TOC, no author card ────

export const Minimal: Story = {
  render: () => (
    <Shell topbar={blogNavbar() as never}>
      <article className="bg-[var(--color-bg-base)]">
        <ContentNarrow maxWidth={680} className="px-6 py-16">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            <Badge variant="success" size="sm">Changelog</Badge>
            <span aria-hidden>·</span>
            <time dateTime="2026-05-18">May 18, 2026</time>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Cosmos 1.1 — DocPage template, Combobox, and 5 blog variants
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--color-text-secondary)]">
            A small release focused on documentation surfaces and form coverage. Highlights below.
          </p>
          <div className="prose-cosmos mt-8 space-y-4 text-base leading-relaxed text-[var(--color-text-secondary)]">
            <p>
              <strong className="text-[var(--color-text-primary)]">DocPage template.</strong>{' '}
              A new <code className="rounded bg-[var(--color-bg-panel)] px-1 py-0.5 font-mono text-sm">Pages/DocPage</code>{' '}
              story ships a 3-column docs layout (sidebar + body + TOC) built entirely from
              Cosmos primitives — no new dependency.
            </p>
            <p>
              <strong className="text-[var(--color-text-primary)]">Combobox.</strong> Custom
              autocomplete with keyboard nav, intent options, and a clean dropdown.
            </p>
            <p>
              <strong className="text-[var(--color-text-primary)]">Blog index variants.</strong>{' '}
              Five new layouts under <code className="rounded bg-[var(--color-bg-panel)] px-1 py-0.5 font-mono text-sm">Pages/Blog Index</code>,
              aligned on TUI Plus marketing/blog-sections.
            </p>
          </div>
        </ContentNarrow>
      </article>
    </Shell>
  ),
};

// ── Variant 3: Without hero image — text-first ─────────────────────────────

const WithoutHeroBody = () => {
  useReadingProgress();
  const active = useActiveSection(SECTIONS.map((s) => s.id));
  return (
    <>
      <style>{BLOG_POST_CSS}</style>
      <div className="cosmos-progress" aria-hidden />
      <ArticleBody withHero={false} />
      <div className="bg-[var(--color-bg-base)] pb-16">
        <ContentNarrow maxWidth={1152} className="px-6">
          <div className="grid grid-cols-12 gap-x-8">
            <div className="col-span-12 lg:col-span-8">
              <ProseBody />
              <div className="mt-16 space-y-12">
                <AuthorCard author={POST.author} />
                <RelatedArticles />
              </div>
            </div>
            <aside className="hidden lg:col-span-4 lg:block">
              <div className="sticky top-8">
                <TocRail sections={SECTIONS} active={active} />
              </div>
            </aside>
          </div>
        </ContentNarrow>
      </div>
    </>
  );
};

export const WithoutHeroImage: Story = {
  render: () => (
    <Shell topbar={blogNavbar() as never}>
      <WithoutHeroBody />
    </Shell>
  ),
};
