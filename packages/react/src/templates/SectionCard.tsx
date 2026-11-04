import { type ComponentType, type ReactNode, useId } from 'react';
import { clsx } from 'clsx';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { Sk } from '../feedback/Skeleton';
import { useAfterSkeleton } from '../feedback/useAfterSkeleton';
import { INTENT_STYLE, type Intent } from '../ui/intent';

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

/**
 * What the card is made of: `outline` (default) is the plain card, `tinted` takes a tint of the
 * `intent`, `solid` its full fill.
 */
export type SectionCardVariant = 'outline' | 'tinted' | 'solid';

/** How far the `halo` reaches past the card: `sm`, `md` (default) or `lg`. */
export type SectionCardHaloSize = 'sm' | 'md' | 'lg';

/** Where the icon tile sits: before the title (default), at the end of the title block, or above it. */
export type SectionCardIconPosition = 'start' | 'end' | 'top';

/** The shape of the icon tile: a rounded square (default) or a circle. */
export type SectionCardIconShape = 'square' | 'round';

/** The card's padding: `sm` (16px), `md` (20px) or `lg` (24px, default). */
export type SectionCardSize = 'sm' | 'md' | 'lg';

/** The side of the card the `accent` band sits on. `start` and `end` follow the reading direction. */
export type SectionCardAccentSide = 'top' | 'end' | 'bottom' | 'start';

// The intent that colours the icon tile when the card has one, as a tone. `neutral` keeps the gray
// tile every card had.
const INTENT_TONE: Partial<Record<Intent, SectionCardIconTone>> = {
  brand: 'brand',
  info: 'blue',
  success: 'green',
  warning: 'amber',
  danger: 'red',
};

// The padding of the card and what follows it. `gap` separates the header from the body (it is a
// margin on the header); `bleed` takes a part (a footer, a flush body) out to the card's edges,
// `inset` pads it back, and `padBleed` is the padding of a card whose last part ends on its edge.
// `tableInset` pads the first and last cells of a flush table to the card's own padding, as a
// `Table` or `DataTable` pads its cells by 16px: `sm` is the same, so it has nothing to add.
const SIZE: Record<
  SectionCardSize,
  {
    pad: string;
    padBleed: string;
    gap: string;
    gapTop: string;
    bleed: string;
    inset: string;
    tableInset: string;
  }
> = {
  sm: {
    pad: 'p-4',
    padBleed: 'px-4 pt-4',
    gap: 'mb-3',
    gapTop: 'mt-3',
    bleed: '-mx-4',
    inset: 'px-4',
    tableInset: '',
  },
  md: {
    pad: 'p-5',
    padBleed: 'px-5 pt-5',
    gap: 'mb-3',
    gapTop: 'mt-3',
    bleed: '-mx-5',
    inset: 'px-5',
    tableInset: '[&_tr>:first-child]:ps-5 [&_tr>:last-child]:pe-5',
  },
  lg: {
    pad: 'p-6',
    padBleed: 'px-6 pt-6',
    gap: 'mb-4',
    gapTop: 'mt-4',
    bleed: '-mx-6',
    inset: 'px-6',
    tableInset: '[&_tr>:first-child]:ps-6 [&_tr>:last-child]:pe-6',
  },
};

// ── Surface ───────────────────────────────────────────────────────────────────
// Tailwind scans for whole class names, so every one is written out.

// The border of a card, plain or in the color of the intent. `outline` and `tinted` read it.
const BORDER: Record<Intent, string> = {
  neutral: 'border-[var(--color-border)] dark:border-gray-600',
  brand: INTENT_STYLE.brand.border,
  info: INTENT_STYLE.info.border,
  success: INTENT_STYLE.success.border,
  warning: INTENT_STYLE.warning.border,
  danger: INTENT_STYLE.danger.border,
};

