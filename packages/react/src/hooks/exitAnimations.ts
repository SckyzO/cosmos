/**
 * The part of an `Animation` (a `CSSTransition` or a `CSSAnimation`) that the exit of a closing
 * element reads: kept to what a test can stand in for.
 */
export type ExitAnimation = {
  readonly playState: AnimationPlayState;
  /** Set on a `CSSTransition`: the property it moves. */
  readonly transitionProperty?: string;
  readonly effect: Pick<AnimationEffect, 'getComputedTiming'> | null;
};

/**
 * The transitions that show a panel arriving or leaving: its opacity, its scale, its slide. A
 * colour changing under the pointer as the panel closes (a hovered item) is not its exit, and
 * must not keep it on screen.
 */
const EXIT_PROPERTIES = new Set(['opacity', 'scale', 'translate', 'transform', 'visibility']);

/**
 * The animations a closing element must wait for before it unmounts: the ones still running that
 * will end, of the properties of a panel's exit. A loop (a `ping` or a `pulse` inside the panel)
 * never ends and never counts; neither does an animation that is paused or already over, nor a
 * zero-length one. One that has yet to start playing is `running`: its play is pending.
 */
export function exitAnimations<T extends ExitAnimation>(animations: readonly T[]): T[] {
  return animations.filter((animation) => {
    // `running` covers an animation that has yet to start playing: its play is pending.
    if (animation.playState !== 'running') return false;
    const { transitionProperty } = animation;
    if (transitionProperty !== undefined && !EXIT_PROPERTIES.has(transitionProperty)) return false;
    const end = animation.effect?.getComputedTiming().endTime;
    return typeof end === 'number' && Number.isFinite(end) && end > 0;
  });
}
