import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { Shell } from '../layout/Shell';
import { Navbar } from '../navigation/Navbar';
import { ContentNarrow } from '../templates/ContentNarrow';
import { Badge } from '../ui/Badge';
import { CodeBlock } from '../ui/CodeBlock';

// Blog post page template — long-form article view with hero image, title,
// metadata, prose body, inline code blocks. Composed from Cosmos primitives.

const meta = {
  title: 'Pages/Blog Post',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const POST = {
  slug: 'visual-diff-pipeline',
  title: 'Visual diffing UI components without flake',
  tag: 'Tooling',
  author: 'Tom (sckyzo)',
  date: '2026-05-12',
  readTime: '6 min',
  cover: 'https://picsum.photos/seed/cosmos-diff/1600/700',
  lead:
    'A small playwright + storybook setup that compares every component variant against a reference, with no per-pixel snapshots and no flake.',
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

export const Default: Story = {
  render: () => (
    <Shell
      topbar={
        (
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
        ) as never
      }
    >
      <article className="bg-[var(--color-bg-base)]">
        {/* Hero image */}
        <div className="border-b border-[var(--color-border)]">
          <ContentNarrow maxWidth={1152} className="px-6 pt-10 pb-8">
            <img
              alt=""
              src={POST.cover}
              className="aspect-[3/1] w-full rounded-2xl object-cover"
            />
          </ContentNarrow>
        </div>

        {/* Header */}
        <ContentNarrow maxWidth={760} className="px-6 py-12">
          <Badge variant="brand">{POST.tag}</Badge>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {POST.title}
          </h1>
          <p className="mt-4 text-lg text-[var(--color-text-secondary)]">{POST.lead}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-[var(--color-text-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <User className="size-4" aria-hidden /> {POST.author}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4" aria-hidden />
              <time dateTime={POST.date}>{POST.date}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden /> {POST.readTime}
            </span>
          </div>

          {/* Prose body */}
          <div className="prose-cosmos mt-10 max-w-none">
            <p>
              Most visual regression setups either render a perfect-pixel snapshot for every
              variant — which makes the suite flaky as soon as anti-aliasing or font hinting
              shifts — or skip visual coverage entirely and rely on interaction tests that
              cannot catch a regressed border or a swapped color token.
            </p>

            <h2 className="mt-10 text-2xl font-semibold text-[var(--color-text-primary)]">
              The setup
            </h2>
            <p className="mt-3">
              Cosmos ships a Playwright helper that takes one screenshot per major variant,
              against a reference rendered by the upstream design source. The diff is read
              by a human (or LLM) at the &quot;does this still look right?&quot; level —
              not at the pixel level.
            </p>

            <div className="mt-6">
              <CodeBlock language="ts" code={CODE_SAMPLE} />
            </div>

            <h2 className="mt-10 text-2xl font-semibold text-[var(--color-text-primary)]">
              Why no per-pixel diffs
            </h2>
            <p className="mt-3">
              Per-pixel diffs fail on every browser update, every font tweak, every shadow
              recalculation. The maintenance cost greatly exceeds the bugs caught.
              Sampling one screenshot per variant catches structural regressions
              (missing border, wrong padding, swapped color) without the noise.
            </p>

            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              Read more in the
              <a href="#" className="ml-1 text-indigo-600 hover:text-indigo-500">
                Cosmos roadmap §4.2
              </a>
              .
            </p>
          </div>
        </ContentNarrow>
      </article>
    </Shell>
  ),
};
