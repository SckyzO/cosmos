import { describe, expect, it } from 'vitest';
import { buildPageList } from './pageList';

describe('buildPageList', () => {
  it('lists every page when there are 7 or fewer, whichever is active', () => {
    expect(buildPageList(0, 0)).toEqual([]);
    expect(buildPageList(0, 1)).toEqual([0]);
    expect(buildPageList(2, 5)).toEqual([0, 1, 2, 3, 4]);
    for (let current = 0; current < 7; current++) {
      expect(buildPageList(current, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    }
  });

  it('starts collapsing at 8 pages', () => {
    expect(buildPageList(0, 8)).toEqual([0, 1, '...', 7]);
    expect(buildPageList(1, 8)).toEqual([0, 1, 2, '...', 7]);
    expect(buildPageList(7, 8)).toEqual([0, '...', 6, 7]);
  });

  it('shows the first page, a window of three around the active page, and the last', () => {
    expect(buildPageList(10, 20)).toEqual([0, '...', 9, 10, 11, '...', 19]);
    expect(buildPageList(3, 20)).toEqual([0, '...', 2, 3, 4, '...', 19]);
    expect(buildPageList(16, 20)).toEqual([0, '...', 15, 16, 17, '...', 19]);
  });

  it('keeps the first pages contiguous near the start and the last ones near the end', () => {
    expect(buildPageList(0, 20)).toEqual([0, 1, '...', 19]);
    expect(buildPageList(2, 20)).toEqual([0, 1, 2, 3, '...', 19]);
    expect(buildPageList(17, 20)).toEqual([0, '...', 16, 17, 18, 19]);
    expect(buildPageList(19, 20)).toEqual([0, '...', 18, 19]);
  });

  describe.each([1, 2, 7, 8, 9, 10, 25, 100])('for %i pages, whichever is active', (total) => {
    const lists = Array.from({ length: total }, (_, current) => ({
      current,
      list: buildPageList(current, total),
    }));
    const numbers = (list: (number | '...')[]) => list.filter((p): p is number => p !== '...');

    it('always starts at the first page and ends at the last', () => {
      for (const { current, list } of lists) {
        expect(list[0], `page ${current}`).toBe(0);
        expect(list.at(-1), `page ${current}`).toBe(total - 1);
      }
    });

    it('always contains the active page and its neighbors', () => {
      for (const { current, list } of lists) {
        const shown = numbers(list);
        expect(shown, `page ${current}`).toContain(current);
        if (current > 0) expect(shown, `page ${current}`).toContain(current - 1);
        if (current < total - 1) expect(shown, `page ${current}`).toContain(current + 1);
      }
    });

    it('lists pages in increasing order, without duplicates or out-of-range pages', () => {
      for (const { current, list } of lists) {
        const shown = numbers(list);
        expect(shown, `page ${current}`).toEqual([...new Set(shown)].sort((a, b) => a - b));
        expect(shown.every((p) => p >= 0 && p < total)).toBe(true);
      }
    });

    it('puts an ellipsis only between two pages, and only where pages are skipped', () => {
      for (const { current, list } of lists) {
        list.forEach((entry, i) => {
          if (entry !== '...') return;
          const before = list[i - 1];
          const after = list[i + 1];
          expect(typeof before, `page ${current}`).toBe('number');
          expect(typeof after, `page ${current}`).toBe('number');
          expect((after as number) - (before as number), `page ${current}`).toBeGreaterThan(1);
        });
      }
    });

    it('never shows more than 7 entries', () => {
      for (const { list } of lists) expect(list.length).toBeLessThanOrEqual(7);
    });
  });
});
