import { clsx } from 'clsx';
import { Children, type ReactNode } from 'react';

export type ImageGridGap = 'sm' | 'md' | 'lg';

export type ImageGridColumns =
  1 | 2 | 3 | 4 | { sm?: 1 | 2 | 3 | 4; md?: 1 | 2 | 3 | 4; lg?: 1 | 2 | 3 | 4 };

export type ImageGridProps = {
  /** Number of columns (static) or per-breakpoint object. Default 3. */
  columns?: ImageGridColumns;
  gap?: ImageGridGap;
  /** Tailwind aspect-* class applied to each cell. Default `aspect-square`. */
  aspectRatio?: string;
  /** Round each cell. Default `true`. */
  rounded?: boolean;
  className?: string;
  children: ReactNode;
};

const STATIC_COLS: Record<1 | 2 | 3 | 4, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

const SM_COLS: Record<1 | 2 | 3 | 4, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
};

const MD_COLS: Record<1 | 2 | 3 | 4, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
};

const LG_COLS: Record<1 | 2 | 3 | 4, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};

const GAP_CLASS: Record<ImageGridGap, string> = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

export const ImageGrid = ({
  columns = 3,
  gap = 'md',
  aspectRatio = 'aspect-square',
  rounded = true,
  className,
  children,
}: ImageGridProps) => {
  const colsClass =
    typeof columns === 'number'
      ? STATIC_COLS[columns]
      : clsx(
          'grid-cols-1',
          columns.sm && SM_COLS[columns.sm],
          columns.md && MD_COLS[columns.md],
          columns.lg && LG_COLS[columns.lg]
        );
  return (
    <div className={clsx('grid', colsClass, GAP_CLASS[gap], className)}>
      {Children.map(children, (child, i) => (
        <div
          key={i}
          className={clsx(
            'overflow-hidden bg-gray-100 dark:bg-gray-800 [&_img]:h-full [&_img]:w-full [&_img]:object-cover',
            aspectRatio,
            rounded && 'rounded-xl'
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
};
