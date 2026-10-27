import type { Decorator } from '@storybook/react-vite';
import { clsx } from 'clsx';
import { createElement, Fragment, type ElementType, type ReactNode } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import type { Direction } from './hooks/direction';

/**
 * Storybook docs parameters preset for components that render via portals
 * (Modal, Drawer, Popover, NotificationsPanel, UserMenu, DatePicker,
 * CommandPalette, …).
 *
 * Background: Storybook's autodocs renders stories *inline* by default. This
 * means a story whose visible content lives in `document.body` (via React
 * portal) or floats with `position: fixed/absolute` doesn't push the autodocs
 * preview block to the right size — the panel either clips or vanishes.
 *
 * The official Storybook v10 fix is to render the story inside an iframe and
 * reserve a fixed iframe height. This helper bundles that pattern so consumers
 * don't repeat the boilerplate at every meta:
 *
 * @example
 * ```ts
 * const meta = {
 *   title: 'Overlays/Command Palette',
 *   component: CommandPalette,
 *   parameters: portalDocsParams.lg(),
 *   tags: ['autodocs'],
 * } satisfies Meta<typeof CommandPalette>;
 * ```
 *
 * Variants are sized to common portal footprints. Pass a custom number when
 * the preset doesn't fit:
 *
 * @example
 * ```ts
 * parameters: portalDocsParams(720)
 * ```
 */

const buildParams = (height: number) => ({
  layout: 'fullscreen' as const,
  docs: {
    story: {
      inline: false,
      iframeHeight: `${height}px`,
    },
  },
});

type PortalDocsParams = ((height?: number) => ReturnType<typeof buildParams>) & {
  /** ~320 px — Tooltip, compact Popover. */
  sm: () => ReturnType<typeof buildParams>;
  /** ~480 px — Dropdown, small Modal, Date picker. */
  md: () => ReturnType<typeof buildParams>;
  /** ~640 px — Drawer, CommandPalette, large Modal. */
  lg: () => ReturnType<typeof buildParams>;
  /** ~800 px — Full-screen Modal, page templates. */
  full: () => ReturnType<typeof buildParams>;
};

const fn = ((height = 480) => buildParams(height)) as PortalDocsParams;
fn.sm = () => buildParams(320);
fn.md = () => buildParams(480);
fn.lg = () => buildParams(640);
fn.full = () => buildParams(800);

export const portalDocsParams = fn;

// ── Narrow screens ──────────────────────────────────────────────────────────

/**
 * The viewport of the stories that check a narrow screen: the toolbar's `mobile` preset, which the
 * story tests honour too (`globals` of the story, applied by addon-vitest before it renders).
 */
export const mobileViewport = { viewport: { value: 'mobile', isRotated: false } } as const;

/**
 * Play-function assertion: the page does not scroll sideways. Checks the document, which is what
 * a component wider than the viewport widens, and `box` when given (an `overflow: auto` strip
 * is allowed to scroll, so pass the element that must not).
 */
