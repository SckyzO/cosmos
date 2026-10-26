import type { ReactNode } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import type { ChartLegendPosition } from './types';

// Helpers for the stories of the charts, which draw with Recharts: the shared
// ones (hostile labels, colors, themes), then what reads the Recharts DOM, then
// the cartesian and the polar charts' own.

// ── Fonts, hostile labels, colors and themes ──────────────────────────────────

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

// ── The Recharts DOM ──────────────────────────────────────────────────────────

/** The chart's SVG. */
export const surface = (root: HTMLElement) =>
  root.querySelector<SVGSVGElement>('svg.recharts-surface');

/** The names on the legend of the chart in `root`, in order. */
export const legendTexts = (root: HTMLElement) =>
  [...root.querySelectorAll('.recharts-legend-wrapper button')].map((el) => el.textContent);

/** The tooltip card, or `null` while no point is active. */
export const tooltipCard = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('.recharts-tooltip-wrapper [role="status"]');

/** Moves the pointer over the plot, at `xRatio` of the chart's width. */
export const hoverPlot = (root: HTMLElement, xRatio = 0.5) => {
  const svg = surface(root);
  expect(svg).not.toBeNull();
  hover(svg as Element, xRatio);
};

/** Hovers until the tooltip shows (the chart may still be laying out). */
export const openTooltip = (root: HTMLElement, xRatio = 0.5) =>
  waitFor(() => {
    hoverPlot(root, xRatio);
    expect(tooltipCard(root)).not.toBeNull();
  });

/**
 * Ends the hover and waits until no tooltip is active. A play function that
 * opened a tooltip ends with this, like every other story: axe runs after it.
 */
export const closeTooltip = (root: HTMLElement) =>
  waitFor(() => {
    const svg = surface(root);
    for (const el of [svg, svg?.parentElement]) {
      el?.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
      el?.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
    }
    expect(tooltipCard(root)).toBeNull();
  });

/** The series lines of the chart: the stroke of each area or line curve, in series order. */
export const seriesStrokes = (root: HTMLElement) =>
  [...root.querySelectorAll<SVGPathElement>('.recharts-area-curve, .recharts-line-curve')].map(
    (el) => getComputedStyle(el).stroke
  );

/** The tick labels of the axis `axis` (`xAxis`, `yAxis`). */
export const tickTexts = (root: HTMLElement, axis: 'xAxis' | 'yAxis') =>
  [
    ...root.querySelectorAll(`.recharts-${axis}-tick-labels .recharts-cartesian-axis-tick-value`),
  ].map((el) => el.textContent);

/** The axis titles in `root`: the x one under the plot, and the y one, which Recharts rotates, beside it. */
export const axisTitles = (root: HTMLElement) => {
  const titles = [...root.querySelectorAll('.recharts-label:not(.recharts-reference-label)')];
  const text = (rotated: boolean) =>
    titles.filter((el) => el.hasAttribute('transform') === rotated).map((el) => el.textContent);
  return { x: text(false), y: text(true) };
};

/** Play function for a story with no data: the chart draws `text` in place of the plot, and nothing else. */
export const expectEmptyMessage =
  (text: string) =>
  ({ canvasElement }: { canvasElement: HTMLElement }) =>
    waitFor(() => {
      const empty = canvasElement.querySelector('[data-chart-empty]');
      expect(empty?.textContent).toBe(text);
      expect(canvasElement.querySelector('svg')).toBeNull();
    });

/**
 * Play function for a story passing `ariaLabel`: screen readers read it as the
 * chart's name. With `keyboard`, Tab reaches the chart, which announces the
 * first point in its tooltip, and `next` (default →) announces another;
 * without, the chart is an image, out of the tab order.
 */
