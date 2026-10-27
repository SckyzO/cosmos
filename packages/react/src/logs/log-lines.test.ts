import { describe, expect, it } from 'vitest';
import {
  announceErrors,
  compileLogSearch,
  countLogLevels,
  filterLogLines,
  findLogMatches,
  formatLogField,
  newLinesSince,
  parseLogLevel,
  splitLogMatches,
  stepLogMatch,
  stringifyLogLine,
} from './log-lines';
import type { LogLine } from './types';

const line = (
  id: number,
  level: string | undefined,
  message: string,
  source?: string
): LogLine => ({
  id,
  time: 1_700_000_000_000 + id,
  level,
  message,
  source,
});

const LINES = [
  line(1, 'info', 'GET /api/racks 200', 'api.http'),
  line(2, 'WARN', 'Query timeout after 5 s', 'prom.client'),
  line(3, 'error', 'Query timeout, giving up', 'prom.client'),
  line(4, 'debug', 'Tick 4812', 'scheduler'),
  line(5, 'notice', 'Something else'),
  line(6, undefined, 'No level at all'),
];

describe('parseLogLevel', () => {
  it('reads the six levels in any case', () => {
    expect(parseLogLevel('trace')).toBe('trace');
    expect(parseLogLevel('DEBUG')).toBe('debug');
    expect(parseLogLevel(' Info ')).toBe('info');
    expect(parseLogLevel('WARN')).toBe('warn');
    expect(parseLogLevel('error')).toBe('error');
    expect(parseLogLevel('Fatal')).toBe('fatal');
  });

  it('takes anything else, or nothing, for unknown', () => {
    expect(parseLogLevel('warning')).toBe('unknown');
    expect(parseLogLevel('')).toBe('unknown');
    expect(parseLogLevel(undefined)).toBe('unknown');
  });
});

describe('countLogLevels', () => {
  it('counts every level, with 0 for the ones that are absent', () => {
    expect(countLogLevels(LINES)).toEqual({
      trace: 0,
      debug: 1,
      info: 1,
      warn: 1,
      error: 1,
      fatal: 0,
      unknown: 2,
    });
  });
});

describe('filterLogLines', () => {
  const all = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'unknown'] as const;

  it('returns the same array when nothing is filtered', () => {
    expect(filterLogLines(LINES)).toBe(LINES);
    expect(filterLogLines(LINES, all, [])).toBe(LINES);
  });

  it('keeps the chosen levels', () => {
    expect(filterLogLines(LINES, ['warn', 'error']).map((l) => l.id)).toEqual([2, 3]);
    expect(filterLogLines(LINES, ['unknown']).map((l) => l.id)).toEqual([5, 6]);
  });

  it('shows nothing for an empty list of levels', () => {
    expect(filterLogLines(LINES, [])).toEqual([]);
  });

  it('keeps the chosen sources, and drops lines without one', () => {
    expect(filterLogLines(LINES, undefined, ['prom.client']).map((l) => l.id)).toEqual([2, 3]);
    expect(filterLogLines(LINES, undefined, ['scheduler', 'api.http']).map((l) => l.id)).toEqual([
      1, 4,
    ]);
  });

  it('combines both', () => {
    expect(filterLogLines(LINES, ['error'], ['prom.client']).map((l) => l.id)).toEqual([3]);
  });
});

describe('compileLogSearch', () => {
  it('is no search for an empty term', () => {
    expect(compileLogSearch('')).toBeNull();
  });

  it('matches a plain term case-insensitively, escaping what a pattern would read', () => {
    const expression = compileLogSearch('a.b(')!;
    expect(expression).toBeInstanceOf(RegExp);
    expect((expression as RegExp).test('xA.B(y')).toBe(true);
    (expression as RegExp).lastIndex = 0;
    expect((expression as RegExp).test('axb(')).toBe(false);
  });

  it('reads a pattern when asked, and reports one that does not compile', () => {
    expect(compileLogSearch('time(out|d)', { regex: true })).toBeInstanceOf(RegExp);
    expect(compileLogSearch('(', { regex: true })).toBe('invalid');
  });

  it('refuses a pattern that matches the empty string', () => {
    expect(compileLogSearch('a*', { regex: true })).toBe('invalid');
  });
});

describe('findLogMatches', () => {
  it('lists the lines that match in the message or the source', () => {
    expect(findLogMatches(LINES, compileLogSearch('timeout'))).toEqual([1, 2]);
    expect(findLogMatches(LINES, compileLogSearch('scheduler'))).toEqual([3]);
  });

  it('finds the same lines on a second pass (the global flag keeps no state)', () => {
    const expression = compileLogSearch('query');
    expect(findLogMatches(LINES, expression)).toEqual([1, 2]);
    expect(findLogMatches(LINES, expression)).toEqual([1, 2]);
  });

  it('finds nothing without a search or with an invalid one', () => {
    expect(findLogMatches(LINES, null)).toEqual([]);
    expect(findLogMatches(LINES, 'invalid')).toEqual([]);
  });
});

