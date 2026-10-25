import { useRef } from 'react';
import type { ApexOptions } from 'apexcharts';
import 'apexcharts/radialBar';
import { ApexChart } from './ApexChart';
import { percent, useValueFormat } from './formatters';
import { useChartTheme } from './theme';
import { useWidth } from './useWidth';
import type { ChartBaseProps } from './types';

export type SemiCircleGaugeProps = Omit<ChartBaseProps, 'height'> & {
  value: number;
  label?: string;
  /** Color of the arc. Default: the accent. */
  color?: string;
  /** Value at the start of the arc. Default 0. */
  min?: number;
  /** Value at the end of the arc, above `min`. Default 100. Out of range, the arc stops at an end. */
  max?: number;
  /**
   * Format the center value, from `value` itself (not its share of the range), and the
   * `showRange` labels. Default: `67%`.
   * A new function redraws the chart: define it outside the component or wrap it in `useCallback`.
   */
  formatValue?: (value: number) => string;
  /** Write `min` and `max`, formatted, under the two ends of the arc. Default off. */
  showRange?: boolean;
  /**
   * The most the gauge takes, in pixels (default 120). The arc is as wide as the box allows, up
   * to this height: in a narrower box the gauge is shorter, never taller.
   */
  height?: number;
};

// ApexCharts draws a radial plot as a full circle in a square, and the gauge
// keeps its upper half: the arc is a fraction of the plot's size, whichever of
// its width and height is smaller, and the lower half of the plot stays empty.
// The gauge sizes the plot to the arc it wants, moves the arc to the top of it
// and clips the rest. Measured on ApexCharts' plot: the arc's outer radius, and
// the thickness of its ring, as fractions of that size.
const ARC_RADIUS = 0.39;
const ARC_THICKNESS = 0.0976;
// Room under the arc: the `showRange` labels, and a margin without them.
const RANGE_ROW = 20;
const EDGE_ROW = 4;

export const SemiCircleGauge = ({
  value,
  label = '',
  color,
  min = 0,
  max = 100,
  formatValue = percent,
  showRange = false,
  ariaLabel,
  apexOptions,
  height = 120,
  width = '100%',
}: SemiCircleGaugeProps) => {
  const { brand, text, textMuted, track } = useChartTheme();
  const format = useValueFormat(formatValue);
  const box = useRef<HTMLDivElement>(null);
  const boxWidth = useWidth(box);

  // The arc fills the width, up to the height it is allowed.
  const radius =
    boxWidth === undefined
      ? 0
      : Math.floor(Math.min(boxWidth * ARC_RADIUS, height - (showRange ? RANGE_ROW : EDGE_ROW)));
  const plot = Math.round(radius / ARC_RADIUS);
  const thickness = plot * ARC_THICKNESS;
  const valueSize = Math.min(28, Math.max(14, Math.round(radius * 0.24)));
  // Text sits on the base of the arc, inside its hollow: the value over the
  // label, which only takes room when there is one. ApexCharts offsets text
  // from the arc's center, by the middle of its line (measured: the value's
  // is 7px under it at 24px, the label's 4.5px above).
  const labelRow = label ? 18 : 0;
  const options: ApexOptions = {
    chart: {
      type: 'radialBar',
      fontFamily: 'inherit',
      foreColor: text,
      sparkline: { enabled: true },
    },
    colors: [color ?? brand],
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        // The arc's top edge on the top edge of the box.
        offsetY: radius - plot / 2,
        // ApexCharts maps the value onto the arc, clamped to the range, and
        // hands the formatter the value itself.
        min,
        max,
        hollow: { size: '60%' },
        track: { background: track, strokeWidth: '100%', margin: 0 },
        dataLabels: {
          name: { offsetY: -6, fontSize: '12px', color: textMuted },
          value: {
            offsetY: -(labelRow + 4 + valueSize * 0.625) - valueSize * 0.29,
            fontSize: `${valueSize}px`,
            fontWeight: 700,
            formatter: format.axis,
          },
        },
      },
    },
    labels: [label],
  };
  // The ends of the arc, under the middle of its ring.
  const rangeStyle = {
    color: textMuted,
    position: 'absolute',
    top: radius + 2,
    transform: 'translateX(-50%)',
  } as const;
  const end = (side: -1 | 1) => `calc(50% + ${side * (radius - thickness / 2)}px)`;
  return (
    <div
      ref={box}
      style={{
        position: 'relative',
        height: radius + (showRange ? RANGE_ROW : EDGE_ROW),
        overflow: 'hidden',
        width,
      }}
    >
      {radius > 0 && (
        <ApexChart
          type="radialBar"
          options={options}
          series={[value]}
          height={plot}
          width="100%"
          ariaLabel={ariaLabel}
          apexOptions={apexOptions}
          keyboard={false}
        />
      )}
      {radius > 0 && showRange && (
        <>
          <span className="text-2xs" style={{ ...rangeStyle, left: end(-1) }}>
            {format.axis(min)}
          </span>
          <span className="text-2xs" style={{ ...rangeStyle, left: end(1) }}>
            {format.axis(max)}
          </span>
        </>
      )}
    </div>
  );
};
