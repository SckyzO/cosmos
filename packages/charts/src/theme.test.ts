import { describe, expect, it } from 'vitest';
import { COSMOS_BRAND, COSMOS_PALETTE, readableOn } from './theme';

// WCAG 2.x contrast, written out here rather than imported so the test does
// not share a bug with the code under test.
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// The defaults of `--color-success-500`, `--color-warning-500` and
// `--color-error-500` in packages/theme/css/tailwind-tokens.css: the colors
// `useChartTheme()` reads in place of the fallbacks of the palette.
const THEME_STATUS = ['#12b76a', '#f79009', '#f04438'];

describe('readableOn', () => {
  it('is white on a dark background and black on a light one', () => {
    expect(readableOn('#000000')).toBe('#ffffff');
    expect(readableOn('#ffffff')).toBe('#000000');
    expect(readableOn('#101828')).toBe('#ffffff');
    expect(readableOn('#f9fafb')).toBe('#000000');
  });

  it('picks the text color with the higher contrast, switching near mid-gray', () => {
    // 4.61:1 against white and 4.56:1 against black, then the reverse.
    expect(readableOn('#757575')).toBe('#ffffff');
    expect(readableOn('#767676')).toBe('#000000');
  });

  it('reaches 4.5:1 on every color of the chart palette', () => {
    for (const color of COSMOS_PALETTE) {
      expect(contrast(color, readableOn(color)), color).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('reaches 4.5:1 on the status colors of the theme', () => {
    for (const color of THEME_STATUS) {
      expect(contrast(color, readableOn(color)), color).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('is black on the theme green, amber and red, where white drops under 4:1', () => {
    for (const color of THEME_STATUS) {
      expect(readableOn(color), color).toBe('#000000');
      expect(contrast(color, '#ffffff'), color).toBeLessThan(4);
    }
  });

  it('is black on the palette green and amber, where white drops under 3:1', () => {
    expect(readableOn('#10b981')).toBe('#000000');
    expect(readableOn('#f59e0b')).toBe('#000000');
    expect(contrast('#10b981', '#ffffff')).toBeLessThan(3);
    expect(contrast('#f59e0b', '#ffffff')).toBeLessThan(3);
  });

  it('is white on the default brand color', () => {
    expect(readableOn(COSMOS_BRAND)).toBe('#ffffff');
  });

  it('reads the hex digits in either case', () => {
    expect(readableOn('#FFFFFF')).toBe('#000000');
    expect(readableOn('#10B981')).toBe('#000000');
  });

  it.each(['', 'red', '#fff', '#12345', '#1234567', '#12345g', 'rgb(0, 0, 0)', ' #ffffff'])(
    'falls back to white for %j, which is not a #rrggbb color',
    (background) => {
      expect(readableOn(background)).toBe('#ffffff');
    }
  );
});
