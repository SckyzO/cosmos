/**
 * An open overlay (a dialog, a drawer, a floating panel) in the stack `useOverlayLayer`
 * (`overlayA11y.tsx`) keeps: Escape calls `escape` of the top one only. `parent` is the
 * overlay it was opened from, if any.
 */
export type OverlayLayer = { readonly parent: OverlayLayer | null; readonly escape: () => void };

const isWithin = (layer: OverlayLayer, ancestor: OverlayLayer) => {
  for (let p = layer.parent; p; p = p.parent) if (p === ancestor) return true;
  return false;
};

/**
 * `stack`, bottom first, with `layer` on top, but under the layers opened from it: React runs
 * a child's effects before its parent's, so a panel open on mount inside a dialog open on
 * mount joins the stack before the dialog does.
 */
export function pushLayer(
  stack: readonly OverlayLayer[],
  layer: OverlayLayer
): readonly OverlayLayer[] {
  const at = stack.findIndex((other) => isWithin(other, layer));
  return at === -1 ? [...stack, layer] : [...stack.slice(0, at), layer, ...stack.slice(at)];
}
