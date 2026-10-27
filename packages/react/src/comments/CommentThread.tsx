import { clsx } from 'clsx';
import { MessageSquare } from 'lucide-react';
import { Children, isValidElement, type ReactNode } from 'react';
import { StateLayout } from '../feedback/StateLayout';
import { CommentLabelsContext, type CommentLabels } from './commentLabels';

export type CommentThreadProps = {
  /** The top-level comments: `Comment` elements, oldest first or newest first as the host sorts them. */
  children?: ReactNode;
  /** A `CommentComposer` for a new comment, under the list (and under the empty state). */
  composer?: ReactNode;
  /** Accessible name of the list. Default `Comments`. */
  label?: string;
  /** Title of the empty state. Default `No comments yet`. */
  emptyTitle?: string;
  /** A line under the empty title ("Be the first to write one"). */
  emptyDescription?: string;
  /** Texts for another language, handed to every `Comment` inside (a comment's own `labels` win). */
  labels?: CommentLabels;
  className?: string;
};

/**
 * The comments on a record, as a list, with an empty state and an optional composer at the
 * bottom. It holds no data: the host passes the `Comment`s and handles their callbacks.
 */
export function CommentThread({
  children,
  composer,
  label = 'Comments',
  emptyTitle = 'No comments yet',
  emptyDescription,
  labels = {},
  className,
}: CommentThreadProps) {
  const comments = Children.toArray(children);
  return (
    <CommentLabelsContext value={labels}>
      <div className={clsx('min-w-0', className)}>
        {comments.length === 0 ? (
          <StateLayout
            intent="neutral"
            icon={MessageSquare}
            title={emptyTitle}
            description={emptyDescription}
            compact
          />
        ) : (
          <ul role="list" aria-label={label} className="space-y-5">
            {comments.map((comment, index) => (
              <li key={isValidElement(comment) && comment.key !== null ? comment.key : index}>
                {comment}
              </li>
            ))}
          </ul>
        )}
        {composer && <div className={comments.length === 0 ? 'mt-2' : 'mt-6'}>{composer}</div>}
      </div>
    </CommentLabelsContext>
  );
}
