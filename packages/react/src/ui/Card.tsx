import { clsx } from 'clsx';
import type { ImgHTMLAttributes, ReactNode } from 'react';

export type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Adds hover-lift + cursor-pointer affordance. Pair with `as="a"` or wrap in your router's Link. */
  interactive?: boolean;
};

const PADDING_CLASS = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

const Root = ({ children, className, padding = 'md', interactive = false }: CardProps) => (
  <div
    className={clsx(
      'overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
      interactive &&
        'cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-brand-500/30',
      PADDING_CLASS[padding],
      className,
    )}
  >
    {children}
  </div>
);

const Header = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={clsx(
      'flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800',
      className,
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
      className,
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
}: CardImageProps) => (
  <div className={clsx('w-full overflow-hidden bg-gray-100 dark:bg-gray-800', aspectRatio, wrapperClassName)}>
    <img
      alt={alt}
      className={clsx('h-full w-full object-cover', className)}
      {...rest}
    />
  </div>
);

export const Card = Object.assign(Root, { Header, Body, Footer, Image });
