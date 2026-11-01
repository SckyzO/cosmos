import { useMemo, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react';
import { Line, LineChart, Tooltip, XAxis, YAxis, type DotItemDotProps } from 'recharts';
import { ANIMATION } from './core/animation';
import { AXIS } from './core/axes';
import {
  describeChange,
  periodsOf,
  plottedRanks,
  rankChange,
  rankSpan,
  ranksOf,
  shortName,
  TIE_SPREAD,
  type BumpSeries,
} from './core/bump';
import { categoryAxis } from './core/categoryAxis';
import { TooltipCard } from './core/ChartTooltip';
import { BORDER, MUTED, PANEL, TEXT, seriesColor } from './core/colors';
import { hasNoData, seriesKey } from './core/data';
import { ChartEmpty, ChartSkeleton, frameProps } from './core/frame';
import { useElementWidth } from './core/useElementWidth';
import type { ChartEmptyProps, ChartLoadingProps, ChartProps } from './types';

export type { BumpPoint, BumpSeries } from './core/bump';

export type BumpChartPoints = 'rank' | 'dot';

export type BumpChartProps = ChartProps &
  ChartEmptyProps &
  ChartLoadingProps & {
    /**
     * One entry per ranked item. `data` lists the rank (1 is the top) of the
     * item in each period. The periods are every `x` once, in the order they
     * first appear, so list them in order in the series that has them all. A
     * period an item has no point in (it enters late, or leaves) is a gap in
     * its line. Ties are allowed: items tied on a rank are drawn apart around it.
     */
    series: BumpSeries[];
    /** Override the default Cosmos palette. */
    colors?: string[];
    /** Format a rank in the tooltip. Default `#1`, `#2`…; the points keep the bare number. */
    formatValue?: (rank: number) => string;
    /**
     * `rank` (default) draws a disc ringed with the series color with the rank
     * written in it; `dot` draws a small filled dot.
     */
    points?: BumpChartPoints;
  };

const defaultFormat = (rank: number) => `#${rank}`;

// Below this width the plot gets the room: only the right-hand names stay, cut shorter.
const COMPACT_BELOW = 560;
const NAME_CHARS = { wide: 12, compact: 8 };
// Room taken by a name, beside its point: the gap to the point, the color dot, the gap to the text.
const NAME_GAP = 32;
// The width of a character at the size of the names, rounded up: the text size setting is not known here.
const CHAR_WIDTH = 9;
// The point's distance to the color dot of its name.
const DOT_OFFSET = 18;
// The disc is 24px across with its ring: the ring is centered on the radius.
const RANK_STROKE = 2.5;
// The least room between two periods for the discs to stay apart; below it the points are dots.
const MIN_DISC_STEP = 26;
const RANK_RADIUS = 12 - RANK_STROKE / 2;
const DOT_RADIUS = 4;

type Focus = number | null;

/** The tooltip: the period, then the rank and its change of the focused series, or of all of them. */
const BumpTooltip = ({
  active,
  label,
  series,
  periods,
  ranks,
  colors,
  focus,
  format,
}: {
  active?: boolean;
  label?: string | number;
  series: BumpSeries[];
  periods: string[];
  ranks: (number | undefined)[][];
  colors?: string[];
  focus: Focus;
  format: (rank: number) => string;
}) => {
  const period = periods.indexOf(String(label));
  if (!active || period === -1) return null;
  const indexes = focus === null ? series.map((_, i) => i) : [focus];
  const rows = indexes
    .map((i) => ({ i, rank: ranks[i][period] }))
    .filter(({ i, rank }) => rank !== undefined || i === focus)
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.i - b.i)
    .map(({ i, rank }) => {
      const change = rank === undefined ? undefined : rankChange(ranks[i], periods, period);
      return {
        name: series[i].name,
        color: seriesColor(i, colors),
        value:
          rank === undefined ? (
            'not ranked'
          ) : (
            <>
              {format(rank)}
              {change && (
                <span style={{ marginLeft: '0.5rem', fontWeight: 400, color: MUTED }}>
                  {describeChange(change)}
                </span>
              )}
            </>
          ),
      };
    });
  return <TooltipCard title={periods[period]} rows={rows} />;
};

