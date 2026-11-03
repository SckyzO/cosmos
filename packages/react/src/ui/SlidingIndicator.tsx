import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import type { IndicatorMarker } from '../hooks/useIndicator';

// Internal to the package: the marker of Tabs and SegmentedControl. Not exported from the barrel.

/** Which sides of the active option the marker follows: along the line, across it, or the whole box. */
export type IndicatorAxes = 'inline' | 'block' | 'both';

const SLIDE: Record<IndicatorAxes, string> = {
  inline: 'transition-[inset-inline-start,inline-size]',
  block: 'transition-[inset-block-start,block-size]',
  both: 'transition-[inset-inline-start,inline-size,inset-block-start,block-size]',
};

/**
 * The marker `useIndicator` follows the active option with: the underline of a tab, the fill of a
 * pill or a segment. It sits in the host (`relative isolate`) behind the options, `-z-10` inside
 * the host's own stacking context, and is placed with logical offsets so it follows the direction.
 * `className` gives it a look and, for an axis it does not follow, a place and a size.
 *
 * It slides over `--cosmos-motion-base` easing in and out when the active option changed, and is
 * put where it belongs with no transition at all on its first placement and after a resize.
 */
export const SlidingIndicator = ({
  marker,
  axes,
  className,
}: {
  marker: IndicatorMarker;
  axes: IndicatorAxes;
  className?: string;
}) => {
  const { box, slides } = marker;
  if (!box) return null;
  const style: CSSProperties = {};
  if (axes !== 'block') {
    style.insetInlineStart = box.inlineStart;
    style.inlineSize = box.inlineSize;
  }
  if (axes !== 'inline') {
    style.insetBlockStart = box.blockStart;
    style.blockSize = box.blockSize;
  }
  return (
    <span
      aria-hidden
      data-slot="indicator"
      style={style}
      className={clsx(
        'pointer-events-none absolute -z-10',
        slides && [SLIDE[axes], 'duration-(--cosmos-motion-base) ease-(--cosmos-ease-in-out)'],
        className
      )}
    />
  );
};
