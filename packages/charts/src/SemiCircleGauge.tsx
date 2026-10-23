import type { ApexOptions } from 'apexcharts';
import 'apexcharts/radialBar';
import { ApexChart } from './ApexChart';
import { percent } from './formatters';
import { useChartTheme } from './theme';
import type { ChartBaseProps } from './types';

export type SemiCircleGaugeProps = ChartBaseProps & {
  value: number;
  label?: string;
  color?: string;
};

export const SemiCircleGauge = ({
  value,
  label = '',
  color,
  ariaLabel,
  height = 200,
  width = '100%',
}: SemiCircleGaugeProps) => {
  const { brand, text, textMuted } = useChartTheme();
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
        track: { background: 'rgba(150,150,150,0.15)', strokeWidth: '100%' },
        dataLabels: {
          name: { offsetY: -10, fontSize: '12px', color: textMuted },
          value: { offsetY: -45, fontSize: '24px', fontWeight: 700, formatter: percent },
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
      keyboard={false}
    />
  );
};
