// The color of text on a fill that is only known to the browser: a CSS
// variable, a `color-mix()` of two of them. No JavaScript can pick it without
// reading the computed style, so the choice is a CSS relative color.

// Relative luminance (WCAG) of the color, from its linear channels.
const LUMINANCE = 'calc(0.2126 * r + 0.7152 * g + 0.0722 * b)';
// White on a fill darker than this, black on a lighter one: the luminance at
// which both reach the same contrast, (L + 0.05)² = 0.0525.
const CROSSOVER = 0.1791;

/**
 * White or black text, whichever contrasts more with `background` (any CSS
 * color, `var()` and `color-mix()` included): at least 4.58:1 on any fill.
 * A browser that does not know relative colors keeps the text color it
 * inherits.
 */
export const textOn = (background: string): string => {
  const channel = `clamp(0, calc((${CROSSOVER} - ${LUMINANCE}) * 1000), 1)`;
  return `color(from ${background} srgb-linear ${channel} ${channel} ${channel})`;
};
