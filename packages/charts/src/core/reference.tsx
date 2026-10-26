import { ReferenceArea, ReferenceLine } from 'recharts';
import type { ChartReferenceProps } from '../types';
import { TEXT_SIZE } from './axes';
import { INTENT_COLORS, MUTED } from './colors';

type ReferenceOptions = ChartReferenceProps & {
  /** The axis the values are read on: `y` (default), or `x` on a chart of horizontal bars. */
  axis?: 'x' | 'y';
  /** The id of that axis, when the chart has several. */
  axisId?: string;
};

const DASH = '6 4';
// Behind the series (an area is at 100, a bar at 300) and above the grid.
const BAND_LAYER = 50;

// Plain SVG text in the muted color: an amber or red label would not read on
// the card in every theme, so the line and the band carry the intent.
const labelOf = (value: string, position: 'insideTopRight' | 'insideTopLeft') => ({
  value,
  position,
  fill: MUTED,
  style: { fontSize: TEXT_SIZE },
});

/**
 * The `ReferenceArea`s then the `ReferenceLine`s of a chart's `referenceBands`
 * and `referenceLines`, to render inside it, before `children`. A mark outside
 * the data makes the axis reach it (`ifOverflow="extendDomain"`) instead of
 * vanishing. Colors come from `INTENT_COLORS`, so a theme switch repaints
 * them; labels are text, not markup.
 */
export const referenceMarks = ({
  referenceLines = [],
  referenceBands = [],
  axis = 'y',
  axisId,
}: ReferenceOptions) => {
  const onAxis = axisId === undefined ? {} : { [`${axis}AxisId`]: axisId };
  return [
    ...referenceBands.map((band, i) => {
      const [low, high] = [Math.min(band.from, band.to), Math.max(band.from, band.to)];
      return (
        <ReferenceArea
          key={`band-${i}`}
          {...{ [`${axis}1`]: low, [`${axis}2`]: high }}
          {...onAxis}
          fill={INTENT_COLORS[band.intent ?? 'neutral']}
          fillOpacity={0.14}
          ifOverflow="extendDomain"
          zIndex={BAND_LAYER}
          label={band.label ? labelOf(band.label, 'insideTopLeft') : undefined}
        />
      );
    }),
    ...referenceLines.map((line, i) => (
      <ReferenceLine
        key={`line-${i}`}
        {...{ [axis]: line.value }}
        {...onAxis}
        stroke={INTENT_COLORS[line.intent ?? 'neutral']}
        strokeWidth={1.5}
        strokeDasharray={line.dashed ? DASH : undefined}
        ifOverflow="extendDomain"
        label={line.label ? labelOf(line.label, 'insideTopRight') : undefined}
      />
    )),
  ];
};