export const expectAccessibleChart =
  ({ keyboard, next = '{ArrowRight}' }: { keyboard: boolean; next?: string }) =>
  async ({ canvasElement, args }: { canvasElement: HTMLElement; args: { ariaLabel?: string } }) => {
    const svg = () => surface(canvasElement);
    await waitFor(() => expect(svg()).toHaveAttribute('aria-label', args.ariaLabel));
    if (!keyboard) {
      await expect(svg()).toHaveAttribute('role', 'img');
      await expect(canvasElement.querySelector('[tabindex]:not([tabindex="-1"])')).toBeNull();
      return;
    }
    await expect(svg()).toHaveAttribute('role', 'application');
    await userEvent.tab();
    await expect(svg()).toHaveFocus();
    await waitFor(() => expect(tooltipCard(canvasElement)?.textContent).toBeTruthy());
    const first = tooltipCard(canvasElement)?.textContent;
    await userEvent.keyboard(next);
    await waitFor(() => {
      expect(tooltipCard(canvasElement)?.textContent).toBeTruthy();
      expect(tooltipCard(canvasElement)?.textContent).not.toBe(first);
    });
    await userEvent.tab();
    await closeTooltip(canvasElement);
  };

/**
 * Play function for a chart with its categories on the vertical axis (a
 * horizontal `BarChart`, `RangeBarChart`, `BoxPlotChart`): Tab reaches the
 * chart, which announces `categories[0]`, then ArrowDown and ArrowRight go to
 * the next category and ArrowUp and ArrowLeft to the previous one, and the ends
 * stay put. The tooltip names the category it is on.
 */
export const expectCategoryArrowKeys =
  (categories: string[]) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const svg = () => surface(canvasElement) as SVGSVGElement;
    await waitFor(() => expect(svg()).toHaveAttribute('role', 'application'));
    // A legend before the chart takes its Tab stops first.
    for (let i = 0; i < 12 && document.activeElement !== svg(); i++) await userEvent.tab();
    await expect(svg()).toHaveFocus();
    const on = (index: number) =>
      waitFor(() => expect(tooltipCard(canvasElement)).toHaveTextContent(categories[index]));
    await on(0);
    // Up at the first category stays on it.
    await userEvent.keyboard('{ArrowUp}');
    await on(0);
    const walk: [key: string, index: number][] = [
      ['{ArrowDown}', 1],
      ['{ArrowDown}', 2],
      ['{ArrowUp}', 1],
      ['{ArrowRight}', 2],
      ['{ArrowLeft}', 1],
      ['{ArrowRight}', 2],
      ['{ArrowUp}', 1],
      ['{ArrowLeft}', 0],
    ];
    for (const [key, index] of walk) {
      await userEvent.keyboard(key);
      await on(index);
    }
    await userEvent.tab();
    await closeTooltip(canvasElement);
  };

const px = (el: Element | null | undefined) => parseFloat(el ? getComputedStyle(el).fontSize : '');

/** The sizes, in px, of the chart text in `root`: tick labels, axis title, legend. */
const textSizes = (root: HTMLElement) => ({
  tick: px(root.querySelector('.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value')),
  title: px(root.querySelector('.recharts-label')),
  legend: px(root.querySelector('.recharts-legend-wrapper button')),
});

/**
 * Asserts the chart text in `root` follows the text size setting: the tick
 * labels, the axis title, the legend and the tooltip are 12px (`text-xs`), and
 * 13.5px once `<html>` takes `data-text-size="lg"`. The chart needs an x-axis
 * title and a legend.
 */
export const expectTextFollowsTextSize = async (root: HTMLElement) => {
  const html = document.documentElement;
  const previous = html.getAttribute('data-text-size');
  const tooltipSize = () => px(tooltipCard(root));
  await waitFor(() => expect(textSizes(root)).toEqual({ tick: 12, title: 12, legend: 12 }));
  await openTooltip(root, 0.05);
  expect(tooltipSize()).toBe(12);
  try {
    html.setAttribute('data-text-size', 'lg');
    await waitFor(() => expect(textSizes(root)).toEqual({ tick: 13.5, title: 13.5, legend: 13.5 }));
    await waitFor(() => expect(tooltipSize()).toBe(13.5));
  } finally {
    if (previous === null) html.removeAttribute('data-text-size');
    else html.setAttribute('data-text-size', previous);
    await closeTooltip(root);
  }
};

