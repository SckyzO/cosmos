// The English the charts write themselves, and the shape an app translates: `CommonChartLabels` for
// what every wrapper's frame writes, one `<Wrapper>Labels` for what a wrapper writes on its own,
// `ChartLabels` for all of them (`ChartLabelsProvider`). A text that holds a value is a function of
// it, so the word order and the plurals stay with the app. `englishChartLabels` holds every default.
//
// Not a copy of `@sckyzo/cosmos-react`'s labels: this package imports neither it nor the theme, so
// it has the same mechanism on its own.

/** The texts every wrapper's frame writes. */
export type CommonChartLabels = {
  /** What a chart with nothing to draw says in place of its plot. Default `No data`; an empty string draws nothing. */
  empty: string;
  /** The name of the skeleton a chart draws while `loading`, from the chart's name. Default `${name}, loading`. */
  loading: (name: string) => string;
  /** The name of a gauge that has no `label` nor `ariaLabel`. Default `Gauge`. */
  gauge: string;
  /** What a gauge is called, from its name and its formatted value. Default `${name}: ${value}`. */
  gaugeName: (name: string, value: string) => string;
  /**
   * What a screen reader reads for a cell of a heatmap or a calendar, from its row (an empty
   * string for none), its column or day, and its formatted value. Default `${row}, ${title}: ${value}`.
   */
  cellName: (row: string, title: string, value: string) => string;
};

/** `BarChart`. `series` in the names is the series names, joined with `, `. */
export type BarChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Bar chart: ${series}`. */
  name: (series: string) => string;
};

/** `BoxPlotChart`. */
export type BoxPlotChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Box plot: ${series}`. */
  name: (series: string) => string;
  /** The top whisker's row in the tooltip. Default `Max`. */
  max: string;
  /** The top of the box's row in the tooltip. Default `Q3`. */
  q3: string;
  /** The line in the box's row in the tooltip. Default `Median`. */
  median: string;
  /** The bottom of the box's row in the tooltip. Default `Q1`. */
  q1: string;
  /** The bottom whisker's row in the tooltip. Default `Min`. */
  min: string;
};

/** `BumpChart`. */
export type BumpChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Bump chart: ${series}`. */
  name: (series: string) => string;
  /** The tooltip's value for a series with no rank in that period. Default `not ranked`. */
  notRanked: string;
  /** A rank that did not move, in the tooltip, from the period it is compared with. Default `unchanged vs ${versus}`. */
  unchanged: (versus: string) => string;
  /** A series that has a rank for the first time, in the tooltip. Default `new entry`. */
  newEntry: string;
  /** A rank that went up by `by` places, in the tooltip. Default `up ${by} vs ${versus}`. */
  up: (by: number, versus: string) => string;
  /** A rank that went down by `by` places, in the tooltip. Default `down ${by} vs ${versus}`. */
  down: (by: number, versus: string) => string;
};

/** `CalendarChart`. */
export type CalendarChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Calendar chart`. */
  name: string;
  /** The name of the block of one year, when there are several, from the chart's name. Default `${name}, ${year}`. */
  yearName: (name: string, year: number) => string;
  /** The low end of the scale under the grid. Default `Less`. */
  less: string;
  /** The high end of the scale under the grid. Default `More`. */
  more: string;
};

/** `DonutChart`, as a donut and as a pie. `slices` in the names is the slice names, joined with `, `. */
export type DonutChartLabels = {
  /** The donut's name when `ariaLabel` is not set. Default `Donut chart: ${slices}`. */
  name: (slices: string) => string;
  /** The pie's name when `ariaLabel` is not set. Default `Pie chart: ${slices}`. */
  pieName: (slices: string) => string;
  /** The small text under the center value, when `centerLabel` is not set. Default `Total`. */
  total: string;
};

