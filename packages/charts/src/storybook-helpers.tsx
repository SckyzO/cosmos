import type { ReactNode } from 'react';
import { expect, waitFor } from 'storybook/test';
import type { ChartLegendPosition } from './types';

/**
 * Loads the woff2 of an `@font-face` rule already on the page (`sourceFamily`)
 * under a new `family` name, after the chart rendered with the fallback: a web
 * font arriving late. Returns the function that unregisters it.
 */
export const loadLateFont = async (family: string, sourceFamily: string) => {
  const rule = [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules])
    .find(
      (r): r is CSSFontFaceRule =>
        r instanceof CSSFontFaceRule &&
        r.style.getPropertyValue('font-family').replace(/['"]/g, '') === sourceFamily &&
        // The Latin subset: the other subsets of the family have no ASCII glyphs.
        r.style.getPropertyValue('unicode-range').includes('U+0-FF')
    );
  if (!rule) throw new Error(`No @font-face for ${sourceFamily}`);
  const url = /url\(["']?([^"')]+\.woff2)/.exec(rule.style.getPropertyValue('src'))?.[1];
  if (!url) throw new Error(`No woff2 source for ${sourceFamily}`);
  const face = new FontFace(family, `url(${url})`);
  document.fonts.add(face);
  await face.load();
  return () => document.fonts.delete(face);
};

// Series names, categories and labels are data, not markup: the charts draw
// them as text. Each wrapper's HtmlInLabelsRendersAsText story feeds it this string.
export const HOSTILE = '<img src=x onerror="window.__cosmosChartInjected=1">';

export const expectNoInjectedImage = async (root: HTMLElement) => {
  await expect(root.querySelector('img')).toBeNull();
  await expect(
    (window as { __cosmosChartInjected?: number }).__cosmosChartInjected
  ).toBeUndefined();
};

// A chart picks the hovered point from the pointer coordinates.
export const hover = (el: Element, xRatio = 0.5) => {
  const { left, top, width, height } = el.getBoundingClientRect();
  el.dispatchEvent(
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: left + width * xRatio,
      clientY: top + height / 2,
    })
  );
};

// A CSS color as a canvas normalizes it, so '#fff' and 'rgb(255, 255, 255)'
// compare equal. Not a probe element: waitFor reruns its callback on every DOM
// mutation, and adding one would loop forever.
const colorContext = document.createElement('canvas').getContext('2d')!;
export const resolveColor = (color: string) => {
  colorContext.fillStyle = '#000';
  colorContext.fillStyle = color;
  return colorContext.fillStyle;
};

/** A theme custom property on `<html>` (`--color-success-500`), as a resolved color. */
export const themeColor = (token: string) =>
  resolveColor(getComputedStyle(document.documentElement).getPropertyValue(token).trim());

/** `color` resolved, without its alpha (`rgba(…, 0.85)` becomes `rgb(…)`). */
export const opaqueColor = (color: string) => {
  const rgba = /^rgba\((\d+), (\d+), (\d+), [\d.]+\)$/.exec(resolveColor(color));
  return rgba ? resolveColor(`rgb(${rgba[1]}, ${rgba[2]}, ${rgba[3]})`) : resolveColor(color);
};

const luminanceOf = (color: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(resolveColor(color).slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** The WCAG contrast ratio between two opaque CSS colors. */
export const contrastRatio = (a: string, b: string) => {
  const [light, dark] = [luminanceOf(a), luminanceOf(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

/** Switches `<html>` to the `theme` class ('' for light); returns the undo. */
export const switchTheme = (theme: string) => {
  const { classList } = document.documentElement;
  const previous = [...classList];
  classList.remove(...previous);
  if (theme) classList.add(theme);
  return () => {
    classList.remove(...classList);
    classList.add(...previous);
  };
};

/** A color for a token redefined on `<html>`, unlike any theme color. */
const REDEFINED = '#7c3aed';

/**
 * Asserts the colors `drawn()` finds are `expected`, in order: a theme custom
 * property (`--color-success-500`) or a color of its own. Then redefines the
 * `redefined` property on `<html>` and switches to the sand theme, and asserts the
 * color follows.
 */
export const expectColorsFromTokens = async (
  drawn: () => (string | null | undefined)[],
  expected: string[],
  redefined: string
) => {
  const resolved = () => drawn().map((color) => opaqueColor(color ?? ''));
  const color = (value: string) =>
    value.startsWith('--') ? themeColor(value) : resolveColor(value);
  await waitFor(() => expect(resolved()).toEqual(expected.map(color)));
  const { style } = document.documentElement;
  style.setProperty(redefined, REDEFINED);
  const restore = switchTheme('sand');
  try {
    await waitFor(() =>
      expect(resolved()[expected.indexOf(redefined)]).toBe(resolveColor(REDEFINED))
    );
  } finally {
    restore();
    style.removeProperty(redefined);
  }
};

/**
 * Asserts `drawn()` is the color of `tokens[theme]` after switching `<html>` to
 * each of the themes in turn ('' for light).
 */
export const expectColorInThemes = async (
  drawn: () => string | null | undefined,
  tokens: Record<string, string>
) => {
  for (const [theme, token] of Object.entries(tokens)) {
    const restore = switchTheme(theme);
    try {
      await waitFor(() => {
        expect(drawn()).toBeTruthy();
        expect(opaqueColor(drawn() as string), theme || 'light').toBe(themeColor(token));
      });
    } finally {
      restore();
    }
  }
};

const LEGEND_SIDES: ChartLegendPosition[] = ['top', 'right', 'bottom', 'left'];

/** `children(side)` once per `legendPosition`, each chart in an element `data-side`. */
export const LegendSides = ({
  children,
}: {
  children: (side: ChartLegendPosition) => ReactNode;
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    {LEGEND_SIDES.map((side) => (
      <div key={side} data-side={side}>
        {children(side)}
      </div>
    ))}
  </div>
);
