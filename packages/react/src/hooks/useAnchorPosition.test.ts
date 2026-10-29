import { describe, expect, it } from 'vitest';
import { anchoredStyle, resolveSide, type AnchorRect } from './useAnchorPosition';

// A 100×40 anchor whose top-left corner sits at (200, 50).
const rect: AnchorRect = { top: 50, left: 200, right: 300, bottom: 90, width: 100, height: 40 };

describe('anchoredStyle', () => {
  it('centers the panel under the anchor by default', () => {
    expect(anchoredStyle(rect)).toEqual({
      '--anchor-width': '100px',
      top: 90,
      left: 250,
      transform: 'translateX(-50%)',
    });
  });

  it('adds the offset on every side', () => {
    expect(anchoredStyle(rect, { side: 'bottom', offset: 8 })).toMatchObject({ top: 98 });
    expect(anchoredStyle(rect, { side: 'top', offset: 8 })).toMatchObject({ top: 42 });
    expect(anchoredStyle(rect, { side: 'right', offset: 8 })).toMatchObject({ left: 308 });
    expect(anchoredStyle(rect, { side: 'left', offset: 8 })).toMatchObject({ left: 192 });
  });

  it('lines up the left edges with `start`, untransformed below the anchor', () => {
    const style = anchoredStyle(rect, { side: 'bottom', align: 'start', offset: 6 });
    expect(style).toMatchObject({ top: 96, left: 200 });
    expect(style.transform).toBeUndefined();
    expect(style.maxWidth).toBeUndefined();
  });

  it('lines up the right edges with `end` and keeps 16px from the left of the screen', () => {
    expect(anchoredStyle(rect, { side: 'bottom', align: 'end' })).toMatchObject({
      left: 300,
      transform: 'translateX(-100%)',
      maxWidth: 284,
    });
  });

  it('swaps `start` and `end` in rtl, and leaves the centered and vertical sides alone', () => {
    const rtl = (placement: Parameters<typeof anchoredStyle>[1]) =>
      anchoredStyle(rect, placement, undefined, 'rtl');
    // `start` is the right edge in rtl: the panel hangs from it, as an `end` one does in ltr.
    expect(rtl({ align: 'start' })).toEqual(anchoredStyle(rect, { align: 'end' }));
    expect(rtl({ align: 'end' })).toEqual(anchoredStyle(rect, { align: 'start' }));
    expect(rtl({ align: 'start', side: 'top' })).toEqual(
      anchoredStyle(rect, { align: 'end', side: 'top' })
    );
    expect(rtl({})).toEqual(anchoredStyle(rect));
    expect(rtl({ side: 'right', align: 'end' })).toEqual(
      anchoredStyle(rect, { side: 'right', align: 'end' })
    );
    // ltr is the default.
    expect(anchoredStyle(rect, { align: 'start' }, undefined, 'ltr')).toEqual(
      anchoredStyle(rect, { align: 'start' })
    );
  });

  it('puts the `start` and `end` sides left and right in ltr, right and left in rtl', () => {
    const rtl = (placement: Parameters<typeof anchoredStyle>[1]) =>
      anchoredStyle(rect, placement, undefined, 'rtl');
    expect(anchoredStyle(rect, { side: 'end', offset: 8 })).toEqual(
      anchoredStyle(rect, { side: 'right', offset: 8 })
    );
    expect(anchoredStyle(rect, { side: 'start', offset: 8 })).toEqual(
      anchoredStyle(rect, { side: 'left', offset: 8 })
    );
    expect(rtl({ side: 'end', offset: 8 })).toEqual(
      anchoredStyle(rect, { side: 'left', offset: 8 })
    );
    expect(rtl({ side: 'start', offset: 8 })).toEqual(
      anchoredStyle(rect, { side: 'right', offset: 8 })
    );
    expect(resolveSide(rect, { side: 'end' }, undefined, 'rtl')).toBe('left');
  });

  it('lifts a `top` panel by its own height, whatever the alignment', () => {
    expect(anchoredStyle(rect, { side: 'top' }).transform).toBe('translate(-50%, -100%)');
    expect(anchoredStyle(rect, { side: 'top', align: 'start' }).transform).toBe(
      'translate(0, -100%)'
    );
    expect(anchoredStyle(rect, { side: 'top', align: 'end' }).transform).toBe(
      'translate(-100%, -100%)'
    );
  });

  it('centers a `left` or `right` panel vertically and ignores the alignment', () => {
    expect(anchoredStyle(rect, { side: 'right', align: 'end' })).toEqual({
      '--anchor-width': '100px',
      top: 70,
      left: 300,
      transform: 'translateY(-50%)',
    });
    expect(anchoredStyle(rect, { side: 'left' })).toMatchObject({
      top: 70,
      left: 200,
      transform: 'translate(-100%, -50%)',
    });
  });

  it('gives the panel the anchor width with `matchWidth`', () => {
    expect(anchoredStyle(rect, { align: 'start', matchWidth: true })).toMatchObject({
      width: 100,
      left: 200,
    });
    expect(anchoredStyle(rect).width).toBeUndefined();
  });
});

