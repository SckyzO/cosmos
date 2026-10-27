import type { DateTimeValue } from '../data/time';
import { toTimestamp } from '../data/time';
import { stripAnsi } from './ansi';

// The model and the pure helpers behind `JobLog`: no DOM and no timer, so the durations, the
// links, the search across steps and the text of a download are tested in Node.

/** Where a job or one of its steps stands. */
export type JobStatus = 'queued' | 'running' | 'passed' | 'failed' | 'skipped';

/** One line of a step: its text, and when it was written. */
export type JobLogLine = {
  /** The raw text of the line. ANSI colours are drawn as theme colours; markup stays text. */
  text: string;
  /** A `Date`, a timestamp in milliseconds or an ISO 8601 string. Shown in the timestamps column. */
  timestamp?: DateTimeValue;
};

/** One step of a job, as a CI tool shows it. */
export type JobLogStep = {
  /** Stable and unique among the steps: it keys the step and builds the links of its lines. */
  id: string;
  /** The name of the step. Text, never HTML. */
  name: string;
  status: JobStatus;
  /** How long the step took, in milliseconds. The host measures it, and updates it while the step runs. */
  duration?: number;
  /** When the step started: the origin of the `elapsed` timestamps. Defaults to the first timestamp of the step. */
  startedAt?: DateTimeValue;
  /** The output of the step, oldest first: a string is a line without a timestamp. */
  lines: readonly (string | JobLogLine)[];
};

/** A line of a step: `line` counts from 1 in each step. */
export type JobLogLineRef = { step: string; line: number };

/** How the timestamps column reads: the time of day of each line, or the time since its step started. */
export type JobLogTimestampFormat = 'clock' | 'elapsed';

/** The controls of the toolbar the host can leave out. */
export type JobLogControl = 'search' | 'timestamps' | 'wrap' | 'expand' | 'download';

/** The text of a line. */
export const lineText = (line: string | JobLogLine): string =>
  typeof line === 'string' ? line : line.text;

const STATUS_LABEL: Record<JobStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  passed: 'Passed',
  failed: 'Failed',
  skipped: 'Skipped',
};

/** The word for a status: it is never only a colour. */
export const statusLabel = (status: JobStatus): string => STATUS_LABEL[status];

// ── Durations ───────────────────────────────────────────────────────────────

const two = (n: number) => String(n).padStart(2, '0');

/**
 * A duration in the short form a CI tool shows: `3s`, `1m 12s`, `2m 03s`, `1h 02m 03s`. Whole
 * seconds, rounded down; under a second it is `<1s`.
 */
export const formatJobDuration = (ms: number): string => {
  if (!Number.isFinite(ms) || ms < 0) return '';
  const total = Math.floor(ms / 1000);
  if (total < 1) return '<1s';
  const [hours, minutes, seconds] = [
    Math.floor(total / 3600),
    Math.floor(total / 60) % 60,
    total % 60,
  ];
  if (hours > 0) return `${hours}h ${two(minutes)}m ${two(seconds)}s`;
  if (minutes > 0) return `${minutes}m ${two(seconds)}s`;
  return `${seconds}s`;
};

/**
 * The time since a step started, to the tenth of a second: `+0:04.2`, `+12:03.5`, `+1:02:03.4`.
 * A line stamped before its step started reads `+0:00.0`.
 */
export const formatElapsed = (ms: number): string => {
  const tenths = Number.isFinite(ms) ? Math.floor(Math.max(0, ms) / 100) : 0;
  const total = Math.floor(tenths / 10);
  const [hours, minutes, seconds] = [
    Math.floor(total / 3600),
    Math.floor(total / 60) % 60,
    total % 60,
  ];
  const rest = `${two(seconds)}.${tenths % 10}`;
  return hours > 0 ? `+${hours}:${two(minutes)}:${rest}` : `+${minutes}:${rest}`;
};

/**
 * When a step started: its `startedAt`, else the first timestamp of its lines, else `null`. The
 * origin of the elapsed times.
 */
export const stepOrigin = (step: JobLogStep): number | null => {
  if (step.startedAt !== undefined) {
    const started = toTimestamp(step.startedAt);
    if (Number.isFinite(started)) return started;
  }
  for (const line of step.lines) {
    if (typeof line === 'string' || line.timestamp === undefined) continue;
    const stamped = toTimestamp(line.timestamp);
    if (Number.isFinite(stamped)) return stamped;
  }
  return null;
};

