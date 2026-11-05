// The English the comment components write, their part of `CosmosLabels` (`englishLabels`).

export type CommentLabels = {
  /** Reply action. Default `Reply`. */
  reply: string;
  /** Edit action. Default `Edit`. */
  edit: string;
  /** Delete action. Default `Delete`. */
  delete: string;
  /** Mark on an `internal` comment. Default `Internal note`. */
  internal: string;
  /** Mark after the time of an edited comment. Default `edited`. */
  edited: string;
  /** Placeholder of the reply field. Default `Write a reply…`. */
  replyPlaceholder: string;
  /** Submit button of the reply composer. Default `Post reply`. */
  replySubmit: string;
  /** Submit button of the edit composer. Default `Save`. */
  editSubmit: string;
  /** Cancel button of both composers. Default `Cancel`. */
  cancel: string;
  /** Accessible name of the reply field. Default `Reply to <author>`. */
  replyField: (author: string) => string;
  /** Accessible name of the edit field. Default `Edit comment`. */
  editField: string;
  /** Accessible name of the list of replies. Default `Replies to <author>`. */
  replies: (author: string) => string;
  /** The button that unfolds the replies past `maxReplies`. Default `Show 3 more replies`. */
  showReplies: (hidden: number) => string;
  /**
   * The same button with `keepReplies="last"`, where the folded replies are the older ones.
   * Default `Show 3 earlier replies`.
   */
  showEarlierReplies: (hidden: number) => string;
  /** The same button once they are unfolded. Default `Show fewer replies`. */
  hideReplies: string;
};

export type CommentThreadLabels = {
  /** Accessible name of the list when the host passes no `label`. Default `Comments`. */
  label: string;
  /** Title of the empty state when the host passes no `emptyTitle`. Default `No comments yet`. */
  emptyTitle: string;
};

export type CommentComposerLabels = {
  /** Accessible name of the modes' control. Default `Type of message`. */
  modeLabel: string;
  /**
   * Said, and announced when the mode changes, while an `internal` mode is selected. Default
   * `Internal note: only your team sees this.`
   */
  internalNotice: string;
  /** Accessible name of the field when the host passes no `label`. Default `Comment`. */
  field: string;
  /** Placeholder of the field. Default `Write a comment…`. */
  placeholder: string;
  /** The submit button. Default `Comment`. */
  submit: string;
  /** The Cancel button, shown with `onCancel`. Default `Cancel`. */
  cancel: string;
};

export const COMMENT_LABELS: CommentLabels = {
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

export const COMMENT_THREAD_LABELS: CommentThreadLabels = {
  label: 'Comments',
  emptyTitle: 'No comments yet',
};

export const COMMENT_COMPOSER_LABELS: CommentComposerLabels = {
  modeLabel: 'Type of message',
  internalNotice: 'Internal note: only your team sees this.',
  field: 'Comment',
  placeholder: 'Write a comment…',
  submit: 'Comment',
  cancel: 'Cancel',
};
