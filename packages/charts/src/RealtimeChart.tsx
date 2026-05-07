import { useEffect, useRef, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useChartTheme } from './theme';
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
  const { grid, axisLabels, brand } = useChartTheme();
  const [series, setSeries] = useState(() => Array.from({ length: windowSize }, () => generator()));
  const seriesRef = useRef(series);
  seriesRef.current = series;

  useEffect(() => {
    const id = setInterval(() => {
      const next = [...seriesRef.current.slice(1), generator()];
      setSeries(next);
    }, intervalMs);
    return () => clearInterval(id);
  }, [generator, intervalMs]);

  const options: ApexOptions = {
    chart: {
      type: 'line',
      animations: { enabled: true, dynamicAnimation: { enabled: true, speed: 800 } },
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
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
          borderColor: '#f59e0b',
          label: { text: 'WARN', style: { color: '#fff', background: '#f59e0b' } },
        },
        {
          y: critThreshold,
          borderColor: '#ef4444',
          label: { text: 'CRIT', style: { color: '#fff', background: '#ef4444' } },
        },
      ],
    },
    tooltip: { theme: 'dark' },
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
