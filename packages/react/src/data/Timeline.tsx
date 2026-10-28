import { clsx } from 'clsx';
import { useId, type ElementType, type ReactNode } from 'react';
import { Avatar } from '../ui/Avatar';
import type { Intent } from '../ui/intent';
import { TIMESTAMP_CLASS } from '../ui/timestamp';

export type TimelineItem = {
  id: string;
  /** Label or rendered title for the entry. */
  title: ReactNode;
  /** Optional secondary line under the title. */
  description?: ReactNode;
  /** Time label — e.g. "5m ago", "2026-05-07 14:32". */
  time?: ReactNode;
  /** Lucide icon — used by `dot`, `stepper` and `alternating` variants. */
  icon?: ElementType;
  /** Initials/name for `avatar` variant. */
  avatarName?: string;
  /** Optional image URL for `avatar` variant. */
  avatarSrc?: string;
  /**
   * The state of the event, as a color on its marker: the icon circle of
   * `stepper` and `alternating` (tinted), the dot of `dot`, a ring around the
   * avatar of `avatar`, the start edge of the card of `card`. Defaults to
   * `brand` in `dot`, `stepper` and `alternating`; `avatar` and `card` draw
   * nothing without it, so an item with no `intent` keeps its look there.
   */
  intent?: TimelineIntent;
  /** Extra line under the description, e.g. "by Sarah Chen". */
  meta?: ReactNode;
  /**
   * Section label, e.g. "Today". Consecutive items with the same `group` get
   * one header above them.
   */
  group?: string;
};

export type TimelineIntent = Extract<
  Intent,
  'brand' | 'success' | 'warning' | 'danger' | 'neutral'
>;

export type TimelineVariant =
  /** Small coloured dot — concise activity stream. */
  | 'dot'
  /** Avatar (initials or image) — useful when authorship matters. */
  | 'avatar'
  /**
   * Flowbite-style stepper timeline — large icon circle (40px) with the
   * Lucide icon at 20px, tinted background per `intent`. Best for hero
   * activity feeds or onboarding-style step-by-step views.
   */
  | 'stepper'
  /** Each entry rendered as a stand-alone card (no connector line). */
  | 'card'
  /**
   * Cards alternating between the two sides of a centred line, with a `stepper`
   * icon circle on the line and the time on the other side. Below `md`, one
   * column with the line at the start.
   */
  | 'alternating';

export type TimelineProps = {
  items: TimelineItem[];
  variant?: TimelineVariant;
  className?: string;
};

// ── Intent colour map for the `stepper` variant ──────────────────────────────

