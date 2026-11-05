import { useContext, useMemo, type ReactNode } from 'react';
import type { CosmosLabels } from './cosmosLabels';
import {
  definedLabels,
  LabelsContext,
  type LabelsContextValue,
  type LabelsInput,
} from './labelsContext';

export type { LabelsInput } from './labelsContext';

export type LabelsProviderProps = {
  /**
   * The texts the components write, translated: any key of any component (see `CosmosLabels`).
   * What is left out stays as the outer provider has it, else English. Optional: a provider
   * that gives only a `locale` leaves the text in English.
   */
  labels?: LabelsInput;
  /**
   * BCP 47 tag (`'fr-FR'`) of the language on show: the default of every component that writes a
   * date, a time, a number or a size, and of the ones that format in English with no `locale` of
   * their own. A component's own `locale` wins. What is left out stays as the outer provider has
   * it, else the runtime's default.
   */
  locale?: string;
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
 * `locale` is the language's BCP 47 tag, for the dates, times, numbers and sizes the components
 * write: `<LabelsProvider labels={fr} locale="fr-FR">`. A component's own `labels` prop wins over
 * the provider, and a nested provider over the outer one, key by key. Text the app passes in (`title`, `items`…) is the app's and never goes through
 * here.
 */
export function LabelsProvider({ labels, locale, children }: LabelsProviderProps) {
  const outer = useContext(LabelsContext);
  const value = useMemo<LabelsContextValue>(() => {
    const merged: Record<string, object> = { ...outer.labels };
    for (const [key, own] of Object.entries(labels ?? {}) as [keyof CosmosLabels, object][])
      merged[key] = { ...outer.labels[key], ...definedLabels(own) };
    return { labels: merged as LabelsInput, locale: locale ?? outer.locale };
  }, [outer, labels, locale]);
  return <LabelsContext value={value}>{children}</LabelsContext>;
}