/** `FunnelChart`. `stages` in the name is the stage names, joined with `, `. */
export type FunnelChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Funnel: ${stages}`. */
  name: (stages: string) => string;
  /** The value's row in the tooltip. Default `Value`. */
  value: string;
  /** The rate from the previous stage, in the tooltip. Default `Of previous stage`. */
  ofPrevious: string;
  /** The rate from the first stage, in the tooltip, from that stage's name. Default `Of ${first}`. */
  ofFirst: (first: string) => string;
  /** The rate from the first stage next to a stage, and in its name. Default `${rate} of ${first}`. */
  rateOfFirst: (rate: string, first: string) => string;
  /** The rate from the previous stage, in the name of a stage. Default `${rate} of previous stage`. */
  rateOfPrevious: (rate: string) => string;
  /** The start of a stage's name, from its label and its formatted value. Default `${label}: ${value}`. */
  stage: (label: string, value: string) => string;
};

/** `GradientRadial`. */
export type GradientRadialLabels = {
  /** The text under the value, when `label` is not set. Default `Score`. */
  label: string;
};

/** `HeatmapChart`. `series` in the name is the series names, joined with `, `. */
export type HeatmapChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Heatmap: ${series}`. */
  name: (series: string) => string;
};

/** `LineAreaChart`. `series` in the name is the series names, joined with `, `. */
export type LineAreaChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Area chart: ${series}`. */
  name: (series: string) => string;
};

/** `MixedChart`. `series` in the name is the series names, joined with `, `. */
export type MixedChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Mixed chart: ${series}`. */
  name: (series: string) => string;
};

/** `RadarChart`. `series` in the name is the series names, joined with `, `. */
export type RadarChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Radar chart: ${series}`. */
  name: (series: string) => string;
};

/** `RadialBarChart`. `rings` in the name is the ring names, joined with `, `. */
export type RadialBarChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Radial bar chart: ${rings}`. */
  name: (rings: string) => string;
  /** The small text under the center value, the average of the rings. Default `Avg`. */
  average: string;
};

/** `RangeBarChart`. `series` in the name is the series names, joined with `, `. */
export type RangeBarChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Range chart: ${series}`. */
  name: (series: string) => string;
  /** The name of the one series that draws every row, with `groupRows`. Default `Ranges`. */
  ranges: string;
};

/** `RealtimeChart`. */
export type RealtimeChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Live values, newest on the right`. */
  name: string;
  /** The label of the warning threshold; an empty string draws the line alone. Default `WARN`. */
  warn: string;
  /** The label of the critical threshold; an empty string draws the line alone. Default `CRIT`. */
  crit: string;
  /** The value's row in the tooltip. Default `value`. */
  value: string;
};

/** `ScatterChart`. `series` in the name is the series names, joined with `, `. */
export type ScatterChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Scatter chart: ${series}`. */
  name: (series: string) => string;
  /** The x value's name in the tooltip, when `xTitle` is not set. Default `x`. */
  x: string;
  /** The y value's name in the tooltip, when `yTitle` is not set. Default `y`. */
  y: string;
};

/** `BubbleChart`. `series` in the name is the series names, joined with `, `. */
export type BubbleChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Bubble chart: ${series}`. */
  name: (series: string) => string;
  /** The x value's name in the tooltip, when `xTitle` is not set. Default `x`. */
  x: string;
  /** The y value's name in the tooltip, when `yTitle` is not set. Default `y`. */
  y: string;
  /** The bubble size's name in the tooltip. Default `Size`. */
  size: string;
};

/** `SemiCircleGauge`: what its name adds after the value. */
export type SemiCircleGaugeLabels = {
  /** The goal drawn with `target`, from its formatted value. Default `target ${value}`. */
  target: (value: string) => string;
  /** The threshold of the warning zone. Default `warning from ${value}`. */
  warnFrom: (value: string) => string;
  /** The threshold of the critical zone. Default `critical from ${value}`. */
  critFrom: (value: string) => string;
};

/** `Sparkline`. */
export type SparklineLabels = {
  /** The chart's name when `ariaLabel` is not set, from the name of the value. Default `Trend of ${label}`. */
  name: (label: string) => string;
  /** The name of the value in the tooltip, when `label` is not set. Default `value`. */
  label: string;
};

