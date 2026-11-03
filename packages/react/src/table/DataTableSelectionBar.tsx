import { clsx } from 'clsx';
import { useRef, type ReactNode } from 'react';
import { HoldWhileClosed } from '../ui/HoldWhileClosed';
import { useArrival } from '../hooks/useArrival';

// The "N selected" bar of a DataTable. Internal: not re-exported.

/**
 * Moves the bar in and out. It fades in and slides 4px down from the toolbar's edge in
 * `--cosmos-motion-fast` when the first row is ticked, and leaves up over the same distance in
 * `--cosmos-motion-exit` when the last is cleared. While it leaves it is out of the layout (the
 * toolbar it gives way to is already in its place, the bar fades over it), `inert` and out of the
 * accessibility tree, and it keeps showing the count and the actions it had: `children` is `null`
 * once nothing is selected, and the last content stays.
 *
 * Rendered by its parent in a `relative` box.
 */
export const DataTableSelectionBar = ({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { present, arrives } = useArrival(open, ref);
  if (!present) return null;
  return (
    <div
      ref={ref}
      data-selection-bar
      inert={!open}
      aria-hidden={open ? undefined : true}
      className={clsx(
        'transition-[opacity,translate]',
        open
          ? clsx(
              'translate-none opacity-100 duration-(--cosmos-motion-fast) ease-(--cosmos-ease-out)',
              arrives && 'starting:-translate-y-1 starting:opacity-0'
            )
          : 'pointer-events-none absolute inset-x-0 top-0 z-10 -translate-y-1 opacity-0 duration-(--cosmos-motion-exit) ease-(--cosmos-ease-in)'
      )}
    >
      <HoldWhileClosed open={open}>{children}</HoldWhileClosed>
    </div>
  );
};
