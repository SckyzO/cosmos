import { clsx } from 'clsx';
import { MessageSquare } from 'lucide-react';
import { Children, isValidElement, type ReactNode } from 'react';
import { StateLayout } from '../feedback/StateLayout';
import { useLabels } from '../labels/labelsContext';
import { LabelsProvider } from '../labels/LabelsProvider';
import { COMMENT_THREAD_LABELS, type CommentLabels } from './labels';

export type CommentThreadProps = {
  /** The top-level comments: `Comment` elements, oldest first or newest first as the host sorts them. */
  children?: ReactNode;
  /** A `CommentComposer` for a new comment, under the list (and under the empty state). */
  composer?: ReactNode;
  /**
   * Accessible name of the list. Default `Comments`, from the `commentThread` key of
   * `LabelsProvider`.
   */
  label?: string;
  /** Title of the empty state. Default `No comments yet`, from the same key. */
  emptyTitle?: string;
  /** A line under the empty title ("Be the first to write one"). */
  emptyDescription?: string;
  /**
   * The texts of every `Comment` inside, over `LabelsProvider`'s `comment` and the English
   * defaults (a comment's own `labels` win). The thread's own two texts, `label` and
   * `emptyTitle`, are props.
   */
  labels?: Partial<CommentLabels>;
  className?: string;
};

/**
 * The comments on a record, as a list, with an empty state and an optional composer at the
 * bottom. It holds no data: the host passes the `Comment`s and handles their callbacks.
 */
export function CommentThread({
  children,
  composer,
  label,
  emptyTitle,
  emptyDescription,
  labels,
  className,
}: CommentThreadProps) {
  const texts = useLabels('commentThread', COMMENT_THREAD_LABELS);
  const comments = Children.toArray(children);
  const thread = (
    <div className={clsx('min-w-0', className)}>
      {comments.length === 0 ? (
        <StateLayout
          intent="neutral"
          icon={MessageSquare}
          title={emptyTitle ?? texts.emptyTitle}
          description={emptyDescription}
          compact
        />
      ) : (
        <ul role="list" aria-label={label ?? texts.label} className="space-y-5">
          {comments.map((comment, index) => (
            <li key={isValidElement(comment) && comment.key !== null ? comment.key : index}>
              {comment}
            </li>
          ))}
        </ul>
      )}
      {composer && <div className={comments.length === 0 ? 'mt-2' : 'mt-6'}>{composer}</div>}
    </div>
  );
  // The comments inside read the thread's texts from the provider, as they read the app's.
  return labels ? <LabelsProvider labels={{ comment: labels }}>{thread}</LabelsProvider> : thread;
}
