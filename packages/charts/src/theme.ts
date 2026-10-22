import type { ApexOptions } from 'apexcharts';
import { useEffect, useState } from 'react';

/** Default brand color (the blue accent). Prefer `useChartTheme().brand`, which follows the accent. */
export const COSMOS_BRAND = '#465fff';
export const COSMOS_PALETTE = ['#465fff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
  return {
    dark,
    brand: readCssVar('--color-brand-500', COSMOS_BRAND),
    brandScale: (dark ? BRAND_SCALE_DARK : BRAND_SCALE_LIGHT).map((step) =>
      readCssVar(`--color-brand-${step}`, BLUE_STEPS[step])
    ),
    // The card background (`bg-white dark:bg-gray-900`).
    surface: dark ? readCssVar('--color-gray-900', '#111827') : readCssVar('--color-white', '#fff'),
    grid: dark
      ? readCssVar('--color-gray-800', '#1f2937')
      : readCssVar('--color-gray-200', '#e5e7eb'),
    axis: dark
      ? readCssVar('--color-gray-400', '#9ca3af')
      : readCssVar('--color-gray-500', '#6b7280'),
    // Text on the card: legends, center values, secondary labels.
    text: readCssVar('--color-text-primary', dark ? '#fff' : '#101828'),
    textMuted: readCssVar('--color-text-secondary', dark ? '#98a2b3' : '#667085'),
  };
};

/**
 * Returns `read()` and calls it again whenever `<html>` changes theme, accent
 * or font (the Cosmos convention: a theme class, `data-accent`, `data-font`)
 * and whenever a web font finishes loading. `read` must be stable.
 *
 * ApexCharts measures its labels when it draws. A font that arrives after the
 * first draw (fonts load lazily) or a `data-font` switch leaves widths and
 * rotation computed for the old font: a new value re-renders the wrapper,
 * whose new options make ApexCharts draw and measure again.
 */
const useHtmlAppearance = <T>(read: () => T): T => {
  const [value, setValue] = useState(read);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const update = () => setValue(read);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-accent', 'data-font'],
    });
    document.fonts?.addEventListener('loadingdone', update);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', update);
    };
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
  return {
    dark,
    grid,
    axisLabels,
    brand,
    brandScale,
    surface,
    text,
    textMuted,
    palette: [brand, ...COSMOS_PALETTE.slice(1)],
  };
};
