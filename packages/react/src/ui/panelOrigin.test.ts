import { describe, expect, it } from 'vitest';
import { panelOrigin } from './panelOrigin';

describe('panelOrigin', () => {
  it('grows from the top edge of a panel under its trigger, and the bottom edge over it', () => {
    expect(panelOrigin('bottom', 'center')).toBe('top center');
    expect(panelOrigin('top', 'center')).toBe('bottom center');
  });

  it('grows from the corner of the edge it lines up with the anchor, left to right', () => {
    expect(panelOrigin('bottom', 'start', 'ltr')).toBe('top left');
    expect(panelOrigin('bottom', 'end', 'ltr')).toBe('top right');
    expect(panelOrigin('top', 'start', 'ltr')).toBe('bottom left');
    expect(panelOrigin('top', 'end', 'ltr')).toBe('bottom right');
  });

  it('mirrors the corner in right to left, where start is the right edge', () => {
    expect(panelOrigin('bottom', 'start', 'rtl')).toBe('top right');
    expect(panelOrigin('bottom', 'end', 'rtl')).toBe('top left');
    expect(panelOrigin('top', 'start', 'rtl')).toBe('bottom right');
    expect(panelOrigin('top', 'end', 'rtl')).toBe('bottom left');
  });

  it('keeps the middle when centered, in either direction', () => {
    expect(panelOrigin('bottom', 'center', 'rtl')).toBe('top center');
    expect(panelOrigin('top', 'center', 'rtl')).toBe('bottom center');
  });

  it('grows from the edge facing the trigger of a panel at its side', () => {
    // The panel to the left of the trigger faces it with its right edge, and the reverse.
    expect(panelOrigin('left', 'center')).toBe('center right');
    expect(panelOrigin('right', 'center')).toBe('center left');
    // Alignment is for top and bottom only: the side panels are always centered on the anchor.
    expect(panelOrigin('left', 'start', 'rtl')).toBe('center right');
    expect(panelOrigin('right', 'end', 'rtl')).toBe('center left');
  });

  it('defaults to a centered panel read left to right', () => {
    expect(panelOrigin('bottom')).toBe('top center');
  });
});
