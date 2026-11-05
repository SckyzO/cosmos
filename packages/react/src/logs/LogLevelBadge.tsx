import { clsx } from 'clsx';
import { Badge, type BadgeAppearance } from '../ui/Badge';
import type { Intent } from '../ui/intent';
import { parseLogLevel } from './log-lines';
import { LOG_VIEWER_LABELS, type LogViewerLabels } from './labels';
import type { LogLevelKey } from './types';
import { useLogViewerLabels } from './useLogLabels';

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
  /** The text of the levels (`labels.warn`), over `LabelsProvider`'s `logViewer` and the English defaults. */
  labels?: Partial<LogViewerLabels>;
  className?: string;
};

/**
 * The English text of each level: the badge never says it with colour alone. The badge reads the
 * `logViewer` labels, which an app translates.
 */
export const LOG_LEVEL_LABEL: Record<LogLevelKey, string> = {
  trace: LOG_VIEWER_LABELS.trace,
  debug: LOG_VIEWER_LABELS.debug,
  info: LOG_VIEWER_LABELS.info,
  warn: LOG_VIEWER_LABELS.warn,
  error: LOG_VIEWER_LABELS.error,
  fatal: LOG_VIEWER_LABELS.fatal,
  unknown: LOG_VIEWER_LABELS.unknown,
};

// The terminal tone is its own recipe: a dark panel in every theme, so the pairs come from the
// fixed palette (the themes redefine gray) and each holds 4.5:1 on its own fill and on the panel.
const TERMINAL_BADGE: Record<LogLevelKey, string> = {
  trace: 'bg-slate-800 text-slate-400',
  debug: 'bg-slate-800 text-slate-300',
  info: 'bg-sky-950 text-sky-300',
  warn: 'bg-amber-950 text-amber-300',
  error: 'bg-red-950 text-red-300',
  fatal: 'bg-red-600 text-white',
  unknown: 'bg-slate-800 text-slate-300',
};

// The surface tone is a `Badge`, like `StatusBadge` beside it: the level picks its intent, and
// `fatal` is the solid one.
const SURFACE_BADGE: Record<LogLevelKey, { intent: Intent; appearance?: BadgeAppearance }> = {
  trace: { intent: 'neutral' },
  debug: { intent: 'neutral' },
  info: { intent: 'info' },
  warn: { intent: 'warning' },
  error: { intent: 'danger' },
  fatal: { intent: 'danger', appearance: 'solid' },
  unknown: { intent: 'neutral' },
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
 * card; `LogViewer` draws it in every row. On the `surface` tone it is a `Badge`, a pill like
 * `StatusBadge`; on the `terminal` tone it keeps the monospace face of the panel.
 */
export const LogLevelBadge = ({
  level,
  tone = 'surface',
  labels: ownLabels,
  className,
}: LogLevelBadgeProps) => {
  const labels = useLogViewerLabels(ownLabels);
  const key = parseLogLevel(level);
  if (tone === 'surface')
    return (
      // `data-level` goes on a wrapper: a `Badge` takes no attributes of its own.
      <span data-level={key} className={clsx('inline-flex shrink-0', className)}>
        <Badge size="sm" className="min-w-14 justify-center" {...SURFACE_BADGE[key]}>
          {labels[key]}
        </Badge>
      </span>
    );
  return (
    <span
      data-level={key}
      className={clsx(
        'text-3xs inline-block min-w-[7ch] shrink-0 rounded-sm px-1.5 text-center font-mono leading-[1.125rem] font-semibold',
        TERMINAL_BADGE[key],
        className
      )}
    >
      {labels[key]}
    </span>
  );
};
