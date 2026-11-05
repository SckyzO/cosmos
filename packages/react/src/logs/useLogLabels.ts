import { createContext, useContext } from 'react';
import { definedLabels, useLabels } from '../labels/labelsContext';
import {
  JOB_LOG_LABELS,
  LOG_VIEWER_LABELS,
  type JobLogLabels,
  type LogViewerLabels,
} from './labels';

// What a root's `labels` prop gave, for the parts below it (rows, details, badges, toolbars): they
// read the same key, over the provider, with the root's labels and their own on top.
export const LogViewerLabelsContext = createContext<Partial<LogViewerLabels> | undefined>(
  undefined
);
export const JobLogLabelsContext = createContext<Partial<JobLogLabels> | undefined>(undefined);

/** The labels of `LogViewer` and its parts: the provider's, the nearest viewer's, then `own`. */
export const useLogViewerLabels = (own?: Partial<LogViewerLabels>): LogViewerLabels => {
  const inherited = useContext(LogViewerLabelsContext);
  return useLabels('logViewer', LOG_VIEWER_LABELS, { ...inherited, ...definedLabels(own) });
};

/** The labels of `JobLog` and its parts. */
export const useJobLogLabels = (own?: Partial<JobLogLabels>): JobLogLabels => {
  const inherited = useContext(JobLogLabelsContext);
  return useLabels('jobLog', JOB_LOG_LABELS, { ...inherited, ...definedLabels(own) });
};
