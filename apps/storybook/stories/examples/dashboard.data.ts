// The data of the Dashboard recipe: "Harvest Box", a meal-kit delivery service, seen through its
// subscriptions. Everything is fixed (no clock, no randomness): "today" is Thursday 29 October
// 2026, the series are formulas of their index, and the people and companies are fictional.
import { Package, Receipt, TrendingDown, Users, type LucideIcon } from 'lucide-react';

// ── Small formatters ─────────────────────────────────────────────────────────

// A fixed locale and time zone keep the text the same on every machine.
const GROUPED = new Intl.NumberFormat('en-US');
const DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });
const DAY_MS = 86_400_000;
const TODAY = Date.UTC(2026, 9, 29);

export const euro = (value: number) => `€${GROUPED.format(Math.round(value))}`;

/** `412860` → `412.9k`, `12418906` → `12.4M`: what a narrow card can hold. */
export const abbreviate = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(Math.round(value));
};

export const euroShort = (value: number) => `€${abbreviate(value)}`;

/** A change in percentage points, signed: `+0.4 pt`, `-1.9 pt`. */
export const points = (value: number) =>
  `${value > 0 ? '+' : value < 0 ? '-' : ''}${Math.abs(value).toFixed(1)} pt`;

/** A smooth, repeatable series: `base` plus a slope and a wave, rounded. */
const wave = (length: number, base: number, slope: number, amplitude: number, phase = 0) =>
  Array.from({ length }, (_, i) =>
    Math.round(base + slope * i + amplitude * Math.sin((i + phase) * 0.9))
  );

const days = (count: number) =>
  Array.from({ length: count }, (_, i) => DAY.format(TODAY - (count - 1 - i) * DAY_MS));

// ── Date ranges ──────────────────────────────────────────────────────────────

export type RangeId = '7d' | '30d' | '90d' | '12m';

export const RANGE_OPTIONS: { label: string; value: RangeId }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: '12m', value: '12m' },
];

type Range = {
  /** Under the page title. */
  period: string;
  /** What the period is compared with, in the header: "previous 30 days". */
  compare: string;
  /** The same, short, after each delta: "vs last 30 days". */
  versus: string;
  /** Starts the revenue card's subtitle. */
  grain: string;
  categories: string[];
  revenue: number[];
  previous: number[];
};

// Weekly buckets end on the 29th; the label is the Thursday that opens each one.
const weeks = (count: number) =>
  Array.from({ length: count }, (_, i) => DAY.format(TODAY - (count - i) * 7 * DAY_MS + DAY_MS));

const months = Array.from({ length: 12 }, (_, i) => MONTH.format(Date.UTC(2025, 10 + i, 1)));

export const RANGES: Record<RangeId, Range> = {
  '7d': {
    period: '23 – 29 Oct 2026',
    compare: 'previous 7 days',
    versus: 'vs last 7 days',
    grain: 'Daily revenue',
    categories: days(7),
    revenue: wave(7, 13_600, 90, 700, 1),
    previous: wave(7, 13_100, 60, 650, 3),
  },
  '30d': {
    period: '30 Sep – 29 Oct 2026',
    compare: 'previous 30 days',
    versus: 'vs last 30 days',
    grain: 'Daily revenue',
    categories: days(30),
    revenue: wave(30, 12_400, 70, 800, 1),
    previous: wave(30, 11_900, 55, 750, 3),
  },
  '90d': {
    period: '1 Aug – 29 Oct 2026',
    compare: 'previous 90 days',
    versus: 'vs last 90 days',
    grain: 'Weekly revenue',
    categories: weeks(13),
    revenue: wave(13, 84_000, 1_900, 3_500, 1),
    previous: wave(13, 76_500, 1_500, 3_200, 3),
  },
  '12m': {
    period: 'Nov 2025 – Oct 2026',
    compare: 'previous 12 months',
    versus: 'vs previous 12 months',
    grain: 'Monthly revenue',
    categories: months,
    revenue: wave(12, 276_000, 11_500, 9_000, 1),
    previous: wave(12, 201_000, 8_500, 8_000, 3),
  },
};

// ── KPIs ─────────────────────────────────────────────────────────────────────

export type KpiId = 'mrr' | 'subscribers' | 'churn' | 'aov';

