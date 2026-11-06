import type { ChartLabels } from '../../core/labels';

// The French of every text the charts write, the entry `@sckyzo/cosmos-charts/locales/fr`:
// `<ChartLabelsProvider labels={frenchChartLabels}>` shows them in French, and a dictionary of
// another language can start from a copy of it. It is typed as the whole `ChartLabels`, so a key
// added to the charts without its French fails the typecheck.
//
// It writes French as `@sckyzo/cosmos-react/locales/fr` does: a narrow no-break space
// (U+202F, written `\u202f`) before `:`, the typographic apostrophe ’, and 0 and 1 as singular.

const plural = (count: number, one: string, many: string) => `${count} ${count <= 1 ? one : many}`;

/** The French of every text the charts write, for `ChartLabelsProvider`. */
export const frenchChartLabels: ChartLabels = {
  chart: {
    empty: 'Aucune donnée',
    loading: (name) => `${name}, chargement`,
    gauge: 'Jauge',
    gaugeName: (name, value) => `${name}\u202f: ${value}`,
    cellName: (row, title, value) => `${row ? `${row}, ` : ''}${title}\u202f: ${value}`,
  },
  barChart: { name: (series) => `Histogramme\u202f: ${series}` },
  boxPlotChart: {
    name: (series) => `Boîte à moustaches\u202f: ${series}`,
    max: 'Maximum',
    q3: 'Quartile 3',
    median: 'Médiane',
    q1: 'Quartile 1',
    min: 'Minimum',
  },
  bubbleChart: {
    name: (series) => `Graphique à bulles\u202f: ${series}`,
    x: 'abscisse',
    y: 'ordonnée',
    size: 'Taille',
  },
  bumpChart: {
    name: (series) => `Classement\u202f: ${series}`,
    notRanked: 'non classé',
    unchanged: (versus) => `inchangé par rapport à ${versus}`,
    newEntry: 'nouvelle entrée',
    up: (by, versus) => `en hausse de ${by} par rapport à ${versus}`,
    down: (by, versus) => `en baisse de ${by} par rapport à ${versus}`,
  },
  calendarChart: {
    name: 'Calendrier',
    yearName: (name, year) => `${name}, année ${year}`,
    less: 'Moins',
    more: 'Plus',
  },
  donutChart: {
    name: (slices) => `Anneau\u202f: ${slices}`,
    pieName: (slices) => `Camembert\u202f: ${slices}`,
    total: 'Total',
  },
  funnelChart: {
    name: (stages) => `Entonnoir\u202f: ${stages}`,
    value: 'Valeur',
    ofPrevious: 'De l’étape précédente',
    ofFirst: (first) => `De ${first}`,
    rateOfFirst: (rate, first) => `${rate} de ${first}`,
    rateOfPrevious: (rate) => `${rate} de l’étape précédente`,
    stage: (label, value) => `${label}\u202f: ${value}`,
  },
  gradientRadial: { label: 'Note' },
  heatmapChart: { name: (series) => `Carte de chaleur\u202f: ${series}` },
  lineAreaChart: { name: (series) => `Courbes\u202f: ${series}` },
  mixedChart: { name: (series) => `Graphique mixte\u202f: ${series}` },
  radarChart: { name: (series) => `Radar\u202f: ${series}` },
  radialBarChart: { name: (rings) => `Barres radiales\u202f: ${rings}`, average: 'Moy.' },
  rangeBarChart: { name: (series) => `Plages\u202f: ${series}`, ranges: 'Plages' },
  realtimeChart: {
    name: 'Valeurs en direct, la plus récente à droite',
    warn: 'ALERTE',
    crit: 'CRITIQUE',
    value: 'valeur',
  },
  scatterChart: {
    name: (series) => `Nuage de points\u202f: ${series}`,
    x: 'abscisse',
    y: 'ordonnée',
  },
  semiCircleGauge: {
    target: (value) => `objectif ${value}`,
    warnFrom: (value) => `alerte à partir de ${value}`,
    critFrom: (value) => `critique à partir de ${value}`,
  },
  sparkline: { name: (label) => `Tendance de ${label}`, label: 'valeur' },
  sunburstChart: {
    name: (branches) => `Soleil\u202f: ${branches}`,
    total: 'Total',
    ofTotal: (share) => `${share} du total`,
    ofParent: (share, parent) => `${share} de ${parent}`,
    shareOfTotal: 'Part du total',
    arcName: (path, value, share) => `${path}\u202f: ${value}, ${share}`,
    outlineItem: (name, value) => `${name}\u202f: ${value}`,
  },
  treemapChart: {
    name: (tiles) => `Carte arborescente\u202f: ${tiles}`,
    series: (n) => `Série ${n}`,
    tile: (name, value, group) => `${group ? `${group}, ${name}` : name}\u202f: ${value}`,
  },
  waterfallChart: {
    name: (bars) => `Cascade\u202f: ${bars}`,
    increase: 'Hausse',
    decrease: 'Baisse',
    subtotal: 'Sous-total',
    total: 'Total',
    runningTotal: 'Cumul',
    series: 'Cascade',
  },
  worldMap: {
    name: 'Carte du monde',
    measure: 'valeur',
    byCountry: (label, from, to) => `${label} par pays, de ${from} à ${to}`,
    markerCount: (count) => plural(count, 'marqueur', 'marqueurs'),
    routeCount: (count) => plural(count, 'route', 'routes'),
    value: 'Valeur',
    countryColumn: 'Pays',
    markersCaption: 'Marqueurs',
    markerColumn: 'Marqueur',
    routesCaption: 'Routes',
    routeColumn: 'Route',
    routeName: (from, to) => `${from} à ${to}`,
    announce: (title, label, value) => `${title}, ${label}\u202f: ${value}`,
    widthRange: (from, to) => `de ${from} à ${to}`,
    noData: 'Aucune donnée',
  },
};
