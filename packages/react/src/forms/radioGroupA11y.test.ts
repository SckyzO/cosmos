import type { KeyboardEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRadioGroupKeyDown, radioTabIndex } from './radioGroupA11y';

describe('radioTabIndex', () => {
  it('makes the checked radio the only tab stop', () => {
    expect(radioTabIndex(true, 2, true)).toBe(0);
    expect(radioTabIndex(false, 0, true)).toBe(-1);
    expect(radioTabIndex(false, 2, true)).toBe(-1);
  });

  it('makes the first radio the tab stop when none is checked', () => {
    expect(radioTabIndex(false, 0, false)).toBe(0);
    expect(radioTabIndex(false, 1, false)).toBe(-1);
    expect(radioTabIndex(false, 3, false)).toBe(-1);
  });
});

describe('onRadioGroupKeyDown', () => {
  // The node project has no DOM: radios are spies, and the group answers
  // `querySelectorAll` with them. The `[role="radio"]:not(:disabled)` selector
  // itself is covered by the stories, in a real browser.
  // `directionOf` reads the computed style of the group: the node project has none, so a stub
  // answers with the direction the test asks for (left to right unless it says otherwise).
  afterEach(() => vi.unstubAllGlobals());
  const setup = (
    count: number,
    focused: number,
    key: string,
    mods: Record<string, boolean> = {},
    direction = 'ltr'
  ) => {
    vi.stubGlobal('getComputedStyle', () => ({ direction }));
    const radios = Array.from({ length: count }, () => ({ focus: vi.fn(), click: vi.fn() }));
    const preventDefault = vi.fn();
    const event = {
      key,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      ...mods,
      target: radios[focused],
      currentTarget: { querySelectorAll: () => radios },
      preventDefault,
    } as unknown as KeyboardEvent<HTMLElement>;
    onRadioGroupKeyDown(event);
    return { radios, preventDefault };
  };

  const moved = (radios: ReturnType<typeof setup>['radios']) =>
    radios.flatMap((r, i) => (r.focus.mock.calls.length > 0 ? [i] : []));

  it.each(['ArrowRight', 'ArrowDown'])('%s moves to the next radio', (key) => {
    const { radios, preventDefault } = setup(4, 1, key);
    expect(moved(radios)).toEqual([2]);
    expect(radios[2].click).toHaveBeenCalledOnce();
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it.each(['ArrowLeft', 'ArrowUp'])('%s moves to the previous radio', (key) => {
    const { radios } = setup(4, 2, key);
    expect(moved(radios)).toEqual([1]);
    expect(radios[1].click).toHaveBeenCalledOnce();
  });

  it('wraps from the last radio to the first and back', () => {
    expect(moved(setup(3, 2, 'ArrowRight').radios)).toEqual([0]);
    expect(moved(setup(3, 0, 'ArrowLeft').radios)).toEqual([2]);
  });

  it('follows the reading direction: in rtl ArrowLeft is next and ArrowRight is previous', () => {
    const next = setup(4, 1, 'ArrowLeft', {}, 'rtl');
    expect(moved(next.radios)).toEqual([2]);
    expect(next.radios[2].click).toHaveBeenCalledOnce();
    expect(moved(setup(4, 2, 'ArrowRight', {}, 'rtl').radios)).toEqual([1]);
    expect(moved(setup(3, 2, 'ArrowLeft', {}, 'rtl').radios)).toEqual([0]);
    expect(moved(setup(3, 0, 'ArrowRight', {}, 'rtl').radios)).toEqual([2]);
  });

  it('keeps ArrowUp, ArrowDown, Home and End the same in rtl', () => {
    expect(moved(setup(4, 1, 'ArrowDown', {}, 'rtl').radios)).toEqual([2]);
    expect(moved(setup(4, 2, 'ArrowUp', {}, 'rtl').radios)).toEqual([1]);
    expect(moved(setup(4, 2, 'Home', {}, 'rtl').radios)).toEqual([0]);
    expect(moved(setup(4, 1, 'End', {}, 'rtl').radios)).toEqual([3]);
  });

  it('wraps on a group of one radio', () => {
    expect(moved(setup(1, 0, 'ArrowRight').radios)).toEqual([0]);
    expect(moved(setup(1, 0, 'ArrowLeft').radios)).toEqual([0]);
  });

  it('Home and End go to the first and last radio', () => {
    expect(moved(setup(4, 2, 'Home').radios)).toEqual([0]);
    expect(moved(setup(4, 1, 'End').radios)).toEqual([3]);
  });

  it('checks the radio it focuses, by clicking it', () => {
    const { radios } = setup(3, 0, 'ArrowDown');
    expect(radios[1].click).toHaveBeenCalledOnce();
    expect(radios[0].click).not.toHaveBeenCalled();
    expect(radios[2].click).not.toHaveBeenCalled();
  });

  it.each(['altKey', 'ctrlKey', 'metaKey', 'shiftKey'])(
    'leaves a key held with %s alone (Alt+ArrowLeft is the browser Back)',
    (modifier) => {
      const { radios, preventDefault } = setup(3, 1, 'ArrowLeft', { [modifier]: true });
      expect(moved(radios)).toEqual([]);
      expect(preventDefault).not.toHaveBeenCalled();
    }
  );

  it('ignores the other keys, without cancelling them', () => {
    for (const key of ['a', 'Tab', 'Enter', ' ', 'PageDown']) {
      const { radios, preventDefault } = setup(3, 1, key);
      expect(moved(radios), key).toEqual([]);
      expect(preventDefault, key).not.toHaveBeenCalled();
    }
  });

  it('ignores a key pressed outside the radios', () => {
    const radios = [{ focus: vi.fn(), click: vi.fn() }];
    const preventDefault = vi.fn();
    vi.stubGlobal('getComputedStyle', () => ({ direction: 'ltr' }));
    onRadioGroupKeyDown({
      key: 'ArrowRight',
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      target: { not: 'a radio' },
      currentTarget: { querySelectorAll: () => radios },
      preventDefault,
    } as unknown as KeyboardEvent<HTMLElement>);
    expect(radios[0].focus).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
