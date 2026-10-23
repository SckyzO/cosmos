import type { ApexOptions } from 'apexcharts';
import 'apexcharts/radialBar';
import { ApexChart } from './ApexChart';
import { percent, useValueFormat } from './formatters';
import { useChartTheme } from './theme';
import type { ChartBaseProps } from './types';

export type SemiCircleGaugeProps = ChartBaseProps & {
  value: number;
  label?: string;
  color?: string;
  /** Value at the start of the arc. Default 0. */
  min?: number;
  /** Value at the end of the arc, above `min`. Default 100. Out of range, the arc stops at an end. */
  max?: number;
  /**
   * Format the center value, from `value` itself (not its share of the range). Default: `67%`.
   * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
   */
  formatValue?: (value: number) => string;
};

export const SemiCircleGauge = ({
  value,
  label = '',
  color,
  min = 0,
  max = 100,
  formatValue = percent,
  ariaLabel,
  apexOptions,
  height = 200,
  width = '100%',
}: SemiCircleGaugeProps) => {
  const { brand, text, textMuted, track } = useChartTheme();
  const format = useValueFormat(formatValue);
  const options: ApexOptions = {
    chart: {
      type: 'radialBar',
      fontFamily: 'inherit',
      foreColor: text,
      sparkline: { enabled: true },
    },
    colors: [color ?? brand],
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        // ApexCharts maps the value onto the arc, clamped to the range, and
        // hands the formatter the value itself.
        min,
        max,
        track: { background: track, strokeWidth: '100%' },
        dataLabels: {
          name: { offsetY: -10, fontSize: '12px', color: textMuted },
          value: { offsetY: -45, fontSize: '24px', fontWeight: 700, formatter: format.axis },
        },
      },
    },
    labels: [label],
  };
  return (
    <ApexChart
      type="radialBar"
      options={options}
      series={[value]}
      height={height}
      width={width}
      ariaLabel={ariaLabel}
      apexOptions={apexOptions}
      keyboard={false}
    />
  );
};
