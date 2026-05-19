import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta = {
  title: 'Typography/Paragraphs',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

const LOREM_SHORT =
  'Cosmos provides the building blocks for the rackscope, monitoring-hub and monitoring-hub-website projects. Three packages, one visual identity, zero drift across surfaces.';

const LOREM_LONG =
  'Long-running services emit a continuous stream of metrics, logs and traces. The job of an observability platform is to turn that stream into something an on-call engineer can read at 03:14 in the morning. Cosmos exists so we can spend our design effort on what actually matters in that moment — the dashboard layout, the alert pill, the diff between yesterday and now — rather than on rebuilding a button from scratch every quarter.';

export const Default: Story = {
  render: () => (
    <p className="max-w-prose text-base leading-relaxed text-gray-700 dark:text-gray-300">
      {LOREM_SHORT}
    </p>
  ),
};

export const Lead: Story = {
  // First paragraph of an article — larger, looser. Mirrors Flowbite's
  // "Leading paragraph" pattern.
  render: () => (
    <div className="max-w-prose space-y-4 text-gray-700 dark:text-gray-300">
      <p className="text-xl leading-relaxed text-gray-900 md:text-2xl dark:text-white">
        {LOREM_SHORT}
      </p>
      <p className="text-base leading-relaxed">{LOREM_LONG}</p>
    </div>
  ),
};

export const DropCap: Story = {
  // First letter floated and oversized — magazine treatment for the opening
  // article paragraph. `first-letter:*` utilities do the work.
  render: () => (
    <p className="max-w-prose text-base leading-relaxed text-gray-700 first-letter:float-start first-letter:me-3 first-letter:text-7xl first-letter:font-bold first-letter:text-gray-900 dark:text-gray-300 dark:first-letter:text-white">
      {LOREM_LONG}
    </p>
  ),
};

export const InlineEmphasis: Story = {
  // Common inline treatments mixed in a single paragraph.
  render: () => (
    <p className="max-w-prose text-base leading-relaxed text-gray-700 dark:text-gray-300">
      Cosmos ships{' '}
      <strong className="font-semibold text-gray-900 dark:text-white">three packages</strong>: a
      Tailwind theme, a React component library, and <em className="italic">opinionated</em>{' '}
      ApexCharts wrappers. Everything plugs into the same{' '}
      <code className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
        --color-*
      </code>{' '}
      tokens, and there&apos;s a{' '}
      <a href="#" className="text-brand-500 font-medium hover:underline">
        getting started guide
      </a>{' '}
      if you want to skim before installing.
    </p>
  ),
};

export const TwoColumns: Story = {
  // CSS `column-count` is fine for short prose. Use `md:` so single column
  // collapses gracefully on mobile.
  render: () => (
    <div className="max-w-4xl columns-1 gap-8 text-base leading-relaxed text-gray-700 md:columns-2 dark:text-gray-300">
      <p className="mb-4">{LOREM_LONG}</p>
      <p>{LOREM_LONG}</p>
    </div>
  ),
};

export const Alignments: Story = {
  render: () => (
    <div className="max-w-prose space-y-6 text-base text-gray-700 dark:text-gray-300">
      <p className="text-left">
        Left-aligned — the default for body copy in left-to-right scripts.
      </p>
      <p className="text-center">Centered — useful for hero subtitles and quote attribution.</p>
      <p className="text-right">Right-aligned — for sidebar metadata and timestamps.</p>
    </div>
  ),
};
