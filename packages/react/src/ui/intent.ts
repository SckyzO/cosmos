import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Megaphone,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

/**
 * The meaning a component carries, as a color: the one vocabulary behind every
 * `intent` prop. A component may accept a documented subset (a `Button` takes
 * `brand`, `success`, `warning` and `danger`), but never a synonym: `danger`, not
 * `error` or `crit`; `warning`, not `warn`.
 *
 * `variant` is the other axis: it describes structure or emphasis (`solid`,
 * `outline`, `ghost`), never meaning.
 */
export type Intent = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger';

export type IntentStyle = {
  /** The icon an `Intent` carries in a message (banner, bar, card, toast). */
  icon: LucideIcon;
  /** Tinted surface: border and background. */
  surface: string;
  /** Text on `surface`. */
  text: string;
  /** Icon color, readable on `surface` and on the page. */
  iconColor: string;
  /** Background of an icon tile sitting on the page. */
  tile: string;
  /** Border of a plain surface (a card) that carries the intent, without the tinted background. */
  border: string;
  /** The tinted background of `surface` alone, for a surface that draws its own border (`accent`). */
  fill: string;
  /**
   * Color of a left edge drawn on `fill` (the width is the component's): `-600` in light, `-500` in
   * dark, 3:1 or more against the tint.
   */
  edge: string;
};

/**
 * What every feedback component reads for an `Intent`: AlertBanner (inline), AnnouncementBar
 * (page-wide), NotificationCard and Toast (floating) keep their own layout and role, but one
 * palette and one icon per meaning. Tailwind scans for whole class names, so each is written out.
 */
export const INTENT_STYLE: Record<Intent, IntentStyle> = {
  neutral: {
    icon: Info,
    surface: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/5',
    text: 'text-gray-700 dark:text-gray-300',
    iconColor: 'text-gray-500 dark:text-gray-400',
    tile: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-800',
    fill: 'bg-gray-50 dark:bg-white/5',
    edge: 'border-l-gray-600 dark:border-l-gray-500',
  },
  brand: {
    icon: Megaphone,
    surface: 'border-brand-200 bg-brand-50 dark:border-brand-500/20 dark:bg-brand-500/10',
    text: 'text-brand-700 dark:text-brand-300',
    iconColor: 'text-brand-600 dark:text-brand-400',
    tile: 'bg-brand-50 dark:bg-brand-500/10',
    border: 'border-brand-300 dark:border-brand-500/40',
    fill: 'bg-brand-50 dark:bg-brand-500/10',
    edge: 'border-l-brand-600 dark:border-l-brand-500',
  },
  info: {
    icon: Info,
    surface: 'border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    iconColor: 'text-blue-500 dark:text-blue-400',
    tile: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-300 dark:border-blue-500/40',
    fill: 'bg-blue-50 dark:bg-blue-500/10',
    edge: 'border-l-blue-600 dark:border-l-blue-500',
  },
  success: {
    icon: CheckCircle2,
    surface: 'border-green-200 bg-green-50 dark:border-green-500/20 dark:bg-green-500/10',
    text: 'text-green-700 dark:text-green-400',
    iconColor: 'text-green-500 dark:text-green-400',
    tile: 'bg-green-50 dark:bg-green-500/10',
    border: 'border-green-300 dark:border-green-500/40',
    fill: 'bg-green-50 dark:bg-green-500/10',
    edge: 'border-l-green-600 dark:border-l-green-500',
  },
  warning: {
    icon: AlertTriangle,
    surface: 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    iconColor: 'text-amber-500 dark:text-amber-400',
    tile: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-300 dark:border-amber-500/40',
    fill: 'bg-amber-50 dark:bg-amber-500/10',
    edge: 'border-l-amber-600 dark:border-l-amber-500',
  },
  danger: {
    icon: XCircle,
    surface: 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
    iconColor: 'text-red-500 dark:text-red-400',
    tile: 'bg-red-50 dark:bg-red-500/10',
    border: 'border-red-300 dark:border-red-500/40',
    fill: 'bg-red-50 dark:bg-red-500/10',
    edge: 'border-l-red-600 dark:border-l-red-500',
  },
};

/** Icon size by layout: next to a line of text, or leading a card. */
export const INTENT_ICON_SIZE = { inline: 'h-4 w-4', card: 'size-6' } as const;
