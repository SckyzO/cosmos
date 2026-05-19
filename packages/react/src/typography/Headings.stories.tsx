import type { Meta, StoryObj } from '@storybook/react-vite';

// Headings live as pure Tailwind classes — wrapping every H1-H6 in a
// dedicated component would add ceremony without buying anything. This
// stories file is the canonical reference for the typographic ramp + the
// most common heading decorations (mark, gradient, badge, subtitle).
const meta: Meta = {
  title: 'Typography/Headings',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

const Hint = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-[10px] tracking-wider text-gray-500 uppercase dark:text-gray-400">
    {children}
  </span>
);

export const Scale: Story = {
  render: () => (
    <div className="space-y-6 text-gray-900 dark:text-white">
      {[
        ['h1', 'text-5xl font-bold tracking-tight', 'Page title'],
        ['h2', 'text-4xl font-bold tracking-tight', 'Section heading'],
        ['h3', 'text-3xl font-semibold', 'Subsection heading'],
        ['h4', 'text-2xl font-semibold', 'Group heading'],
        ['h5', 'text-xl font-semibold', 'Sidebar heading'],
        ['h6', 'text-lg font-semibold', 'Deepest heading'],
      ].map(([tag, cls, label]) => (
        <div key={tag} className="flex items-baseline gap-4">
          <Hint>{tag}</Hint>
          <span className={cls}>{label}</span>
        </div>
      ))}
    </div>
  ),
};

export const Highlighted: Story = {
  render: () => (
    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
      Cosmos is the design system for <span className="text-brand-500">monitoring tools</span>.
    </h1>
  ),
};

export const Mark: Story = {
  render: () => (
    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
      Built for{' '}
      <mark className="bg-brand-500 rounded-md px-2 py-0.5 text-white">
        SREs and platform teams
      </mark>
      .
    </h1>
  ),
};

export const Gradient: Story = {
  render: () => (
    <h1 className="from-brand-500 bg-gradient-to-r to-fuchsia-500 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
      Observability, refined.
    </h1>
  ),
};

export const Underline: Story = {
  render: () => (
    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
      The{' '}
      <span className="decoration-brand-500 underline decoration-8 underline-offset-4">
        right primitives
      </span>{' '}
      for the job.
    </h1>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Cosmos v0.1.0
      </h2>
      <span className="ring-brand-500/40 bg-brand-500/10 text-brand-500 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1">
        Beta
      </span>
    </div>
  ),
};

export const WithSubtitle: Story = {
  render: () => (
    <div>
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
        Welcome to Cosmos
      </h1>
      <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
        Design tokens, React components and page templates for the monitoring-hub stack.
      </p>
    </div>
  ),
};

export const AsLink: Story = {
  render: () => (
    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
      <a
        href="#"
        className="hover:text-brand-500 transition-colors hover:underline hover:underline-offset-4"
      >
        Read the changelog →
      </a>
    </h2>
  ),
};
