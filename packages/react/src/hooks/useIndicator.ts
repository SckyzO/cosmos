import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { directionOf, useDocumentDirection } from './direction';
import { indicatorBox, sameIndicatorBox, type IndicatorBox } from './indicatorBox';

// Internal to the package: the sliding marker of Tabs and SegmentedControl. Not exported from the
// barrel.

export type IndicatorMarker = {
  /** Where the marker sits, in the host's layout pixels. `null` until measured, or with no active option. */
  box: IndicatorBox | null;
  /**
   * Whether a change of `box` is a slide: the active option changed under a marker already
   * there. A first placement, and a re-measure after a resize or a font that loaded, are not: the
   * marker is put where its option is, with no transition to catch up with.
   */
  slides: boolean;
};

const NONE: IndicatorMarker = { box: null, slides: false };

/**
 * Follows the active option of `hostRef` with a marker that slides from one option to the next.
 * The host must be positioned (`relative`) and gets the marker as an absolutely placed child,
 * `inset-inline-start` and `inline-size` from `box.inlineStart` and `box.inlineSize`, and the
 * same along the block axis.
 *
 * `selectors.active` picks the active option inside the host, `selectors.options` every option:
 * all of them are watched, so the marker follows when one is resized by a label, a badge, the text
 * size or a web font that loads, and the host when its width changes. It is measured after every
 * commit as well, since the active option changes with the render that moves it, and a page
 * whose `dir` flips is followed. Measured before the first paint, so there is no first frame
 * without it and nothing to slide in from.
 *
 * `enabled` false returns no marker at all, for a variant that has none.
 */
export function useIndicator<T extends HTMLElement>(
  hostRef: RefObject<T | null>,
  selectors: { active: string; options: string },
  enabled = true
): IndicatorMarker {
  const [marker, setMarker] = useState<IndicatorMarker>(NONE);
  const observer = useRef<ResizeObserver | null>(null);
  const followed = useRef<Element | null>(null);
  // A flip of the page's `dir` renders this component again, which measures again.
  useDocumentDirection();
  const { active, options } = selectors;

  const measure = useCallback(() => {
    const host = hostRef.current;
    const target = host && enabled ? host.querySelector(active) : null;
    const next = host && target ? indicatorBox(host, target, directionOf(host)) : null;
    const changed = target !== followed.current;
    followed.current = next ? target : null;
    setMarker((previous) => {
      if (!next) return previous.box ? NONE : previous;
      const from = previous.box;
      if (from && sameIndicatorBox(from, next)) return previous;
      return { box: next, slides: from !== null && changed };
    });
  }, [hostRef, enabled, active]);

  // After every commit on purpose: the option that is active changes with the render that
  // moves it. The state only moves when the box does, so this does not loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host || !enabled) {
      observer.current?.disconnect();
      observer.current = null;
      // The variant lost its marker: let go of the last one.
      setMarker((previous) => (previous.box ? NONE : previous));
      followed.current = null;
      return;
    }
    // Measuring is the point of the effect: the state follows what the document laid out.
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    // A size change is a re-measure, not a slide: it comes from no click. Observing an element
    // that is already watched does nothing, so each commit only adds the options that are new.
    observer.current ??= new ResizeObserver(measure);
    observer.current.observe(host);
    for (const option of host.querySelectorAll(options)) observer.current.observe(option);
  });

  // The observer outlives the commits, and goes with the component.
  useLayoutEffect(
    () => () => {
      observer.current?.disconnect();
      observer.current = null;
    },
    []
  );

  return marker;
}
