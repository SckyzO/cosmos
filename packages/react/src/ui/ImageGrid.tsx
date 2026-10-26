import { clsx } from 'clsx';
import {
  Children,
  createContext,
  isValidElement,
  use,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { AppLink } from './AppLink';

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

// The grid hands its cell shape to the items, so a plain child and an `ImageGrid.Item` look alike.
const CellContext = createContext({ aspectRatio: 'aspect-square', rounded: true });

const CELL =
  'relative block overflow-hidden bg-gray-100 dark:bg-gray-800 [&_img]:h-full [&_img]:w-full [&_img]:object-cover';

// ── Item ─────────────────────────────────────────────────────────────────────

export type ImageGridItemProps = {
  /** The picture, usually an `<img>`. */
  children: ReactNode;
  /** Text over the bottom edge, always visible. */
  caption?: ReactNode;
  /** Content over the whole tile, shown on hover and keyboard focus (an action, a count…). */
  overlay?: ReactNode;
  /** Makes the tile a link. Wins over `onClick` for the element, which is still called. */
  href?: string;
  /** Makes the tile a button. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  className?: string;
  /** The tile's element: the `<a>`, the `<button>` or the `<div>`. */
  ref?: Ref<HTMLElement>;
};

function ImageGridItem({
  children,
  caption,
  overlay,
  href,
  onClick,
  className,
  ref,
}: ImageGridItemProps) {
  const { aspectRatio, rounded } = use(CellContext);
  const interactive = href !== undefined || onClick !== undefined;
  const classes = clsx(
    CELL,
    'group/item',
    aspectRatio,
    rounded && 'rounded-xl',
    interactive &&
      // The picture eases in on hover and on keyboard focus alike.
      'focus-visible:focus-indicator w-full cursor-pointer text-left focus-visible:ring-inset [&_img]:transition-transform [&_img]:duration-200 hover:[&_img]:scale-105 focus-visible:[&_img]:scale-105',
    className
  );
  const content = (
    <>
      {children}
      {overlay && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 p-3 text-center text-sm font-medium text-white opacity-0 transition-opacity duration-150 group-hover/item:opacity-100 group-focus-visible/item:opacity-100">
          {overlay}
        </span>
      )}
      {caption && (
        <span className="absolute inset-x-0 bottom-0 block bg-gradient-to-t from-black/70 to-transparent px-3 pt-6 pb-2 text-xs font-medium text-white">
          {caption}
        </span>
      )}
    </>
  );
  if (href !== undefined) {
    return (
      <AppLink
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        className={classes}
      >
        {content}
      </AppLink>
    );
  }
  if (onClick) {
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        className={classes}
      >
        {content}
      </button>
    );
  }
  return (
    <div ref={ref as Ref<HTMLDivElement>} className={classes}>
      {content}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

function ImageGridRoot({
  columns = 3,
  gap = 'md',
  aspectRatio = 'aspect-square',
  rounded = true,
  className,
  children,
}: ImageGridProps) {
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
    <CellContext value={{ aspectRatio, rounded }}>
      <div className={clsx('grid', colsClass, GAP_CLASS[gap], className)}>
        {Children.map(children, (child, i) =>
          // Items are cells already; any other child (an `<img>`) is wrapped in a plain one.
          isValidElement(child) && child.type === ImageGridItem ? (
            child
          ) : (
            <ImageGridItem key={i}>{child}</ImageGridItem>
          )
        )}
      </div>
    </CellContext>
  );
}

// ── Compound export ──────────────────────────────────────────────────────────

export const ImageGrid = Object.assign(ImageGridRoot, { Item: ImageGridItem });
