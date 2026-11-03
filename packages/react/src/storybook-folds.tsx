import type { CSSProperties, ReactNode } from 'react';
import { expect, waitFor } from 'storybook/test';

// Helpers for the stories that check a fold (`ui/Fold.tsx`) and the blocks that grow in. Stories
// that watch a transition opt out of the story tests' 0 s reset with
// `parameters: { settleMotion: false }`; the others read end states.

/**
 * Slows duration tokens down (`--cosmos-motion-base`, 200 ms, unless `tokens` names others), so a
 * check reads a block midway without racing the clock of a loaded machine: the tokens are
 * inherited, the ones set here win under it. The story needs `parameters: { settleMotion: false }`.
 */
export const SlowFolds = ({
  ms = 2000,
  tokens = ['--cosmos-motion-base'],
  children,
}: {
  ms?: number;
  tokens?: string[];
  children: ReactNode;
}) => (
  <div style={Object.fromEntries(tokens.map((token) => [token, `${ms}ms`])) as CSSProperties}>
    {children}
  </div>
);

/** The folding box a toggle controls (its `aria-controls`). */
export const foldOf = (toggle: Element) =>
  toggle.ownerDocument.getElementById(toggle.getAttribute('aria-controls')!)!;

/** The box that clips a fold's content while it moves: `Fold`'s first child. */
export const clipOf = (fold: Element) => fold.firstElementChild as HTMLElement;

/** Jumps every animation in `element` to its end, so a check does not wait for a slow one. */
export const finishAnimations = async (element: Element) => {
  const animations = element.getAnimations({ subtree: true });
  animations.forEach((animation) => animation.finish());
  await Promise.all(animations.map((animation) => animation.finished));
};

/**
 * A closed fold: `inert` (out of the tab order and of the pointer's reach) and hidden from the
 * accessibility tree at once, whatever its height is still doing. Its content stays mounted.
 */
export const expectFoldClosed = (fold: Element) => {
  expect((fold as HTMLElement).inert).toBe(true);
  expect(fold).toHaveAttribute('aria-hidden', 'true');
};

/**
 * An open fold: reachable at once, and clipping while it moves, then, at rest, not clipping, so a
 * focus ring at the content's edge is not cut.
 */
export const expectFoldOpen = async (fold: Element) => {
  expect((fold as HTMLElement).inert).toBe(false);
  expect(fold).not.toHaveAttribute('aria-hidden');
  await waitFor(() => expect(getComputedStyle(clipOf(fold)).overflow).toBe('visible'));
};

/** The computed rotation of a chevron: `none`, `90deg` (open), `180deg` (closed, right to left). */
export const rotationOf = (icon: Element) => getComputedStyle(icon).rotate;

/**
 * The rotation a disclosure chevron has closed: it points to the end of the line, so `none` where
 * that is the right and `180deg` where it is the left. Open it is `90deg` (down) in both.
 */
export const closedRotation = (icon: Element) =>
  getComputedStyle(icon).direction === 'rtl' ? '180deg' : 'none';
