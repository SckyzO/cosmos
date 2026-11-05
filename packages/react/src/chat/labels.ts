// The English the chat components write, their part of `CosmosLabels` (`englishLabels`).

export type ChatbotLabels = {
  /** Name of the bot in the header, when the host passes no `title`. Default `Assistant`. */
  title: string;
  /** Name read before the user's messages, when the host passes no `userName`. Default `You`. */
  you: string;
  /** Name of the launcher. Default `Open chat`. */
  launcher: string;
  /** Name of the launcher while the panel is closed with unread messages, given `launcher` and the count. Default `Open chat, 3 unread`. */
  launcherUnread: (launcher: string, count: number) => string;
  /** Name of the button that closes the panel. Default `Close chat`. */
  close: string;
  /** Name of the message log, given the bot's name. Default `Conversation with Assistant`. */
  conversationWith: (title: string) => string;
  /** The button that retries after an `error`, shown with `onRetry`. Default `Retry`. */
  retry: string;
};

export type ChatComposerLabels = {
  /** Accessible name of the textarea when the host passes no `label`. Default `Message`. */
  field: string;
  /** Placeholder of the textarea. Default `Write a message…`. */
  placeholder: string;
  /** Name of the send button. Default `Send message`. */
  send: string;
  /** Name of the Stop button, while a reply is `generating`. Default `Stop generating`. */
  stop: string;
};

export type ChatConversationListLabels = {
  /** Accessible name of the list when the host passes no `label`. Default `Conversations`. */
  label: string;
  /** Read in place of the unread count of a conversation, given the count. Default `3 unread`. */
  unread: (count: number) => string;
  /** Read after the name of a conversation whose contact is online. Default `online`. */
  online: string;
  /** … away. Default `away`. */
  away: string;
  /** … offline. Default `offline`. */
  offline: string;
};

export type ChatMessageLabels = {
  /** Read after a message being sent. Default `Sending`. */
  sending: string;
  /** … sent. Default `Sent`. */
  sent: string;
  /** … delivered. Default `Delivered`. */
  delivered: string;
  /** … read. Default `Read`. */
  read: string;
  /** … that could not be sent. Default `Not sent`. */
  failed: string;
};

export type ChatMessageActionsLabels = {
  /** Name of the row of actions. Default `Reply actions`. */
  actions: string;
  /** Name of the copy button. Default `Copy reply`. */
  copy: string;
  /** Name of the copy button once copied. Default `Copied`. */
  copied: string;
  /** Name of the regenerate button. Default `Regenerate`. */
  regenerate: string;
  /** Name of the thumbs-up button. Default `Good response`. */
  goodResponse: string;
  /** Name of the thumbs-down button. Default `Bad response`. */
  badResponse: string;
};

export type ChatSourcesLabels = {
  /** Caption of the list when the host passes no `label`. Default `Sources`. */
  label: string;
  /** Read after the title of a source that opens another site. Default `(opens in a new tab)`. */
  newTab: string;
};

export type ChatSuggestionsLabels = {
  /** Accessible name of the list when the host passes no `label`. Default `Suggested replies`. */
  label: string;
};

export type ChatThreadLabels = {
  /** Accessible name of the message log when the host passes no `label`. Default `Conversation`. */
  label: string;
};

export type ChatTypingIndicatorLabels = {
  /** What a screen reader hears, given the name. Default `Assistant is typing`. */
  typing: (name: string) => string;
};

export type ChatToolCallLabels = {
  /** The status of a running call. Default `Running`. */
  running: string;
  /** … a failed call. Default `Failed`. */
  failed: string;
  /** … a finished call, with no duration. Default `Done`. */
  done: string;
  /** … a finished call, given how long it took (written by the app). Default `Done in 1.2s`. */
  doneIn: (duration: string) => string;
  /** Caption of the input when the call is open. Default `Input`. */
  input: string;
  /** Caption of the output. Default `Output`. */
  output: string;
};

export const CHATBOT_LABELS: ChatbotLabels = {
  title: 'Assistant',
  you: 'You',
  launcher: 'Open chat',
  launcherUnread: (launcher, count) => `${launcher}, ${count} unread`,
  close: 'Close chat',
  conversationWith: (title) => `Conversation with ${title}`,
  retry: 'Retry',
};

export const CHAT_COMPOSER_LABELS: ChatComposerLabels = {
  field: 'Message',
  placeholder: 'Write a message…',
  send: 'Send message',
  stop: 'Stop generating',
};

export const CHAT_CONVERSATION_LIST_LABELS: ChatConversationListLabels = {
  label: 'Conversations',
  unread: (count) => `${count} unread`,
  online: 'online',
  away: 'away',
  offline: 'offline',
};

export const CHAT_MESSAGE_LABELS: ChatMessageLabels = {
  sending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Not sent',
};

export const CHAT_MESSAGE_ACTIONS_LABELS: ChatMessageActionsLabels = {
  actions: 'Reply actions',
  copy: 'Copy reply',
  copied: 'Copied',
  regenerate: 'Regenerate',
  goodResponse: 'Good response',
  badResponse: 'Bad response',
};

export const CHAT_SOURCES_LABELS: ChatSourcesLabels = {
  label: 'Sources',
  newTab: '(opens in a new tab)',
};

export const CHAT_SUGGESTIONS_LABELS: ChatSuggestionsLabels = { label: 'Suggested replies' };

export const CHAT_THREAD_LABELS: ChatThreadLabels = { label: 'Conversation' };

export const CHAT_TYPING_INDICATOR_LABELS: ChatTypingIndicatorLabels = {
  typing: (name) => `${name} is typing`,
};

export const CHAT_TOOL_CALL_LABELS: ChatToolCallLabels = {
  running: 'Running',
  failed: 'Failed',
  done: 'Done',
  doneIn: (duration) => `Done in ${duration}`,
  input: 'Input',
  output: 'Output',
};