// ── Cartesian charts ──────────────────────────────────────────────────────────

/** The shapes of each bar series in `root`, series first. */
export const barShapes = (root: HTMLElement) =>
  [...root.querySelectorAll('.recharts-bar')].map((series) => [
    ...series.querySelectorAll<SVGElement>(
      '.recharts-bar-rectangle path, .recharts-bar-rectangle rect'
    ),
  ]);

/** The fill of the first bar of each series, in series order. */
export const barFills = (root: HTMLElement) =>
  barShapes(root).map((shapes) => (shapes[0] ? getComputedStyle(shapes[0]).fill : ''));

/** The symbols (points or bubbles) of each scatter series in `root`, series first. */
export const scatterSymbols = (root: HTMLElement) =>
  [...root.querySelectorAll('.recharts-scatter')].map((series) => [
    ...series.querySelectorAll<SVGElement>('.recharts-scatter-symbol path'),
  ]);

/** The fill of the first symbol of each scatter series, in series order. */
export const scatterFills = (root: HTMLElement) =>
  scatterSymbols(root).map((symbols) => (symbols[0] ? getComputedStyle(symbols[0]).fill : ''));

// ── Reference lines and bands ─────────────────────────────────────────────────

/** The lines of the chart's `referenceLines`, in the order they were given. */
export const referenceLineEls = (root: HTMLElement) => [
  ...root.querySelectorAll<SVGLineElement>('.recharts-reference-line-line'),
];

/** The rectangles of the chart's `referenceBands`, in the order they were given. */
export const referenceBandEls = (root: HTMLElement) => [
  ...root.querySelectorAll<SVGPathElement>('.recharts-reference-area-rect'),
];

/**
 * The labels of the reference lines and bands, sorted (Recharts draws them in
 * layers, not in the order of the props); the axis titles are not among them.
 */
export const referenceLabels = (root: HTMLElement) =>
  [...root.querySelectorAll('.recharts-reference-label')].map((el) => el.textContent).sort();

/**
 * Where `value` sits on the numeric axis `axis`, in the chart's pixels, read
 * from two of the tick labels (the ticks are laid out on the same scale the
 * reference marks are). Tick labels must be plain numbers.
 */
export const pixelOnAxis = (root: HTMLElement, axis: 'xAxis' | 'yAxis', value: number) => {
  const at = axis === 'yAxis' ? 'y' : 'x';
  const ticks = [
    ...root.querySelectorAll(`.recharts-${axis}-tick-labels .recharts-cartesian-axis-tick-value`),
  ].map((el) => [parseFloat(el.textContent ?? ''), parseFloat(el.getAttribute(at) ?? '')]);
  // Recharts nudges the labels at the two ends of the axis inward: the inner ticks are exact.
  const [[v0, p0], [v1, p1]] =
    ticks.length >= 4 ? [ticks[1], ticks[ticks.length - 2]] : [ticks[0], ticks[ticks.length - 1]];
  return p0 + ((value - v0) * (p1 - p0)) / (v1 - v0);
};

/** The pixel a reference line is drawn at, across its axis (`y1` of a horizontal line, `x1` of a vertical one). */
export const linePixel = (line: SVGLineElement, axis: 'xAxis' | 'yAxis') =>
  parseFloat(line.getAttribute(axis === 'yAxis' ? 'y1' : 'x1') ?? '');

/** The span of a reference band on its axis, as `[from, to]` in pixels, from lowest to highest. */
export const bandSpan = (band: SVGPathElement, axis: 'xAxis' | 'yAxis') => {
  const [start, size] = axis === 'yAxis' ? ['y', 'height'] : (['x', 'width'] as const);
  const from = parseFloat(band.getAttribute(start) ?? '');
  return [from, from + parseFloat(band.getAttribute(size) ?? '')] as const;
};

