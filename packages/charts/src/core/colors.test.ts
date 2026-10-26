import { describe, expect, it } from 'vitest';
import { categoricalPalette } from '../palette';
import { COSMOS_BRAND } from '../theme';
import { SEQUENTIAL, SERIES, SERIES_FALLBACKS, seriesColor } from './colors';

describe('SERIES', () => {
  it('is the accent, then the chart colors of the theme, each with its hex', () => {
    expect(SERIES).toHaveLength(8);
    expect(SERIES[0]).toBe('var(--color-brand-500, #465fff)');
    expect(SERIES[1]).toBe('var(--color-chart-2, #06b6d4)');
    expect(SERIES[7]).toBe('var(--color-chart-8, #84cc16)');
  });

  it('falls back to the default palette of the ApexCharts wrappers', () => {
    expect(SERIES_FALLBACKS).toEqual(categoricalPalette(COSMOS_BRAND));
  });
});

describe('seriesColor', () => {
  it('takes the palette in order, and starts over after the last color', () => {
    expect(seriesColor(0)).toBe(SERIES[0]);
    expect(seriesColor(3)).toBe(SERIES[3]);
    expect(seriesColor(8)).toBe(SERIES[0]);
  });

  it('takes the caller colors by index, and cycles through them', () => {
    expect(seriesColor(1, ['#111', '#222'])).toBe('#222');
    expect(seriesColor(2, ['#111', '#222'])).toBe('#111');
  });

  it('ignores an empty list of colors', () => {
    expect(seriesColor(1, [])).toBe(SERIES[1]);
  });
});

describe('SEQUENTIAL', () => {
  it('has five steps of the accent over the card, low to high', () => {
    expect(SEQUENTIAL).toHaveLength(5);
    expect(SEQUENTIAL[0]).toContain('24%');
    expect(SEQUENTIAL[4]).toContain('100%');
  });
});
