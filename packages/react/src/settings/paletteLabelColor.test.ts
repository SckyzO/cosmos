import { describe, expect, it } from 'vitest';
import { COSMOS_THEMES } from './appearance';
import { paletteLabelColor } from './paletteLabelColor';

// Contrast ratio of two `#rrggbb` colors, written out here so the test does
// not reuse the code it checks.
const ratio = (a: string, b: string) => {
  const l = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [l(a), l(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const LIGHT_SURFACES = ['#ffffff', '#fffaf0', '#fafaf7', '#fffcf7', '#f3f4f6', '#e5e7eb'];
const DARK_SURFACES = ['#0a0a0a', '#101828', '#141414', '#1a2240', '#27272a', '#293241', '#374151'];

describe('paletteLabelColor', () => {
  it('picks the dark gray on light surfaces', () => {
    for (const surface of LIGHT_SURFACES) expect(paletteLabelColor(surface)).toBe('#4b5563');
  });

  it('picks the light gray on dark surfaces', () => {
    for (const surface of DARK_SURFACES) expect(paletteLabelColor(surface)).toBe('#d1d5db');
  });

  it('reaches 4.5:1 on every surface above and on the four theme previews', () => {
    const surfaces = [
      ...LIGHT_SURFACES,
      ...DARK_SURFACES,
      ...COSMOS_THEMES.map((t) => t.preview.surface),
    ];
    for (const surface of surfaces) {
      expect(ratio(paletteLabelColor(surface), surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('reads the #rgb shorthand and ignores case and spaces', () => {
    expect(paletteLabelColor('#fff')).toBe('#4b5563');
    expect(paletteLabelColor(' #0A0A0A ')).toBe('#d1d5db');
  });

  it('takes a surface that is not a hex color as light', () => {
    expect(paletteLabelColor('oklch(20% 0.02 260)')).toBe('#4b5563');
    expect(paletteLabelColor('var(--color-bg-panel)')).toBe('#4b5563');
  });
});
