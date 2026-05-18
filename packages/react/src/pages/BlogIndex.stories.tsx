import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowRight } from 'lucide-react';
import { Shell } from '../layout/Shell';
import { Navbar } from '../navigation/Navbar';
import { placeholderAvatar, placeholderCover } from '../storybook-avatars';
import { ContentNarrow } from '../templates/ContentNarrow';
import { Badge } from '../ui/Badge';

// TUI Plus marketing/blog-sections — 5 variants for Cosmos consumption.
// Each story is a self-contained "From the blog" page section.

const meta = {
  title: 'Pages/Blog Index',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  authorRole: string;
  authorImg: string;
  date: string;
  dateLabel: string;
  tag: string;
  cover: string;
};

const POSTS: Post[] = [
  {
    slug: 'releasing-cosmos-1-0',
    title: 'Releasing Cosmos 1.0 — a design system for monitoring',
    excerpt:
      'After six months in private beta, Cosmos hits 1.0 with 80 React components, a tokenised theme, and a Storybook covering every variant.',
    author: 'Tom Cook',
    authorRole: 'Maintainer',
    authorImg: placeholderAvatar('Tom Cook', 96),
    date: '2026-05-18',
    dateLabel: 'May 18, 2026',
    tag: 'Release',
    cover: placeholderCover('cosmos-release', 800, 500),
  },
  {
    slug: 'visual-diff-pipeline',
    title: 'Visual diffing UI components without flake',
    excerpt:
      'A small Playwright + Storybook setup that compares every component variant against a reference, with no per-pixel snapshots.',
    author: 'Lindsay Walton',
    authorRole: 'Front-end Developer',
    authorImg: placeholderAvatar('Lindsay Walton', 96),
    date: '2026-05-12',
    dateLabel: 'May 12, 2026',
    tag: 'Tooling',
    cover: placeholderCover('cosmos-diff', 800, 500),
  },
  {
    slug: 'tailwind-4-token-bridge',
    title: 'Bridging Tailwind 4 themes and CSS variables',
    excerpt:
      'How Cosmos exposes one set of design tokens to both Tailwind utilities and runtime theme switching, without duplicating values.',
    author: 'Michael Foster',
    authorRole: 'Co-Founder / CTO',
    authorImg: placeholderAvatar('Michael Foster', 96),
    date: '2026-05-02',
    dateLabel: 'May 2, 2026',
    tag: 'Theming',
    cover: placeholderCover('cosmos-tokens', 800, 500),
  },
];

const SectionHeader = () => (
  <div className="max-w-2xl">
    <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
      From the blog
    </h2>
    <p className="mt-2 text-base text-[var(--color-text-secondary)]">
      Learn how Cosmos powers monitoring dashboards across teams and stacks.
    </p>
  </div>
);

const blogNavbar = () => (
  <Navbar theme="light">
    <Navbar.Brand>
      <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">Cosmos blog</span>
      <Navbar.Items>
        <Navbar.Item theme="light" active href="#">
          Articles
        </Navbar.Item>
        <Navbar.Item theme="light" href="#">
          Releases
        </Navbar.Item>
        <Navbar.Item theme="light" href="#">
          Talks
        </Navbar.Item>
      </Navbar.Items>
    </Navbar.Brand>
    <Navbar.Actions>
      <a
        href="#rss"
        className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      >
        RSS
      </a>
    </Navbar.Actions>
  </Navbar>
);

// ── Variant 1: Three-column (text only, no images) ──────────────────────────
// TUI "Three-column" — date + tag + title + excerpt + author chip.

