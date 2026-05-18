import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar, Clock, User } from 'lucide-react';
import { Shell } from '../layout/Shell';
import { Navbar } from '../navigation/Navbar';
import { ContentNarrow } from '../templates/ContentNarrow';
import { GridList } from '../lists/GridList';
import { Badge } from '../ui/Badge';

// Blog index page template — hero post (featured) on top, grid of post
// cards below. Composed from Cosmos primitives (Shell + Navbar + GridList).
// Distinctive layout: hero + 3-col grid.

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
  date: string;
  readTime: string;
  tag: string;
  cover: string;
};

const POSTS: Post[] = [
  {
    slug: 'releasing-cosmos-1-0',
    title: 'Releasing Cosmos 1.0 — a design system for monitoring at scale',
    excerpt:
      'After six months in private beta, Cosmos hits 1.0 with 80 React components, a tokenised theme, and a Storybook covering every variant. Here is what shipped and what is next.',
    author: 'Tom (sckyzo)',
    date: '2026-05-18',
    readTime: '8 min',
    tag: 'Release',
    cover: 'https://picsum.photos/seed/cosmos-release/1200/600',
  },
  {
    slug: 'visual-diff-pipeline',
    title: 'Visual diffing UI components without flake',
    excerpt:
      'A small playwright + storybook setup that compares every component variant against a reference, with no per-pixel snapshots and no flake.',
    author: 'Tom (sckyzo)',
    date: '2026-05-12',
    readTime: '6 min',
    tag: 'Tooling',
    cover: 'https://picsum.photos/seed/cosmos-diff/600/400',
  },
  {
    slug: 'tailwind-4-token-bridge',
    title: 'Bridging Tailwind 4 themes and CSS variables',
    excerpt:
      'How Cosmos exposes one set of design tokens to both Tailwind utilities and runtime theme switching, without duplicating values or losing tree-shaking.',
    author: 'Tom (sckyzo)',
    date: '2026-05-02',
    readTime: '10 min',
    tag: 'Theming',
    cover: 'https://picsum.photos/seed/cosmos-tokens/600/400',
  },
  {
    slug: 'monitoring-as-design',
    title: 'Monitoring is a design problem first',
    excerpt:
      'A short reflection on why most monitoring UIs feel hostile, and how taking the design layer seriously unlocks better operational decisions.',
    author: 'Tom (sckyzo)',
    date: '2026-04-25',
    readTime: '5 min',
    tag: 'Opinion',
    cover: 'https://picsum.photos/seed/cosmos-design/600/400',
  },
];

const Meta = ({ author, date, readTime }: { author: string; date: string; readTime: string }) => (
  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)]">
    <span className="inline-flex items-center gap-1">
      <User className="size-3.5" aria-hidden /> {author}
    </span>
    <span className="inline-flex items-center gap-1">
      <Calendar className="size-3.5" aria-hidden />
      <time dateTime={date}>{date}</time>
    </span>
    <span className="inline-flex items-center gap-1">
      <Clock className="size-3.5" aria-hidden /> {readTime}
    </span>
  </div>
);

export const Default: Story = {
  render: () => {
    const [hero, ...rest] = POSTS;
    return (
      <Shell
        topbar={
          (
            <Navbar theme="light">
              <Navbar.Brand>
                <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Cosmos blog
                </span>
                <Navbar.Items>
                  <Navbar.Item theme="light" active href="#">Articles</Navbar.Item>
                  <Navbar.Item theme="light" href="#">Releases</Navbar.Item>
                  <Navbar.Item theme="light" href="#">Talks</Navbar.Item>
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
          ) as never
        }
      >
        <div className="bg-[var(--color-bg-base)]">
          {/* Hero / featured post */}
          <ContentNarrow maxWidth={1152} className="px-6 py-12">
            <a href={`#/${hero.slug}`} className="group block">
              <div className="overflow-hidden rounded-2xl">
                <img
                  alt=""
                  src={hero.cover}
                  className="aspect-[2/1] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="mt-6">
                <Badge variant="brand">{hero.tag}</Badge>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
                  {hero.title}
                </h1>
                <p className="mt-3 max-w-2xl text-base text-[var(--color-text-secondary)]">
                  {hero.excerpt}
                </p>
                <Meta author={hero.author} date={hero.date} readTime={hero.readTime} />
              </div>
            </a>
          </ContentNarrow>

          {/* Grid of remaining posts */}
          <ContentNarrow maxWidth={1152} className="px-6 pb-16">
            <h2 className="text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
              More articles
            </h2>
            <div className="mt-4">
              <GridList cols={3}>
                {rest.map((p) => (
                  <GridList.Card key={p.slug} className="overflow-hidden">
                    <a href={`#/${p.slug}`} className="group block">
                      <img
                        alt=""
                        src={p.cover}
                        className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="p-5">
                        <Badge variant="neutral" size="sm">{p.tag}</Badge>
                        <h3 className="mt-2 text-base font-semibold text-[var(--color-text-primary)]">
                          {p.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm text-[var(--color-text-secondary)]">
                          {p.excerpt}
                        </p>
                        <Meta author={p.author} date={p.date} readTime={p.readTime} />
                      </div>
                    </a>
                  </GridList.Card>
                ))}
              </GridList>
            </div>
          </ContentNarrow>
        </div>
      </Shell>
    );
  },
};
