# Lists

Storybook group: Lists, with the upload components of Forms that go with the file tiles and the
notifications panel of Overlays that goes with the notification row.

## Files and uploads

Storybook: [File Tile](https://sckyzo.github.io/cosmos/?path=/docs/lists-file-tile--docs), [Grid List](https://sckyzo.github.io/cosmos/?path=/docs/lists-grid-list--docs), [Upload Queue](https://sckyzo.github.io/cosmos/?path=/docs/forms-upload-queue--docs), [Dropzone](https://sckyzo.github.io/cosmos/?path=/docs/forms-dropzone--docs).

`FileTile` is one file or folder as a `<li>`: `layout="tile"` (the default) is the card of a grid, with a
128px preview, `layout="row"` the line of a list. `kind` (`folder`, `image`, `video`, `audio`, `pdf`,
`document`, `spreadsheet`, `archive`, `code`, `other`) picks the icon and its tint; a `thumbnail` takes
the icon's place and falls back to it if it fails to load. The name is the only link (`href`) or button
(`onOpen`) of the tile; the star (`starred` / `defaultStarred` / `onStarredChange`, named "Star {name}")
and `actions`, typically a `Menu`, are siblings of it. `shared` adds a "Shared" badge and `selected`
draws the tile as picked.

```tsx
<GridList cols={4}>
  <FileTile
    name="Q3 report.pdf"
    kind="pdf"
    meta="2.4 MB · Edited yesterday"
    defaultStarred
    onOpen={() => open(file)}
    actions={<FileMenu file={file} />}
  />
</GridList>
```

`UploadQueue` lists uploads in progress, failed and done in one card. It does no network I/O: the app
owns the transfer, keeps `items` (`id`, `name`, `size`, `status`, `progress`, `error`) up to date and
answers `onRetry(id)` and `onRemove(id)`. A row says its status in text first, and a polite live region
announces the rows that finish or fail. Pair it with a `Dropzone` set to `hideFileList`:
`onFilesAdded(files)` gets only the files just accepted, so the app can start uploading them, and
`onReject(rejections)` keeps the valid files of a drop and reports the others one by one with their
reason, where without it one invalid file rejects the whole drop.

```tsx
<Dropzone multiple hideFileList accept=".pdf,.png" maxSize={25 * 1024 * 1024}
  onFilesAdded={(files) => files.forEach(upload)}
  onReject={(rejections) => report(rejections)} />
<UploadQueue items={uploads} onRetry={retry} onRemove={cancelOrDismiss} />
```

## Comments

Storybook: [Comment Thread](https://sckyzo.github.io/cosmos/?path=/docs/lists-comment-thread--docs).

`CommentThread`, `Comment` and `CommentComposer` build the discussion under a record (a ticket, a
task, an order). The host owns the data: the components take callbacks and keep only which
replies are unfolded and which composer is open. Body text is rendered as text, never HTML, and
only http(s) URLs become links.

```tsx
<CommentThread composer={<CommentComposer onSubmit={(text) => add(text)} />}>
  {comments.map((c) => (
    <Comment
      key={c.id}
      author={c.author}
      role={c.role}
      time={<time dateTime={c.createdAt}>{format(c.createdAt)}</time>}
      edited={c.edited}
      variant={c.internal ? 'internal' : 'default'}
      text={c.text}
      onReply={(text) => reply(c.id, text)}
      onEdit={c.mine ? (text) => edit(c.id, text) : undefined}
      onDelete={c.mine ? () => remove(c.id) : undefined}
      replies={c.replies.map((r) => (
        <Comment key={r.id} author={r.author} text={r.text} />
      ))}
    />
  ))}
</CommentThread>
```

- An action shows only when its callback is given, so a host lets people edit only their own
  comments. Reply and Edit open a `CommentComposer` in place (the edit one starts with the
  comment's text; `editText` when the body is `children`) and call back with the trimmed text;
  Cancel and Escape return the focus to the button that opened it. Delete calls back at once:
  confirm in the host if needed.
- Replies are one level, `Comment`s passed as `replies`, folded beyond `maxReplies` (default
  `2`) behind a "Show 3 more replies" button. A reply has no Reply of its own. For a ticket, where
  the latest exchanges matter, `keepReplies="last"` keeps the last `maxReplies` visible and folds
  the older ones behind a button above them ("Show 3 earlier replies", `labels.showEarlierReplies`).
- `variant="internal"` tints a note and labels it "Internal note" with a lock, so it reads as one
  without the color.
- `CommentComposer` is a `Textarea` with `autoResize`: Enter adds a line, Ctrl or Cmd+Enter and the
  submit button send, Escape cancels when `onCancel` is given. Submit is disabled while the text
  is empty or `submitting`. `value` / `defaultValue` / `onChange` work as on other fields.
- `modes` gives the composer a segmented control above the field, for what is being written
  (`{ value: 'reply', label: 'Reply to customer' }`, `{ value: 'note', label: 'Internal note',
internal: true }`). `onSubmit(text, mode)` receives the selected mode's `value`; without `modes`
  it gets the text alone, as before. `mode` / `defaultMode` / `onModeChange` work as on other
  fields, and a mode may carry its own `placeholder` and `submitLabel`. An `internal` mode tints
  the field and the submit button like `variant="internal"` tints a comment, with a lock and the
  line `internalNotice` ("Internal note: only your team sees this."), announced when the mode
  changes. `modeLabel` names the control.
- `time` is a node, as in `Timeline`: a `RelativeTime`, a `<time>` or your own text.
- Every text can be translated: `labels` on `CommentThread` reaches all its comments (a
  comment's own `labels` win), `emptyTitle` and `label` on the thread, and the composer's own
  `label`, `placeholder`, `submitLabel` and `cancelLabel`.

## Notifications

Storybook: [Notification Row](https://sckyzo.github.io/cosmos/?path=/docs/lists-notification-row--docs), [Notifications Panel](https://sckyzo.github.io/cosmos/?path=/docs/overlays-notifications-panel--docs).

`NotificationRow` is one notification as a full-width button: a chip with an icon, the `title`,
`subtitle`, `caption` and `time`, and a badge at the end. It is the row of the topbar panel taken
out of it: `NotificationsPanel.Item` renders a `NotificationRow` and adds only `closeOnClick`, so a
notifications page lists the same rows as the panel, with no panel around them. The row reads no
context. A page keeps its own list (a `<ul>` of `<li>`), and the filters, paging and selection that
go with it.

```tsx
<NotificationRow
  intent="info"
  icon={MessageSquare}
  title="Ana Costa commented on “Q3 rollout plan”"
  subtitle="“Can we move the cutover to Thursday?”"
  time="5 min ago"
  unread
  onClick={() => open(notification)}
/>
```

- `intent` (`danger`, `warning`, `info`, `success`) colors the chip and the badge, and picks the
  icon. `icon` replaces that icon and leaves the colors, so a comment, an invoice and a deploy
  can be told apart without leaving their meaning. `badgeLabel` replaces the badge text (`CRIT`,
  `WARN`, `INFO`, `OK` by default).
- `unread` puts a dot before the title, tints the row and adds "Unread:" for a screen reader.
- `actions` takes the controls of the row (mark as read, delete), typically icon buttons named
  for their row (`aria-label="Delete: {title}"`) or a menu. They come after the row's button and
  are never inside it: a button holding buttons is not valid, and this way each action is a stop of
  its own for the keyboard, and a click on one is not a click on the row. With `actions` the row
  is a `<div>` around the button and them, so `className` styles the `<div>` while `ref` and the
  other props stay on the button; without them the row is the button, as before. Give every row of
  a list the same actions, so the badges line up. In a panel an action does not close it.
- `closeOnClick` belongs to `NotificationsPanel.Item`: outside a panel there is nothing to close.

### A notifications page

The page owns the notifications and what to show of them. The recipe in the `Lists/Notification
Row` stories (`Page`, and `PageOnAPhone` at the `mobile` viewport) is a `Card` with the filter
`Tabs` (the strip `DataTable` uses for its status tabs, with a count in each), "Mark all as read" in
the header, and the rows in a list:

```tsx
<Card padding="none">
  <Card.Header>
    <h2>Notifications</h2>
    <Button
      variant="ghost"
      size="sm"
      icon={CheckCheck}
      disabled={unread === 0}
      onClick={markAllRead}
    >
      Mark all as read
    </Button>
  </Card.Header>
  <Tabs value={filter} onChange={(next) => setFilter(next === 'unread' ? 'unread' : 'all')}>
    <Tabs.List className="px-4">
      <Tabs.Trigger value="all" badge={notices.length}>
        All
      </Tabs.Trigger>
      <Tabs.Trigger value="unread" badge={unread}>
        Unread
      </Tabs.Trigger>
    </Tabs.List>
  </Tabs>
  <ul role="list" className="divide-y divide-[var(--color-border)]">
    {shown.map((n) => (
      <li key={n.id}>
        <NotificationRow
          intent={n.intent}
          icon={n.icon}
          title={n.title}
          time={n.time}
          unread={n.unread}
          onClick={() => open(n)}
          actions={
            <>
              <Button
                variant="ghost"
                shape="square"
                size="sm"
                icon={MailOpen}
                aria-label={`Mark as read: ${n.title}`}
                onClick={() => markRead(n.id)}
              />
              <Button
                variant="ghost"
                intent="danger"
                shape="square"
                size="sm"
                icon={Trash2}
                aria-label={`Delete: ${n.title}`}
                onClick={() => remove(n.id)}
              />
            </>
          }
        />
      </li>
    ))}
  </ul>
</Card>
```

- The filter is data: `shown` is `notices` or its unread ones, and the counts come from the
  host, as on the `DataTable` tabs. Show an `EmptyState` when the filtered list is empty.
- A row that an action removes, or a button that disables itself ("Mark all as read" once nothing
  is unread), takes the focus with it. Keep an element that stays mounted around the list
  (`tabIndex={-1}`) and focus it after the action, as the story does.
- The row's text truncates to one line and the actions keep their place, down to 375px.
