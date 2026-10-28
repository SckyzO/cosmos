import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import type { Intent } from './intent';

export type RibbonPosition = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
export type RibbonIntent = Extract<Intent, 'brand' | 'success' | 'warning' | 'danger' | 'neutral'>;
export type RibbonShape = 'flat' | 'angled' | 'pill';

export type RibbonProps = {
  /**
   * Corner of the parent to anchor to. Parent must be `position: relative` (and `overflow-hidden`
   * for `angled`). `start` and `end` follow the reading direction: under `dir="rtl"` a
   * `top-end` ribbon sits in the top-left corner.
   */
  position?: RibbonPosition;
  intent?: RibbonIntent;
  /**
   * `flat` = rectangle hugging the corner. `angled` = 45° diagonal banner across the corner.
   * `pill` = fully rounded label set inside the card, 12px from the corner of its `position`.
   */
  shape?: RibbonShape;
  children: ReactNode;
  className?: string;
};

// The solid fills of Badge: the text reaches 4.5:1 in the four themes.
const INTENT_BG: Record<RibbonIntent, string> = {
  brand: 'bg-brand-500 text-white',
  success: 'bg-green-500 text-gray-900',
  warning: 'bg-amber-500 text-gray-900',
  danger: 'bg-red-600 text-white',
  neutral: 'bg-gray-600 text-white',
};

// `flat`: round the OUTER corners (away from the parent edge), keep the
// touching corner sharp so it sits flush against the card edge. The corners are logical
// (`ss` top-left in left to right, `se` top-right, `ee` bottom-right, `es` bottom-left), like
// the sides: `end` is the end of the line.
const FLAT_POSITION: Record<RibbonPosition, string> = {
  'top-end': 'top-0 inset-e-0 rounded-es-lg rounded-se-[inherit]',
  'top-start': 'top-0 inset-s-0 rounded-ee-lg rounded-ss-[inherit]',
  'bottom-end': 'bottom-0 inset-e-0 rounded-ss-lg rounded-ee-[inherit]',
  'bottom-start': 'bottom-0 inset-s-0 rounded-se-lg rounded-es-[inherit]',
};

// `angled`: 45° banner across the corner. The parent must be
// `overflow-hidden` so the banner ends are clipped by the card edge. The rotation has no
// logical form: the banner leans the other way when the corner swaps sides.
const ANGLED_POSITION: Record<RibbonPosition, string> = {
  'top-end': 'top-5 -inset-e-12 rotate-45 rtl:-rotate-45',
  'top-start': 'top-5 -inset-s-12 -rotate-45 rtl:rotate-45',
  'bottom-end': 'bottom-5 -inset-e-12 -rotate-45 rtl:rotate-45',
  'bottom-start': 'bottom-5 -inset-s-12 rotate-45 rtl:-rotate-45',
};

// `pill`: a label set in the card, 12px from the corner, not stuck to it.
const PILL_POSITION: Record<RibbonPosition, string> = {
  'top-end': 'top-3 inset-e-3',
  'top-start': 'top-3 inset-s-3',
  'bottom-end': 'bottom-3 inset-e-3',
  'bottom-start': 'bottom-3 inset-s-3',
};

export const Ribbon = ({
  position = 'top-end',
  intent = 'brand',
  shape = 'flat',
  children,
  className,
}: RibbonProps) => {
  if (shape === 'angled') {
    return (
      <span
        className={clsx(
          'text-2xs absolute z-10 w-40 px-2 py-1 text-center font-bold tracking-wide uppercase shadow-md rtl:tracking-normal',
          INTENT_BG[intent],
          ANGLED_POSITION[position],
          className
        )}
      >
        {children}
      </span>
    );
  }
  if (shape === 'pill') {
    return (
      <span
        className={clsx(
          'text-2xs absolute z-10 rounded-full px-2.5 py-1 font-bold tracking-wide uppercase shadow rtl:tracking-normal',
          INTENT_BG[intent],
          PILL_POSITION[position],
          className
        )}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={clsx(
        'text-2xs absolute z-10 px-2.5 py-1 font-bold tracking-wide uppercase shadow rtl:tracking-normal',
        INTENT_BG[intent],
        FLAT_POSITION[position],
        className
      )}
    >
      {children}
    </span>
  );
};