export const BumpChart = ({
  series,
  colors,
  formatValue = defaultFormat,
  points = 'rank',
  emptyMessage = 'No data',
  loading,
  ariaLabel,
  children,
  height = 320,
  width,
}: BumpChartProps) => {
  const [focus, setFocus] = useState<Focus>(null);
  const { ref, width: measured } = useElementWidth();
  const name = ariaLabel ?? `Bump chart: ${series.map((s) => s.name).join(', ')}`;
  const periods = useMemo(() => periodsOf(series), [series]);
  const ranks = useMemo(() => ranksOf(series, periods), [series, periods]);
  const plotted = useMemo(() => plottedRanks(ranks), [ranks]);
  const rows = useMemo(
    () =>
      periods.map((period, p) => ({
        category: period,
        ...Object.fromEntries(plotted.map((r, i) => [seriesKey(i), r[p]])),
      })),
    [periods, plotted]
  );
  if (loading) return <ChartSkeleton ariaLabel={name} height={height} width={width} />;
  if (hasNoData(series) || periods.length === 0) {
    return <ChartEmpty message={emptyMessage} ariaLabel={name} height={height} width={width} />;
  }

  const compact = measured !== undefined && measured < COMPACT_BELOW;
  const chars = compact ? NAME_CHARS.compact : NAME_CHARS.wide;
  const room =
    Math.min(chars, Math.max(...series.map((s) => s.name.length))) * CHAR_WIDTH + NAME_GAP;
  const margin = {
    top: 8,
    right: room,
    bottom: 0,
    // The first disc hangs out of the plot by its radius.
    left: compact ? 12 + 4 : room,
  };
  const step =
    measured === undefined
      ? Infinity
      : (measured - margin.left - margin.right) / Math.max(1, periods.length - 1);
  const asRank = points === 'rank' && step >= MIN_DISC_STEP;
  const flat = plotted.flat().filter((v): v is number => v !== undefined);
  const spare = TIE_SPREAD + 0.05;
  const domain: [number, number] = [Math.min(...flat) - spare, Math.max(...flat) + spare];
  const spans = ranks.map(rankSpan);

  // Up and Down walk the series, Escape lets go; Left and Right (Recharts) walk the periods.
  const onKeyDown = (event: KeyboardEvent) => {
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (step !== undefined) {
      event.preventDefault();
      setFocus((current) =>
        current === null
          ? step === 1
            ? 0
            : series.length - 1
          : (current + step + series.length) % series.length
      );
    } else if (event.key === 'Escape' && focus !== null) {
      event.preventDefault();
      setFocus(null);
    }
  };
  const onBlur = (event: FocusEvent) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocus(null);
  };
  const pointer = (i: number) => ({
    onMouseEnter: () => setFocus(i),
    onMouseLeave: () => setFocus(null),
  });

  const renderDot = (i: number) => {
    const color = seriesColor(i, colors);
    const Dot = ({ cx, cy, index }: DotItemDotProps): ReactNode => {
      const rank = ranks[i][index];
      if (rank === undefined || cx === undefined || cy === undefined) return null;
      return (
        <g
          key={index}
          data-bump-point=""
          opacity={focus !== null && focus !== i ? 0.3 : 1}
          {...pointer(i)}
          style={{ transition: 'opacity 150ms' }}
        >
          {asRank ? (
            <>
              <circle
                cx={cx}
                cy={cy}
                r={RANK_RADIUS}
                fill={PANEL}
                stroke={color}
                strokeWidth={2.5}
              />
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fill={TEXT}
                style={{ fontSize: 'var(--text-2xs, 0.6875rem)', fontWeight: 700 }}
              >
                {rank}
              </text>
            </>
          ) : (
            <circle cx={cx} cy={cy} r={DOT_RADIUS} fill={color} stroke={PANEL} strokeWidth={2} />
          )}
        </g>
      );
    };
    return Dot;
  };

  // A name sits beside the first and last point of its line, with the color dot toward the line.
  const renderName = (i: number) => {
    const color = seriesColor(i, colors);
    const span = spans[i];
    const text = shortName(series[i].name, chars);
    const Name = ({
      x,
      y,
      index,
    }: {
      x?: number | string;
      y?: number | string;
      index?: number;
    }) => {
      if (!span || typeof x !== 'number' || typeof y !== 'number') return null;
      const end = index === span.last;
      const start = index === span.first && !compact && span.first !== span.last;
      if (!end && !start) return null;
      const side = end ? 1 : -1;
      return (
        <g
          key={`${index}`}
          data-bump-name=""
          opacity={focus !== null && focus !== i ? 0.3 : 1}
          {...pointer(i)}
          style={{ transition: 'opacity 150ms' }}
        >
          <circle cx={x + side * DOT_OFFSET} cy={y} r={4} fill={color} />
          <text
            x={x + side * (DOT_OFFSET + 10)}
            y={y}
            textAnchor={end ? 'start' : 'end'}
            dominantBaseline="central"
            fill={TEXT}
            stroke={PANEL}
            strokeWidth={3}
            strokeLinejoin="round"
            paintOrder="stroke"
            style={{ fontSize: 'var(--text-sm, 0.875rem)', fontWeight: 600 }}
          >
            {text}
          </text>
        </g>
      );
    };
    return Name;
  };

  return (
    <div
      ref={ref}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      style={{ width: width ?? '100%', maxWidth: '100%' }}
    >
      <LineChart
        {...frameProps({ height, width: '100%', ariaLabel: name })}
        data={rows}
        margin={margin}
      >
        <XAxis dataKey="category" {...AXIS} {...categoryAxis(periods)} />
        <YAxis hide type="number" reversed domain={domain} />
        <Tooltip
          content={
            <BumpTooltip
              series={series}
              periods={periods}
              ranks={ranks}
              colors={colors}
              focus={focus}
              format={formatValue}
            />
          }
          cursor={{ stroke: BORDER, strokeDasharray: '4 4' }}
          animationDuration={150}
        />
        {series.map((s, i) => (
          <Line
            key={seriesKey(i)}
            name={s.name}
            dataKey={seriesKey(i)}
            type="bumpX"
            stroke={seriesColor(i, colors)}
            strokeWidth={focus === i ? 4 : 3}
            strokeOpacity={focus !== null && focus !== i ? 0.2 : 1}
            strokeLinecap="round"
            connectNulls={false}
            dot={renderDot(i)}
            activeDot={false}
            label={renderName(i)}
            {...pointer(i)}
            {...ANIMATION}
          />
        ))}
        {children}
      </LineChart>
    </div>
  );
};
