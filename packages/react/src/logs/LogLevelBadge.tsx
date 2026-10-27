import { clsx } from 'clsx';
import { parseLogLevel } from './log-lines';
import type { LogLevelKey } from './types';

export type LogTone = 'terminal' | 'surface';

export type LogLevelBadgeProps = {
  /**
   * The level of the line, in any case: `trace`, `debug`, `info`, `warn`, `error` or `fatal`.
   * Missing, or anything else, draws as `unknown`.
   */
  level?: string;
  /**
   * The ground it sits on. `surface` (default) follows the theme, for a table or a card;
   * `terminal` is for the dark panel of a `LogViewer`, dark in every theme.
   */
  tone?: LogTone;
  className?: string;
};

/** The text of each level: the badge never says it with colour alone. */
export const LOG_LEVEL_LABEL: Record<LogLevelKey, string> = {
  trace: 'TRACE',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  fatal: 'FATAL',
  unknown: 'UNKNOWN',
};

// Each pair holds 4.5:1 on its own fill, and the fill on the ground it sits on: the terminal ones
// use the fixed palette (the themes redefine gray), the surface ones step up in the dark themes.
const BADGE: Record<LogTone, Record<LogLevelKey, string>> = {
  terminal: {
    trace: 'bg-slate-800 text-slate-400',
    debug: 'bg-slate-800 text-slate-300',
    info: 'bg-sky-950 text-sky-300',
    warn: 'bg-amber-950 text-amber-300',
    error: 'bg-red-950 text-red-300',
    fatal: 'bg-red-600 text-white',
    unknown: 'bg-slate-800 text-slate-300',
  },
  surface: {
    trace: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    debug: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    warn: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    error: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    fatal: 'bg-red-600 text-white',
    unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
};

/** The colour of a line's message, by level, on each tone. Internal to the package. */
export const LOG_MESSAGE_CLASS: Record<LogTone, Record<LogLevelKey, string>> = {
  terminal: {
    trace: 'text-slate-400',
    debug: 'text-slate-400',
    info: 'text-slate-200',
    warn: 'text-amber-300',
    error: 'text-red-300',
    fatal: 'text-red-300 font-semibold',
    unknown: 'text-slate-200',
  },
  surface: {
    trace: 'text-gray-600 dark:text-gray-400',
    debug: 'text-gray-600 dark:text-gray-400',
    info: 'text-gray-800 dark:text-gray-200',
    warn: 'text-amber-800 dark:text-amber-300',
    error: 'text-red-700 dark:text-red-300',
    fatal: 'text-red-700 dark:text-red-300 font-semibold',
    unknown: 'text-gray-800 dark:text-gray-200',
  },
};

/**
 * LogLevelBadge — the level of a log line as a short label in its colour (`ERROR`, `WARN`…). The
 * word carries the level, the colour only backs it. Use it in a table cell, a detail panel or a
 * card; `LogViewer` draws it in every row.
 */
export const LogLevelBadge = ({ level, tone = 'surface', className }: LogLevelBadgeProps) => {
  const key = parseLogLevel(level);
  return (
    <span
      data-level={key}
      className={clsx(
        'text-3xs inline-block min-w-[7ch] shrink-0 rounded-sm px-1.5 text-center font-mono leading-[1.125rem] font-semibold',
        BADGE[tone][key],
        className
      )}
    >
      {LOG_LEVEL_LABEL[key]}
    </span>
  );
};
