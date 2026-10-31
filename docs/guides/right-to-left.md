# Right to left

Cosmos follows the reading direction: set it once, and the components mirror.

Set the native `dir` attribute on `<html>`, or on any ancestor of the components, and
they follow it. There is no prop and no `data-` attribute:

```html
<html lang="ar" dir="rtl"></html>
```

What mirrors is what follows the reading direction: the side an icon, a ribbon, a floating
panel or a status dot sits on, the padding and margins, the corners of a button group, a
chevron that points forward, the `start` and `end` alignments of panels. A prop that names
a side of the line takes `start` or `end`, never `left` or `right` (`Ribbon`'s
`position="top-end"`, `BackToTopFab`'s `position="bottom-end"`, `iconPosition="start"`,
`align="end"`), so the side swaps under `dir="rtl"`. `top` and `bottom` stay as they are.

Text that comes from you and sits inside a label or a sentence (a name, a value, a key) is
wrapped in `<bdi>`, so a Latin name in an Arabic page, or the reverse, keeps its own order
and does not drag the punctuation around it. The package's own copy stays in English, as it
is everywhere else. A Latin text cut short by an ellipsis in a right-to-left page (a long file
name in a narrow tile) shows its end rather than its beginning: the line ends on the left, where
Latin text starts.

What you put in a slot (a table cell, a card's title, a list item, a toast's message) is drawn
as you pass it. A Latin value that starts with a number reorders in a right-to-left line, "248 W"
showing as "W 248": wrap it in `<bdi>` yourself.

```tsx
<TableCell>
  <bdi>248 W</bdi>
</TableCell>
```

A text field (`Input`, `SearchInput`, `Textarea`, the inputs of `Combobox`, `MultiSelect` and
`TagInput`) follows the direction of what is typed in it: Arabic aligns and flows right to
left, a URL left to right, each paragraph of a `Textarea` on its own. It does that with
`unicode-bidi: plaintext` rather than `dir="auto"`, which would also turn the field's own
direction around for a Latin text and leave the room reserved for a trailing icon or button
on the wrong side. A `PasswordInput` does the same once its value is shown; hidden, it keeps
the page's direction, as HTML leaves password fields out of `dir="auto"`, so how it aligns
says nothing of what is typed. A value that is a code reads left to right in any page: the cells of
`OtpInput`, the country button and number of `PhoneInput`, and the swatch and hex of
`ColorInput` are `dir="ltr"` islands. `Slider` and `Calendar` hand the direction to Radix and
react-day-picker, which lay out the handles and read the arrow keys from a `dir` prop and not
from the page.

Tailwind's `rtl:` variant (redefined by the theme to follow the nearest `dir`) is the tool
for what has no logical form, such as `rtl:-scale-x-100` on an arrow. In your own markup,
prefer the logical utilities (`ms-`, `pe-`, `text-start`, `border-s`, `rounded-e`, `inset-s-`)
to the physical ones.

A component draws the icon you pass it as it is. An icon that points along the line (a
forward arrow, a back chevron, undo) turns around through its own class:

```tsx
import { clsx } from 'clsx';
import { ArrowRight, type LucideProps } from 'lucide-react';

const Forward = ({ className, ...props }: LucideProps) => (
  <ArrowRight {...props} className={clsx(className, 'rtl:-scale-x-100')} />
);

<Button icon={Forward} iconPosition="end">
  Continue
</Button>;
```

The overlays name their sides `start` and `end`, which follow the reading direction: left and
right under `dir="ltr"`, right and left under `dir="rtl"`. That is `Drawer`'s `side`
(`start` | `end` | `bottom`, default `end`), the `align` of `Menu`, `Dropdown`, `UserMenu` and
`NotificationsPanel` (`start` | `end`), and the `position` of `Tooltip` and `Popover.Content`
(`top` | `bottom` | `start` | `end`). A panel that opens next to a trigger takes the direction of
that trigger, even though it renders at the end of `<body>`, and flips to the other side as before
when the screen would cut it. A `Drawer`, a `Modal`, a `ConfirmationModal` and a `CommandPalette` are
not next to anything: they read the `dir` of `<html>`, so set it there rather than on a wrapper.
`Toaster` stacks its toasts at the bottom corner at the end of the line (bottom left under
`dir="rtl"`, from its `dir` prop or `<html>`); sonner's own `position` is a corner of the screen,
so one you pass is kept as it is. A keyboard shortcut (the `shortcut` of a `Menu.Item`,
`CommandPalette.Item` or `Tooltip`, the keys of a `HelpOverlay.Shortcut`) keeps the order the keys
are pressed in.

