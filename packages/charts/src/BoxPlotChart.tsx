import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type TooltipContentProps,
} from 'recharts';
import { ANIMATION } from './core/animation';
import { GRID_PROPS, useAxis, xAxisTitle, yAxisTitle } from './core/axes';
import { categoryAxis, trimLabel } from './core/categoryAxis';
import { TooltipCard, type TooltipRow } from './core/ChartTooltip';
import { legendProps, useHiddenSeries } from './core/ChartLegend';
import { BORDER, seriesColor } from './core/colors';
import { hasNoData, seriesKey } from './core/data';
import { ChartEmpty, frameProps } from './core/frame';
import type { ChartAxisTitleProps, ChartEmptyProps, ChartLegendProps, ChartProps } from './types';

export type BoxPlotChartOrientation = 'vertical' | 'horizontal';

/** One box, the five-number summary of a distribution. */
export type BoxPlotSummary = [min: number, q1: number, median: number, q3: number, max: number];

export type BoxPlotChartProps = ChartProps &
  ChartEmptyProps &
  ChartLegendProps &
  ChartAxisTitleProps & {
    /** One summary per category, in the order of `categories`. */
    series: { name: string; data: BoxPlotSummary[] }[];
    categories: string[];
    /** `vertical` (default) draws boxes upward; `horizontal` draws them rightward. */
    orientation?: BoxPlotChartOrientation;
    /** Override the default Cosmos palette, one color per series. */
    colors?: string[];
    /** Format the value axis labels and the tooltip values. */
    formatValue?: (value: number) => string;
    /** Show the legend (auto-true when 2+ series). */
    showLegend?: boolean;
  };

// Top to bottom, the way a vertical box reads.
const ROWS = [
  ['Max', 4],
  ['Q3', 3],
  ['Median', 2],
  ['Q1', 1],
  ['Min', 0],
] as const;

const summaryKey = (index: number) => `box${index}`;

type Row = { category: string } & Record<string, unknown>;

// A bar's value is the span of the whiskers, so Recharts sizes and places it
// and fits the value axis to it; the shape draws the box, the median and the
// whiskers at the same scale. Recharts has no box plot of its own.
const boxShape = (index: number, color: string, horizontal: boolean) => (props: BarShapeProps) => {
  const { x, y, width, height } = props;
  const row = props.payload as Row;
  const summary = row[summaryKey(index)] as BoxPlotSummary | undefined;
  if (!summary) return null;
  const [min, q1, median, q3, max] = summary;
  const span = max - min || 1;
  const left = Math.min(x, x + width);
  const top = Math.min(y, y + height);
  const w = Math.abs(width);
  const h = Math.abs(height);
  // Position of a value along the value axis, and the cross-axis center.
  const at = (v: number) =>
    horizontal ? left + ((v - min) / span) * w : top + ((max - v) / span) * h;
  const mid = horizontal ? top + h / 2 : left + w / 2;
  const size = horizontal ? h : w;
  const cap = size * 0.25;
  const point = (value: number, across: number) =>
    horizontal ? { x: at(value), y: across } : { x: across, y: at(value) };
  const line = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    key: string,
    wide = 1.5
  ) => (
    <line key={key} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={wide} />
  );
  const [boxStart, boxEnd] = [at(q1), at(q3)];
  return (
    <g>
      {line(point(min, mid), point(q1, mid), 'lower')}
      {line(point(q3, mid), point(max, mid), 'upper')}
      {line(point(min, mid - cap), point(min, mid + cap), 'min')}
      {line(point(max, mid - cap), point(max, mid + cap), 'max')}
      <rect
        x={horizontal ? Math.min(boxStart, boxEnd) : mid - size / 2}
        y={horizontal ? mid - size / 2 : Math.min(boxStart, boxEnd)}
        width={horizontal ? Math.abs(boxEnd - boxStart) : size}
        height={horizontal ? size : Math.abs(boxEnd - boxStart)}
        rx={2}
        fill={color}
        fillOpacity={0.35}
        stroke={color}
        strokeWidth={1.5}
      />
      {line(point(median, mid - size / 2), point(median, mid + size / 2), 'median', 2.5)}
    </g>
  );
};

