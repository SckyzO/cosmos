import { createContext, useContext } from 'react';
import type { CosmosLabels } from './cosmosLabels';

/**
 * What an app gives `LabelsProvider`: for any component, the labels it translates. A component or
 * a key left out keeps its English default.
 */
export type LabelsInput = { [K in keyof CosmosLabels]?: Partial<CosmosLabels[K]> };

export const LabelsContext = createContext<LabelsInput>({});

/** The keys set to a value: `{ retry: undefined }` keeps the default, as a key left out does. */
export const definedLabels = <T extends object>(labels: Partial<T> | undefined): Partial<T> =>
  labels
    ? (Object.fromEntries(
        Object.entries(labels).filter(([, value]) => value !== undefined)
      ) as Partial<T>)
    : {};

/**
 * A component's labels: its English `defaults`, then what the nearest `LabelsProvider` gives for
 * its `key`, then the component's own `labels` prop.
 *
 * Internal to the package, not exported.
 */
export const useLabels = <K extends keyof CosmosLabels>(
  key: K,
  defaults: CosmosLabels[K],
  own?: Partial<CosmosLabels[K]>
): CosmosLabels[K] => {
  const app = useContext(LabelsContext)[key];
  return { ...defaults, ...definedLabels(app), ...definedLabels(own) } as CosmosLabels[K];
};
