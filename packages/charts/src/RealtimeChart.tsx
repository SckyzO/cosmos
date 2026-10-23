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
  warnThreshold?: number;
  critThreshold?: number;
  /**
   * Format the y-axis labels and the tooltip values.
   * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
   */
  formatValue?: (value: number) => string;
};

const WARN_COLOR = '#f59e0b';
const CRIT_COLOR = '#ef4444';

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
  warnThreshold = 70,
  critThreshold = 85,
  formatValue,
  ariaLabel,
  height = 240,
  width = '100%',
}: RealtimeChartProps) => {
  const { grid, axisLabels, brand, tooltipTheme } = useChartTheme();
  const format = useOptionalValueFormat(formatValue);
  const [defaultGenerator] = useState(createDefaultGenerator);
  const generate = generator ?? defaultGenerator;
  const [series, setSeries] = useState(() => Array.from({ length: windowSize }, () => generate()));

  // A new windowSize trims the oldest samples or prepends new ones. Adjusted
  // while rendering, which React redoes at once without painting the old window.
  const [sizedFor, setSizedFor] = useState(windowSize);
  if (sizedFor !== windowSize) {
    setSizedFor(windowSize);
    setSeries(
      series.length > windowSize
        ? series.slice(series.length - windowSize)
        : [...Array.from({ length: windowSize - series.length }, () => generate()), ...series]
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
      setSeries((current) => [...current.slice(1), generate()]);
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
    xaxis: {
      type: 'numeric',
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    // One labels object per axis: ApexCharts mutates them.
    yaxis: { min: 0, max: 100, labels: { ...axisLabels, formatter: format.axis } },
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
    // The tooltip is HTML: escape the formatted value.
    tooltip: { theme: tooltipTheme, y: { formatter: format.tooltip } },
  };

  return (
    <ApexChart
      type="line"
      options={options}
      series={[{ name: 'value', data: series }]}
      height={height}
      width={width}
      ariaLabel={ariaLabel}
    />
  );
};
