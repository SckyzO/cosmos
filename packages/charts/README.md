# @sckyzo/cosmos-charts

[![npm](https://img.shields.io/npm/v/@sckyzo/cosmos-charts)](https://www.npmjs.com/package/@sckyzo/cosmos-charts)

Cosmos charts — opinionated [ApexCharts](https://apexcharts.com/) wrappers themed for the Cosmos design system.

Kept in a dedicated subpackage so that `@sckyzo/cosmos-react` consumers who don't render charts don't ship the ApexCharts bundle.

Each chart is a module of its own that loads only the ApexCharts chart types it draws, and the package declares no side effects, so a bundler ships the charts you import and leaves the others out: `import { DonutChart } from '@sckyzo/cosmos-charts'` brings the donut engine, not the line or bar ones.

## Install

```bash
pnpm add @sckyzo/cosmos-charts
pnpm add react react-dom   # peers, react 19+
```

## Use

```tsx
import { LineAreaChart, RealtimeChart, useChartTheme } from '@sckyzo/cosmos-charts';

<LineAreaChart
  series={[{ name: 'CPU', data: [12, 19, 23, 31, 22, 18, 25] }]}
  categories={['00h', '04h', '08h', '12h', '16h', '20h', '24h']}
/>;
```

The included `useChartTheme()` hook adapts ApexCharts grid + axis tokens and the brand color to the current Cosmos theme and accent: it subscribes to the theme class (`dark` and `deep-blue` render dark charts) and `data-accent` on `<html>`, and reads `--color-brand-500`, the gray scale and the status colors (`--color-success-500`, `--color-warning-500`, `--color-error-500`) from the CSS. The default palette is the brand color followed by the success, warning and error colors and a violet; `success`, `warning`, `error` and `track` (the empty part of a radial arc) come from the same hook. Without the theme CSS, the charts fall back to the hex values of `COSMOS_PALETTE`. `COSMOS_BRAND` is the default blue; use `useChartTheme().brand` to follow the accent. `brandScale` is a sequential scale of five brand steps, low to high (pale to deep in light themes, dark to bright in dark ones), and `surface` the card background; `HeatmapChart` uses both.

Most charts take `colors`, which overrides the Cosmos palette, and `formatValue`, which formats the values in their labels and tooltips (a unit, a precision). Define `formatValue` outside the component or wrap it in `useCallback`: a new function redraws the chart. The gauges (`GradientRadial`, `SemiCircleGauge`, `StrokedGauge`) also take `min` and `max` (default 0 and 100), and show a percent unless given a `formatValue`.

The charts that draw a legend take `legendPosition` (`top`, `right`, `bottom` or `left`): the legend sits above the plot by default, below the donut on `DonutChart`.

A chart with no series, or only empty ones, draws `emptyMessage` (default `No data`, an empty string for nothing) in place of the plot. The gauges, which always have a value, and `RealtimeChart`, which fills its own window, have no such prop.

For what a chart has no prop for (a toolbar, a grid color, an annotation), every chart takes `apexOptions`, [ApexCharts options](https://apexcharts.com/docs/options/) merged over the ones the chart builds, last: plain objects merge key by key, and an array, a function or any other value replaces the chart's. Your object is copied, never changed. It couples your code to the ApexCharts option format, so prefer a prop when there is one. ApexCharts ships its features (toolbar, annotations, …) as separate modules and each chart loads only the ones it uses: the options of another feature do nothing until you `import 'apexcharts/features/<name>'`. ApexCharts writes legends and tooltips with innerHTML: the charts escape every label and value they give it, but a `formatter` or `tooltip.custom` in `apexOptions` replaces theirs and gets raw values, so it must escape any HTML it writes: `escapeHtml` escapes a value, and `tooltipHtml({ title, series, rows })` builds a Cosmos tooltip with every part escaped. A function in `apexOptions` made during render redraws the chart on every render, like `formatValue`: define it outside the component or wrap it in `useCallback`. An object literal without functions is equal from one render to the next and redraws nothing.

Every chart takes an `ariaLabel`, the name screen readers read for it. Without one, ApexCharts builds a generic name from the chart type and series names. Tab reaches a chart, and the arrow keys move from point to point and announce each one. The gauges and `Sparkline` show a single value or a trend: they are named images, out of the tab order.

## Charts shipped

| Chart                          | Notes                                                  |
| ------------------------------ | ------------------------------------------------------ |
| `BarChart`                     | Vertical or horizontal bars                            |
| `RangeBarChart`                | Time ranges per row on a datetime axis (timeline)      |
| `MixedChart`                   | Columns and lines on one chart, optional second y axis |
| `LineAreaChart`                | Smooth area + gradient fill, legend when 2+ series     |
| `RealtimeChart`                | Live updates with WARN/CRIT threshold annotations      |
| `RadialBarChart`               | Multi-series radial gauge                              |
| `GradientRadial`               | Single gradient radial                                 |
| `SemiCircleGauge`              | Half-donut gauge                                       |
| `StrokedGauge`                 | Dashed-stroke radial                                   |
| `DonutChart`                   | Donut, legend below by default                         |
| `Sparkline` / `SparklineGroup` | Mini sparklines + KPI grid                             |
| `TreemapChart`                 | Repartition treemap                                    |
| `HeatmapChart`                 | Rows × columns colored by value buckets or ranges      |
| `RadarChart`                   | One polygon per series over named axes                 |
| `ScatterChart` / `BubbleChart` | Numeric x/y points; bubble size as a 3rd measure       |
| `BoxPlotChart`                 | Min/quartiles/max boxes, vertical or horizontal        |

## License

MIT — see [LICENSE](../../LICENSE).
