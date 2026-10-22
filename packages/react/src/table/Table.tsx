import { clsx } from 'clsx';
import { createContext, useContext, type ComponentProps } from 'react';
import { BODY_CELL_PADDING, HEADER_CELL_PADDING } from './density';
import type { DataTableDensity } from './types';

type TableContextValue = {
  density: DataTableDensity;
  striped: boolean;
  stickyHeader: boolean;
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

/**
 * Table — styled native `<table>` without any logic. The wrapper scrolls
 * horizontally, so a wide table never overflows the page on small screens.
 * Compose with `TableCaption`, `TableHead`, `TableBody`, `TableFoot`,
 * `TableRow`, `TableHeaderCell` and `TableCell`. For sorting, filtering or
 * pagination, use `DataTable`.
 */
export const Table = ({
  density = 'default',
  striped = false,
  stickyHeader = false,
  containerClassName,
  className,
  children,
  ...rest
}: TableProps) => (
  <TableContext.Provider value={{ density, striped, stickyHeader }}>
    <div
      className={clsx(
        'max-w-full rounded-2xl border border-gray-200 bg-[var(--color-bg-panel)] dark:border-gray-800',
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

export type TableCaptionProps = ComponentProps<'caption'>;

/** TableCaption — the table's title, and its accessible name. */
export const TableCaption = ({ className, ...rest }: TableCaptionProps) => (
  <caption
    className={clsx(
      'px-4 py-3 text-left text-sm font-semibold text-[var(--color-text-primary)]',
      className
    )}
    {...rest}
  />
);

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
        'px-4',
        alignClass({ align, numeric }),
        inHead
          ? [
              HEADER_CELL_PADDING[density],
              'bg-gray-50 text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase dark:bg-gray-800',
            ]
          : [BODY_CELL_PADDING[density], 'font-medium'],
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
