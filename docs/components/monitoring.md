# Monitoring

Storybook group: Monitoring. Health checks, uptime and logs. The host brings the data: these components draw what they are given.

## Health checks

Storybook: [Health Summary](https://sckyzo.github.io/cosmos/?path=/docs/monitoring-health-summary--docs), [Health Check List](https://sckyzo.github.io/cosmos/?path=/docs/monitoring-health-check-list--docs), [Health Matrix](https://sckyzo.github.io/cosmos/?path=/docs/monitoring-health-matrix--docs).

`HealthSummary`, `HealthCheckList` and `HealthMatrix` show whether a system and its parts are
healthy, and why not. They build on `HealthStatus` (`OK`, `WARN`, `CRIT`, `UNKNOWN`, `INFO`) and on
the dots and badges of the same folder.

A check is plain data. A group holds checks and, below them, other groups: one level per dependency
reads as a tree. A group has no status of its own, it is the worst status under it.

```tsx
const checks: HealthCheck[] = [
  {
    id: 'queue',
    name: 'Job queue',
    status: 'WARN',
    target: 'redis://queue:6379/0',
    message: '312 jobs waiting (limit 200)',
    latency: 4, // milliseconds
    checkedAt: '2026-01-15T09:59:30Z', // a Date, a timestamp or an ISO string
    output: 'queue=default depth=312 oldest=94s', // shown in a code block, on demand
  },
];
const groups: HealthCheckGroup[] = [{ id: 'queue', name: 'Queue', checks, groups: [] }];

<HealthSummary checks={flattenChecks(groups)} refresh={{ onRefresh, autoRefreshMs, onIntervalChange }} />
<HealthCheckList groups={groups} sort="severity" />
<HealthMatrix ariaLabel="Services by node" columns={nodes} rows={services} />
```

Everything that sorts or rolls up uses one **severity order**, worst first: `CRIT`, `WARN`,
`UNKNOWN`, `INFO`, `OK`. A check nobody could run weighs more than one that passes. `SEVERITY_ORDER`,
`compareSeverity` and `worstStatus` are exported, as are `flattenChecks` and `groupWorst`. A set with
nothing in it is `UNKNOWN`.

- `HealthSummary` takes the worst status of its `checks`, and `status` overrides it when you weigh the
  checks differently (the counts still come from `checks`). The headlines are "All systems
  operational", "Degraded performance", "Major outage", "Status unknown" and "Operational, with
  notices"; `labels` replaces any of them. It also shows the count per status, the last check
  (`RelativeTime`, from the latest `checkedAt`, or `checkedAt`) and, with `refresh` (the props of
  `RefreshButton`), a refresh action. `variant="banner"` is full width and tinted by the status,
  `variant="compact"` is one line for a card or a topbar.
- `HealthCheckList` draws rows with the status in words, the name, target, message, latency and last
  check. A check with an `output` has a toggle on its name. Pass `checks`, `groups` or both. A group
  header shows the worst status and the counts under it and collapses
  (`collapsedGroups` / `defaultCollapsedGroups` / `onCollapsedGroupsChange`, by group id).
  `sort="severity"` puts the failing checks, and the groups holding them, first. `variant="list"` is
  rows, `variant="grid"` one small card per check, for a wall screen.
- `HealthMatrix` is one cell per service (`rows`) and per environment, node or region (`columns`),
  with sticky headers, in a `role="grid"` that takes one tab stop: arrow keys move between cells,
  Home and End go to the ends of the row. A cell opens its detail in a popover (`message`, `latency`,
  `checkedAt`, and a `detail` node of your own) with Enter, Space or a click; Escape closes it and the
  focus returns to the cell. Each cell is named like "API on par-2b: Warning", and a column with no
  entry is an empty cell. `variant="dots"` is dense, and every dot has a shape as well as a colour: OK a
  filled circle, warning a diamond, critical a square, unknown a hollow ring, info a triangle. The
  legend above the grid shows the same shapes. `variant="pills"` writes the status in each cell. The
  grid scrolls in its own box when it is wider than the screen; `maxHeight` also scrolls it
  vertically. `rowHeader` names the first header cell ("Service" by default; a cluster says "Rack").
  `attentionStrip` adds a "Needs attention" strip above the grid: one chip per row that holds a
  warning or a critical cell, with its counts in words ("2 Critical, 1 Warning"), the worst rows
  first. Picking a chip scrolls its row into view, in the grid's own box when `maxHeight` is set,
  and moves the focus to its worst cell; on a phone the strip scrolls sideways.

`HealthSummary`, `HealthMatrix` and `MonitorRow` (see [Uptime monitoring](#uptime-monitoring)) take `stale`, the time of the
last data, for a source that has stopped answering. The status colours turn grey, the component says
"Stale · 4 minutes ago" and the stale state is in the accessible text (the headline, each matrix
cell, the monitor's state chip). The statuses shown stay those of the last data.

Every one takes `now`, which freezes the relative times, for stories and tests. One check shown as a
card, and a dependency tree, need no component of their own: see the stories of the Monitoring group.

## Uptime monitoring

Storybook: [Heartbeat Bar](https://sckyzo.github.io/cosmos/?path=/docs/monitoring-heartbeat-bar--docs), [Uptime Bars](https://sckyzo.github.io/cosmos/?path=/docs/monitoring-uptime-bars--docs), [Uptime Stat](https://sckyzo.github.io/cosmos/?path=/docs/monitoring-uptime-stat--docs), [Monitor Row](https://sckyzo.github.io/cosmos/?path=/docs/monitoring-monitor-row--docs), [Uptime Recipes](https://sckyzo.github.io/cosmos/?path=/docs/monitoring-uptime-recipes--docs).

`HeartbeatBar`, `UptimeBars`, `UptimeStat` and `MonitorRow` draw what a monitor found: its recent
checks, its uptime over days and periods, and one monitor as a line or a tile. A monitor checks a
target every N seconds; these show the result, and the host brings the data.

A **beat** is one check, and a **day** is one day of history. `time` and `date` take a `Date`, a
timestamp in milliseconds or an ISO 8601 string (a bare `YYYY-MM-DD` names that calendar day for every
reader, whatever their time zone).

```tsx
const beats: Beat[] = [
  { time: '2026-01-15T06:41:10Z', status: 'up', latency: 182 },
  { time: '2026-01-15T06:42:10Z', status: 'down', latency: 5003, message: 'Timeout after 5 s' },
]; // oldest first; status: 'up' | 'down' | 'degraded' | 'maintenance' | 'pending'
const days: UptimeDay[] = [
  { date: '2026-01-14', uptime: 0.9995, incidents: 1 }, // 0 to 1; null is a day with no data
  { date: '2026-01-15', uptime: null },
];

<HeartbeatBar beats={beats} />
<UptimeBars days={days} title="API" legend />
<UptimeStat periods={[{ label: '30 days', uptime: 0.9991 }]} responseTime={182} certificate={{ daysLeft: 12 }} />
<MonitorRow name="API" type="HTTP" beats={beats} uptime={0.9992} />
```

**Thresholds.** An uptime is coloured by one shared rule: 99.9 % and up is green, 99 % up to 99.9 %
is amber, below 99 % is red, and `null` is grey ("No data"). Every component that colours by uptime
(`UptimeBars`, `UptimeStat`, `MonitorRow`) takes `thresholds`, a partial `{ good, warning }` in shares
from 0 to 1 (`{ good: 0.9999, warning: 0.999 }`), and the legend of `UptimeBars` follows it. A
`warning` limit above `good` is lowered to it. `DEFAULT_THRESHOLDS`, `resolveThresholds` and
`uptimeLevel` are exported, to colour your own figures the same way. The status colours are the
theme's (`--color-status-ok`, `-warn`, `-crit`), so a theme or an accent repaints them.

- `HeartbeatBar` draws one mark per beat, the newest at the end. `variant` is `bars` (default),
  `blocks` or `dots`; `size` is `md` (32px, default) or `sm` (24px, the height inside a `MonitorRow`).
  It holds as many beats as its width allows and drops the oldest, so a 375px screen still shows the
  latest history: give it the width of its container. A `down` beat differs by shape as well as
  colour (a taller bar, a block crossed by a diagonal, a square dot) and every beat is named in words
  (status, time, latency, message). The bar is one tab stop on the newest beat; the arrow keys, Home
  and End move between beats, and hovering or focusing one shows its tooltip (Escape hides it).
  `legend` writes the key of the statuses under the bar.
- `UptimeBars` draws one bar per day over `period` 30, 60 or 90 days (default 90), coloured by the
  thresholds. The header gives `title` and the uptime of the period (the mean of the days with data,
  or `uptime` when you have the exact figure), the captions read "90 days ago" and "Today". When the
  width cannot hold every day, the oldest are dropped and the caption and the figure describe what is
  drawn. Days are named ("Jan 15, 2026: 99.95% uptime, 1 incident"), reached with the same keyboard
  model as `HeartbeatBar`, and `legend` writes the thresholds. `compact` is the form for a card: lower
  bars, no header, captions or legend.
- `UptimeStat` has two variants. `row` (default) puts the uptime of each of your `periods` side by
  side (`{ label: '24 hours', uptime }`: you name the periods), then `responseTime` and the
  `certificate`: days left, a warning (an icon, and the amber colour) under `warnBelow` days, 14 by
  default. `card` is one figure for a dashboard tile: the first period, and the downtime it stands for
  ("39 min down") when the period has a `duration` in milliseconds, with `days` drawn as compact bars.
  It is a variant of its own, not a `KpiCard` preset.
- `MonitorRow` shows the state (the status of the last beat, `status` to force it, `paused` to
  pause it), the name (a link with `href`) and `type` (any string: `HTTP`, `TCP`, `DNS`, `ping`,
  `keyword`), a 24px `HeartbeatBar`, the uptime over 24 hours, and the current latency (default: the
  last beat's). `variant="row"` is a line of a list, which the host draws: it stacks on a narrow
  screen. `variant="card"` is a tile for a grid. `stale` (with `now` to freeze its text) greys the
  chip, the beats and the uptime and adds a "Stale · 4 minutes ago" tag under the name.

The response time (a `LineAreaChart` from `@sckyzo/cosmos-charts`, its `referenceBands` shading the
down periods; the stories draw a plain SVG, since this package has no chart dependency), the timeline
of an incident (`Timeline`) and a maintenance notice (`AlertBanner`) need no component of their own:
see the Monitoring group of the Storybook ([Uptime Recipes](https://sckyzo.github.io/cosmos/?path=/docs/monitoring-uptime-recipes--docs)),
and the [Examples/Monitoring](https://sckyzo.github.io/cosmos/?path=/story/examples-monitoring--content) screen.

## Log views

Storybook: [Log Viewer](https://sckyzo.github.io/cosmos/?path=/docs/monitoring-log-viewer--docs), [Log Toolbar](https://sckyzo.github.io/cosmos/?path=/docs/monitoring-log-toolbar--docs), [Log Level Badge](https://sckyzo.github.io/cosmos/?path=/docs/monitoring-log-level-badge--docs), [Log Entry Detail](https://sckyzo.github.io/cosmos/?path=/docs/monitoring-log-entry-detail--docs).

`LogViewer`, `LogToolbar`, `LogLevelBadge` and `LogEntryDetail` read a log: the live tail, its
controls, a level label and one record in full. The host owns the data: it fetches the snapshot,
streams the new lines (SSE, WebSocket), trims the buffer and decides what "clear" and "download"
do. The components draw what they are given.

```tsx
const [lines, setLines] = useState<LogLine[]>([]); // oldest first, ids unique and stable
const [follow, setFollow] = useState(true);
const [levels, setLevels] = useState<readonly LogLevelKey[]>(['debug', 'info', 'warn', 'error']);
const [search, setSearch] = useState('');
const [active, setActive] = useState(0);
const [matches, setMatches] = useState(0);

<LogToolbar
  live={follow}
  onLiveChange={setFollow}
  levels={['debug', 'info', 'warn', 'error']}
  levelCounts={countLogLevels(lines)}
  activeLevels={levels}
  onActiveLevelsChange={setLevels}
  search={search}
  onSearchChange={(text) => {
    setSearch(text);
    setActive(0); // a new search starts at its first match
  }}
  matchCount={matches}
  activeMatch={active}
  onActiveMatchChange={setActive}
  onClear={() => setLines([])}
/>
<LogViewer
  aria-label="Backend logs"
  lines={lines}
  follow={follow}
  onFollowChange={setFollow}
  activeLevels={levels}
  search={search}
  activeMatch={active}
  onMatchCountChange={setMatches}
/>
```

**Data model.** A `LogLine` is `{ id, time, level?, source?, message, fields?, stack? }`. `time` is
a `Date`, a timestamp in milliseconds or an ISO string, shown with milliseconds. `level` is
`trace`, `debug`, `info`, `warn`, `error` or `fatal` in any case; anything else (`warning`,
`notice`, nothing) is `unknown`. `lines` is always oldest first, whatever the `order` it is drawn
in, and each `id` must stay the same from one render to the next: the viewer uses it to key rows
and to count the lines that arrived while it was paused.

**`LogViewer`**

- `tone`: `terminal` (default) is a dark panel in every theme, as a console is; `surface` follows
  the theme, for a card on a dashboard. `density`: `compact` (default) is one line per record,
  `comfortable` puts the message under its time, level and source. `columns` hides parts of the
  row (`['time']`), `lineNumbers` numbers the lines in the order of `lines`.
- `follow` / `defaultFollow` / `onFollowChange`: it stays at the newest line while lines arrive.
  Scrolling away from the end pauses it and shows "Jump to latest (12 new)"; the button, or
  scrolling back to the end, resumes it; a filter that shortens the list does not. `order` puts
  the newest line last (`newest-last`, the default, a tail) or first.
- The row follows the width of the viewer, not the screen's: the viewer is a container. Under
  28rem the source column is hidden; without `wrap` the row stays on one line and the viewer
  scrolls sideways inside itself, with `wrap` the message goes on a line of its own under the
  time and the level. Give the viewer a width (it fills a block parent; in a flex row, a `flex-1`
  or a width class), since a container takes none from its content.
- `activeLevels` and `activeSources` filter the lines (left out or, for sources, empty, shows
  all). `search` highlights a case-insensitive term in the messages and sources, `searchRegex`
  reads it as a pattern (one that does not compile finds nothing). `activeMatch` is the active
  match, counted from 0 among the lines that match; it is drawn stronger and scrolled into view
  when it changes. `onMatchCountChange` reports how many lines match. Reset `activeMatch` to 0
  when the search changes, as the example does; `LogToolbar` steps it with previous and next
  (and Enter / Shift+Enter), wrapping around the ends.
- A row with `fields` or a `stack` has a button that expands it in place
  (`expandedIds` / `defaultExpandedIds` / `onExpandedIdsChange`). `onOpenLine` adds an "Open
  details" button to the expanded row, to open a `LogEntryDetail` in a drawer.
- Messages, sources, fields and stacks are text, never HTML. A bidirectional control character
  stays inside its own message.

**`LogToolbar`.** Each control is there when its props are given: Live / Paused
(`onLiveChange`), level toggles with counts (`levels`), search (`onSearchChange`) with a regex
toggle (`onSearchRegexChange`) and previous / next (`matchCount` and `onActiveMatchChange`), a
source filter on `MultiSelect` (`sources`), `onWrapChange`, `onOrderChange`, `onDownload` and
`onClear`. From `sm` up it is one bar. Below, Live / Paused and the search stay in the bar and
the levels, sources and view options move into a "Filters" popover; its button shows how many
filters are active (levels narrowed, sources chosen). The state pairs (`live`, `activeLevels`,
`search`, `searchRegex`, `activeSources`, `wrap`, `order`) work controlled or not, as on other
fields. It holds none of the log: pass the same filters to the viewer.

**`LogLevelBadge`** is the level as a word in its colour (`ERROR`, `WARN`), on the `surface` tone
by default or the `terminal` one. Use it in a table cell, a card or a detail.

**`LogEntryDetail`** shows one record in full for a drawer or a side panel: level, time, source
and message, the fields as key / value pairs with a copy button each, the stack trace, the raw
JSON, and "Show context", the lines around it (a `context` prop, or fetched through
`onShowContext`). `onFilterValue` and `onExcludeValue` add "Filter on this value" and "Exclude
this value" buttons to each field. A structured table is a `DataTable` with a `LogLevelBadge`
column and, once rows can expand, a `LogEntryDetail` in them.

**Accessibility.** The viewer is `role="log"` with `aria-live="off"`: a fast stream read aloud
line by line cannot be followed, so new lines are not announced. `announceErrors` reads the
error and fatal lines that arrive (three at most, then the count of the rest) in a polite live
region of its own. The scroller takes a tab stop, so the arrow keys scroll it, and every level is
a word, not only a colour. Each level colour holds 4.5:1 on both tones in the four themes.

**Limits.**

- The default mode is windowed: only the rows in view are drawn, so tens of thousands of lines
  stay smooth. The row height is measured, so it follows the text size, and a row that scrolls out
  of view and back is redrawn: a button on it loses the focus when it leaves the window.
- An expanded row takes a fixed room of up to 12 rows (a row per field and per stack line); a
  longer detail scrolls inside it.
- `wrap` lines have no fixed height, so they cannot be windowed: all of them are drawn (the
  browser skips the ones out of view with `content-visibility`). Keep the buffer to a few
  thousand lines with `wrap` on, as rackscope does with 2,000. Newest first and paused, wrapped
  lines do not stay put when new ones arrive.
- Without `wrap` a long line scrolls sideways: the scroll width is that of the widest row drawn.
- The labels ("Jump to latest", "Filters"…) are English.
- Not here: the log volume chart (stacked `BarChart` of `@sckyzo/cosmos-charts`, as the lines per
  level over time) and a structured logs table. The output of a job is `JobLog`: see [Job logs](#job-logs).

## Job logs

Storybook: [JobLog](https://sckyzo.github.io/cosmos/?path=/docs/monitoring-joblog--docs).

`JobLog` is the output of a CI job or a build: collapsible steps, each with its status and
duration, and the lines of each step numbered and coloured. It is read differently from a live
tail, hence a component of its own; it shares the tones, the clock format and the windowing of
`LogViewer`. The host owns the data and the clock: it passes the steps, their durations (`JobLog`
runs no timer) and the new lines as they come.

```tsx
const steps: JobLogStep[] = [
  { id: 'install', name: 'Install dependencies', status: 'passed', duration: 41_000, lines: [...] },
  {
    id: 'run-tests',
    name: 'Run tests',
    status: 'failed',
    duration: 72_000,
    startedAt: '2026-01-15T09:30:44Z',
    // A string, or { text, timestamp } when the line has a time.
    lines: ['$ pnpm test', '\x1b[31m✗ sortRows keeps empty values last\x1b[0m', ...],
  },
  { id: 'build', name: 'Build', status: 'skipped', lines: [] },
];

<JobLog title="Build #1287" meta="main · 4f2c1a9" status="failed" duration={123_000} steps={steps} />
```

- **Steps.** `status` is `queued`, `running`, `passed`, `failed` or `skipped`. `duration` is in
  milliseconds; `startedAt` is the origin of the elapsed times (it defaults to the first
  timestamp of the step). `id` is unique and stays the same from one render to the next. The
  optional header (`title`, `status`, `meta`, `duration`) is drawn when any of them is given.
- **Open steps.** The failed and the running steps start open, the others closed, and a step that
  starts running later opens. `expandedSteps` / `defaultExpandedSteps` / `onExpandedStepsChange`
  work as on other controls. The header of an open step sticks to the top of the log while its
  lines scroll, and each step is windowed on its own, so a step of tens of thousands of lines
  stays smooth.
- **Line numbers.** They restart at 1 in each step and are links: `href="#<idPrefix><step id>-L<n>"`.
  A click calls `onCurrentLineChange({ step, line })` and does not touch `location`; a click with a
  modifier key is the browser's own, so "open in a new tab" works. `currentLine` /
  `defaultCurrentLine` is the line in focus: when it changes its step opens, the line scrolls into
  view and takes `aria-current="location"`. One line at a time. To make the links shareable, sync
  it with the URL hash in the host: read `parseJobLogHash(location.hash, idPrefix)` into
  `currentLine` on load and on `hashchange`, and write `jobLogLineHref(idPrefix, line)` back from
  `onCurrentLineChange` (the `Monitoring/JobLog` "Synced with the URL hash" story does).
- **Toolbar.** Search across all the steps (a match in a closed step opens it) with the count and
  previous / next, a timestamps toggle, wrap, expand or collapse all, and download as plain text
  (ANSI codes stripped, `fileName`). `controls` picks which are drawn (`['search']`; `[]` leaves
  the toolbar out). Below `md` of the log's own width, as a container, the search stays and the
  rest moves into a "More options" menu. `timestamps`, `wrap` and `search` each come with a
  `default*` and an `on*Change`.
- **Timestamps.** Off by default. `timestampFormat="clock"` (default) is the time of each line, as
  `LogViewer` writes it (`locale`, `timeZone`); `"elapsed"` is the time since its step started,
  `+0:04.2`.
- **Following.** While a step runs the log stays at the end, pauses when the reader scrolls up,
  and has a footer button: Pause, then "Jump to latest (12 new)". `follow` / `defaultFollow` /
  `onFollowChange`. Moving to a line (a `currentLine`, a search match) leaves the end too.
- **Tone.** `terminal` (default) is a dark panel in every theme, `surface` follows the theme.

**ANSI.** Colour codes are read into styled spans, never HTML. Kept: the 16 colours and their
bright variants as a foreground and as a background, bold, dim, italic, underline and the resets.
A 256-colour or truecolor code lands on the nearest of the 16. Every other escape sequence (cursor
moves, window titles, links) and control character is dropped, and a carriage return keeps only the
last segment of the line, so a progress bar reads as its last state. Black and white are mapped to
what reads on the tone (a black text on the terminal panel is the muted gray). Each colour holds
4.5:1 on both tones in the four themes. On a background colour, the text takes the colour that
reads on that background and its own is dropped (`31;47` is dark text on a light fill), and dim
mutes only the default text: a coloured text keeps its colour.

**Accessibility.** The log is a named `region` with a tab stop. A step header is a button with
`aria-expanded` and `aria-controls`, its status an image with a text name (never a colour alone),
and the lines of an open step a named group. A line number is a link named "Line 6".

**Limits.**

- The windowing needs a row of a fixed height, so it is off with `wrap`: all the lines of an open
  step are then drawn (the browser skips the ones out of view). Keep a step to a few thousand lines
  with `wrap` on. A line link that scrolls out of the window loses the focus.
- Without `wrap`, the lines of a step scroll sideways inside the step, under its header.
- A search compiles the plain text of every line of every step: for logs of hundreds of thousands
  of lines, filter on the host.
- The labels ("Jump to latest", "More options"…) are English.
