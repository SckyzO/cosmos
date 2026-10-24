import { describe, expect, it } from 'vitest';
import { anchoredStyle, type AnchorRect } from './useAnchorPosition';

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
