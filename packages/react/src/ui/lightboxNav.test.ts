import { describe, expect, it } from 'vitest';
import { clampIndex, indexForKey, isNearby, stepIndex } from './lightboxNav';

const press = (
  key: string,
  modifiers: Partial<Record<'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey', boolean>> = {}
) => ({
  key,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...modifiers,
});

describe('clampIndex', () => {
  it('keeps an index that is in range', () => {
    expect(clampIndex(0, 5)).toBe(0);
    expect(clampIndex(3, 5)).toBe(3);
    expect(clampIndex(4, 5)).toBe(4);
  });

  it('pulls an index back to the first or the last picture', () => {
    expect(clampIndex(-2, 5)).toBe(0);
    expect(clampIndex(5, 5)).toBe(4);
    expect(clampIndex(40, 5)).toBe(4);
  });

  it('rounds down a fraction and treats a missing number as the first picture', () => {
    expect(clampIndex(2.7, 5)).toBe(2);
    expect(clampIndex(Number.NaN, 5)).toBe(0);
  });

  it('is 0 when there is nothing to show', () => {
    expect(clampIndex(3, 0)).toBe(0);
  });
});

describe('stepIndex', () => {
  it('moves by the step', () => {
    expect(stepIndex(2, 5, 1)).toBe(3);
    expect(stepIndex(2, 5, -1)).toBe(1);
  });

  it('does not loop: it stops on the last and on the first picture', () => {
    expect(stepIndex(4, 5, 1)).toBe(4);
    expect(stepIndex(0, 5, -1)).toBe(0);
  });
});

describe('indexForKey', () => {
  it('moves along the line with the arrows: right is next in ltr', () => {
    expect(indexForKey(press('ArrowRight'), 2, 5, 'ltr')).toBe(3);
    expect(indexForKey(press('ArrowLeft'), 2, 5, 'ltr')).toBe(1);
  });

  it('flips the arrows in rtl: left is next', () => {
    expect(indexForKey(press('ArrowLeft'), 2, 5, 'rtl')).toBe(3);
    expect(indexForKey(press('ArrowRight'), 2, 5, 'rtl')).toBe(1);
  });

  it('keeps Home and End on the first and last picture in both directions', () => {
    for (const direction of ['ltr', 'rtl'] as const) {
      expect(indexForKey(press('Home'), 3, 5, direction)).toBe(0);
      expect(indexForKey(press('End'), 1, 5, direction)).toBe(4);
    }
  });

  it('stays on the end picture when an arrow points past it', () => {
    expect(indexForKey(press('ArrowRight'), 4, 5, 'ltr')).toBe(4);
    expect(indexForKey(press('ArrowLeft'), 0, 5, 'ltr')).toBe(0);
    expect(indexForKey(press('ArrowLeft'), 4, 5, 'rtl')).toBe(4);
    expect(indexForKey(press('ArrowRight'), 0, 5, 'rtl')).toBe(0);
  });

  it('is undefined for a key that is not the viewer’s', () => {
    expect(indexForKey(press('Enter'), 2, 5, 'ltr')).toBeUndefined();
    expect(indexForKey(press('ArrowUp'), 2, 5, 'ltr')).toBeUndefined();
    expect(indexForKey(press('a'), 2, 5, 'rtl')).toBeUndefined();
  });

  it('leaves a key with a modifier to the browser (Alt+Left is Back)', () => {
    expect(indexForKey(press('ArrowLeft', { altKey: true }), 2, 5, 'ltr')).toBeUndefined();
    expect(indexForKey(press('ArrowRight', { ctrlKey: true }), 2, 5, 'ltr')).toBeUndefined();
    expect(indexForKey(press('Home', { metaKey: true }), 2, 5, 'ltr')).toBeUndefined();
    expect(indexForKey(press('ArrowRight', { shiftKey: true }), 2, 5, 'ltr')).toBeUndefined();
  });

  it('is undefined when there is nothing to move through', () => {
    expect(indexForKey(press('ArrowRight'), 0, 1, 'ltr')).toBeUndefined();
    expect(indexForKey(press('Home'), 0, 0, 'ltr')).toBeUndefined();
  });
});

describe('isNearby', () => {
  it('is true for the current picture and the one on each side', () => {
    expect(isNearby(4, 4)).toBe(true);
    expect(isNearby(3, 4)).toBe(true);
    expect(isNearby(5, 4)).toBe(true);
  });

  it('is false for the others', () => {
    expect(isNearby(2, 4)).toBe(false);
    expect(isNearby(6, 4)).toBe(false);
  });
});
