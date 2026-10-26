import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

/** What a label needs: its id, and the width of the container that shows it whole (px). */
export type LabelNeed = { id: string; need: number };

/** The container's width, and the ids of the labels that do not fit in it even at its widest. */
export type ContentFit = { width: number; truncated: ReadonlySet<string> };

// Below this, a fraction of a pixel is measurement noise, not a label that needs one more pixel.
const TOLERANCE = 0.001;

const LABEL_ATTR = 'data-fit-label';

const NO_LABELS: ReadonlySet<string> = new Set();

/**
 * Props that mark an element as a label `useContentWidth` measures: spread them on the element
 * that holds the text alone (a `truncate` span that fills its row), with an id of its own.
 */
export const fitLabel = (id: string) => ({ [LABEL_ATTR]: id });

/**
 * The width that shows every label whole, held between `min` and `max` (never below `min`, even
 * when `max` is smaller), and the labels that still do not fit at that width. A label does not fit
 * exactly when it needs more than `max`, whatever the other labels need.
 */
export function fitLabels(labels: readonly LabelNeed[], min: number, max: number): ContentFit {
  const cap = Math.max(min, max);
  let widest = min;
  const truncated = new Set<string>();
  for (const { id, need } of labels) {
    // Whole pixels, rounded up: a width of 300.2 would cut a label that needs 300.1.
    const px = Math.ceil(need - TOLERANCE);
    widest = Math.max(widest, px);
    if (px > cap) truncated.add(id);
  }
  return { width: Math.min(widest, cap), truncated };
}

const sameFit = (a: ContentFit, b: ContentFit) =>
  a.width === b.width &&
  a.truncated.size === b.truncated.size &&
  [...b.truncated].every((id) => a.truncated.has(id));

/**
 * What each visible label needs, or `null` when a row is squeezed to nothing and cannot tell.
 *
 * A label's text is as wide as a `Range` over it says, whatever the room its element is given. The
 * rest of the row (margins, padding, icon, badge, chevron) is `container width - label width`, the
 * same at every container width as long as the label has room at all: so a label needs
 * `container width - label width + text width`, measured with the container at whatever width it has
 * right now, mid-transition included, with no hidden copy and no dependence on the width it sets.
 * Labels in a folded sub-menu (`display: none`) have no box and drop out. A label with no room left
 * (a sidebar expanding from its rail, 72 px wide) cannot give its row's share: `null`, and the
 * caller measures again once the container has settled.
 */
const measureLabels = (container: HTMLElement): LabelNeed[] | null => {
  // Some DOM implementations used in tests have no `Range` boxes: nothing to measure there.
  const range = document.createRange?.();
  if (!range?.getBoundingClientRect) return null;
  const containerWidth = container.getBoundingClientRect().width;
  const labels: LabelNeed[] = [];
  for (const label of container.querySelectorAll<HTMLElement>(`[${LABEL_ATTR}]`)) {
    if (label.getClientRects().length === 0) continue;
    range.selectNodeContents(label);
    const text = range.getBoundingClientRect().width;
    if (text === 0) continue;
    const room = label.getBoundingClientRect().width;
    if (room === 0) return null;
    labels.push({ id: label.getAttribute(LABEL_ATTR) ?? '', need: containerWidth - room + text });
  }
  return labels;
};

export type ContentWidth = ContentFit & {
  /**
   * Whether a change of `width` may transition. False until the first frames are painted, so the
   * width measured at mount shows at once instead of growing from `min` on every page load.
   */
  animated: boolean;
};

/**
 * The width a container needs to show its labels (see `fitLabel`) whole, between `min` and `max`,
 * and the labels `max` still cuts. `width` is `min` until `enabled` and the first measurement; while
 * not `enabled` (a collapsed sidebar has no labels) it keeps its last value, and `truncated` is empty.
 *
 * Measured before the first paint, then again when the container's rows change (nodes added or
 * removed, text changed, a list folded or unfolded, a class changed), when the text size or the font
 * changes (`data-text-size` and `data-font` on `<html>`, a web font loading), and when the container's
 * own `width` transition ends. Environments without the observers measure once, at mount.
 *
 * Internal to the package, not exported.
 */
export const useContentWidth = (
  ref: RefObject<HTMLElement | null>,
  { min, max, enabled }: { min: number; max: number; enabled: boolean }
): ContentWidth => {
  const [fit, setFit] = useState<ContentFit>(() => ({ width: min, truncated: NO_LABELS }));
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setAnimated(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container || !enabled) return;
    const measure = () => {
      const labels = measureLabels(container);
      if (!labels) return;
      const next = fitLabels(labels, min, max);
      setFit((prev) => (sameFit(prev, next) ? prev : next));
    };
    measure();

    const cleanups: Array<() => void> = [];
    if (typeof MutationObserver !== 'undefined') {
      const rows = new MutationObserver(measure);
      rows.observe(container, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['hidden', 'class'],
      });
      const text = new MutationObserver(measure);
      text.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-text-size', 'data-font'],
      });
      cleanups.push(
        () => rows.disconnect(),
        () => text.disconnect()
      );
    }
    // Late fonts change every text's width; `document.fonts` is missing in some test environments.
    document.fonts?.addEventListener('loadingdone', measure);
    cleanups.push(() => document.fonts?.removeEventListener('loadingdone', measure));
    // A container that was too narrow to measure (expanding from its rail) is read once it settled.
    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target === container && e.propertyName === 'width') measure();
    };
    container.addEventListener('transitionend', onTransitionEnd);
    cleanups.push(() => container.removeEventListener('transitionend', onTransitionEnd));
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [ref, enabled, min, max]);

  const cap = Math.max(min, max);
  return {
    width: Math.min(Math.max(fit.width, min), cap),
    truncated: enabled ? fit.truncated : NO_LABELS,
    animated,
  };
};
