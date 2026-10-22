import { useEffect, useState } from 'react';
import type { ApexOptions } from 'apexcharts';
import 'apexcharts/line';
import 'apexcharts/features/annotations';
import ReactApexChart from 'react-apexcharts/core';
import { readableOn, useChartTheme } from './theme';
import type { ChartSize } from './types';

export type RealtimeChartProps = ChartSize & {
  /** Sample generator — defaults to a noisy walk between 30 and 80. */
  generator?: () => number;
  /** Interval in ms — defaults to 2000. */
  intervalMs?: number;
  windowSize?: number;
  warnThreshold?: number;
  critThreshold?: number;
};

const WARN_COLOR = '#f59e0b';
const CRIT_COLOR = '#ef4444';

const defaultGenerator = (() => {
  let last = 50;
  return () => {
    last += (Math.random() - 0.5) * 8;
    last = Math.max(20, Math.min(95, last));
    return Math.round(last);
  };
})();

export const RealtimeChart = ({
  generator = defaultGenerator,
  intervalMs = 2000,
  windowSize = 30,
  warnThreshold = 70,
  critThreshold = 85,
  height = 240,
  width = '100%',
}: RealtimeChartProps) => {
  const { grid, axisLabels, brand, tooltipTheme } = useChartTheme();
  const [series, setSeries] = useState(() => Array.from({ length: windowSize }, () => generator()));

  // ApexCharts hides the threshold annotations until its mount animation
  // ends, and a series update during that animation cancels the reveal: the
  // lines stayed hidden for good. Samples only start once the chart is drawn.
  const [drawn, setDrawn] = useState(false);

  // Fallback in case neither chart event reports the end of the mount
  // animation: a stalled live chart is worse than a hidden threshold.
  useEffect(() => {
    const id = setTimeout(() => setDrawn(true), 2000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!drawn) return;
    const id = setInterval(() => {
      setSeries((current) => [...current.slice(1), generator()]);
    }, intervalMs);
    return () => clearInterval(id);
  }, [drawn, generator, intervalMs]);

  const options: ApexOptions = {
    chart: {
      type: 'line',
      animations: { enabled: true, dynamicAnimation: { enabled: true, speed: 800 } },
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
      events: {
        animationEnd: () => setDrawn(true),
        // No mount animation (reduced motion, hidden container): nothing to wait for.
        mounted: (_chart, opts) => {
          if (opts?.w.globals.animationEnded) setDrawn(true);
        },
      },
    },
    colors: [brand],
    stroke: { curve: 'smooth', width: 2 },
    dataLabels: { enabled: false },
    grid,
    xaxis: {
      type: 'numeric',
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { min: 0, max: 100, labels: axisLabels },
    annotations: {
      yaxis: [
        {
          y: warnThreshold,
          borderColor: WARN_COLOR,
          label: { text: 'WARN', style: { color: readableOn(WARN_COLOR), background: WARN_COLOR } },
        },
        {
          y: critThreshold,
          borderColor: CRIT_COLOR,
          label: { text: 'CRIT', style: { color: readableOn(CRIT_COLOR), background: CRIT_COLOR } },
        },
      ],
    },
    tooltip: { theme: tooltipTheme },
  };

  return (
    <ReactApexChart
      type="line"
      options={options}
      series={[{ name: 'value', data: series }]}
      height={height}
      width={width}
    />
  );
};
