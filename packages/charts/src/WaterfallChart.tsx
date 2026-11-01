import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  YAxis,
  type BarShapeProps,
  type TooltipContentProps,
} from 'recharts';
import { ANIMATION } from './core/animation';
import { AXIS, GRID_PROPS, TEXT_SIZE, useAxis, xAxisTitle, yAxisTitle } from './core/axes';
import { trimLabel } from './core/categoryAxis';
import { TooltipCard } from './core/ChartTooltip';
import { BORDER, ERROR, MUTED, SERIES, SUCCESS, TEXT } from './core/colors';
import { ChartEmpty, ChartSkeleton, frameProps } from './core/frame';
import { useElementWidth } from './core/useElementWidth';
import type { ChartAxisTitleProps, ChartEmptyProps, ChartLoadingProps, ChartProps } from './types';
import {
  barText,
  KIND_WORDS,
  signed,
  waterfallBars,
  type WaterfallBar,
  type WaterfallDatum,
} from './waterfall';

export type { WaterfallDatum } from './waterfall';

export type WaterfallChartProps = ChartProps &
  ChartEmptyProps &
  ChartLoadingProps &
  ChartAxisTitleProps & {
    /**
     * The bars, left to right. A step (default) carries a signed `value`. A
     * `subtotal` is drawn from 0 to the running total at that point. A
     * `total` is drawn the same way, and a `value` on it sets the running
     * total to it: an opening balance, or a known balance mid-walk.
     */
    data: WaterfallDatum[];
    /** Format the value axis, the labels and the tooltip. The sign of a step is written apart: the function gets the magnitude. */
    formatValue?: (value: number) => string;
    /**
     * Write the value above each bar. Default: on with 12 bars or fewer in a chart at least
     * 480px wide, off otherwise (the values stay in the tooltip and the keyboard walk).
     */
    showLabels?: boolean;
    /** Dashed lines from the top of a bar to the next one. Default true. */
    showConnectors?: boolean;
    /** Override the colors: increases, decreases, totals and subtotals. Defaults: the theme's success, error and accent. */
    colors?: { positive?: string; negative?: string; total?: string };
  };

// Below this width the value labels go and the category names tilt.
const NARROW = 480;
const MAX_LABELED_BARS = 12;
// The share of a category's band left empty on each side of a bar, and the
// widest bar. Recharts places the bar from these; the connectors are drawn
// from the same numbers.
const GAP = 0.19;
const MAX_BAR = 64;
// Pixels one character of a category name takes, at the largest text size.
const CHAR_WIDTH = 8;
const SUBTOTAL_OPACITY = 0.55;
const TILT_HEIGHT = 4.2;
const MAX_CHARS = 14;

type Row = WaterfallBar & { key: string; range: [number, number] };

type Palette = { positive: string; negative: string; total: string };

const fillOf = (kind: WaterfallBar['kind'], palette: Palette) =>
  kind === 'increase' ? palette.positive : kind === 'decrease' ? palette.negative : palette.total;

