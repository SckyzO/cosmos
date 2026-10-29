/** Whether the page runs on an Apple platform, where `mod` is Cmd and not Ctrl. */
export const isApplePlatform = (): boolean =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform);

/**
 * Whether `e` is the `hotkey` combination: names joined with `+`, the key
 * last (`mod+k`, `mod+shift+p`, `?`). `mod` is Cmd on macOS and Ctrl
 * elsewhere; `cmd` means `meta` and `option` means `alt`.
 *
 * The modifiers must match exactly: Ctrl, Meta and Alt are held when the
 * hotkey names them and only then, so `k` does not fire on Ctrl+K and
 * `mod+p` does not fire on Mod+Shift+P. Shift is held exactly when the
 * hotkey names it too, except for a key that is a single character other
 * than a letter (`?`, `/`, `1`): many layouts type those with Shift (AZERTY
 * types the digits that way), so Shift is ignored for them, named or not.
 * A layout whose Shift+1 gives `!` never matches `1`: the key is not `1`.
 */
export const matchesHotkey = (e: KeyboardEvent, hotkey: string): boolean => {
  const parts = hotkey.toLowerCase().split('+');
  const expectMod = parts.includes('mod');
  const expectShift = parts.includes('shift');
  const expectAlt = parts.includes('alt') || parts.includes('option');
  const key = parts[parts.length - 1];

  const isMac = isApplePlatform();
  const expectMeta = parts.includes('meta') || parts.includes('cmd') || (expectMod && isMac);
  const expectCtrl = parts.includes('ctrl') || (expectMod && !isMac);

  if (e.metaKey !== expectMeta || e.ctrlKey !== expectCtrl || e.altKey !== expectAlt) return false;
  const shiftIsFree = /^[^\p{L}]$/u.test(key);
  if (!shiftIsFree && e.shiftKey !== expectShift) return false;
  return e.key.toLowerCase() === key;
};

/** A form control or editable element: a key pressed there is text being typed. */
export const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

const MOD_LABEL = {
  apple: { mod: '⌘', cmd: '⌘', meta: '⌘', ctrl: 'Ctrl', shift: '⇧', alt: '⌥', option: '⌥' },
  other: {
    mod: 'Ctrl',
    cmd: 'Meta',
    meta: 'Meta',
    ctrl: 'Ctrl',
    shift: 'Shift',
    alt: 'Alt',
    option: 'Alt',
  },
} as const;

/**
 * The keys of `hotkey` as they are written on the platform: `mod+k` is `⌘K` on Apple
 * platforms, run together, and `Ctrl K` elsewhere. For a hint next to the control the
 * hotkey opens, not for matching (`matchesHotkey`).
 */
export const hotkeyLabel = (hotkey: string, isMac: boolean): string => {
  const names = MOD_LABEL[isMac ? 'apple' : 'other'];
  const parts = hotkey.split('+').map((part, i, all) => {
    if (i === all.length - 1) return part.length === 1 ? part.toUpperCase() : part;
    return names[part.toLowerCase() as keyof typeof names] ?? part;
  });
  return parts.join(isMac ? '' : ' ');
};

const ARIA_MOD = {
  ctrl: 'Control',
  meta: 'Meta',
  cmd: 'Meta',
  shift: 'Shift',
  alt: 'Alt',
  option: 'Alt',
} as const;

/** `hotkey` as the value of `aria-keyshortcuts`: `mod+k` is `Meta+K` on Apple platforms, `Control+K` elsewhere. */
export const ariaKeyShortcuts = (hotkey: string, isMac: boolean): string =>
  hotkey
    .split('+')
    .map((part, i, all) => {
      if (i === all.length - 1) return part.length === 1 ? part.toUpperCase() : part;
      const name = part.toLowerCase();
      if (name === 'mod') return isMac ? 'Meta' : 'Control';
      return ARIA_MOD[name as keyof typeof ARIA_MOD] ?? part;
    })
    .join('+');
