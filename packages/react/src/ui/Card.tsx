import { clsx } from 'clsx';
import { createContext, useContext } from 'react';
import type { ImgHTMLAttributes, ReactNode } from 'react';

export type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Adds hover-lift + cursor-pointer affordance. Pair with `as="a"` or wrap in your router's Link. */
  interactive?: boolean;
  /**
   * When `true`, the card is flush with the viewport edges on mobile
   * (no rounded corners, no horizontal margins) and switches to rounded
   * + bordered at the `sm` breakpoint and above. Mirrors the TUI Plus
   * "Card, edge-to-edge on mobile" pattern.
   */
  edgeToEdgeMobile?: boolean;
  /**
   * `vertical` (default) stacks the parts. `horizontal` puts a `Card.Image` in a fixed-width
   * column on the left and the rest on the right from the `sm` breakpoint, and stacks them
   * below it.
   */
  orientation?: CardOrientation;
};

export type CardOrientation = 'vertical' | 'horizontal';

// `Card.Image` sizes itself by the orientation of the card around it.
const OrientationContext = createContext<CardOrientation>('vertical');

const PADDING_CLASS = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

const Root = ({
  children,
  className,
  padding = 'md',
  interactive = false,
  edgeToEdgeMobile = false,
  orientation = 'vertical',
}: CardProps) => (
  <OrientationContext value={orientation}>
    <div
      className={clsx(
        'overflow-hidden bg-white dark:bg-gray-900',
        edgeToEdgeMobile
          ? 'border-y border-gray-200 sm:rounded-2xl sm:border dark:border-gray-800'
          : 'rounded-2xl border border-gray-200 dark:border-gray-800',
        interactive &&
          'has-focus-visible:focus-indicator cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md',
        orientation === 'horizontal' && 'flex flex-col sm:flex-row',
        PADDING_CLASS[padding],
        className
      )}
    >
      {children}
    </div>
  </OrientationContext>
);

const Header = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={clsx(
      'flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800',
      className
    )}
  >
    {children}
  </div>
);

const Body = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={clsx('p-4', className)}>{children}</div>
);

const Footer = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={clsx(
      'flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-800',
      className
    )}
  >
    {children}
  </div>
);

// ── Image ────────────────────────────────────────────────────────────────────

export type CardImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** Aspect ratio class (Tailwind). Default `aspect-video`. */
  aspectRatio?: string;
  /** Wrapper className (the `<img>` is inside). */
  wrapperClassName?: string;
};

const Image = ({
  aspectRatio = 'aspect-video',
  wrapperClassName,
  className,
  alt,
  ...rest
}: CardImageProps) => {
  const horizontal = useContext(OrientationContext) === 'horizontal';
  return (
    <div
      className={clsx(
        'overflow-hidden bg-gray-100 dark:bg-gray-800',
        // Horizontal: full width while stacked, a fixed column from `sm`.
        horizontal ? 'sm:w-40 sm:shrink-0' : 'w-full',
        aspectRatio,
        wrapperClassName
      )}
    >
      <img alt={alt} className={clsx('h-full w-full object-cover', className)} {...rest} />
    </div>
  );
};

export const Card = Object.assign(Root, { Header, Body, Footer, Image });
