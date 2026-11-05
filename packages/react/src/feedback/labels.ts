// The English the state placeholders write, their part of `CosmosLabels` (`englishLabels`).

export type EmptyStateLabels = {
  /** The title when the host gives none. Default `No data`. */
  title: string;
};

export type ErrorStateLabels = {
  /** The title when the host gives none. Default `Something went wrong.` */
  title: string;
  /** The retry button, shown with `onRetry`. Default `Try again`. */
  retry: string;
};

export type LoadingStateLabels = {
  /** The line next to the spinner when the host gives none. Default `Loading…` */
  title: string;
};

export const EMPTY_STATE_LABELS: EmptyStateLabels = { title: 'No data' };

export const ERROR_STATE_LABELS: ErrorStateLabels = {
  title: 'Something went wrong.',
  retry: 'Try again',
};

export const LOADING_STATE_LABELS: LoadingStateLabels = { title: 'Loading…' };
