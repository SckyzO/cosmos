import { useContext, useMemo, type ReactNode } from 'react';
import type { CosmosLabels } from './cosmosLabels';
import { definedLabels, LabelsContext, type LabelsInput } from './labelsContext';

export type { LabelsInput } from './labelsContext';

export type LabelsProviderProps = {
  /**
   * The texts the components write, translated: any key of any component (see `CosmosLabels`).
   * What is left out stays as the outer provider has it, else English.
   */
  labels: LabelsInput;
  children: ReactNode;
};

/**
 * LabelsProvider — translates the text the components write themselves: the names of their
 * buttons ("Show 2 more pages"), their default titles ("No data"), the words of their states
 * ("Try again"). Mount it once, at the root, next to `LinkProvider`, with the app's dictionary
 * for the language on show; `englishLabels` is the full English one to start from.
 *
 * ```tsx
 * const fr: LabelsInput = {
 *   breadcrumb: { landmark: "Fil d'Ariane", showHidden: (count) => `Afficher ${count} pages` },
 *   errorState: { retry: 'Réessayer' },
 * };
 * <LabelsProvider labels={fr}>{app}</LabelsProvider>
 * ```
 *
 * A component's own `labels` prop wins over the provider, and a nested provider over the outer
 * one, key by key. Text the app passes in (`title`, `items`…) is the app's and never goes through
 * here.
 */
export function LabelsProvider({ labels, children }: LabelsProviderProps) {
  const outer = useContext(LabelsContext);
  const value = useMemo(() => {
    const merged: Record<string, object> = { ...outer };
    for (const [key, own] of Object.entries(labels) as [keyof CosmosLabels, object][])
      merged[key] = { ...outer[key], ...definedLabels(own) };
    return merged as LabelsInput;
  }, [outer, labels]);
  return <LabelsContext value={value}>{children}</LabelsContext>;
}