// The bar is the span between the running total before and after the step; the
// label above it is drawn here too, so it moves with the bar while it grows.
const waterfallShape =
  (palette: Palette, labels: boolean, format: (value: number) => string) =>
  (props: BarShapeProps) => {
    const row = props.payload as Row;
    const left = Math.min(props.x, props.x + props.width);
    const top = Math.min(props.y, props.y + props.height);
    const width = Math.abs(props.width);
    // A step of 0 is a hairline.
    const height = Math.max(Math.abs(props.height), 1);
    if (!(width > 0)) return null;
    return (
      <g>
        <rect
          x={left}
          y={top}
          width={width}
          height={height}
          rx={Math.min(3, width / 2, height / 2)}
          fill={fillOf(row.kind, palette)}
          fillOpacity={row.kind === 'subtotal' ? SUBTOTAL_OPACITY : 1}
        />
        {labels && (
          <text
            x={left + width / 2}
            y={top - 6}
            textAnchor="middle"
            fill={TEXT}
            style={{
              fontSize: TEXT_SIZE,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {barText(row, format)}
          </text>
        )}
      </g>
    );
  };

// From the right edge of a bar, at the running total after it, to the left edge
// of the next one. Out of the accessibility layer: the bars say it all.
const Connectors = ({ bars }: { bars: readonly WaterfallBar[] }) => {
  const x = useXAxisScale();
  const y = useYAxisScale();
  if (!x || !y) return null;
  const edges = bars.map((_, i) => {
    const start = x(String(i), { position: 'start' });
    const end = x(String(i), { position: 'end' });
    if (start === undefined || end === undefined) return undefined;
    const band = end - start;
    const full = Math.round(band * (1 - 2 * GAP));
    const size = Math.min(full, MAX_BAR);
    const left = start + band * GAP + (full - size) / 2;
    return { left, right: left + size };
  });
  return (
    <g aria-hidden data-waterfall-connectors="">
      {bars.slice(0, -1).map((bar, i) => {
        const from = edges[i];
        const to = edges[i + 1];
        const level = y(bar.running);
        if (!from || !to || level === undefined) return null;
        return (
          <line
            key={i}
            x1={from.right}
            x2={to.left}
            y1={level}
            y2={level}
            stroke={MUTED}
            strokeOpacity={0.7}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        );
      })}
    </g>
  );
};

export const WaterfallChart = ({
  data,
  formatValue = String,
  showLabels,
  showConnectors = true,
  colors,
  xTitle,
  yTitle,
  emptyMessage = 'No data',
  loading,
  ariaLabel,
  children,
  height = 320,
  width,
}: WaterfallChartProps) => {
  const axis = useAxis();
  const { ref, width: measured } = useElementWidth();
  const bars = useMemo(() => waterfallBars(data), [data]);
  const rows: Row[] = useMemo(
    () => bars.map((bar, i) => ({ ...bar, key: String(i), range: [bar.low, bar.high] })),
    [bars]
  );
  const name = ariaLabel ?? `Waterfall chart: ${data.map((d) => d.label).join(', ')}`;
  if (loading) return <ChartSkeleton ariaLabel={name} height={height} width={width} />;
  if (data.length === 0) {
    return <ChartEmpty message={emptyMessage} ariaLabel={name} height={height} width={width} />;
  }

  const palette: Palette = {
    positive: colors?.positive ?? SUCCESS,
    negative: colors?.negative ?? ERROR,
    total: colors?.total ?? SERIES[0],
  };
  const narrow = measured !== undefined && measured < NARROW;
  const labels = showLabels ?? (rows.length <= MAX_LABELED_BARS && !narrow);
  // Names tilt when the chart is narrow, or when they would not fit side by side.
  const longest = Math.min(MAX_CHARS, Math.max(...rows.map((row) => row.label.length)));
  const band = measured === undefined ? Infinity : (measured - 56) / rows.length;
  const tilted = narrow || longest * CHAR_WIDTH > band;
  const labelAxis = {
    interval: 0,
    tickFormatter: (_: unknown, index: number) => trimLabel(rows[index]?.label ?? ''),
    ...(tilted
      ? {
          angle: -40,
          tick: { ...AXIS.tick, textAnchor: 'end' },
          height: (xTitle ? 52 : 30) + Math.round(longest * TILT_HEIGHT),
        }
      : {}),
  } as const;

  const tooltip = ({ active, payload }: Partial<TooltipContentProps>) => {
    const row = payload?.[0]?.payload as Row | undefined;
    if (!active || !row) return null;
    const color = fillOf(row.kind, palette);
    const step = row.kind === 'increase' || row.kind === 'decrease';
    return (
      <TooltipCard
        title={row.label}
        rows={[
          {
            name: KIND_WORDS[row.kind],
            value: step ? signed(row.value, formatValue) : formatValue(row.running),
            color,
          },
          ...(step
            ? [{ name: 'Running total', value: formatValue(row.running), color: 'transparent' }]
            : []),
        ]}
      />
    );
  };

  return (
    <div ref={ref} style={{ width: width ?? '100%', maxWidth: '100%' }}>
      <BarChart
        {...frameProps({ height, width: '100%', ariaLabel: name })}
        data={rows}
        margin={{ top: labels ? 24 : 4, right: 8, bottom: 0, left: 0 }}
        barCategoryGap={`${GAP * 100}%`}
      >
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="key" {...axis} {...xAxisTitle(xTitle)} {...labelAxis} />
        <YAxis width="auto" tickFormatter={formatValue} {...axis} {...yAxisTitle(yTitle)} />
        <Tooltip
          content={tooltip}
          cursor={{ fill: BORDER, fillOpacity: 0.35, radius: 8 }}
          animationDuration={150}
        />
        <Bar
          name="Waterfall"
          dataKey="range"
          maxBarSize={MAX_BAR}
          shape={waterfallShape(palette, labels, formatValue)}
          {...ANIMATION}
        />
        {showConnectors && <Connectors bars={bars} />}
        {children}
      </BarChart>
    </div>
  );
};
