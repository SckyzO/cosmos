// Internal to the package: the scrim's look, shared by `Backdrop` and the overlay of the
// `CommandPalette` (cmdk draws that one, so it takes classes and not the component). Not exported
// from the barrel.

/**
 * What the veil behind a window looks like. `dim` is the colour alone: the cheapest on a large
 * page, and the default of every window. `blur` blurs the page by 8px under a light veil, so it
 * stays recognisable; `blur-dark` blurs it under a dark one.
 */
export type BackdropVariant = 'dim' | 'blur' | 'blur-dark';

/**
 * The colour of each variant is a variable of the theme, one per theme (`--color-scrim-dim`,
 * `-blur` and `-blur-dark`): a dark theme's veil is black, a light theme's a deep blue-gray.
 */
export const BACKDROP_VARIANT_CLASS: Record<BackdropVariant, string> = {
  dim: 'bg-(--color-scrim-dim)',
  blur: 'bg-(--color-scrim-blur) backdrop-blur-sm',
  'blur-dark': 'bg-(--color-scrim-blur-dark) backdrop-blur-sm',
};
