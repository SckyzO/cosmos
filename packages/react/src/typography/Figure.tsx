import { clsx } from 'clsx';
import type { ImgHTMLAttributes, ReactNode } from 'react';

export type FigureAlign = 'left' | 'center' | 'right';
export type FigureSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type FigureRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type FigureProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'children'> & {
  src: string;
  alt: string;
  caption?: ReactNode;
  align?: FigureAlign;
  /** Constrain image width. `full` (default) → fills parent. */
  size?: FigureSize;
  /** Image corner radius. */
  radius?: FigureRadius;
  /** Drop shadow under the image. */
  shadow?: boolean;
  /** Wrapper className (the `<figure>`). */
  wrapperClassName?: string;
};

const SIZE: Record<FigureSize, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
};

const ALIGN: Record<FigureAlign, string> = {
  left: '',
  center: 'mx-auto',
  right: 'ms-auto',
};

const RADIUS: Record<FigureRadius, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

/**
 * `Figure` — image + optional caption pair. Wraps the native `<figure>` /
 * `<figcaption>` pattern so consumers get semantic HTML for free plus the
 * common visual knobs (alignment, size, rounding, shadow) without re-doing
 * the Tailwind tetris each time.
 */
export const Figure = ({
  src,
  alt,
  caption,
  align = 'left',
  size = 'full',
  radius = 'lg',
  shadow = false,
  className,
  wrapperClassName,
  ...rest
}: FigureProps) => (
  <figure className={clsx(SIZE[size], ALIGN[align], wrapperClassName)}>
    <img
      src={src}
      alt={alt}
      className={clsx(
        'h-auto w-full',
        RADIUS[radius],
        shadow && 'shadow-lg dark:shadow-gray-800/40',
        className
      )}
      {...rest}
    />
    {caption && (
      <figcaption className="mt-2 text-center text-xs text-gray-500 italic dark:text-gray-400">
        {caption}
      </figcaption>
    )}
  </figure>
);
