import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { escapeHtml } from './escape';

// ApexCharts compares the functions in its options by identity: a formatter
// made during render redrew the whole chart on every parent render. Formatters
// that read no props live here, at module scope.

/** Tooltip title of a series: its escaped name and a colon. */
export const seriesTitle = (name: string) => `${escapeHtml(name)}: `;

/** A value as a percentage, for the radial bar and gauge labels. */
export const percent = (value: number) => `${value}%`;

/**
 * A function with a fixed identity that calls the latest `fn`. For callbacks
 * reading props that ApexCharts also gets as data or options, such as a custom
 * tooltip or a label computed from the series: a change of those props redraws
 * the chart, which then calls the latest `fn`. A formatter reading a prop of its
 * own (`formatValue`) must instead change identity with it, or the chart keeps
 * the old labels.
 */
export const useStableCallback = <A extends unknown[], R>(fn: (...args: A) => R) => {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: A) => ref.current(...args), []);
};

/**
 * The value formatters for the axis labels and the tooltip, from an optional
 * `formatValue` (default `String`). New only when `formatValue` changes, so
 * pass a stable one (module scope or `useCallback`) to avoid redraws.
 */
export const useValueFormat = (formatValue?: (value: number) => string) =>
  useMemo(() => {
    const value = formatValue ?? String;
    return {
      axis: (val: string | number) => value(Number(val)),
      // The tooltip is HTML: escape the formatted value.
      tooltip: (val: number) => escapeHtml(value(Number(val))),
    };
  }, [formatValue]);

/**
 * Tooltip title for a category axis. ApexCharts hands the x formatter the
 * point's position on the axis (1, 2, …), not its category, so read the
 * category back by index. Escaped: the tooltip is HTML.
 */
export const useCategoryTitle = (categories: readonly (string | number)[]) =>
  useStableCallback((val: string | number, opts?: { dataPointIndex: number }) =>
    escapeHtml(opts === undefined ? val : (categories[opts.dataPointIndex] ?? val))
  );
