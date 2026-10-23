import { expect, waitFor } from 'storybook/test';

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

// Canvas round-trip: turns any CSS colour (oklch, color-mix, hex…) into RGBA bytes.
const toRgba = (color: string) => {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) throw new Error('No 2D canvas context');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  return Array.from(ctx.getImageData(0, 0, 1, 1).data);
};

/**
 * Play-function assertion for form controls that show focus with their border:
 * focuses `target`, waits for the border of `border` (the control itself, or the
 * wrapper that uses `focus-within:`) to turn to `token` (the accent by default),
 * and checks the unfocused border was another colour.
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
  await waitFor(() => expect(read()).not.toEqual(expected));
  target.focus();
  await expect(target).toHaveFocus();
  await waitFor(() => expect(read()).toEqual(expected));
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
