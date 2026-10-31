# Charts

`@sckyzo/cosmos-charts` holds the chart wrappers of Cosmos: opinionated charts themed for the
design system and drawn with [Recharts](https://recharts.github.io/). It is a package of its own,
so that `@sckyzo/cosmos-react` consumers who don't render charts don't ship a chart library.
Every chart has a page in the Storybook, in the
[Charts](https://sckyzo.github.io/cosmos/?path=/docs/charts-line-area--docs) group.

Each chart is a module of its own and the package declares no side effects, so a bundler ships the
charts you import and leaves the others out: `import { DonutChart } from '@sckyzo/cosmos-charts'`
brings the donut, not the line or bar charts. `recharts` is a dependency of the package, installed
with it. So are `d3-geo` and `topojson-client`, which only `WorldMap` loads: a bundler leaves them
out unless you import it.

## Install

```bash
npm install @sckyzo/cosmos-charts
```

The charts also need the styles of the other packages: follow
[Getting started](../getting-started.md) first. Then point Tailwind at this package too, in the
CSS file that imports it, next to the `@source` line for `@sckyzo/cosmos-react`. A few charts
carry Tailwind 4 classes (the legend's focus ring, the calendar's shades in a dark theme), and
without this line they are not generated.

```css
@source '../node_modules/@sckyzo/cosmos-charts/dist/**/*.{js,cjs}';
```

The three Cosmos packages share one version number: install the same version of
`@sckyzo/cosmos-charts` as of `@sckyzo/cosmos-react` and `@sckyzo/cosmos-theme`. The package asks
for React 19 as a peer dependency.

## How the charts are drawn

Every chart is drawn with Recharts, except `HeatmapChart`, `CalendarChart` and `FunnelChart`, drawn in HTML and SVG (Recharts has no heatmap, and its bars cannot be joined by a flow), and `WorldMap`, an SVG of its own (Recharts has no map). The rules every chart follows:

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

`children` reads the chart's data and axes, so a `y` is in the units of the series. Add `recharts` to your app at the version this package depends on (its `package.json`; `3.10.1` in 0.4.0): two copies of Recharts do not share a chart's context, and the elements would not find it. Pass CSS variables for colors (`var(--color-status-warn)`) and they follow the theme.

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

Most charts take `colors`, which overrides the Cosmos palette, and `formatValue`, which formats the values in their labels and tooltips (a unit, a precision). `formatValue` can be any function: a new one on every render redraws nothing. The gauges (`GradientRadial`, `SemiCircleGauge`, `StrokedGauge`) also take `min` and `max` (default 0 and 100), a `color` for the arc (the accent by default; on `GradientRadial` the color the arc starts from), and show a percent unless given a `formatValue`. A gauge is an image named by its label and value (`ariaLabel` replaces the label in the name). `SemiCircleGauge` keeps the accent unless given `warnAt` or `critAt`, in the units of the value, which color its arc by status: the theme's success color below `warnAt`, its warning color from `warnAt` and its critical color from `critAt` (`color` replaces either). It also takes `showRange`, which writes `min` and `max` under the ends of its arc, and its `height` (a number of pixels, 120 by default) is the most it takes: the arc is as wide as its box allows, up to that height. It draws a mark across its arc at `target` (a value on the scale of `min` and `max`, stopped at an end when out of range), and the target joins its name after the value (`Load: 67%, target 80%`).

The charts with a horizontal and a vertical axis (`LineAreaChart`, `BarChart`, `MixedChart`, `HeatmapChart`, `BoxPlotChart`, `RangeBarChart`, `RealtimeChart`, `ScatterChart`, `BubbleChart` and `WaterfallChart`) take `xTitle`, drawn under the horizontal axis, and `yTitle`, drawn beside the vertical one, as plain text: a horizontal `BarChart` puts its values on the horizontal axis. `MixedChart` also takes `yRightTitle` for its second axis. Its series are `column`, `line` or `area` (a filled line, behind the columns), and `stackedColumns` piles the columns on each other, apart on each axis. `RealtimeChart` only has an x axis with `showTimeAxis`.

`LineAreaChart`, `BarChart`, `MixedChart`, `ScatterChart`, `BubbleChart`, `BoxPlotChart` and `RangeBarChart` take `referenceLines` and `referenceBands`: `{ value, label?, intent?, dashed? }` draws a line across the plot at a value of the value axis, `{ from, to, label?, intent? }` shades the plot between two values, behind the series. The value axis is the vertical one, the horizontal one on horizontal bars and boxes, and the time axis of `RangeBarChart` (the values are timestamps in milliseconds); `MixedChart` reads its left axis, or its right one when no series is on the left. `intent` (`neutral`, the default, `warning`, `danger` or `success`) picks the color from the theme, so a theme switch repaints it; a label is plain text that follows the text size. A mark outside the data makes the axis reach it. For a diagonal line, a vertical one or anything else, `children` takes a Recharts `ReferenceLine`.

`LineAreaChart` draws an area under each line; `variant="line"` draws the lines alone, `stacked` piles the series on each other, `markers` puts a dot on every point, and a series can take `style: 'dashed'` or `'step'` (a line that jumps from one value to the next) in place of the smooth curve.

`BarChart` colors each bar from its value with `colorByValue(value, index)` (a threshold, a ranking; `undefined` keeps the series color), gives each category a color of the palette with `distributed`, and draws the bars below zero in `negativeColor`; that is the order of precedence, and the tooltip chip of a bar follows the bar.

`Sparkline` draws an `area` (default), a `line` or `bar` columns; the bar scale starts at zero (the lower of 0 and the lowest value, unless `min` is set) and the values below zero hang under a dashed zero line in the danger color. It takes `label` and `formatValue` for its tooltip, and `min` and `max` to pin its scale: it fits its own data otherwise, so sparklines read against each other (the rows of a table) share the same two. In a KPI tile, pass it to the `chart` slot of `KpiCard` (`@sckyzo/cosmos-react`): `<KpiCard label="Requests/s" value="2.3k" chart={<Sparkline data={data} />} />`. The two packages do not depend on each other, so the chart is yours to pass.

`RealtimeChart` takes `min` and `max` for its y axis (0 and 100 by default), `showTimeAxis` to label the x axis with the time of each sample, and `warnLabel` and `critLabel` to rename the threshold labels.

`TreemapChart` writes the value of each tile under its name when given `showValues`, and draws its group headers in the card's colors. Its tiles take the text color that reads on them (white or black). `children` are drawn over the tiles, in the chart's own SVG space.

`HeatmapChart` is a grid of rounded cells, not a Recharts chart, so it takes no `children`. Its default scale is five steps of the accent mixed over the card, each told apart from the next and the lowest still a cell of its own on a dark card; `colors` replaces the steps and `ranges` sets thresholds with their own colors (a value on a bound shared by two ranges takes the later one). The grid is one tab stop: the arrow keys move between cells and show the tooltip of the cell they land on, Home and End go to the ends of the row, Ctrl+Home and Ctrl+End to the ends of the grid. Each cell is named `row, column: value` for screen readers.

`CalendarChart` is a day-by-day heatmap built on the same grid, so it takes no `children` either. `data` is `{ day: 'YYYY-MM-DD', value }[]` (a day listed twice adds up, a day with no entry is empty), `from` and `to` bound the days shown. The `calendar` layout draws one block per year, with the months named above their first full week and Mon / Wed / Fri beside the rows; `range` draws one continuous grid, with larger cells when it is short. Weeks start on Monday, or on Sunday with `weekStart={0}`; `locale` names the months, weekdays and dates. Days are read and drawn in UTC. The scale is the neutral track for a day with nothing, then four steps of the accent (the dark themes use lower shares and a light accent for the top one) splitting `(0, max]` evenly, with a "Less … More" key under the grid, right-aligned with it (`lessLabel` and `moreLabel` replace the words). A grid wider than its box scrolls inside it, the weekday names staying in view. The title and the total are the host's. Keyboard as `HeatmapChart`, one tab stop per year block.

`BumpChart` draws how a ranking changes over periods: `series` is `{ name, data: { x, rank }[] }[]`, 1 is the top, and the periods are every `x` once in the order they first appear. A series that enters late has no point before it enters, and ties are allowed (tied series are drawn apart around their rank). Each name is written at both ends of its line with its color, so there is no legend; on a narrow chart (under 560px) only the right-hand names stay, cut short, and where the periods get too close for the discs the points become dots. `points` is `rank` (default, a disc with the rank in it) or `dot`. A pointer over a line, a point or a name, or the arrows Up and Down on the keyboard (Escape lets go), gives that series a thicker line and fades the others. The tooltip, which Left and Right walk period by period, gives the period, the rank and the change from the previous period in words (`unchanged vs May`, `up 2 vs Apr`, `down 1 vs Mar`, `new entry`), never by color alone. `formatValue` formats the rank in the tooltip, and `children` takes Recharts elements, where a `y` is a rank.

`FunnelChart` draws one centred bar per stage, as wide as its value against the largest stage (the first, unless a stage grows), joined to the next by a translucent flow. The stages keep the order given and are never sorted: a stage larger than the one before it is allowed, and shows a rate over 100%. The names sit on the left; on the right, the value, a chip with the rate from the previous stage (`65.4%`, `100%` for the first) and, beside it, the rate from the first (`20.5% of Visits`); `showConversion={false}` leaves the values alone. The accent fades from the first stage to the last, and `colors` gives one color per stage instead. `formatValue` formats the values, percentages always have one decimal. In a box under 520px wide each name and value go on one line above their bar, and the rate from the first stage stays in the tooltip. Like `HeatmapChart` it is HTML and SVG, not a Recharts chart, so it takes no `children`: the flow joins two bars at their own edges, which a Recharts bar can't be drawn to do. It is one tab stop: the arrow keys, Home and End walk the stages and show the tooltip of the one they land on. Stages that are all at 0 draw `emptyMessage`.

`WaterfallChart` walks a running total through gains and losses: `data` is `{ label, value?, kind? }[]`. A step (the default `kind`) carries a signed `value` and floats between the total before and after it; a `subtotal` is drawn from 0 to the running total at that point (never the sum since the last cut); a `total` is drawn the same way, and a `value` on it sets the running total to it, which is how an opening balance, or a known balance mid-walk, is written. A step without a `value` counts as 0. Increases take the theme's success color, decreases its error color and totals the accent (subtotals the same, lighter); `colors: { positive, negative, total }` overrides them. The color is never alone: the value above a bar and the tooltip carry the sign (`+310k`, `−265k`, with a real minus; `formatValue` gets the magnitude) and the kind in words (Increase, Decrease, Subtotal, Total), and the tooltip of a step adds the running total after it. `showLabels` forces the values above the bars on or off (by default they show with 12 bars or fewer in a chart at least 480px wide), `showConnectors` (default on) draws the dashed line from the top of a bar to the next one. Below 480px the category names tilt. It takes `xTitle`, `yTitle` and `children`.

`WorldMap` colors the countries of a world map by value: `data` is `{ FR: 16400, US: 48200 }`, keyed by ISO 3166-1 alpha-2 code in upper case, and `geography` is a TopoJSON `Topology` with a `countries` object. The package ships no map data: you pass `world-atlas` (ISC), and the `110m` file is enough for a dashboard card (105 kB, 39 kB gzipped; `countries-50m.json` draws the small countries too). Antarctica is left out, and a code the map does not hold is not drawn.

```tsx
import { WorldMap } from '@sckyzo/cosmos-charts';
import type { Topology } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';

// An imported JSON file is typed as plain strings: the cast says it is a Topology.
<WorldMap
  data={{ FR: 16400, US: 48200, DE: 21300 }}
  geography={world as unknown as Topology}
  label="visitors"
  formatValue={(value) => `${(value / 1000).toFixed(1)}k`}
/>;
```

The scale has five steps of the accent, cut by quantiles of the values so that each holds about as many countries (a linear scale lets one large country wash the others out); a country without a value is gray. `min` and `max` clamp every value before the steps are cut, so a value over `max` counts as `max`: they pin the ends of the scale, and the legend starts at `min`. The legend gives the lower bound of each step (`2.7k+`, through `formatValue`) and a "No data" swatch; `showLegend={false}` hides it. It is its own SVG, so it takes no `children`, and a map with no value (an empty `data`, or no code the map holds) draws the bare map, with no legend and no `emptyMessage`. The map scales with the width it is given and keeps its proportions (about 2:1) unless `height` is set. It is one tab stop: the arrow keys walk the countries that have a value, largest first (Home and End go to the largest and the smallest), the one in focus is outlined and shows its card, and `onSelect(code)` is called by a click, or by Enter or Space on the country in focus. For screen readers the map is an image named by `ariaLabel`, and a visually hidden table (country, value, largest first) lists the data. `geography` needs `@types/topojson-specification` for its type, installed with the package.

`RadarChart` draws its polygons as large as its box allows and leaves the scale (0, 20 … 100) off them unless given `showScale`. `DonutChart` writes the total in the middle, and the value and name of the slice under the pointer in its place (`centerValue` and `centerLabel` replace the sum and "Total"; `variant="pie"` fills the disc and writes nothing in it; `legendValues` adds each slice's value and its share, in whole percents that add up to 100, to the legend, in columns when the legend is on a side); `RadialBarChart` does the same with the average and the ring.

The charts that draw a legend take `legendPosition` (`top`, `right`, `bottom` or `left`): the legend sits above the plot by default, below the donut on `DonutChart`. `left` and `right` are the sides of the screen, not of the line: a chart keeps its left-to-right axis in a right-to-left page, and its legend stays where you put it.

A chart with no series, or only empty ones, draws `emptyMessage` (default `No data`, an empty string for nothing) in place of the plot. The gauges, which always have a value, and `RealtimeChart`, which fills its own window, have no such prop.

For what a chart has no prop for, every chart but `HeatmapChart`, `CalendarChart`, `FunnelChart` and `WorldMap` takes `children` (see above).

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
| `Sparkline`                    | Mini line, area or bar trend, no axes                         |
| `TreemapChart`                 | Repartition treemap                                           |
| `HeatmapChart`                 | Rows × columns colored by value buckets or ranges (HTML grid) |
| `CalendarChart`                | Day-by-day heatmap over a year or any range (HTML grid)       |
| `BumpChart`                    | Rankings over periods, names at both ends (Recharts)          |
| `RadarChart`                   | One polygon per series over named axes                        |
| `ScatterChart` / `BubbleChart` | Numeric x/y points; bubble size as a 3rd measure              |
| `BoxPlotChart`                 | Min/quartiles/max boxes, vertical or horizontal               |
| `FunnelChart`                  | Centred bars joined by a flow, with the conversion per stage  |
| `WaterfallChart`               | Running total through gains, losses, subtotals and totals     |
| `WorldMap`                     | Countries colored by value in five quantile steps (own SVG)   |
