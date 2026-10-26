import { describe, expect, it } from 'vitest';
import { CATEGORICAL, categoricalPalette, looksAlike, parseColor } from './palette';
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
// the charts read in place of the fallbacks of the palette.
const THEME_STATUS = ['#12b76a', '#f79009', '#f04438'];

const hue = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};

describe('COSMOS_PALETTE', () => {
  it('has eight distinct colors, the brand blue first', () => {
    expect(COSMOS_PALETTE).toHaveLength(8);
    expect(new Set(COSMOS_PALETTE).size).toBe(8);
    expect(COSMOS_PALETTE[0]).toBe(COSMOS_BRAND);
  });

  it('keeps green, amber and red out of the first four places', () => {
    // Hue ranges of the status colors: red/orange to amber (0-50, 340-360) and green (80-170).
    for (const color of COSMOS_PALETTE.slice(0, 4)) {
      const h = hue(color);
      expect(
        h > 50 && h < 80 ? 'yellow' : h < 50 || h >= 340 ? 'red' : h <= 170 ? 'green' : 'ok',
        color
      ).toBe('ok');
    }
  });
});

// `--color-brand-500` of every `data-accent` in packages/theme/css/css-vars.css.
const ACCENTS: Record<string, string> = {
  blue: COSMOS_BRAND,
  indigo: '#5963e9',
  violet: '#8a49f5',
  purple: '#b234d4',
  rose: '#d81e70',
  teal: '#038378',
  cyan: '#017f9d',
  graphite: '#707580',
  red: '#de1f2d',
  orange: '#c04f01',
  amber: '#a46800',
  green: '#02863c',
};

describe('categoricalPalette', () => {
  it.each(Object.entries(ACCENTS))(
    'has eight distinct colors, none like the %s accent',
    (_name, accent) => {
      const palette = categoricalPalette(accent);
      expect(palette).toHaveLength(8);
      expect(palette[0]).toBe(accent);
      expect(new Set(palette).size).toBe(8);
      for (const color of palette.slice(1)) expect(looksAlike(accent, color), color).toBe(false);
    }
  );

  it('is the categorical list after the blue accent, so the default is unchanged', () => {
    expect(categoricalPalette(COSMOS_BRAND)).toEqual([COSMOS_BRAND, ...CATEGORICAL]);
    expect(COSMOS_PALETTE).toEqual([COSMOS_BRAND, ...CATEGORICAL]);
  });

  it('drops the cyan and the teal for a cyan accent, the slate for graphite', () => {
    expect(categoricalPalette(ACCENTS.cyan)).not.toContain('#06b6d4');
    expect(categoricalPalette(ACCENTS.cyan)).not.toContain('#14b8a6');
    expect(categoricalPalette(ACCENTS.graphite)).not.toContain('#64748b');
  });

  it.each(['', 'red', 'var(--x)', '#fff', 'oklch(50% 0.1 20)'])(
    'keeps the first seven colors for %j, which it cannot read',
    (accent) => {
      expect(categoricalPalette(accent)).toEqual([accent, ...CATEGORICAL]);
    }
  );

  it('reads rgb() accents', () => {
    expect(parseColor('rgb(1, 127, 157)')).toEqual([1, 127, 157]);
    expect(categoricalPalette('rgb(1, 127, 157)')).toEqual(
      categoricalPalette(ACCENTS.cyan).map((c, i) => (i ? c : 'rgb(1, 127, 157)'))
    );
  });

  it('reaches readable text on every color it can hand out', () => {
    for (const accent of Object.values(ACCENTS)) {
      for (const color of categoricalPalette(accent).slice(1)) {
        expect(contrast(color, readableOn(color)), color).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

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
