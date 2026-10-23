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

  describe('modifiers the hotkey does not list', () => {
    it.each([
      ['Ctrl', { ctrlKey: true }],
      ['Meta', { metaKey: true }],
      ['Alt', { altKey: true }],
    ] as [string, Mods][])('rejects %s on a bare key', (_name, mods) => {
      onPlatform('Win32');
      expect(matchesHotkey(press('k', mods), 'k')).toBe(false);
      expect(matchesHotkey(press('/', mods), '/')).toBe(false);
      expect(matchesHotkey(press('?', mods), '?')).toBe(false);
    });

    it('lets a bare key through when no modifier is held', () => {
      expect(matchesHotkey(press('k'), 'k')).toBe(true);
    });

    it.each([
      ['Win32', { ctrlKey: true, shiftKey: true }],
      ['MacIntel', { metaKey: true, shiftKey: true }],
    ] as [string, Mods][])('rejects Shift on mod+p on %s', (platform, mods) => {
      onPlatform(platform);
      expect(matchesHotkey(press('P', mods), 'mod+p')).toBe(false);
    });

    it('rejects the other primary modifier next to mod', () => {
      onPlatform('Win32');
      expect(matchesHotkey(press('k', { ctrlKey: true, metaKey: true }), 'mod+k')).toBe(false);
      onPlatform('MacIntel');
      expect(matchesHotkey(press('k', { metaKey: true, ctrlKey: true }), 'mod+k')).toBe(false);
    });

    it('rejects Alt next to mod', () => {
      onPlatform('Win32');
      expect(matchesHotkey(press('k', { ctrlKey: true, altKey: true }), 'mod+k')).toBe(false);
    });

    it('accepts an explicit modifier that mod would also ask for', () => {
      onPlatform('Win32');
      expect(matchesHotkey(press('k', { ctrlKey: true }), 'mod+ctrl+k')).toBe(true);
      onPlatform('MacIntel');
      expect(matchesHotkey(press('k', { metaKey: true }), 'mod+cmd+k')).toBe(true);
    });

    it('needs both modifiers when mod joins the other primary one', () => {
      onPlatform('Win32');
      expect(matchesHotkey(press('k', { ctrlKey: true, metaKey: true }), 'mod+meta+k')).toBe(true);
      expect(matchesHotkey(press('k', { ctrlKey: true }), 'mod+meta+k')).toBe(false);
    });

    it.each([
      ['ctrl+s', { ctrlKey: true }, { metaKey: true }],
      ['ctrl+s', { ctrlKey: true }, { altKey: true }],
      ['ctrl+s', { ctrlKey: true }, { shiftKey: true }],
      ['meta+s', { metaKey: true }, { ctrlKey: true }],
      ['alt+s', { altKey: true }, { ctrlKey: true }],
      ['alt+s', { altKey: true }, { shiftKey: true }],
    ] as [string, Mods, Mods][])('rejects an extra modifier on %s', (hotkey, held, extra) => {
      expect(matchesHotkey(press('s', held), hotkey)).toBe(true);
      expect(matchesHotkey(press('s', { ...held, ...extra }), hotkey)).toBe(false);
    });
  });

  describe('Shift', () => {
    it('must be held for a letter only when the hotkey asks for it', () => {
      expect(matchesHotkey(press('P', { shiftKey: true }), 'p')).toBe(false);
      expect(matchesHotkey(press('P', { shiftKey: true }), 'shift+p')).toBe(true);
      expect(matchesHotkey(press('p'), 'p')).toBe(true);
      expect(matchesHotkey(press('p'), 'shift+p')).toBe(false);
    });

    it('is ignored for a digit, which AZERTY types with Shift', () => {
      // On AZERTY the key arrives as '1' with Shift held; on QWERTY as '1' without.
      expect(matchesHotkey(press('1', { shiftKey: true }), '1')).toBe(true);
      expect(matchesHotkey(press('1'), '1')).toBe(true);
      expect(matchesHotkey(press('1', { shiftKey: true }), 'shift+1')).toBe(true);
    });

    it('is ignored for a digit in mod+1, the other modifiers still counting', () => {
      onPlatform('Win32');
      expect(matchesHotkey(press('1', { ctrlKey: true, shiftKey: true }), 'mod+1')).toBe(true);
      expect(matchesHotkey(press('1', { ctrlKey: true }), 'mod+1')).toBe(true);
      expect(matchesHotkey(press('1', { ctrlKey: true, altKey: true }), 'mod+1')).toBe(false);
      expect(matchesHotkey(press('1', { shiftKey: true }), 'mod+1')).toBe(false);
      onPlatform('MacIntel');
      expect(matchesHotkey(press('1', { metaKey: true, shiftKey: true }), 'mod+1')).toBe(true);
    });

    it('does not turn the QWERTY Shift+1 into a 1', () => {
      // The key arrives as '!', which is not the digit, Shift or not.
      expect(matchesHotkey(press('!', { shiftKey: true }), '1')).toBe(false);
      expect(matchesHotkey(press('!', { shiftKey: true }), 'mod+1')).toBe(false);
    });

    it.each(['Enter', 'ArrowUp', 'Escape', 'Tab'])('must match for %s', (key) => {
      expect(matchesHotkey(press(key, { shiftKey: true }), key)).toBe(false);
      expect(matchesHotkey(press(key), key)).toBe(true);
      expect(matchesHotkey(press(key, { shiftKey: true }), `shift+${key}`)).toBe(true);
      expect(matchesHotkey(press(key), `shift+${key}`)).toBe(false);
    });

    it.each(['?', '/', '!', '>'])('is ignored for the character %s', (key) => {
      // Shift is how many layouts type these: the key arrives with Shift held.
      expect(matchesHotkey(press(key, { shiftKey: true }), key)).toBe(true);
      expect(matchesHotkey(press(key), key)).toBe(true);
    });

    it('is ignored for mod+/ as well, the other modifiers still counting', () => {
      onPlatform('Win32');
      expect(matchesHotkey(press('/', { ctrlKey: true, shiftKey: true }), 'mod+/')).toBe(true);
      expect(matchesHotkey(press('/', { ctrlKey: true }), 'mod+/')).toBe(true);
      expect(matchesHotkey(press('/', { ctrlKey: true, altKey: true }), 'mod+/')).toBe(false);
      expect(matchesHotkey(press('/', { shiftKey: true }), 'mod+/')).toBe(false);
    });
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
