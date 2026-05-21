import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { icons, type LucideIcon } from 'lucide-react';
import { SearchInput } from '../../../packages/react/src';

// `icons` is lucide's canonical PascalCase map (no deprecated aliases) — the
// exact names you import: `import { Activity } from 'lucide-react'`.
const ALL = Object.entries(icons) as [string, LucideIcon][];
const TOTAL = ALL.length;

// Render a bounded slice by default so the grid stays snappy; searching reveals
// every match (matches are naturally narrow).
const DEFAULT_CAP = 240;

const meta = {
  title: 'Foundations/Icons',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Cosmos ships icons from lucide-react. Pass any icon to a component’s ' +
          '`icon` prop (e.g. `<Button icon={Plus} />`) or render it directly ' +
          '(`<Activity className="h-4 w-4" />`).',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const IconGallery = () => {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const term = query.trim().toLowerCase();
  const matches = useMemo(
    () => (term ? ALL.filter(([name]) => name.toLowerCase().includes(term)) : ALL),
    [term]
  );
  const shown = term ? matches : matches.slice(0, DEFAULT_CAP);

  const copyImport = async (name: string) => {
    try {
      await navigator.clipboard.writeText(`import { ${name} } from 'lucide-react';`);
      setCopied(name);
      window.setTimeout(() => setCopied((c) => (c === name ? null : c)), 1200);
    } catch {
      /* clipboard unavailable — non-fatal */
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold tracking-tight">Icons</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Powered by{' '}
          <a
            href="https://lucide.dev/icons/"
            target="_blank"
            rel="noreferrer"
            className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
          >
            lucide-react
          </a>
          . Pass any icon to a component’s <code className="text-xs">icon</code> prop or render it
          directly. Click a tile to copy its import.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="w-full max-w-sm">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={`Search ${TOTAL.toLocaleString()} icons…`}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {term
              ? `${matches.length.toLocaleString()} match${matches.length === 1 ? '' : 'es'}`
              : `Showing ${shown.length} of ${TOTAL.toLocaleString()} — type to search all`}
          </span>
        </div>

        {matches.length === 0 ? (
          <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No icon matches “{query}”.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2">
            {shown.map(([name, Icon]) => (
              <button
                key={name}
                type="button"
                onClick={() => copyImport(name)}
                title={`Copy: import { ${name} } from 'lucide-react'`}
                className="group hover:border-brand-400 hover:bg-brand-50 focus-visible:ring-brand-500 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10 flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 transition-colors focus:outline-none focus-visible:ring-2 dark:border-gray-800 dark:bg-gray-900"
              >
                <Icon
                  className="group-hover:text-brand-600 dark:group-hover:text-brand-400 h-6 w-6 text-gray-700 dark:text-gray-300"
                  aria-hidden
                />
                <span className="w-full truncate text-center font-mono text-[10px] text-gray-500 dark:text-gray-400">
                  {copied === name ? 'Copied!' : name}
                </span>
              </button>
            ))}
          </div>
        )}

        {!term && matches.length > DEFAULT_CAP && (
          <p className="mt-5 text-xs text-gray-400 dark:text-gray-500">
            +{(matches.length - DEFAULT_CAP).toLocaleString()} more — search to find any icon.
          </p>
        )}
      </div>
    </div>
  );
};

export const Gallery: Story = {
  render: () => <IconGallery />,
};

const SIZES: { px: number; label: string; cls: string }[] = [
  { px: 16, label: '16 — inline / dense', cls: 'h-4 w-4' },
  { px: 20, label: '20 — buttons, inputs', cls: 'h-5 w-5' },
  { px: 24, label: '24 — default', cls: 'h-6 w-6' },
  { px: 32, label: '32 — emphasis, empty states', cls: 'h-8 w-8' },
];

const SizeScale = () => {
  const { Rocket, Activity, Bell, Settings } = icons;
  const demo: LucideIcon[] = [Rocket, Activity, Bell, Settings];
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight">Icon sizes</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Size icons with Tailwind <code className="text-xs">h-* w-*</code> utilities. Cosmos
          components apply the right size automatically when you pass the{' '}
          <code className="text-xs">icon</code> prop.
        </p>
        <div className="mt-6 space-y-4">
          {SIZES.map(({ px, label, cls }) => (
            <div
              key={px}
              className="flex items-center gap-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex w-40 shrink-0 items-center gap-4">
                {demo.map((Icon, i) => (
                  <Icon key={i} className={`${cls} text-gray-700 dark:text-gray-300`} aria-hidden />
                ))}
              </div>
              <div className="min-w-0">
                <p className="font-mono text-sm text-gray-900 dark:text-white">{cls}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Sizes: Story = {
  render: () => <SizeScale />,
};