export const expectNoHorizontalOverflow = (box?: HTMLElement) => {
  const root = document.documentElement;
  expect(root.scrollWidth, 'the page scrolls sideways').toBeLessThanOrEqual(root.clientWidth);
  if (box) expect(box.scrollWidth, 'the box scrolls sideways').toBeLessThanOrEqual(box.clientWidth);
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * `Icon` turned around under `dir="rtl"`, for an icon a story gives a component's `icon` prop
 * that points along the line: a forward arrow, a back chevron, undo. The component draws the
 * icon it is given as it is, so the icon carries `rtl:-scale-x-100` itself, as in an app.
 */
export const mirroredIcon = (Icon: ElementType<{ className?: string }>) => {
  const Mirrored = ({ className, ...rest }: { className?: string }) =>
    createElement(Icon, { ...rest, className: clsx(className, 'rtl:-scale-x-100') });
  return Mirrored;
};

/**
 * The arrow key that moves toward the end of the line: ArrowRight, and ArrowLeft where the page
 * reads right to left (the direction pass puts `dir="rtl"` on `<html>`). `keyToStart` is its
 * opposite. For a play function that checks a horizontal widget in both directions.
 */
export const keyToEnd = (at: Element = document.documentElement) =>
  getComputedStyle(at).direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';

export const keyToStart = (at: Element = document.documentElement) =>
  getComputedStyle(at).direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';

/**
 * `content` rendered twice, in a `dir="ltr"` box and a `dir="rtl"` box one under the other, for a
 * story that checks a component mirrors. The boxes set the direction themselves, so the story
 * holds in the direction pass (`dir="rtl"` on `<html>`) as well. Read them back with
 * `directionBox`, compare them with `expectMirrored`.
 */
export const bothDirections = (content: () => ReactNode) =>
  createElement(
    Fragment,
    null,
    (['ltr', 'rtl'] as const).map((dir) =>
      createElement('div', { key: dir, dir, 'data-direction': dir, className: 'mb-4' }, content())
    )
  );

/** The box of `bothDirections` for `dir`. */
export const directionBox = (canvasElement: HTMLElement, dir: Direction) => {
  const box = canvasElement.querySelector<HTMLElement>(`[data-direction="${dir}"]`);
  if (!box) throw new Error(`no ${dir} box: render the story with bothDirections`);
  return box;
};

/**
 * How far `element` is from the edge of `box` its text starts at: the left one in left to right,
 * the right one in right to left. The same layout, mirrored, gives the same value in both.
 */
export const startOffset = (element: Element, box: Element) => {
  const e = element.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  return getComputedStyle(box).direction === 'rtl' ? b.right - e.right : e.left - b.left;
};

/** The same, from the edge the text ends at. */
export const endOffset = (element: Element, box: Element) => {
  const e = element.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  return getComputedStyle(box).direction === 'rtl' ? e.left - b.left : b.right - e.right;
};

/**
 * Play-function assertion for a story rendered with `bothDirections`: the element `find` picks
 * in each box sits at the same distance from the start edge (so it moved to the other side when
 * the direction flipped), by `precision` decimal places. Returns both elements, for the
 * assertions that are about the element itself.
 */
export const expectMirrored = (
  canvasElement: HTMLElement,
  find: (box: HTMLElement) => Element | null | undefined,
  precision = 0
) => {
  const ltr = directionBox(canvasElement, 'ltr');
  const rtl = directionBox(canvasElement, 'rtl');
  const inLtr = find(ltr);
  const inRtl = find(rtl);
  expect(inLtr, 'the element in the ltr box').toBeTruthy();
  expect(inRtl, 'the element in the rtl box').toBeTruthy();
  expect(startOffset(inRtl!, rtl), 'distance from the start edge in rtl').toBeCloseTo(
    startOffset(inLtr!, ltr),
    precision
  );
  return { ltr: inLtr as HTMLElement, rtl: inRtl as HTMLElement };
};

/**
 * Play-function assertion: the text of `element` reads left to right, its first character on the
 * left of its last one, whatever the direction around it. For a value a component writes in
 * English around a number ("2 of 5 done", "1.5 MB"), which a right-to-left line would reorder
 * ("of 5 done 2", "MB 1.5").
 */
export const expectReadsLeftToRight = (element: Element) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) {
    const text = walker.currentNode as Text;
    if (text.data.trim()) texts.push(text);
  }
  expect(texts.length, `text in ${element.outerHTML}`).toBeGreaterThan(0);
  const first = texts[0]!;
  const last = texts[texts.length - 1]!;
  const leftOf = (text: Text, offset: number) => {
    const range = document.createRange();
    range.setStart(text, offset);
    range.setEnd(text, offset + 1);
    return range.getBoundingClientRect().left;
  };
  expect(
    leftOf(first, first.data.search(/\S/)),
    `"${element.textContent}" reads left to right`
  ).toBeLessThan(leftOf(last, last.data.trimEnd().length - 1));
};

/**
 * Padding for a story that sits in the `fullscreen` layout `portalDocsParams`
 * sets but has no frame of its own: without it the content is drawn against the
 * corner of the canvas. The same 24 px the other layouts get.
 */
