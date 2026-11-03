// Helpers for the stories that check motion: a window leaving, the scrim's look, reduced motion.
// Stories that watch a transition opt out of the story tests' 0 s reset with
// `parameters: { settleMotion: false }`; the others read end states.

/** One animation frame. */
export const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * `data-motion="reduced"` on `<html>`, as `applyAppearance({ motion: 'reduced' })` sets it: every
 * duration of the theme reads 0. Returns the function that puts the attribute back as it was.
 */
export const reduceMotion = () => {
  const root = document.documentElement;
  const before = root.getAttribute('data-motion');
  root.setAttribute('data-motion', 'reduced');
  return () => {
    if (before === null) root.removeAttribute('data-motion');
    else root.setAttribute('data-motion', before);
  };
};

/**
 * The computed colour of a theme variable (`--color-scrim-dim`), read through a probe: it is
 * what a computed `background-color` of the same variable reads, whatever the theme and the
 * colour format, so a story can compare the two without knowing the values.
 */
export const themeColor = (variable: string) => {
  const probe = document.createElement('div');
  probe.style.backgroundColor = `var(${variable})`;
  document.body.append(probe);
  const colour = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return colour;
};

/**
 * What the scrim looks like, computed: its colour and its backdrop filter. `none` for a filter
 * means no blur.
 */
export const scrimLook = (scrim: Element) => {
  const style = getComputedStyle(scrim);
  return { colour: style.backgroundColor, filter: style.backdropFilter };
};

/** The computed duration of a transition, in ms (`transition-duration: 0.2s` reads 200). */
export const transitionMs = (element: Element) => {
  const [first = '0s'] = getComputedStyle(element).transitionDuration.split(',');
  const value = parseFloat(first);
  return Math.round(first.trim().endsWith('ms') ? value : value * 1000);
};

/**
 * The `animation-name` of a loop (a ping, a pulse, a spinner) as it is, and once reduced motion is
 * asked for with `data-motion="reduced"`: `motion-reduce:` follows it like the device's
 * `prefers-reduced-motion`, which `tests/e2e/specs/reduced-motion.spec.ts` checks in a real
 * browser. A decorative loop reads its keyframes, then `none`; a spinner keeps them.
 */
export const loopStops = (loop: Element) => {
  const running = getComputedStyle(loop).animationName;
  const restore = reduceMotion();
  try {
    return { running, reduced: getComputedStyle(loop).animationName };
  } finally {
    restore();
  }
};

/**
 * Whether `element`, or something in it, is playing a transition or an animation that will end:
 * a window that is fading out is. The browser starts the transition of a style change when it is
 * asked for the animations, so this is true right after the change, not a frame later.
 */
export const isFading = (element: Element) =>
  element
    .getAnimations({ subtree: true })
    .some(
      (animation) =>
        animation.playState === 'running' &&
        Number.isFinite(animation.effect?.getComputedTiming().endTime)
    );

/**
 * A duration token of the theme, in ms: `--cosmos-motion-base` reads 200 by default and 0 under
 * reduced motion. A built stylesheet is minified, which writes `200ms` as `.2s`: read both.
 */
export const tokenMs = (token: string) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return Math.round(parseFloat(raw) * (raw.endsWith('ms') ? 1 : 1000));
};