// ── Links ───────────────────────────────────────────────────────────────────

/** The anchor of a line: `<prefix><step id>-L<n>`. */
export const jobLogLineId = (prefix: string, ref: JobLogLineRef): string =>
  `${prefix}${ref.step}-L${ref.line}`;

/** The `href` of a line's number: `#<prefix><step id>-L<n>`. */
export const jobLogLineHref = (prefix: string, ref: JobLogLineRef): string =>
  `#${jobLogLineId(prefix, ref)}`;

/**
 * The line a URL hash (`#run-tests-L6`, with or without the `#`) points at, for a host that
 * syncs `currentLine` with `location.hash`. `prefix` is the `idPrefix` of the log. `null` for a
 * hash that is not a line of this log.
 */
export const parseJobLogHash = (hash: string, prefix = ''): JobLogLineRef | null => {
  const found = /^#?(.+)-L([1-9]\d*)$/.exec(hash);
  if (found === null || !found[1]!.startsWith(prefix) || found[1]!.length === prefix.length) {
    return null;
  }
  let step = found[1]!.slice(prefix.length);
  try {
    step = decodeURIComponent(step);
  } catch {
    // A step id that is not percent-encoded stays as it is.
  }
  return { step, line: Number(found[2]) };
};

/** Whether two references point at the same line. */
export const sameLine = (a: JobLogLineRef | null, b: JobLogLineRef | null): boolean =>
  a === b || (a !== null && b !== null && a.step === b.step && a.line === b.line);

// ── Steps ───────────────────────────────────────────────────────────────────

/** The ids of the steps that start open: the failed ones and the running ones. */
export const defaultExpandedSteps = (steps: readonly JobLogStep[]): string[] =>
  steps.filter((step) => step.status === 'failed' || step.status === 'running').map((s) => s.id);

/** `ids` with `id` added, or `ids` itself when it is there already. */
export const withStep = (ids: readonly string[], id: string): readonly string[] =>
  ids.includes(id) ? ids : [...ids, id];

/** `ids` with `id` taken out, or added when it was not there. */
export const toggleStep = (ids: readonly string[], id: string): readonly string[] =>
  ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id];

// ── Search ──────────────────────────────────────────────────────────────────

/** The lines that match a search, in the order of the steps and of the lines. */
export type JobLogMatch = JobLogLineRef;

/**
 * The lines whose text, ANSI codes left out, matches `expression`, among all the steps, open or
 * not. `line` counts from 1.
 */
export const findJobLogMatches = (
  steps: readonly JobLogStep[],
  expression: RegExp | null | 'invalid'
): JobLogMatch[] => {
  const found: JobLogMatch[] = [];
  if (expression === null || expression === 'invalid') return found;
  for (const step of steps) {
    step.lines.forEach((line, index) => {
      expression.lastIndex = 0;
      if (expression.test(stripAnsi(lineText(line))))
        found.push({ step: step.id, line: index + 1 });
    });
  }
  return found;
};

/** The `[start, end)` offsets of the matches of `expression` in `text`, ascending. */
export const matchRanges = (text: string, expression: RegExp | null): [number, number][] => {
  const ranges: [number, number][] = [];
  if (expression === null || text === '') return ranges;
  expression.lastIndex = 0;
  for (const found of text.matchAll(expression)) {
    if (found[0] !== '') ranges.push([found.index, found.index + found[0].length]);
  }
  return ranges;
};

// ── Download ────────────────────────────────────────────────────────────────

/**
 * The log as plain text for a download: each step under a heading with its status and duration,
 * its lines with the ANSI codes stripped, a blank line between steps.
 */
export const jobLogText = (steps: readonly JobLogStep[]): string =>
  steps
    .map((step) => {
      const duration = step.duration === undefined ? '' : `, ${formatJobDuration(step.duration)}`;
      const heading = `=== ${step.name} (${statusLabel(step.status).toLowerCase()}${duration}) ===`;
      return [heading, ...step.lines.map((line) => stripAnsi(lineText(line)))].join('\n');
    })
    .join('\n\n')
    .concat('\n');
