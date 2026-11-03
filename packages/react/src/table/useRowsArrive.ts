import { useState, type AnimationEvent } from 'react';

// Internal to the table: how the rows of a first load arrive.

/**
 * The first load of a table: the placeholder rows give way to the rows, which fade in over
 * `--cosmos-motion-base` easing out, instead of replacing them at once. `skeleton` is whether the
 * placeholders are shown. Rows drawn from the first render, with no placeholders before them,
 * fade in nothing, and neither does a reload with rows on screen, which the dimming covers.
 *
 * Spread the result on the element that holds the rows (`className` with `clsx`). The class goes
 * when the fade has played, so it does not hold the element's opacity afterwards: the dimming of
 * a reload sets that one. With the reduced setting the fade lasts 0 ms.
 */
export function useRowsArrive(skeleton: boolean) {
  const [hadSkeleton, setHadSkeleton] = useState(skeleton);
  const [arriving, setArriving] = useState(false);
  if (skeleton && !hadSkeleton) setHadSkeleton(true);
  if (!skeleton && hadSkeleton) {
    setHadSkeleton(false);
    setArriving(true);
  }
  return {
    className: arriving ? 'animate-cosmos-fade-in' : undefined,
    onAnimationEnd: (event: AnimationEvent) => {
      if (event.target === event.currentTarget) setArriving(false);
    },
  };
}
