import { clsx } from 'clsx';
import { createContext, useContext } from 'react';
import type { ImgHTMLAttributes, ReactNode } from 'react';

export type CardProps = {
  children: ReactNode;
  className?: string;
  /**
   * Inner padding: `none`, `sm` (12px), `md` (16px, default) or `lg` (24px). `Card.Header`,
   * `Card.Body` and `Card.Footer` pad themselves, so pair them with `none`.
   */
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
   * column at the start and the rest after it from the `sm` breakpoint, and stacks them
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
        // The outline is one step stronger in dark, where the theme's border fades into the page;
        // the dividers of Header and Footer keep the plain border.
        'overflow-hidden bg-[var(--color-bg-panel)] [--card-border:var(--color-border)] dark:[--card-border:var(--color-gray-600)]',
        edgeToEdgeMobile
          ? 'border-y border-[var(--card-border)] sm:rounded-2xl sm:border'
          : 'rounded-2xl border border-[var(--card-border)]',
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
      'flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3',
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
      'flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3',
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
