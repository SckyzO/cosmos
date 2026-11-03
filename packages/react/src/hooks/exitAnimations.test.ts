import { describe, expect, it } from 'vitest';
import { exitAnimations, type ExitAnimation } from './exitAnimations';

// A stand-in for an Animation: the node project has no DOM, and the filter only reads these.
const animation = (
  endTime: number,
  options: { playState?: AnimationPlayState; transitionProperty?: string } = {}
): ExitAnimation => ({
  playState: options.playState ?? 'running',
  transitionProperty: options.transitionProperty,
  effect: { getComputedTiming: () => ({ endTime }) },
});

describe('exitAnimations', () => {
  it('keeps the running transitions of a panel that leaves', () => {
    const leaving = ['opacity', 'scale', 'translate', 'transform'].map((property) =>
      animation(120, { transitionProperty: property })
    );
    expect(exitAnimations(leaving)).toEqual(leaving);
  });

  it('keeps a running keyframe animation that ends', () => {
    const keyframes = animation(200);
    expect(exitAnimations([keyframes])).toEqual([keyframes]);
  });

  it('ignores a loop, which never ends', () => {
    expect(exitAnimations([animation(Infinity)])).toEqual([]);
  });

  it('ignores an animation that is over, paused, or has no length', () => {
    expect(
      exitAnimations([
        animation(200, { playState: 'finished' }),
        animation(200, { playState: 'paused' }),
        animation(200, { playState: 'idle' }),
        animation(0),
      ])
    ).toEqual([]);
  });

  it('ignores a transition of another property, such as a hovered colour', () => {
    expect(
      exitAnimations([
        animation(150, { transitionProperty: 'background-color' }),
        animation(150, { transitionProperty: 'color' }),
      ])
    ).toEqual([]);
  });

  it('ignores an animation with no effect', () => {
    expect(exitAnimations([{ playState: 'running', effect: null }])).toEqual([]);
  });

  it('keeps only what counts out of a mixed list', () => {
    const slide = animation(200, { transitionProperty: 'translate' });
    const fade = animation(120, { transitionProperty: 'opacity' });
    expect(
      exitAnimations([
        animation(Infinity),
        slide,
        animation(150, { transitionProperty: 'color' }),
        fade,
      ])
    ).toEqual([slide, fade]);
  });

  it('returns nothing when nothing animates: the panel unmounts at once', () => {
    expect(exitAnimations([])).toEqual([]);
  });
});
