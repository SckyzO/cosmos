import { useCallback } from 'react';

// Recharts 3.10.1: `keyboardEventsMiddleware` reads ArrowLeft and ArrowRight
// only, and treats every chart direction but `left-to-right` as reversed.
// `selectChartDirection` answers `top-to-bottom` for a vertical layout, so
// there ArrowRight goes back, ArrowLeft goes forward and ArrowUp and ArrowDown
// do nothing. Remove this once a Recharts release walks the categories
// downward on ArrowDown.

// The key to hand Recharts for each key pressed: in a vertical layout its
// ArrowLeft is the next category and its ArrowRight the previous one.
const AS_RECHARTS: Record<string, string> = {
  ArrowDown: 'ArrowLeft',
  ArrowRight: 'ArrowLeft',
  ArrowUp: 'ArrowRight',
  ArrowLeft: 'ArrowRight',
};

// The events this hook made, which it must let through.
const remapped = new WeakSet<Event>();

/**
 * The `ref` of a Recharts chart whose `layout` is `vertical`, the categories on
 * the vertical axis (a horizontal `BarChart`): ArrowDown and ArrowRight move
 * to the next category and ArrowUp and ArrowLeft to the previous one. In a
 * `horizontal` layout the ref does nothing.
 *
 * Recharts reads `event.key` from the keydown that reaches its wrapper, so the
 * arrow key is replaced there by the one Recharts reads the way we want: the
 * original is stopped on the chart and a copy with the other key is dispatched
 * in its place. ArrowUp and ArrowDown walk the chart now, so they no longer
 * scroll the page.
 */
export const useCategoryKeys = (layout: 'horizontal' | 'vertical') =>
  useCallback(
    (svg: SVGSVGElement | null) => {
      if (!svg || layout !== 'vertical') return;
      const onKeyDown = (event: KeyboardEvent) => {
        const key = AS_RECHARTS[event.key];
        if (!key || remapped.has(event) || event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') event.preventDefault();
        event.stopPropagation();
        const copy = new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true,
          repeat: event.repeat,
          shiftKey: event.shiftKey,
        });
        remapped.add(copy);
        svg.dispatchEvent(copy);
      };
      svg.addEventListener('keydown', onKeyDown, true);
      return () => svg.removeEventListener('keydown', onKeyDown, true);
    },
    [layout]
  );
