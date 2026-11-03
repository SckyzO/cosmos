import { useRef, type ReactNode } from 'react';
import { Fold } from '../ui/Fold';
import { useArrival } from '../hooks/useArrival';

// The detail of an expanded row, in the table and in the cards of a phone. Internal: not
// re-exported.
//
// The detail is not rendered while its row is closed: the host's `renderExpandedRow` is only
// called for a row that is open, as it always was. It mounts when the row opens, unfolds, and
// stays until it has folded back.

type DetailProps = {
  /** The `id` the row's toggle names in `aria-controls`. */
  id: string;
  open: boolean;
  /** The host's `renderExpandedRow`, for the row. */
  render: () => ReactNode;
};

/** The row under an expanded row of the table: one cell over every column, unfolding. */
export const DetailRow = ({
  id,
  open,
  colSpan,
  render,
}: DetailProps & {
  colSpan: number;
}) => {
  const ref = useRef<HTMLTableRowElement>(null);
  const { present, arrives } = useArrival(open, ref);
  if (!present) return null;
  return (
    <tr
      ref={ref}
      id={id}
      // The row above joins it with no divider, also while this one folds back.
      data-detail-row
      aria-hidden={open ? undefined : true}
      className="bg-gray-50 dark:bg-white/[0.03] print:break-inside-avoid"
    >
      {/* A row cannot animate its height, a block in its cell can. The padding is the block's, so
          a closed detail takes none. */}
      <td colSpan={colSpan} className="p-0 text-sm">
        <Fold open={open} appear={arrives}>
          <div className="ps-15 pe-4 pt-1 pb-5">{render()}</div>
        </Fold>
      </td>
    </tr>
  );
};

/** The detail under an expanded card, on a phone. */
export const CardDetail = ({ id, open, render }: DetailProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { present, arrives } = useArrival(open, ref);
  if (!present) return null;
  return (
    <div ref={ref}>
      <Fold id={id} open={open} appear={arrives}>
        <div className="mt-3 border-t border-dashed border-gray-200 pt-3 text-sm dark:border-gray-700">
          {render()}
        </div>
      </Fold>
    </div>
  );
};
