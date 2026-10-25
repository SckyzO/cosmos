import { useEffect, useMemo, useState } from 'react';
import type { ApexOptions } from 'apexcharts';
import 'apexcharts/line';
import 'apexcharts/features/annotations';
import { ApexChart } from './ApexChart';
import { useOptionalValueFormat } from './formatters';
import { readableOn, useChartTheme } from './theme';
import type { ChartBaseProps } from './types';

export type RealtimeChartProps = ChartBaseProps & {
  /** Sample generator — defaults to a noisy walk between 30 and 80. */
  generator?: () => number;
  /** Interval in ms — defaults to 2000. */
  intervalMs?: number;
  windowSize?: number;
  /** Bottom of the y axis. Default 0. */
  min?: number;
  /** Top of the y axis, above `min`. Default 100. */
  max?: number;
  warnThreshold?: number;
  critThreshold?: number;
  /** Text of the warning threshold's label. Default `WARN`; an empty string draws the line alone. */
  warnLabel?: string;
  /** Text of the critical threshold's label. Default `CRIT`; an empty string draws the line alone. */
  critLabel?: string;
  /**
   * Label the x axis with the time of each sample (`14:03:25`, in local time), and the
   * tooltip with it. Default off: no x axis.
   */
  showTimeAxis?: boolean;
  /**
   * Format the y-axis labels and the tooltip values.
   * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
   */
  formatValue?: (value: number) => string;
};

type Sample = { time: number; value: number };

// The time axis reads as a clock, whatever the zoom ApexCharts picks.
const CLOCK = 'HH:mm:ss';
const CLOCK_FORMATS = { year: CLOCK, month: CLOCK, day: CLOCK, hour: CLOCK, minute: CLOCK };

/** A threshold: a line in its status color, and a label on it unless `label` is empty. */
const thresholdLine = (y: number, label: string, color: string) => ({
  y,
  borderColor: color,
  ...(label === ''
    ? {}
    : { label: { text: label, style: { color: readableOn(color), background: color } } }),
});

// One walk per chart: a module-level one made every instance continue the last.
const createDefaultGenerator = () => {
  let last = 50;
  return () => {
    last += (Math.random() - 0.5) * 8;
    last = Math.max(20, Math.min(95, last));
    return Math.round(last);
  };
};

export const RealtimeChart = ({
  generator,
  intervalMs = 2000,
  windowSize = 30,
  min = 0,
  max = 100,
  warnThreshold = 70,
  critThreshold = 85,
  warnLabel = 'WARN',
  critLabel = 'CRIT',
  showTimeAxis = false,
  formatValue,
  ariaLabel,
  apexOptions,
  height = 240,
  width = '100%',
}: RealtimeChartProps) => {
  const { grid, axisLabels, brand, statusWarn, statusCrit, tooltipTheme } = useChartTheme();
  const format = useOptionalValueFormat(formatValue);
  const [defaultGenerator] = useState(createDefaultGenerator);
  const generate = generator ?? defaultGenerator;
  // Each sample with the time it was taken, for the time axis. A window that
  // starts full is dated as if it had been filled at the sampling pace.
  const [mountedAt] = useState(Date.now);
  const [samples, setSamples] = useState<Sample[]>(() =>
    Array.from({ length: windowSize }, (_, index) => ({
      time: mountedAt - (windowSize - 1 - index) * intervalMs,
      value: generate(),
    }))
  );

  // A new windowSize trims the oldest samples or prepends new ones. Adjusted
  // while rendering, which React redoes at once without painting the old window.
  const [sizedFor, setSizedFor] = useState(windowSize);
  if (sizedFor !== windowSize) {
    setSizedFor(windowSize);
    const missing = windowSize - samples.length;
    const oldest = samples[0]?.time ?? mountedAt;
    setSamples(
      missing <= 0
        ? samples.slice(samples.length - windowSize)
        : [
            ...Array.from({ length: missing }, (_, index) => ({
              time: oldest - (missing - index) * intervalMs,
              value: generate(),
            })),
            ...samples,
          ]
    );
  }

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
      setSamples((current) => [...current.slice(1), { time: Date.now(), value: generate() }]);
    }, intervalMs);
    return () => clearInterval(id);
  }, [drawn, generate, intervalMs]);

  // Stable, so a new sample updates the series instead of redrawing the chart
  // with new options: ApexCharts compares the functions in them by identity.
  const events = useMemo<NonNullable<ApexOptions['chart']>['events']>(
    () => ({
      animationEnd: () => setDrawn(true),
      // No mount animation (reduced motion, hidden container): nothing to wait for.
      mounted: (_chart, opts) => {
        if (opts?.w.globals.animationEnded) setDrawn(true);
      },
    }),
    []
  );

  const options: ApexOptions = {
    chart: {
      type: 'line',
      animations: { enabled: true, dynamicAnimation: { enabled: true, speed: 800 } },
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
      events,
    },
    colors: [brand],
    stroke: { curve: 'smooth', width: 2 },
    dataLabels: { enabled: false },
    grid,
    // The samples are not on a scale of their own: the x axis is their order,
    // unless it is the clock. Axis labels are SVG text and stay unescaped.
    xaxis: showTimeAxis
      ? {
          type: 'datetime',
          labels: { ...axisLabels, datetimeUTC: false, datetimeFormatter: CLOCK_FORMATS },
          axisBorder: { show: false },
          axisTicks: { show: false },
          tooltip: { enabled: false },
        }
      : {
          type: 'numeric',
          labels: { show: false },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
    // One labels object per axis: ApexCharts mutates them.
    yaxis: { min, max, labels: { ...axisLabels, formatter: format.axis } },
    annotations: {
      yaxis: [
        thresholdLine(warnThreshold, warnLabel, statusWarn),
        thresholdLine(critThreshold, critLabel, statusCrit),
      ],
    },
    // The tooltip is HTML: escape the formatted value.
    tooltip: {
      theme: tooltipTheme,
      ...(showTimeAxis ? { x: { format: CLOCK } } : {}),
      y: { formatter: format.tooltip },
    },
  };

  // Plain values, or points on the clock.
  const data = showTimeAxis
    ? samples.map(({ time, value }) => ({ x: time, y: value }))
    : samples.map(({ value }) => value);

  return (
    <ApexChart
      type="line"
      options={options}
      series={[{ name: 'value', data }]}
      height={height}
      width={width}
      ariaLabel={ariaLabel}
      apexOptions={apexOptions}
    />
  );
};
