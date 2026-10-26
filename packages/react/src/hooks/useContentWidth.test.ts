import { describe, expect, it } from 'vitest';
import { fitLabels, fitLabel } from './useContentWidth';

describe('fitLabels', () => {
  it('is the minimum without labels, and for labels that fit in it', () => {
    expect(fitLabels([], 264, 320)).toEqual({ width: 264, truncated: new Set() });
    expect(fitLabels([{ id: 'a', need: 180 }], 264, 320).width).toBe(264);
    expect(fitLabels([{ id: 'a', need: 264 }], 264, 320).width).toBe(264);
  });

  it('grows to the widest label', () => {
    const labels = [
      { id: 'a', need: 280 },
      { id: 'b', need: 305 },
      { id: 'c', need: 190 },
    ];
    expect(fitLabels(labels, 264, 320)).toEqual({ width: 305, truncated: new Set() });
  });

  it('rounds up to a whole pixel, so a label never loses its last fraction', () => {
    expect(fitLabels([{ id: 'a', need: 300.2 }], 264, 320).width).toBe(301);
    expect(fitLabels([{ id: 'a', need: 300 }], 264, 320).width).toBe(300);
    // Noise of a measurement, not a pixel more.
    expect(fitLabels([{ id: 'a', need: 300.0004 }], 264, 320).width).toBe(300);
  });

  it('stops at the maximum, and names the labels that need more than it', () => {
    const labels = [
      { id: 'short', need: 200 },
      { id: 'fits', need: 320 },
      { id: 'long', need: 411.5 },
      { id: 'barely', need: 320.2 },
    ];
    expect(fitLabels(labels, 264, 320)).toEqual({
      width: 320,
      truncated: new Set(['long', 'barely']),
    });
  });

  it('cuts a label by its own need, not by what the others need', () => {
    const long = { id: 'long', need: 350 };
    expect(fitLabels([long], 264, 320).truncated).toEqual(new Set(['long']));
    expect(fitLabels([long, { id: 'other', need: 400 }], 264, 320).truncated).toEqual(
      new Set(['long', 'other'])
    );
    expect(fitLabels([long], 264, 360)).toEqual({ width: 350, truncated: new Set() });
  });

  it('keeps the minimum when the maximum is smaller', () => {
    expect(fitLabels([{ id: 'a', need: 300 }], 264, 200)).toEqual({
      width: 264,
      truncated: new Set(['a']),
    });
    expect(fitLabels([], 264, 264).width).toBe(264);
  });
});

describe('fitLabel', () => {
  it('marks an element with the id of its label', () => {
    expect(fitLabel(':r1:')).toEqual({ 'data-fit-label': ':r1:' });
  });
});
