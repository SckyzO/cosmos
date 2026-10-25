import type { ComponentProps } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type LegendPayload,
  type TooltipContentProps,
} from 'recharts';
import { ANIMATION } from './core/animation';
import { AXIS, xAxisTitle, yAxisTitle } from './core/axes';
import { TooltipCard } from './core/ChartTooltip';
import { ChartLegend, legendProps, useHiddenSeries } from './core/ChartLegend';
import { BORDER, GRID, seriesColor } from './core/colors';
import { hasNoData, seriesKey } from './core/data';
import { ChartEmpty, frameProps } from './core/frame';
import type { ChartAxisTitleProps, ChartEmptyProps, ChartLegendProps, ChartProps } from './types';

export type RangeBarPoint = {
  /** Row label: the service, rack or host the range belongs to. */
  x: string;
  /** Start and end, as timestamps in milliseconds. */
  y: [number, number];
};

export type RangeBarChartProps = ChartProps &
  ChartEmptyProps &
  ChartLegendProps &
  ChartAxisTitleProps & {
    /** One series per kind of range (maintenance, deploy, incident…), drawn on a time axis. */
    series: { name: string; data: RangeBarPoint[] }[];
    /** Draw every series of a row on one lane, instead of one lane per series. */
    groupRows?: boolean;
    /** Override the default Cosmos palette. */
    colors?: string[];
    /** Format the start and end times in the tooltip. Default: `14 Oct, 02:00`, in UTC like the axis. */
    formatDate?: (timestamp: number) => string;
    /** Show the legend (auto-true when 2+ series). */
    showLegend?: boolean;
  };

// The axis labels are UTC, so the default tooltip is too.
const UTC_DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
});
const UTC_DAY = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
});
const UTC_TIME = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
});

const defaultFormatDate = (timestamp: number) => UTC_DATE_TIME.format(timestamp);

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const STEPS = [HOUR, 2 * HOUR, 3 * HOUR, 6 * HOUR, 12 * HOUR, DAY, 2 * DAY, 7 * DAY, 30 * DAY];

/** Round UTC ticks that cover `[min, max]`: the first step that leaves at most eight of them. */
const timeTicks = (min: number, max: number) => {
  const step = STEPS.find((s) => (max - min) / s <= 8) ?? STEPS[STEPS.length - 1];
  const first = Math.floor(min / step) * step;
  const last = Math.max(Math.ceil(max / step) * step, first + step);
  return Array.from({ length: Math.round((last - first) / step) + 1 }, (_, i) => first + i * step);
};

/** A tick label: the day at midnight, the time otherwise. */
const tickLabel = (timestamp: number) =>
  timestamp % DAY === 0 ? UTC_DAY.format(timestamp) : UTC_TIME.format(timestamp);

type Range = { series: number; start: number; end: number };
type Row = { category: string; ranges: Range[] } & Record<string, unknown>;

const GROUP_KEY = 'all';

// A bar's value is the span from the first start to the last end of what it
// draws in a row, so Recharts sizes and places it; the ranges inside are drawn
// by the shape, at the same scale.
const rangesShape =
  (key: string, colors: (series: number) => string, visible: (series: number) => boolean) =>
  (props: BarShapeProps) => {
    const { x, y, width, height } = props;
    const row = props.payload as Row;
    const bounds = row[key] as [number, number] | undefined;
    if (!bounds) return null;
    const [low, high] = bounds;
    const span = high - low || 1;
    const lane = Math.abs(height);
    const top = Math.min(y, y + height);
    return (
      <g>
        {row.ranges
          .filter((r) => visible(r.series) && (key === GROUP_KEY || key === seriesKey(r.series)))
          .map((r, i) => (
            <rect
              key={i}
              x={x + ((r.start - low) / span) * width}
              y={top}
              width={Math.max(((r.end - r.start) / span) * width, 2)}
              height={lane}
              rx={3}
              fill={colors(r.series)}
            />
          ))}
      </g>
    );
  };

// One legend entry per series, whichever way the bars are drawn: Recharts' own
// entries (one per bar) are left aside.
const SeriesLegend = ({
  entries,
  hidden,
  onToggle,
  column,
}: { entries: LegendPayload[] } & Omit<ComponentProps<typeof ChartLegend>, 'payload'>) => (
  <ChartLegend payload={entries} hidden={hidden} onToggle={onToggle} column={column} />
);