// The tint is mixed into the theme's panel color, not laid on the page as a translucent layer:
// the surface stays opaque (a halo behind it does not show through) and follows the theme's panel
// (sand, deep blue) instead of a fixed `-50` of the palette.
const TINT: Record<Intent, string> = {
  neutral:
    'bg-[color-mix(in_oklab,var(--color-gray-500)_6%,var(--color-bg-panel))] dark:bg-[color-mix(in_oklab,var(--color-gray-500)_12%,var(--color-bg-panel))]',
  brand:
    'bg-[color-mix(in_oklab,var(--color-brand-500)_6%,var(--color-bg-panel))] dark:bg-[color-mix(in_oklab,var(--color-brand-500)_12%,var(--color-bg-panel))]',
  info: 'bg-[color-mix(in_oklab,var(--color-blue-500)_6%,var(--color-bg-panel))] dark:bg-[color-mix(in_oklab,var(--color-blue-500)_12%,var(--color-bg-panel))]',
  success:
    'bg-[color-mix(in_oklab,var(--color-green-500)_6%,var(--color-bg-panel))] dark:bg-[color-mix(in_oklab,var(--color-green-500)_12%,var(--color-bg-panel))]',
  warning:
    'bg-[color-mix(in_oklab,var(--color-amber-500)_6%,var(--color-bg-panel))] dark:bg-[color-mix(in_oklab,var(--color-amber-500)_12%,var(--color-bg-panel))]',
  danger:
    'bg-[color-mix(in_oklab,var(--color-red-500)_6%,var(--color-bg-panel))] dark:bg-[color-mix(in_oklab,var(--color-red-500)_12%,var(--color-bg-panel))]',
};

// The fill of a `solid` card and the ink on it, 4.5:1 or more in the four themes: white on the
// `-600`/`-700` of the palette (brand-600 holds it in every accent). A neutral card is the dark
// ink of the theme in a light theme and turns light, with dark ink, in a dark one.
const SOLID: Record<Intent, { fill: string; edge: string }> = {
  neutral: {
    fill: 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900',
    edge: 'border-gray-900 dark:border-gray-100',
  },
  brand: { fill: 'bg-brand-600 text-white', edge: 'border-brand-600' },
  info: { fill: 'bg-blue-700 text-white', edge: 'border-blue-700' },
  success: { fill: 'bg-green-700 text-white', edge: 'border-green-700' },
  warning: { fill: 'bg-amber-700 text-white', edge: 'border-amber-700' },
  danger: { fill: 'bg-red-700 text-white', edge: 'border-red-700' },
};

// The icon tile on a `solid` card: a veil over the fill, the icon in the card's ink.
const SOLID_TILE: Record<Intent, { bg: string; color: string }> = {
  neutral: { bg: 'bg-white/15 dark:bg-gray-900/10', color: 'text-white dark:text-gray-900' },
  brand: { bg: 'bg-black/15', color: 'text-white' },
  info: { bg: 'bg-black/15', color: 'text-white' },
  success: { bg: 'bg-black/15', color: 'text-white' },
  warning: { bg: 'bg-black/15', color: 'text-white' },
  danger: { bg: 'bg-black/15', color: 'text-white' },
};

// The line above a footer or a flush body on a `solid` card: a veil of the ink.
const SOLID_RULE: Record<Intent, string> = {
  neutral: 'border-white/25 dark:border-gray-900/25',
  brand: 'border-white/30',
  info: 'border-white/30',
  success: 'border-white/30',
  warning: 'border-white/30',
  danger: 'border-white/30',
};

// ── Halo ──────────────────────────────────────────────────────────────────────
// Two layers behind the card, in the `section` that does not clip: the card's edge in a gradient,
// and a blurred copy of that gradient around it. Both read the two hues the intent sets on the
// section. The hues come from the theme's variables (the accent, the status colors), with the
// palette's own as the fallback.

