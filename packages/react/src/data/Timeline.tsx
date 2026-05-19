import { clsx } from 'clsx';
import type { ElementType, ReactNode } from 'react';
import { Avatar } from '../ui/Avatar';

export type TimelineItem = {
  id: string;
  /** Label or rendered title for the entry. */
  title: ReactNode;
  /** Optional secondary line under the title. */
  description?: ReactNode;
  /** Time label — e.g. "5m ago", "2026-05-07 14:32". */
  time?: ReactNode;
  /** Lucide icon — used by `dot` and `stepper` variants. */
  icon?: ElementType;
  /** Initials/name for `avatar` variant. */
  avatarName?: string;
  /** Optional image URL for `avatar` variant. */
  avatarSrc?: string;
  /**
   * Visual tone for `stepper` variant (icon circle background).
   * Defaults to `brand`.
   */
  tone?: TimelineTone;
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
  | 'card';

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

// ── Body (title + description + time) — shared across all line variants ──────

const Body = ({ item }: { item: TimelineItem }) => (
  <div className="min-w-0 flex-1 pb-2 last:pb-0">
    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
    {item.description && (
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
    )}
    {item.time && (
      <p className="mt-0.5 font-mono text-[10px] text-gray-400 uppercase">{item.time}</p>
    )}
  </div>
);

// ── Main component ──────────────────────────────────────────────────────────

export const Timeline = ({ items, variant = 'dot', className }: TimelineProps) => {
  // `card` keeps its own simple stacked layout — no connector line, no
  // indicator column to align.
  if (variant === 'card') {
    return (
      <ol className={clsx('space-y-3', className)}>
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
              </div>
              {item.time && (
                <span className="shrink-0 font-mono text-[10px] text-gray-400 uppercase">
                  {item.time}
                </span>
              )}
            </div>
          </li>
        ))}
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
    <ol className={clsx('flex flex-col', className)}>
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
