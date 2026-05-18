import type { ApexOptions } from 'apexcharts';
import ReactApexChart from 'react-apexcharts';
import { useChartTheme } from './theme';
import type { ChartSize } from './types';

export type BarChartOrientation = 'vertical' | 'horizontal';

export type BarChartProps = ChartSize & {
  series: { name: string; data: number[] }[];
  categories: (string | number)[];
  /** `vertical` (default) draws bars upward; `horizontal` draws them rightward. */
  orientation?: BarChartOrientation;
  /** Stack multi-series bars instead of grouping them side-by-side. */
  stacked?: boolean;
  /** Override the default Cosmos palette. */
  colors?: string[];
  /** Format the numeric axis labels (and tooltip values). */
  formatValue?: (value: number) => string;
  /** Show the legend (auto-true when 2+ series). */
  showLegend?: boolean;
  /** Tailwind border-radius applied to bar tops. Default 4. */
  borderRadius?: number;
};

export const BarChart = ({
  series,
  categories,
  orientation = 'vertical',
  stacked = false,
  colors,
  formatValue,
  showLegend,
  borderRadius = 4,
  height = 320,
  width = '100%',
}: BarChartProps) => {
  const { grid, axisLabels, palette } = useChartTheme();
  const horizontal = orientation === 'horizontal';
  const legendVisible = showLegend ?? series.length > 1;

  const valueFormatter = formatValue ?? ((v: number) => String(v));

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      zoom: { enabled: false },
      stacked,
      fontFamily: 'inherit',
    },
    colors: colors ?? palette,
    dataLabels: { enabled: false },
    plotOptions: {
      bar: {
        horizontal,
        borderRadius,
        borderRadiusApplication: 'end',
        columnWidth: '55%',
      },
    },
    grid,
    xaxis: {
      categories,
      labels: {
        ...axisLabels,
        formatter: horizontal ? (val) => valueFormatter(Number(val)) : undefined,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        ...axisLabels,
        formatter: horizontal ? undefined : (val) => valueFormatter(Number(val)),
      },
    },
    legend: {
      show: legendVisible,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: axisLabels.style.colors },
      markers: { size: 5 },
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (v) => valueFormatter(Number(v)) },
    },
    fill: { opacity: 1 },
    stroke: { show: false },
  };

  return (
    <ReactApexChart type="bar" options={options} series={series} height={height} width={width} />
  );
};
