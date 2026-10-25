import { clsx } from 'clsx';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  useSyncExternalStore,
  type ComponentProps,
  type RefObject,
} from 'react';
import { Sk } from '../feedback/Skeleton';
import { useOverflows } from '../hooks/useOverflows';
import { BODY_CELL_PADDING, HEADER_CELL, HEADER_CELL_PADDING, SKELETON_WIDTHS } from './density';
import type { DataTableDensity } from './types';

type TableContextValue = {
  density: DataTableDensity;
  striped: boolean;
  stickyHeader: boolean;
  /** The id a `TableCaption` takes unless the host passes its own. */
  captionId?: string;
};

type TableSection = 'head' | 'body' | 'foot';

const TableContext = createContext<TableContextValue>({
  density: 'default',
  striped: false,
  stickyHeader: false,
});

// Which section a cell sits in: a header cell styles itself as a column
// header in the head and as a row header in the body or the footer.
const SectionContext = createContext<TableSection>('body');

const ALIGN_CLASS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

type CellAlignProps = {
  /** Text alignment. Default `left`, or `right` when `numeric` is set. */
  align?: 'left' | 'center' | 'right';
  /** Numbers: right-aligned, with tabular figures so the digits line up. */
  numeric?: boolean;
};

const alignClass = ({ align, numeric }: CellAlignProps) =>
  clsx(ALIGN_CLASS[align ?? (numeric ? 'right' : 'left')], numeric && 'tabular-nums');

export type TableProps = ComponentProps<'table'> & {
  /**
   * Row height, shared with `DataTable`. `default` keeps the standard rows,
   * `comfortable` pads the cells more for rows with two lines of content.
   */
  density?: DataTableDensity;
  /** Shade every other body row. */
  striped?: boolean;
  /**
   * Keep the header row visible while the rows scroll. The scroll container is
   * the table's wrapper, so give it a height through `containerClassName`
   * (e.g. `max-h-80`).
   */
  stickyHeader?: boolean;
  /** Classes for the wrapper that draws the border and scrolls horizontally. */
  containerClassName?: string;
};

