import { clsx } from 'clsx';
import { Lock } from 'lucide-react';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { MessageText } from '../chat/MessageText';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TIMESTAMP_CLASS } from '../ui/timestamp';
import { CommentComposer } from './CommentComposer';
import { useCommentLabels, type CommentLabels } from './commentLabels';

export type CommentVariant = 'default' | 'internal';

// `text` and `children` are two ways to give the body, never both.
type CommentContent =
  | {
      /** The body. Rendered as text (never HTML), line breaks kept; http(s) URLs become links. */
      text: string;
      children?: undefined;
    }
  | {
      text?: undefined;
      /**
       * Rich body in place of `text`: rendered nodes (a code block, a list, an image). Markdown
       * rendering stays in the app; it passes what it rendered.
       */
      children: ReactNode;
    };

type CommentBaseProps = {
  /** Name of the author: shown, and the initials of the avatar. */
  author: string;
  /** Avatar image; the initials of `author` otherwise. */
  avatarSrc?: string;
  /** Role of the author next to the name ("Support", "Customer"), as a badge. */
  role?: string;
  /**
   * When it was written, as a node, the way `Timeline` takes it: a `<time>`, a `RelativeTime` or
   * your own text.
   */
  time?: ReactNode;
  /** Show the "edited" mark after the time. Default `false`. */
  edited?: boolean;
  /**
   * `default`, or `internal`: a note only the team sees (a support ticket among the public
   * replies). It is tinted and carries a lock and the words "Internal note", so it reads as one
   * without the color. Default `default`.
   */
  variant?: CommentVariant;
  /**
   * Shows Reply under the comment. It opens a composer under it, and this is called with the
   * trimmed text when it is submitted. Absent: no Reply. Not offered on a reply (one level only).
   */
  onReply?: (text: string) => void;
  /**
   * Shows Edit. It swaps the body for a composer that starts with the comment's text, and this is
   * called with the new trimmed text. Absent: no Edit.
   */
  onEdit?: (text: string) => void;
  /** Shows Delete, and calls this when it is pressed. Confirm in the host if it should be. */
  onDelete?: () => void;
  /**
   * The text the edit composer starts with. Default: `text`. Give it when the body is `children`
   * (the source of the rendered Markdown).
   */
  editText?: string;
  /**
   * The replies, one level: `Comment`s. A reply takes no `replies` and no `onReply` of its own
   * (those are ignored).
   */
  replies?: ReactNode;
  /** Replies shown before the rest fold behind a "Show n more replies" button. Default `2`. */
  maxReplies?: number;
  /** Texts for another language; a `CommentThread` can give them to all of its comments. */
  labels?: CommentLabels;
  className?: string;
  /** Ref to the root `<article>`. */
  ref?: Ref<HTMLElement>;
};

export type CommentProps = CommentBaseProps & CommentContent;

// Set inside the replies of a comment: a reply is one level, with no replies of its own.
const ReplyContext = createContext(false);

const INTERNAL_BOX =
  'rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-500/30 dark:bg-amber-500/10';

/**
 * One comment on a record: avatar, author, role, time, body, and the actions the host allows.
 * Reply and Edit open a `CommentComposer` in place; the host receives the text and owns the data.
 * Replies are `Comment`s passed as `replies`, folded beyond `maxReplies`.
 */
