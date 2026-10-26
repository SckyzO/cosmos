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
