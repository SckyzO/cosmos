import { useEffect, useState, type CSSProperties } from 'react';
import { MUTED, TRACK } from './colors';
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
  // `maxWidth`: a chart wider than its parent would widen the page. `direction`: a chart keeps
  // its left-to-right axes under `dir="rtl"`; left alone, the SVG's `text-anchor` would read
  // `start` and `end` from the page and put the labels on the wrong side of their marks.
  style: { width, height, maxWidth: '100%', direction: 'ltr' } satisfies CSSProperties,
});

/**
 * `0` until a web font finishes loading after the chart mounted, then `1`
 * (one more render of the chart, no more). `YAxis width="auto"` measures its
 * labels once, in the fallback font if the web font is not there yet, and a
 * label set in the real font can overrun the axis: `useAxis` (axes.ts) hands
 * the axes a new object when this turns `1`, and they measure again. A chart
 * that mounts with the font ready never changes, and nothing runs where
 * `document.fonts` is missing (SSR, old browsers).
 */
export const useFontsLoaded = (): 0 | 1 => {
  const [loaded, setLoaded] = useState<0 | 1>(0);
  useEffect(() => {
    const fonts = typeof document === 'undefined' ? undefined : document.fonts;
    if (!fonts?.addEventListener) return;
    let active = true;
    const done = () => {
      if (active) setLoaded(1);
    };
    fonts.addEventListener('loadingdone', done);
    // A font already loading when the chart mounts: its event may be on its way
    // or already gone, `ready` settles once it has loaded.
    if (fonts.status === 'loading') void fonts.ready.then(done);
    return () => {
      active = false;
      fonts.removeEventListener('loadingdone', done);
    };
  }, []);
  return loaded;
};

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

type SkeletonProps = ChartSize & {
  /** The chart's name: the skeleton is named by it and the word "loading". */
  ariaLabel: string;
};

/**
 * What a chart draws in place of its plot while `loading`: a block of the chart's
 * size in the theme's track gray. A busy group named by the chart, so a screen
 * reader says what is on its way; it pulses where motion is welcome
 * (`motion-safe`, a Tailwind class like the legend's focus ring, which the
 * consumer's `@source` generates) and holds still under `prefers-reduced-motion`.
 */
export const ChartSkeleton = ({ ariaLabel, height, width = '100%' }: SkeletonProps) => (
  <div
    role="group"
    aria-label={`${ariaLabel}, loading`}
    aria-busy="true"
    data-chart-loading=""
    className="motion-safe:animate-pulse"
    style={{
      width,
      height,
      maxWidth: '100%',
      background: TRACK,
      borderRadius: 'var(--radius-xl, 0.75rem)',
    }}
  />
);
