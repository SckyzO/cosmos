# @sckyzo/cosmos-charts

[![npm](https://img.shields.io/npm/v/@sckyzo/cosmos-charts)](https://www.npmjs.com/package/@sckyzo/cosmos-charts)

Cosmos charts — opinionated chart wrappers themed for the Cosmos design system, drawn with [Recharts](https://recharts.github.io/).

Kept in a dedicated subpackage so that `@sckyzo/cosmos-react` consumers who don't render charts don't ship a chart library.

Each chart is a module of its own and the package declares no side effects, so a bundler ships the charts you import and leaves the others out: `import { DonutChart } from '@sckyzo/cosmos-charts'` brings the donut, not the line or bar charts. `recharts` is a dependency of the package, installed with it.

## Install

```bash
pnpm add @sckyzo/cosmos-charts
pnpm add react react-dom   # peers, react 19+
```

## How the charts are drawn

Every chart is drawn with Recharts, except `HeatmapChart` and `FunnelChart`, drawn in HTML and SVG (Recharts has no heatmap, and its bars cannot be joined by a flow). The rules every chart follows:

- **Colors are CSS variables** handed straight to the SVG, with a hex fallback: a theme, accent or text size switch on `<html>` repaints the chart with no observer and no redraw. `@sckyzo/cosmos-theme` always emits what the charts read (`--color-brand-500`, the status and semantic colors, `--color-chart-2` to `--color-chart-8`).
- **The default palette** is the accent, then seven hues. Each accent lists its own seven in the theme CSS, skipping the hues that look like it (the teal accent has no teal series), and none of the first four reads as a status. `colors` overrides it.
- **Text** is 12px at the normal text size and follows the text size setting; the font is inherited, and the axes make room for their labels again once a web font has loaded.
- **The tooltip and the legend are React**: a series name, a category or a title with markup shows as written. The legend keeps the series order, and an item is a button that hides and shows its series (Enter and Space work).
- **`children`** takes Recharts elements drawn inside the chart, after the ones it builds, for what a chart has no prop for.

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
import { LineAreaChart } from '@sckyzo/cosmos-charts';

<LineAreaChart
  series={[{ name: 'CPU', data: [12, 19, 23, 31, 22, 18, 25] }]}
  categories={['00h', '04h', '08h', '12h', '16h', '20h', '24h']}
/>;
```

The default palette is eight categorical colors, the accent first and then hues apart from each other (cyan, violet, pink, slate, orange, teal, lime): green, amber and red are kept out of the first four places so that series never read as statuses, and treemap tiles take their color from their name. A chart whose series are statuses passes the status colors as `colors`: `['var(--color-success-500)', 'var(--color-warning-500)', 'var(--color-error-500)']`, or `--color-status-warn` and `--color-status-crit` for the monitoring statuses. Without the theme CSS, the charts fall back to the hex values of `COSMOS_PALETTE`; `COSMOS_BRAND` is the default blue, and `readableOn(color)` picks the white or black text that reads on a `#rrggbb` color.

Most charts take `colors`, which overrides the Cosmos palette, and `formatValue`, which formats the values in their labels and tooltips (a unit, a precision). `formatValue` can be any function: a new one on every render redraws nothing. The gauges (`GradientRadial`, `SemiCircleGauge`, `StrokedGauge`) also take `min` and `max` (default 0 and 100), a `color` for the arc (the accent by default; on `GradientRadial` the color the arc starts from), and show a percent unless given a `formatValue`. A gauge is an image named by its label and value (`ariaLabel` replaces the label in the name). `SemiCircleGauge` keeps the accent unless given `warnAt` or `critAt`, in the units of the value, which color its arc by status: the theme's success color below `warnAt`, its warning color from `warnAt` and its critical color from `critAt` (`color` replaces either). It also takes `showRange`, which writes `min` and `max` under the ends of its arc, and its `height` (a number of pixels, 120 by default) is the most it takes: the arc is as wide as its box allows, up to that height.

The charts with a horizontal and a vertical axis (`LineAreaChart`, `BarChart`, `MixedChart`, `HeatmapChart`, `BoxPlotChart`, `RangeBarChart`, `RealtimeChart`, `ScatterChart` and `BubbleChart`) take `xTitle`, drawn under the horizontal axis, and `yTitle`, drawn beside the vertical one, as plain text: a horizontal `BarChart` puts its values on the horizontal axis. `MixedChart` also takes `yRightTitle` for its second axis. `RealtimeChart` only has an x axis with `showTimeAxis`.

`LineAreaChart`, `BarChart` and `MixedChart` (on its left axis, or its right one when no series is on the left) and `ScatterChart` and `BubbleChart` take `referenceLines` and `referenceBands`: `{ value, label?, intent?, dashed? }` draws a line across the plot at a value of the value axis (the vertical one, the horizontal one on horizontal bars), `{ from, to, label?, intent? }` shades the plot between two values, behind the series. `intent` (`neutral`, the default, `warning`, `danger` or `success`) picks the color from the theme, so a theme switch repaints it; a label is plain text that follows the text size. A mark outside the data makes the axis reach it. For a diagonal line, a vertical one or anything else, `children` takes a Recharts `ReferenceLine`.

`Sparkline` takes `label` and `formatValue` for its tooltip, and `min` and `max` to pin its scale: it fits its own data otherwise, so sparklines read against each other (the rows of a table) share the same two. In a KPI tile, pass it to the `chart` slot of `KpiCard` (`@sckyzo/cosmos-react`): `<KpiCard label="Requests/s" value="2.3k" chart={<Sparkline data={data} />} />`. The two packages do not depend on each other, so the chart is yours to pass.

`RealtimeChart` takes `min` and `max` for its y axis (0 and 100 by default), `showTimeAxis` to label the x axis with the time of each sample, and `warnLabel` and `critLabel` to rename the threshold labels.

`TreemapChart` writes the value of each tile under its name when given `showValues`, and draws its group headers in the card's colors. Its tiles take the text color that reads on them (white or black). `children` are drawn over the tiles, in the chart's own SVG space.

`HeatmapChart` is a grid of rounded cells, not a Recharts chart, so it takes no `children`. Its default scale is five steps of the accent mixed over the card, each told apart from the next and the lowest still a cell of its own on a dark card; `colors` replaces the steps and `ranges` sets thresholds with their own colors (a value on a bound shared by two ranges takes the later one). The grid is one tab stop: the arrow keys move between cells and show the tooltip of the cell they land on, Home and End go to the ends of the row, Ctrl+Home and Ctrl+End to the ends of the grid. Each cell is named `row, column: value` for screen readers.

`CalendarChart` is a day-by-day heatmap built on the same grid, so it takes no `children` either. `data` is `{ day: 'YYYY-MM-DD', value }[]` (a day listed twice adds up, a day with no entry is empty), `from` and `to` bound the days shown. The `calendar` layout draws one block per year, with the months named above their first full week and Mon / Wed / Fri beside the rows; `range` draws one continuous grid, with larger cells when it is short. Weeks start on Monday, or on Sunday with `weekStart={0}`; `locale` names the months, weekdays and dates. Days are read and drawn in UTC. The scale is the neutral track for a day with nothing, then four steps of the accent (the dark themes use lower shares and a light accent for the top one) splitting `(0, max]` evenly, with a "Less … More" key under the grid, right-aligned with it (`lessLabel` and `moreLabel` replace the words). A grid wider than its box scrolls inside it, the weekday names staying in view. The title and the total are the host's. Keyboard as `HeatmapChart`, one tab stop per year block.

`BumpChart` draws how a ranking changes over periods: `series` is `{ name, data: { x, rank }[] }[]`, 1 is the top, and the periods are every `x` once in the order they first appear. A series that enters late has no point before it enters, and ties are allowed (tied series are drawn apart around their rank). Each name is written at both ends of its line with its color, so there is no legend; on a narrow chart (under 560px) only the right-hand names stay, cut short, and where the periods get too close for the discs the points become dots. `points` is `rank` (default, a disc with the rank in it) or `dot`. A pointer over a line, a point or a name, or the arrows Up and Down on the keyboard (Escape lets go), gives that series a thicker line and fades the others. The tooltip, which Left and Right walk period by period, gives the period, the rank and the change from the previous period in words (`unchanged vs May`, `up 2 vs Apr`, `down 1 vs Mar`, `new entry`), never by color alone. `formatValue` formats the rank in the tooltip, and `children` takes Recharts elements, where a `y` is a rank.

`FunnelChart` draws one centred bar per stage, as wide as its value against the largest stage (the first, unless a stage grows), joined to the next by a translucent flow. The stages keep the order given and are never sorted: a stage larger than the one before it is allowed, and shows a rate over 100%. The names sit on the left; on the right, the value, a chip with the rate from the previous stage (`65.4%`, `100%` for the first) and, beside it, the rate from the first (`20.5% of Visits`); `showConversion={false}` leaves the values alone. The accent fades from the first stage to the last, and `colors` gives one color per stage instead. `formatValue` formats the values, percentages always have one decimal. In a box under 520px wide each name and value go on one line above their bar, and the rate from the first stage stays in the tooltip. Like `HeatmapChart` it is HTML and SVG, not a Recharts chart, so it takes no `children`: the flow joins two bars at their own edges, which a Recharts bar can't be drawn to do. It is one tab stop: the arrow keys, Home and End walk the stages and show the tooltip of the one they land on. Stages that are all at 0 draw `emptyMessage`.

`RadarChart` draws its polygons as large as its box allows and leaves the scale (0, 20 … 100) off them unless given `showScale`. `DonutChart` writes the total in the middle, and the value and name of the slice under the pointer in its place; `RadialBarChart` does the same with the average and the ring.

The charts that draw a legend take `legendPosition` (`top`, `right`, `bottom` or `left`): the legend sits above the plot by default, below the donut on `DonutChart`.

A chart with no series, or only empty ones, draws `emptyMessage` (default `No data`, an empty string for nothing) in place of the plot. The gauges, which always have a value, and `RealtimeChart`, which fills its own window, have no such prop.

For what a chart has no prop for, every chart but `HeatmapChart` and `FunnelChart` takes `children` (see above).

Every chart takes an `ariaLabel`, the name screen readers read for it. Without one, the chart is named from its type and its series. Tab reaches a chart, and the arrow keys move from point to point and announce each one: ArrowRight goes to the next point, ArrowLeft to the previous one, and on a chart with its categories on the vertical axis (a horizontal `BarChart` or `BoxPlotChart`, `RangeBarChart`) ArrowDown and ArrowRight go to the next category and ArrowUp and ArrowLeft to the previous one. The gauges and `Sparkline` show a single value or a trend: they are named images, out of the tab order.

## Charts shipped

| Chart                          | Notes                                                         |
| ------------------------------ | ------------------------------------------------------------- |
| `BarChart`                     | Vertical or horizontal bars, grouped or stacked               |
| `RangeBarChart`                | Time ranges per row on a time axis (timeline)                 |
| `MixedChart`                   | Columns and lines, optional second y axis                     |
| `LineAreaChart`                | Smooth area + gradient fill, legend when 2+ series            |
| `RealtimeChart`                | Live updates with WARN/CRIT threshold lines                   |
| `RadialBarChart`               | Multi-series radial gauge                                     |
| `GradientRadial`               | Single gradient radial                                        |
| `SemiCircleGauge`              | Half-donut gauge                                              |
| `StrokedGauge`                 | Dashed-stroke radial                                          |
| `DonutChart`                   | Donut, legend below by default                                |
| `Sparkline`                    | Mini line or area trend, no axes                              |
| `TreemapChart`                 | Repartition treemap                                           |
| `HeatmapChart`                 | Rows × columns colored by value buckets or ranges (HTML grid) |
| `CalendarChart`                | Day-by-day heatmap over a year or any range (HTML grid)       |
| `BumpChart`                    | Rankings over periods, names at both ends (Recharts)          |
| `RadarChart`                   | One polygon per series over named axes                        |
| `ScatterChart` / `BubbleChart` | Numeric x/y points; bubble size as a 3rd measure              |
| `BoxPlotChart`                 | Min/quartiles/max boxes, vertical or horizontal               |
| `FunnelChart`                  | Centred bars joined by a flow, with the conversion per stage  |

## License

MIT — see [LICENSE](../../LICENSE).

The charts are drawn with [Recharts](https://github.com/recharts/recharts) (MIT), which pulls in modules of [d3](https://d3js.org/) (ISC, and BSD-3-Clause for `d3-ease`). Their licenses apply to the code they ship.
