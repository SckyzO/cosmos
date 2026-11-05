import { type ComponentType, type ReactNode, type Ref, useId } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useControllableState } from '../hooks/useControllableState';
import { useLabels } from '../labels/labelsContext';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { Sk } from '../feedback/Skeleton';
import { useAfterSkeleton } from '../feedback/useAfterSkeleton';
import { Fold } from '../ui/Fold';
import { iconButtonClass } from '../ui/IconButton';
import { INTENT_STYLE, type Intent } from '../ui/intent';
import { SOLID, SOLID_TILE } from '../ui/solidIntent';
import { SECTION_CARD_LABELS, type SectionCardLabels } from './labels';

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
// `Table` or `DataTable` pads its cells by 16px, and sets `--cosmos-table-inset`, the padding of a
// `DataTable`'s tabs, toolbar and pager: `sm` is the same, so it has nothing to add.
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
    tableInset: '[--cosmos-table-inset:1.25rem] [&_tr>:first-child]:ps-5 [&_tr>:last-child]:pe-5',
  },
  lg: {
    pad: 'p-6',
    padBleed: 'px-6 pt-6',
    gap: 'mb-4',
    gapTop: 'mt-4',
    bleed: '-mx-6',
    inset: 'px-6',
    tableInset: '[--cosmos-table-inset:1.5rem] [&_tr>:first-child]:ps-6 [&_tr>:last-child]:pe-6',
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

// The line above a footer or a flush body on a `solid` card: a veil of the ink.
const SOLID_RULE: Record<Intent, string> = {
  neutral: 'border-white/25 dark:border-gray-900/25',
  brand: 'border-white/30',
  info: 'border-white/30',
  success: 'border-white/30',
  warning: 'border-gray-900/20',
  danger: 'border-white/30',
};

// The fold toggle on a `solid` card: it keeps the card's ink, with a veil on hover and a focus ring
// that shows on the fill (white on a colored one, the dark ink on the warning orange; on a neutral
// one the brand ring, which is the one that shows once the fill turns light in a dark theme).
const SOLID_TOGGLE: Record<Intent, string> = {
  neutral:
    'hover:bg-white/10 focus-visible:focus-indicator-on-accent dark:hover:bg-gray-900/10 dark:focus-visible:focus-indicator',
  brand: 'hover:bg-black/15 focus-visible:focus-indicator-on-accent',
  info: 'hover:bg-black/15 focus-visible:focus-indicator-on-accent',
  success: 'hover:bg-black/15 focus-visible:focus-indicator-on-accent',
  warning:
    'hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:outline-hidden',
  danger: 'hover:bg-black/15 focus-visible:focus-indicator-on-accent',
};

// The label of a `stale` card, by the title: amber as the `StaleBadge` of the status components,
// and in the card's ink on a `solid` one, where an amber pill would vanish.
const STALE_LABEL =
  'inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap';
const STALE_LABEL_COLOR = 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300';

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
  /**
   * A ref to the heading, for a page that moves the focus to the card: a link or a filter that
   * leads to it, as the severity panels of a dashboard lead to its alerts. With it the heading
   * takes `tabIndex={-1}`, so `focus()` reaches it, out of the tab order.
   */
  titleRef?: Ref<HTMLHeadingElement>;
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
  /** Title of the empty state. Default `labels.empty`, 'No data'. For a richer one, pass your own `EmptyState` as `children`. */
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
   * `intent` and writes in white (in dark ink on the warning orange; a neutral one is dark in a
   * light theme and light in a dark one): meant for simple content, a figure and a sentence. A
   * `Table`, a chart or a form keeps its own colors and does not read on a fill; the icon tile of
   * a `solid` card is drawn in the card's ink and ignores `iconTone`.
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
   * The data on show is old: the body is dimmed and `staleLabel` stands by the title. Only that:
   * the header, `action` included, stays as it is, and the last data under a failure is the
   * host's to put together (the cause in `desc`, "Retry" in `action`). The body is dimmed to
   * 65%, and inside it the secondary and muted text colors read as the primary one, since their
   * own would fall under 4.5:1 once dimmed (a color you set with a class of your own is only
   * dimmed). A `solid` card is not dimmed, white ink dimmed over its fill would be unreadable,
   * and neither is a `loading`, `error` or `empty` state, a message and not data: the label alone
   * says it.
   */
  stale?: boolean;
  /** What the label by the title says. Default `labels.stale`, 'Stale'; say how old: 'Stale · 4 min ago'. */
  staleLabel?: string;
  /** The texts it writes (the loading and toggle names, the empty and stale defaults), over `LabelsProvider`'s `sectionCard` and the English defaults. */
  labels?: Partial<SectionCardLabels>;
  /**
   * A toggle at the end of the header folds the body away, and the footer with it: the header,
   * with its `badge` and `action`, stays. The toggle is a button named "Toggle" and the title,
   * with `aria-expanded` and `aria-controls`; the folded body is out of the tab order and of the
   * reader's.
   */
  collapsible?: boolean;
  /**
   * Whether the body is unfolded, for a host that owns it. With `defaultOpen` and `onOpenChange`
   * it is the usual controlled and uncontrolled pair. Only read with `collapsible`.
   */
  open?: boolean;
  /** Whether the body starts unfolded, while uncontrolled. Default `true`. */
  defaultOpen?: boolean;
  /** Called when the toggle is used, with the state to move to. */
  onOpenChange?: (open: boolean) => void;
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
  titleRef,
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
  emptyMessage,
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
  stale = false,
  staleLabel,
  labels: ownLabels,
  collapsible = false,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  size = 'lg',
  children,
  className,
}: SectionCardProps) => {
  const labels = useLabels('sectionCard', SECTION_CARD_LABELS, ownLabels);
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
  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'SectionCard.open',
  });
  const bodyId = useId();
  // A state is padded like any body: `flush` is for the content it replaces.
  const flushBody = flush && !inState;
  const hasFooter = footer != null && footer !== false;
  const bleeds = flushBody || hasFooter;
  // Unfolded, a card that bleeds ends its last part on its edge; folded, it is a header with the
  // card's padding under it, which the padding takes over while the body folds.
  const bleedsDown = bleeds && (!collapsible || open);
  // In a fold the box takes the bleed, the parts inside are plain.
  const partBleed = collapsible ? undefined : SIZE[size].bleed;
  const rule = solid ? SOLID_RULE[intent] : 'border-[var(--color-border)]';
  // The body and the footer: what a collapsible card folds away.
  const content = (
    <>
      {/* The body takes what the row gives the card; a state fills it and centres itself. */}
      <div
        className={clsx(
          'flex-1',
          inState && 'flex flex-col',
          // The table inside sits on the card's edges: the card draws the border and the corners,
          // and its first and last cells line up with the card's padding.
          flushBody && [
            partBleed,
            'border-t [&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent',
            SIZE[size].tableInset,
            rule,
          ],
          // Dimmed, and the text colors the library reads from the theme take the primary one: the
          // secondary and the muted would fall under 4.5:1 at this opacity. Not a state, which is
          // a message, nor a solid card, whose white ink cannot be dimmed over its fill: the label
          // alone says it.
          stale &&
            !solid &&
            !inState &&
            'opacity-65 [--color-text-muted:var(--color-text-primary)] [--color-text-secondary:var(--color-text-primary)]',
          // The gap above the body is inside the fold, so a folded card does not keep it.
          collapsible && SIZE[size].gapTop,
          // A fold that bleeds for a footer or a table leaves a plain body to pad itself.
          collapsible && bleeds && !flushBody && SIZE[size].inset,
          minBodyHeight,
          arrival.className
        )}
        onAnimationEnd={arrival.onAnimationEnd}
      >
        {loading ? (
          <>
            <p role="status" className="sr-only">
              {labels.loading(title)}
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
          <EmptyState
            compact
            title={emptyMessage ?? labels.empty}
            action={emptyAction}
            className="flex-1"
          />
        ) : (
          children
        )}
      </div>
      {hasFooter && (
        <div
          className={clsx(
            'py-row-12 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t text-sm',
            partBleed,
            SIZE[size].inset,
            !flushBody && SIZE[size].gapTop,
            rule,
            !solid && 'text-[var(--color-text-secondary)]'
          )}
        >
          {footer}
        </div>
      )}
    </>
  );
  const surface = clsx(
    'flex flex-1 flex-col overflow-hidden rounded-2xl border',
    bleedsDown ? SIZE[size].padBleed : SIZE[size].pad,
    collapsible &&
      bleeds && [
        'transition-[padding-bottom] duration-(--cosmos-motion-base)',
        open ? 'ease-(--cosmos-ease-out)' : 'ease-(--cosmos-ease-in)',
      ],
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
        {/* Below `sm` the action goes under the title; from `sm` it ends the row. A collapsible
            card keeps its toggle on the title's row: the action wraps under it instead. */}
        <div
          className={clsx(
            collapsible
              ? 'flex flex-wrap items-start gap-3 sm:flex-nowrap'
              : [
                  'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
                  SIZE[size].gap,
                ]
          )}
        >
          <div
            className={clsx(
              'flex min-w-0 gap-3',
              iconPosition === 'top' ? 'flex-col items-start' : 'items-center',
              collapsible ? 'flex-1' : iconPosition === 'end' && 'sm:flex-1'
            )}
          >
            {iconPosition !== 'end' && iconTile}
            <div className={clsx('min-w-0', iconPosition === 'end' && 'flex-1')}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Heading
                  id={titleId}
                  ref={titleRef}
                  tabIndex={titleRef ? -1 : undefined}
                  className={clsx(
                    // A ring when a page moves the focus to it (`titleRef`).
                    'focus-visible:focus-indicator rounded-sm text-base font-semibold',
                    solid ? 'text-inherit' : 'text-[var(--color-text-primary)]'
                  )}
                >
                  {title}
                </Heading>
                {badge}
                {stale && (
                  <span
                    className={clsx(
                      STALE_LABEL,
                      solid
                        ? clsx(SOLID_TILE[intent].bg, SOLID_TILE[intent].color)
                        : STALE_LABEL_COLOR
                    )}
                  >
                    {staleLabel ?? labels.stale}
                  </span>
                )}
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
          {action && (
            <div
              className={clsx(
                'shrink-0 max-sm:max-w-full max-sm:self-start',
                collapsible && 'max-sm:order-last max-sm:basis-full'
              )}
            >
              {action}
            </div>
          )}
          {collapsible && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={bodyId}
              aria-label={labels.toggle(title)}
              onClick={() => setOpen(!open)}
              className={
                solid
                  ? clsx(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors [&>svg]:size-4',
                      SOLID_TOGGLE[intent]
                    )
                  : iconButtonClass()
              }
            >
              <ChevronDown
                aria-hidden
                className={clsx(
                  'transition-transform duration-(--cosmos-motion-base) ease-(--cosmos-ease-in-out)',
                  open && 'rotate-180'
                )}
              />
            </button>
          )}
        </div>
        {collapsible ? (
          <Fold id={bodyId} open={open} className={clsx(bleeds && SIZE[size].bleed)}>
            {content}
          </Fold>
        ) : (
          content
        )}
      </div>
    </section>
  );
};
