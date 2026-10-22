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

/**
 * Play-function assertion: the computed text colour of `el` against the closest
 * opaque background behind it reaches `min` (WCAG AA for normal text by default).
 */
export const expectTextContrast = (el: Element, min = 4.5) => {
  const fg = luminance(toRgba(getComputedStyle(el).color));
  const bg = luminance(backgroundOf(el));
  const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
  expect(ratio).toBeGreaterThanOrEqual(min);
};