export const withCanvasPadding: Decorator = (Story) =>
  createElement('div', { className: 'p-6' }, createElement(Story));

// ── Floating panels ─────────────────────────────────────────────────────────

/**
 * Play-function assertion for a floating panel opened inside `box`, an `overflow: hidden`
 * container: the panel's center lies outside the box, and the panel is really drawn there
 * (the topmost element at that point belongs to it). A panel the box clips is not
 * hit-testable outside it. A tooltip lets the pointer through, so the check lifts its
 * `pointer-events: none` for the hit test.
 */
export const expectOutsideClip = (panel: HTMLElement, box: HTMLElement) => {
  const p = panel.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  const x = p.left + p.width / 2;
  const y = p.top + p.height / 2;
  const inBox = x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
  expect(inBox, "the panel's center lies inside the box: make the box smaller").toBe(false);
  const pointerEvents = panel.style.pointerEvents;
  panel.style.pointerEvents = 'auto';
  try {
    const hit = document.elementFromPoint(x, y);
    expect(hit && panel.contains(hit), 'the box clips the panel').toBe(true);
  } finally {
    panel.style.pointerEvents = pointerEvents;
  }
};

/**
 * Play-function assertion: `panel` sits `offset` px under `anchor`, flush with the edge its text
 * starts at (`start`: the left one, the right one in right to left) or ends at (`end`). Wrap it
 * in `waitFor` after a scroll: the panel follows on the scroll event.
 */
export const expectBelow = (
  panel: Element,
  anchor: Element,
  { offset, align }: { offset: number; align: 'start' | 'end' }
) => {
  const p = panel.getBoundingClientRect();
  const a = anchor.getBoundingClientRect();
  expect(p.top).toBeCloseTo(a.bottom + offset, 0);
  const rtl = getComputedStyle(anchor).direction === 'rtl';
  if ((align === 'start') !== rtl) expect(p.left).toBeCloseTo(a.left, 0);
  else expect(p.right).toBeCloseTo(a.right, 0);
};

/**
 * Scrolls `scroller` by `by` px and checks `anchor` moved with it, so a test that then
 * expects a panel to follow its anchor can't pass on a scroll that did nothing.
 */
export const scrollAnchor = async (scroller: HTMLElement, anchor: Element, by = 30) => {
  const top = anchor.getBoundingClientRect().top;
  scroller.scrollTop += by;
  await expect(anchor.getBoundingClientRect().top).toBeCloseTo(top - by, 0);
};

// Canvas round-trip: turns any CSS colour (oklch, color-mix, hex…) into RGBA bytes.
const toRgba = (color: string) => {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) throw new Error('No 2D canvas context');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  return Array.from(ctx.getImageData(0, 0, 1, 1).data);
};

// ── Focus indicator ─────────────────────────────────────────────────────────

type ShadowLayer = {
  rgb: number[];
  alpha: number;
  x: number;
  y: number;
  blur: number;
  spread: number;
  inset: boolean;
};

// `rgb(70, 95, 255)`, `rgba(70, 95, 255, 0.12)` or `color(srgb 0.27 0.37 1 / 0.12)`: what
// `getComputedStyle` returns for a hex colour, an alpha one and a `color-mix()`.
const parseCssColor = (value: string) => {
  const body = value.slice(value.indexOf('(') + 1, value.lastIndexOf(')'));
  const [channels, slashAlpha] = body.split('/').map((part) => part.trim());
  const numbers = channels
    .replace(/^srgb\s+/, '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((n) => Number(n.replace('%', '')));
  const scale = value.startsWith('color(') ? 255 : 1;
  const alpha = slashAlpha ?? (numbers.length > 3 ? String(numbers[3]) : '1');
  return {
    rgb: numbers.slice(0, 3).map((c) => Math.min(255, Math.max(0, Math.round(c * scale)))),
    alpha: slashAlpha?.endsWith('%') ? Number.parseFloat(alpha) / 100 : Number(alpha),
  };
};

const topLevelCommas = (value: string) => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '(') depth += 1;
    else if (value[i] === ')') depth -= 1;
    else if (value[i] === ',' && depth === 0) {
      parts.push(value.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(value.slice(start));
  return parts.map((part) => part.trim());
};

// The visible layers of `el`'s computed box-shadow (Tailwind's empty placeholders are dropped).
const shadowLayers = (el: Element): ShadowLayer[] =>
  topLevelCommas(getComputedStyle(el).boxShadow).flatMap((layer) => {
    const color = layer.match(/(?:rgba?|color)\([^)]*\)/)?.[0];
    if (!color) return [];
    const [x = 0, y = 0, blur = 0, spread = 0] = (
      layer.replace(color, '').match(/-?[\d.]+(?=px)/g) ?? []
    ).map(Number);
    const parsed = parseCssColor(color);
    return parsed.alpha === 0
      ? []
      : [{ ...parsed, x, y, blur, spread, inset: /\binset\b/.test(layer) }];
  });