/**
 * Play function: the `lines` (values) and the `bands` ([from, to] pairs) a story
 * gives, in the order given, sit at the pixels their values have on `axis`.
 */
export const expectMarksAtTheirValues =
  (
    axis: 'xAxis' | 'yAxis',
    { lines = [], bands = [] }: { lines?: number[]; bands?: [number, number][] }
  ) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await waitFor(() => {
      expect(referenceLineEls(canvasElement)).toHaveLength(lines.length);
      expect(referenceBandEls(canvasElement)).toHaveLength(bands.length);
    });
    await waitFor(() => {
      referenceLineEls(canvasElement).forEach((line, i) =>
        expect(linePixel(line, axis), `line ${lines[i]}`).toBeCloseTo(
          pixelOnAxis(canvasElement, axis, lines[i]),
          0
        )
      );
      referenceBandEls(canvasElement).forEach((band, i) => {
        const [start, end] = bandSpan(band, axis);
        const [a, b] = [
          pixelOnAxis(canvasElement, axis, bands[i][0]),
          pixelOnAxis(canvasElement, axis, bands[i][1]),
        ];
        expect(start, `band ${bands[i]}`).toBeCloseTo(Math.min(a, b), 0);
        expect(end, `band ${bands[i]}`).toBeCloseTo(Math.max(a, b), 0);
      });
      // Every label is inside the chart.
      const chart = (surface(canvasElement) as Element).getBoundingClientRect();
      canvasElement.querySelectorAll('.recharts-reference-label').forEach((label) => {
        const box = label.getBoundingClientRect();
        expect(box.left, label.textContent ?? '').toBeGreaterThanOrEqual(chart.left - 1);
        expect(box.right, label.textContent ?? '').toBeLessThanOrEqual(chart.right + 1);
        expect(box.top, label.textContent ?? '').toBeGreaterThanOrEqual(chart.top - 1);
        expect(box.bottom, label.textContent ?? '').toBeLessThanOrEqual(chart.bottom + 1);
      });
    });
  };

/** The font size, in px, of every label of the reference marks in `root`. */
export const referenceLabelSizes = (root: HTMLElement) =>
  [...root.querySelectorAll('.recharts-reference-label')].map((el) =>
    parseFloat(getComputedStyle(el).fontSize)
  );

/**
 * Asserts the labels of the reference marks in `root` follow the text size
 * setting: 12px (`text-xs`) at the normal size, 13.5px once `<html>` takes
 * `data-text-size="lg"`.
 */
export const expectReferenceLabelsFollowTextSize = async (root: HTMLElement) => {
  const html = document.documentElement;
  const previous = html.getAttribute('data-text-size');
  await waitFor(() => {
    const sizes = referenceLabelSizes(root);
    expect(sizes.length).toBeGreaterThan(0);
    expect(new Set(sizes)).toEqual(new Set([12]));
  });
  try {
    html.setAttribute('data-text-size', 'lg');
    await waitFor(() => expect(new Set(referenceLabelSizes(root))).toEqual(new Set([13.5])));
  } finally {
    if (previous === null) html.removeAttribute('data-text-size');
    else html.setAttribute('data-text-size', previous);
  }
};

/**
 * Asserts the stroke of the reference line `index` is `token` (a theme custom
 * property) in each of the four themes.
 */
export const expectLineIntentColor = (root: HTMLElement, index: number, token: string) =>
  expectColorInThemes(
    () => referenceLineEls(root)[index] && getComputedStyle(referenceLineEls(root)[index]).stroke,
    { '': token, sand: token, dark: token, 'deep-blue': token }
  );

/** A box 375px wide, the width of a phone: what the "narrow" stories render a chart in. */
export const NarrowBox = ({ children }: { children: ReactNode }) => (
  <div data-testid="box" style={{ width: 375 }}>
    {children}
  </div>
);

