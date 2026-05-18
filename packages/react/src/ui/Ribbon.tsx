import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export type RibbonPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type RibbonIntent = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
export type RibbonShape = 'flat' | 'angled';

export type RibbonProps = {
  /** Corner of the parent to anchor to. Parent must be `position: relative` (and `overflow-hidden` for `angled`). */
  position?: RibbonPosition;
  intent?: RibbonIntent;
  /** `flat` = rectangle hugging the corner. `angled` = 45° diagonal banner across the corner. */
  shape?: RibbonShape;
  children: ReactNode;
  className?: string;
};

const INTENT_BG: Record<RibbonIntent, string> = {
  brand: 'bg-brand-500 text-white',
  success: 'bg-green-500 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-red-500 text-white',
  neutral: 'bg-gray-700 text-white dark:bg-gray-600',
};

// `flat`: round the OUTER corners (away from the parent edge), keep the
// touching corner sharp so it sits flush against the card edge.
const FLAT_POSITION: Record<RibbonPosition, string> = {
  'top-right': 'top-0 right-0 rounded-bl-lg rounded-tr-[inherit]',
  'top-left': 'top-0 left-0 rounded-br-lg rounded-tl-[inherit]',
  'bottom-right': 'bottom-0 right-0 rounded-tl-lg rounded-br-[inherit]',
  'bottom-left': 'bottom-0 left-0 rounded-tr-lg rounded-bl-[inherit]',
};

// `angled`: 45° banner across the corner. The parent must be
// `overflow-hidden` so the banner ends are clipped by the card edge.
const ANGLED_POSITION: Record<RibbonPosition, string> = {
  'top-right': 'top-5 -right-12 rotate-45',
  'top-left': 'top-5 -left-12 -rotate-45',
  'bottom-right': 'bottom-5 -right-12 -rotate-45',
  'bottom-left': 'bottom-5 -left-12 rotate-45',
};

export const Ribbon = ({
  position = 'top-right',
  intent = 'brand',
  shape = 'flat',
  children,
  className,
}: RibbonProps) => {
  if (shape === 'angled') {
    return (
      <span
        className={clsx(
          'absolute z-10 w-40 px-2 py-1 text-center text-[11px] font-bold tracking-wide uppercase shadow-md',
          INTENT_BG[intent],
          ANGLED_POSITION[position],
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
        'absolute z-10 px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase shadow',
        INTENT_BG[intent],
        FLAT_POSITION[position],
        className
      )}
    >
      {children}
    </span>
  );
};