const closeTo = (a: number[], b: number[], tolerance = 6) =>
  a.every((c, i) => Math.abs(c - b[i]) <= tolerance);

const tokenRgb = (token: string) =>
  toRgba(getComputedStyle(document.documentElement).getPropertyValue(token)).slice(0, 3);

// A plain spread layer: `0 0 0 <spread>px <colour>`.
const spreadLayer = (el: Element, spread: number) =>
  shadowLayers(el).find((l) => l.x === 0 && l.y === 0 && l.blur === 0 && l.spread === spread);

/**
 * The halo of the focus indicator on `el`: a 4px spread of `token` at 12% alpha
 * (`--shadow-focus-ring`, or `--shadow-focus-ring-error` for the red token).
 */
const expectHalo = (el: Element, token: string) => {
  const halo = spreadLayer(el, 4);
  expect(halo, 'the 4px halo is missing from the box-shadow').toBeDefined();
  expect(closeTo(halo!.rgb, tokenRgb(token))).toBe(true);
  expect(halo!.alpha).toBeGreaterThan(0.1);
  expect(halo!.alpha).toBeLessThan(0.14);
};

/**
 * Play-function assertion for a control that is not a field: focused from the
 * keyboard (Tab, so `:focus-visible` matches), it draws a 2px ring of `token`
 * (the accent by default) and the halo; unfocused, it draws neither. `ring` is
 * the element that draws them (the control itself, the box next to a hidden
 * input, the wrapper of a `has-focus-visible:` card). `inset` for `ring-inset`;
 * `halo: false` for the white ring of an accent-filled control, which has none.
 *
 * A control that moves focus onto itself (a menu item) is focused already: the
 * check starts from there.
 */
export const expectFocusRing = async (
  target: HTMLElement,
  {
    ring = target,
    token = '--color-brand-500',
    inset = false,
    halo = true,
  }: { ring?: HTMLElement; token?: string; inset?: boolean; halo?: boolean } = {}
) => {
  if (document.activeElement !== target) {
    (document.activeElement as HTMLElement | null)?.blur();
    await waitFor(() => expect(spreadLayer(ring, 4)).toBeUndefined());
    for (let i = 0; i < 40 && document.activeElement !== target; i += 1) await userEvent.tab();
  }
  await expect(target).toHaveFocus();
  expect(target.matches(':focus-visible'), 'the control did not get :focus-visible').toBe(true);
  await waitFor(() => {
    const solid = spreadLayer(ring, 2);
    expect(solid, 'the 2px ring is missing from the box-shadow').toBeDefined();
    expect(solid!.alpha).toBeGreaterThan(0.99);
    expect(closeTo(solid!.rgb, tokenRgb(token))).toBe(true);
    expect(solid!.inset).toBe(inset);
    if (halo) expectHalo(ring, token);
    else expect(spreadLayer(ring, 4)).toBeUndefined();
  });
};

/**
 * Play-function assertion for form controls that show focus with their border:
 * focuses `target`, waits for the border of `border` (the control itself, or the
 * wrapper that uses `focus-within:`) to turn to `token` (the accent by default)
 * and for the 4px halo to appear, and checks the unfocused control had neither.
 *
 * Run it under `globals: { theme: 'dark' }`: the dark themes are where the
 * `dark:` border used to win over `focus:`.
 */
