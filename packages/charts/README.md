# @sckyzo/cosmos-charts

[![npm](https://img.shields.io/npm/v/@sckyzo/cosmos-charts)](https://www.npmjs.com/package/@sckyzo/cosmos-charts)

Cosmos charts — opinionated chart wrappers themed for the Cosmos design system. They are moving from [ApexCharts](https://apexcharts.com/) to [Recharts](https://recharts.github.io/) one family at a time (#360): `LineAreaChart` and `Sparkline` draw with Recharts, the others still with ApexCharts for now.

Kept in a dedicated subpackage so that `@sckyzo/cosmos-react` consumers who don't render charts don't ship a chart library.

Each chart is a module of its own that loads only the ApexCharts chart types it draws, and the package declares no side effects, so a bundler ships the charts you import and leaves the others out: `import { DonutChart } from '@sckyzo/cosmos-charts'` brings the donut engine, not the line or bar ones.

## Install

```bash
pnpm add @sckyzo/cosmos-charts
pnpm add react react-dom   # peers, react 19+
```

## Charts on Recharts

`LineAreaChart` and `Sparkline` are drawn with Recharts, and the rules below are the ones every chart will follow once the move is done:

- **Colors are CSS variables** handed straight to the SVG, with a hex fallback: a theme, accent or text size switch on `<html>` repaints the chart with no observer and no redraw. `@sckyzo/cosmos-theme` always emits what the charts read (`--color-brand-500`, the status and semantic colors, `--color-chart-2` to `--color-chart-8`).
- **The default palette** is the accent, then seven hues. Each accent lists its own seven in the theme CSS, skipping the hues that look like it (the teal accent has no teal series), and none of the first four reads as a status. `colors` overrides it.
- **Text** is 12px at the normal text size and follows the text size setting; the font is inherited.
- **The tooltip and the legend are React**: a series name, a category or a title with markup shows as written. The legend keeps the series order, and an item is a button that hides and shows its series (Enter and Space work).
- **`children` replaces `apexOptions`**: Recharts elements drawn inside the chart, after the ones it builds, for what a chart has no prop for.

```tsx
import { ReferenceLine } from 'recharts';

<LineAreaChart series={series} categories={hours} yTitle="CPU usage (%)">
  <ReferenceLine y={80} stroke="var(--color-status-warn)" strokeDasharray="6 4" />
</LineAreaChart>;
```

`children` reads the chart's data and axes, so a `y` is in the units of the series. Add `recharts` to your app at the version this package depends on (`3.10.1`): two copies of Recharts do not share a chart's context, and the elements would not find it. Pass CSS variables for colors (`var(--color-status-warn)`) and they follow the theme.

Animation is short (500 ms) and off under `prefers-reduced-motion`. A chart fills the width it is given and never widens its parent (`width` caps it).

## Use

```tsx
import { LineAreaChart, RealtimeChart, useChartTheme } from '@sckyzo/cosmos-charts';

<LineAreaChart
  series={[{ name: 'CPU', data: [12, 19, 23, 31, 22, 18, 25] }]}
  categories={['00h', '04h', '08h', '12h', '16h', '20h', '24h']}
/>;
```

On the charts still drawn with ApexCharts, the included `useChartTheme()` hook adapts ApexCharts grid + axis tokens and the brand color to the current Cosmos theme and accent: it subscribes to the theme class (`dark` and `deep-blue` render dark charts) and `data-accent` on `<html>`, and reads `--color-brand-500`, the gray scale and the status colors (`--color-success-500`, `--color-warning-500`, `--color-error-500`) from the CSS. The default palette (`palette`) is eight categorical colors, the brand color first and then hues apart from each other (cyan, violet, pink, slate, orange, teal, lime): green, amber and red are kept out of the first four places so that series never read as statuses, and treemap tiles take their color from their name. A chart whose series are statuses passes the status colors as `colors`: `statusPalette` is the theme's success, warning and error in that order. `success`, `warning`, `error` and `track` (the empty part of a radial arc) come from the same hook. Without the theme CSS, the charts fall back to the hex values of `COSMOS_PALETTE`. `COSMOS_BRAND` is the default blue; use `useChartTheme().brand` to follow the accent. `brandScale` is a sequential scale of five brand steps, low to high (pale to deep in light themes, dark to bright in dark ones), and `surface` the card background; `HeatmapChart` uses both.

Most charts take `colors`, which overrides the Cosmos palette, and `formatValue`, which formats the values in their labels and tooltips (a unit, a precision). On the charts still drawn with ApexCharts, define `formatValue` outside the component or wrap it in `useCallback`: a new function redraws the chart; `LineAreaChart` and `Sparkline` take any function. The gauges (`GradientRadial`, `SemiCircleGauge`, `StrokedGauge`) also take `min` and `max` (default 0 and 100), a `color` for the arc (the accent by default; on `GradientRadial` the color the arc starts from), and show a percent unless given a `formatValue`. `SemiCircleGauge` also takes `showRange`, which writes `min` and `max` under the ends of its arc, and its `height` (a number of pixels, 120 by default) is the most it takes: the arc is as wide as its box allows, up to that height.

The charts with a horizontal and a vertical axis (`LineAreaChart`, `BarChart`, `MixedChart`, `HeatmapChart`, `BoxPlotChart`, `RangeBarChart`, `RealtimeChart`, `ScatterChart` and `BubbleChart`) take `xTitle`, drawn under the horizontal axis, and `yTitle`, drawn beside the vertical one, as plain text: a horizontal `BarChart` puts its values on the horizontal axis. `MixedChart` also takes `yRightTitle` for its second axis. `RealtimeChart` only has an x axis with `showTimeAxis`.

`Sparkline` takes `label` and `formatValue` for its tooltip, and `min` and `max` to pin its scale: it fits its own data otherwise, so sparklines read against each other (the rows of a table) share the same two. In a KPI tile, pass it to the `chart` slot of `KpiCard` (`@sckyzo/cosmos-react`): `<KpiCard label="Requests/s" value="2.3k" chart={<Sparkline data={data} />} />`. The two packages do not depend on each other, so the chart is yours to pass.

`RealtimeChart` takes `min` and `max` for its y axis (0 and 100 by default), `showTimeAxis` to label the x axis with the time of each sample, and `warnLabel` and `critLabel` to rename the threshold labels.

`TreemapChart` writes the value of each tile under its name when given `showValues`, and draws its group headers in the card's colors.

`RadarChart` draws its polygons as large as its box allows and leaves the scale (0, 20 … 100) off them unless given `showScale`.

The charts that draw a legend take `legendPosition` (`top`, `right`, `bottom` or `left`): the legend sits above the plot by default, below the donut on `DonutChart`.

A chart with no series, or only empty ones, draws `emptyMessage` (default `No data`, an empty string for nothing) in place of the plot. The gauges, which always have a value, and `RealtimeChart`, which fills its own window, have no such prop.

For what a chart has no prop for, `LineAreaChart` and `Sparkline` take `children` (see above). Every other chart takes `apexOptions`, [ApexCharts options](https://apexcharts.com/docs/options/) merged over the ones the chart builds, last: plain objects merge key by key, and an array, a function or any other value replaces the chart's. Your object is copied, never changed. It couples your code to the ApexCharts option format, so prefer a prop when there is one. ApexCharts ships its features (toolbar, annotations, …) as separate modules and each chart loads only the ones it uses: the options of another feature do nothing until you `import 'apexcharts/features/<name>'`. ApexCharts writes legends and tooltips with innerHTML: the charts escape every label and value they give it, but a `formatter` or `tooltip.custom` in `apexOptions` replaces theirs and gets raw values, so it must escape any HTML it writes: `escapeHtml` escapes a value, and `tooltipHtml({ title, series, rows })` builds a Cosmos tooltip with every part escaped. A function in `apexOptions` made during render redraws the chart on every render, like `formatValue`: define it outside the component or wrap it in `useCallback`. An object literal without functions is equal from one render to the next and redraws nothing.

Every chart takes an `ariaLabel`, the name screen readers read for it. Without one, the chart is named from its type and its series. Tab reaches a chart, and the arrow keys move from point to point and announce each one. The gauges and `Sparkline` show a single value or a trend: they are named images, out of the tab order.

## Charts shipped

| Chart                          | Notes                                                         |
| ------------------------------ | ------------------------------------------------------------- |
| `BarChart`                     | Vertical or horizontal bars                                   |
| `RangeBarChart`                | Time ranges per row on a datetime axis (timeline)             |
| `MixedChart`                   | Columns and lines on one chart, optional second y axis        |
| `LineAreaChart`                | Smooth area + gradient fill, legend when 2+ series (Recharts) |
| `RealtimeChart`                | Live updates with WARN/CRIT threshold annotations             |
| `RadialBarChart`               | Multi-series radial gauge                                     |
| `GradientRadial`               | Single gradient radial                                        |
| `SemiCircleGauge`              | Half-donut gauge                                              |
| `StrokedGauge`                 | Dashed-stroke radial                                          |
| `DonutChart`                   | Donut, legend below by default                                |
| `Sparkline`                    | Mini line or area trend, no axes (Recharts)                   |
| `TreemapChart`                 | Repartition treemap                                           |
| `HeatmapChart`                 | Rows × columns colored by value buckets or ranges             |
| `RadarChart`                   | One polygon per series over named axes                        |
| `ScatterChart` / `BubbleChart` | Numeric x/y points; bubble size as a 3rd measure              |
| `BoxPlotChart`                 | Min/quartiles/max boxes, vertical or horizontal               |

## License

MIT — see [LICENSE](../../LICENSE).
