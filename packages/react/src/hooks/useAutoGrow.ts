import { useLayoutEffect, type RefObject } from 'react';

/**
 * Grows a textarea with its content, up to `maxHeight` px, after which it scrolls. Measured before
 * paint whenever `value` changes: the height is reset to `auto` so the field can shrink, then set
 * from `scrollHeight`.
 *
 * Internal to the package, not exported.
 */
export const useAutoGrow = (
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  maxHeight: number
) => {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [ref, value, maxHeight]);
};
