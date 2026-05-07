import type { ApexOptions } from 'apexcharts';
import { useEffect, useState } from 'react';

export const COSMOS_BRAND = '#465fff';
export const COSMOS_PALETTE = ['#465fff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const detectDark = (): boolean => {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
};

/**
 * Subscribes to dark-mode toggles on `<html>` (the Cosmos convention).
 * Returns the current `isDark` value.
 */
export const useDarkMode = (): boolean => {
  const [dark, setDark] = useState(detectDark);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => setDark(detectDark()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return dark;
};

/**
 * Returns ApexCharts grid + axis options matching the Cosmos design tokens
 * for the current color scheme.
 */
export const useChartTheme = () => {
  const dark = useDarkMode();
  const grid: ApexOptions['grid'] = {
    borderColor: dark ? '#1f2937' : '#e5e7eb',
    strokeDashArray: 4,
  };
  const axisLabels = {
    style: {
      colors: dark ? '#9ca3af' : '#6b7280',
      fontSize: '11px',
      fontFamily: 'inherit',
    },
  };
  return { dark, grid, axisLabels, brand: COSMOS_BRAND, palette: COSMOS_PALETTE };
};
