import type { ChartIntent } from '../types';

// The colors every Recharts-based chart draws with. Each one is a CSS variable
// string handed straight to the SVG (`fill`, `stroke`, `stopColor`, `cursor`):
// a theme, accent or text size switch on <html> repaints the chart with no
// observer and no `getComputedStyle`. The hex after the comma is the fallback
// when the theme CSS isn't loaded or during SSR; with the theme it is never
// used, since `@sckyzo/cosmos-theme` always emits these variables.

const token = (name: string, fallback: string) => `var(${name}, ${fallback})`;

/** The hex of each series color in the default theme, series 1 first: the blue accent, then the hues of `--color-chart-2` to `--color-chart-8`. */
export const SERIES_FALLBACKS = [
  '#465fff',
  '#06b6d4',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#f97316',
  '#14b8a6',
  '#84cc16',
];

const SERIES_TOKENS = [
  '--color-brand-500',
  ...SERIES_FALLBACKS.slice(1).map((_, i) => `--color-chart-${i + 2}`),
];

/**
 * The categorical palette: the accent, then seven hues. Which hues is decided
 * in the theme CSS: each accent skips the ones that look like it. None of the
 * first four reads as a status (green, amber, red).
 */
export const SERIES = SERIES_TOKENS.map((name, i) => token(name, SERIES_FALLBACKS[i]));

/** The color of series `index`: `colors[index]` when given (cycling), the palette otherwise. */
export const seriesColor = (index: number, colors?: readonly string[]): string =>
  colors?.length ? colors[index % colors.length] : SERIES[index % SERIES.length];

// A chart whose series are statuses passes these as `colors`.
export const SUCCESS = token('--color-success-500', '#12b76a');
export const WARNING = token('--color-warning-500', '#f79009');
export const ERROR = token('--color-error-500', '#f04438');
/** The monitoring statuses, for thresholds. */
export const STATUS_WARN = token('--color-status-warn', '#f59e0b');
export const STATUS_CRIT = token('--color-status-crit', '#ef4444');

/** The card the chart sits on. */
export const PANEL = token('--color-bg-panel', '#fff');
export const TEXT = token('--color-text-primary', '#101828');
export const MUTED = token('--color-text-muted', '#677185');
export const BORDER = token('--color-border', '#d0d5dd');
// One semantic border variable reads right on every theme; the grid and the
// empty part of a gauge are lighter steps of it.
export const GRID = `color-mix(in srgb, ${BORDER} 55%, transparent)`;
export const TRACK = `color-mix(in srgb, ${BORDER} 70%, transparent)`;

/** The color of a reference line or band by its meaning: muted text for `neutral`, the status colors otherwise. */
export const INTENT_COLORS: Record<ChartIntent, string> = {
  neutral: MUTED,
  warning: STATUS_WARN,
  danger: STATUS_CRIT,
  success: SUCCESS,
};

/**
 * Five sequential steps of the accent over the card, low to high, on any
 * theme. Mixed in OKLab, which spaces the steps evenly to the eye: against the
 * card, the lowest step stays at 1.5:1 or more in the dark themes whatever the
 * accent (where a 24% share sat at 1.2:1), and two neighbors differ by 1.19:1
 * or more.
 */
export const SEQUENTIAL = [42, 56, 70, 84, 100].map(
  (share) => `color-mix(in oklab, ${SERIES[0]} ${share}%, ${PANEL})`
);

// A calendar step: a share of the accent over the card. The shares and the top
// step are variables so that the dark themes can set their own on the chart's
// root (`CalendarChart`); the fallbacks are the light themes' values.
const calendarStep = (index: number, share: number) =>
  `color-mix(in oklab, ${SERIES[0]} calc(var(--calendar-share-${index}, ${share}) * 1%), ${PANEL})`;

/**
 * Five steps for a calendar of days: the neutral track for a day with no
 * value, then four of the accent. A day without activity is a cell of its own,
 * not a hole, and the four steps stay apart on any theme and accent. In the
 * light themes they are 48, 65, 82 and 100% of the accent over the card; the
 * dark themes set lower shares and a light accent for the top step through
 * `--calendar-share-1` to `-3` and `--calendar-top`.
 */
export const CALENDAR_STEPS = [
  TRACK,
  calendarStep(1, 48),
  calendarStep(2, 65),
  calendarStep(3, 82),
  `var(--calendar-top, ${SERIES[0]})`,
];

/** Sets the dark themes' calendar scale on the chart's root: Tailwind's `dark:` covers both of them. */
export const CALENDAR_DARK_CLASS =
  'dark:[--calendar-share-1:50] dark:[--calendar-share-2:70] dark:[--calendar-share-3:100] dark:[--calendar-top:var(--color-brand-400)]';
