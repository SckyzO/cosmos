import type { ApexOptions } from 'apexcharts';
import 'apexcharts/line';
import { ApexChart } from './ApexChart';
import { seriesTitle, useOptionalValueFormat } from './formatters';
import { useChartTheme } from './theme';
import type { ChartBaseProps, ChartEmptyProps } from './types';

export type SparklineProps = ChartBaseProps &
  ChartEmptyProps & {
    data: number[];
    color?: string;
    variant?: 'line' | 'area';
    /** Names the value in the tooltip. Default `value`. Drawn as plain text. */
    label?: string;
    /**
     * Format the tooltip value (default: as ApexCharts writes it).
     * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
     */
    formatValue?: (value: number) => string;
    /**
     * Bottom of the scale. Default: the lowest value of `data`, so each sparkline fills its
     * height. Set the same `min` and `max` on sparklines that are read against each other.
     */
    min?: number;
    /** Top of the scale. Default: the highest value of `data`. */
    max?: number;
  };

export const Sparkline = ({
  data,
  color,
  variant = 'area',
  label = 'value',
  formatValue,
  min,
  max,
  emptyMessage,
  ariaLabel,
  apexOptions,
  height = 60,
  width = '100%',
}: SparklineProps) => {
  const { brand, tooltipTheme } = useChartTheme();
  const format = useOptionalValueFormat(formatValue);
  const options: ApexOptions = {
    chart: { sparkline: { enabled: true }, fontFamily: 'inherit', type: variant },
    colors: [color ?? brand],
    stroke: { curve: 'smooth', width: 2 },
    fill:
      variant === 'area'
        ? { type: 'gradient', gradient: { opacityFrom: 0.45, opacityTo: 0.05 } }
        : undefined,
    // The scale is ApexCharts' own, from the data, unless pinned.
    yaxis: { min, max },
    // The tooltip is HTML: escape the label and the formatted value.
    tooltip: {
      theme: tooltipTheme,
      fixed: { enabled: false },
      x: { show: false },
      marker: { show: false },
      y: { formatter: format.tooltip, title: { formatter: seriesTitle } },
    },
  };
  return (
    <ApexChart
      type={variant}
      options={options}
      series={[{ name: label, data }]}
      height={height}
      width={width}
      ariaLabel={ariaLabel}
      apexOptions={apexOptions}
      emptyMessage={emptyMessage}
      keyboard={false}
    />
  );
};
