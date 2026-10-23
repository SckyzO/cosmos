import { describe, expect, it } from 'vitest';
import { mergeOptions } from './mergeOptions';

const deepFreeze = <T>(value: T): T => {
  if (typeof value === 'object' && value !== null) {
    for (const entry of Object.values(value)) deepFreeze(entry);
    Object.freeze(value);
  }
  return value;
};

describe('mergeOptions', () => {
  it('merges plain objects key by key and keeps what the override does not name', () => {
    const base = { grid: { borderColor: '#eee', strokeDashArray: 4 }, colors: ['#111'] };
    const merged = mergeOptions(base, { grid: { borderColor: '#f00' } });
    expect(merged).toEqual({
      grid: { borderColor: '#f00', strokeDashArray: 4 },
      colors: ['#111'],
    });
  });

  it('adds what the base does not have', () => {
    expect(mergeOptions({ a: 1 }, { chart: { toolbar: { show: true } } })).toEqual({
      a: 1,
      chart: { toolbar: { show: true } },
    });
  });

  it('replaces an array, a function or a value instead of merging into it', () => {
    const formatter = () => 'override';
    const merged = mergeOptions(
      { colors: ['#111', '#222'], yaxis: { labels: { formatter: () => 'base' } }, stroke: 2 },
      { colors: ['#333'], yaxis: { labels: { formatter } }, stroke: { width: 3 } }
    );
    expect(merged.colors).toEqual(['#333']);
    expect(merged.yaxis.labels.formatter).toBe(formatter);
    expect(merged.stroke).toEqual({ width: 3 });
  });

  it('leaves the base where the override is undefined', () => {
    expect(mergeOptions({ colors: ['#111'], a: 1 }, { colors: undefined, a: undefined })).toEqual({
      colors: ['#111'],
      a: 1,
    });
  });

  it('changes neither argument', () => {
    const base = deepFreeze({ grid: { borderColor: '#eee' }, colors: ['#111'] });
    const override = deepFreeze({ grid: { show: false }, legend: { markers: { size: 5 } } });
    const merged = mergeOptions(base, override);
    expect(merged.grid).toEqual({ borderColor: '#eee', show: false });
    expect(base).toEqual({ grid: { borderColor: '#eee' }, colors: ['#111'] });
    expect(override).toEqual({ grid: { show: false }, legend: { markers: { size: 5 } } });
  });

  it('shares no object or array with the override, which ApexCharts writes to', () => {
    const override = {
      xaxis: { labels: { show: true } },
      colors: ['#111'],
      legend: { a: [{ b: 1 }] },
    };
    const merged = mergeOptions(
      { xaxis: { type: 'category' } },
      override
    ) as unknown as typeof override;
    merged.xaxis.labels.show = false;
    merged.colors.push('#222');
    merged.legend.a[0].b = 2;
    expect(override).toEqual({
      xaxis: { labels: { show: true } },
      colors: ['#111'],
      legend: { a: [{ b: 1 }] },
    });
  });

  it('keeps functions and other instances as they are', () => {
    const formatter = () => 'x';
    const date = new Date(0);
    const merged = mergeOptions({}, { a: { formatter, date } });
    expect(merged).toEqual({ a: { formatter, date } });
    expect((merged as { a: { formatter: unknown } }).a.formatter).toBe(formatter);
    expect((merged as { a: { date: unknown } }).a.date).toBe(date);
  });

  it('ignores a __proto__ key, at any depth', () => {
    const hostile = JSON.parse(
      '{"__proto__":{"polluted":true},"a":{"__proto__":{"polluted":true}}}'
    );
    const merged = mergeOptions({}, hostile) as { a: object };
    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
    expect('polluted' in merged).toBe(false);
    expect('polluted' in merged.a).toBe(false);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });
});
