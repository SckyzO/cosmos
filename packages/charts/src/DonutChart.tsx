import { useState, type ComponentProps } from 'react';
import { Legend, Pie, PieChart, Tooltip } from 'recharts';
import { ANIMATION } from './core/animation';
import { ChartLegend, legendProps, useHiddenSeries } from './core/ChartLegend';
import { ChartTooltip } from './core/ChartTooltip';
import { PANEL, seriesColor } from './core/colors';
import { seriesKey } from './core/data';
import { ChartEmpty, frameProps } from './core/frame';
import { CenterText } from './core/radial';
import { shares } from './core/shares';
import type { ChartEmptyProps, ChartLegendProps, ChartProps } from './types';

export type DonutChartVariant = 'donut' | 'pie';

export type DonutChartProps = ChartProps &
  ChartEmptyProps &
  ChartLegendProps & {
    series: number[];
    labels: string[];
    /** Override the default Cosmos palette. */
    colors?: string[];
    /** Format the slice values in the center and the tooltip, and the total. */
    formatValue?: (value: number) => string;
    /** `donut` (default) leaves a hole with the total in it; `pie` fills the disc, with no center text. */
    variant?: DonutChartVariant;
    /** The small text under the center value, in place of "Total". An empty string draws nothing. Ignored by `pie`. Drawn as plain text. */
    centerLabel?: string;
    /** The center value, in place of the total (which `formatValue` formats). Ignored by `pie`. Drawn as plain text. */
    centerValue?: string;
    /**
     * Write each slice's value (through `formatValue`) and its share of the total in the
     * legend, in whole percents that add up to 100. With the legend on the left or the right
     * the figures sit in columns at the right edge of the legend.
     */
    legendValues?: boolean;
  };

// A pie's legend entries all carry the pie's data key: key them by position.
// A component of its own, so the entries are not remounted at every render.
const PieLegend = ({ payload, ...props }: ComponentProps<typeof ChartLegend>) => (
  <ChartLegend
    {...props}
    payload={payload?.map((entry, i) => ({ ...entry, dataKey: seriesKey(i) }))}
  />
);

export const DonutChart = ({
  series,
  labels,
  colors,
  formatValue = String,
  variant = 'donut',
  centerLabel,
  centerValue,
  legendValues = false,
  legendPosition = 'bottom',
  emptyMessage = 'No data',
  ariaLabel,
  children,
  height = 280,
  width,
}: DonutChartProps) => {
  const hidden = useHiddenSeries();
  // The slice the pointer is on, shown in the center in place of the total.
  const [active, setActive] = useState<number>();
  const pie = variant === 'pie';
  const name = ariaLabel ?? `${pie ? 'Pie' : 'Donut'} chart: ${labels.join(', ')}`;
  if (series.length === 0) {
    return <ChartEmpty message={emptyMessage} ariaLabel={name} height={height} width={width} />;
  }
  // A hidden slice keeps its place (and its legend entry) at zero.
  const data = labels.map((label, i) => ({
    name: label,
    value: hidden.hidden.has(seriesKey(i)) ? 0 : series[i],
    fill: seriesColor(i, colors),
  }));
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const slice = active === undefined ? undefined : data[active];
  const legend = legendProps(legendPosition, hidden);
  // The legend figures keep the whole series: hiding a slice does not move the others' share.
  const percents = shares(series);
  const detail = legendValues
    ? (index: number) => ({ value: formatValue(series[index]), share: `${percents[index]}%` })
    : undefined;
  return (
    <PieChart
      {...frameProps({ height, width, ariaLabel: name })}
      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
    >
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        innerRadius={pie ? 0 : '70%'}
        outerRadius="100%"
        paddingAngle={pie ? 0 : 3}
        cornerRadius={pie ? 0 : 6}
        // A pie has no gap between slices: a line in the color of the card tells them apart.
        stroke={pie ? PANEL : 'none'}
        strokeWidth={pie ? 2 : undefined}
        onMouseEnter={(_, index) => setActive(index)}
        onMouseLeave={() => setActive(undefined)}
        {...ANIMATION}
      />
      {!pie && (
        <CenterText
          value={slice ? formatValue(slice.value) : (centerValue ?? formatValue(total))}
          label={slice ? slice.name : (centerLabel ?? 'Total')}
        />
      )}
      <Tooltip content={<ChartTooltip format={formatValue} hideTitle />} animationDuration={150} />
      <Legend
        {...legend}
        content={
          <PieLegend
            hidden={hidden.hidden}
            onToggle={hidden.toggle}
            column={legendPosition === 'left' || legendPosition === 'right'}
            detail={detail}
          />
        }
      />
      {children}
    </PieChart>
  );
};
