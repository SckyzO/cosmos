import type { ApexOptions } from 'apexcharts';
import 'apexcharts/radialBar';
import { ApexChart } from './ApexChart';
import { percent } from './formatters';
import { useChartTheme } from './theme';
import type { ChartBaseProps } from './types';

export type StrokedGaugeProps = ChartBaseProps & {
  value: number;
  label?: string;
};

export const StrokedGauge = ({
  value,
  label = '',
  ariaLabel,
  height = 280,
  width = '100%',
}: StrokedGaugeProps) => {
  const { brand, text, textMuted } = useChartTheme();
  const options: ApexOptions = {
    chart: { type: 'radialBar', fontFamily: 'inherit', foreColor: text },
    colors: [brand],
    stroke: { lineCap: 'round', dashArray: 4 },
    plotOptions: {
      radialBar: {
        hollow: { size: '70%' },
        track: { background: 'rgba(150,150,150,0.15)', strokeWidth: '100%' },
        dataLabels: {
          name: { fontSize: '12px', offsetY: -10, color: textMuted },
          value: { fontSize: '32px', fontWeight: 700, formatter: percent },
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
