# Variants worth knowing

Props that are easy to miss, one line each. The Storybook page of each component shows them all, with their types.

- `Tabs variant="pills"`: rounded triggers on a tinted track, the active one filled with the accent, horizontal or vertical.
- `Tabs variant="raised"`: the same neutral gray track, but the active tab is raised on it in white (a lighter gray in the dark themes) with no accent, horizontal or vertical.
- `Toggle size="sm"`: a 36×20 track; the label stays in the same `<label>`.
- `Textarea autoResize maxRows={6}`: `rows` is the minimum, the field grows with its content up to `maxRows`, then scrolls.
- `Input`, `Select` and `Textarea` `success="Username is available."`: the message under a field whose value is valid, with a green border (and a check icon on `Input` and `Select`). It is linked as the description and announced politely; `error` wins when both are set. `OtpInput success`: a green border on every cell, the message is yours.
- `SegmentedControl` options take a `badge` (a count in a small pill, part of the radio's accessible name).
- `PageHeader icon={Plug} iconIntent="brand"`: a decorative icon tile left of the title.
- `PageHeader breadcrumb={…} description="…"`: the breadcrumb sits above the title and the description under it; both can be passed together. Below `sm` the `actions` wrap under the meta, at the start of the line, and the icon tile stays beside the text column.
- `ErrorState onRetry={reload} retryLabel="Reload" action={<Button>Back to tickets</Button>}`: `retryLabel` renames the retry button (default "Try again"); `action` is a way out that is not a retry, next to it (the retry first), or alone without `onRetry`.
- `EmptyState` `children`: rendered under the description and before the `action`, start-aligned and up to 28rem wide: a short numbered list of setup steps, for instance.
- `FormRow`: label and description at the start, the control at the end. Below `sm` they stack, the label and its description above the control, which takes the row's width (a `Select` with `fullWidth={false}` stays at its own width, at the start).
- `StickyScrollNav sections={[{ id, label }]}` (a long page with anchors, such as a settings page): below `sm` the row of buttons folds into a native select, named "Jump to section" (`jumpLabel`), that shows the section being read and scrolls to the one picked, below the nav like the buttons do. From `sm` up nothing changes. `VerticalNavigation` is a list of links to pages, not anchors, and keeps its look.
- `KpiCard value="€12.4M" exactValue="€12,418,906.40"`: the exact figure behind an abbreviated value. A tooltip shows it on hover and focus, and it is read as part of the card's name ("…€12.4M, exact value €12,418,906.40"). On a plain card the value becomes a tab stop to reach the tooltip; a link or button card shows it when the card takes keyboard focus, and stays one tab stop.
- `Rating value={4.5} allowHalf readOnly showValue count="(128 reviews)"`: stars on the warning hue with an outlined empty star, announced as `role="img"` ("Rated 4.5 out of 5"). Without `readOnly` it is a `radiogroup` (one tab stop, arrows, Home/End, hover preview) with `defaultValue`/`value` and `onChange(value)`; `0` is "no rating".
- `Carousel.Thumbnails`: a scrolling row of buttons under the slides, one child per slide, named "Go to slide N" with `aria-current` on the current one and scrolled into view as it changes.
- `ProfileHeader`: the top of a profile page. A `cover` (a gradient of the accent's tints by default), an `avatar` overlapping its bottom edge, the `name` with `badges`, a `headline` and `meta`, `actions`, `stats` read as a `<dl>`, and a `tabs` slot for a `Tabs.List` under a border. Below `sm` it stacks and the actions share the width.
- `ImageGrid layout="masonry"`: CSS columns, each picture keeping its aspect with its caption under it. Items flow down the first column, then the next; give the images `width` and `height` so the columns don't rebalance as they load.
- `ConfirmationModal intent="danger" requireText="my-project"`: a red tile and a solid action, disabled until the exact (case-sensitive) text is typed; `requireTextLabel` replaces the label.
- `SecretValue label="API key" value={key} visibleSuffix={4}`: a stored secret, masked until revealed. While masked the real value is not in the DOM (20 bullets plus the suffix, at most half of the value); the Copy button copies the real value without revealing it. `autoHideAfter` (ms) masks it again.
- `Link intent="danger"`: a `colored` link in `success`, `warning` or `danger` in place of the accent; the other variants have no color of their own and ignore it.
- `ProgressBar intent="neutral"`: a gray fill for a gauge that means nothing (space used, a quota). Segments and `ProgressRing` take it too.
- `Badge size="lg"` and `shape="rounded"`: a larger badge, and `rounded-md` corners in place of the pill.
- `Carousel.Indicators position="inside"`: the dots at the bottom center of the slide, 12px from the edge, on a dark pill. Keep the default when `Carousel.Controls` is `outside` too: its row sits under the slide.
- `Ribbon shape="pill"`: a fully rounded label set inside the card, 12px from the corner of its `position`.
- `UserMenu.Header badge={<Badge intent="brand" size="sm">Admin</Badge>}`: a node after the name, on the same line: the user's role or plan. The name truncates to make room, the badge never shrinks; the e-mail stays under both.
