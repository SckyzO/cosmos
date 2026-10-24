import { describe, expect, it } from 'vitest';
import { pushLayer, type OverlayLayer } from './overlayStack';

const layer = (parent: OverlayLayer | null = null): OverlayLayer => ({ parent, escape: () => {} });

describe('pushLayer', () => {
  it('puts the overlay opened last on top', () => {
    const modal = layer();
    const menu = layer(modal);
    expect(pushLayer(pushLayer([], modal), menu)).toEqual([modal, menu]);
  });

  it('puts an overlay under the ones opened from it that joined first', () => {
    // Both open on mount: the menu's effect runs before the modal's.
    const modal = layer();
    const popover = layer(modal);
    const menu = layer(popover);
    expect(pushLayer([menu], modal)).toEqual([modal, menu]);
    expect(pushLayer([popover, menu], modal)).toEqual([modal, popover, menu]);
    expect(pushLayer(pushLayer([menu], modal), popover)).toEqual([modal, popover, menu]);
  });

  it('leaves the order of unrelated overlays alone', () => {
    const tooltip = layer();
    const drawer = layer();
    const select = layer(drawer);
    expect(pushLayer([tooltip, select], drawer)).toEqual([tooltip, drawer, select]);
    expect(pushLayer([select], tooltip)).toEqual([select, tooltip]);
  });

  it('returns a new stack', () => {
    const stack: OverlayLayer[] = [layer()];
    expect(pushLayer(stack, layer())).not.toBe(stack);
    expect(stack).toHaveLength(1);
  });
});
