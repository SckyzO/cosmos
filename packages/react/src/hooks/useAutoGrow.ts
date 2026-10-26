import { useCallback, useEffect, useLayoutEffect, type RefObject } from 'react';

type AutoGrowOptions = {
  /** Re-measures when it changes: the field's text. */
  value: string;
  /** Height in px, borders included, past which the field scrolls. */
  maxHeight?: number;
};

const px = (value: string) => Number.parseFloat(value) || 0;

/**
 * Grows a textarea with its content, up to `maxHeight` px, after which it scrolls. Measured before
 * paint whenever `value` changes, and again when the field's width changes and the text rewraps:
 * the height is reset to `auto` so the field can shrink, then set from `scrollHeight`. The
 * scrollbar only shows once the cap is reached, so it never narrows the field mid-measure.
 *
 * Internal to the package, not exported.
 */
export const useAutoGrow = (
  ref: RefObject<HTMLTextAreaElement | null>,
  { value, maxHeight }: AutoGrowOptions
) => {
  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const style = getComputedStyle(el);
    // scrollHeight leaves the borders out; under border-box the height has to include them.
    const border =
      style.boxSizing === 'border-box' ? px(style.borderTopWidth) + px(style.borderBottomWidth) : 0;
    const cap = maxHeight ?? Infinity;
    el.style.overflowY = 'hidden';
    el.style.height = 'auto';
    const needed = el.scrollHeight + border;
    el.style.height = `${Math.min(needed, cap)}px`;
    el.style.overflowY = needed > cap ? 'auto' : 'hidden';
  }, [ref, maxHeight]);

  useLayoutEffect(fit, [fit, value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let width = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      fit();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, fit]);
};
