import { describe, expect, it } from 'vitest';
import { radarSize } from './radarSize';

const NAMES = ['Latency', 'Uptime', 'Capacity', 'Cost', 'Security'];

describe('radarSize', () => {
  it('is bound by the height in a wide chart, less the legend row on top', () => {
    expect(radarSize({ height: 340, width: 800, categories: NAMES, legend: 'top' })).toBe(128);
    expect(radarSize({ height: 340, width: 800, categories: NAMES })).toBe(148);
  });

  it('takes no vertical room for a legend at the side, and horizontal room instead', () => {
    expect(radarSize({ height: 340, width: 800, categories: NAMES, legend: 'right' })).toBe(148);
    expect(radarSize({ height: 340, width: 400, categories: NAMES, legend: 'right' })).toBe(
      radarSize({ height: 340, width: 280, categories: NAMES })
    );
  });

  it('is bound by the width, and the widest name, in a narrow chart', () => {
    const narrow = radarSize({ height: 340, width: 280, categories: NAMES });
    expect(narrow).toBeLessThan(radarSize({ height: 340, width: 800, categories: NAMES }));
    const longer = radarSize({
      height: 340,
      width: 280,
      categories: [...NAMES, 'Cost per request'],
    });
    expect(longer).toBeLessThan(narrow);
  });

  it('never goes under a legible size', () => {
    expect(radarSize({ height: 60, width: 100, categories: NAMES })).toBe(40);
    expect(radarSize({ height: 340, width: 800, categories: [] })).toBe(148);
  });
});
