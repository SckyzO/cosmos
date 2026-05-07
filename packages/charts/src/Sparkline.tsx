import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useChartTheme } from './theme';
import type { ChartSize } from './types';

export type SparklineProps = ChartSize & {
  data: number[];
  color?: string;
  variant?: 'line' | 'area';
};

export const Sparkline = ({
  data,
  color,
  variant = 'area',
  height = 60,
  width = '100%',
}: SparklineProps) => {
  const { brand } = useChartTheme();
  const options: ApexOptions = {
    chart: { sparkline: { enabled: true }, fontFamily: 'inherit', type: variant },
    colors: [color ?? brand],
    stroke: { curve: 'smooth', width: 2 },
    fill:
      variant === 'area'
        ? { type: 'gradient', gradient: { opacityFrom: 0.45, opacityTo: 0.05 } }
        : undefined,
    tooltip: { fixed: { enabled: false }, x: { show: false }, marker: { show: false } },
  };
  return (
    <ReactApexChart
      type={variant}
      options={options}
      series={[{ name: 'value', data }]}
      height={height}
      width={width}
    />
  );
};

export type SparklineGroupItem = {
  label: string;
  value: number | string;
  data: number[];
  color?: string;
};

export const SparklineGroup = ({
  items,
  className,
}: {
  items: SparklineGroupItem[];
  className?: string;
}) => (
  <div
    className={className}
    style={{
      display: 'grid',
      gap: '1rem',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    }}
  >
    {items.map((it) => (
      <div
        key={it.label}
        className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
      >
        <p className="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
          {it.label}
        </p>
        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{it.value}</p>
        <Sparkline data={it.data} color={it.color} height={50} />
      </div>
    ))}
  </div>
);
