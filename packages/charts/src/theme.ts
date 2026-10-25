import type { ApexOptions } from 'apexcharts';
import { useEffect, useState } from 'react';

/** Default brand color (the blue accent). Prefer `useChartTheme().brand`, which follows the accent. */
export const COSMOS_BRAND = '#465fff';

// What the status colors are when the theme CSS isn't loaded or during SSR. With
// the theme, `useChartTheme()` reads them from its tokens instead
// (`--color-success-500`, `--color-warning-500`, `--color-error-500`).
const SUCCESS = '#10b981';
const WARNING = '#f59e0b';
const ERROR = '#ef4444';
// The theme has no token for these hues, so they are fixed hexes. They follow
// the accent (first place) in the order a legend reads them: hues far apart on
// the wheel come first, and none of the first four can be mistaken for a status
// (green, amber, red). The last three sit near the status hues and come only
// after five series, which is when a legend needs a key anyway.
const CATEGORICAL = [
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#64748b', // slate
  '#f97316', // orange
  '#14b8a6', // teal
  '#84cc16', // lime
];

/**
 * The default series colors without the theme CSS: eight categorical colors,
 * the blue accent first. With it, `useChartTheme().palette` is the same list
 * with the accent's brand color in first place.
 *
 * Series do not read as statuses: green, amber and red are absent from the
 * first four places, and the status colors are never the default. A chart that
 * means a status passes them as `colors`, for example
 * `useChartTheme().statusPalette` (success, warning, error). A palette is a
 * categorical scale: it names things, it does not rank them. For a quantity,
 * use `brandScale`.
 */
export const COSMOS_PALETTE = [COSMOS_BRAND, ...CATEGORICAL];

// Theme classes that enable the dark variant (see @sckyzo/cosmos-theme).
const DARK_THEME_CLASSES = ['dark', 'deep-blue'];

// Brand steps of the sequential scale, low to high. Light themes run from a
// pale tint to a deep shade, dark themes from a dark tint to a bright one, so
// low values stay a muted cell on the card instead of a glaring one. The steps
// skip neighbors that look alike in some accents (800 and 900, 100 and 200).
const BRAND_SCALE_LIGHT = [100, 300, 400, 500, 700];
const BRAND_SCALE_DARK = [900, 700, 500, 400, 300];
// The blue accent's steps, used when the theme CSS isn't loaded or during SSR.
const BLUE_STEPS: Record<number, string> = {
  100: '#dde9ff',
  300: '#9cb9ff',
  400: '#7592ff',
  500: COSMOS_BRAND,
  700: '#2a31d8',
  900: '#262e89',
};

const relativeLuminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * The text color, white or black, that reads best on `background`, a
 * `#rrggbb` color (white when it is not one). White text drops under 3:1 on
 * the palette's green and amber, and black text drops to 4.34:1 on the brand
 * blue, where white gets 4.84:1: the pick reaches 4.5:1 on every color of the palette.
 */
export const readableOn = (background: string): string => {
  if (!/^#[0-9a-f]{6}$/i.test(background)) return '#ffffff';
  const luminance = relativeLuminance(background);
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.05 ? '#ffffff' : '#000000';
};

const detectDark = (): boolean => {
  if (typeof document === 'undefined') return false;
  const { classList } = document.documentElement;
  return DARK_THEME_CLASSES.some((c) => classList.contains(c));
};

/** A CSS custom property on `<html>`, or `fallback` when it's unset or during SSR. */
const readCssVar = (name: string, fallback: string): string => {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
};

const readChartColors = () => {
  const dark = detectDark();
  // Grid lines, and the empty part of a radial arc: a soft step of the gray scale.
  const line = dark
    ? readCssVar('--color-gray-800', '#1f2937')
    : readCssVar('--color-gray-200', '#e5e7eb');
  return {
    dark,
    brand: readCssVar('--color-brand-500', COSMOS_BRAND),
    brandScale: (dark ? BRAND_SCALE_DARK : BRAND_SCALE_LIGHT).map((step) =>
      readCssVar(`--color-brand-${step}`, BLUE_STEPS[step])
    ),
    // The card background (`bg-white dark:bg-gray-900`).
    surface: dark ? readCssVar('--color-gray-900', '#111827') : readCssVar('--color-white', '#fff'),
    grid: line,
    axis: dark
      ? readCssVar('--color-gray-400', '#9ca3af')
      : readCssVar('--color-gray-500', '#6b7280'),
    // Text on the card: legends, center values, secondary labels.
    text: readCssVar('--color-text-primary', dark ? '#fff' : '#101828'),
    textMuted: readCssVar('--color-text-secondary', dark ? '#98a2b3' : '#667085'),
    success: readCssVar('--color-success-500', SUCCESS),
    warning: readCssVar('--color-warning-500', WARNING),
    error: readCssVar('--color-error-500', ERROR),
    // Monitoring statuses (`--color-status-*`), for thresholds: a WARN or CRIT
    // line is a status, not a series color.
    statusWarn: readCssVar('--color-status-warn', WARNING),
    statusCrit: readCssVar('--color-status-crit', ERROR),
    track: line,
  };
};

/**
 * Returns `read()` and calls it again whenever `<html>` changes theme or accent
 * (the Cosmos convention: a theme class, `data-accent`). `read` must be stable.
 * Fonts do not change the colors: `ApexChart` redraws for them.
 */
const useHtmlAppearance = <T>(read: () => T): T => {
  const [value, setValue] = useState(read);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const update = () => setValue(read);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-accent'],
    });
    return () => observer.disconnect();
  }, [read]);

  return value;
};

/**
 * Subscribes to dark-mode toggles on `<html>` (the Cosmos convention).
 * Returns the current `isDark` value.
 */
export const useDarkMode = (): boolean => useHtmlAppearance(detectDark);

/**
 * Returns ApexCharts grid + axis options and colors matching the Cosmos
 * design tokens for the current theme and accent: `brandScale` is a
 * sequential scale (five brand steps, low to high) and `surface` the card
 * background. `text` and `textMuted` are the primary and secondary text colors.
 * `success`, `warning` and `error` are the theme's status colors, and
 * `statusPalette` the three in that order, for a chart whose series are
 * statuses (`colors={statusPalette}`). `statusWarn` and `statusCrit` are its
 * monitoring statuses (thresholds), `track` the empty part of a radial arc, and
 * `palette` the default series colors: eight categorical colors, the brand
 * color first and none of the status hues among the first four.
 * `tooltipTheme` is the ApexCharts tooltip theme matching the Cosmos theme.
 */
export const useChartTheme = () => {
  const {
    dark,
    brand,
    brandScale,
    surface,
    grid: gridColor,
    axis,
    text,
    textMuted,
    success,
    warning,
    error,
    statusWarn,
    statusCrit,
    track,
  } = useHtmlAppearance(readChartColors);
  const grid: ApexOptions['grid'] = {
    borderColor: gridColor,
    strokeDashArray: 4,
  };
  const axisLabels = {
    style: {
      colors: axis,
      fontSize: '11px',
      fontFamily: 'inherit',
    },
  };
  const tooltipTheme: 'dark' | 'light' = dark ? 'dark' : 'light';
  return {
    dark,
    grid,
    axisLabels,
    brand,
    brandScale,
    surface,
    text,
    textMuted,
    success,
    warning,
    error,
    statusWarn,
    statusCrit,
    track,
    tooltipTheme,
    statusPalette: [success, warning, error],
    palette: [brand, ...CATEGORICAL],
  };
};