/** Distributions per category (min, quartiles, median, max), e.g. response times per service. */
export const BoxPlotChart = ({
  series,
  categories,
  orientation = 'vertical',
  colors,
  formatValue = String,
  xTitle,
  yTitle,
  showLegend,
  legendPosition = 'top',
  emptyMessage = 'No data',
  ariaLabel,
  children,
  height = 320,
  width,
}: BoxPlotChartProps) => {
  const hidden = useHiddenSeries();
  const axis = useAxis();
  const name = ariaLabel ?? `Box plot: ${series.map((s) => s.name).join(', ')}`;
  if (hasNoData(series)) {
    return <ChartEmpty message={emptyMessage} ariaLabel={name} height={height} width={width} />;
  }
  const horizontal = orientation === 'horizontal';
  const rows: Row[] = categories.map((category, i) => ({
    category,
    ...Object.fromEntries(
      series.flatMap((s, index) => {
        const summary = s.data[i];
        return summary
          ? [
              [summaryKey(index), summary],
              [seriesKey(index), [summary[0], summary[4]]],
            ]
          : [];
      })
    ),
  }));

  // The category, then the five numbers of each series shown, headed by its name when there are several.
  const tooltip = ({ active, payload, label }: Partial<TooltipContentProps>) => {
    const row = payload?.[0]?.payload as Row | undefined;
    if (!active || !row) return null;
    const lines = series.flatMap((s, index): TooltipRow[] => {
      const summary = row[summaryKey(index)] as BoxPlotSummary | undefined;
      if (!summary || hidden.hidden.has(seriesKey(index))) return [];
      const color = seriesColor(index, colors);
      return [
        ...(series.length > 1 ? [{ name: s.name, value: '', color }] : []),
        ...ROWS.map(([title, at]) => ({
          name: title,
          value: formatValue(summary[at]),
          color: series.length > 1 ? 'transparent' : color,
        })),
      ];
    });
    return <TooltipCard title={label} rows={lines} />;
  };

  return (
    <BarChart
      {...frameProps({ height, width, ariaLabel: name })}
      data={rows}
      // Recharts names the layout after the axis the categories sit on.
      layout={horizontal ? 'vertical' : 'horizontal'}
      margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
      barGap={4}
      barCategoryGap="22%"
    >
      <CartesianGrid
        {...GRID_PROPS}
        {...(horizontal ? { horizontal: false, vertical: true } : {})}
      />
      {horizontal ? (
        <>
          <XAxis
            type="number"
            domain={['auto', 'auto']}
            tickFormatter={formatValue}
            {...axis}
            {...xAxisTitle(xTitle)}
          />
          <YAxis
            type="category"
            dataKey="category"
            width="auto"
            tickFormatter={trimLabel}
            {...axis}
            {...yAxisTitle(yTitle)}
          />
        </>
      ) : (
        <>
          <XAxis
            dataKey="category"
            {...axis}
            {...xAxisTitle(xTitle)}
            {...categoryAxis(categories, xTitle)}
          />
          <YAxis
            type="number"
            domain={['auto', 'auto']}
            width="auto"
            tickFormatter={formatValue}
            {...axis}
            {...yAxisTitle(yTitle)}
          />
        </>
      )}
      {(showLegend ?? series.length > 1) && <Legend {...legendProps(legendPosition, hidden)} />}
      <Tooltip
        content={tooltip}
        cursor={{ fill: BORDER, fillOpacity: 0.35, radius: 8 }}
        animationDuration={150}
      />
      {series.map((s, index) => (
        <Bar
          key={seriesKey(index)}
          name={s.name}
          dataKey={seriesKey(index)}
          fill={seriesColor(index, colors)}
          maxBarSize={56}
          shape={boxShape(index, seriesColor(index, colors), horizontal)}
          hide={hidden.hidden.has(seriesKey(index))}
          {...ANIMATION}
        />
      ))}
      {children}
    </BarChart>
  );
};
