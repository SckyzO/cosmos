import type { ApexOptions } from 'apexcharts';
import 'apexcharts/rangeBar';
import 'apexcharts/features/legend';
import { ApexChart } from './ApexChart';
import { useStableCallback } from './formatters';
import { escapeHtml } from './escape';
import { useChartTheme } from './theme';
import { tooltipHtml } from './tooltip';
import type { ChartBaseProps, ChartEmptyProps, ChartLegendProps } from './types';

export type RangeBarPoint = {
  /** Row label: the service, rack or host the range belongs to. */
  x: string;
  /** Start and end, as timestamps in milliseconds. */
  y: [number, number];
};

export type RangeBarChartProps = ChartBaseProps &
  ChartEmptyProps &
  ChartLegendProps & {
    /** One series per kind of range (maintenance, deploy, incident…), drawn on a datetime axis. */
    series: { name: string; data: RangeBarPoint[] }[];
    /** Draw every series of a row on one lane, instead of one lane per series. */
    groupRows?: boolean;
    /** Override the default Cosmos palette. */
    colors?: string[];
    /** Format the start and end times in the tooltip. Default: `14 Oct, 02:00`, in UTC like the axis. */
    formatDate?: (timestamp: number) => string;
    /** Show the legend (auto-true when 2+ series). */
    showLegend?: boolean;
  };

// The axis labels are UTC (`datetimeUTC`), so the default tooltip is too.
const UTC_DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
});

const defaultFormatDate = (timestamp: number) => UTC_DATE_TIME.format(timestamp);

export const RangeBarChart = ({
  series,
  groupRows = false,
  colors,
  formatDate = defaultFormatDate,
  showLegend,
  legendPosition = 'top',
  emptyMessage,
  ariaLabel,
  apexOptions,
  height = 320,
  width = '100%',
}: RangeBarChartProps) => {
  const { grid, axisLabels, palette, tooltipTheme } = useChartTheme();
  const seriesColors = colors ?? palette;
  const legendVisible = showLegend ?? series.length > 1;
  const lanes = groupRows ? 1 : series.length;

  // ApexCharts builds the range bar tooltip itself and writes it with
  // innerHTML, so this one replaces it. tooltipHtml escapes the row, the
  // series name and the dates.
  const tooltip = useStableCallback(
    ({ seriesIndex, dataPointIndex }: { seriesIndex: number; dataPointIndex: number }) => {
      const s = series[seriesIndex];
      const point = s?.data[dataPointIndex];
      if (!point) return '';
      const [start, end] = point.y;
      return tooltipHtml({
        title: point.x,
        series: { name: s.name, color: seriesColors[seriesIndex % seriesColors.length] },
        rows: [
          ['Start', formatDate(start)],
          ['End', formatDate(end)],
        ],
      });
    }
  );

  const options: ApexOptions = {
    chart: {
      type: 'rangeBar',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
    },
    colors: seriesColors,
    dataLabels: { enabled: false },
    plotOptions: {
      bar: {
        horizontal: true,
        // Without groupRows each series gets its own lane in the row: give
        // the bars more of their (thinner) lane.
        barHeight: lanes > 1 ? '80%' : '60%',
        borderRadius: 3,
        borderRadiusApplication: 'around',
        rangeBarGroupRows: groupRows,
      },
    },
    // Time runs left to right: vertical grid lines, plus a line between rows.
    grid: { ...grid, xaxis: { lines: { show: true } }, yaxis: { lines: { show: true } } },
    // One labels object per axis: ApexCharts mutates them.
    xaxis: {
      type: 'datetime',
      labels: { ...axisLabels, datetimeUTC: true },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { ...axisLabels } },
    legend: {
      show: legendVisible,
      position: legendPosition,
      horizontalAlign: 'right',
      labels: { colors: axisLabels.style.colors },
      markers: { size: 5 },
      formatter: escapeHtml,
    },
    tooltip: { theme: tooltipTheme, custom: tooltip },
    fill: { opacity: 1 },
  };

  return (
    <ApexChart
      type="rangeBar"
      options={options}
      series={series}
      height={height}
      width={width}
      ariaLabel={ariaLabel}
      apexOptions={apexOptions}
      emptyMessage={emptyMessage}
    />
  );
};
