import { useState, type ComponentProps } from 'react';
import { Legend, Pie, PieChart, Tooltip } from 'recharts';
import { ANIMATION } from './core/animation';
import { ChartLegend, legendProps, useHiddenSeries } from './core/ChartLegend';
import { ChartTooltip } from './core/ChartTooltip';
import { seriesColor } from './core/colors';
import { seriesKey } from './core/data';
import { ChartEmpty, frameProps } from './core/frame';
import { CenterText } from './core/radial';
import type { ChartEmptyProps, ChartLegendProps, ChartProps } from './types';

export type DonutChartProps = ChartProps &
  ChartEmptyProps &
  ChartLegendProps & {
    series: number[];
    labels: string[];
    /** Override the default Cosmos palette. */
    colors?: string[];
    /** Format the slice values in the center and the tooltip, and the total. */
    formatValue?: (value: number) => string;
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
  const name = ariaLabel ?? `Donut chart: ${labels.join(', ')}`;
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
  return (
    <PieChart
      {...frameProps({ height, width, ariaLabel: name })}
      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
    >
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        innerRadius="70%"
        outerRadius="100%"
        paddingAngle={3}
        cornerRadius={6}
        stroke="none"
        onMouseEnter={(_, index) => setActive(index)}
        onMouseLeave={() => setActive(undefined)}
        {...ANIMATION}
      />
      <CenterText
        value={formatValue(slice ? slice.value : total)}
        label={slice ? slice.name : 'Total'}
      />
      <Tooltip content={<ChartTooltip format={formatValue} hideTitle />} animationDuration={150} />
      <Legend
        {...legend}
        content={
          <PieLegend
            hidden={hidden.hidden}
            onToggle={hidden.toggle}
            column={legendPosition === 'left' || legendPosition === 'right'}
          />
        }
      />
      {children}
    </PieChart>
  );
};
