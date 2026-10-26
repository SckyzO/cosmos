import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import { GRID_PROPS, TEXT_SIZE, useAxis, xAxisTitle, yAxisTitle } from './core/axes';
import { TooltipCard } from './core/ChartTooltip';
import { BORDER, PANEL, SERIES, STATUS_CRIT, STATUS_WARN, TEXT } from './core/colors';
import { frameProps } from './core/frame';
import type { ChartAxisTitleProps, ChartProps } from './types';

export type RealtimeChartProps = ChartProps &
  ChartAxisTitleProps & {
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
     * tooltip with it, and `xTitle` has an axis to name. Default off: no x axis.
     */
    showTimeAxis?: boolean;
    /** Format the y-axis labels and the tooltip values. */
    formatValue?: (value: number) => string;
  };

type Sample = { time: number; value: number };

// The time axis reads as a clock.
const CLOCK = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
const clock = (timestamp: number) => CLOCK.format(timestamp);

/** A threshold: a line in its status color, and a label on it unless `label` is empty. */
const Threshold = ({ y, label, color }: { y: number; label: string; color: string }) => (
  <ReferenceLine
    y={y}
    stroke={color}
    strokeWidth={1.5}
    strokeDasharray="6 4"
    label={
      label === ''
        ? undefined
        : {
            value: label,
            position: 'insideTopRight',
            offset: 4,
            // Text on the card, whatever the status color: it reads on every theme.
            fill: TEXT,
            style: { fill: TEXT, fontSize: TEXT_SIZE, fontWeight: 600 },
          }
    }
  />
);

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
  xTitle,
  yTitle,
  formatValue,
  ariaLabel,
  children,
  height = 240,
  width,
}: RealtimeChartProps) => {
  const axis = useAxis();
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

  useEffect(() => {
    const id = setInterval(() => {
      setSamples((current) => [...current.slice(1), { time: Date.now(), value: generate() }]);
    }, intervalMs);
    return () => clearInterval(id);
  }, [generate, intervalMs]);

  const format = formatValue ?? String;

  // The card of the sample under the pointer, with its time when the axis shows it.
  const tooltip = ({ active, payload }: Partial<TooltipContentProps>) => {
    const sample = payload?.[0]?.payload as Sample | undefined;
    if (!active || !sample) return null;
    return (
      <TooltipCard
        title={showTimeAxis ? clock(sample.time) : undefined}
        rows={[{ name: 'value', value: format(sample.value), color: SERIES[0] }]}
      />
    );
  };

  return (
    <LineChart
      {...frameProps({
        height,
        width,
        ariaLabel: ariaLabel ?? 'Live values, newest on the right',
      })}
      data={samples}
      margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
    >
      <CartesianGrid {...GRID_PROPS} />
      {/* The samples are not on a scale of their own unless the axis is the clock. */}
      <XAxis
        dataKey="time"
        type="number"
        domain={['dataMin', 'dataMax']}
        hide={!showTimeAxis}
        tickFormatter={clock}
        {...axis}
        {...(showTimeAxis ? xAxisTitle(xTitle) : {})}
      />
      <YAxis
        domain={[min, max]}
        allowDataOverflow
        // The bottom tick is `min`: keep it.
        interval={0}
        width="auto"
        tickFormatter={formatValue}
        {...axis}
        {...yAxisTitle(yTitle)}
      />
      <Threshold y={warnThreshold} label={warnLabel} color={STATUS_WARN} />
      <Threshold y={critThreshold} label={critLabel} color={STATUS_CRIT} />
      <Tooltip
        content={tooltip}
        cursor={{ stroke: BORDER, strokeDasharray: '4 4' }}
        animationDuration={0}
      />
      <Line
        name="value"
        dataKey="value"
        type="monotone"
        stroke={SERIES[0]}
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 5, fill: PANEL, stroke: SERIES[0], strokeWidth: 2.5 }}
        // A new sample moves the window: no animation, so the line redraws steadily.
        isAnimationActive={false}
      />
      {children}
    </LineChart>
  );
};
