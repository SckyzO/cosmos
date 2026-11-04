import { useRef, type ReactNode } from 'react';
import { useArrival } from '../hooks/useArrival';
import { Fold } from '../ui/Fold';
import { HoldWhileClosed } from '../ui/HoldWhileClosed';

// Internal to the package: the line under a field. Not exported from the barrel.

type FieldMessageProps = {
  /** Whether there is something to say. Turning false folds the line away, and it is then gone. */
  show: boolean;
  /** The element that carries the text. Default `span`. */
  as?: 'span' | 'p';
  /** The `id` the field names in `aria-describedby`. */
  id?: string;
  /** `polite` on a message that is announced when it appears (a success). */
  'aria-live'?: 'polite';
  /** Look and margin of the line: the margin goes with the line, so it folds with it. */
  className?: string;
  children?: ReactNode;
};

/**
 * The description, the error or the success message under a field. It is mounted while `show`:
 * a field that has its message from the first render simply has it, and one that gets it later
 * (an error after a submit) unfolds it under the field instead of pushing the rest of the form
 * at once, and folds it back when it goes. It keeps showing what it showed while it folds, since
 * the host empties it in the render that hides it.
 *
 * Nothing about how it is read changes: the element, its `id` and its `aria-live` are the ones the
 * field had, in the accessibility tree from the commit that shows it, and described by the field
 * from that same commit. Out of it (inert and hidden) from the commit that hides it.
 */
export const FieldMessage = ({
  show,
  as: Tag = 'span',
  id,
  'aria-live': live,
  className,
  children,
}: FieldMessageProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { present, arrives } = useArrival(show, ref);
  if (!present) return null;
  return (
    <Fold ref={ref} open={show} appear={arrives}>
      <HoldWhileClosed open={show}>
        <Tag id={id} aria-live={live} className={className}>
          {children}
        </Tag>
      </HoldWhileClosed>
    </Fold>
  );
};
