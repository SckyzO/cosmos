import type { ApexOptions } from 'apexcharts';
import { useEffect, useState } from 'react';

/** Default brand color (the blue accent). Prefer `useChartTheme().brand`, which follows the accent. */
export const COSMOS_BRAND = '#465fff';
export const COSMOS_PALETTE = ['#465fff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Theme classes that enable the dark variant (see @sckyzo/cosmos-theme).
const DARK_THEME_CLASSES = ['dark', 'deep-blue'];

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
    grid: dark
      ? readCssVar('--color-gray-800', '#1f2937')
      : readCssVar('--color-gray-200', '#e5e7eb'),
    axis: dark
      ? readCssVar('--color-gray-400', '#9ca3af')
      : readCssVar('--color-gray-500', '#6b7280'),
  };
};

/**
 * Returns `read()` and calls it again whenever `<html>` changes theme or
 * accent (the Cosmos convention: a theme class and `data-accent`). `read`
 * must be stable.
 */
const useHtmlAppearance = <T>(read: () => T): T => {
  const [value, setValue] = useState(read);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => setValue(read));
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
 * design tokens for the current theme and accent.
 */
export const useChartTheme = () => {
  const { dark, brand, grid: gridColor, axis } = useHtmlAppearance(readChartColors);
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
  return { dark, grid, axisLabels, brand, palette: [brand, ...COSMOS_PALETTE.slice(1)] };
};
