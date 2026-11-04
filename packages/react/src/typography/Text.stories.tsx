import type { Meta, StoryObj } from '@storybook/react-vite';
import { clsx } from 'clsx';

const meta: Meta = {
  title: 'Typography/Text',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Inline text (italic, bold, mark, code, an abbreviation…), its sizes, weights and colours. These are Tailwind classes on plain HTML elements, as for `Headings`: a component per emphasis would add ceremony and nothing else. `Kbd` and `Highlight` are components of their own.',
      },
    },
  },
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

// The same sentence in every weight: the steps from 500 to 700 are small, and lines that differ
// hide them.
const WEIGHTS = [
  { className: 'font-light', weight: 300, use: 'marketing display copy' },
  { className: 'font-normal', weight: 400, use: 'the default' },
  { className: 'font-medium', weight: 500, use: 'emphasised body' },
  { className: 'font-semibold', weight: 600, use: 'the default for headings' },
  { className: 'font-bold', weight: 700, use: 'hero titles' },
];

export const Weights: Story = {
  render: () => (
    <div className="max-w-prose">
      {WEIGHTS.map(({ className, weight, use }) => (
        <Row key={className} label={`${className} · ${weight}`}>
          <p className={clsx('text-base', className)}>
            Servers stay healthy when alerts stay quiet.
          </p>
          <p className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">
            Used for {use}.
          </p>
        </Row>
      ))}
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
      <p className="text-brand-600 dark:text-brand-400">Brand — links, accents, primary CTAs.</p>
      <p className="text-emerald-700 dark:text-emerald-400">Success — positive state.</p>
      <p className="text-amber-700 dark:text-amber-400">Warning — degraded state.</p>
      <p className="text-red-700 dark:text-red-400">Danger — critical state, errors.</p>
    </div>
  ),
};