export const RangeBarChart = ({
  series,
  groupRows = false,
  colors,
  formatDate = defaultFormatDate,
  xTitle,
  yTitle,
  showLegend,
  legendPosition = 'top',
  emptyMessage = 'No data',
  ariaLabel,
  children,
  height = 320,
  width,
}: RangeBarChartProps) => {
  const hidden = useHiddenSeries();
  const name = ariaLabel ?? `Range chart: ${series.map((s) => s.name).join(', ')}`;
  if (hasNoData(series)) {
    return <ChartEmpty message={emptyMessage} ariaLabel={name} height={height} width={width} />;
  }

  const categories = [...new Set(series.flatMap((s) => s.data.map((p) => p.x)))];
  const all = series.flatMap((s) => s.data.flatMap((p) => p.y));
  const ticks = timeTicks(Math.min(...all), Math.max(...all));
  const color = (index: number) => seriesColor(index, colors);
  const visible = (index: number) => !hidden.hidden.has(seriesKey(index));

  const rows: Row[] = categories.map((category) => {
    const ranges = series.flatMap((s, index) =>
      s.data
        .filter((p) => p.x === category)
        .map((p) => ({ series: index, start: p.y[0], end: p.y[1] }))
    );
    const bounds = (of: Range[]) =>
      of.length > 0
        ? ([Math.min(...of.map((r) => r.start)), Math.max(...of.map((r) => r.end))] as const)
        : undefined;
    return {
      category,
      ranges,
      [GROUP_KEY]: bounds(ranges),
      ...Object.fromEntries(
        series.map((_, index) => [
          seriesKey(index),
          bounds(ranges.filter((r) => r.series === index)),
        ])
      ),
    };
  });

  const tooltip = ({ active, payload, label }: Partial<TooltipContentProps>) => {
    const row = payload?.[0]?.payload as Row | undefined;
    if (!active || !row) return null;
    return (
      <TooltipCard
        title={label}
        rows={row.ranges
          .filter((r) => visible(r.series))
          .map((r) => ({
            name: series[r.series].name,
            value: `${formatDate(r.start)} – ${formatDate(r.end)}`,
            color: color(r.series),
          }))}
      />
    );
  };

  return (
    <BarChart
      {...frameProps({ height, width, ariaLabel: name })}
      data={rows}
      layout="vertical"
      margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
      barGap={2}
      barCategoryGap="20%"
    >
      {/* Time runs left to right: vertical grid lines, plus a line between rows. */}
      <CartesianGrid stroke={GRID} strokeDasharray="4 4" />
      <XAxis
        type="number"
        domain={[ticks[0], ticks[ticks.length - 1]]}
        ticks={ticks}
        tickFormatter={tickLabel}
        {...AXIS}
        {...xAxisTitle(xTitle)}
      />
      <YAxis type="category" dataKey="category" width="auto" {...AXIS} {...yAxisTitle(yTitle)} />
      {(showLegend ?? series.length > 1) && (
        <Legend
          {...legendProps(legendPosition, hidden)}
          content={
            <SeriesLegend
              entries={series.map((s, index) => ({
                value: s.name,
                type: 'circle',
                color: color(index),
                dataKey: seriesKey(index),
              }))}
              hidden={hidden.hidden}
              onToggle={hidden.toggle}
              column={legendPosition === 'left' || legendPosition === 'right'}
            />
          }
        />
      )}
      <Tooltip
        content={tooltip}
        cursor={{ fill: BORDER, fillOpacity: 0.35, radius: 8 }}
        animationDuration={150}
      />
      {groupRows ? (
        <Bar
          name="Ranges"
          dataKey={GROUP_KEY}
          maxBarSize={32}
          shape={rangesShape(GROUP_KEY, color, visible)}
          {...ANIMATION}
        />
      ) : (
        series.map((s, index) => (
          <Bar
            key={seriesKey(index)}
            name={s.name}
            dataKey={seriesKey(index)}
            maxBarSize={28}
            shape={rangesShape(seriesKey(index), color, visible)}
            hide={!visible(index)}
            {...ANIMATION}
          />
        ))
      )}
      {children}
    </BarChart>
  );
};