describe('anchoredStyle collision handling', () => {
  const viewport = { width: 1000, height: 800 };
  const panel = (width: number, height: number) => ({ panel: { width, height }, viewport });
  // A 100×40 anchor near the bottom of the screen: 60px below it, 700px above.
  const low: AnchorRect = { top: 700, left: 200, right: 300, bottom: 740, width: 100, height: 40 };

  it('changes nothing while the panel fits on its side', () => {
    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      const placement = { side, offset: 8 };
      expect(anchoredStyle(rect, placement, panel(150, 30))).toEqual(
        anchoredStyle(rect, placement)
      );
      expect(resolveSide(rect, placement, panel(150, 30))).toBe(side);
    }
  });

  it('flips a `bottom` panel the viewport cuts to the top, where there is more room', () => {
    const placement = { side: 'bottom', align: 'start', offset: 4 } as const;
    expect(resolveSide(low, placement, panel(180, 120))).toBe('top');
    expect(anchoredStyle(low, placement, panel(180, 120))).toEqual(
      anchoredStyle(low, { ...placement, side: 'top' })
    );
  });

  it('flips a `top` panel the viewport cuts to the bottom', () => {
    // 42px above the anchor and its 8px offset, 702px below.
    expect(resolveSide(rect, { side: 'top', offset: 8 }, panel(100, 60))).toBe('bottom');
    expect(anchoredStyle(rect, { side: 'top', offset: 8 }, panel(100, 60))).toMatchObject({
      top: 98,
      transform: 'translateX(-50%)',
    });
  });

  it('flips a `right` or `left` panel the viewport cuts to the other side', () => {
    const nearRight: AnchorRect = { ...rect, left: 850, right: 950 };
    expect(resolveSide(nearRight, { side: 'right', offset: 8 }, panel(120, 30))).toBe('left');
    expect(anchoredStyle(nearRight, { side: 'right', offset: 8 }, panel(120, 30))).toMatchObject({
      left: 842,
      transform: 'translate(-100%, -50%)',
    });
    expect(resolveSide(rect, { side: 'left', offset: 8 }, panel(250, 30))).toBe('right');
  });

  it('flips a logical side the viewport cuts, as the physical side it stands for', () => {
    const nearRight: AnchorRect = { ...rect, left: 850, right: 950 };
    // `end` is the right of the anchor in ltr: cut there, it goes to the left.
    expect(resolveSide(nearRight, { side: 'end', offset: 8 }, panel(120, 30))).toBe('left');
    // In rtl `start` is the right of the anchor: the same flip, from the other word.
    expect(resolveSide(nearRight, { side: 'start', offset: 8 }, panel(120, 30), 'rtl')).toBe(
      'left'
    );
  });

  it('flips only to a side with more room, when the panel fits on neither', () => {
    // 60px below the anchor, 50px above it: the 200px panel fits on neither side.
    const bounds = { panel: { width: 100, height: 200 }, viewport: { width: 1000, height: 150 } };
    expect(resolveSide(rect, { side: 'bottom' }, bounds)).toBe('bottom');
    expect(resolveSide(rect, { side: 'top' }, bounds)).toBe('bottom');
  });

  it('flips only a panel the viewport cuts, not one ending close to the edge', () => {
    // 56px between the anchor's 4px offset and the bottom of the screen.
    expect(resolveSide(low, { side: 'bottom', offset: 4 }, panel(100, 56))).toBe('bottom');
    expect(resolveSide(low, { side: 'bottom', offset: 4 }, panel(100, 57))).toBe('top');
  });

  it('moves a panel the viewport cuts on the cross axis back inside, 16px from the edge', () => {
    const nearRight: AnchorRect = { ...rect, left: 900, right: 1000 };
    // `start`: its left edge would sit at 900 and its right edge at 1100.
    expect(anchoredStyle(nearRight, { align: 'start' }, panel(200, 50))).toMatchObject({
      left: 784,
      '--anchor-shift': '-116px',
    });
    const nearLeft: AnchorRect = { ...rect, left: 0, right: 40, width: 40 };
    // `center`: from -80 to 120, around the anchor's center at 20.
    expect(anchoredStyle(nearLeft, {}, panel(200, 50))).toMatchObject({
      left: 116,
      transform: 'translateX(-50%)',
      '--anchor-shift': '96px',
    });
  });

  it('clamps a `left` or `right` panel vertically', () => {
    const nearTop: AnchorRect = {
      top: 0,
      left: 200,
      right: 300,
      bottom: 20,
      width: 100,
      height: 20,
    };
    // Centered on the anchor, from -40 to 60.
    expect(anchoredStyle(nearTop, { side: 'right' }, panel(80, 100))).toMatchObject({
      top: 66,
      left: 300,
      transform: 'translateY(-50%)',
      '--anchor-shift': '56px',
    });
  });

  it('keeps the left edge in view and narrows a panel wider than the viewport', () => {
    expect(anchoredStyle(rect, { align: 'start' }, panel(1200, 50))).toMatchObject({
      left: 16,
      '--anchor-shift': '-184px',
      maxWidth: 968,
    });
    // Narrowed, it measures 968px on the next pass and keeps its maxWidth.
    expect(anchoredStyle(rect, { align: 'start' }, panel(968, 50)).maxWidth).toBe(968);
  });

  it('leaves a panel that matches its anchor as wide as the anchor', () => {
    // A field 12px from each edge of a 375px screen: its list stays 351px wide.
    const field: AnchorRect = { ...rect, left: 12, right: 363, width: 351 };
    const narrow = { panel: { width: 351, height: 200 }, viewport: { width: 375, height: 800 } };
    const style = anchoredStyle(field, { align: 'start', matchWidth: true }, narrow);
    expect(style).toMatchObject({ width: 351, left: 12 });
    expect(style.maxWidth).toBeUndefined();
  });

  it('keeps an `end` panel on a narrow rtl screen, as an ltr one stays on it', () => {
    // A bell at the start of a 375px line: the left of the screen in rtl, the right in ltr.
    const narrow = { width: 375, height: 800 };
    const bell = { top: 0, left: 0, right: 40, bottom: 40, width: 40, height: 40 };
    const rtl = (width: number) =>
      anchoredStyle(
        bell,
        { align: 'end' },
        { panel: { width, height: 300 }, viewport: narrow },
        'rtl'
      );
    // Measured at its 384px, it is cut: narrowed, and moved 16px in for this pass.
    expect(rtl(384)).toMatchObject({ left: 16, maxWidth: 343 });
    // Measured again at 343px, it is all in view, so it stays at the bell's edge, still narrowed.
    expect(rtl(343)).toMatchObject({ left: 0, maxWidth: 343 });
    expect(rtl(343)).not.toHaveProperty('--anchor-shift');
    const ltrBell = { ...bell, left: 335, right: 375 };
    const ltr = anchoredStyle(
      ltrBell,
      { align: 'end' },
      { panel: { width: 359, height: 300 }, viewport: narrow }
    );
    expect(ltr).toMatchObject({ left: 375, transform: 'translateX(-100%)', maxWidth: 359 });
  });

  it('leaves a panel the viewport does not cut where it is, even close to the edge', () => {
    const atTheEdge: AnchorRect = { ...rect, left: 896, right: 996 };
    const style = anchoredStyle(atTheEdge, { align: 'end' }, panel(200, 50));
    expect(style).toEqual(anchoredStyle(atTheEdge, { align: 'end' }));
    expect(style).not.toHaveProperty('--anchor-shift');
  });
});
