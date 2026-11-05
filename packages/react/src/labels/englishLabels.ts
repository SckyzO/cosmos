import { EMPTY_STATE_LABELS, ERROR_STATE_LABELS, LOADING_STATE_LABELS } from '../feedback/labels';
import { BREADCRUMB_LABELS } from '../navigation/labels';
import type { CosmosLabels } from './cosmosLabels';

/**
 * The English every component writes by default, the whole `CosmosLabels`: the start of a
 * translation. Each component reads its own defaults from its group's `labels` module, so an app
 * that never imports this object ships none of the others.
 */
export const englishLabels: CosmosLabels = {
  breadcrumb: BREADCRUMB_LABELS,
  emptyState: EMPTY_STATE_LABELS,
  errorState: ERROR_STATE_LABELS,
  loadingState: LOADING_STATE_LABELS,
};
