import { describe, expect, it } from 'vitest';
import { compileLogSearch } from './log-lines';
import {
  defaultExpandedSteps,
  findJobLogMatches,
  formatElapsed,
  formatJobDuration,
  jobLogLineHref,
  jobLogText,
  matchRanges,
  parseJobLogHash,
  stepOrigin,
  toggleStep,
  withStep,
  type JobLogStep,
} from './job-log';

const step = (partial: Partial<JobLogStep> & Pick<JobLogStep, 'id'>): JobLogStep => ({
  name: partial.id,
  status: 'passed',
  lines: [],
  ...partial,
});

describe('formatJobDuration', () => {
  it('reads seconds, minutes and hours the way a CI tool does', () => {
    expect(formatJobDuration(3_000)).toBe('3s');
    expect(formatJobDuration(41_900)).toBe('41s');
    expect(formatJobDuration(72_000)).toBe('1m 12s');
    expect(formatJobDuration(123_000)).toBe('2m 03s');
    expect(formatJobDuration(3_723_000)).toBe('1h 02m 03s');
  });

  it('says under a second as such, and nothing for a value that is not a duration', () => {
    expect(formatJobDuration(0)).toBe('<1s');
    expect(formatJobDuration(999)).toBe('<1s');
    expect(formatJobDuration(-5)).toBe('');
    expect(formatJobDuration(Number.NaN)).toBe('');
  });
});

describe('formatElapsed', () => {
  it('reads minutes, seconds and tenths with a plus sign', () => {
    expect(formatElapsed(0)).toBe('+0:00.0');
    expect(formatElapsed(4_250)).toBe('+0:04.2');
    expect(formatElapsed(723_500)).toBe('+12:03.5');
    expect(formatElapsed(3_723_450)).toBe('+1:02:03.4');
  });

  it('clamps a line stamped before its step started', () => {
    expect(formatElapsed(-1_500)).toBe('+0:00.0');
    expect(formatElapsed(Number.NaN)).toBe('+0:00.0');
  });
});

describe('stepOrigin', () => {
  it('takes startedAt, in any form a time takes', () => {
    expect(stepOrigin(step({ id: 'a', startedAt: 1_000 }))).toBe(1_000);
    expect(stepOrigin(step({ id: 'a', startedAt: '1970-01-01T00:00:02.000Z' }))).toBe(2_000);
    expect(stepOrigin(step({ id: 'a', startedAt: new Date(3_000) }))).toBe(3_000);
  });

  it('falls back to the first timestamp of the lines', () => {
    expect(stepOrigin(step({ id: 'a', lines: ['no time', { text: 'x', timestamp: 5_000 }] }))).toBe(
      5_000
    );
  });

  it('is null when nothing says when the step started', () => {
    expect(stepOrigin(step({ id: 'a', lines: ['a', { text: 'b' }] }))).toBeNull();
    expect(stepOrigin(step({ id: 'a', startedAt: 'not a date', lines: ['a'] }))).toBeNull();
  });
});

describe('line links', () => {
  it('builds the href of a line', () => {
    expect(jobLogLineHref('', { step: 'run-tests', line: 6 })).toBe('#run-tests-L6');
    expect(jobLogLineHref('log-', { step: 'build', line: 12 })).toBe('#log-build-L12');
  });

  it('parses a hash back, with or without the #', () => {
    expect(parseJobLogHash('#run-tests-L6')).toEqual({ step: 'run-tests', line: 6 });
    expect(parseJobLogHash('build-L12')).toEqual({ step: 'build', line: 12 });
  });

  it('takes the prefix off, and refuses another log’s anchor', () => {
    expect(parseJobLogHash('#log-build-L2', 'log-')).toEqual({ step: 'build', line: 2 });
    expect(parseJobLogHash('#other-build-L2', 'log-')).toBeNull();
    expect(parseJobLogHash('#log--L2', 'log-')).toBeNull();
  });

  it('refuses a hash that is not a line', () => {
    expect(parseJobLogHash('')).toBeNull();
    expect(parseJobLogHash('#top')).toBeNull();
    expect(parseJobLogHash('#build-L0')).toBeNull();
    expect(parseJobLogHash('#build-Lx')).toBeNull();
  });

  it('decodes an encoded step id, and keeps one that is not encoded', () => {
    expect(parseJobLogHash('#set%20up-L1')).toEqual({ step: 'set up', line: 1 });
    expect(parseJobLogHash('#100%-L1')).toEqual({ step: '100%', line: 1 });
  });

  it('round-trips a link', () => {
    const ref = { step: 'run-tests', line: 42 };
    expect(parseJobLogHash(jobLogLineHref('p-', ref), 'p-')).toEqual(ref);
  });
});

describe('open steps', () => {
  it('opens the failed and the running steps', () => {
    const steps = [
      step({ id: 'a', status: 'passed' }),
      step({ id: 'b', status: 'failed' }),
      step({ id: 'c', status: 'running' }),
      step({ id: 'd', status: 'queued' }),
      step({ id: 'e', status: 'skipped' }),
    ];
    expect(defaultExpandedSteps(steps)).toEqual(['b', 'c']);
  });

  it('adds a step once, and toggles it', () => {
    expect(withStep(['a'], 'b')).toEqual(['a', 'b']);
    const ids = ['a', 'b'];
    expect(withStep(ids, 'b')).toBe(ids);
    expect(toggleStep(ids, 'a')).toEqual(['b']);
    expect(toggleStep(ids, 'c')).toEqual(['a', 'b', 'c']);
  });
});

describe('search across the steps', () => {
  const steps = [
    step({ id: 'setup', lines: ['clone', '\x1b[32mpipeline\x1b[0m ready'] }),
    step({ id: 'tests', lines: [{ text: 'no match' }, 'x', 'PIPELINE failed'] }),
  ];

  it('finds the lines of every step, closed or not, ignoring the ANSI codes and the case', () => {
    const expression = compileLogSearch('pipeline');
    expect(findJobLogMatches(steps, expression)).toEqual([
      { step: 'setup', line: 2 },
      { step: 'tests', line: 3 },
    ]);
  });

  it('does not match inside an escape sequence', () => {
    expect(findJobLogMatches(steps, compileLogSearch('32m'))).toEqual([]);
  });

  it('finds nothing without a search, or with a pattern that does not compile', () => {
    expect(findJobLogMatches(steps, null)).toEqual([]);
    expect(findJobLogMatches(steps, compileLogSearch('(', { regex: true }))).toEqual([]);
  });

  it('gives the offsets of the matches in a line', () => {
    expect(matchRanges('a pipeline of pipelines', compileLogSearch('pipeline') as RegExp)).toEqual([
      [2, 10],
      [14, 22],
    ]);
    expect(matchRanges('abc', null)).toEqual([]);
  });
});

describe('jobLogText', () => {
  it('writes each step under a heading, ANSI stripped', () => {
    const text = jobLogText([
      step({
        id: 'a',
        name: 'Set up',
        duration: 3_000,
        lines: ['one', { text: '\x1b[31mtwo\x1b[0m' }],
      }),
      step({ id: 'b', name: 'Build', status: 'skipped' }),
    ]);
    expect(text).toBe('=== Set up (passed, 3s) ===\none\ntwo\n\n=== Build (skipped) ===\n');
  });
});
