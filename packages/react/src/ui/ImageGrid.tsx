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

export type ImageGridLayout = 'grid' | 'masonry';

export type ImageGridProps = {
  /**
   * `grid` (default) is rows of cells that share one shape. `masonry` keeps each picture's own
   * aspect in CSS columns: the items flow down the first column, then the next, so DOM, tab and
   * reading order agree. Give the images `width` and `height` so the columns don't rebalance as
   * they load.
   */
  layout?: ImageGridLayout;
  /** Number of columns (static) or per-breakpoint object. Default 3. */
  columns?: ImageGridColumns;
  gap?: ImageGridGap;
  /** Tailwind aspect-* class applied to each cell. Default `aspect-square`. Ignored by `masonry`. */
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

const MASONRY_COLS: Record<1 | 2 | 3 | 4, string> = {
  1: 'columns-1',
  2: 'columns-2',
  3: 'columns-3',
  4: 'columns-4',
};

const MASONRY_SM_COLS: Record<1 | 2 | 3 | 4, string> = {
  1: 'sm:columns-1',
  2: 'sm:columns-2',
  3: 'sm:columns-3',
  4: 'sm:columns-4',
};

const MASONRY_MD_COLS: Record<1 | 2 | 3 | 4, string> = {
  1: 'md:columns-1',
  2: 'md:columns-2',
  3: 'md:columns-3',
  4: 'md:columns-4',
};

const MASONRY_LG_COLS: Record<1 | 2 | 3 | 4, string> = {
  1: 'lg:columns-1',
  2: 'lg:columns-2',
  3: 'lg:columns-3',
  4: 'lg:columns-4',
};

const GAP_CLASS: Record<ImageGridGap, string> = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

// Columns only space their items sideways: the rows are the items' own bottom margin.
const MASONRY_ROW_GAP: Record<ImageGridGap, string> = {
  sm: 'mb-2',
  md: 'mb-4',
  lg: 'mb-6',
};

// The grid hands its cell shape to the items, so a plain child and an `ImageGrid.Item` look alike.
const CellContext = createContext<{
  layout: ImageGridLayout;
  aspectRatio: string;
  rounded: boolean;
  gap: ImageGridGap;
}>({ layout: 'grid', aspectRatio: 'aspect-square', rounded: true, gap: 'md' });

// The picture of a masonry item keeps its own aspect: full width, natural height.
const MASONRY_TILE =
  'relative block overflow-hidden bg-gray-100 dark:bg-gray-800 [&_img]:block [&_img]:h-auto [&_img]:w-full';

const CELL =
  'relative block overflow-hidden bg-gray-100 dark:bg-gray-800 [&_img]:h-full [&_img]:w-full [&_img]:object-cover';

// ── Item ─────────────────────────────────────────────────────────────────────

export type ImageGridItemProps = {
  /** The picture, usually an `<img>`. */
  children: ReactNode;
  /** Text over the bottom edge, always visible; under the picture in `masonry`. */
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
  const { layout, aspectRatio, rounded, gap } = use(CellContext);
  const interactive = href !== undefined || onClick !== undefined;
  const masonry = layout === 'masonry';
  // A masonry item is the picture and, under it, its caption. The tile alone is clipped, rounded
  // and ringed on focus; the item is what the columns keep in one piece.
  const classes = masonry
    ? clsx(
        'group/item block w-full break-inside-avoid outline-hidden',
        MASONRY_ROW_GAP[gap],
        interactive && 'cursor-pointer text-left',
        className
      )
    : clsx(
        CELL,
        'group/item',
        aspectRatio,
        rounded && 'rounded-xl',
        interactive &&
          // The picture eases in on hover and on keyboard focus alike.
          'focus-visible:focus-indicator w-full cursor-pointer text-left focus-visible:ring-inset [&_img]:transition-transform [&_img]:duration-200 hover:[&_img]:scale-105 focus-visible:[&_img]:scale-105',
        className
      );
  const overlayLayer = overlay && (
    <span className="absolute inset-0 flex items-center justify-center bg-black/50 p-3 text-center text-sm font-medium text-white opacity-0 transition-opacity duration-150 group-hover/item:opacity-100 group-focus-visible/item:opacity-100">
      {overlay}
    </span>
  );
  const content = masonry ? (
    <>
      <span
        className={clsx(
          MASONRY_TILE,
          rounded && 'rounded-xl',
          interactive &&
            'group-focus-visible/item:focus-indicator group-focus-visible/item:ring-inset [&_img]:transition-transform [&_img]:duration-200 group-hover/item:[&_img]:scale-105 group-focus-visible/item:[&_img]:scale-105'
        )}
      >
        {children}
        {overlayLayer}
      </span>
      {caption && (
        <span className="mt-1.5 block text-xs text-[var(--color-text-secondary)]">{caption}</span>
      )}
    </>
  ) : (
    <>
      {children}
      {overlayLayer}
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
  layout = 'grid',
  columns = 3,
  gap = 'md',
  aspectRatio = 'aspect-square',
  rounded = true,
  className,
  children,
}: ImageGridProps) {
  const masonry = layout === 'masonry';
  const [base, sm, md, lg] = masonry
    ? [MASONRY_COLS, MASONRY_SM_COLS, MASONRY_MD_COLS, MASONRY_LG_COLS]
    : [STATIC_COLS, SM_COLS, MD_COLS, LG_COLS];
  const colsClass =
    typeof columns === 'number'
      ? base[columns]
      : clsx(
          masonry ? 'columns-1' : 'grid-cols-1',
          columns.sm && sm[columns.sm],
          columns.md && md[columns.md],
          columns.lg && lg[columns.lg]
        );
  return (
    <CellContext value={{ layout, aspectRatio, rounded, gap }}>
      <div className={clsx(!masonry && 'grid', colsClass, GAP_CLASS[gap], className)}>
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
