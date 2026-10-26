import type { CSSProperties } from 'react';
import { MUTED } from './colors';
import type { ChartSize } from '../types';

type FrameOptions = ChartSize & {
  ariaLabel: string;
  /**
   * Tab reaches the chart and the arrow keys walk its points (default). Off,
   * the chart is an image out of the tab order: right for a single value.
   */
  keyboard?: boolean;
};

/**
 * What every Recharts chart takes on its root, spread onto it: it fills the
 * width it is given (`width` default `100%`) at `height`, and is named by
 * `ariaLabel`. With `accessibilityLayer`, Recharts makes the chart an
 * `application` in the tab order, and the arrow keys move the tooltip from
 * point to point.
 */
export const frameProps = ({
  height,
  width = '100%',
  ariaLabel,
  keyboard = true,
}: FrameOptions) => ({
  responsive: true,
  accessibilityLayer: keyboard,
  ...(keyboard ? {} : { role: 'img' }),
  'aria-label': ariaLabel,
  // `maxWidth`: a chart wider than its parent would widen the page.
  style: { width, height, maxWidth: '100%' } satisfies CSSProperties,
});

type EmptyProps = ChartSize & {
  /** Plain text. An empty string draws nothing. */
  message: string;
  ariaLabel: string;
};

/** What a chart with no data draws in place of its plot: the message, centered, and nothing around it. */
export const ChartEmpty = ({ message, ariaLabel, height, width = '100%' }: EmptyProps) => (
  <div
    role="group"
    aria-label={ariaLabel}
    data-chart-empty=""
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width,
      height,
      maxWidth: '100%',
      color: MUTED,
      fontSize: 'var(--text-sm, 0.875rem)',
      textAlign: 'center',
    }}
  >
    {message}
  </div>
);
