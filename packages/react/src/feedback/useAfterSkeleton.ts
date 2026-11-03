import { useState, type AnimationEvent } from 'react';

// Internal to the package: how content arrives when it takes the place of a skeleton.

/** What goes on the element that holds the content: a class, and the handler that drops it. */
export type AfterSkeleton = {
  className?: string;
  onAnimationEnd?: (event: AnimationEvent<HTMLElement>) => void;
};

/**
 * Fades content in when it replaces a skeleton, for the components that swap one for the other on
 * a `loading` prop (`KpiCard`, `BarList`, `KanbanBoard`, `SectionCard`). The fade plays when
 * `loading` turns off after it was on, over `--cosmos-motion-base`, easing out, instead of the
 * content taking the skeleton's place at once. Content drawn from the first render, with no
 * loading phase before it, does not fade: nothing moves when a page loads. A reload plays it again.
 *
 * The class goes as soon as the fade has ended, so the content is left as it is (an animation that
 * fills forward would keep its own stacking context). With the reduced setting the fade lasts 0 ms
 * and ends at once.
 *
 * Spread the result on the element that holds the content: `className` through `clsx`, and
 * `onAnimationEnd`.
 */
export function useAfterSkeleton(loading: boolean): AfterSkeleton {
  const [wasLoading, setWasLoading] = useState(loading);
  const [fading, setFading] = useState(false);
  if (loading !== wasLoading) {
    setWasLoading(loading);
    setFading(wasLoading && !loading);
  }
  if (!fading) return {};
  return {
    className: 'animate-cosmos-fade-in',
    // The fade of this element, not an animation that ends in something inside it.
    onAnimationEnd: (event) => {
      if (event.target === event.currentTarget) setFading(false);
    },
  };
}
