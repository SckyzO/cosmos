// Categorical hues the default palette draws from, in the order a legend reads
// them, then reserves. None of the first four reads as a status (green, amber,
// red); lime, orange and teal sit near those hues and come after.
export const CATEGORICAL = [
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#64748b', // slate
  '#f97316', // orange
  '#14b8a6', // teal
  '#84cc16', // lime
];

// Taken in place of the candidates that collide with the accent.
const RESERVES = [
  '#3b82f6', // blue
  '#d946ef', // fuchsia
];

/** Series colors in a palette: the accent and seven others. */
export const PALETTE_SIZE = 8;

// Two saturated colors closer than this many degrees of hue look alike: the
// blue accent (231°) keeps violet (258°), the cyan accent (191°) loses teal
// (173°). Below this saturation (HSL) a color is a gray: two grays look alike
// whatever their hue (slate and the graphite accent).
const HUE_DISTANCE = 24;
const NEUTRAL_SATURATION = 0.2;

/** `[r, g, b]` (0–255) of a `#rrggbb` or `rgb(r, g, b)` color, or `undefined`. */
export const parseColor = (color: string): [number, number, number] | undefined => {
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim())?.[1];
  if (hex)
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(color.trim());
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : undefined;
};

/** Hue in degrees and HSL saturation (0–1) of an `[r, g, b]` color. */
export const hueAndSaturation = ([r, g, b]: [number, number, number]) => {
  const [rn, gn, bn] = [r, g, b].map((c) => c / 255);
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === rn) hue = ((gn - bn) / delta) % 6;
    else if (max === gn) hue = (bn - rn) / delta + 2;
    else hue = (rn - gn) / delta + 4;
  }
  return { hue: (hue * 60 + 360) % 360, saturation };
};

/** Whether two colors are close enough to be taken for one another in a chart. */
export const looksAlike = (a: string, b: string): boolean => {
  const [ca, cb] = [parseColor(a), parseColor(b)];
  if (!ca || !cb) return false;
  const [x, y] = [hueAndSaturation(ca), hueAndSaturation(cb)];
  const neutralA = x.saturation < NEUTRAL_SATURATION;
  const neutralB = y.saturation < NEUTRAL_SATURATION;
  if (neutralA || neutralB) return neutralA && neutralB;
  const distance = Math.abs(x.hue - y.hue);
  return Math.min(distance, 360 - distance) < HUE_DISTANCE;
};

/**
 * The default series colors for `accent`: the accent, then the categorical
 * hues that do not look like it, eight in all. An accent that is not a hex or
 * `rgb()` color is kept first and nothing is dropped.
 */
export const categoricalPalette = (accent: string): string[] => {
  const candidates = [...CATEGORICAL, ...RESERVES];
  const others = parseColor(accent)
    ? candidates.filter((color) => !looksAlike(accent, color))
    : CATEGORICAL;
  return [accent, ...others].slice(0, PALETTE_SIZE);
};
