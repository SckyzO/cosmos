import { useState } from 'react';
import {
  Badge,
  COSMOS_ACCENTS,
  COSMOS_THEMES,
  DataTable,
  KpiCard,
  SegmentedControl,
  TableIdentityCell,
  TrendDelta,
  type ColumnDef,
} from '../../../../packages/react/src';
import { LineAreaChart } from '../../../../packages/charts/src';
import { figuresOf, recipeHref, type CatalogComponent } from './catalog';
import { CARD, CTA_VARIANT, MONO, PAGE, TEXT_LINK, cx } from './styles';

// ── The figures ──────────────────────────────────────────────────────────────

const Figure = ({ value, label }: { value: string; label: string }) => (
  <div className="min-w-0">
    <dd className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] tabular-nums">
      {value}
    </dd>
    <dt className="text-xs text-[var(--color-text-secondary)]">{label}</dt>
  </div>
);

// The counts come from the story index; before it has loaded, or without it, a dash.
const Figures = ({ components }: { components: CatalogComponent[] | null }) => {
  const figures = components && figuresOf(components);
  return (
    <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
      <Figure value={figures ? String(figures.components) : '—'} label="components and patterns" />
      <Figure value={figures ? String(figures.charts) : '—'} label="chart wrappers" />
      <Figure
        value={`${COSMOS_THEMES.length} × ${COSMOS_ACCENTS.length}`}
        label="themes × accents"
      />
      <Figure value="LTR · RTL" label="both directions" />
    </dl>
  );
};

// ── The preview: a workspace overview ────────────────────────────────────────

type Customer = {
  id: string;
  name: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Overdue';
};

// Fictional and fixed: the preview reads the same on every run.
const CUSTOMERS: Customer[] = [
  { id: 'lindqvist', name: 'Lindqvist Studio', amount: '€2,400.00', status: 'Paid' },
  { id: 'harbor', name: 'Harbor & Pine', amount: '€860.00', status: 'Pending' },
  { id: 'kestrel', name: 'Kestrel Labs', amount: '€1,125.50', status: 'Overdue' },
];

const STATUS_INTENT = { Paid: 'success', Pending: 'warning', Overdue: 'danger' } as const;

const COLUMNS: ColumnDef<Customer>[] = [
  {
    key: 'customer',
    label: 'Customer',
    mobile: 'title',
    render: (c) => <TableIdentityCell title={c.name} />,
  },
  { key: 'amount', label: 'Amount', align: 'end', render: (c) => c.amount },
  {
    key: 'status',
    label: 'Status',
    render: (c) => <Badge intent={STATUS_INTENT[c.status]}>{c.status}</Badge>,
  },
];

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

const SIGNUPS = {
  '7d': {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [
      { name: 'Web', data: [120, 132, 101, 154, 190, 168, 205] },
      { name: 'Mobile', data: [62, 70, 88, 84, 97, 120, 131] },
    ],
  },
  '30d': {
    categories: ['Oct 1', 'Oct 4', 'Oct 7', 'Oct 10', 'Oct 13', 'Oct 16', 'Oct 19', 'Oct 22'],
    series: [
      { name: 'Web', data: [310, 360, 340, 420, 470, 450, 520, 560] },
      { name: 'Mobile', data: [150, 170, 200, 190, 240, 280, 300, 330] },
    ],
  },
} as const;

type Range = keyof typeof SIGNUPS;

const OrbitPreview = ({ recipe }: { recipe: string | undefined }) => {
  const [range, setRange] = useState<Range>('7d');
  const signups = SIGNUPS[range];
  return (
    <figure className="min-w-0">
      <div className={cx(CARD, 'overflow-hidden shadow-sm')}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="bg-brand-500 flex size-7 items-center justify-center rounded-md text-xs font-bold text-white"
            >
              O
            </span>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Orbit · Overview
            </span>
          </div>
          <SegmentedControl
            aria-label="Period"
            size="sm"
            options={RANGES}
            value={range}
            onChange={(value) => setRange(value as Range)}
          />
        </div>
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <KpiCard
              label="Active users"
              value="12,480"
              delta={<TrendDelta size="sm" value={6.4} />}
            />
            <KpiCard label="Revenue" value="€84.2k" delta={<TrendDelta size="sm" value={3.1} />} />
            <KpiCard
              className="max-sm:hidden"
              label="Open tickets"
              value="37"
              delta={<TrendDelta size="sm" value={-12} goodDirection="down" />}
            />
          </div>
          <div className="rounded-lg border border-[var(--color-border)] p-3">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Sign-ups</p>
            <LineAreaChart
              variant="line"
              series={signups.series.map((s) => ({ name: s.name, data: [...s.data] }))}
              categories={[...signups.categories]}
              height={170}
              ariaLabel={`Sign-ups over ${range === '7d' ? '7' : '30'} days, web and mobile`}
            />
          </div>
          <DataTable<Customer>
            aria-label="Invoices"
            rows={CUSTOMERS}
            columns={COLUMNS}
            rowKey={(c) => c.id}
            mobileLayout="cards"
          />
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-[var(--color-text-secondary)]">
        <span className={MONO}>KpiCard, SegmentedControl, LineAreaChart, DataTable, Badge</span> and{' '}
        <span className={MONO}>Avatar</span>, nothing else.{' '}
        {recipe ? (
          <a href={recipe} className={TEXT_LINK}>
            The Dashboard example has a full screen.
          </a>
        ) : (
          'The Dashboard example has a full screen.'
        )}
      </figcaption>
    </figure>
  );
};

// ── The introduction ─────────────────────────────────────────────────────────

export const Hero = ({ components }: { components: CatalogComponent[] | null }) => (
  <section id="top" aria-labelledby="top-title" className="scroll-mt-16">
    <div
      className={cx(
        PAGE,
        'grid gap-10 py-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:py-16'
      )}
    >
      <div className="min-w-0">
        <p className={cx(MONO, 'text-brand-600 dark:text-brand-400 uppercase')}>
          Components · Theme · Charts
        </p>
        <h1
          id="top-title"
          className="mt-2 text-4xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-5xl"
        >
          Cosmos design system
        </h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-[var(--color-text-secondary)]">
          Components, a theme and chart wrappers for dashboards, admin tools and monitoring. Every
          component follows the theme, the accent, the density, the corner radius and the reading
          direction you set on <code className="font-mono text-[0.9em]">&lt;html&gt;</code>.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <a href="#get-started" className={CTA_VARIANT.primary}>
            Get started
          </a>
          <a href="#components" className={CTA_VARIANT.secondary}>
            Browse components
          </a>
          <a href="#examples" className={CTA_VARIANT.ghost}>
            See the examples
          </a>
        </div>
        <Figures components={components} />
      </div>
      <OrbitPreview recipe={components ? recipeHref(components, 'Dashboard') : undefined} />
    </div>
  </section>
);
