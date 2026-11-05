import { createContext, useContext } from 'react';
import {
  COMMON_CHART_LABELS,
  type ChartLabels,
  type CommonChartLabels,
  type WrapperLabelsKey,
} from './labels';

/**
 * What an app gives `ChartLabelsProvider`: for `chart` and any wrapper, the labels it translates.
 * A key or a wrapper left out keeps its English default.
 */
export type ChartLabelsInput = { [K in keyof ChartLabels]?: Partial<ChartLabels[K]> };

export const ChartLabelsContext = createContext<ChartLabelsInput>({});

/** The keys set to a value: `{ empty: undefined }` keeps the default, as a key left out does. */
export const definedLabels = <T extends object>(labels: Partial<T> | undefined): Partial<T> =>
  labels
    ? (Object.fromEntries(
        Object.entries(labels).filter(([, value]) => value !== undefined)
      ) as Partial<T>)
    : {};

/**
 * The texts every wrapper's frame writes: the English ones, then what the nearest
 * `ChartLabelsProvider` gives for `chart`, then the wrapper's own `labels` prop.
 *
 * Internal to the package, not exported.
 */
export const useCommonLabels = (own?: Partial<CommonChartLabels>): CommonChartLabels => {
  const app = useContext(ChartLabelsContext);
  return { ...COMMON_CHART_LABELS, ...definedLabels(app.chart), ...definedLabels(own) };
};

/**
 * A wrapper's labels, the common ones with its own: the common English ones, the provider's
 * `chart`, the wrapper's English `defaults`, the provider's `key`, then the wrapper's `labels`
 * prop. A new object on each render: never a dependency of an effect, a memo or a callback.
 *
 * Internal to the package, not exported.
 */
export const useChartLabels = <K extends WrapperLabelsKey>(
  key: K,
  defaults: ChartLabels[K],
  own?: Partial<CommonChartLabels & ChartLabels[K]>
): CommonChartLabels & ChartLabels[K] => {
  const app = useContext(ChartLabelsContext);
  return {
    ...COMMON_CHART_LABELS,
    ...definedLabels(app.chart),
    ...defaults,
    ...definedLabels(app[key]),
    ...definedLabels(own),
  } as CommonChartLabels & ChartLabels[K];
};
