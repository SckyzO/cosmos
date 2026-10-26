/**
 * The animation of every series: short, ease-out. `'auto'` is off for
 * `prefers-reduced-motion` and in SSR.
 */
export const ANIMATION = {
  isAnimationActive: 'auto' as const,
  animationDuration: 500,
  animationEasing: 'ease-out' as const,
};
