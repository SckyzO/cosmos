import type { Direction } from '../hooks/direction';

// The pure part of `Lightbox`: which picture a step or a key lands on, and which pictures are
// worth requesting. Internal to the package, not exported.

/** `index` as a picture of `count`: a whole number from 0 to `count - 1`, and 0 for an empty list. */
export const clampIndex = (index: number, count: number): number => {
  if (count <= 0 || Number.isNaN(index)) return 0;
  return Math.min(count - 1, Math.max(0, Math.floor(index)));
};

/** Where `step` pictures from `index` lands. Never past the first or the last one: no loop. */
export const stepIndex = (index: number, count: number, step: number): number =>
  clampIndex(index + step, count);

type KeyPress = Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>;

/**
 * The picture a key moves to, or `undefined` when the key is not the viewer's: another key, one
 * pressed with a modifier (Alt+Left is the browser's Back), or a list with nothing to move through.
 * An arrow that points past the first or the last picture gives the picture it is on.
 *
 * The arrows follow the line: toward the end of it is the next picture, so ArrowRight in left to
 * right and ArrowLeft in right to left. Home and End are the first and the last picture.
 */
export const indexForKey = (
  press: KeyPress,
  index: number,
  count: number,
  direction: Direction
): number | undefined => {
  if (count < 2 || press.altKey || press.ctrlKey || press.metaKey || press.shiftKey)
    return undefined;
  const toward = direction === 'rtl' ? -1 : 1;
  switch (press.key) {
    case 'ArrowRight':
      return stepIndex(index, count, toward);
    case 'ArrowLeft':
      return stepIndex(index, count, -toward);
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return undefined;
  }
};

/** Whether `slide` is the current picture or the one on either side: the ones the viewer requests. */
export const isNearby = (slide: number, current: number): boolean => Math.abs(slide - current) <= 1;
