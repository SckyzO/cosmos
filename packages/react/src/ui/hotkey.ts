/**
 * Whether `e` is the `hotkey` combination: names joined with `+`, the key
 * last (`mod+k`, `mod+shift+p`, `?`). `mod` is Cmd on macOS and Ctrl
 * elsewhere; `cmd` means `meta` and `option` means `alt`.
 */
export const matchesHotkey = (e: KeyboardEvent, hotkey: string): boolean => {
  const parts = hotkey.toLowerCase().split('+');
  const expectMod = parts.includes('mod');
  const expectMeta = parts.includes('meta') || parts.includes('cmd');
  const expectCtrl = parts.includes('ctrl');
  const expectShift = parts.includes('shift');
  const expectAlt = parts.includes('alt') || parts.includes('option');
  const key = parts[parts.length - 1];

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform);
  const modPressed = isMac ? e.metaKey : e.ctrlKey;

  if (expectMod && !modPressed) return false;
  if (expectMeta && !e.metaKey) return false;
  if (expectCtrl && !e.ctrlKey) return false;
  if (expectShift && !e.shiftKey) return false;
  if (expectAlt && !e.altKey) return false;
  return e.key.toLowerCase() === key;
};

/** A form control or editable element: a key pressed there is text being typed. */
export const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