/** `SunburstChart`. `branches` in the name is the names of the first ring, joined with `, `. */
export type SunburstChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Sunburst chart: ${branches}`. */
  name: (branches: string) => string;
  /** The small text under the center value, when `centerLabel` is not set. Default `Total`. */
  total: string;
  /** A sector's share of the whole, under the center value. Default `${share} of total`. */
  ofTotal: (share: string) => string;
  /** A sector's share of its parent, in its name. Default `${share} of ${parent}`. */
  ofParent: (share: string, parent: string) => string;
  /** The share's row in the tooltip. Default `Share of total`. */
  shareOfTotal: string;
  /** What names a sector: its path, its formatted value and its share (`ofTotal` or `ofParent`). Default `${path}: ${value}, ${share}`. */
  arcName: (path: string, value: string, share: string) => string;
  /** A sector in the hidden outline of the whole hierarchy. Default `${name}: ${value}`. */
  outlineItem: (name: string, value: string) => string;
};

/** `TreemapChart`. `tiles` in the name is the tile names, joined with `, `. */
export type TreemapChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Treemap: ${tiles}`. */
  name: (tiles: string) => string;
  /** The name of a group when its series has no `name`, from its number (from 1). Default `Series ${n}`. */
  series: (n: number) => string;
  /** What names a tile: its name, its formatted value and its group, when there are several. Default `${group}, ${name}: ${value}`. */
  tile: (name: string, value: string, group: string | undefined) => string;
};

/** `WaterfallChart`. `bars` in the name is the bar names, joined with `, `. */
export type WaterfallChartLabels = {
  /** The chart's name when `ariaLabel` is not set. Default `Waterfall chart: ${bars}`. */
  name: (bars: string) => string;
  /** A step up, in the tooltip. Default `Increase`. */
  increase: string;
  /** A step down, in the tooltip. Default `Decrease`. */
  decrease: string;
  /** A subtotal, in the tooltip. Default `Subtotal`. */
  subtotal: string;
  /** A total, in the tooltip. Default `Total`. */
  total: string;
  /** The running total after a step, in the tooltip. Default `Running total`. */
  runningTotal: string;
  /** The name of the series that draws the bars. Default `Waterfall`. */
  series: string;
};

/** `WorldMap`. */
export type WorldMapLabels = {
  /** The map's name when `ariaLabel` is not set, before what the data adds to it. Default `World map`. */
  name: string;
  /** The name of the value in the map's name, when `label` is not set. Default `value`. */
  measure: string;
  /**
   * What the data adds to the name: the name of the value (the map's `label`, else `measure`),
   * the largest and the smallest value. Default `${label} by country, from ${from} to ${to}`.
   */
  byCountry: (label: string, from: string, to: string) => string;
  /** What the markers add to the name, from their number. Default `${count} marker(s)`. */
  markerCount: (count: number) => string;
  /** What the routes add to the name, from their number. Default `${count} route(s)`. */
  routeCount: (count: number) => string;
  /** The name of the value, when `label` is not set: the tooltip row and the table column. Default `Value`. */
  value: string;
  /** The header of the country column of the hidden table. Default `Country`. */
  countryColumn: string;
  /** The caption of the hidden table of the markers. Default `Markers`. */
  markersCaption: string;
  /** The header of the name column of the hidden table of the markers. Default `Marker`. */
  markerColumn: string;
  /** The caption of the hidden table of the routes. Default `Routes`. */
  routesCaption: string;
  /** The header of the name column of the hidden table of the routes. Default `Route`. */
  routeColumn: string;
  /** What names a route with no `label`, from the names of its two ends. Default `${from} to ${to}`. */
  routeName: (from: string, to: string) => string;
  /** What a screen reader hears for a country, a marker or a route: its name, the value's name and the value. Default `${title}, ${label}: ${value}`. */
  announce: (title: string, label: string, value: string) => string;
  /** The widths the routes span, in the legend. Default `${from} to ${to}`. */
  widthRange: (from: string, to: string) => string;
  /** The legend's swatch for the countries with no value. Default `No data`. */
  noData: string;
};

/**
 * Every text the charts write themselves: `chart` for what every wrapper's frame writes, then one
 * key per wrapper that writes more, so an app translates them once with `ChartLabelsProvider`.
 * `englishChartLabels` holds the defaults.
 */
