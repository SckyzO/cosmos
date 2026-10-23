import type ApexCharts from 'apexcharts';
import { useEffect, useRef, type ComponentProps } from 'react';
import 'apexcharts/features/keyboard';
import ReactApexChart from 'react-apexcharts/core';
import { useChartTheme } from './theme';
import type { ChartAccessibility, ChartEmptyProps } from './types';

type ApexChartProps = ComponentProps<typeof ReactApexChart> &
  ChartAccessibility &
  ChartEmptyProps & {
    /**
     * Tab reaches the chart and the arrow keys walk its points (default). Off,
     * the chart is an image out of the tab order: right for a single value.
     */
    keyboard?: boolean;
  };

/**
 * `ReactApexChart`, drawn again when a web font finishes loading or `<html>`
 * switches `data-font`. ApexCharts measures its labels when it draws: a font
 * that arrives after the first draw (fonts load lazily) left widths and
 * rotation computed for the old one. Equal options never redraw on their own,
 * since react-apexcharts compares them deeply.
 *
 * `ariaLabel` and `keyboard` set `chart.accessibility`. ApexCharts makes the
 * SVG an `application` whenever keyboard navigation is on in the options, even
 * without the keyboard feature that handles the keys: both go together here.
 *
 * `emptyMessage` is the `noData` text ApexCharts draws, as SVG text, when there
 * is no series or only empty ones.
 */
export const ApexChart = ({
  ariaLabel,
  keyboard = true,
  emptyMessage = 'No data',
  options,
  ...props
}: ApexChartProps) => {
  const chartRef = useRef<ApexCharts | null>(null);
  const { textMuted } = useChartTheme();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const redraw = () => chartRef.current?.updateOptions({}, false, false);
    const observer = new MutationObserver(redraw);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-font'],
    });
    document.fonts?.addEventListener('loadingdone', redraw);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', redraw);
    };
  }, []);

  const accessible = {
    ...options,
    chart: {
      ...options?.chart,
      accessibility: { description: ariaLabel, keyboard: { enabled: keyboard } },
    },
    noData: { text: emptyMessage, style: { color: textMuted } },
  };

  return <ReactApexChart {...props} options={accessible} chartRef={chartRef} />;
};
