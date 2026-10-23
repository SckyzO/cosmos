import type { ApexOptions } from 'apexcharts';
import 'apexcharts/radialBar';
import { ApexChart } from './ApexChart';
import { percent, useValueFormat } from './formatters';
import { useChartTheme } from './theme';
import type { ChartBaseProps } from './types';

export type GradientRadialProps = ChartBaseProps & {
  value: number;
  label?: string;
  /** Value at the start of the arc. Default 0. */
  min?: number;
  /** Value at the end of the arc, above `min`. Default 100. Out of range, the arc stops at an end. */
  max?: number;
  /**
   * Format the center value, from `value` itself (not its share of the range). Default: `84%`.
   * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
   */
  formatValue?: (value: number) => string;
};

export const GradientRadial = ({
  value,
  label = 'Score',
  min = 0,
  max = 100,
  formatValue = percent,
  ariaLabel,
  apexOptions,
  height = 280,
  width = '100%',
}: GradientRadialProps) => {
  const { brand, success, text, textMuted, track } = useChartTheme();
  const format = useValueFormat(formatValue);
  const options: ApexOptions = {
    chart: { type: 'radialBar', fontFamily: 'inherit', foreColor: text },
    colors: [brand],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: [success],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    plotOptions: {
      radialBar: {
        // ApexCharts maps the value onto the arc, clamped to the range, and
        // hands the formatter the value itself.
        min,
        max,
        hollow: { size: '70%' },
        track: { background: track },
        dataLabels: {
          name: { fontSize: '12px', offsetY: -10, color: textMuted },
          value: { fontSize: '32px', fontWeight: 700, formatter: format.axis },
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