export type ChartLabels = {
  chart: CommonChartLabels;
  barChart: BarChartLabels;
  boxPlotChart: BoxPlotChartLabels;
  bubbleChart: BubbleChartLabels;
  bumpChart: BumpChartLabels;
  calendarChart: CalendarChartLabels;
  donutChart: DonutChartLabels;
  funnelChart: FunnelChartLabels;
  gradientRadial: GradientRadialLabels;
  heatmapChart: HeatmapChartLabels;
  lineAreaChart: LineAreaChartLabels;
  mixedChart: MixedChartLabels;
  radarChart: RadarChartLabels;
  radialBarChart: RadialBarChartLabels;
  rangeBarChart: RangeBarChartLabels;
  realtimeChart: RealtimeChartLabels;
  scatterChart: ScatterChartLabels;
  semiCircleGauge: SemiCircleGaugeLabels;
  sparkline: SparklineLabels;
  sunburstChart: SunburstChartLabels;
  treemapChart: TreemapChartLabels;
  waterfallChart: WaterfallChartLabels;
  worldMap: WorldMapLabels;
};

/** The key of a wrapper in `ChartLabels`: every one but `chart`. */
export type WrapperLabelsKey = Exclude<keyof ChartLabels, 'chart'>;

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

export const COMMON_CHART_LABELS: CommonChartLabels = {
  empty: 'No data',
  loading: (name) => `${name}, loading`,
  gauge: 'Gauge',
  gaugeName: (name, value) => `${name}: ${value}`,
  cellName: (row, title, value) => `${row ? `${row}, ` : ''}${title}: ${value}`,
};

export const BAR_CHART_LABELS: BarChartLabels = {
  name: (series) => `Bar chart: ${series}`,
};

export const BOX_PLOT_CHART_LABELS: BoxPlotChartLabels = {
  name: (series) => `Box plot: ${series}`,
  max: 'Max',
  q3: 'Q3',
  median: 'Median',
  q1: 'Q1',
  min: 'Min',
};

export const BUBBLE_CHART_LABELS: BubbleChartLabels = {
  name: (series) => `Bubble chart: ${series}`,
  x: 'x',
  y: 'y',
  size: 'Size',
};

export const BUMP_CHART_LABELS: BumpChartLabels = {
  name: (series) => `Bump chart: ${series}`,
  notRanked: 'not ranked',
  unchanged: (versus) => `unchanged vs ${versus}`,
  newEntry: 'new entry',
  up: (by, versus) => `up ${by} vs ${versus}`,
  down: (by, versus) => `down ${by} vs ${versus}`,
};

export const CALENDAR_CHART_LABELS: CalendarChartLabels = {
  name: 'Calendar chart',
  yearName: (name, year) => `${name}, ${year}`,
  less: 'Less',
  more: 'More',
};

export const DONUT_CHART_LABELS: DonutChartLabels = {
  name: (slices) => `Donut chart: ${slices}`,
  pieName: (slices) => `Pie chart: ${slices}`,
  total: 'Total',
};

export const FUNNEL_CHART_LABELS: FunnelChartLabels = {
  name: (stages) => `Funnel: ${stages}`,
  value: 'Value',
  ofPrevious: 'Of previous stage',
  ofFirst: (first) => `Of ${first}`,
  rateOfFirst: (rate, first) => `${rate} of ${first}`,
  rateOfPrevious: (rate) => `${rate} of previous stage`,
  stage: (label, value) => `${label}: ${value}`,
};

export const GRADIENT_RADIAL_LABELS: GradientRadialLabels = { label: 'Score' };

export const HEATMAP_CHART_LABELS: HeatmapChartLabels = {
  name: (series) => `Heatmap: ${series}`,
};

export const LINE_AREA_CHART_LABELS: LineAreaChartLabels = {
  name: (series) => `Area chart: ${series}`,
};

export const MIXED_CHART_LABELS: MixedChartLabels = {
  name: (series) => `Mixed chart: ${series}`,
};

export const RADAR_CHART_LABELS: RadarChartLabels = {
  name: (series) => `Radar chart: ${series}`,
};

export const RADIAL_BAR_CHART_LABELS: RadialBarChartLabels = {
  name: (rings) => `Radial bar chart: ${rings}`,
  average: 'Avg',
};

