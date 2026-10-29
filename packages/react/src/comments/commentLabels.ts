import { createContext, useContext } from 'react';

/**
 * Every visible or announced text of a comment, so a host can translate it once. Each key is
 * optional: what is not given keeps its English default.
 */
export type CommentLabels = {
  /** Reply action. Default `Reply`. */
  reply?: string;
  /** Edit action. Default `Edit`. */
  edit?: string;
  /** Delete action. Default `Delete`. */
  delete?: string;
  /** Mark on an `internal` comment. Default `Internal note`. */
  internal?: string;
  /** Mark after the time of an edited comment. Default `edited`. */
  edited?: string;
  /** Placeholder of the reply field. Default `Write a reply…`. */
  replyPlaceholder?: string;
  /** Submit button of the reply composer. Default `Post reply`. */
  replySubmit?: string;
  /** Submit button of the edit composer. Default `Save`. */
  editSubmit?: string;
  /** Cancel button of both composers. Default `Cancel`. */
  cancel?: string;
  /** Accessible name of the reply field. Default `Reply to <author>`. */
  replyField?: (author: string) => string;
  /** Accessible name of the edit field. Default `Edit comment`. */
  editField?: string;
  /** Accessible name of the list of replies. Default `Replies to <author>`. */
  replies?: (author: string) => string;
  /** The button that unfolds the replies past `maxReplies`. Default `Show 3 more replies`. */
  showReplies?: (hidden: number) => string;
  /**
   * The same button with `keepReplies="last"`, where the folded replies are the older ones.
   * Default `Show 3 earlier replies`.
   */
  showEarlierReplies?: (hidden: number) => string;
  /** The same button once they are unfolded. Default `Show fewer replies`. */
  hideReplies?: string;
};

export const DEFAULT_LABELS: Required<CommentLabels> = {
  reply: 'Reply',
  edit: 'Edit',
  delete: 'Delete',
  internal: 'Internal note',
  edited: 'edited',
  replyPlaceholder: 'Write a reply…',
  replySubmit: 'Post reply',
  editSubmit: 'Save',
  cancel: 'Cancel',
  replyField: (author) => `Reply to ${author}`,
  editField: 'Edit comment',
  replies: (author) => `Replies to ${author}`,
  showReplies: (hidden) => `Show ${hidden} more ${hidden === 1 ? 'reply' : 'replies'}`,
  showEarlierReplies: (hidden) => `Show ${hidden} earlier ${hidden === 1 ? 'reply' : 'replies'}`,
  hideReplies: 'Show fewer replies',
};

// What a `CommentThread` hands to the comments inside it; a comment's own `labels` win.
export const CommentLabelsContext = createContext<CommentLabels>({});

/** The labels of the nearest thread, then the comment's own, over the defaults. */
export const useCommentLabels = (own?: CommentLabels): Required<CommentLabels> => {
  const inherited = useContext(CommentLabelsContext);
  return { ...DEFAULT_LABELS, ...inherited, ...own };
};
