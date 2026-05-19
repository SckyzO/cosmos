import type { Meta, StoryObj } from '@storybook/react-vite';

// Inline text utilities (italic, bold, mark, code, kbd-handled-elsewhere, …).
// Same approach as Headings: showcase the Tailwind / HTML primitives rather
// than wrap every emphasis in a dedicated Cosmos component.
const meta: Meta = {
  title: 'Typography/Text',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[140px_1fr] items-baseline gap-4 border-b border-gray-200 py-3 last:border-0 dark:border-gray-800">
    <span className="font-mono text-[10px] tracking-wider text-gray-500 uppercase dark:text-gray-400">
      {label}
    </span>
    <div className="text-gray-700 dark:text-gray-200">{children}</div>
  </div>
);

export const Utilities: Story = {
  render: () => (
    <div className="max-w-2xl">
      <Row label="Italic">
        <em className="italic">Cosmos is the design system used across sckyzo&apos;s projects.</em>
      </Row>
      <Row label="Bold">
        <strong className="font-semibold text-gray-900 dark:text-white">
          Cosmos is the design system used across sckyzo&apos;s projects.
        </strong>
      </Row>
      <Row label="Underline">
        <span className="underline underline-offset-2">Read the documentation</span>
      </Row>
      <Row label="Strikethrough">
        <span className="line-through">This option is deprecated.</span>
      </Row>
      <Row label="Mark / highlight">
        <mark className="bg-brand-500/15 text-brand-700 dark:text-brand-300 rounded px-1.5 py-0.5">
          highlighted phrase
        </mark>
      </Row>
      <Row label="Inline code">
        <code className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
          @sckyzo/cosmos-react
        </code>
      </Row>
      <Row label="Abbreviation">
        <abbr
          title="Site Reliability Engineering"
          className="cursor-help underline decoration-dotted underline-offset-2"
        >
          SRE
        </abbr>{' '}
        teams ship reliability as code.
      </Row>
      <Row label="Small">
        <small className="text-xs text-gray-500 dark:text-gray-400">
          Last updated 5 minutes ago.
        </small>
      </Row>
      <Row label="Gradient">
        <span className="from-brand-500 bg-gradient-to-r to-fuchsia-500 bg-clip-text font-semibold text-transparent">
          Observability, refined.
        </span>
      </Row>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="max-w-prose space-y-2 text-gray-700 dark:text-gray-300">
      <p className="text-xs">text-xs — fine print, captions, timestamps.</p>
      <p className="text-sm">text-sm — secondary body text, list items.</p>
      <p className="text-base">text-base — default body copy.</p>
      <p className="text-lg">text-lg — emphasised body, lead paragraphs.</p>
      <p className="text-xl">text-xl — small headlines, callouts.</p>
    </div>
  ),
};

export const Weights: Story = {
  render: () => (
    <div className="max-w-prose space-y-2 text-base text-gray-700 dark:text-gray-300">
      <p className="font-light">font-light — 300, for marketing display copy.</p>
      <p className="font-normal">font-normal — 400, the default.</p>
      <p className="font-medium">font-medium — 500, used for emphasised body.</p>
      <p className="font-semibold">font-semibold — 600, the default for headings.</p>
      <p className="font-bold">font-bold — 700, for hero titles.</p>
    </div>
  ),
};

export const Colors: Story = {
  // Cosmos exposes semantic colour tokens — these are the ones consumed by
  // body copy, links, and muted captions across the design system.
  render: () => (
    <div className="max-w-prose space-y-2 text-base">
      <p className="text-gray-900 dark:text-white">Primary text — headings and emphasised body.</p>
      <p className="text-gray-700 dark:text-gray-300">Body — the default paragraph colour.</p>
      <p className="text-gray-500 dark:text-gray-400">Muted — captions, helper text, timestamps.</p>
      <p className="text-brand-500">Brand — links, accents, primary CTAs.</p>
      <p className="text-emerald-600 dark:text-emerald-400">Success — positive state.</p>
      <p className="text-amber-600 dark:text-amber-400">Warning — degraded state.</p>
      <p className="text-red-600 dark:text-red-400">Danger — critical state, errors.</p>
    </div>
  ),
};
