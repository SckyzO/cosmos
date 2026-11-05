import type { EmptyStateLabels, ErrorStateLabels, LoadingStateLabels } from '../feedback/labels';
import type { BreadcrumbLabels } from '../navigation/labels';

/**
 * Every text the components write themselves, one key per component, so an app translates them
 * once with `LabelsProvider`. A text that holds a value is a function of it, so word order and
 * plurals stay with the app: `breadcrumb.showHidden: (count) => …`.
 *
 * `englishLabels` holds the defaults, a starting point for a translation.
 */
export type CosmosLabels = {
  breadcrumb: BreadcrumbLabels;
  emptyState: EmptyStateLabels;
  errorState: ErrorStateLabels;
  loadingState: LoadingStateLabels;
};