export const expectFocusBorder = async (
  target: HTMLElement,
  { border = target, token = '--color-brand-500' }: { border?: HTMLElement; token?: string } = {}
) => {
  const read = () => toRgba(getComputedStyle(border).borderTopColor);
  const expected = toRgba(getComputedStyle(document.documentElement).getPropertyValue(token));
  // Some controls take focus on mount (autoFocus): read their idle border first.
  target.blur();
  await waitFor(() => {
    expect(read()).not.toEqual(expected);
    expect(spreadLayer(border, 4)).toBeUndefined();
  });
  target.focus();
  await expect(target).toHaveFocus();
  await waitFor(() => {
    expect(read()).toEqual(expected);
    expectHalo(border, token);
  });
};

/**
 * Play-function assertion for a component's `ref`: `ref.current` is the
 * `expected` element, and focusing it through the ref moves focus there (the
 * element is blurred first, so a control that took focus on mount doesn't pass
 * for free).
 */
export const expectRefFocuses = async (
  ref: { current: HTMLElement | null },
  expected: HTMLElement
) => {
  await expect(ref.current).toBe(expected);
  expected.blur();
  ref.current?.focus();
  await expect(expected).toHaveFocus();
};

// WCAG 2.x relative luminance of RGBA bytes (alpha ignored).
const luminance = ([r, g, b]: number[]) => {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};

// Closest opaque background behind `el`, its own included.
const backgroundOf = (el: Element) => {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const bg = toRgba(getComputedStyle(node).backgroundColor);
    if (bg[3] === 255) return bg;
  }
  return [255, 255, 255, 255];
};

const contrastRatio = (fg: number[], bg: number[]) => {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
};

// `fg` laid over the opaque `bg` when it is translucent.
const over = (fg: number[], bg: number[]) =>
  fg[3] === 255
    ? fg
    : [0, 1, 2].map((i) => Math.round((fg[i] * fg[3] + bg[i] * (255 - fg[3])) / 255));

/**
 * Play-function assertion: the computed text colour of `el` against the closest
 * opaque background behind it reaches `min` (WCAG AA for normal text by default).
 */
export const expectTextContrast = (el: Element, min = 4.5) => {
  expect(
    contrastRatio(toRgba(getComputedStyle(el).color), backgroundOf(el))
  ).toBeGreaterThanOrEqual(min);
};

/**
 * Same for the native placeholder of an input or textarea, read from its
 * `::placeholder` pseudo-element (translucent colours are laid over the field).
 */
export const expectPlaceholderContrast = (field: Element, min = 4.5) => {
  const bg = backgroundOf(field);
  const fg = over(toRgba(getComputedStyle(field, '::placeholder').color), bg);
  expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
};

/**
 * Play-function assertion for a graphic with no text (icon, switch track): WCAG
 * 1.4.11 asks 3:1 against what surrounds it. `color` is the icon colour against
 * the background behind `el`; `backgroundColor` is the fill of `el` against the
 * background behind its parent.
 */
export const expectGraphicContrast = (
  el: Element,
  property: 'color' | 'backgroundColor',
  min = 3
) => {
  const behind = backgroundOf(property === 'color' ? el : (el.parentElement ?? el));
  expect(contrastRatio(toRgba(getComputedStyle(el)[property]), behind)).toBeGreaterThanOrEqual(min);
};

/**
 * Same for two strokes of an SVG, the arc of a ring against its track: WCAG
 * 1.4.11 asks 3:1 between the part that carries the value and what it sits on.
 */
export const expectStrokeContrast = (arc: Element, track: Element, min = 3) => {
  expect(
    contrastRatio(toRgba(getComputedStyle(arc).stroke), toRgba(getComputedStyle(track).stroke))
  ).toBeGreaterThanOrEqual(min);
};

const THEME_CLASSES = ['sand', 'dark', 'deep-blue'];

/**
 * Run `check` once under each Cosmos theme (light, sand, dark, deep-blue) by
 * switching the class on <html>, then put the original classes back. Colour
 * transitions are switched off meanwhile, or the check would read a colour
 * halfway between two themes. A failure names its theme.
 */
