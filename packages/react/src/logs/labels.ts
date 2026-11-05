// The English the log components write, their part of `CosmosLabels` (`englishLabels`).

import type { JobStatus } from './job-log';
import type { LogLevelKey } from './types';

/**
 * The words of `LogViewer`, `LogToolbar`, `LogEntryDetail` and `LogLevelBadge`, which share them.
 * The text of each level's badge is keyed by level (`warn`: `WARN`); the toolbar names a level
 * button after it, in lower case with a capital.
 */
export type LogViewerLabels = Record<LogLevelKey, string> & {
  /** Name of the log when the host gives no `aria-label`. Default `Log`. */
  log: string;
  /** What is said when no line is left to draw, when the host gives no `emptyMessage`. Default `No log lines.` */
  noLines: string;
  /** Name of the button that opens a line's details. Default `Show details`. */
  showDetails: string;
  /** Name of the button that closes them. Default `Hide details`. */
  hideDetails: string;
  /** Name of the details of a line, from its number or id. Default `Details of line 12`. */
  detailsOfLine: (line: string) => string;
  /** The button of an expanded line that opens the full record. Default `Open details`. */
  openDetails: string;
  /** The button that goes back to the newest lines. Default `Jump to latest`. */
  jumpToLatest: string;
  /** The same with the lines that came meanwhile, `count` as the viewer's locale writes it. Default `Jump to latest (12 new)`. */
  jumpToLatestNew: (count: string) => string;
  /** The end of the error announcement, when more errors than it names came in. Default `And 2 more.` */
  moreErrors: (count: number) => string;

  /** Name of the toolbar. Default `Log controls`. */
  controls: string;
  /** The text of the live state. Default `Live`. */
  live: string;
  /** The text of the paused state. Default `Paused`. */
  paused: string;
  /** Name of the button while live. Default `Live, pause the stream`. */
  pauseStream: string;
  /** Name of the button while paused. Default `Paused, resume the stream`. */
  resumeStream: string;
  /** Name of the level buttons. Default `Levels`. */
  levels: string;
  /** Name of the regular expression toggle. Default `Regular expression`. */
  regularExpression: string;
  /** Said when the pattern does not compile. Default `Invalid pattern`. */
  invalidPattern: string;
  /** Said when nothing matches. Default `No matches`. */
  noMatches: string;
  /** The match counter, from the 1-based match and the total, as the locale writes them. Default `3 of 12`. */
  matchOf: (match: string, total: string) => string;
  /** Name of the previous match button. Default `Previous match`. */
  previousMatch: string;
  /** Name of the next match button. Default `Next match`. */
  nextMatch: string;
  /** Name of the search field. Default `Search logs`. */
  searchLogs: string;
  /** Placeholder of the search field. Default `Search…`. */
  searchPlaceholder: string;
  /** Label of the source filter. Default `Sources`. */
  sources: string;
  /** Placeholder of the source filter. Default `All sources`. */
  allSources: string;
  /** Said when the source filter finds no source. Default `No such source.` */
  noSource: string;
  /** The wrap toggle. Default `Wrap lines`. */
  wrapLines: string;
  /** The order toggle. Default `Newest first`. */
  newestFirst: string;
  /** The download button. Default `Download`. */
  download: string;
  /** The clear button. Default `Clear`. */
  clear: string;
  /** The button of the narrow bar's filters. Default `Filters`. */
  filters: string;
  /** Its name when some filters are active, from how many. Default `Filters, 2 active`. */
  filtersActive: (count: number) => string;
  /** Name of the panel of the narrow bar's filters. Default `Log filters`. */
  logFilters: string;
  /** Heading of the view options in that panel. Default `View`. */
  view: string;
  /** The regular expression toggle in that panel. Default `Regex`. */
  regex: string;

  /** Heading of the fields of an entry. Default `Fields`. */
  fields: string;
  /** Name of the copy button of a field, from its name. Default `Copy host`. */
  copyField: (field: string) => string;
  /** Name of the "filter on" button of a field. Default `Filter on host`. */
  filterField: (field: string) => string;
  /** Its tooltip. Default `Filter on this value`. */
  filterValue: string;
  /** Name of the "exclude" button of a field. Default `Exclude host`. */
  excludeField: (field: string) => string;
  /** Its tooltip. Default `Exclude this value`. */
  excludeValue: string;
  /** Heading of the stack trace. Default `Stack trace`. */
  stackTrace: string;
  /** Heading of the context. Default `Context`. */
  context: string;
  /** The button that shows the lines around the entry. Default `Show context`. */
  showContext: string;
  /** The button that hides them. Default `Hide context`. */
  hideContext: string;
  /** Name of the lines around an entry, from its id. Default `Lines around 42`. */
  linesAround: (id: string) => string;
  /** Heading of the raw record. Default `Raw record`. */
  rawRecord: string;
};

/**
 * The words of `JobLog`. The name of each status is keyed by status (`failed`: `Failed`), and read
 * out, shown and written in the downloaded text.
 */
