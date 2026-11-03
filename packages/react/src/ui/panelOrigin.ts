import type { Direction } from '../hooks/direction';
import type { AnchorAlign, AnchorSide } from '../hooks/useAnchorPosition';

// Internal to the package: where a floating panel grows from. Not exported from the barrel.

/**
 * The `transform-origin` of a floating panel: the corner, or the middle of the edge, nearest its
 * trigger, so it grows out of the trigger and shrinks back into it. `side` is the side of the
 * anchor the panel opened on, as the screen sees it (after any flip); on `top` and `bottom`,
 * `align` says which edge of the panel lines up with the anchor's, in the anchor's `direction`: the
 * `start` edges are the left ones in left to right and the right ones in right to left. On `left`
 * and `right` the panel is centered on the anchor, and it grows from the middle of the edge that
 * faces it.
 */
export function panelOrigin(
  side: AnchorSide,
  align: AnchorAlign = 'center',
  direction: Direction = 'ltr'
): string {
  if (side === 'left') return 'center right';
  if (side === 'right') return 'center left';
  const vertical = side === 'bottom' ? 'top' : 'bottom';
  if (align === 'center') return `${vertical} center`;
  const startIsLeft = direction === 'ltr';
  const horizontal = (align === 'start') === startIsLeft ? 'left' : 'right';
  return `${vertical} ${horizontal}`;
}