describe('splitLogMatches', () => {
  it('cuts the text around every match, in order', () => {
    expect(splitLogMatches('a timeout, a Timeout', compileLogSearch('timeout') as RegExp)).toEqual([
      { text: 'a ', match: false },
      { text: 'timeout', match: true },
      { text: ', a ', match: false },
      { text: 'Timeout', match: true },
    ]);
  });

  it('returns the text whole when nothing matches or there is no search', () => {
    expect(splitLogMatches('abc', compileLogSearch('x') as RegExp)).toEqual([
      { text: 'abc', match: false },
    ]);
    expect(splitLogMatches('abc', null)).toEqual([{ text: 'abc', match: false }]);
  });

  it('keeps markup as text', () => {
    expect(
      splitLogMatches('<img src=x onerror=alert(1)>', compileLogSearch('img') as RegExp)
    ).toEqual([
      { text: '<', match: false },
      { text: 'img', match: true },
      { text: ' src=x onerror=alert(1)>', match: false },
    ]);
  });
});

describe('stepLogMatch', () => {
  it('moves to the next and the previous match', () => {
    expect(stepLogMatch(0, 3, 1)).toBe(1);
    expect(stepLogMatch(2, 3, -1)).toBe(1);
  });

  it('wraps around the ends', () => {
    expect(stepLogMatch(2, 3, 1)).toBe(0);
    expect(stepLogMatch(0, 3, -1)).toBe(2);
  });

  it('stays at 0 without a match, and clamps an active match past the end', () => {
    expect(stepLogMatch(4, 0, 1)).toBe(0);
    expect(stepLogMatch(9, 3, 1)).toBe(0);
  });
});

describe('newLinesSince', () => {
  it('returns the lines after the one named', () => {
    expect(newLinesSince(LINES, 4).map((l) => l.id)).toEqual([5, 6]);
    expect(newLinesSince(LINES, 6)).toEqual([]);
  });

  it('counts every line as new when the buffer was empty or no longer holds the line', () => {
    expect(newLinesSince(LINES, null)).toBe(LINES);
    expect(newLinesSince(LINES, 99)).toBe(LINES);
  });
});

describe('announceErrors', () => {
  const errors = [
    line(10, 'error', 'disk full', 'node-a'),
    line(11, 'fatal', 'out of memory'),
    line(12, 'error', 'a'),
    line(13, 'error', 'b'),
  ];

  it('reads the error and fatal lines that came after the last one seen', () => {
    const lines = [...LINES, errors[0]!, line(11, 'info', 'ok')];
    expect(announceErrors(lines, 6)).toBe('error node-a: disk full');
  });

  it('says nothing for an info line', () => {
    expect(announceErrors([...LINES, line(10, 'info', 'ok')], 6)).toBe('');
    expect(announceErrors([...LINES, line(10, 'warn', 'careful')], 6)).toBe('');
  });

  it('says nothing when nothing is new, on the first lines, or when the buffer was replaced', () => {
    expect(announceErrors(LINES, 6)).toBe('');
    expect(announceErrors([...LINES, ...errors], null)).toBe('');
    expect(announceErrors(errors, 99)).toBe('');
  });

  it('reads three lines at most, then counts the rest', () => {
    expect(announceErrors([...LINES, ...errors], 6)).toBe(
      'error node-a: disk full. fatal: out of memory. error: a. And 1 more.'
    );
  });
});

describe('formatLogField', () => {
  it('keeps a string and writes the rest as JSON', () => {
    expect(formatLogField('abc')).toBe('abc');
    expect(formatLogField(42)).toBe('42');
    expect(formatLogField(null)).toBe('null');
    expect(formatLogField({ a: [1, 2] })).toBe('{"a":[1,2]}');
    expect(formatLogField(undefined)).toBe('undefined');
  });

  it('survives a value JSON cannot write', () => {
    const loop: Record<string, unknown> = {};
    loop.self = loop;
    expect(formatLogField(loop)).toBe('[object Object]');
    expect(formatLogField(10n)).toBe('10');
  });
});

describe('stringifyLogLine', () => {
  it('writes the record as indented JSON', () => {
    expect(JSON.parse(stringifyLogLine(LINES[0]!))).toMatchObject({
      id: 1,
      message: 'GET /api/racks 200',
    });
  });

  it('writes a bigint field, and does not throw on a circular one', () => {
    expect(stringifyLogLine({ ...LINES[0]!, fields: { n: 10n } })).toContain('"n": "10"');
    const loop: Record<string, unknown> = {};
    loop.self = loop;
    expect(stringifyLogLine({ ...LINES[0]!, fields: loop })).toContain('[unserializable]');
  });
});
