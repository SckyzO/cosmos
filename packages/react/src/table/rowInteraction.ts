import type { MouseEvent } from 'react';

// What a row's own click must not swallow: a click on one of these belongs to it.
const INTERACTIVE =
  'a,button,input,select,textarea,label,summary,[role="button"],[role="link"],[role="menuitem"],[role="checkbox"],[contenteditable="true"]';

/**
 * Whether a click that reached a row is the row's own: not one on a control inside it (a checkbox,
 * a row menu, a link or button in a cell), which keeps its meaning. The row's own link
 * (`data-row-link`) is the row. A React event also bubbles out of a portal (an open menu, a
 * popover) to the row that rendered it, though it is not in the row's DOM: that is not the row's
 * either.
 */
export const isRowClick = (event: MouseEvent<HTMLElement>) => {
  const row = event.currentTarget;
  const target = event.target as Element;
  if (!row.contains(target)) return false;
  const control = target.closest(INTERACTIVE);
  return !control || !row.contains(control) || control.hasAttribute('data-row-link');
};

// Interactive content of a cell stays above the row's stretched link, which covers the row.
export const RAISE_CONTROLS =
  '[&_:is(a,button,input,select,textarea,label,[role=button])]:relative [&_:is(a,button,input,select,textarea,label,[role=button])]:z-[1]';

// The link of a row: its `::after` covers the row (`tr` is `relative`), so the whole row is the
// link, with a native context menu, middle click and status bar, and no handler of ours.
export const ROW_LINK = 'block outline-hidden after:absolute after:inset-0';
