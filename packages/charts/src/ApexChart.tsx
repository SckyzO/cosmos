import type ApexCharts from 'apexcharts';
import { useEffect, useRef, type ComponentProps } from 'react';
import ReactApexChart from 'react-apexcharts/core';

/**
 * `ReactApexChart`, drawn again when a web font finishes loading or `<html>`
 * switches `data-font`. ApexCharts measures its labels when it draws: a font
 * that arrives after the first draw (fonts load lazily) left widths and
 * rotation computed for the old one. Equal options never redraw on their own,
 * since react-apexcharts compares them deeply.
 */
export const ApexChart = (props: ComponentProps<typeof ReactApexChart>) => {
  const chartRef = useRef<ApexCharts | null>(null);

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

  return <ReactApexChart {...props} chartRef={chartRef} />;
};
