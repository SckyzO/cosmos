import { describe, expect, it } from 'vitest';
import { indicatorBox, sameIndicatorBox, type IndicatorHost } from './indicatorBox';

type Box = { x: number; y: number; width: number; height: number };

// A stand-in for an element: the node project has no DOM, and the function only reads a rect.
const rectOf = ({ x, y, width, height }: Box) => ({
  left: x,
  top: y,
  right: x + width,
  bottom: y + height,
  x,
  y,
  width,
  height,
  toJSON: () => ({}),
});
const target = (box: Box) => ({ getBoundingClientRect: () => rectOf(box) as DOMRect });

const host = (
  box: Box,
  layout: Partial<
    Pick<IndicatorHost, 'offsetWidth' | 'offsetHeight' | 'clientWidth' | 'clientLeft' | 'clientTop'>
  > = {}
): IndicatorHost => ({
  getBoundingClientRect: () => rectOf(box) as DOMRect,
  offsetWidth: box.width,
  offsetHeight: box.height,
  clientWidth: box.width,
  clientLeft: 0,
  clientTop: 0,
  ...layout,
});

const HOST: Box = { x: 100, y: 50, width: 300, height: 40 };

describe('indicatorBox', () => {
  it('measures an option from the host, along the line from its left in left to right', () => {
    const box = indicatorBox(host(HOST), target({ x: 160, y: 50, width: 80, height: 40 }), 'ltr');
    expect(box).toEqual({ inlineStart: 60, inlineSize: 80, blockStart: 0, blockSize: 40 });
  });

  it('measures from the right edge in right to left', () => {
    const box = indicatorBox(host(HOST), target({ x: 160, y: 50, width: 80, height: 40 }), 'rtl');
    // The host ends at x = 400, the option at x = 240.
    expect(box).toEqual({ inlineStart: 160, inlineSize: 80, blockStart: 0, blockSize: 40 });
  });

  it('measures the block axis from the top', () => {
    const column: Box = { x: 0, y: 0, width: 120, height: 200 };
    const box = indicatorBox(host(column), target({ x: 4, y: 70, width: 112, height: 36 }), 'ltr');
    expect(box).toMatchObject({ blockStart: 70, blockSize: 36 });
  });

  it('starts at the padding box: the border of the host is not part of the distance', () => {
    const bordered = host(HOST, { clientLeft: 1, clientTop: 1, clientWidth: 298 });
    const option = target({ x: 101, y: 51, width: 80, height: 38 });
    expect(indicatorBox(bordered, option, 'ltr')).toMatchObject({ inlineStart: 0, blockStart: 0 });
    // In right to left the border on the right counts: 300 - 298 - 1 = 1.
    const flush = target({ x: 400 - 1 - 80, y: 51, width: 80, height: 38 });
    expect(indicatorBox(bordered, flush, 'rtl')).toMatchObject({ inlineStart: 0 });
  });

  it('gives layout pixels while the host is scaled, as a dialog is while it opens', () => {
    // Laid out at 300 x 40, drawn at 95%: every distance reads 5% short, and is divided back.
    const scaled: Box = { x: 100, y: 50, width: 285, height: 38 };
    const drawn = host(scaled, { offsetWidth: 300, offsetHeight: 40 });
    const box = indicatorBox(drawn, target({ x: 157, y: 50, width: 76, height: 38 }), 'ltr');
    expect(box?.inlineStart).toBeCloseTo(60, 5);
    expect(box?.inlineSize).toBeCloseTo(80, 5);
    expect(box?.blockSize).toBeCloseTo(40, 5);
  });

  it('is null while the host has no layout', () => {
    const hidden = host({ x: 0, y: 0, width: 0, height: 0 }, { offsetWidth: 0, offsetHeight: 0 });
    expect(indicatorBox(hidden, target({ x: 0, y: 0, width: 0, height: 0 }), 'ltr')).toBeNull();
  });
});

describe('sameIndicatorBox', () => {
  const a = { inlineStart: 60, inlineSize: 80, blockStart: 0, blockSize: 40 };

  it('ignores a rounding difference and sees a move or a resize', () => {
    expect(sameIndicatorBox(a, { ...a, inlineStart: 60.04, inlineSize: 79.96 })).toBe(true);
    expect(sameIndicatorBox(a, { ...a, inlineStart: 61 })).toBe(false);
    expect(sameIndicatorBox(a, { ...a, inlineSize: 90 })).toBe(false);
    expect(sameIndicatorBox(a, { ...a, blockStart: 4 })).toBe(false);
    expect(sameIndicatorBox(a, { ...a, blockSize: 36 })).toBe(false);
  });
});
