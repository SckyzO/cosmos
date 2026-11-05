import type { Intent } from './intent';

// The fill of a `solid` card (SectionCard, KpiCard) and the ink on it, 4.5:1 or more in the four
// themes: white on the `-600`/`-700` of the palette (brand-600 holds it in every accent). Warning
// is the theme's own warning orange, the one of the statuses and the gauges, too light for white
// ink: it writes in the dark ink. A neutral card is the dark ink of the theme in a light theme and
// turns light, with dark ink, in a dark one.
export const SOLID: Record<Intent, { fill: string; edge: string }> = {
  neutral: {
    fill: 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900',
    edge: 'border-gray-900 dark:border-gray-100',
  },
  brand: { fill: 'bg-brand-600 text-white', edge: 'border-brand-600' },
  info: { fill: 'bg-blue-700 text-white', edge: 'border-blue-700' },
  success: { fill: 'bg-green-700 text-white', edge: 'border-green-700' },
  warning: { fill: 'bg-warning-500 text-gray-900', edge: 'border-warning-500' },
  danger: { fill: 'bg-red-700 text-white', edge: 'border-red-700' },
};

// The icon tile on a `solid` card: a veil over the fill, the icon in the card's ink.
export const SOLID_TILE: Record<Intent, { bg: string; color: string }> = {
  neutral: { bg: 'bg-white/15 dark:bg-gray-900/10', color: 'text-white dark:text-gray-900' },
  brand: { bg: 'bg-black/15', color: 'text-white' },
  info: { bg: 'bg-black/15', color: 'text-white' },
  success: { bg: 'bg-black/15', color: 'text-white' },
  warning: { bg: 'bg-black/10', color: 'text-gray-900' },
  danger: { bg: 'bg-black/15', color: 'text-white' },
};
