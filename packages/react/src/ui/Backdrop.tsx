import { clsx } from 'clsx';
import type { Ref } from 'react';
import { BACKDROP_VARIANT_CLASS, type BackdropVariant } from './backdropStyle';

export type { BackdropVariant };

export type BackdropProps = {
  onClick?: () => void;
  zIndex?: number;
  /**
   * The veil. `dim` (default) is the colour alone, with no blur, the cheapest on a large page;
   * `blur` blurs the page by 8px under a light veil, so it stays recognisable; `blur-dark` blurs
   * it under a dark one. The colours come from the theme, one set per theme.
   */
  variant?: BackdropVariant;
  /**
   * Shown while true. It fades in when it mounts, and fades out when this turns false: it stays
   * mounted and stops taking clicks, and the component that owns it unmounts it once the fade has
   * played. Default `true`.
   */
  open?: boolean;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

/**
 * Backdrop — the one scrim behind every window (Modal, Drawer, CommandPalette): a veil over the
 * page, fixed at `inset-0`, that fades in over 200 ms and out over 120 ms. Reusable building block
 * for a window of your own.
 */
export const Backdrop = ({
  onClick,
  zIndex = 30,
  variant = 'dim',
  open = true,
  className,
  ref,
}: BackdropProps) => (
  <div
    ref={ref}
    onClick={onClick && (() => onClick())}
    aria-hidden
    data-slot="backdrop"
    style={{ zIndex }}
    className={clsx(
      'fixed inset-0 transition-opacity',
      BACKDROP_VARIANT_CLASS[variant],
      // In over the base duration easing out, out over the shorter exit one easing in, and from
      // transparent on mount (`starting:`), with no script.
      open
        ? 'duration-(--cosmos-motion-base) ease-(--cosmos-ease-out) starting:opacity-0'
        : 'pointer-events-none opacity-0 duration-(--cosmos-motion-exit-lg) ease-(--cosmos-ease-in)',
      className
    )}
  />
);