Two things stay as they are on purpose. A chevron that points down, or turns over when a
panel opens (`Accordion`), and a trend arrow that points up or down, are not turned around.
And the arrow keys that move a card across a `KanbanBoard` follow where the columns are, not
the reading direction: with the first column on the right, ArrowLeft takes the card to the
next one.

The page layout follows the line too. A `Shell` puts its `Sidebar` at the start (on the right
under `dir="rtl"`, with its edge, its collapse toggle and the drawer of the phone layout on that
side) and its `secondary` panel at the end; `SplitView` runs its panes from the start. `Tabs`
and the settings pickers swap ArrowLeft and ArrowRight with the direction, and a scrolling strip
fades the side with more to see. The pinned columns of `DataTable` (`pin: 'start'` | `'end'`)
and `Table`'s `stickyFirstColumn` stick to the start or end edge, with their shadow on the side
that faces the columns scrolling under them. In the chat components, a person's own messages sit at the end
of the line and the others' at the start, and what was typed in a message or the composer reads in its own script. The `hotkeys` of a
`RecordPager` are literal keys and do not follow the direction: give Previous the arrow that
points toward it where the page reads right to left.

Output keeps its order. Code (`CodeBlock`), logs (`LogViewer`, `JobLog`, and the message, fields
and stack of `LogEntryDetail`) and keyboard keys (`Kbd`) read left to right in any page: they are
`dir="ltr"` islands, so a number gutter stays at the left of its lines and a log scrolls from the
left. What surrounds them follows the page: the title bar and copy button of a code block, the
toolbar and the "Jump to latest" button of a log, the step headers of a `JobLog` (their chevron
turns around). Time keeps its order too, as the axis of a chart does: `HeartbeatBar` and
`UptimeBars` draw their oldest mark on the left and their newest on the right in both directions,
with "N days ago" at the left and "Today" at the right, and ArrowLeft moves to the older mark. A
percentage, a latency or a count the components write (`99.95%`, `182 ms`, `3 of 12`) is wrapped in
`<bdi>`, so it reads in order inside an Arabic line.

`Carousel` hands the direction to Embla, which lays the slides out from the end of the line: the
first slide is at the start, the next one comes in from the end, a swipe follows, and the arrows
and their chevrons sit on their sides. The play triangle of a `VideoEmbed` points right in both
directions, as the time of a video runs from the left. `MapView` does not mirror the map; its zoom
buttons and the popup of a pin follow the page. Arabic and Hebrew labels in the tiles of a map
need MapLibre's RTL text plugin (`setRTLTextPlugin` in `maplibre-gl`), which a host sets once
for the page: Cosmos adds no dependency for it. In `RichTextEditor`, each block follows what is
typed in it (the same `unicode-bidi: plaintext` as a `Textarea`), lists are indented and quotes
edged on the start side, the arrow keys along the toolbar swap, and the link field reads left to
right.

The auth forms follow the same rules. The back arrow of `ResetPasswordForm` and `TwoStepVerificationForm`
turns around, the address or number a form says it sent the code to is wrapped in `<bdi>`, and
`AuthLayout`'s `asidePosition` (`start` | `end`) puts the panel at the start or the end of the line.

These Storybook groups follow the direction: Atoms, Actions, Forms, Data, Lists, Feedback,
Overlays, Navigation, Layout, Chat, Tables, Settings, Monitoring, Media, Status, Typography,
Foundations and Examples. The charts keep their left-to-right axes ([Charts](charts.md)). A check
in the repository refuses a physical inline utility (`ml-`, `pr-`, `left-`, `text-left`…) in any
source file of the package, and the CI renders every story right to left.
In Storybook, the **Direction** menu of the toolbar (`&globals=direction:rtl`) renders any story
right to left.
