import { useContext, useMemo, type ReactNode } from 'react';
import type { ChartLabels } from './core/labels';
import { ChartLabelsContext, definedLabels, type ChartLabelsInput } from './core/labelsContext';

export { englishChartLabels } from './core/labels';
export type {
  BarChartLabels,
  BoxPlotChartLabels,
  BubbleChartLabels,
  BumpChartLabels,
  CalendarChartLabels,
  ChartLabels,
  CommonChartLabels,
  DonutChartLabels,
  FunnelChartLabels,
  GradientRadialLabels,
  HeatmapChartLabels,
  LineAreaChartLabels,
  MixedChartLabels,
  RadarChartLabels,
  RadialBarChartLabels,
  RangeBarChartLabels,
  RealtimeChartLabels,
  ScatterChartLabels,
  SemiCircleGaugeLabels,
  SparklineLabels,
  SunburstChartLabels,
  TreemapChartLabels,
  WaterfallChartLabels,
  WorldMapLabels,
} from './core/labels';
export type { ChartLabelsInput } from './core/labelsContext';

export type ChartLabelsProviderProps = {
  /**
   * The texts the charts write, translated: `chart` for what every chart writes (the empty
   * message, the loading name) and a key per chart for the rest (see `ChartLabels`). What is left
   * out stays as the outer provider has it, else English.
   */
  labels: ChartLabelsInput;
  children: ReactNode;
};

/**
 * ChartLabelsProvider — translates the text the charts write themselves: the empty message
 * ("No data"), the default names screen readers hear ("Bar chart: CPU, Memory"), the words of a
 * tooltip ("Median") or a scale ("Less", "More"). Mount it once, at the root, next to
 * `LabelsProvider` of `@sckyzo/cosmos-react` (this package has its own, since it imports neither
 * it nor the theme), with the app's dictionary for the language on show; `englishChartLabels` is
 * the full English one to start from.
 *
 * ```tsx
 * const fr: ChartLabelsInput = {
 *   chart: { empty: 'Aucune donnée', loading: (name) => `${name}, chargement` },
 *   barChart: { name: (series) => `Histogramme : ${series}` },
 * };
 * <ChartLabelsProvider labels={fr}>{app}</ChartLabelsProvider>
 * ```
 *
 * A chart's own `labels` prop wins over the provider, and a nested provider over the outer one,
 * key by key. Text the app passes in (`ariaLabel`, series names, axis titles) is the app's and
 * never goes through here.
 */
export function ChartLabelsProvider({ labels, children }: ChartLabelsProviderProps) {
  const outer = useContext(ChartLabelsContext);
  const value = useMemo(() => {
    const merged: Record<string, object> = { ...outer };
    for (const [key, own] of Object.entries(labels) as [keyof ChartLabels, object][])
      merged[key] = { ...outer[key], ...definedLabels(own) };
    return merged as ChartLabelsInput;
  }, [outer, labels]);
  return <ChartLabelsContext value={value}>{children}</ChartLabelsContext>;
}
