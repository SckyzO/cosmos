import type { BeatStatus, UptimeLevel } from './types';

// Classes of the uptime components. Tailwind scans for whole class names, so each is written out.
// The status colours are the theme's: `--color-status-*` for ok, warning and critical, the palette
// for the two states the theme has no status variable for (maintenance, pending).

/** Fill of a beat, per status. */
export const BEAT_FILL: Record<BeatStatus, string> = {
  up: 'bg-[var(--color-status-ok)]',
  degraded: 'bg-[var(--color-status-warn)]',
  down: 'bg-[var(--color-status-crit)]',
  maintenance: 'bg-blue-500',
  pending: 'bg-gray-300 dark:bg-gray-600',
};

/** Fill of a day, per level. */
export const LEVEL_FILL: Record<UptimeLevel, string> = {
  good: 'bg-[var(--color-status-ok)]',
  warning: 'bg-[var(--color-status-warn)]',
  bad: 'bg-[var(--color-status-crit)]',
  none: 'bg-gray-200 dark:bg-gray-700',
};

/** Colour of an uptime written as text, per level: one step darker than the fill, for 4.5:1. */
export const LEVEL_TEXT: Record<UptimeLevel, string> = {
  good: 'text-green-700 dark:text-green-400',
  warning: 'text-amber-700 dark:text-amber-400',
  bad: 'text-red-700 dark:text-red-400',
  none: 'text-[var(--color-text-secondary)]',
};
