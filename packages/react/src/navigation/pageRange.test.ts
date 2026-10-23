import { describe, expect, it } from 'vitest';
import { buildRange } from './pageRange';

describe('buildRange', () => {
  it('lists every page, 1-indexed, when there are 7 or fewer', () => {
    expect(buildRange(1, 0)).toEqual([]);
    expect(buildRange(1, 1)).toEqual([1]);
    expect(buildRange(3, 5)).toEqual([1, 2, 3, 4, 5]);
    for (let page = 1; page <= 7; page++) {
      expect(buildRange(page, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    }
  });

  it('shows the first five pages, an ellipsis (0) and the last page near the start', () => {
    for (let page = 1; page <= 4; page++) {
      expect(buildRange(page, 20)).toEqual([1, 2, 3, 4, 5, 0, 20]);
    }
  });

  it('shows the first page, an ellipsis and the last five pages near the end', () => {
    for (let page = 17; page <= 20; page++) {
      expect(buildRange(page, 20)).toEqual([1, 0, 16, 17, 18, 19, 20]);
    }
  });

  it('shows a window of three around the page in the middle, between two ellipses', () => {
    expect(buildRange(5, 20)).toEqual([1, 0, 4, 5, 6, 0, 20]);
    expect(buildRange(10, 20)).toEqual([1, 0, 9, 10, 11, 0, 20]);
    expect(buildRange(16, 20)).toEqual([1, 0, 15, 16, 17, 0, 20]);
  });

  it('switches from the start layout to the middle one after page 4, and to the end one at total - 3', () => {
    expect(buildRange(4, 9)).toEqual([1, 2, 3, 4, 5, 0, 9]);
    expect(buildRange(5, 9)).toEqual([1, 0, 4, 5, 6, 0, 9]);
    expect(buildRange(6, 9)).toEqual([1, 0, 5, 6, 7, 8, 9]);
  });

  it('collapses from 8 pages on', () => {
    expect(buildRange(1, 8)).toEqual([1, 2, 3, 4, 5, 0, 8]);
    expect(buildRange(8, 8)).toEqual([1, 0, 4, 5, 6, 7, 8]);
  });

  describe.each([8, 9, 10, 25, 100])('for %i pages, whichever is active', (total) => {
    const lists = Array.from({ length: total }, (_, i) => ({
      page: i + 1,
      list: buildRange(i + 1, total),
    }));

    it('always has 7 entries, from the first page to the last', () => {
      for (const { page, list } of lists) {
        expect(list, `page ${page}`).toHaveLength(7);
        expect(list[0], `page ${page}`).toBe(1);
        expect(list.at(-1), `page ${page}`).toBe(total);
      }
    });

    it('always contains the active page and its neighbors', () => {
      for (const { page, list } of lists) {
        expect(list, `page ${page}`).toContain(page);
        if (page > 1) expect(list, `page ${page}`).toContain(page - 1);
        if (page < total) expect(list, `page ${page}`).toContain(page + 1);
      }
    });

    it('lists pages in increasing order, with an ellipsis only where pages are skipped', () => {
      for (const { page, list } of lists) {
        list.forEach((entry, i) => {
          if (entry === 0) {
            expect(list[i - 1], `page ${page}`).toBeGreaterThan(0);
            expect(list[i + 1] - list[i - 1], `page ${page}`).toBeGreaterThan(1);
          } else if (i > 0 && list[i - 1] !== 0) {
            expect(entry - list[i - 1], `page ${page}`).toBe(1);
          }
        });
      }
    });
  });
});
