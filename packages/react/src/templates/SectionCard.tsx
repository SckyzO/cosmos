import { type ComponentType, type ReactNode, useId } from 'react';
import { clsx } from 'clsx';
import { Card } from '../ui/Card';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { Sk } from '../feedback/Skeleton';

export type SectionCardIconTone = 'brand' | 'blue' | 'violet' | 'green' | 'amber' | 'red' | 'gray';

const TONE_CLASSES: Record<SectionCardIconTone, { color: string; bg: string }> = {
  brand: {
    color: 'text-brand-600 dark:text-brand-400',
    bg: 'bg-brand-500/10 dark:bg-brand-500/15',
  },
  blue: {
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
  },
  violet: {
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
  },
  green: {
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10 dark:bg-green-500/15',
  },
  amber: {
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
  },
  red: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10 dark:bg-red-500/15',
  },
  gray: {
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-500/10 dark:bg-gray-500/15',
  },
};

export type SectionCardProps = {
  /** Section title */
  title: string;
  /**
   * Heading element of the title. Default `h3`; under a page whose `PageHeader` is the `h1`
   * (`as="h1"`), pass `h2` so the levels go up by one.
   */
  as?: 'h2' | 'h3';
  /** Optional description shown below title */
  desc?: string;
  /** Optional icon component (lucide-react or any React component accepting className) */
  icon?: ComponentType<{ className?: string }>;
  /** Preset color theme for the icon (sets text + bg in one shot). */
  iconTone?: SectionCardIconTone;
  /** Tailwind text-* class for the icon. Overridden by `iconTone` when both are set. */
  iconColor?: string;
  /** Tailwind bg-* class for the icon container. Overridden by `iconTone` when both are set. */
  iconBg?: string;
  /**
   * At the end of the header: a button, a menu, a link. Below `sm` it goes under the title. It
   * stays in every state; remove it yourself where it makes no sense (`action={empty ? undefined : …}`).
   */
  action?: ReactNode;
  /**
   * The data is on its way: a skeleton replaces the body, the card is `aria-busy` and a status
   * line says what loads. Wins over `error` and `empty`.
   */
  loading?: boolean;
  /** The request failed: a compact `ErrorState` replaces the body. Wins over `empty`. */
  error?: boolean;
  /** What went wrong, as the title of the error. Default 'Something went wrong.' */
  errorMessage?: string;
  /** A line under `errorMessage`: the cause, or what to do next. */
  errorDescription?: string;
  /** With `error`, shows a "Try again" button that calls it. */
  onRetry?: () => void;
  /** There is nothing to show: a compact `EmptyState` replaces the body. */
  empty?: boolean;
  /** Title of the empty state. Default 'No data'. For a richer one, pass your own `EmptyState` as `children`. */
  emptyMessage?: string;
  /** Under the empty message: the way to fill the card (a button, a link). */
  emptyAction?: ReactNode;
  /**
   * A Tailwind `min-h-*` class (`min-h-44`) the body keeps in every state, so a card alone in its
   * row does not jump when it loads. In a grid the body already takes the height the row gives it.
   */
  minBodyHeight?: string;
  /** Card content */
  children?: ReactNode;
  /** On the root `<section>`: the place for a grid span (`lg:col-span-2`) or a margin. */
  className?: string;
};

/**
 * SectionCard — a `Card` (24px padding) with title, optional icon and description, an optional
 * `action` at the end of the header, and children. Its body can load, come back empty or fail on
 * its own (`loading`, `empty`, `error`): the header stays, so the reader knows which card it is.
 *
 * The de-facto building block for grouped content in a page. Use multiple
 * SectionCards stacked vertically (with `space-y-6`) or in a grid. The root is a `<section>` named
 * by the title, so a screen reader lists the cards of a page as regions.
 */
export const SectionCard = ({
  title,
  as: Heading = 'h3',
  desc,
  icon: Icon,
  iconTone,
  iconColor,
  iconBg,
  action,
  loading = false,
  error = false,
  errorMessage,
  errorDescription,
  onRetry,
  empty = false,
  emptyMessage = 'No data',
  emptyAction,
  minBodyHeight,
  children,
  className,
}: SectionCardProps) => {
  const titleId = useId();
  const tonePreset = iconTone ? TONE_CLASSES[iconTone] : null;
  const finalIconColor = tonePreset?.color ?? iconColor ?? 'text-[var(--color-text-muted)]';
  const finalIconBg = tonePreset?.bg ?? iconBg ?? 'bg-black/5 dark:bg-white/5';
  const inState = loading || error || empty;
  return (
    <section
      aria-labelledby={titleId}
      aria-busy={loading || undefined}
      className={clsx('flex flex-col', className)}
    >
      <Card padding="lg" className="flex flex-1 flex-col">
        {/* Below `sm` the action goes under the title; from `sm` it ends the row. */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <div
                className={clsx(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  finalIconBg
                )}
              >
                <Icon className={clsx('h-5 w-5', finalIconColor)} />
              </div>
            )}
            <div className="min-w-0">
              <Heading
                id={titleId}
                className="text-base font-semibold text-[var(--color-text-primary)]"
              >
                {title}
              </Heading>
              {desc && <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{desc}</p>}
            </div>
          </div>
          {action && <div className="shrink-0 max-sm:max-w-full max-sm:self-start">{action}</div>}
        </div>
        {/* The body takes what the row gives the card; a state fills it and centres itself. */}
        <div className={clsx('flex-1', inState && 'flex flex-col', minBodyHeight)}>
          {loading ? (
            <>
              <p role="status" className="sr-only">
                {title ? `Loading ${title}…` : 'Loading…'}
              </p>
              <Sk h="h-auto" round="rounded-lg" className="min-h-40 flex-1" />
            </>
          ) : error ? (
            <ErrorState
              compact
              title={errorMessage}
              description={errorDescription}
              onRetry={onRetry}
              className="flex-1"
            />
          ) : empty ? (
            <EmptyState compact title={emptyMessage} action={emptyAction} className="flex-1" />
          ) : (
            children
          )}
        </div>
      </Card>
    </section>
  );
};
