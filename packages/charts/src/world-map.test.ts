import { describe, expect, it } from 'vitest';
import world110 from 'world-atlas/countries-110m.json';
import world50 from 'world-atlas/countries-50m.json';
import { clamp, ranked, scaleOf, STEPS, stepOf, walk } from './world-map';
import { NUMERIC_TO_ALPHA2 } from './world-map-codes';

// Fifteen values: three per step.
const FIFTEEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

describe('scaleOf', () => {
  it('cuts the sorted values in five steps of about as many values', () => {
    const scale = scaleOf(FIFTEEN);
    expect(scale?.thresholds).toEqual([4, 7, 10, 13]);
    const counts = Array.from({ length: STEPS }, () => 0);
    for (const value of FIFTEEN) counts[stepOf(value, scale!)]++;
    expect(counts).toEqual([3, 3, 3, 3, 3]);
  });

  it('does not depend on the order of the values', () => {
    expect(scaleOf([...FIFTEEN].reverse())).toEqual(scaleOf(FIFTEEN));
  });

  it('makes one large value take the top step without stretching the others', () => {
    const scale = scaleOf([10, 11, 12, 13, 14, 15, 16, 17, 18, 1_000_000]) as NonNullable<
      ReturnType<typeof scaleOf>
    >;
    expect(scale.thresholds).toEqual([12, 14, 16, 18]);
    expect(stepOf(1_000_000, scale)).toBe(4);
    expect(stepOf(10, scale)).toBe(0);
  });

  it('prints the lowest value, then each threshold, as the lower bounds of the legend', () => {
    expect(scaleOf(FIFTEEN)?.bounds).toEqual([1, 4, 7, 10, 13]);
  });

  it('leaves a step empty when values repeat', () => {
    const scale = scaleOf([5, 5, 5, 5, 5]) as NonNullable<ReturnType<typeof scaleOf>>;
    expect(scale.thresholds).toEqual([5, 5, 5, 5]);
    expect(stepOf(5, scale)).toBe(4);
  });

  it('puts a single value in the top step', () => {
    const scale = scaleOf([42]) as NonNullable<ReturnType<typeof scaleOf>>;
    expect(scale.bounds).toEqual([42, 42, 42, 42, 42]);
    expect(stepOf(42, scale)).toBe(4);
  });

  it('has no scale without a finite value', () => {
    expect(scaleOf([])).toBeUndefined();
    expect(scaleOf([Number.NaN, Infinity])).toBeUndefined();
  });

  it('ignores a value that is not finite', () => {
    expect(scaleOf([...FIFTEEN, Number.NaN])).toEqual(scaleOf(FIFTEEN));
  });

  describe('with min and max', () => {
    it('clamps the values before the quantiles are taken', () => {
      // 1 to 3 count as 4 and 13 to 15 as 12: the values left are 4 4 4 4 5 … 11 12 12 12 12.
      const scale = scaleOf(FIFTEEN, 4, 12) as NonNullable<ReturnType<typeof scaleOf>>;
      expect(scale.thresholds).toEqual([4, 7, 10, 12]);
      expect(scale.bounds).toEqual([4, 4, 7, 10, 12]);
    });

    it('prints a pinned min as the first bound, even under every value', () => {
      expect(scaleOf(FIFTEEN, 0)?.bounds[0]).toBe(0);
      expect(scaleOf(FIFTEEN)?.bounds[0]).toBe(1);
    });

    it('gives a value outside the ends the step of the end', () => {
      const scale = scaleOf(FIFTEEN, 4, 12) as NonNullable<ReturnType<typeof scaleOf>>;
      expect(stepOf(1, scale)).toBe(stepOf(4, scale));
      expect(stepOf(99, scale)).toBe(stepOf(12, scale));
      expect(stepOf(99, scale)).toBe(4);
    });

    it('swaps the ends when they come the wrong way round', () => {
      expect(scaleOf(FIFTEEN, 12, 4)).toEqual(scaleOf(FIFTEEN, 4, 12));
    });

    it('takes the ends even when there is no value left in them', () => {
      const scale = scaleOf([1, 2, 3], 10, 20) as NonNullable<ReturnType<typeof scaleOf>>;
      expect(scale.thresholds).toEqual([10, 10, 10, 10]);
      expect(stepOf(1, scale)).toBe(4);
    });
  });
});

