# @sckyzo/cosmos-charts

[![npm](https://img.shields.io/npm/v/@sckyzo/cosmos-charts)](https://www.npmjs.com/package/@sckyzo/cosmos-charts)

Cosmos charts — opinionated [ApexCharts](https://apexcharts.com/) wrappers themed for the Cosmos design system.

Kept in a dedicated subpackage so that `@sckyzo/cosmos-react` consumers who don't render charts don't ship the ApexCharts bundle.

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

The included `useChartTheme()` hook adapts ApexCharts grid + axis tokens and the brand color to the current Cosmos theme and accent: it subscribes to the theme class (`dark` and `deep-blue` render dark charts) and `data-accent` on `<html>`, and reads `--color-brand-500` and the gray scale from the CSS. `COSMOS_BRAND` is the default blue; use `useChartTheme().brand` to follow the accent. `brandScale` is a sequential scale of five brand steps, low to high (pale to deep in light themes, dark to bright in dark ones), and `surface` the card background; `HeatmapChart` uses both.

Every chart takes an `ariaLabel`, the name screen readers read for it. Without one, ApexCharts builds a generic name from the chart type and series names. Tab reaches a chart, and the arrow keys move from point to point and announce each one. The gauges and `Sparkline` show a single value or a trend: they are named images, out of the tab order.

## Charts shipped

| Chart                             | Notes                                                  |
| --------------------------------- | ------------------------------------------------------ |
| `BarChart`                        | Vertical or horizontal bars                            |
| `RangeBarChart`                   | Time ranges per row on a datetime axis (timeline)      |
| `MixedChart`                      | Columns and lines on one chart, optional second y axis |
| `LineAreaChart`                   | Smooth area + gradient fill, legend when 2+ series     |
| `RealtimeChart`                   | Live updates with WARN/CRIT threshold annotations      |
| `RadialBarChart`                  | Multi-series radial gauge                              |
| `GradientRadial`                  | Single gradient radial                                 |
| `SemiCircleGauge`                 | Half-donut gauge                                       |
| `StrokedGauge`                    | Dashed-stroke radial                                   |
| `DonutChart` / `DonutRightLegend` | Donut with bottom or right legend                      |
| `Sparkline` / `SparklineGroup`    | Mini sparklines + KPI grid                             |
| `TreemapChart`                    | Repartition treemap                                    |
| `HeatmapChart`                    | Rows × columns colored by value buckets or ranges      |
| `RadarChart`                      | One polygon per series over named axes                 |
| `ScatterChart` / `BubbleChart`    | Numeric x/y points; bubble size as a 3rd measure       |
| `BoxPlotChart`                    | Min/quartiles/max boxes, vertical or horizontal        |

## License

MIT — see [LICENSE](../../LICENSE).