export type JobLogLabels = Record<JobStatus, string> & {
  /** Name of the log when the host gives no `aria-label` and no `title`. Default `Job log`. */
  log: string;
  /** Name of the link of a line, from its number. Default `Line 12`. */
  line: (number: number) => string;
  /** Name of the lines of a step, from its name. Default `Build output`. */
  output: (name: string) => string;
  /** What an open step with no line says while it is queued. Default `Not started.` */
  emptyQueued: string;
  /** While it runs. Default `No output yet.` */
  emptyRunning: string;
  /** When it passed. Default `No output.` */
  emptyPassed: string;
  /** When it failed. Default `No output.` */
  emptyFailed: string;
  /** When it was skipped. Default `Skipped.` */
  emptySkipped: string;
  /** What a log with no step says. Default `No steps.` */
  noSteps: string;
  /** The footer while a running step is followed. Default `Following the running step`. */
  following: string;
  /** The footer once the reader scrolled away. Default `Paused`. */
  paused: string;
  /** The button that pauses the follow. Default `Pause`. */
  pause: string;
  /** The button that resumes it. Default `Jump to latest`. */
  jumpToLatest: string;
  /** The same with the lines that came meanwhile, `count` as the log writes it. Default `Jump to latest (12 new)`. */
  jumpToLatestNew: (count: string) => string;

  /** Name of the toolbar. Default `Log controls`. */
  controls: string;
  /** Name and placeholder of the search field. Default `Search the log`. */
  search: string;
  /** Said when nothing matches. Default `No matches`. */
  noMatches: string;
  /** Name of the previous match button. Default `Previous match`. */
  previousMatch: string;
  /** Name of the next match button. Default `Next match`. */
  nextMatch: string;
  /** The timestamps toggle. Default `Timestamps`. */
  timestamps: string;
  /** The wrap toggle. Default `Wrap lines`. */
  wrapLines: string;
  /** The button that collapses every step. Default `Collapse all steps`. */
  collapseAll: string;
  /** The button that expands every step. Default `Expand all steps`. */
  expandAll: string;
  /** The download button. Default `Download the log`. */
  download: string;
  /** Name of the button of the narrow bar's menu. Default `More options`. */
  moreOptions: string;
  /** Name of that menu. Default `Log options`. */
  logOptions: string;
};

export const LOG_VIEWER_LABELS: LogViewerLabels = {
  trace: 'TRACE',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  fatal: 'FATAL',
  unknown: 'UNKNOWN',
  log: 'Log',
  noLines: 'No log lines.',
  showDetails: 'Show details',
  hideDetails: 'Hide details',
  detailsOfLine: (line) => `Details of line ${line}`,
  openDetails: 'Open details',
  jumpToLatest: 'Jump to latest',
  jumpToLatestNew: (count) => `Jump to latest (${count} new)`,
  moreErrors: (count) => `And ${count} more.`,
  controls: 'Log controls',
  live: 'Live',
  paused: 'Paused',
  pauseStream: 'Live, pause the stream',
  resumeStream: 'Paused, resume the stream',
  levels: 'Levels',
  regularExpression: 'Regular expression',
  invalidPattern: 'Invalid pattern',
  noMatches: 'No matches',
  matchOf: (match, total) => `${match} of ${total}`,
  previousMatch: 'Previous match',
  nextMatch: 'Next match',
  searchLogs: 'Search logs',
  searchPlaceholder: 'Search…',
  sources: 'Sources',
  allSources: 'All sources',
  noSource: 'No such source.',
  wrapLines: 'Wrap lines',
  newestFirst: 'Newest first',
  download: 'Download',
  clear: 'Clear',
  filters: 'Filters',
  filtersActive: (count) => `Filters, ${count} active`,
  logFilters: 'Log filters',
  view: 'View',
  regex: 'Regex',
  fields: 'Fields',
  copyField: (field) => `Copy ${field}`,
  filterField: (field) => `Filter on ${field}`,
  filterValue: 'Filter on this value',
  excludeField: (field) => `Exclude ${field}`,
  excludeValue: 'Exclude this value',
  stackTrace: 'Stack trace',
  context: 'Context',
  showContext: 'Show context',
  hideContext: 'Hide context',
  linesAround: (id) => `Lines around ${id}`,
  rawRecord: 'Raw record',
};

export const JOB_LOG_LABELS: JobLogLabels = {
  queued: 'Queued',
  running: 'Running',
  passed: 'Passed',
  failed: 'Failed',
  skipped: 'Skipped',
  log: 'Job log',
  line: (number) => `Line ${number}`,
  output: (name) => `${name} output`,
  emptyQueued: 'Not started.',
  emptyRunning: 'No output yet.',
  emptyPassed: 'No output.',
  emptyFailed: 'No output.',
  emptySkipped: 'Skipped.',
  noSteps: 'No steps.',
  following: 'Following the running step',
  paused: 'Paused',
  pause: 'Pause',
  jumpToLatest: 'Jump to latest',
  jumpToLatestNew: (count) => `Jump to latest (${count} new)`,
  controls: 'Log controls',
  search: 'Search the log',
  noMatches: 'No matches',
  previousMatch: 'Previous match',
  nextMatch: 'Next match',
  timestamps: 'Timestamps',
  wrapLines: 'Wrap lines',
  collapseAll: 'Collapse all steps',
  expandAll: 'Expand all steps',
  download: 'Download the log',
  moreOptions: 'More options',
  logOptions: 'Log options',
};