export type Kpi = {
  id: KpiId;
  label: string;
  icon: LucideIcon;
  /** The abbreviated figure a phone card can hold. */
  value: string;
  /** The exact figure behind it, for the tooltip and screen readers. */
  exactValue?: string;
  /** Signed change against the range's comparison. */
  delta: number;
  /** Churn is the one metric whose good news is a drop. */
  goodDirection: 'up' | 'down';
  /** Writes the delta, when it is not a percent. */
  formatDelta?: (value: number) => string;
  /** The metric over the range, for the sparkline. */
  spark: number[];
  /** Writes a sparkline value in its tooltip. */
  formatSpark: (value: number) => string;
};

const KPI_DELTAS: Record<RangeId, Record<KpiId, number>> = {
  '7d': { mrr: 0.8, subscribers: 0.6, churn: -0.2, aov: 0.4 },
  '30d': { mrr: 4.2, subscribers: 3.1, churn: -0.3, aov: 1.8 },
  '90d': { mrr: 11.6, subscribers: 8.4, churn: 0.4, aov: 3.2 },
  '12m': { mrr: 38.5, subscribers: 27.9, churn: -0.9, aov: 6.0 },
};

const sparkLength = (range: RangeId) => RANGES[range].categories.length;

export const kpisFor = (range: RangeId): Kpi[] => {
  const n = sparkLength(range);
  const delta = KPI_DELTAS[range];
  return [
    {
      id: 'mrr',
      label: 'Monthly revenue',
      icon: Receipt,
      value: euroShort(412_860),
      exactValue: '€412,860.00',
      delta: delta.mrr,
      goodDirection: 'up',
      spark: wave(n, 380_000, 1_100, 9_000, 1),
      formatSpark: euroShort,
    },
    {
      id: 'subscribers',
      label: 'Subscribers',
      icon: Users,
      value: `${abbreviate(38_214)}`,
      exactValue: GROUPED.format(38_214),
      delta: delta.subscribers,
      goodDirection: 'up',
      spark: wave(n, 36_200, 70, 260, 2),
      formatSpark: GROUPED.format,
    },
    {
      id: 'churn',
      label: 'Churn rate',
      icon: TrendingDown,
      value: '2.4%',
      delta: delta.churn,
      goodDirection: 'down',
      formatDelta: points,
      spark: wave(n, 24, 0, 3, 4).map((v) => v / 10),
      formatSpark: (value) => `${value.toFixed(1)}%`,
    },
    {
      id: 'aov',
      label: 'Avg. order',
      icon: Package,
      value: '€46.80',
      delta: delta.aov,
      goodDirection: 'up',
      spark: wave(n, 4_500, 6, 90, 5).map((v) => v / 100),
      formatSpark: (value) => `€${value.toFixed(2)}`,
    },
  ];
};

// ── Subscribers by plan ──────────────────────────────────────────────────────

export type Plan = { name: string; subscribers: number };

export const PLANS: Plan[] = [
  { name: 'Classic', subscribers: 15_820 },
  { name: 'Veggie', subscribers: 9_740 },
  { name: 'Family', subscribers: 7_360 },
  { name: 'Lean', subscribers: 5_294 },
];

// ── Top regions ──────────────────────────────────────────────────────────────

export type Region = { name: string; deliveries: number; delta: number };

export const REGIONS: Region[] = [
  { name: 'Île-de-France', deliveries: 14_820, delta: 5.1 },
  { name: 'Auvergne-Rhône-Alpes', deliveries: 8_940, delta: 3.4 },
  { name: "Provence-Alpes-Côte d'Azur", deliveries: 6_730, delta: 2.2 },
  { name: 'Occitanie', deliveries: 5_810, delta: 6.8 },
  { name: 'Nouvelle-Aquitaine', deliveries: 5_460, delta: -1.3 },
  { name: 'Hauts-de-France', deliveries: 4_390, delta: 0.9 },
  { name: 'Grand Est', deliveries: 3_870, delta: -2.6 },
];

// ── Recent cancellations ─────────────────────────────────────────────────────

export type Cancellation = {
  id: string;
  customer: string;
  email: string;
  plan: string;
  reason: string;
  /** Short date, as the row shows it. */
  date: string;
  /** Monthly revenue the subscription brought, in euros. */
  mrrLost: number;
};

