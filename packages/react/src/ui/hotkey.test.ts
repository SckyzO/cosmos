import { afterEach, describe, expect, it, vi } from 'vitest';
import { isTypingTarget, matchesHotkey } from './hotkey';

type Mods = Partial<Pick<KeyboardEvent, 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>>;

// Only the fields `matchesHotkey` reads: the node project has no DOM events.
const press = (key: string, mods: Mods = {}) =>
  ({
    key,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...mods,
  }) as KeyboardEvent;

const onPlatform = (platform: string) => vi.stubGlobal('navigator', { platform });

describe('matchesHotkey', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('matches a bare key', () => {
    expect(matchesHotkey(press('?'), '?')).toBe(true);
    expect(matchesHotkey(press('k'), 'k')).toBe(true);
    expect(matchesHotkey(press('j'), 'k')).toBe(false);
  });

  it('compares the key without regard to case, on both sides', () => {
    expect(matchesHotkey(press('K'), 'k')).toBe(true);
    expect(matchesHotkey(press('k'), 'K')).toBe(true);
    expect(matchesHotkey(press('Escape'), 'escape')).toBe(true);
  });

  it('reads the modifier names without regard to case', () => {
    onPlatform('Win32');
    expect(matchesHotkey(press('k', { ctrlKey: true }), 'MOD+K')).toBe(true);
  });

  describe('mod', () => {
    it('is Ctrl off macOS', () => {
      onPlatform('Win32');
      expect(matchesHotkey(press('k', { ctrlKey: true }), 'mod+k')).toBe(true);
      expect(matchesHotkey(press('k', { metaKey: true }), 'mod+k')).toBe(false);
      expect(matchesHotkey(press('k'), 'mod+k')).toBe(false);
    });

    it.each(['MacIntel', 'iPhone', 'iPad'])('is Cmd on %s', (platform) => {
      onPlatform(platform);
      expect(matchesHotkey(press('k', { metaKey: true }), 'mod+k')).toBe(true);
      expect(matchesHotkey(press('k', { ctrlKey: true }), 'mod+k')).toBe(false);
      expect(matchesHotkey(press('k'), 'mod+k')).toBe(false);
    });

    it('is Ctrl when there is no navigator', () => {
      vi.stubGlobal('navigator', undefined);
      expect(matchesHotkey(press('k', { ctrlKey: true }), 'mod+k')).toBe(true);
    });
  });

  describe('named modifiers', () => {
    it('requires Shift', () => {
      expect(matchesHotkey(press('p', { shiftKey: true }), 'shift+p')).toBe(true);
      expect(matchesHotkey(press('p'), 'shift+p')).toBe(false);
    });

    it('requires Ctrl', () => {
      expect(matchesHotkey(press('s', { ctrlKey: true }), 'ctrl+s')).toBe(true);
      expect(matchesHotkey(press('s'), 'ctrl+s')).toBe(false);
    });

    it.each(['meta', 'cmd'])('reads %s as the Meta key, on every platform', (name) => {
      onPlatform('Win32');
      expect(matchesHotkey(press('s', { metaKey: true }), `${name}+s`)).toBe(true);
      expect(matchesHotkey(press('s', { ctrlKey: true }), `${name}+s`)).toBe(false);
    });

    it.each(['alt', 'option'])('reads %s as the Alt key', (name) => {
      expect(matchesHotkey(press('s', { altKey: true }), `${name}+s`)).toBe(true);
      expect(matchesHotkey(press('s'), `${name}+s`)).toBe(false);
    });
  });

  it('needs every modifier of a combination', () => {
    onPlatform('Win32');
    const combo = 'mod+shift+p';
    expect(matchesHotkey(press('p', { ctrlKey: true, shiftKey: true }), combo)).toBe(true);
    expect(matchesHotkey(press('p', { ctrlKey: true }), combo)).toBe(false);
    expect(matchesHotkey(press('p', { shiftKey: true }), combo)).toBe(false);
  });

  it('needs the key itself, even with every modifier held', () => {
    onPlatform('Win32');
    expect(matchesHotkey(press('o', { ctrlKey: true, shiftKey: true }), 'mod+shift+p')).toBe(false);
  });
});

describe('isTypingTarget', () => {
  // `isTypingTarget` checks `instanceof HTMLElement`, which does not exist in
  // Node: stand in a class and build the targets from it.
  class FakeHTMLElement {
    constructor(
      readonly tagName: string,
      readonly isContentEditable = false
    ) {}
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(['INPUT', 'TEXTAREA', 'SELECT'])('is true for a %s', (tag) => {
    vi.stubGlobal('HTMLElement', FakeHTMLElement);
    expect(isTypingTarget(new FakeHTMLElement(tag) as unknown as EventTarget)).toBe(true);
  });

  it('is true for a contenteditable element', () => {
    vi.stubGlobal('HTMLElement', FakeHTMLElement);
    expect(isTypingTarget(new FakeHTMLElement('DIV', true) as unknown as EventTarget)).toBe(true);
  });

  it.each(['DIV', 'BUTTON', 'A', 'BODY'])('is false for a %s', (tag) => {
    vi.stubGlobal('HTMLElement', FakeHTMLElement);
    expect(isTypingTarget(new FakeHTMLElement(tag) as unknown as EventTarget)).toBe(false);
  });

  it('is false for no target and for a target that is not an element', () => {
    vi.stubGlobal('HTMLElement', FakeHTMLElement);
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget({ tagName: 'INPUT' } as unknown as EventTarget)).toBe(false);
  });
});