export const ThreeColumn: Story = {
  render: () => (
    <Shell topbar={blogNavbar() as never}>
      <div className="bg-[var(--color-bg-base)]">
        <ContentNarrow maxWidth={1152} className="px-6 py-16">
          <SectionHeader />
          <div className="mt-10 border-t border-[var(--color-border)] pt-10">
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {POSTS.map((p) => (
                <article key={p.slug}>
                  <div className="flex items-center gap-x-3 text-xs">
                    <time dateTime={p.date} className="text-[var(--color-text-secondary)]">
                      {p.dateLabel}
                    </time>
                    <Badge variant="neutral" size="sm">
                      {p.tag}
                    </Badge>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-[var(--color-text-primary)]">
                    <a href={`#/${p.slug}`} className="hover:underline">
                      {p.title}
                    </a>
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm text-[var(--color-text-secondary)]">
                    {p.excerpt}
                  </p>
                  <div className="mt-6 flex items-center gap-x-3">
                    <img alt="" src={p.authorImg} className="size-9 rounded-full bg-gray-100" />
                    <div className="text-sm">
                      <p className="font-semibold text-[var(--color-text-primary)]">{p.author}</p>
                      <p className="text-[var(--color-text-secondary)]">{p.authorRole}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </ContentNarrow>
      </div>
    </Shell>
  ),
};

// ── Variant 2: Three-column with images ─────────────────────────────────────
// TUI "Three-column with images" — adds a cover image to each card.

export const ThreeColumnWithImages: Story = {
  render: () => (
    <Shell topbar={blogNavbar() as never}>
      <div className="bg-[var(--color-bg-base)]">
        <ContentNarrow maxWidth={1152} className="px-6 py-16">
          <SectionHeader />
          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {POSTS.map((p) => (
              <article key={p.slug} className="flex flex-col">
                <a href={`#/${p.slug}`} className="group">
                  <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
                    <img
                      alt=""
                      src={p.cover}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                </a>
                <div className="mt-5 flex items-center gap-x-3 text-xs">
                  <time dateTime={p.date} className="text-[var(--color-text-secondary)]">
                    {p.dateLabel}
                  </time>
                  <Badge variant="neutral" size="sm">
                    {p.tag}
                  </Badge>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[var(--color-text-primary)]">
                  <a href={`#/${p.slug}`} className="hover:underline">
                    {p.title}
                  </a>
                </h3>
                <p className="mt-3 line-clamp-3 text-sm text-[var(--color-text-secondary)]">
                  {p.excerpt}
                </p>
                <div className="mt-6 flex items-center gap-x-3">
                  <img alt="" src={p.authorImg} className="size-9 rounded-full bg-gray-100" />
                  <div className="text-sm">
                    <p className="font-semibold text-[var(--color-text-primary)]">{p.author}</p>
                    <p className="text-[var(--color-text-secondary)]">{p.authorRole}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </ContentNarrow>
      </div>
    </Shell>
  ),
};

// ── Variant 3: Single-column (stacked) ──────────────────────────────────────
// TUI "Single-column" — narrative reading list, articles stacked.

export const SingleColumn: Story = {
  render: () => (
    <Shell topbar={blogNavbar() as never}>
      <div className="bg-[var(--color-bg-base)]">
        <ContentNarrow maxWidth={768} className="px-6 py-16">
          <SectionHeader />
          <div className="mt-10 space-y-12 border-t border-[var(--color-border)] pt-10">
            {POSTS.map((p) => (
              <article key={p.slug}>
                <div className="flex items-center gap-x-3 text-xs">
                  <time dateTime={p.date} className="text-[var(--color-text-secondary)]">
                    {p.dateLabel}
                  </time>
                  <Badge variant="neutral" size="sm">
                    {p.tag}
                  </Badge>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-[var(--color-text-primary)]">
                  <a href={`#/${p.slug}`} className="hover:underline">
                    {p.title}
                  </a>
                </h3>
                <p className="mt-3 text-[var(--color-text-secondary)]">{p.excerpt}</p>
                <div className="mt-5 flex items-center gap-x-3">
                  <img alt="" src={p.authorImg} className="size-9 rounded-full bg-gray-100" />
                  <div className="text-sm">
                    <p className="font-semibold text-[var(--color-text-primary)]">{p.author}</p>
                    <p className="text-[var(--color-text-secondary)]">{p.authorRole}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </ContentNarrow>
      </div>
    </Shell>
  ),
};

// ── Variant 4: With featured post ───────────────────────────────────────────
// Editorial magazine-style: large hero featured article (image + content) on
// the left, compact "Latest" side list with thumbnails on the right.

export const WithFeaturedPost: Story = {
  render: () => {
    const [hero, ...rest] = POSTS;
    return (
      <Shell topbar={blogNavbar() as never}>
        <div className="bg-[var(--color-bg-base)]">
          <ContentNarrow maxWidth={1280} className="px-6 py-16">
            {/* Section eyebrow */}
            <div className="mb-10 flex items-end justify-between gap-4 border-b border-[var(--color-border)] pb-6">
              <div>
                <p className="text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
                  Editorial — Volume 01
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
                  From the blog
                </h2>
              </div>
              <a
                href="#archive"
                className="hidden text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] sm:inline-flex sm:items-center sm:gap-1"
              >
                View all articles
                <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>

            {/* Featured (8 cols) + Side list (4 cols) */}
            <div className="grid grid-cols-1 gap-x-10 gap-y-12 lg:grid-cols-12">
              {/* Featured */}
              <article className="lg:col-span-8">
                <a href={`#/${hero.slug}`} className="group block">
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
                    <img
                      alt=""
                      src={hero.cover.replace('800/500', '1600/1000')}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                </a>
                <div className="mt-6 flex items-center gap-x-3 text-xs">
                  <Badge variant="brand" size="sm">
                    Featured
                  </Badge>
                  <span className="text-[var(--color-text-muted)]">·</span>
                  <time dateTime={hero.date} className="text-[var(--color-text-secondary)]">
                    {hero.dateLabel}
                  </time>
                  <span className="text-[var(--color-text-muted)]">·</span>
                  <span className="text-[var(--color-text-secondary)]">{hero.tag}</span>
                </div>
                <h3 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
                  <a href={`#/${hero.slug}`} className="hover:underline">
                    {hero.title}
                  </a>
                </h3>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
                  {hero.excerpt}
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-between gap-y-4">
                  <div className="flex items-center gap-x-3">
                    <img alt="" src={hero.authorImg} className="size-10 rounded-full bg-gray-100" />
                    <div className="text-sm">
                      <p className="font-semibold text-[var(--color-text-primary)]">
                        {hero.author}
                      </p>
                      <p className="text-[var(--color-text-secondary)]">{hero.authorRole}</p>
                    </div>
                  </div>
                  <a
                    href={`#/${hero.slug}`}
                    className="bg-brand-500 hover:bg-brand-600 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white"
                  >
                    Continue reading
                    <ArrowRight className="size-4" aria-hidden />
                  </a>
                </div>
              </article>

              {/* Side list: compact items with thumbnails */}
              <aside className="lg:col-span-4">
                <h3 className="text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
                  Latest from the blog
                </h3>
                <ul role="list" className="mt-5 divide-y divide-[var(--color-border)]">
                  {rest.map((p) => (
                    <li key={p.slug} className="py-5 first:pt-0 last:pb-0">
                      <article>
                        <a href={`#/${p.slug}`} className="group flex items-start gap-x-4">
                          <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                            <img
                              alt=""
                              src={p.cover}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-x-2 text-xs text-[var(--color-text-muted)]">
                              <time dateTime={p.date}>{p.dateLabel}</time>
                              <span aria-hidden>·</span>
                              <span>{p.tag}</span>
                            </div>
                            <h4 className="group-hover:text-brand-600 dark:group-hover:text-brand-400 mt-1.5 text-sm leading-snug font-semibold text-[var(--color-text-primary)]">
                              {p.title}
                            </h4>
                            <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                              {p.excerpt}
                            </p>
                          </div>
                        </a>
                      </article>
                    </li>
                  ))}
                </ul>
                <a
                  href="#archive"
                  className="text-brand-600 hover:text-brand-700 dark:text-brand-400 mt-6 inline-flex items-center gap-1 text-sm font-semibold sm:hidden"
                >
                  View all articles
                  <ArrowRight className="size-4" aria-hidden />
                </a>
              </aside>
            </div>
          </ContentNarrow>
        </div>
      </Shell>
    );
  },
};

// ── Variant 5: With photo and list ──────────────────────────────────────────
// TUI "With photo and list" — wide photo of latest article on the left,
// compact post list on the right.

export const WithPhotoAndList: Story = {
  render: () => {
    const [hero, ...rest] = POSTS;
    return (
      <Shell topbar={blogNavbar() as never}>
        <div className="bg-[var(--color-bg-base)]">
          <ContentNarrow maxWidth={1152} className="px-6 py-16">
            <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12 lg:items-start">
              {/* Hero photo article */}
              <article className="lg:col-span-7">
                <a href={`#/${hero.slug}`} className="group block">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
                    <img
                      alt=""
                      src={hero.cover.replace('800/500', '1200/900')}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                </a>
                <div className="mt-6 flex items-center gap-x-3 text-xs">
                  <time dateTime={hero.date} className="text-[var(--color-text-secondary)]">
                    {hero.dateLabel}
                  </time>
                  <Badge variant="neutral" size="sm">
                    {hero.tag}
                  </Badge>
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
                  <a href={`#/${hero.slug}`} className="hover:underline">
                    {hero.title}
                  </a>
                </h2>
                <p className="mt-3 text-base text-[var(--color-text-secondary)]">{hero.excerpt}</p>
              </article>

              {/* Side compact list */}
              <div className="lg:col-span-5">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                  More from the blog
                </h3>
                <ul
                  role="list"
                  className="mt-6 space-y-8 border-t border-[var(--color-border)] pt-8"
                >
                  {rest.map((p) => (
                    <li key={p.slug}>
                      <article>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          <time dateTime={p.date}>{p.dateLabel}</time>
                          <span aria-hidden> · </span>
                          <span>{p.tag}</span>
                        </div>
                        <h4 className="mt-2 text-base font-semibold text-[var(--color-text-primary)]">
                          <a href={`#/${p.slug}`} className="hover:underline">
                            {p.title}
                          </a>
                        </h4>
                        <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                          {p.excerpt}
                        </p>
                      </article>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ContentNarrow>
        </div>
      </Shell>
    );
  },
};
