import { clsx } from 'clsx';
import { useId, type ElementType, type ReactNode } from 'react';
import { Avatar } from '../ui/Avatar';

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
   * Visual tone for `stepper` and `alternating` variants (icon circle
   * background). Defaults to `brand`.
   */
  tone?: TimelineTone;
  /** Extra line under the description, e.g. "by Sarah Chen". */
  meta?: ReactNode;
  /**
   * Section label, e.g. "Today". Consecutive items with the same `group` get
   * one header above them.
   */
  group?: string;
};

export type TimelineTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

export type TimelineVariant =
  /** Small coloured dot — concise activity stream. */
  | 'dot'
  /** Avatar (initials or image) — useful when authorship matters. */
  | 'avatar'
  /**
   * Flowbite-style stepper timeline — large icon circle (40px) with the
   * Lucide icon at 20px, tinted background per `tone`. Best for hero
   * activity feeds or onboarding-style step-by-step views.
   */
  | 'stepper'
  /** Each entry rendered as a stand-alone card (no connector line). */
  | 'card'
  /**
   * Cards alternating left and right of a centred line, with a `stepper`
   * icon circle on the line and the time on the other side. Below `md`, one
   * column with the line on the left.
   */
  | 'alternating';

export type TimelineProps = {
  items: TimelineItem[];
  variant?: TimelineVariant;
  className?: string;
};

// ── Tone colour map for the `stepper` variant ────────────────────────────────

const TONE_BG: Record<TimelineTone, string> = {
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

// ── Indicator renderers (one per variant) ────────────────────────────────────

const DotIndicator = ({ icon: Icon }: { icon?: ElementType }) => (
  <span className="bg-brand-500 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900">
    {Icon && <Icon className="h-2.5 w-2.5 text-white" />}
  </span>
);

const AvatarIndicator = ({ name, src }: { name?: string; src?: string }) => (
  <Avatar size="sm" name={name} src={src} className="shrink-0" />
);

const StepperIndicator = ({
  icon: Icon,
  tone = 'brand',
}: {
  icon?: ElementType;
  tone?: TimelineTone;
}) => (
  <span
    className={clsx(
      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900',
      TONE_BG[tone]
    )}
  >
    {Icon ? <Icon className="h-5 w-5" /> : <span className="h-2 w-2 rounded-full bg-current" />}
  </span>
);

// ── Body (title + description + meta + time) — shared across line variants ───

const Meta = ({ meta }: { meta: ReactNode }) =>
  meta ? <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{meta}</p> : null;

const Body = ({ item }: { item: TimelineItem }) => (
  <div className="min-w-0 flex-1 pb-2 last:pb-0">
    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
    {item.description && (
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
    )}
    <Meta meta={item.meta} />
    {item.time && <p className="text-3xs mt-0.5 font-mono text-gray-400 uppercase">{item.time}</p>}
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
            className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                )}
                <Meta meta={item.meta} />
              </div>
              {item.time && (
                <span className="text-3xs shrink-0 font-mono text-gray-400 uppercase">
                  {item.time}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    );
  }

  // One grid row per entry: indicator column, card, and (from `md`) the time
  // on the other side of the line. Even positions put the card on the left.
  if (variant === 'alternating') {
    return (
      <ol aria-labelledby={labelledBy} className={clsx('flex flex-col', className)}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const left = (startIndex + i) % 2 === 0;
          return (
            <li
              key={item.id}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 md:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)]"
            >
              <div className="col-start-1 row-start-1 flex flex-col items-center md:col-start-2">
                <StepperIndicator icon={item.icon} tone={item.tone} />
                {!isLast && <span className="my-1 w-px flex-1 bg-gray-200 dark:bg-gray-700" />}
              </div>
              <div
                className={clsx(
                  'col-start-2 row-start-1',
                  left ? 'md:col-start-1' : 'md:col-start-3',
                  !isLast && 'pb-6'
                )}
              >
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  )}
                  <Meta meta={item.meta} />
                  {item.time && (
                    <p className="text-3xs mt-2 font-mono text-gray-400 uppercase md:hidden">
                      {item.time}
                    </p>
                  )}
                </div>
              </div>
              {item.time && (
                <p
                  className={clsx(
                    'text-3xs row-start-1 hidden pt-3 font-mono text-gray-400 uppercase md:block',
                    left ? 'md:col-start-3' : 'md:col-start-1 md:text-right'
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
                <AvatarIndicator name={item.avatarName} src={item.avatarSrc} />
              ) : variant === 'stepper' ? (
                <StepperIndicator icon={item.icon} tone={item.tone} />
              ) : (
                <DotIndicator icon={item.icon} />
              )}
              {!isLast && <span className="my-1 w-px flex-1 bg-gray-200 dark:bg-gray-700" />}
            </div>
            {/* Content. */}
            <Body item={item} />
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
    // A pill on the line; it moves to the left with the line below `md`.
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
