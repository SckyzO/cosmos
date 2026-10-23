/**
 * Whether `e` is the `hotkey` combination: names joined with `+`, the key
 * last (`mod+k`, `mod+shift+p`, `?`). `mod` is Cmd on macOS and Ctrl
 * elsewhere; `cmd` means `meta` and `option` means `alt`.
 *
 * The modifiers must match exactly: Ctrl, Meta and Alt are held when the
 * hotkey names them and only then, so `k` does not fire on Ctrl+K and
 * `mod+p` does not fire on Mod+Shift+P. Shift is held exactly when the
 * hotkey names it too, except for a key that is a single character, neither
 * a letter nor a digit (`?`, `/`): many layouts type those with Shift, so
 * Shift is ignored for them, named or not.
 */
export const matchesHotkey = (e: KeyboardEvent, hotkey: string): boolean => {
  const parts = hotkey.toLowerCase().split('+');
  const expectMod = parts.includes('mod');
  const expectShift = parts.includes('shift');
  const expectAlt = parts.includes('alt') || parts.includes('option');
  const key = parts[parts.length - 1];

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform);
  const expectMeta = parts.includes('meta') || parts.includes('cmd') || (expectMod && isMac);
  const expectCtrl = parts.includes('ctrl') || (expectMod && !isMac);

  if (e.metaKey !== expectMeta || e.ctrlKey !== expectCtrl || e.altKey !== expectAlt) return false;
  const shiftIsFree = /^[^\p{L}\p{N}]$/u.test(key);
  if (!shiftIsFree && e.shiftKey !== expectShift) return false;
  return e.key.toLowerCase() === key;
};

/** A form control or editable element: a key pressed there is text being typed. */
export const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
