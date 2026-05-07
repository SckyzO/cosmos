# @sckyzo/cosmos-charts

Cosmos charts — opinionated [ApexCharts](https://apexcharts.com/) wrappers themed for the Cosmos design system.

Kept in a dedicated subpackage so that `@sckyzo/cosmos-react` consumers who don't render charts don't ship the ApexCharts bundle.

## Install

```bash
pnpm add @sckyzo/cosmos-charts
```

## Use

```tsx
import { LineAreaChart, RealtimeChart, useChartTheme } from '@sckyzo/cosmos-charts';

<LineAreaChart
  series={[{ name: 'CPU', data: [12, 19, 23, 31, 22, 18, 25] }]}
  categories={['00h', '04h', '08h', '12h', '16h', '20h', '24h']}
/>;
```

The included `useChartTheme()` hook adapts ApexCharts grid + axis tokens to the current Cosmos color scheme (subscribes to `<html class="dark">` toggles).

## Charts shipped

| Chart                             | Notes                                             |
| --------------------------------- | ------------------------------------------------- |
| `LineAreaChart`                   | Smooth area + gradient fill                       |
| `RealtimeChart`                   | Live updates with WARN/CRIT threshold annotations |
| `RadialBarChart`                  | Multi-series radial gauge                         |
| `GradientRadial`                  | Single gradient radial                            |
| `SemiCircleGauge`                 | Half-donut gauge                                  |
| `StrokedGauge`                    | Dashed-stroke radial                              |
| `DonutChart` / `DonutRightLegend` | Donut with bottom or right legend                 |
| `Sparkline` / `SparklineGroup`    | Mini sparklines + KPI grid                        |
| `TreemapChart`                    | Repartition treemap                               |