/** Play function for a story rendered in `NarrowBox`: the chart stays inside the box, and the page does not scroll sideways. */
export const expectFitsNarrowBox = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const box = canvasElement.querySelector<HTMLElement>('[data-testid="box"]') as HTMLElement;
  await waitFor(() => expect(surface(canvasElement)).not.toBeNull());
  await waitFor(() => {
    expect(box.scrollWidth, 'the box scrolls sideways').toBeLessThanOrEqual(box.clientWidth);
    expect(surface(canvasElement)?.getBoundingClientRect().width).toBeLessThanOrEqual(375);
  });
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
};

/**
 * Asserts a theme switch repaints the chart in `root` with no observer and no
 * redraw: the computed color of a tick label is the theme's muted text color
 * and follows `<html>`'s class, and `firstSeries()` (the color of the first
 * series as drawn) is the accent of the `data-accent` `<html>` is given.
 */
export const expectRepaintsWithThemeOf = async (root: HTMLElement, firstSeries: () => string) => {
  const tick = () =>
    root.querySelector('.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value');
  const tickColor = () => resolveColor(getComputedStyle(tick() as Element).fill);
  await waitFor(() => expect(tick()).not.toBeNull());
  const initial = tickColor();
  await expect(initial).toBe(themeColor('--color-text-muted'));
  for (const theme of ['', 'sand', 'deep-blue']) {
    const restore = switchTheme(theme);
    try {
      // Read in the same task as the switch: nothing re-rendered in between.
      await expect(tickColor()).toBe(themeColor('--color-text-muted'));
    } finally {
      restore();
    }
  }
  const restoreLight = switchTheme('');
  try {
    await expect(tickColor()).not.toBe(initial);
  } finally {
    restoreLight();
  }
  const html = document.documentElement;
  const previous = html.getAttribute('data-accent');
  html.setAttribute('data-accent', 'teal');
  try {
    // A bar has no shape until its entrance animation gives it a size.
    await waitFor(() => expect(resolveColor(firstSeries())).toBe(themeColor('--color-brand-500')));
    await expect(resolveColor(firstSeries())).toBe(resolveColor('#038378'));
  } finally {
    if (previous === null) html.removeAttribute('data-accent');
    else html.setAttribute('data-accent', previous);
  }
};

/**
 * Moves the pointer over the plot, at `xRatio` and `yRatio` of the chart's
 * size, until the tooltip shows: a polar chart picks the point from the angle
 * of the pointer around its center.
 */
export const openTooltipAt = (root: HTMLElement, xRatio: number, yRatio: number) =>
  waitFor(() => {
    const svg = surface(root) as Element;
    const { left, top, width, height } = svg.getBoundingClientRect();
    svg.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: left + width * xRatio,
        clientY: top + height * yRatio,
      })
    );
    expect(tooltipCard(root)).not.toBeNull();
  });

// ── Polar charts ──────────────────────────────────────────────────────────────

/**
 * Play function for a story rendering a wrapper in `LegendSides`: each legend
 * sits on its side of the polygon found by `plot` (a selector), outside of it.
 */
export const expectLegendsAround =
  (plot: string) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    for (const side of LEGEND_SIDES) {
      const chart = canvasElement.querySelector(`[data-side="${side}"]`);
      await waitFor(() => {
        const legend = chart?.querySelector('.recharts-legend-wrapper');
        const drawn = chart?.querySelector(plot);
        expect(legend?.querySelector('button'), side).toBeTruthy();
        expect(drawn, side).toBeTruthy();
        const l = (legend as Element).getBoundingClientRect();
        const p = (drawn as Element).getBoundingClientRect();
        const outside = {
          top: l.bottom <= p.top + 1,
          bottom: l.top >= p.bottom - 1,
          left: l.right <= p.left + 1,
          right: l.left >= p.right - 1,
        };
        expect(
          outside[side],
          `${side}: legend ${JSON.stringify(l)}, plot ${JSON.stringify(p)}`
        ).toBe(true);
      });
    }
  };