const HALO_HUES: Record<Intent, string> = {
  neutral:
    '[--halo-from:var(--color-gray-400)] [--halo-to:var(--color-gray-300)] dark:[--halo-from:var(--color-gray-500)] dark:[--halo-to:var(--color-gray-700)]',
  brand: '[--halo-from:var(--color-brand-500)] [--halo-to:var(--color-violet-500,#8b5cf6)]',
  info: '[--halo-from:var(--color-sky-500,#0ba5ec)] [--halo-to:var(--color-brand-500)]',
  success: '[--halo-from:var(--color-success-500)] [--halo-to:var(--color-cyan-500,#06b6d4)]',
  warning: '[--halo-from:var(--color-warning-500)] [--halo-to:var(--color-yellow-400,#facc15)]',
  danger: '[--halo-from:var(--color-error-500)] [--halo-to:var(--color-pink-500,#ec4899)]',
};

// The size sets the spread (how far the glow's box goes past the card, with the card's radius
// grown by as much) and the blur.
const HALO_GLOW: Record<SectionCardHaloSize, string> = {
  sm: '-inset-0.5 rounded-[calc(var(--radius-2xl)+0.125rem)] blur-sm',
  md: '-inset-1 rounded-[calc(var(--radius-2xl)+0.25rem)] blur-lg',
  lg: '-inset-2 rounded-[calc(var(--radius-2xl)+0.5rem)] blur-xl',
};

const HALO_GRADIENT = 'bg-linear-135 from-(--halo-from) to-(--halo-to)';

// ── Accent band ───────────────────────────────────────────────────────────────

// `-600` in light and `-500` in dark, as the intent's edge: 3:1 or more against the surface.
const ACCENT_COLOR: Record<Intent, string> = {
  neutral: 'bg-gray-500 dark:bg-gray-400',
  brand: 'bg-brand-600 dark:bg-brand-500',
  info: 'bg-blue-600 dark:bg-blue-500',
  success: 'bg-green-600 dark:bg-green-500',
  warning: 'bg-amber-600 dark:bg-amber-500',
  danger: 'bg-red-600 dark:bg-red-500',
};

const ACCENT_SIDE: Record<SectionCardAccentSide, string> = {
  top: 'inset-x-0 top-0 h-1',
  bottom: 'inset-x-0 bottom-0 h-1',
  start: 'inset-y-0 inset-s-0 w-1',
  end: 'inset-y-0 inset-e-0 w-1',
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
   * A node next to the title: a `StatusBadge`, a count. It wraps under the title when the row is
   * too narrow.
   */
  badge?: ReactNode;
  /**
   * Where the icon tile sits. `start` (default) leads the title, `end` closes the title block,
   * before the `action`, and `top` stacks it above the title. `start` and `end` follow the
   * reading direction.
   */
  iconPosition?: SectionCardIconPosition;
  /** The shape of the icon tile: `square` (default, rounded corners) or `round`. */
  iconShape?: SectionCardIconShape;
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
  /**
   * The meaning of the card, as a color: `neutral` (default, the plain card), `brand`, `info`,
   * `success`, `warning` or `danger`. On `outline` a meaning colors the border; `tinted` and
   * `solid` fill the card with it. The icon tile follows it unless `iconTone`, `iconColor` or
   * `iconBg` say otherwise.
   */
  intent?: Intent;
  /**
   * The surface. `outline` (default) is the plain card, its border in the color of the `intent`.
   * `tinted` takes a tint of the `intent` as its background. `solid` fills the card with the
   * `intent` and writes in white (a neutral one is dark in a light theme and light in a dark
   * one): meant for simple content, a figure and a sentence. A `Table`, a chart or a form keeps
   * its own colors and does not read on a fill; the icon tile of a `solid` card is drawn in the
   * card's ink and ignores `iconTone`.
   */
  variant?: SectionCardVariant;
  /**
   * A glow around the card: its edge in a gradient of two hues of the `intent` (brand to violet,
   * info to brand, success to cyan, warning to yellow, danger to pink, two grays for neutral),
   * and a blurred copy of the gradient behind it. Static. It is drawn outside the card and takes
   * no room, so leave `haloSize` of space around the card: an ancestor that clips
   * (`overflow-hidden`) cuts it.
   */
  halo?: boolean;
  /** How far the `halo` reaches, its spread and its blur: `sm`, `md` (default) or `lg`. */
  haloSize?: SectionCardHaloSize;
  /**
   * A band of 4px in this color on one side of the card, with the rest of the card in its own
   * colors. Independent of `intent`: a neutral card can carry a danger band.
   */
  accent?: Intent;
  /**
   * The side of the `accent` band. `top` (default) or `bottom`; `start` and `end` follow the
   * reading direction, so they swap in right to left.
   */
  accentSide?: SectionCardAccentSide;
  /**
   * Under the body, full width and set off by a line: a timestamp, a link to the details, a pair
   * of them (the node's children sit at the two ends of the row). It stays at the bottom of the
   * card, whatever the height the row of a grid gives it, and in every state, as `action` does:
   * remove it yourself where it makes no sense.
   */
  footer?: ReactNode;
  /**
   * The body runs edge to edge under the header, with a line above it and no padding, and ends on
   * the card's bottom edge (or on the `footer`): for a `Table` or a list, whose rows run the full
   * width. A `Table` or `DataTable` put directly in it loses its own border and corners, the card
   * draws them. A card in `loading`, `error` or `empty` pads its state as usual.
   */
  flush?: boolean;
  /**
   * The padding of the card: `sm` (16px), `md` (20px) or `lg` (24px, default). The gap between
   * the header and the body shrinks with it, from 16px to 12px.
   */
  size?: SectionCardSize;
  /** Card content */
  children?: ReactNode;
  /** On the root `<section>`: the place for a grid span (`lg:col-span-2`) or a margin. */
  className?: string;
};

