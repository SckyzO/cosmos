import { LOG_LEVELS, LOG_LEVEL_KEYS, type LogLevel, type LogLevelKey, type LogLine } from './types';

// Pure helpers behind the log components: no DOM, no timer, so the level parsing, the filters,
// the search, the window maths and the announcement are tested in Node.

const KNOWN = new Set<string>(LOG_LEVELS);

/** The level of a line: `level` lower-cased, or `unknown` when it is missing or not a `LogLevel`. */
export const parseLogLevel = (level: string | undefined): LogLevelKey => {
  const key = level?.trim().toLowerCase();
  return key !== undefined && KNOWN.has(key) ? (key as LogLevel) : 'unknown';
};

/** Lines per level, every level present (0 when none): the counts of the toolbar's toggles. */
export const countLogLevels = (lines: readonly LogLine[]): Record<LogLevelKey, number> => {
  const counts = Object.fromEntries(LOG_LEVEL_KEYS.map((key) => [key, 0])) as Record<
    LogLevelKey,
    number
  >;
  for (const line of lines) counts[parseLogLevel(line.level)]++;
  return counts;
};

/**
 * The lines the filters keep. `levels` and `sources` are the ones to show: left out (`undefined`)
 * means no filter on that side, and an empty `sources` too (nothing chosen is "all sources"),
 * while an empty `levels` shows nothing. A line without a source passes the source filter only
 * when none is chosen. Returns `lines` itself when nothing is filtered.
 */
export const filterLogLines = (
  lines: readonly LogLine[],
  levels?: readonly LogLevelKey[],
  sources?: readonly string[]
): readonly LogLine[] => {
  const byLevel = levels !== undefined && levels.length < LOG_LEVEL_KEYS.length;
  const bySource = sources !== undefined && sources.length > 0;
  if (!byLevel && !bySource) return lines;
  const levelSet = new Set<string>(levels);
  const sourceSet = new Set<string>(sources);
  return lines.filter(
    (line) =>
      (!byLevel || levelSet.has(parseLogLevel(line.level))) &&
      (!bySource || (line.source !== undefined && sourceSet.has(line.source)))
  );
};

// ── Search ──────────────────────────────────────────────────────────────────

export type LogSearchOptions = {
  /** Read the term as a regular expression. Default `false`: a plain, case-insensitive text. */
  regex?: boolean;
};

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The expression that finds `term` (case-insensitive, global), `null` for an empty term and
 * `'invalid'` for a regular expression that does not compile. A term that matches the empty
 * string (`a*`) is no search: every position would match.
 */
export const compileLogSearch = (
  term: string,
  { regex = false }: LogSearchOptions = {}
): RegExp | null | 'invalid' => {
  if (term === '') return null;
  let expression: RegExp;
  try {
    expression = new RegExp(regex ? term : escapeRegExp(term), 'gi');
  } catch {
    return 'invalid';
  }
  return expression.test('') ? 'invalid' : expression;
};

const testLine = (expression: RegExp, line: LogLine) => {
  expression.lastIndex = 0;
  if (expression.test(line.message)) return true;
  if (line.source === undefined) return false;
  expression.lastIndex = 0;
  return expression.test(line.source);
};

/** The indexes, in `lines`, of the lines whose message or source match. Ascending. */
export const findLogMatches = (
  lines: readonly LogLine[],
  expression: RegExp | null | 'invalid'
): number[] => {
  const found: number[] = [];
  if (expression === null || expression === 'invalid') return found;
  lines.forEach((line, index) => {
    if (testLine(expression, line)) found.push(index);
  });
  return found;
};

export type LogSegment = { text: string; match: boolean };

/** `text` cut into the parts that match and the parts that do not, in order. */
export const splitLogMatches = (text: string, expression: RegExp | null): LogSegment[] => {
  if (expression === null || text === '') return [{ text, match: false }];
  const segments: LogSegment[] = [];
  let last = 0;
  expression.lastIndex = 0;
  for (const found of text.matchAll(expression)) {
    const start = found.index;
    if (found[0] === '') continue;
    if (start > last) segments.push({ text: text.slice(last, start), match: false });
    segments.push({ text: found[0], match: true });
    last = start + found[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), match: false });
  return segments.length > 0 ? segments : [{ text, match: false }];
};

/**
 * The match after (`1`) or before (`-1`) `active`, wrapping around the ends: the first match
 * follows the last. No match, no move (0).
 */
export const stepLogMatch = (active: number, count: number, direction: 1 | -1): number => {
  if (!(count > 0)) return 0;
  const from = Math.min(Math.max(0, active), count - 1);
  return (from + direction + count) % count;
};

// ── Following the end ───────────────────────────────────────────────────────

const lastIndexOfId = (lines: readonly LogLine[], id: LogLine['id']): number => {
  for (let index = lines.length - 1; index >= 0; index--) if (lines[index]!.id === id) return index;
  return -1;
};

/**
 * The lines that came after the line `id` in `lines` (chronological): what arrived while the
 * viewer was paused. `null` means the buffer was empty then, so every line is new, and so is a
 * buffer that no longer holds `id` (trimmed or replaced).
 */
export const newLinesSince = (
  lines: readonly LogLine[],
  id: LogLine['id'] | null
): readonly LogLine[] => {
  if (id === null) return lines;
  const at = lastIndexOfId(lines, id);
  return at < 0 ? lines : lines.slice(at + 1);
};

/**
 * The text a screen reader gets for the error and fatal lines that arrived, or `''` when none
 * did. `known` is the id of the last line seen before: a buffer that no longer holds it was
 * replaced, and announces nothing. At most `limit` lines are read, then the number left.
 */
export const announceErrors = (
  lines: readonly LogLine[],
  known: LogLine['id'] | null,
  limit = 3
): string => {
  if (known === null) return '';
  const at = lastIndexOfId(lines, known);
  if (at < 0) return '';
  const after = lines.slice(at + 1);
  const errors = after.filter((line) => {
    const level = parseLogLevel(line.level);
    return level === 'error' || level === 'fatal';
  });
  if (errors.length === 0) return '';
  const spoken = errors
    .slice(0, limit)
    .map(
      (line) =>
        `${parseLogLevel(line.level)}${line.source ? ` ${line.source}` : ''}: ${line.message}`
    );
  const more = errors.length - spoken.length;
  return more > 0 ? `${spoken.join('. ')}. And ${more} more.` : spoken.join('. ');
};

// ── Fields ──────────────────────────────────────────────────────────────────

/** A field value as text: a string as it is, anything else as JSON (`String` when it has none). */
export const formatLogField = (value: unknown): string => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

/** The whole record as indented JSON, for the raw view. Never throws: a circular field reads `[unserializable]`. */
export const stringifyLogLine = (line: LogLine): string => {
  try {
    return JSON.stringify(
      line,
      (_key, value: unknown) => (typeof value === 'bigint' ? value.toString() : value),
      2
    );
  } catch {
    return JSON.stringify({ ...line, fields: '[unserializable]' }, null, 2);
  }
};