// The id of the caption of the table inside `containerRef`, if it has one. A read of the DOM,
// hence a store: the caption is a direct child of the table, which the host's children add and
// remove, and the container is not mounted yet during the first render.
const useCaptionId = (containerRef: RefObject<HTMLElement | null>) => {
  const subscribe = useCallback(
    (notify: () => void) => {
      const table = containerRef.current?.querySelector(':scope > table');
      if (!table) return () => {};
      const observer = new MutationObserver(notify);
      observer.observe(table, { childList: true });
      return () => observer.disconnect();
    },
    [containerRef]
  );
  const getSnapshot = useCallback(
    () =>
      containerRef.current?.querySelector<HTMLTableElement>(':scope > table')?.caption?.id ||
      undefined,
    [containerRef]
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
};

/**
 * Table — styled native `<table>` without any logic. The wrapper scrolls
 * horizontally, so a wide table never overflows the page on small screens.
 * While it scrolls, the wrapper takes the keyboard focus, so the arrow keys
 * scroll it even when no cell holds a control. With a `TableCaption` it is also
 * a region named by that caption: without one it has no name to give, and
 * stays an unnamed focusable element. Compose with `TableCaption`, `TableHead`,
 * `TableBody`, `TableFoot`, `TableRow`, `TableHeaderCell` and `TableCell`. For
 * sorting, filtering or pagination, use `DataTable`.
 */
export const Table = ({
  density = 'default',
  striped = false,
  stickyHeader = false,
  containerClassName,
  className,
  children,
  ...rest
}: TableProps) => {
  const captionId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrolls = useOverflows(containerRef);
  const namedBy = useCaptionId(containerRef);
  return (
    <TableContext.Provider value={{ density, striped, stickyHeader, captionId }}>
      <div
        ref={containerRef}
        // Focusable only while it scrolls: a scroll container with no control inside is out of
        // reach of the keyboard, and one that fits would add a tab stop that does nothing. It is
        // a region only with a caption to be named by: a region with no name is no landmark, and
        // labelling it by the table itself would read out the text of every cell.
        tabIndex={scrolls ? 0 : undefined}
        role={scrolls && namedBy ? 'region' : undefined}
        aria-labelledby={scrolls ? namedBy : undefined}
        className={clsx(
          'focus-visible:focus-indicator max-w-full rounded-2xl border border-gray-200 bg-[var(--color-bg-panel)] focus-visible:ring-inset dark:border-gray-800',
          stickyHeader ? 'overflow-auto' : 'overflow-x-auto',
          containerClassName
        )}
      >
        <table
          className={clsx(
            'w-full border-collapse text-sm text-[var(--color-text-primary)]',
            className
          )}
          {...rest}
        >
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
};

export type TableCaptionProps = ComponentProps<'caption'>;

/** TableCaption — the table's title, and its accessible name. */
export const TableCaption = ({ className, ...rest }: TableCaptionProps) => {
  const { captionId } = useContext(TableContext);
  return (
    <caption
      id={captionId}
      className={clsx(
        'px-4 py-3 text-left text-sm font-semibold text-[var(--color-text-primary)]',
        className
      )}
      {...rest}
    />
  );
};

export type TableHeadProps = ComponentProps<'thead'>;

/** TableHead — the `<thead>`, sticky when the table sets `stickyHeader`. */
export const TableHead = ({ className, ...rest }: TableHeadProps) => {
  const { stickyHeader } = useContext(TableContext);
  return (
    <SectionContext.Provider value="head">
      <thead className={clsx(stickyHeader && 'sticky top-0 z-10', className)} {...rest} />
    </SectionContext.Provider>
  );
};

export type TableBodyProps = ComponentProps<'tbody'>;

/** TableBody — a `<tbody>`. Use several to group rows under a header row. */
export const TableBody = ({ className, ...rest }: TableBodyProps) => {
  const { striped } = useContext(TableContext);
  return (
    <SectionContext.Provider value="body">
      <tbody
        className={clsx(
          'divide-y divide-gray-100 border-t border-gray-100 first:border-t-0 dark:divide-gray-800 dark:border-gray-800',
          striped &&
            '[&>tr:nth-child(even)]:bg-gray-50 dark:[&>tr:nth-child(even)]:bg-white/[0.03]',
          className
        )}
        {...rest}
      />
    </SectionContext.Provider>
  );
};

export type TableFootProps = ComponentProps<'tfoot'>;

/** TableFoot — the `<tfoot>`, for totals. */
export const TableFoot = ({ className, ...rest }: TableFootProps) => (
  <SectionContext.Provider value="foot">
    <tfoot
      className={clsx(
        'border-t border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-800',
        className
      )}
      {...rest}
    />
  </SectionContext.Provider>
);

export type TableRowProps = ComponentProps<'tr'>;

/** TableRow — a `<tr>`; body rows highlight on hover. */
export const TableRow = ({ className, ...rest }: TableRowProps) => {
  const section = useContext(SectionContext);
  return (
    <tr
      className={clsx(
        section === 'head' && 'border-b border-gray-100 dark:border-gray-800',
        section === 'body' && 'hover:bg-gray-50 dark:hover:bg-white/5',
        className
      )}
      {...rest}
    />
  );
};

export type TableHeaderCellProps = ComponentProps<'th'> & CellAlignProps;

/**
 * TableHeaderCell — a `<th>`. `scope` defaults to `col` in `TableHead` and to
 * `row` in `TableBody` and `TableFoot`; pass `colgroup` or `rowgroup` for a
 * header that spans a group.
 */
export const TableHeaderCell = ({
  align,
  numeric,
  scope,
  className,
  ...rest
}: TableHeaderCellProps) => {
  const { density } = useContext(TableContext);
  const section = useContext(SectionContext);
  const inHead = section === 'head';
  return (
    <th
      scope={scope ?? (inHead ? 'col' : 'row')}
      className={clsx(
        alignClass({ align, numeric }),
        inHead
          ? [HEADER_CELL, HEADER_CELL_PADDING[density]]
          : ['px-4', BODY_CELL_PADDING[density], 'font-medium'],
        className
      )}
      {...rest}
    />
  );
};

export type TableCellProps = ComponentProps<'td'> & CellAlignProps;

/** TableCell — a `<td>`, padded to the table's `density`. */
export const TableCell = ({ align, numeric, className, ...rest }: TableCellProps) => {
  const { density } = useContext(TableContext);
  return (
    <td
      className={clsx(
        'px-4',
        BODY_CELL_PADDING[density],
        alignClass({ align, numeric }),
        className
      )}
      {...rest}
    />
  );
};

export type TableSkeletonRowsProps = {
  /** How many placeholder rows. Default 4. */
  rows?: number;
  /** How many cells in a row: the number of columns of the table. */
  columns: number;
  /** Indices of the columns that hold numbers (`numeric` cells), whose placeholder sits at the end. */
  numericColumns?: number[];
};

/**
 * TableSkeletonRows — placeholder rows for a `TableBody` while the data loads, under the header
 * row the table already has, so the columns do not jump when it arrives. They take the table's
 * `density`, and are hidden from assistive technology: put `aria-busy` on the `Table`.
 */
export const TableSkeletonRows = ({
  rows = 4,
  columns,
  numericColumns = [],
}: TableSkeletonRowsProps) => (
  <>
    {Array.from({ length: rows }, (_, row) => (
      <TableRow key={row} aria-hidden>
        {Array.from({ length: columns }, (_, col) => (
          <TableCell key={col} numeric={numericColumns.includes(col)}>
            <Sk
              h="h-3"
              w={SKELETON_WIDTHS[(row + col) % SKELETON_WIDTHS.length]}
              className={numericColumns.includes(col) ? 'ml-auto' : undefined}
            />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);