export function Comment({
  author,
  avatarSrc,
  role,
  time,
  edited = false,
  variant = 'default',
  text,
  children,
  onReply,
  onEdit,
  onDelete,
  editText,
  replies,
  maxReplies = 2,
  labels: ownLabels,
  className,
  ref,
}: CommentProps) {
  const labels = useCommentLabels(ownLabels);
  const isReply = useContext(ReplyContext);
  const nameId = useId();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [unfolded, setUnfolded] = useState(false);
  const replyButton = useRef<HTMLButtonElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  // The button to give the focus back to once its composer is gone and the button is on screen again.
  const restoreFocus = useRef<RefObject<HTMLButtonElement | null> | null>(null);

  useEffect(() => {
    if (restoreFocus.current && !replying && !editing) {
      restoreFocus.current.current?.focus();
      restoreFocus.current = null;
    }
  }, [replying, editing]);

  const internal = variant === 'internal';
  const canReply = !isReply && onReply !== undefined;
  const replyList = isReply ? [] : Children.toArray(replies);
  const folded = replyList.length > maxReplies && !unfolded;
  const shown = folded ? replyList.slice(0, maxReplies) : replyList;
  const hiddenCount = replyList.length - maxReplies;
  const hasActions = canReply || onEdit !== undefined || onDelete !== undefined;

  const closeReply = () => {
    restoreFocus.current = replyButton;
    setReplying(false);
  };
  const closeEdit = () => {
    restoreFocus.current = editButton;
    setEditing(false);
  };

  return (
    <article
      ref={ref}
      aria-labelledby={nameId}
      data-variant={variant}
      className={clsx('min-w-0', className)}
    >
      <div className={clsx('flex gap-3', internal && INTERNAL_BOX)}>
        <span aria-hidden className="shrink-0">
          <Avatar name={author} src={avatarSrc} size={isReply ? 'xs' : 'sm'} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              id={nameId}
              className="text-sm font-semibold break-words text-[var(--color-text-primary)]"
            >
              {author}
            </span>
            {role && (
              <Badge size="sm" intent="neutral">
                {role}
              </Badge>
            )}
            {internal && (
              <Badge size="sm" intent="warning" icon={Lock}>
                {labels.internal}
              </Badge>
            )}
            {time && <span className={TIMESTAMP_CLASS}>{time}</span>}
            {edited && <span className={TIMESTAMP_CLASS}>({labels.edited})</span>}
          </div>
          {editing ? (
            <CommentComposer
              className="mt-2"
              autoFocus
              defaultValue={editText ?? text ?? ''}
              label={labels.editField}
              submitLabel={labels.editSubmit}
              cancelLabel={labels.cancel}
              onCancel={closeEdit}
              onSubmit={(value) => {
                onEdit?.(value);
                closeEdit();
              }}
            />
          ) : (
            <div
              className={clsx(
                'mt-1 text-sm break-words text-[var(--color-text-primary)]',
                text !== undefined && 'whitespace-pre-wrap'
              )}
            >
              {text === undefined ? children : <MessageText text={text} />}
            </div>
          )}
          {hasActions && !editing && (
            <div className="mt-1.5 -ml-2 flex flex-wrap items-center gap-1">
              {canReply && (
                <Button
                  ref={replyButton}
                  variant="ghost"
                  size="xs"
                  aria-expanded={replying}
                  onClick={() => setReplying(true)}
                >
                  {labels.reply}
                </Button>
              )}
              {onEdit && (
                <Button ref={editButton} variant="ghost" size="xs" onClick={() => setEditing(true)}>
                  {labels.edit}
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" intent="danger" size="xs" onClick={onDelete}>
                  {labels.delete}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      {(replyList.length > 0 || replying) && (
        <div className="mt-3 ml-4 min-w-0 border-l-2 border-[var(--color-border)] pl-4 sm:ml-5">
          {replyList.length > 0 && (
            <ReplyContext value>
              <ul role="list" aria-label={labels.replies(author)} className="space-y-4">
                {shown.map((reply, index) => (
                  <li key={isValidElement(reply) && reply.key !== null ? reply.key : index}>
                    {reply}
                  </li>
                ))}
              </ul>
            </ReplyContext>
          )}
          {replyList.length > maxReplies && (
            <Button
              variant="link"
              size="xs"
              className="mt-3"
              aria-expanded={unfolded}
              onClick={() => setUnfolded(!unfolded)}
            >
              {folded ? labels.showReplies(hiddenCount) : labels.hideReplies}
            </Button>
          )}
          {replying && (
            <CommentComposer
              className={replyList.length > 0 ? 'mt-3' : undefined}
              autoFocus
              label={labels.replyField(author)}
              placeholder={labels.replyPlaceholder}
              submitLabel={labels.replySubmit}
              cancelLabel={labels.cancel}
              onCancel={closeReply}
              onSubmit={(value) => {
                onReply?.(value);
                closeReply();
              }}
            />
          )}
        </div>
      )}
    </article>
  );
}
