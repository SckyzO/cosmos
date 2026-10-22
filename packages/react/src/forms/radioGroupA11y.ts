import type { KeyboardEvent } from 'react';

const NEXT_KEYS = ['ArrowRight', 'ArrowDown'];
const PREV_KEYS = ['ArrowLeft', 'ArrowUp'];

/**
 * Roving tabIndex for a custom radio group (APG radio group pattern): the
 * checked radio is the group's only tab stop, or the first one when none is.
 */
export const radioTabIndex = (checked: boolean, index: number, anyChecked: boolean) =>
  checked || (!anyChecked && index === 0) ? 0 : -1;

/**
 * Arrow keys move focus to the next or previous radio of the group, wrapping,
 * and check it by clicking it; Home and End go to the first and last radio.
 * Set it as the `onKeyDown` of the `role="radiogroup"` element. Keys with a
 * modifier are left alone: Alt+ArrowLeft is the browser's Back.
 */
export const onRadioGroupKeyDown = (e: KeyboardEvent<HTMLElement>) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const radios = Array.from(
    e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]:not(:disabled)')
  );
  const current = radios.indexOf(e.target as HTMLElement);
  if (current === -1) return;
  let next: number;
  if (NEXT_KEYS.includes(e.key)) next = (current + 1) % radios.length;
  else if (PREV_KEYS.includes(e.key)) next = (current - 1 + radios.length) % radios.length;
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = radios.length - 1;
  else return;
  e.preventDefault();
  radios[next]?.focus();
  radios[next]?.click();
};