const INTENT_BG: Record<TimelineIntent, string> = {
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

// ── Intent colours for the `dot`, `avatar` and `card` variants ───────────────

// A coloured marker on a neutral surface: `-600` on the light themes, `-500` on the dark ones.
// `brand` keeps the dot's `bg-brand-500`. The icon in the dot is white, except on the green and amber
// `-500` fills, where white is about 2.2:1: it turns dark there, as on a solid `Button` or `Badge`.
// Tailwind scans for whole class names, so each is written out.
const INTENT_MARKER: Record<
  TimelineIntent,
  { dot: string; dotIcon: string; ring: string; edge: string }
> = {
  brand: {
    dot: 'bg-brand-500',
    dotIcon: 'text-white',
    ring: 'ring-brand-600 dark:ring-brand-500',
    edge: 'border-s-brand-600 dark:border-s-brand-500',
  },
  success: {
    dot: 'bg-green-600 dark:bg-green-500',
    dotIcon: 'text-white dark:text-gray-900',
    ring: 'ring-green-600 dark:ring-green-500',
    edge: 'border-s-green-600 dark:border-s-green-500',
  },
  warning: {
    dot: 'bg-amber-600 dark:bg-amber-500',
    dotIcon: 'text-white dark:text-gray-900',
    ring: 'ring-amber-600 dark:ring-amber-500',
    edge: 'border-s-amber-600 dark:border-s-amber-500',
  },
  danger: {
    dot: 'bg-red-600 dark:bg-red-500',
    dotIcon: 'text-white',
    ring: 'ring-red-600 dark:ring-red-500',
    edge: 'border-s-red-600 dark:border-s-red-500',
  },
  neutral: {
    dot: 'bg-gray-600 dark:bg-gray-500',
    dotIcon: 'text-white',
    ring: 'ring-gray-600 dark:ring-gray-500',
    edge: 'border-s-gray-600 dark:border-s-gray-500',
  },
};

// ── Indicator renderers (one per variant) ────────────────────────────────────

const DotIndicator = ({
  icon: Icon,
  intent = 'brand',
}: {
  icon?: ElementType;
  intent?: TimelineIntent;
}) => (
  <span
    className={clsx(
      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900',
      INTENT_MARKER[intent].dot
    )}
  >
    {Icon && <Icon className={clsx('h-3.5 w-3.5', INTENT_MARKER[intent].dotIcon)} />}
  </span>
);

// The ring sits outside the avatar, so it shows around an image as well as around initials.
const AvatarIndicator = ({
  name,
  src,
  intent,
}: {
  name?: string;
  src?: string;
  intent?: TimelineIntent;
}) => (
  <Avatar
    size="sm"
    name={name}
    src={src}
    className={clsx('shrink-0', intent && ['ring-2', INTENT_MARKER[intent].ring])}
  />
);

const StepperIndicator = ({
  icon: Icon,
  intent = 'brand',
}: {
  icon?: ElementType;
  intent?: TimelineIntent;
}) => (
  <span
    className={clsx(
      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900',
      INTENT_BG[intent]
    )}
  >
    {Icon ? <Icon className="h-5 w-5" /> : <span className="h-2 w-2 rounded-full bg-current" />}
  </span>
);

// ── Card ─────────────────────────────────────────────────────────────────────

// The card is a 1px gray frame. With an `intent` its start edge is 4px and takes the colour; the three
// other sides get their gray from classes of their own (not `border-gray-200` under a `border-s-*`),
// so no side depends on which class the CSS lists last. The padding gives back the 3px the thicker
// edge takes: the titles of cards with and without an `intent` start at the same place.
const CARD_PLAIN = 'border border-gray-200 p-3 dark:border-gray-800';
const CARD_EDGED =
  'border-y border-e border-s-4 border-y-gray-200 border-e-gray-200 py-3 pe-3 ps-[calc(var(--spacing)*3-3px)] dark:border-y-gray-800 dark:border-e-gray-800';

// ── Body (title + description + meta + time) — shared across line variants ───

const Meta = ({ meta }: { meta: ReactNode }) =>
  meta ? <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{meta}</p> : null;

const Body = ({
  item,
  variant,
  isLast,
}: {
  item: TimelineItem;
  variant: TimelineVariant;
  isLast: boolean;
}) => (
  // The gap under an entry keeps it apart from the next title; the last one has none.
  <div className={clsx('min-w-0 flex-1', !isLast && 'pb-6')}>
    {/* The time shares the title row; the dot's row is as tall as its indicator, so the title centres on it. */}
    <div
      className={clsx(
        'flex justify-between gap-3',
        variant === 'dot' ? 'min-h-6 items-center' : 'items-baseline'
      )}
    >
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
        <bdi>{item.title}</bdi>
      </p>
      {item.time && <span className={clsx(TIMESTAMP_CLASS, 'shrink-0')}>{item.time}</span>}
    </div>
    {item.description && (
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
    )}
    <Meta meta={item.meta} />
  </div>
);

// ── One list of entries ─────────────────────────────────────────────────────

type TimelineListProps = TimelineProps & {
  /** Position of the first item in the whole timeline: sides keep alternating across groups. */
  startIndex?: number;
  /** Id of the group header naming this list. */
  labelledBy?: string;
};

const TimelineList = ({
  items,
  variant = 'dot',
  className,
  startIndex = 0,
  labelledBy,
}: TimelineListProps) => {
  // `card` keeps its own simple stacked layout — no connector line, no
  // indicator column to align.
  if (variant === 'card') {
    return (
      <ol aria-labelledby={labelledBy} className={clsx('space-y-3', className)}>
        {items.map((item) => (
          <li
            key={item.id}
            className={clsx(
              'rounded-xl bg-white dark:bg-gray-900',
              item.intent ? [CARD_EDGED, INTENT_MARKER[item.intent].edge] : CARD_PLAIN
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  <bdi>{item.title}</bdi>
                </p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                )}
                <Meta meta={item.meta} />
              </div>
              {item.time && <span className={clsx(TIMESTAMP_CLASS, 'shrink-0')}>{item.time}</span>}
            </div>
          </li>
        ))}
      </ol>
    );
  }

  // One grid row per entry: indicator column, card, and (from `md`) the time
  // on the other side of the line. Even positions put the card on the start side.
  if (variant === 'alternating') {
    return (
      <ol aria-labelledby={labelledBy} className={clsx('flex flex-col', className)}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const atStart = (startIndex + i) % 2 === 0;
          return (
            <li
              key={item.id}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 md:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)]"
            >
              <div className="col-start-1 row-start-1 flex flex-col items-center md:col-start-2">
                <StepperIndicator icon={item.icon} intent={item.intent} />
                {!isLast && <span className="my-1 w-px flex-1 bg-gray-200 dark:bg-gray-700" />}
              </div>
              <div
                className={clsx(
                  'col-start-2 row-start-1',
                  atStart ? 'md:col-start-1' : 'md:col-start-3',
                  !isLast && 'pb-6'
                )}
              >
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    <bdi>{item.title}</bdi>
                  </p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  )}
                  <Meta meta={item.meta} />
                  {item.time && (
                    <p className={clsx(TIMESTAMP_CLASS, 'mt-2 md:hidden')}>{item.time}</p>
                  )}
                </div>
              </div>
              {item.time && (
                <p
                  className={clsx(
                    TIMESTAMP_CLASS,
                    'row-start-1 hidden pt-3 md:block',
                    atStart ? 'md:col-start-3' : 'md:col-start-1 md:text-end'
                  )}
                >
                  {item.time}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    );
  }

  // Shared flex-column layout for `dot`, `avatar`, `stepper`. The connector
  // line is rendered per-item *inside* the indicator column, so it always
  // tracks the actual indicator size rather than relying on a `border-l`
  // tracked on the parent `<ol>` (which used to drift away from larger
  // indicators like avatars and stepper icon circles).
  const gap = variant === 'stepper' ? 'gap-x-4' : 'gap-x-3';

  return (
    <ol aria-labelledby={labelledBy} className={clsx('flex flex-col', className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <li key={item.id} className={clsx('flex', gap)}>
            {/* Indicator + vertical connector. */}
            <div className="flex flex-col items-center">
              {variant === 'avatar' ? (
                <AvatarIndicator name={item.avatarName} src={item.avatarSrc} intent={item.intent} />
              ) : variant === 'stepper' ? (
                <StepperIndicator icon={item.icon} intent={item.intent} />
              ) : (
                <DotIndicator icon={item.icon} intent={item.intent} />
              )}
              {!isLast && <span className="my-1 w-px flex-1 bg-gray-200 dark:bg-gray-700" />}
            </div>
            {/* Content. */}
            <Body item={item} variant={variant} isLast={isLast} />
          </li>
        );
      })}
    </ol>
  );
};

