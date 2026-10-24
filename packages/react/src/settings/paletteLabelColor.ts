/** Label gray on a light surface: 6.1:1 on `#e5e7eb`, 7.6:1 on white. */
const ON_LIGHT = '#4b5563';
/** Label gray on a dark surface: 7:1 on `#374151`, 13.4:1 on `#0a0a0a`. */
const ON_DARK = '#d1d5db';

/** The 0-255 channels of a `#rgb` or `#rrggbb` color, or undefined for any other syntax. */
const channels = (color: string): number[] | undefined => {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())?.[1];
  if (!hex) return undefined;
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

/** WCAG 2 relative luminance of 0-255 channels. */
const luminance = (rgb: number[]) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const ON_LIGHT_LUMINANCE = luminance([0x4b, 0x55, 0x63]);
const ON_DARK_LUMINANCE = luminance([0xd1, 0xd5, 0xdb]);

/**
 * The label color of a `PaletteCard` whose palette sets no `preview.text`:
 * whichever of a dark and a light gray contrasts more with the palette's
 * `surface`, so the label reads on light and dark surfaces alike. A surface
 * that isn't a hex color is taken as light.
 */
export const paletteLabelColor = (surface: string): string => {
  const rgb = channels(surface);
  if (!rgb) return ON_LIGHT;
  const bg = luminance(rgb);
  return contrast(bg, ON_LIGHT_LUMINANCE) >= contrast(bg, ON_DARK_LUMINANCE) ? ON_LIGHT : ON_DARK;
};
