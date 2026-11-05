import type { ChartLabels } from './core/labels';

// A full French dictionary of the texts the charts write, for the stories that check a chart reads
// `ChartLabelsProvider` and its own `labels`. Typed as `ChartLabels`, so a key added to the charts
// without its French here fails the typecheck.

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export const FRENCH_CHART_LABELS: ChartLabels = {
  chart: {
    empty: 'Aucune donnée',
    loading: (name) => `${name}, chargement`,
    gauge: 'Jauge',
    gaugeName: (name, value) => `${name} : ${value}`,
    cellName: (row, title, value) => `${row ? `${row}, ` : ''}${title} : ${value}`,
  },
  barChart: { name: (series) => `Histogramme : ${series}` },
  boxPlotChart: {
    name: (series) => `Boîte à moustaches : ${series}`,
    max: 'Maximum',
    q3: 'Quartile 3',
    median: 'Médiane',
    q1: 'Quartile 1',
    min: 'Minimum',
  },
  bubbleChart: {
    name: (series) => `Graphique à bulles : ${series}`,
    x: 'abscisse',
    y: 'ordonnée',
    size: 'Taille',
  },
  bumpChart: {
    name: (series) => `Classement : ${series}`,
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
    name: (slices) => `Anneau : ${slices}`,
    pieName: (slices) => `Camembert : ${slices}`,
    total: 'Total',
  },
  funnelChart: {
    name: (stages) => `Entonnoir : ${stages}`,
    value: 'Valeur',
    ofPrevious: "De l'étape précédente",
    ofFirst: (first) => `De ${first}`,
    rateOfFirst: (rate, first) => `${rate} de ${first}`,
    rateOfPrevious: (rate) => `${rate} de l'étape précédente`,
    stage: (label, value) => `${label} : ${value}`,
  },
  gradientRadial: { label: 'Note' },
  heatmapChart: { name: (series) => `Carte de chaleur : ${series}` },
  lineAreaChart: { name: (series) => `Courbes : ${series}` },
  mixedChart: { name: (series) => `Graphique mixte : ${series}` },
  radarChart: { name: (series) => `Radar : ${series}` },
  radialBarChart: { name: (rings) => `Barres radiales : ${rings}`, average: 'Moy.' },
  rangeBarChart: { name: (series) => `Plages : ${series}`, ranges: 'Plages' },
  realtimeChart: {
    name: 'Valeurs en direct, la plus récente à droite',
    warn: 'ALERTE',
    crit: 'CRITIQUE',
    value: 'valeur',
  },
  scatterChart: {
    name: (series) => `Nuage de points : ${series}`,
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
    name: (branches) => `Soleil : ${branches}`,
    total: 'Total',
    ofTotal: (share) => `${share} du total`,
    ofParent: (share, parent) => `${share} de ${parent}`,
    shareOfTotal: 'Part du total',
    arcName: (path, value, share) => `${path} : ${value}, ${share}`,
    outlineItem: (name, value) => `${name} : ${value}`,
  },
  treemapChart: {
    name: (tiles) => `Carte arborescente : ${tiles}`,
    series: (n) => `Série ${n}`,
    tile: (name, value, group) => `${group ? `${group}, ${name}` : name} : ${value}`,
  },
  waterfallChart: {
    name: (bars) => `Cascade : ${bars}`,
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
    announce: (title, label, value) => `${title}, ${label} : ${value}`,
    widthRange: (from, to) => `de ${from} à ${to}`,
    noData: 'Aucune donnée',
  },
};
