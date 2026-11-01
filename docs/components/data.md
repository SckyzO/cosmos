# Data

Storybook group: Data. Audit entries, kanban boards, dates and clocks.

## Audit diff

Storybook: [Audit Diff](https://sckyzo.github.io/cosmos/?path=/docs/data-audit-diff--docs).

`AuditDiff` shows what an audit log entry changed: `changes` is a list of
`{ field, label?, before?, after? }`. The default `table` variant is a real
table (Field, Before, After) that stacks each change as a block below `sm`; the
old value is struck through on a red tint and the new one sits on a green tint.
`variant="inline"` is one line per field (`Role: Viewer → Admin`), for an entry
of an `ActivityFeed` or a `Timeline`.

```tsx
import { AuditDiff } from '@sckyzo/cosmos-react';

<AuditDiff
  variant="inline"
  changes={[
    { field: 'role', label: 'Role', before: 'Viewer', after: 'Admin' },
    { field: 'phone', label: 'Phone', after: '+33 1 23 45 67 89' },
  ]}
/>;
```

Values are rendered as text (markup in one shows as written): strings as they
are, numbers and booleans with `String`, objects and arrays as compact JSON
(there is no nested diff). `null`, `undefined` and `''` mean the field was
empty on that side and show "—", which a screen reader reads as "empty".
`formatValue(value, change, side)` draws a value yourself. When both sides are
strings of a few words or more, the cells mark the words that moved with `<del>`
and `<ins>`, each with a visually hidden "removed:" / "added:"; past about 500
tokens on each side the whole values are shown instead. `labels` rewords every
text the component writes (`field`, `before`, `after`, `empty`, `removed`,
`added`), for another language.

## Kanban board

Storybook: [Kanban Board](https://sckyzo.github.io/cosmos/?path=/docs/data-kanban-board--docs).

`KanbanBoard` shows columns of cards that move between columns: a sprint board, a pipeline, tasks by
status. Cards are plain data (`id`, `title`, an optional `description`, and `badges` and `footer`
slots for `Tag`s and an `AvatarGroup`), columns are `{ id, title, cards }`. It follows the usual
controlled/uncontrolled pair (`value`, `defaultValue`, `onChange(columns)`), and owns no data: the
host saves the move. `onCardMove` carries just the move, after `onChange`, which is what a server
needs.

```tsx
<KanbanBoard
  ariaLabel="Sprint board"
  defaultValue={columns}
  onChange={setColumns}
  onCardMove={({ cardId, fromColumnId, toColumnId, index }) => save(cardId, toColumnId, index)}
  onCardOpen={(card) => setOpen(card)}
  onAddCard={(columnId) => openForm(columnId)}
/>
```

A card is dragged by its grip, with a pointer or a finger. From the keyboard, focus the grip, press
Space or Enter to pick the card up, the arrow keys to move it between positions and columns, Space
or Enter to drop it, Escape to put it back; a live region announces each step. Every card also has
an actions menu ("Move to" the other columns, "Move up", "Move down"), so the board works without
dragging. `onCardOpen` makes the whole card a button, `onAddCard` adds an "Add card" button to each
column, `renderCard` replaces what is inside a card (the grip and the actions menu stay), and
`loading` shows skeleton columns. A column takes an `intent` for the dot before its title and an
`empty` node for when it has no cards. Below `sm` the columns scroll sideways, one column wide.

Drag and drop is built on [`@dnd-kit/react`](https://dndkit.com), pinned to an exact version since it
is pre-1.0. It is a regular dependency of the package, not a peer.

## Event calendar

Storybook: [Event Calendar](https://sckyzo.github.io/cosmos/?path=/docs/data-event-calendar--docs).

`EventCalendar` shows events in a month grid, Monday first. An event is `{ id, title, start, end?,
allDay?, intent? }`: `start` and `end` are `Date`s, and `intent` colours the chip (`brand` by
default, `violet` as a category colour that carries no meaning).

```tsx
<EventCalendar
  events={events}
  onEventClick={(event) => open(event)}
  onDayClick={(date) => create(date)}
/>
```

- **Time.** An event with a time writes its start before its title on the chip ("9:30 AM Release 2.4",
  in the `locale`). An all-day event writes none.
- **All-day.** `allDay` is inferred: an event is all-day when `start` is at 00:00 and `end` is
  missing or at 00:00, so an event made of dates alone (`new Date(2026, 4, 7)`) stays all-day. For
  an all-day event `end` is the last day, included. Set `allDay` to force the answer either way: a
  meeting that really starts at midnight is `allDay: false`, and then `end` is the moment it ends.
- **The period.** `date` (any day of the period shown), `defaultDate` and `onDateChange` follow the
  usual controlled/uncontrolled pair. `onDateChange` carries the first day of the period reached by
  Previous, Next and Today, so a host that loads events per period knows what to fetch. `today`
  says which day is highlighted, and where Today goes.
- **Dates are local.** A `Date` is read in the browser's time zone, by its day and its clock time
  there, as everywhere in the calendar: build one with `new Date(2026, 4, 7, 9, 30)`. A host that
  keeps ISO strings in UTC converts them to local `Date`s before it passes them.

## Dates, clocks and countdowns

Storybook: [Date Time](https://sckyzo.github.io/cosmos/?path=/docs/data-date-time--docs), [Relative Time](https://sckyzo.github.io/cosmos/?path=/docs/data-relative-time--docs), [Clock](https://sckyzo.github.io/cosmos/?path=/docs/data-clock--docs), [Countdown](https://sckyzo.github.io/cosmos/?path=/docs/data-countdown--docs).

`DateTime`, `RelativeTime`, `Clock` and `Countdown` write a moment the same way everywhere, with
`Intl` and in the user's language. They render in the browser only, since the server knows neither
the locale nor the zone, and keep the room of their text until then.

```tsx
<DateTime value={order.createdAt} format="datetime" timeZone="Europe/Paris" />
<RelativeTime value={event.at} tooltip />
<Clock variant="card" timeZone="Asia/Tokyo" label="Tokyo" showDate />
<Countdown target="2026-03-01T09:00:00Z" onComplete={() => reload()} />
```

- `DateTime` takes a `format` (`date`, `time`, `datetime`, `long`, `full`, or `Intl.DateTimeFormat`
  options), a `locale` and a `timeZone`, and draws a `<time dateTime>`. `tooltip` adds the full date
  and zone, and makes the `<time>` a tab stop so a keyboard reaches it.
- `RelativeTime` reads "5 minutes ago", "yesterday", "in 2 days". Every instance shares one timer and
  wakes only when its text changes: each second in the first minute, each minute in the first hour,
  and rarely after, so a long list costs nothing.
- `Clock` has the variants `inline`, `card` and `display`, and takes `hour12`, `showSeconds`,
  `showDate` and a `label` for the zone. It ticks on the second boundary. A world clock is a grid of
  `Clock`s.
- `Countdown` has the variants `tiles`, `inline` and `compact`. `onComplete` is called once, at zero,
  and the countdown stops there. `labels`, `shortLabels`, `label` and `completedLabel` translate its
  text.

`Clock` and `Countdown` are `role="timer"`, which a screen reader does not announce as it changes.
Every one of them takes `now`, which freezes it at that moment and sets no timer: use it for
stories, screenshots and tests.