export const inEachTheme = (check: () => void) => {
  const root = document.documentElement;
  const saved = root.className;
  const noTransitions = document.createElement('style');
  noTransitions.textContent = '*, *::before, *::after { transition: none !important; }';
  document.head.append(noTransitions);
  try {
    for (const theme of ['light', ...THEME_CLASSES]) {
      root.classList.remove(...THEME_CLASSES);
      if (theme !== 'light') root.classList.add(theme);
      try {
        check();
      } catch (error) {
        throw new Error(`[${theme}] ${(error as Error).message}`, { cause: error });
      }
    }
  } finally {
    root.className = saved;
    noTransitions.remove();
  }
};

/**
 * Play-function assertion: the border of `el` is the theme colour `token` (read from <html>), at
 * `alpha` when it is translucent. Check an element that is not focused: focus turns its border to
 * the accent.
 */
export const expectBorderToken = (
  el: Element,
  token: string,
  { alpha = 1 }: { alpha?: number } = {}
) => {
  const [r, g, b, a] = toRgba(getComputedStyle(el).borderTopColor);
  expect(closeTo([r, g, b], tokenRgb(token)), `the border is not ${token}`).toBe(true);
  expect(Math.abs(a / 255 - alpha), `the border is not at ${alpha} alpha`).toBeLessThan(0.02);
};

/**
 * Play-function assertion for a field (or an OTP cell, or the wrapper that draws a field's border)
 * in its success state, under each Cosmos theme: `green-600` in light and sand, `green-500` at 60%
 * in the dark themes. The element must not be focused.
 */
export const expectSuccessBorder = (el: Element) =>
  inEachTheme(() => {
    const root = document.documentElement;
    const dark = root.classList.contains('dark') || root.classList.contains('deep-blue');
    if (dark) expectBorderToken(el, '--color-green-500', { alpha: 0.6 });
    else expectBorderToken(el, '--color-green-600');
  });

/**
 * Waits for the CSS transitions running on `el` to end. A size that animates
 * (the sidebar's 300ms width) is checked once its transition has finished, not
 * polled against `waitFor`'s 1s deadline: a loaded run, such as the contrast
 * pass, stretched the transition past it and failed on a width caught midway.
 */
export const transitionsEnd = (el: Element) =>
  Promise.all(el.getAnimations().map((animation) => animation.finished));

/**
 * Clicks the Topbar hamburger of a `Shell` story twice and checks the sidebar
 * collapses to its rail, then expands back.
 */
export const expectHamburgerTogglesSidebar = async (canvas: {
  getByRole: (role: string, options: { name: string }) => HTMLElement;
}) => {
  const nav = canvas.getByRole('navigation', { name: 'Main navigation' });
  const expanded = nav.getBoundingClientRect().width;
  await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
  await transitionsEnd(nav);
  await expect(nav.getBoundingClientRect().width).toBe(72);
  await userEvent.click(canvas.getByRole('button', { name: 'Expand sidebar' }));
  await transitionsEnd(nav);
  await expect(nav.getBoundingClientRect().width).toBe(expanded);
};

/**
 * The settings pickers (accent, option, palette) mark the checked item one way:
 * the brand border plus a brand check badge. Unchecked items have neither.
 */
export const expectPickerSelected = (group: HTMLElement) => {
  const probe = document.createElement('span');
  probe.className = 'border-brand-500 border-2';
  document.body.append(probe);
  const brand = getComputedStyle(probe).borderTopColor;
  probe.remove();
  const radios = [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
  expect(radios.length).toBeGreaterThan(1);
  for (const radio of radios) {
    const checked = radio.getAttribute('aria-checked') === 'true';
    expect(`${radio.getAttribute('aria-label')} border ${checked}`).toBe(
      `${radio.getAttribute('aria-label')} border ${getComputedStyle(radio).borderTopColor === brand}`
    );
    expect(radio.querySelectorAll('.bg-brand-500.rounded-full')).toHaveLength(checked ? 1 : 0);
  }
  expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1);
};