export const RANGE_BAR_CHART_LABELS: RangeBarChartLabels = {
  name: (series) => `Range chart: ${series}`,
  ranges: 'Ranges',
};

export const REALTIME_CHART_LABELS: RealtimeChartLabels = {
  name: 'Live values, newest on the right',
  warn: 'WARN',
  crit: 'CRIT',
  value: 'value',
};

export const SCATTER_CHART_LABELS: ScatterChartLabels = {
  name: (series) => `Scatter chart: ${series}`,
  x: 'x',
  y: 'y',
};

export const SEMI_CIRCLE_GAUGE_LABELS: SemiCircleGaugeLabels = {
  target: (value) => `target ${value}`,
  warnFrom: (value) => `warning from ${value}`,
  critFrom: (value) => `critical from ${value}`,
};

export const SPARKLINE_LABELS: SparklineLabels = {
  name: (label) => `Trend of ${label}`,
  label: 'value',
};

export const SUNBURST_CHART_LABELS: SunburstChartLabels = {
  name: (branches) => `Sunburst chart: ${branches}`,
  total: 'Total',
  ofTotal: (share) => `${share} of total`,
  ofParent: (share, parent) => `${share} of ${parent}`,
  shareOfTotal: 'Share of total',
  arcName: (path, value, share) => `${path}: ${value}, ${share}`,
  outlineItem: (name, value) => `${name}: ${value}`,
};

export const TREEMAP_CHART_LABELS: TreemapChartLabels = {
  name: (tiles) => `Treemap: ${tiles}`,
  series: (n) => `Series ${n}`,
  tile: (name, value, group) => `${group ? `${group}, ${name}` : name}: ${value}`,
};

export const WATERFALL_CHART_LABELS: WaterfallChartLabels = {
  name: (bars) => `Waterfall chart: ${bars}`,
  increase: 'Increase',
  decrease: 'Decrease',
  subtotal: 'Subtotal',
  total: 'Total',
  runningTotal: 'Running total',
  series: 'Waterfall',
};

export const WORLD_MAP_LABELS: WorldMapLabels = {
  name: 'World map',
  measure: 'value',
  byCountry: (label, from, to) => `${label} by country, from ${from} to ${to}`,
  markerCount: (count) => plural(count, 'marker'),
  routeCount: (count) => plural(count, 'route'),
  value: 'Value',
  countryColumn: 'Country',
  markersCaption: 'Markers',
  markerColumn: 'Marker',
  routesCaption: 'Routes',
  routeColumn: 'Route',
  routeName: (from, to) => `${from} to ${to}`,
  announce: (title, label, value) => `${title}, ${label}: ${value}`,
  widthRange: (from, to) => `${from} to ${to}`,
  noData: 'No data',
};

/** Every default, a starting point for a translation: copy it, change the texts. */
export const englishChartLabels: ChartLabels = {
  chart: COMMON_CHART_LABELS,
  barChart: BAR_CHART_LABELS,
  boxPlotChart: BOX_PLOT_CHART_LABELS,
  bubbleChart: BUBBLE_CHART_LABELS,
  bumpChart: BUMP_CHART_LABELS,
  calendarChart: CALENDAR_CHART_LABELS,
  donutChart: DONUT_CHART_LABELS,
  funnelChart: FUNNEL_CHART_LABELS,
  gradientRadial: GRADIENT_RADIAL_LABELS,
  heatmapChart: HEATMAP_CHART_LABELS,
  lineAreaChart: LINE_AREA_CHART_LABELS,
  mixedChart: MIXED_CHART_LABELS,
  radarChart: RADAR_CHART_LABELS,
  radialBarChart: RADIAL_BAR_CHART_LABELS,
  rangeBarChart: RANGE_BAR_CHART_LABELS,
  realtimeChart: REALTIME_CHART_LABELS,
  scatterChart: SCATTER_CHART_LABELS,
  semiCircleGauge: SEMI_CIRCLE_GAUGE_LABELS,
  sparkline: SPARKLINE_LABELS,
  sunburstChart: SUNBURST_CHART_LABELS,
  treemapChart: TREEMAP_CHART_LABELS,
  waterfallChart: WATERFALL_CHART_LABELS,
  worldMap: WORLD_MAP_LABELS,
};
