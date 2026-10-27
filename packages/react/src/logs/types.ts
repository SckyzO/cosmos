import type { DateTimeValue } from '../data/time';

/** The severities a log line can carry, from the least to the most severe. */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/** A level as the components know it: one of `LogLevel`, or `unknown` for anything else. */
export type LogLevelKey = LogLevel | 'unknown';

/** Every level, least severe first. */
export const LOG_LEVELS: readonly LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

/** Every level key, `unknown` last: the default set of the level filters. */
export const LOG_LEVEL_KEYS: readonly LogLevelKey[] = [...LOG_LEVELS, 'unknown'];

/** The id of a line: stable and unique in the buffer. */
export type LogLineId = string | number;

/**
 * One record of a log. The host owns the data: it fetches, streams and trims the lines, the
 * components draw what they are given.
 */
export type LogLine = {
  /** Stable and unique in the buffer: it keys the row, and tells which lines are new. */
  id: LogLineId;
  /** A `Date`, a timestamp in milliseconds or an ISO 8601 string. Shown with milliseconds. */
  time: DateTimeValue;
  /**
   * `trace`, `debug`, `info`, `warn`, `error` or `fatal`, in any case. Missing or anything else
   * (`warning`, `notice`…) draws as `unknown`.
   */
  level?: LogLevel | (string & {});
  /** The logger or the service that wrote the line. */
  source?: string;
  /** The text of the line. Drawn as text, never as HTML. */
  message: string;
  /** Structured data of the record (a request id, a duration…). Shown when the row is expanded. */
  fields?: Record<string, unknown>;
  /** A stack trace, shown when the row is expanded. */
  stack?: string;
};

/** The parts of a row a viewer can hide, besides the message. */
export type LogColumn = 'time' | 'level' | 'source';

/** Which end of the buffer the newest line is at. */
export type LogOrder = 'newest-last' | 'newest-first';
