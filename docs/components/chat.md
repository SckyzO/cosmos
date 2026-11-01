# Chat

Storybook group: Chat.

## Building blocks

Storybook: [Chat](https://sckyzo.github.io/cosmos/?path=/docs/chat-chat--docs), [Chatbot](https://sckyzo.github.io/cosmos/?path=/docs/chat-chatbot--docs), [ChatSources](https://sckyzo.github.io/cosmos/?path=/docs/chat-chatsources--docs), [ChatToolCall](https://sckyzo.github.io/cosmos/?path=/docs/chat-chattoolcall--docs).

Building blocks for a conversation view: `ChatThread` (a `role="log"` live
region that stays scrolled to the newest message), `ChatMessage`,
`ChatDaySeparator`, `ChatTypingIndicator`, `ChatComposer` (Enter sends,
Shift+Enter adds a line) and `ChatConversationList` for a two-pane layout.
Message text is always rendered as text, never HTML; http(s) URLs become links.

`ChatConversationList` draws an `Avatar` from each conversation's `name` and `avatarSrc`. A
conversation that needs another picture, a stack of members or an icon for a channel, passes it as
`avatar`, which replaces the `Avatar`:

```tsx
const conversations = [
  {
    id: 'design',
    name: 'Design team',
    avatar: (
      <AvatarGroup size="xs" max={3}>
        <Avatar name="Ana Ruiz" />
        <Avatar name="Li Wei" />
      </AvatarGroup>
    ),
  },
  { id: 'oncall', name: 'Ops on-call', avatar: <IconBox icon={Siren} size="lg" /> },
];
```

The node sits in a 40px-high slot and is hidden from assistive technology, since the row is named
by `name`. A node wider than 40px pushes the text along; `presence` still puts its dot on the node's
end corner.

`Chatbot` is a floating widget built on them: a launcher at the bottom right
opens a panel (full-screen under 480px). It has no network code, the app owns
the messages and answers `onSend`:

```tsx
<Chatbot
  messages={messages}
  onSend={(text) => ask(text)}
  typing={waiting}
  suggestions={['Show my alerts']}
  error={failed ? 'The assistant could not be reached.' : undefined}
  onRetry={retry}
/>
```

A bot message with `streaming: true` shows a caret while its text grows.

### Rich replies (AI assistant, generators)

The same blocks build an assistant page; the app owns the conversation and renders any
Markdown itself.

- `ChatMessage` takes `children` in place of `text` (rendered nodes: a `CodeBlock`, a list, an
  `ImageGrid`). `bubble={false}` drops the bubble of an incoming reply so it takes the whole
  column, with the avatar and name on top. While `streaming` the message is `aria-busy`.
- `actions={<ChatMessageActions text={reply} onRegenerate={…} feedback={…} onFeedbackChange={…} />}`
  adds Copy reply, Regenerate and Good/Bad response under the reply (`aria-pressed`, also
  `defaultFeedback`). With a pointer they show on hover and focus; on touch they always show.
- `ChatSuggestions` is the row of chips `Chatbot` uses (`suggestions`, `onSelect`).
- `ChatComposer` takes `footer` (a line under the field: attach, a model `Select`, a hint) and
  `generating` + `onStop`: the send button becomes Stop (`stopLabel`), and Enter does not send.
- `ChatToolCall` (`name`, `status` of `running | done | failed`, `duration`, `input`, `output`)
  is a disclosure row for what the assistant did; `ChatSources` (`sources`, `label`) lists where
  an answer comes from. Only http(s) sources become links.
- `Clipboard plain` is the borderless copy button of that row.