// ── Groups ───────────────────────────────────────────────────────────────────

type TimelineRun = { group?: string; start: number; items: TimelineItem[] };

/** Consecutive items sharing a `group` form one run, headed by that group. */
const groupRuns = (items: TimelineItem[]) => {
  const runs: TimelineRun[] = [];
  items.forEach((item, i) => {
    const last = runs[runs.length - 1];
    if (last && last.group === item.group) last.items.push(item);
    else runs.push({ group: item.group, start: i, items: [item] });
  });
  return runs;
};

const GroupHeader = ({ id, label, centred }: { id: string; label: string; centred: boolean }) =>
  centred ? (
    // A pill on the line; it moves to the start with the line below `md`.
    <h3 id={id} className="mb-4 flex md:justify-center">
      <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
        {label}
      </span>
    </h3>
  ) : (
    <h3
      id={id}
      className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
    >
      {label}
    </h3>
  );

// ── Main component ──────────────────────────────────────────────────────────

export const Timeline = ({ items, variant = 'dot', className }: TimelineProps) => {
  const baseId = useId();
  const runs = groupRuns(items);
  // Without groups the timeline stays one list.
  if (runs.every((run) => !run.group)) {
    return <TimelineList items={items} variant={variant} className={className} />;
  }
  return (
    <div className={clsx('space-y-6', className)}>
      {runs.map((run, i) => {
        const headerId = `${baseId}-group-${i}`;
        return (
          <div key={run.start}>
            {run.group && (
              <GroupHeader id={headerId} label={run.group} centred={variant === 'alternating'} />
            )}
            <TimelineList
              items={run.items}
              variant={variant}
              startIndex={run.start}
              labelledBy={run.group ? headerId : undefined}
            />
          </div>
        );
      })}
    </div>
  );
};