/**
 * SectionCard — a card (24px padding) with title, optional icon and description, an optional
 * `action` at the end of the header, and children. Its body can load, come back empty or fail on
 * its own (`loading`, `empty`, `error`): the header stays, so the reader knows which card it is.
 *
 * The de-facto building block for grouped content in a page. Use multiple
 * SectionCards stacked vertically (with `space-y-6`) or in a grid. The root is a `<section>` named
 * by the title, so a screen reader lists the cards of a page as regions.
 *
 * The surface is the plain card of a `Card`, and changes with `intent` and `variant`; `halo` and
 * `accent` emphasise one card among the others.
 */
export const SectionCard = ({
  title,
  as: Heading = 'h3',
  desc,
  icon: Icon,
  iconTone,
  iconColor,
  iconBg,
  badge,
  iconPosition = 'start',
  iconShape = 'square',
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
  intent = 'neutral',
  variant = 'outline',
  halo = false,
  haloSize = 'md',
  accent,
  accentSide = 'top',
  footer,
  flush = false,
  size = 'lg',
  children,
  className,
}: SectionCardProps) => {
  const titleId = useId();
  const solid = variant === 'solid';
  const tonePreset = iconTone ? TONE_CLASSES[iconTone] : null;
  const intentTone = INTENT_TONE[intent];
  const intentPreset = intentTone ? TONE_CLASSES[intentTone] : null;
  // The raw classes beat what the intent colors; a solid card writes in its own ink, so no tone
  // applies to its icon.
  const tile = solid
    ? SOLID_TILE[intent]
    : {
        bg: tonePreset?.bg ?? iconBg ?? intentPreset?.bg ?? 'bg-black/5 dark:bg-white/5',
        color:
          tonePreset?.color ?? iconColor ?? intentPreset?.color ?? 'text-[var(--color-text-muted)]',
      };
  const iconTile = Icon && (
    <div
      className={clsx(
        'flex h-9 w-9 shrink-0 items-center justify-center',
        iconShape === 'round' ? 'rounded-full' : 'rounded-lg',
        tile.bg
      )}
    >
      <Icon className={clsx('h-5 w-5', tile.color)} />
    </div>
  );
  const inState = loading || error || empty;
  const arrival = useAfterSkeleton(loading);
  // A state is padded like any body: `flush` is for the content it replaces.
  const flushBody = flush && !inState;
  const hasFooter = footer != null && footer !== false;
  const rule = solid ? SOLID_RULE[intent] : 'border-[var(--color-border)]';
  const surface = clsx(
    'flex flex-1 flex-col overflow-hidden rounded-2xl border',
    // The last part of a card that bleeds ends on its edge: no padding under it.
    flushBody || hasFooter ? SIZE[size].padBleed : SIZE[size].pad,
    accent && 'relative',
    solid ? SOLID[intent].fill : variant === 'tinted' ? TINT[intent] : 'bg-[var(--color-bg-panel)]',
    // With a halo the card's own border is clear and its background stops at the padding box, so
    // the gradient layer behind it is the border.
    halo ? 'border-transparent bg-clip-padding' : solid ? SOLID[intent].edge : BORDER[intent]
  );
  return (
    <section
      aria-labelledby={titleId}
      aria-busy={loading || undefined}
      className={clsx('flex flex-col', halo && ['relative isolate', HALO_HUES[intent]], className)}
    >
      {halo && (
        <>
          <span
            aria-hidden
            data-halo="glow"
            className={clsx(
              'pointer-events-none absolute -z-10 opacity-45 dark:opacity-60',
              HALO_GRADIENT,
              HALO_GLOW[haloSize]
            )}
          />
          <span
            aria-hidden
            data-halo="edge"
            className={clsx(
              'pointer-events-none absolute inset-0 -z-10 rounded-2xl',
              HALO_GRADIENT
            )}
          />
        </>
      )}
      <div className={surface}>
        {accent && (
          <span
            aria-hidden
            data-accent-band={accentSide}
            className={clsx('absolute', ACCENT_COLOR[accent], ACCENT_SIDE[accentSide])}
          />
        )}
        {/* Below `sm` the action goes under the title; from `sm` it ends the row. */}
        <div
          className={clsx(
            'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
            SIZE[size].gap
          )}
        >
          <div
            className={clsx(
              'flex min-w-0 gap-3',
              iconPosition === 'top' ? 'flex-col items-start' : 'items-center',
              iconPosition === 'end' && 'sm:flex-1'
            )}
          >
            {iconPosition !== 'end' && iconTile}
            <div className={clsx('min-w-0', iconPosition === 'end' && 'flex-1')}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Heading
                  id={titleId}
                  className={clsx(
                    'text-base font-semibold',
                    solid ? 'text-inherit' : 'text-[var(--color-text-primary)]'
                  )}
                >
                  {title}
                </Heading>
                {badge}
              </div>
              {desc && (
                <p
                  className={clsx('mt-0.5 text-sm', !solid && 'text-[var(--color-text-secondary)]')}
                >
                  {desc}
                </p>
              )}
            </div>
            {iconPosition === 'end' && iconTile}
          </div>
          {action && <div className="shrink-0 max-sm:max-w-full max-sm:self-start">{action}</div>}
        </div>
        {/* The body takes what the row gives the card; a state fills it and centres itself. */}
        <div
          className={clsx(
            'flex-1',
            inState && 'flex flex-col',
            // The table inside sits on the card's edges: the card draws the border and the corners,
            // and its first and last cells line up with the card's padding.
            flushBody && [
              SIZE[size].bleed,
              'border-t [&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent',
              SIZE[size].tableInset,
              rule,
            ],
            minBodyHeight,
            arrival.className
          )}
          onAnimationEnd={arrival.onAnimationEnd}
        >
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
        {hasFooter && (
          <div
            className={clsx(
              'py-row-12 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t text-sm',
              SIZE[size].bleed,
              SIZE[size].inset,
              !flushBody && SIZE[size].gapTop,
              rule,
              !solid && 'text-[var(--color-text-secondary)]'
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </section>
  );
};