/** The value and the label drawn in the middle of a polar chart (`CenterText`), or `null` if there is none. */
export const centerText = (root: HTMLElement) => {
  const text = root.querySelector('[data-chart-center]');
  if (!text) return null;
  const [value, label] = [...text.querySelectorAll('tspan')].map((el) => el.textContent);
  return { value, label: label ?? '' };
};

/**
 * Like `expectAccessibleChart` with `keyboard`, for a chart whose legend comes
 * first in the tab order: Tab walks past the legend buttons to the chart,
 * which announces its first point (on focus, or on the first `next` key when
 * `announcesOnFocus` is off), and `next` (default →) another.
 */
export const expectKeyboardWalk =
  ({
    next = '{ArrowRight}',
    announcesOnFocus = true,
  }: { next?: string; announcesOnFocus?: boolean } = {}) =>
  async ({ canvasElement, args }: { canvasElement: HTMLElement; args: { ariaLabel?: string } }) => {
    const svg = () => surface(canvasElement) as SVGSVGElement;
    await waitFor(() => expect(svg()).toHaveAttribute('aria-label', args.ariaLabel));
    await expect(svg()).toHaveAttribute('role', 'application');
    for (let i = 0; i < 12 && document.activeElement !== svg(); i++) await userEvent.tab();
    await expect(svg()).toHaveFocus();
    // A pie reads its first slice on the first arrow key, not on focus.
    if (!announcesOnFocus) await userEvent.keyboard(next);
    await waitFor(() => expect(tooltipCard(canvasElement)?.textContent).toBeTruthy());
    const first = tooltipCard(canvasElement)?.textContent;
    await userEvent.keyboard(next);
    await waitFor(() => {
      expect(tooltipCard(canvasElement)?.textContent).toBeTruthy();
      expect(tooltipCard(canvasElement)?.textContent).not.toBe(first);
    });
    await userEvent.tab();
    await closeTooltip(canvasElement);
  };

const RING_SECTOR = '.recharts-radial-bar-sector';

/** The arc of each ring of a `RadialBarChart`, in series order. */
export const ringSectors = (root: HTMLElement) => [
  ...root.querySelectorAll<SVGPathElement>(RING_SECTOR),
];

/**
 * Puts the pointer on ring `index` of those named `names` (the first is the
 * outer one), to the right of the center, until its tooltip and the center
 * name it: the ring reports the hover to the center, the chart's own pointer
 * tracking opens the tooltip.
 * `inner` is the share of the radius the rings leave empty in the middle.
 */
export const hoverRing = (root: HTMLElement, index: number, names: string[], inner = 0.4) =>
  waitFor(async () => {
    const svg = surface(root) as SVGSVGElement;
    const { left, top, width, height } = svg.getBoundingClientRect();
    const radius = Math.min(width, height) / 2;
    const at = radius - ((index + 0.5) * radius * (1 - inner)) / names.length;
    const sector = ringSectors(root)[index];
    expect(sector).toBeTruthy();
    await userEvent.hover(sector);
    svg.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: left + width / 2 + at,
        clientY: top + height / 2,
      })
    );
    expect(tooltipCard(root)).toHaveTextContent(names[index]);
    expect(centerText(root)?.label).toBe(names[index]);
  });

/** Takes the pointer off ring `index` and waits until the tooltip is gone. */
export const leaveRing = (root: HTMLElement, index: number) => {
  ringSectors(root)[index]?.dispatchEvent(
    new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body })
  );
  return closeTooltip(root);
};

/**
 * Asserts a theme switch repaints the chart in `root` with no observer and no
 * redraw: the computed color of a tick label is the theme's muted text color
 * and follows `<html>`'s class, and the first series line takes the accent
 * `<html>` is given.
 */
export const expectRepaintsWithTheme = (root: HTMLElement) =>
  expectRepaintsWithThemeOf(root, () => seriesStrokes(root)[0]);

/** Asserts each legend of `LegendSides` sits on its side of the plot, outside of it. */
export const expectLegendsOnTheirSide = expectLegendsAround('.recharts-cartesian-grid');
