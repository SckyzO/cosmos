import { categoricalPalette } from './palette';

/** Default brand color (the blue accent). The charts themselves follow the accent through `--color-brand-500`. */
export const COSMOS_BRAND = '#465fff';

/**
 * The default series colors without the theme CSS: eight categorical colors,
 * the blue accent first. With the theme, the charts draw `--color-brand-500`
 * and `--color-chart-2` to `--color-chart-8` instead, and each accent skips the
 * hues that look like it (a cyan accent drops the cyan and the teal).
 *
 * Series do not read as statuses: green, amber and red are absent from the
 * first four places, and the status colors are never the default. A chart that
 * means a status passes them as `colors`. A palette is a categorical scale: it
 * names things, it does not rank them.
 */
export const COSMOS_PALETTE = categoricalPalette(COSMOS_BRAND);

const relativeLuminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * The text color, white or black, that reads best on `background`, a
 * `#rrggbb` color (white when it is not one). White text drops under 3:1 on
 * the palette's green and amber, and black text drops to 4.34:1 on the brand
 * blue, where white gets 4.84:1: the pick reaches 4.5:1 on every color of the palette.
 */
export const readableOn = (background: string): string => {
  if (!/^#[0-9a-f]{6}$/i.test(background)) return '#ffffff';
  const luminance = relativeLuminance(background);
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.05 ? '#ffffff' : '#000000';
};