export const CANCELLATIONS: Cancellation[] = [
  {
    id: 'c1',
    customer: 'Camille Dubois',
    email: 'camille.dubois@example.com',
    plan: 'Family',
    reason: 'Too expensive',
    date: '29 Oct',
    mrrLost: 189,
  },
  {
    id: 'c2',
    customer: 'Mathis Lefèvre',
    email: 'mathis.lefevre@example.com',
    plan: 'Classic',
    reason: 'Moving out of the delivery area',
    date: '28 Oct',
    mrrLost: 96,
  },
  {
    id: 'c3',
    customer: 'Inès Marchand',
    email: 'ines.marchand@example.com',
    plan: 'Veggie',
    reason: 'Too many repeated recipes',
    date: '28 Oct',
    mrrLost: 84,
  },
  {
    id: 'c4',
    customer: 'Hugo Barbier',
    email: 'hugo.barbier@example.com',
    plan: 'Lean',
    reason: 'Switched to another provider',
    date: '27 Oct',
    mrrLost: 112,
  },
  {
    id: 'c5',
    customer: 'Léa Fontaine',
    email: 'lea.fontaine@example.com',
    plan: 'Classic',
    reason: 'Late or damaged deliveries',
    date: '26 Oct',
    mrrLost: 96,
  },
  {
    id: 'c6',
    customer: 'Nathan Roche',
    email: 'nathan.roche@example.com',
    plan: 'Family',
    reason: 'Pausing while travelling',
    date: '25 Oct',
    mrrLost: 189,
  },
];

/** The line under the card's title. */
export const CANCELLATIONS_SUMMARY = 'Last 7 days · 38 subscribers left';

// ── Extreme content ──────────────────────────────────────────────────────────
// A national operator three years in: millions of euros, twelve plan variants with long names,
// regions named in full and a cancellation by someone with a very long name.

export const EXTREME_RANGE_ID: RangeId = '90d';
export const EXTREME_PERIOD = '3 Aug – 29 Oct 2026 · all markets, weekly';
export const EXTREME_VERSUS = 'vs prev. 90 days';

export const EXTREME_KPIS: Kpi[] = [
  {
    id: 'mrr',
    label: 'Monthly revenue',
    icon: Receipt,
    value: euroShort(12_418_906.4),
    exactValue: '€12,418,906.40',
    delta: -3.8,
    goodDirection: 'up',
    spark: wave(13, 12_900_000, -40_000, 90_000, 1),
    formatSpark: euroShort,
  },
  {
    id: 'subscribers',
    label: 'Subscribers',
    icon: Users,
    value: abbreviate(3_310_274),
    exactValue: GROUPED.format(3_310_274),
    delta: -2.1,
    goodDirection: 'up',
    spark: wave(13, 3_380_000, -5_000, 14_000, 2),
    formatSpark: GROUPED.format,
  },
  {
    id: 'churn',
    label: 'Churn rate',
    icon: TrendingDown,
    value: '7.8%',
    delta: 1.9,
    goodDirection: 'down',
    formatDelta: points,
    spark: wave(13, 62, 1.4, 3, 4).map((v) => v / 10),
    formatSpark: (value) => `${value.toFixed(1)}%`,
  },
  {
    id: 'aov',
    label: 'Avg. order',
    icon: Package,
    value: '€38.20',
    delta: -4.6,
    goodDirection: 'up',
    spark: wave(13, 4_000, -12, 70, 5).map((v) => v / 100),
    formatSpark: (value) => `€${value.toFixed(2)}`,
  },
];

export type PlanVariant = { name: string; subscribers: number };

// Largest first, as a report would list them.
export const EXTREME_VARIANTS: PlanVariant[] = [
  { name: 'Classic Family Feast, 5 dinners for 4 people', subscribers: 812_400 },
  { name: 'Gluten-free Veggie Deluxe, bi-weekly delivery', subscribers: 604_900 },
  { name: 'Lean High-Protein Athlete Plan, 3 lunches a week', subscribers: 511_300 },
  { name: 'Classic Duo, 3 dinners for 2 people', subscribers: 398_700 },
  { name: 'Veggie Starter, 2 dinners for 2 people', subscribers: 301_200 },
  { name: 'Family Value Box, 4 dinners for 5 people', subscribers: 244_800 },
  { name: 'Lean Office Lunch Pack', subscribers: 163_500 },
  { name: 'Classic Weekend Brunch Box', subscribers: 101_900 },
  { name: 'Vegan Discovery Box', subscribers: 69_200 },
  { name: 'Family Dessert Add-on', subscribers: 52_000 },
  { name: 'Pescatarian Seasonal Selection', subscribers: 30_100 },
  { name: 'Lean Keto Plus', subscribers: 20_274 },
];

export const EXTREME_CATEGORIES = weeks(13);

/** Weekly revenue of each variant, in euros: a share of what its subscribers pay. */
export const EXTREME_VARIANT_REVENUE = EXTREME_VARIANTS.map((variant, i) => ({
  name: variant.name,
  data: wave(
    13,
    Math.round(variant.subscribers * 0.87),
    variant.subscribers / 400,
    variant.subscribers / 40,
    i
  ),
}));

