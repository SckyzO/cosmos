import { clsx } from 'clsx';
import type { ElementType, MouseEventHandler, ReactNode, Ref } from 'react';
import { Sk } from '../feedback/Skeleton';
import { INTENT_STYLE, type Intent } from '../ui/intent';

/** The meanings a card can carry: the plain one, or a metric that needs a look. */
export type KpiCardIntent = Extract<Intent, 'neutral' | 'warning' | 'danger'>;

export type KpiCardProps = {
  label: string;
  value: ReactNode;
  /** Smaller text under the value — e.g. "across 3 sites". */
  sub?: ReactNode;
  /** Lucide icon (or any component taking `className`), in a tinted chip next to the label. */
  icon?: ElementType;
  /**
   * Color of the icon chip. Default: the card's `intent` when it is `warning` or `danger`,
   * the accent otherwise.
   */
  iconIntent?: Intent;
  /** Under the value: normally a `<TrendDelta label="vs last month" />`. */
  delta?: ReactNode;
  /**
   * Under the delta, the full width of the card: a `Sparkline`, mini bars, a ring. You size it.
   * Cosmos does not couple `react` to `charts`, so the chart is yours to pass.
   */
  chart?: ReactNode;
  /**
   * Meaning of the metric. `warning` and `danger` take the border, the icon chip and the value
   * to the intent color; the background stays the card's. Default `neutral`.
   */
  intent?: KpiCardIntent;
  /**
   * Shows the value, the delta and the chart as skeletons and sets `aria-busy`. The slots keep
   * their layout: pass them as for the loaded card (a placeholder value, a `delta`, a `chart`),
   * their content is hidden and the card keeps its height.
   */
  loading?: boolean;
  /** Makes the whole card one link. */
  href?: string;
  /** Makes the whole card one button (a link when `href` is set too). */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Ref to the card's root: an `<a>` with `href`, a `<button>` with `onClick`, a `<div>` otherwise. */
  ref?: Ref<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement>;
  className?: string;
};

// While loading, the real content stays in the flow, hidden, so the card keeps its height;
// the skeleton is drawn over it.
const Slot = ({
  loading,
  skeleton,
  className,
  children,
}: {
  loading: boolean;
  skeleton: ReactNode;
  className?: string;
  children: ReactNode;
}) => (
  <span className={clsx('relative block', className)}>
    <span className={clsx('block', loading && 'invisible')}>{children}</span>
    {loading && (
      <span aria-hidden className="absolute inset-0 flex items-center">
        {skeleton}
      </span>
    )}
  </span>
);

/**
 * KpiCard — single key metric card : label, large value and, optionally, an icon, a delta
 * against a previous period and a chart. Use in dashboards as the top-row at-a-glance panel.
 * With `href` or `onClick` the whole card is one link or button.
 */
export const KpiCard = ({
  label,
  value,
  sub,
  icon: Icon,
  iconIntent,
  delta,
  chart,
  intent = 'neutral',
  loading = false,
  href,
  onClick,
  ref,
  className,
}: KpiCardProps) => {
  const chipIntent = iconIntent ?? (intent === 'neutral' ? 'brand' : intent);
  const chip = INTENT_STYLE[chipIntent];
  const interactive = Boolean(href || onClick);
  const classes = clsx(
    'flex flex-col rounded-2xl border bg-white p-5 text-left dark:bg-gray-900',
    INTENT_STYLE[intent].border,
    interactive &&
      'hover:border-brand-300 dark:hover:border-brand-500/40 focus-visible:focus-indicator cursor-pointer transition-shadow hover:shadow-sm',
    className
  );
  const content = (
    <>
      <span className="flex items-center justify-between gap-3">
        <span className="min-w-0 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
          {label}
        </span>
        {Icon && (
          <span
            className={clsx(
              'flex size-10 shrink-0 items-center justify-center rounded-xl',
              chip.tile,
              chip.iconColor
            )}
          >
            <Icon className="size-5" aria-hidden />
          </span>
        )}
      </span>
      <Slot
        loading={loading}
        className="mt-2"
        skeleton={<Sk as="span" h="h-[0.8em]" w="w-24" round="rounded-md" className="text-3xl" />}
      >
        <span
          className={clsx(
            'block text-3xl font-bold tracking-tight tabular-nums',
            intent === 'neutral' ? 'text-gray-900 dark:text-white' : INTENT_STYLE[intent].text
          )}
        >
          {value}
        </span>
      </Slot>
      {delta && (
        <Slot
          loading={loading}
          className="mt-2"
          skeleton={<Sk as="span" h="h-5" w="w-32" round="rounded-full" />}
        >
          {delta}
        </Slot>
      )}
      {sub && <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{sub}</span>}
      {chart && (
        <Slot
          loading={loading}
          className="mt-3"
          skeleton={<Sk as="span" h="h-full" round="rounded-lg" />}
        >
          {chart}
        </Slot>
      )}
    </>
  );
  if (href)
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        aria-busy={loading || undefined}
        className={classes}
      >
        {content}
      </a>
    );
  if (onClick)
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        aria-busy={loading || undefined}
        className={classes}
      >
        {content}
      </button>
    );
  return (
    <div ref={ref as Ref<HTMLDivElement>} aria-busy={loading || undefined} className={classes}>
      {content}
    </div>
  );
};
