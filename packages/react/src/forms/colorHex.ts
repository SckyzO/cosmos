/**
 * A hex colour typed by hand: `#abc`, `abc`, `#aabbcc` or `AABBCC`, with spaces around it.
 * Returns the lowercase `#rrggbb`, or `null` for anything else (no alpha channel, no names).
 */
export const normalizeHex = (input: string): string | null => {
  const hex = input.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(hex)) return `#${[...hex].map((c) => c + c).join('')}`;
  if (/^[0-9a-f]{6}$/.test(hex)) return `#${hex}`;
  return null;
};

// WCAG 2.x relative luminance of a `#rrggbb`.
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Ink of the check drawn on a swatch: the one of the two that contrasts more with it. */
export const SWATCH_INK = { light: '#ffffff', dark: '#101828' } as const;

/**
 * Whether a mark drawn on the colour `hex` (`#rrggbb`) should be white or dark. A preset the host
 * supplies can be pale, where a white check would vanish.
 */
export const markInk = (hex: string): string => {
  const lum = luminance(hex);
  const onLight = 1.05 / (lum + 0.05);
  const onDark = (lum + 0.05) / (luminance(SWATCH_INK.dark) + 0.05);
  return onLight >= onDark ? SWATCH_INK.light : SWATCH_INK.dark;
};