export const EXTREME_REGIONS: Region[] = [
  {
    name: 'Île-de-France (Paris and the inner and outer suburbs)',
    deliveries: 1_842_300,
    delta: -2.4,
  },
  {
    name: 'Auvergne-Rhône-Alpes (Lyon, Grenoble, Saint-Étienne)',
    deliveries: 1_194_800,
    delta: -3.9,
  },
  {
    name: "Provence-Alpes-Côte d'Azur et Corse, délégation Méditerranée",
    deliveries: 902_650,
    delta: -1.1,
  },
  { name: 'Occitanie (Toulouse, Montpellier, Perpignan)', deliveries: 774_120, delta: 0.8 },
  { name: 'Nouvelle-Aquitaine (Bordeaux, Limoges, Poitiers)', deliveries: 701_940, delta: -6.2 },
  { name: 'Hauts-de-France (Lille, Amiens)', deliveries: 590_410, delta: -4.7 },
  { name: 'Grand Est (Strasbourg, Metz, Reims)', deliveries: 512_080, delta: -2.9 },
  { name: 'Pays de la Loire (Nantes, Angers, Le Mans)', deliveries: 438_790, delta: -0.4 },
  { name: 'Bretagne (Rennes, Brest, Vannes)', deliveries: 361_220, delta: 1.6 },
  { name: 'Normandie (Rouen, Caen, Le Havre)', deliveries: 297_340, delta: -5.3 },
  { name: 'Bourgogne-Franche-Comté (Dijon, Besançon)', deliveries: 214_960, delta: -3.1 },
  { name: 'Centre-Val de Loire (Orléans, Tours)', deliveries: 186_570, delta: -2.2 },
];

export const EXTREME_CANCELLATIONS: Cancellation[] = [
  {
    id: 'x1',
    customer: 'Maximilian von Hohenzollern-Sigmaringen',
    email: 'maximilian.von.hohenzollern-sigmaringen@example.com',
    plan: 'Gluten-free Veggie Deluxe, bi-weekly delivery',
    reason: 'Too expensive',
    date: '29 Oct',
    mrrLost: 1_284_000,
  },
  {
    id: 'x2',
    customer: 'Anne-Sophie de la Rochefoucauld-Montbel',
    email: 'anne-sophie.rochefoucauld@example.com',
    plan: 'Lean High-Protein Athlete Plan, 3 lunches a week',
    reason: 'The recipes no longer fit a medically supervised diet',
    date: '29 Oct',
    mrrLost: 842_500,
  },
  {
    id: 'x3',
    customer: 'Zoé Ng',
    email: 'zoe.ng@example.com',
    plan: 'Vegan Discovery Box',
    reason: 'Moving abroad',
    date: '28 Oct',
    mrrLost: 96,
  },
];

export const EXTREME_CANCELLATIONS_SUMMARY = 'Last 7 days · 18,412 subscribers left';

// ── Top N and Other ──────────────────────────────────────────────────────────
// The palette has eight colours. A chart with more series or slices than that would repeat a
// colour, so the data groups the tail into one "Other" before it reaches the chart.

/** The `limit` largest items, then one "Other" holding the rest (none when everything fits). */
export const topWithOther = <T extends { name: string }>(
  items: T[],
  value: (item: T) => number,
  limit: number
): { name: string; value: number }[] => {
  const ranked = [...items].sort((a, b) => value(b) - value(a));
  const head = ranked.slice(0, limit).map((item) => ({ name: item.name, value: value(item) }));
  const tail = ranked.slice(limit);
  return tail.length === 0
    ? head
    : [...head, { name: 'Other', value: tail.reduce((sum, item) => sum + value(item), 0) }];
};

/** The same for chart series: the `limit` with the largest total, then the rest added point by point. */
export const topSeriesWithOther = (
  series: { name: string; data: number[] }[],
  limit: number
): { name: string; data: number[] }[] => {
  const total = (s: { data: number[] }) => s.data.reduce((sum, v) => sum + v, 0);
  const ranked = [...series].sort((a, b) => total(b) - total(a));
  const tail = ranked.slice(limit);
  if (tail.length === 0) return ranked;
  const other = tail[0].data.map((_, i) => tail.reduce((sum, s) => sum + s.data[i], 0));
  return [...ranked.slice(0, limit), { name: 'Other', data: other }];
};
