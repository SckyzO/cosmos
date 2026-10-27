import { describe, expect, it } from 'vitest';
import {
  SEVERITY_ORDER,
  attentionCount,
  compareSeverity,
  countStatuses,
  countsText,
  flattenChecks,
  groupWorst,
  latestCheck,
  sortChecks,
  sortGroups,
  worstStatus,
  type HealthCheck,
  type HealthCheckGroup,
} from './health';
import type { HealthStatus } from './types';

const check = (id: string, status: HealthStatus, checkedAt?: number): HealthCheck => ({
  id,
  name: id,
  status,
  checkedAt,
});

describe('severity order', () => {
  it('lists CRIT, WARN, UNKNOWN, INFO, then OK', () => {
    expect(SEVERITY_ORDER).toEqual(['CRIT', 'WARN', 'UNKNOWN', 'INFO', 'OK']);
  });

  it('compares along that order', () => {
    const shuffled: HealthStatus[] = ['OK', 'UNKNOWN', 'CRIT', 'INFO', 'WARN'];
    expect([...shuffled].sort(compareSeverity)).toEqual(SEVERITY_ORDER);
    expect(compareSeverity('WARN', 'WARN')).toBe(0);
  });
});

describe('worstStatus', () => {
  it('picks the worst of the statuses', () => {
    expect(worstStatus(['OK', 'WARN', 'OK'])).toBe('WARN');
    expect(worstStatus(['OK', 'WARN', 'CRIT'])).toBe('CRIT');
    expect(worstStatus(['OK', 'INFO'])).toBe('INFO');
    expect(worstStatus(['OK', 'UNKNOWN', 'INFO'])).toBe('UNKNOWN');
    expect(worstStatus(['OK', 'OK'])).toBe('OK');
  });

  it('reads UNKNOWN when there is nothing to look at', () => {
    expect(worstStatus([])).toBe('UNKNOWN');
  });
});

describe('counts', () => {
  const checks = [check('a', 'OK'), check('b', 'OK'), check('c', 'WARN'), check('d', 'UNKNOWN')];

  it('counts each status', () => {
    expect(countStatuses(checks)).toEqual({ OK: 2, WARN: 1, CRIT: 0, UNKNOWN: 1, INFO: 0 });
  });

  it('writes the statuses present, worst first', () => {
    expect(countsText(countStatuses(checks))).toBe('1 Warning · 1 Unknown · 2 OK');
    expect(countsText(countStatuses([]))).toBe('');
  });

  it('counts the checks that need a look', () => {
    expect(attentionCount(countStatuses(checks))).toBe(2);
  });
});

describe('sortChecks', () => {
  it('puts the worst first and keeps the order of equals', () => {
    const sorted = sortChecks([
      check('ok-1', 'OK'),
      check('warn-1', 'WARN'),
      check('crit', 'CRIT'),
      check('ok-2', 'OK'),
      check('warn-2', 'WARN'),
      check('unknown', 'UNKNOWN'),
    ]);
    expect(sorted.map((c) => c.id)).toEqual([
      'crit',
      'warn-1',
      'warn-2',
      'unknown',
      'ok-1',
      'ok-2',
    ]);
  });

  it('leaves its input alone', () => {
    const input = [check('a', 'OK'), check('b', 'CRIT')];
    sortChecks(input);
    expect(input.map((c) => c.id)).toEqual(['a', 'b']);
  });
});

describe('groups', () => {
  const tree: HealthCheckGroup[] = [
    { id: 'cache', name: 'Cache', checks: [check('redis', 'OK')] },
    {
      id: 'api',
      name: 'API',
      checks: [check('http', 'OK')],
      groups: [
        { id: 'db', name: 'Database', checks: [check('primary', 'CRIT'), check('replica', 'OK')] },
      ],
    },
    { id: 'queue', name: 'Queue', checks: [check('jobs', 'WARN')] },
  ];

  it('flattens depth first', () => {
    expect(flattenChecks(tree).map((c) => c.id)).toEqual([
      'redis',
      'http',
      'primary',
      'replica',
      'jobs',
    ]);
  });

  it('rolls the worst status up through nested groups', () => {
    expect(groupWorst(tree[1]!)).toBe('CRIT');
    expect(groupWorst(tree[0]!)).toBe('OK');
    expect(groupWorst({ id: 'empty', name: 'Empty' })).toBe('UNKNOWN');
  });

  it('sorts groups by their worst check, and the checks inside them', () => {
    const sorted = sortGroups(tree);
    expect(sorted.map((g) => g.id)).toEqual(['api', 'queue', 'cache']);
    expect(sorted[0]!.groups![0]!.checks!.map((c) => c.id)).toEqual(['primary', 'replica']);
  });
});

describe('latestCheck', () => {
  it('returns the most recent checkedAt', () => {
    expect(latestCheck([check('a', 'OK', 100), check('b', 'OK', 300), check('c', 'OK')])).toBe(300);
  });

  it('is undefined when no check has a time', () => {
    expect(latestCheck([check('a', 'OK')])).toBeUndefined();
  });
});