describe('stepOf', () => {
  const scale = scaleOf(FIFTEEN) as NonNullable<ReturnType<typeof scaleOf>>;

  it('puts a value on a threshold in the higher step', () => {
    expect([3, 4, 6, 7, 9, 10, 12, 13].map((value) => stepOf(value, scale))).toEqual([
      0, 1, 1, 2, 2, 3, 3, 4,
    ]);
  });

  it('puts the lowest value in step 0 and the highest in step 4', () => {
    expect(stepOf(1, scale)).toBe(0);
    expect(stepOf(15, scale)).toBe(4);
  });
});

describe('clamp', () => {
  it('keeps a value inside the ends, and leaves an end that is not given open', () => {
    expect(clamp(5, 1, 3)).toBe(3);
    expect(clamp(0, 1, 3)).toBe(1);
    expect(clamp(2, 1, 3)).toBe(2);
    expect(clamp(-9)).toBe(-9);
    expect(clamp(9, undefined, 3)).toBe(3);
  });
});

describe('ranked', () => {
  it('lists the countries with a value, largest first and by name for equal values', () => {
    const list = ranked([
      { name: 'Spain', value: 5 },
      { name: 'Chad' },
      { name: 'Italy', value: 9 },
      { name: 'France', value: 5 },
    ]);
    expect(list.map((country) => country.name)).toEqual(['Italy', 'France', 'Spain']);
  });

  it('keeps a value of 0', () => {
    expect(ranked([{ name: 'a', value: 0 }])).toHaveLength(1);
  });
});

describe('walk', () => {
  const order = [{ code: 'US' }, { code: 'FR' }, { code: 'DE' }];

  it('moves along the order and stops at the ends', () => {
    expect(walk(order, 'US', 1)?.code).toBe('FR');
    expect(walk(order, 'DE', -1)?.code).toBe('FR');
    expect(walk(order, 'DE', 1)?.code).toBe('DE');
    expect(walk(order, 'US', -1)?.code).toBe('US');
  });

  it('starts at the first country when there is no current one', () => {
    expect(walk(order, undefined, 1)?.code).toBe('US');
    expect(walk(order, 'ZZ', -1)?.code).toBe('US');
  });

  it('has nowhere to go without countries', () => {
    expect(walk([], undefined, 1)).toBeUndefined();
  });
});

describe('NUMERIC_TO_ALPHA2', () => {
  const idsOf = (topology: typeof world110) =>
    (topology.objects.countries.geometries as { id?: string }[]).flatMap((geometry) =>
      geometry.id === undefined ? [] : [geometry.id]
    );

  it.each([
    ['250', 'FR'],
    ['840', 'US'],
    ['076', 'BR'],
    ['036', 'AU'],
    ['826', 'GB'],
    ['276', 'DE'],
    ['392', 'JP'],
    ['356', 'IN'],
    ['710', 'ZA'],
    ['484', 'MX'],
    ['410', 'KR'],
    ['528', 'NL'],
  ])('maps %s to %s', (numeric, alpha2) => {
    expect(NUMERIC_TO_ALPHA2[numeric]).toBe(alpha2);
  });

  it('has an entry for every feature id of countries-110m', () => {
    const ids = idsOf(world110);
    expect(ids.length).toBeGreaterThan(170);
    expect(ids.filter((id) => !(id in NUMERIC_TO_ALPHA2))).toEqual([]);
  });

  it('has an entry for every feature id of countries-50m', () => {
    const ids = idsOf(world50 as unknown as typeof world110);
    expect(ids.length).toBeGreaterThan(230);
    expect(ids.filter((id) => !(id in NUMERIC_TO_ALPHA2))).toEqual([]);
  });

  it('is made of three-digit numeric codes and upper-case alpha-2 codes, each used once', () => {
    const entries = Object.entries(NUMERIC_TO_ALPHA2);
    expect(entries).toHaveLength(249);
    for (const [numeric, alpha2] of entries) {
      expect(numeric).toMatch(/^\d{3}$/);
      expect(alpha2).toMatch(/^[A-Z]{2}$/);
    }
    expect(new Set(entries.map(([, alpha2]) => alpha2)).size).toBe(entries.length);
  });
});
