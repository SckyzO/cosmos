# Data

Storybook group: Data. Audit entries, kanban boards, KPI cards, totals and amounts, dates and clocks.

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

`EventCalendar` shows events in a month grid, or in a week or a day of hours, Monday first. An event
is `{ id, title, start, end?, allDay?, intent? }`: `start` and `end` are `Date`s, and `intent`
colours it (`brand` by default, `violet` as a category colour that carries no meaning).

```tsx
<EventCalendar
  events={events}
  defaultView="week"
  className="h-[640px]"
  onEventClick={(event) => open(event)}
  onSlotClick={(start, { allDay }) => create(start, allDay)}
/>
```

- **Views.** `view` (`month`, `week` or `day`; `month` by default), `defaultView` and `onViewChange`
  follow the usual controlled/uncontrolled pair, and a segmented control in the toolbar picks one.
  Previous and Next move by a month, a week or a day, and Today goes to the period that holds
  `today`. Switching view from the period that holds today lands on today's period in the new view;
  from any other, on the period that starts with the one shown (a week gives its Thursday's month).
- **The period.** `date` (any day of the period shown), `defaultDate` and `onDateChange` are the
  same kind of pair. `onDateChange` carries the first day of the period reached (the 1st of a month,
  the Monday of a week, the day itself), by Previous, Next, Today and a change of view that lands on
  another period, so a host that loads events per period knows what to fetch. `today` is the
  current moment: its day is highlighted, Today goes to it, and the line of the hour grid sits at
  its time. Leave it unset in an app, where it is now and the line moves every minute; set it to
  freeze the calendar in a story or a test.
- **Time.** An event with a time writes its start before its title on a month chip ("9:30 AM
  Release 2.4", in the `locale`). An all-day event writes none.
- **All-day.** `allDay` is inferred: an event is all-day when `start` is at 00:00 and `end` is
  missing or at 00:00, so an event made of dates alone (`new Date(2026, 4, 7)`) stays all-day. For
  an all-day event `end` is the last day, included. Set `allDay` to force the answer either way: a
  meeting that really starts at midnight is `allDay: false`, and then `end` is the moment it ends.
- **Dates are local.** A `Date` is read in the browser's time zone, by its day and its clock time
  there: build one with `new Date(2026, 4, 7, 9, 30)`. A host that keeps ISO strings in UTC converts
  them to local `Date`s before it passes them. A day on which the clocks change is still one day,
  and the grid counts its hours on the wall clock.

### Week and day

The week and the day draw a grid of 24 hours, 48px each, in a scrolling area. It opens at 7 AM, or
an hour before the first event of the period when that starts earlier. The area is as tall as the
card: give the card a height with `className` (`h-[640px]`) and the grid scrolls inside it, or leave
it and the grid is 36rem tall. The day names stay in view at the top, with the all-day events
under them as bars over the days they cover.

- **Overlaps.** Events that overlap sit side by side and share the width, as many columns as fit:
  72px each, and two at least. A group with more has the rest behind a "+N" button at its first
  hidden event, which opens the list of the whole day, the same one the month's "+N more" opens.
- **Short and long events.** An event shorter than 20px (about 25 minutes) is drawn at 20px, on one
  line with its start time. One that runs past midnight is cut at 24:00, square where it is cut, and
  carries on at 00:00 the next day; a screen reader hears that it continues.
- **The current time.** A line in the accent colour (red means danger in Cosmos), with a dot at its
  start and the time in the gutter, on today's column. It is not read out.
- **`onSlotClick(start, { allDay })`.** A click on an empty part of a day column gives the start of
  the 30-minute slot under it, and a click on an empty part of the all-day row gives the day at
  00:00 with `allDay: true`. Setting it also gives the grid one tab stop for a cursor on the slots:
  the arrow keys move it a day or 30 minutes (the arrows toward the start and the end of the line
  swap in right to left), Page Up and Page Down a week (a day, in the day view), Home and End to
  the first and the last slot of the day, Enter or Space calls `onSlotClick`. A move past the
  period shown goes to the next or the previous one. A status line under the grid says where the
  cursor is. Without `onSlotClick` the grid is an area you can scroll, and nothing more.
- **Keyboard and screen readers.** The hour grid is not an ARIA `grid`: events that overlap and run
  over several rows are not cells. Each day is a group named by its date and holds a list of its
  timed events in time order, each a button when `onEventClick` is set; the all-day events are one
  group before them. The month keeps its own model, one tab stop per day number and chip.
- **On a phone.** Below `sm` the view picker goes under the title and spans the card, and a week
  is a strip of its seven days (one-letter weekday, number, a dot for each event) with the grid of
  the picked day under it, since seven columns would be 48px wide. Tapping a day of the strip picks
  it and calls `onDayClick`; Previous and Next still move by a week. The `view` stays `week`: this is
  how the week fits, as the dots of the month do. The day is one column already and does not
  change.
- **Dates and times** come from `Intl` in the `locale`: the title of a week is `May 4 – 10, 2026`
  and `Apr 27 – May 3, 2026` across two months. The grid stays Gregorian and Monday first whatever
  the locale; the toolbar's labels stay in English.

## Totals and amounts

Storybook: [Totals](https://sckyzo.github.io/cosmos/?path=/docs/data-totals--docs), [Amount](https://sckyzo.github.io/cosmos/?path=/docs/data-amount--docs).

`Totals` is the block that ends a cart, an order or an invoice: rows of a label and an amount, a
total that stands out, and an optional note. It adds nothing up, every amount is yours. The
currency and the locale are set once, on the block.

```tsx
<Totals currency="USD" locale="en-US" className="ms-auto max-w-sm">
  <Totals.Row label="Subtotal" value={120} />
  <Totals.Row label="Discount (SPRING10)" value={-12} />
  <Totals.Row label="Shipping">Free</Totals.Row>
  <Totals.Row label="Tax (20%)" value={21.6} />
  <Totals.Total label="Total" value={129.6} />
  <Totals.Note>Tax included</Totals.Note>
</Totals>
```

- Amounts are in units (`24.5`, not 2450 cents). The figures sit at the end of the line, in tabular
  digits that line up from one row to the next, and mirror in right to left. The label wraps on a
  narrow screen, the amount stays on one line.
- A discount is a negative amount: it shows with a minus sign, in the colour of the other rows, not
  in red. By default only a negative amount gets a sign (`signDisplay="negative"`), so a subtotal
  has no plus and an amount that rounds to zero never reads `-$0.00`. `exceptZero`, `always`,
  `never` and `auto` (the platform's) are one prop away, on `Totals`.
- `children` of a row replace its `value`, for what is not a figure: "Free", "Calculated at the next
  step". A row with neither shows no value.
- `Totals.Total` takes the props of `Totals.Row`; it is the row with the rule above and the larger
  type. `Totals.Note` is a line of small muted text under the rows, at the end of the line. The block
  is a list (`<ul role="list">`) of its rows and notes, takes the width of its container and has no
  live region: if the total changes as the shopper edits the cart, announce it where the edit
  happens.

`Amount` writes one figure outside a block: in a sentence, a card, a table cell. `formatMoney` gives
the same text as a string, for a toast, an `aria-label` or an export. Both go through
`Intl.NumberFormat`, so the separators, the digits, the decimals of the currency (none for `JPY`) and
the place of the sign follow `locale`.

```tsx
<Amount value={order.total} currency="EUR" locale="fr-FR" />;

formatMoney(1234.5, { currency: 'USD', locale: 'en-US' }); // "$1,234.50"
formatMoney(-12.5, { currency: 'EUR', locale: 'fr-FR' }); // "-12,50 €"
formatMoney(-0.001, { currency: 'USD', locale: 'en-US' }); // "$0.00"
formatMoney(1234, { currency: 'JPY', locale: 'en-US' }); // "¥1,234"
```

- Without `currency`, the value is a plain number (up to three decimals). Without `locale`, it is
  the user's: pass one when the text around it is in a given language, and in tests and stories.
- `Amount` sits in a `<bdi>`, so in a right-to-left page the sign and the digits keep their order
  and a minus never jumps to the other side of the figure. It is one line (`whitespace-nowrap`) in
  tabular digits, and takes the colour and weight of the text around it: tint it with `className`.
- `format` writes the value yourself, in place of `currency`, `locale` and `signDisplay`.
- An unknown locale or a malformed currency code throws a `RangeError`, from `Intl`: a wrong amount
  on a page is worse than an error. The formatters are built once per combination of options.

`TableAmountCell` is an `Amount` with a plus in front of a gain (`signDisplay="exceptZero"`),
tinted by its sign: a table, a totals block and a sentence write the same figure the same way.

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

## KPI cards

Storybook: [Kpi Card](https://sckyzo.github.io/cosmos/?path=/docs/data-kpi-card--docs).

`KpiCard` is one key figure: a `label`, a `value`, and optionally an `icon`, a `delta`, a `sub` line
and a `chart`. Two options change how the card is drawn, and both are off by default, so a card
that sets neither looks as it always did.

`chartPosition="end"` sets the `chart` beside the figure (the value, the delta and the sub line)
instead of under the delta. The chart keeps its own size and is centered on the figure, at the end of
the line: a `ProgressRing` next to a percentage. The figure keeps at least 9rem, so in a card too
narrow for both the chart drops under it, at the start of the line, and nothing widens the page. The
default, `chartPosition="bottom"`, is the chart under the delta at the full width of the card, for a
sparkline.

`featured` is for the one figure a dashboard leads with. The card takes the tinted surface of its
meaning, the accent for a neutral card and the intent's color for `warning` and `danger`, and its
label, value and sub line stay readable on it in the four themes and on every accent, and the muted
gray text inside it (a `TrendDelta`'s comparison) takes a darker shade in the light themes. Give the
card a wider column with `className` (`lg:col-span-2`) when it leads a grid:

```tsx
<KpiCard
  featured
  label="Monthly goal"
  value="77%"
  sub="of $50 000"
  icon={CreditCard}
  delta={<TrendDelta value={9.6} label="vs last month" />}
  chart={<ProgressRing aria-label="Monthly goal reached" value={77} size="lg" />}
  chartPosition="end"
/>
```
