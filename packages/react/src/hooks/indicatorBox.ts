import type { Direction } from './direction';

// Internal to the package: where the sliding marker of Tabs and SegmentedControl goes. Not
// exported from the barrel.

/**
 * Where an option sits in its host, in layout pixels, along the line (`inline*`, from the side
 * the line starts on: the right in right to left) and across it (`block*`, from the top).
 */
export type IndicatorBox = {
  inlineStart: number;
  inlineSize: number;
  blockStart: number;
  blockSize: number;
};

/** What `indicatorBox` reads of the host: its box, and the layout size and borders it is drawn at. */
export type IndicatorHost = Pick<
  HTMLElement,
  | 'getBoundingClientRect'
  | 'offsetWidth'
  | 'offsetHeight'
  | 'clientWidth'
  | 'clientLeft'
  | 'clientTop'
>;

/**
 * The box of `target` inside `host`, measured from the host's padding box: the origin an
 * absolutely positioned child of the host is placed from, and the one `inset-inline-start` and
 * `inset-block-start` count from in either direction.
 *
 * Read from the rendered boxes, then divided by how much the host is scaled (its rendered width
 * over its layout width): a dialog that opens at 95% still has the layout size its content is
 * placed at, and the marker is placed in that. `null` while the host has no layout (hidden).
 */
export function indicatorBox(
  host: IndicatorHost,
  target: Pick<Element, 'getBoundingClientRect'>,
  direction: Direction
): IndicatorBox | null {
  const { offsetWidth, offsetHeight, clientWidth, clientLeft, clientTop } = host;
  if (offsetWidth === 0 || offsetHeight === 0) return null;
  const outer = host.getBoundingClientRect();
  const inner = target.getBoundingClientRect();
  const scaleX = outer.width / offsetWidth;
  const scaleY = outer.height / offsetHeight;
  if (scaleX === 0 || scaleY === 0) return null;
  // The border on the host's right edge (and a scrollbar there, if it has one).
  const borderAtEnd = offsetWidth - clientWidth - clientLeft;
  const fromLeft = (inner.left - outer.left) / scaleX - clientLeft;
  const fromRight = (outer.right - inner.right) / scaleX - borderAtEnd;
  return {
    inlineStart: direction === 'rtl' ? fromRight : fromLeft,
    inlineSize: inner.width / scaleX,
    blockStart: (inner.top - outer.top) / scaleY - clientTop,
    blockSize: inner.height / scaleY,
  };
}

/** Whether two boxes are the same to a tenth of a pixel: layout rounds, a re-measure must not churn. */
export function sameIndicatorBox(a: IndicatorBox, b: IndicatorBox): boolean {
  return (
    Math.abs(a.inlineStart - b.inlineStart) < 0.1 &&
    Math.abs(a.inlineSize - b.inlineSize) < 0.1 &&
    Math.abs(a.blockStart - b.blockStart) < 0.1 &&
    Math.abs(a.blockSize - b.blockSize) < 0.1
  );
}
