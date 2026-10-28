import { clsx } from 'clsx';
import { ArrowDown, ArrowUp, ChevronRight } from 'lucide-react';
import {
  Fragment,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react';
import { TimeLabel, TimePlaceholder } from '../data/TimeLabel';
import { formatDateTime, toTimestamp } from '../data/time';
import { useControllableState } from '../hooks/useControllableState';
import { useIsClient } from '../hooks/useIsClient';
import { useVirtualWindow } from '../hooks/useVirtualWindow';
import { Button } from '../ui/Button';
import { mergeRefs } from '../ui/mergeRefs';
import { LOG_MESSAGE_CLASS, LogLevelBadge, type LogTone } from './LogLevelBadge';
import {
  announceErrors,
  compileLogSearch,
  filterLogLines,
  findLogMatches,
  formatLogField,
  newLinesSince,
  parseLogLevel,
  splitLogMatches,
} from './log-lines';
import { detailSlots, lineWindow, slotOf, totalSlots, type ExpandedBlock } from './log-window';
import type { LogColumn, LogLevelKey, LogLine, LogLineId, LogOrder } from './types';

export type LogDensity = 'compact' | 'comfortable';

export type LogViewerProps = {
  /**
   * The lines of the buffer, oldest first, whatever the `order` they are drawn in. The host
   * fetches, streams and trims them; each `id` is unique and stays the same from one render to
   * the next.
   */
  lines: readonly LogLine[];
  /** Accessible name of the log. Default `Log`. Name it, or point `aria-labelledby` at a heading. */
  'aria-label'?: string;
  /** Id of an element that names the log, instead of `aria-label`. */
  'aria-labelledby'?: string;
  /**
   * `terminal` (default) is a dark panel in every theme, as a console is. `surface` follows the
   * theme: for a card on a dashboard.
   */
  tone?: LogTone;
  /** `compact` (default) is one line per record; `comfortable` puts the message under its details. */
  density?: LogDensity;
  /**
   * Wrap the long lines (`true`), or keep each on one line and scroll sideways (`false`, default).
   * Wrapped lines have no fixed height, so they are all drawn, not windowed: keep the buffer to a
   * few thousand lines, or leave `wrap` off for a larger one.
   */
  wrap?: boolean;
  /** Where the newest line sits: last, like a tail (`newest-last`, default), or first. */
  order?: LogOrder;
  /** The parts of a row to draw, besides the message. Default all of them. */
  columns?: readonly LogColumn[];
  /** Number the lines, from 1, in the order of `lines` (a trimmed buffer renumbers). Default `false`. */
  lineNumbers?: boolean;
  /**
   * Stay at the end while lines arrive (`true`), at the newest line: the bottom for `newest-last`,
   * the top for `newest-first`. Scrolling away from the end pauses it, and scrolling back to the
   * end, or the "Jump to latest" button, resumes it. Controlled; defaults to `defaultFollow`.
   */
  follow?: boolean;
  /** Initial `follow` while uncontrolled. Default `true`. */
  defaultFollow?: boolean;
  /** Called with the state to move to when the reader scrolls away from the end or back to it. */
  onFollowChange?: (follow: boolean) => void;
  /**
   * The levels to show. Left out, all of them; an empty list shows nothing. Pair it with the
   * toolbar's `activeLevels`.
   */
  activeLevels?: readonly LogLevelKey[];
  /** The sources to show. Left out or empty, all of them. Pair it with the toolbar's `activeSources`. */
  activeSources?: readonly string[];
  /**
   * The text to find in the messages and sources, highlighted in every line. Case-insensitive.
   * Empty or left out, no search.
   */
  search?: string;
  /** Read `search` as a regular expression. A pattern that does not compile finds nothing. Default `false`. */
  searchRegex?: boolean;
  /**
   * Which match is the active one, counted from 0 among the lines that match: it is drawn
   * stronger and scrolled into view when it changes. Held by the host (`LogToolbar` moves it with
   * previous and next, wrapping around); clamped to the matches there are. Default 0.
   */
  activeMatch?: number;
  /** Called with the number of lines that match, whenever it changes (also to 0). */
  onMatchCountChange?: (count: number) => void;
  /** Ids of the expanded lines, when controlled. */
  expandedIds?: readonly LogLineId[];
  /** Ids of the lines expanded at first, when uncontrolled. None by default. */
  defaultExpandedIds?: readonly LogLineId[];
  /** Called with the ids to move to when a line is expanded or collapsed. */
  onExpandedIdsChange?: (ids: readonly LogLineId[]) => void;
  /**
   * Adds an "Open details" button to an expanded line, called with it: open a `LogEntryDetail` in
   * a drawer or a side panel.
   */
  onOpenLine?: (line: LogLine) => void;
  /** The line to mark as the one in focus (`aria-current`), as in the context of an entry. */
  currentId?: LogLineId;
  /**
   * Announce the error and fatal lines that arrive to screen readers, in a polite live region of
   * their own: up to three, then the count of the rest. Off by default, as is every other line: a
   * stream read aloud line by line cannot be followed.
   */
  announceErrors?: boolean;
  /** Shown when no line is left to draw. Default `No log lines.` */
  emptyMessage?: string;
  /** BCP 47 tag for the times (`fr-FR`). Default: the browser's language. */
  locale?: string;
  /** IANA zone for the times (`Asia/Tokyo`). Default: the browser's zone. */
  timeZone?: string;
  /** The height of the viewer: a CSS length, or a number of px. Default `24rem`. */
  height?: number | string;
  className?: string;
  /** Ref to the scrolling element (`role="log"`). */
  ref?: Ref<HTMLDivElement>;
};

const DEFAULT_COLUMNS: readonly LogColumn[] = ['time', 'level', 'source'];
const NONE: readonly never[] = [];
const OVERSCAN = 8;
// What the first render assumes for a row, before the real one is measured, in px.
const ESTIMATE: Record<LogDensity, number> = { compact: 20, comfortable: 52 };
export const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
  hourCycle: 'h23',
};

export const TONE = {
  terminal: {
    root: 'bg-slate-950 text-slate-300',
    muted: 'text-slate-400',
    source: 'text-sky-300',
    hover: 'hover:bg-white/5',
    expanded: 'bg-slate-900',
    current: 'bg-sky-500/15',
    activeMatch: 'bg-amber-500/10',
    mark: 'bg-amber-500/40 text-white',
    markActive: 'bg-amber-300 text-slate-950',
    divider: 'border-slate-800',
    button: 'text-slate-400 hover:bg-white/10 hover:text-white',
  },
  surface: {
    root: 'bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    muted: 'text-gray-600 dark:text-gray-400',
    source: 'text-gray-700 dark:text-gray-300',
    hover: 'hover:bg-gray-50 dark:hover:bg-white/5',
    expanded: 'bg-gray-50 dark:bg-white/5',
    current: 'bg-brand-500/10',
    activeMatch: 'bg-amber-500/10',
    mark: 'bg-yellow-200 text-gray-900 dark:bg-yellow-400/30 dark:text-yellow-50',
    markActive: 'bg-amber-400 text-gray-950',
    divider: 'border-gray-100 dark:border-gray-800',
    button:
      'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/10 dark:hover:text-white',
  },
} as const;

const hasDetails = (line: LogLine) =>
  (line.fields !== undefined && Object.keys(line.fields).length > 0) || !!line.stack;

/** Text with the matches of the search drawn as `<mark>`s. Only ever text nodes: nothing is parsed as HTML. */
const Highlighted = ({
  text,
  expression,
  active,
  tone,
}: {
  text: string;
  expression: RegExp | null;
  active: boolean;
  tone: LogTone;
}) => {
  if (expression === null) return text;
  const segments = splitLogMatches(text, expression);
  if (segments.length === 1 && !segments[0]!.match) return text;
  return segments.map((segment, index) =>
    segment.match ? (
      <mark
        key={index}
        className={clsx('rounded-xs', active ? TONE[tone].markActive : TONE[tone].mark)}
      >
        {segment.text}
      </mark>
    ) : (
      <Fragment key={index}>{segment.text}</Fragment>
    )
  );
};

type RowProps = {
  line: LogLine;
  /** Position in the drawn order, for the line number and `data-index`. */
  index: number;
  number: number | null;
  tone: LogTone;
  density: LogDensity;
  wrap: boolean;
  columns: readonly LogColumn[];
  expression: RegExp | null;
  matchState: 'none' | 'match' | 'active';
  current: boolean;
  expanded: boolean;
  detailsId: string;
  onToggle: (() => void) | null;
  isClient: boolean;
  locale?: string;
  timeZone?: string;
  height?: number;
};

/** One record. Also drawn by the hidden probe that measures a row. */
const LogRow = ({
  line,
  index,
  number,
  tone,
  density,
  wrap,
  columns,
  expression,
  matchState,
  current,
  expanded,
  detailsId,
  onToggle,
  isClient,
  locale,
  timeZone,
  height,
}: RowProps) => {
  const level = parseLogLevel(line.level);
  const palette = TONE[tone];
  const comfortable = density === 'comfortable';
  const active = matchState === 'active';
  const timestamp = toTimestamp(line.time);
  const showTime = columns.includes('time');
  const showLevel = columns.includes('level');
  const showSource = columns.includes('source') && line.source !== undefined;

  const toggle = onToggle ? (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={expanded ? detailsId : undefined}
      aria-label={expanded ? 'Hide details' : 'Show details'}
      className={clsx(
        'focus-visible:focus-indicator flex h-5 w-4 shrink-0 items-center justify-center rounded-sm focus-visible:ring-inset',
        palette.button
      )}
    >
      <ChevronRight
        aria-hidden
        className={clsx(
          'h-3.5 w-3.5 transition-transform motion-reduce:transition-none',
          expanded && 'rotate-90'
        )}
      />
    </button>
  ) : (
    <span aria-hidden className="w-4 shrink-0" />
  );

  const parts = (
    <>
      {number !== null && (
        <span
          aria-hidden
          className={clsx(
            'min-w-[6ch] shrink-0 text-right tabular-nums select-none',
            palette.muted
          )}
        >
          {number}
        </span>
      )}
      {showTime &&
        (isClient ? (
          <TimeLabel
            timestamp={timestamp}
            text={formatDateTime(timestamp, TIME_OPTIONS, locale, timeZone)}
            tooltip={false}
            className={clsx('shrink-0 tabular-nums', palette.muted)}
          />
        ) : (
          <TimePlaceholder width="12ch" className="shrink-0" />
        ))}
      {showLevel && <LogLevelBadge level={line.level} tone={tone} className="self-center" />}
      {showSource && (
        <span
          title={line.source}
          className={clsx(
            // Below 28rem of viewer the source goes: the message needs the room.
            'shrink-0 truncate @max-md:hidden',
            comfortable ? 'max-w-[16rem]' : 'w-28',
            palette.source
          )}
        >
          <Highlighted text={line.source!} expression={expression} active={active} tone={tone} />
        </span>
      )}
    </>
  );
  const message = (
    <span
      className={clsx(
        'min-w-0 [unicode-bidi:isolate]',
        // Narrow and wrapped, a compact row breaks after the time and the level: the message takes
        // a line of its own, as wide as the row less the toggle.
        wrap ? 'flex-1 break-words whitespace-pre-wrap' : 'whitespace-pre',
        wrap && !comfortable && '@max-md:ml-6 @max-md:basis-[calc(100%-1.5rem)]',
        LOG_MESSAGE_CLASS[tone][level]
      )}
    >
      <Highlighted text={line.message} expression={expression} active={active} tone={tone} />
    </span>
  );

  return (
    <div
      data-index={index}
      data-level={level}
      aria-current={current ? 'true' : undefined}
      style={height === undefined ? undefined : { height }}
      className={clsx(
        'flex gap-x-2 px-3 font-mono text-xs leading-5',
        wrap ? 'w-full' : 'w-max min-w-full',
        wrap && !comfortable && '@max-md:flex-wrap',
        comfortable ? 'py-row-6 items-start' : wrap ? 'items-start' : 'items-center',
        comfortable && clsx('border-b', palette.divider),
        // A wrapped row is as tall as its text, so the browser may skip those out of view.
        wrap && '[contain-intrinsic-size:auto_1.25rem] [content-visibility:auto]',
        current
          ? palette.current
          : active
            ? palette.activeMatch
            : expanded
              ? palette.expanded
              : palette.hover
      )}
    >
      {toggle}
      {comfortable ? (
        <div className={clsx('flex min-w-0 flex-col', wrap ? 'flex-1' : 'w-max')}>
          <div className="flex items-center gap-x-3">{parts}</div>
          <div className="flex">{message}</div>
        </div>
      ) : (
        <>
          <div className="contents">{parts}</div>
          {message}
        </>
      )}
    </div>
  );
};

/** The fields and the stack of an expanded line. */
const LogDetails = ({
  line,
  id,
  tone,
  style,
  fixed,
  number,
  onOpen,
}: {
  line: LogLine;
  id: string;
  tone: LogTone;
  style?: CSSProperties;
  /** Fixed height (windowed): it scrolls, so a keyboard has to reach it. */
  fixed: boolean;
  number: number | null;
  onOpen: (() => void) | null;
}) => {
  const palette = TONE[tone];
  const fields = line.fields ? Object.entries(line.fields) : [];
  return (
    <div
      id={id}
      role="group"
      aria-label={`Details of line ${number ?? line.id}`}
      tabIndex={fixed ? 0 : undefined}
      style={style}
      className={clsx(
        'focus-visible:focus-indicator w-full font-mono text-xs leading-5 focus-visible:ring-inset',
        fixed && 'overflow-auto',
        palette.expanded
      )}
    >
      <div className="py-row-4 pr-3 pl-9">
        {fields.length > 0 && (
          <dl className="grid grid-cols-[minmax(6rem,max-content)_minmax(0,1fr)] gap-x-4">
            {fields.map(([key, value]) => (
              <Fragment key={key}>
                <dt className={palette.muted}>{key}</dt>
                <dd className="m-0 break-words whitespace-pre-wrap [unicode-bidi:isolate]">
                  {formatLogField(value)}
                </dd>
              </Fragment>
            ))}
          </dl>
        )}
        {line.stack && (
          <pre
            className={clsx(
              'm-0 break-words whitespace-pre-wrap [unicode-bidi:isolate]',
              fields.length > 0 && 'mt-1',
              LOG_MESSAGE_CLASS[tone].error
            )}
          >
            {line.stack}
          </pre>
        )}
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className={clsx(
              'focus-visible:focus-indicator mt-1 rounded-sm underline underline-offset-2',
              tone === 'terminal' ? 'text-sky-300' : 'text-brand-600 dark:text-brand-400'
            )}
          >
            Open details
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * LogViewer — the live tail of a log: one monospace row per record, with its time, level, source
 * and message. It stays at the end while lines arrive and pauses when the reader scrolls away,
 * with a "Jump to latest" button that counts what came meanwhile. It highlights a search with an
 * active match, expands a row in place to show its fields and stack trace, and is windowed, so
 * tens of thousands of lines stay smooth in the default mode (see `wrap` for the limit).
 *
 * The host owns the data (fetching, streaming, trimming the buffer) and the filters: it passes
 * `lines` and what to show. Messages, sources, fields and stacks are text, never HTML. The log
 * does not announce new lines (`aria-live="off"`); `announceErrors` reads the error ones.
 */
export const LogViewer = ({
  lines,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  tone = 'terminal',
  density = 'compact',
  wrap = false,
  order = 'newest-last',
  columns = DEFAULT_COLUMNS,
  lineNumbers = false,
  follow: followProp,
  defaultFollow = true,
  onFollowChange,
  activeLevels,
  activeSources,
  search = '',
  searchRegex = false,
  activeMatch = 0,
  onMatchCountChange,
  expandedIds: expandedProp,
  defaultExpandedIds = NONE,
  onExpandedIdsChange,
  onOpenLine,
  currentId,
  announceErrors: announce = false,
  emptyMessage = 'No log lines.',
  locale,
  timeZone,
  height = '24rem',
  className,
  ref,
}: LogViewerProps) => {
  const uid = useId();
  const isClient = useIsClient();
  const palette = TONE[tone];
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(scrollerRef, ref), [ref]);

  const [follow, setFollow] = useControllableState({
    value: followProp,
    defaultValue: defaultFollow,
    onChange: onFollowChange,
    name: 'LogViewer.follow',
  });
  const [expandedIds, setExpandedIds] = useControllableState<readonly LogLine['id'][]>({
    value: expandedProp,
    defaultValue: defaultExpandedIds,
    onChange: onExpandedIdsChange,
    name: 'LogViewer.expandedIds',
  });

  // ── What is drawn ─────────────────────────────────────────────────────────
  const visible = useMemo(
    () => filterLogLines(lines, activeLevels, activeSources),
    [lines, activeLevels, activeSources]
  );
  const count = visible.length;
  const newest = order === 'newest-last';
  // Position `d` in the drawn order, and the other way round.
  const lineAtDrawn = useCallback(
    (d: number) => (newest ? visible[d]! : visible[count - 1 - d]!),
    [visible, count, newest]
  );
  const drawnOf = useCallback((i: number) => (newest ? i : count - 1 - i), [count, newest]);

  const expression = useMemo(
    () => compileLogSearch(search, { regex: searchRegex }),
    [search, searchRegex]
  );
  const matches = useMemo(() => findLogMatches(visible, expression), [visible, expression]);
  const matchCount = matches.length;
  const active =
    matchCount > 0 ? Math.min(Math.max(0, Math.trunc(activeMatch)), matchCount - 1) : -1;
  const activeIndex = active >= 0 ? matches[active]! : -1;
  const matchSet = useMemo(() => new Set(matches), [matches]);

  useLayoutEffect(() => {
    onMatchCountChange?.(matchCount);
  }, [matchCount, onMatchCountChange]);

  // The expanded lines that have details, in the drawn order, with the room their details take.
  const expandedSet = useMemo(() => new Set(expandedIds), [expandedIds]);
  const blocks = useMemo<ExpandedBlock[]>(() => {
    if (wrap || expandedIds.length === 0) return [];
    const found: ExpandedBlock[] = [];
    visible.forEach((line, i) => {
      if (expandedSet.has(line.id) && hasDetails(line))
        found.push({ index: drawnOf(i), extra: detailSlots(line) });
    });
    return found.sort((a, b) => a.index - b.index);
  }, [wrap, expandedIds.length, expandedSet, visible, drawnOf]);

  // ── The window ────────────────────────────────────────────────────────────
  const [rowHeight, setRowHeight] = useState(ESTIMATE[density]);
  const slots = totalSlots(count, blocks);
  const slice = useVirtualWindow({
    scrollerRef,
    count: slots,
    rowHeight,
    overscan: OVERSCAN,
    enabled: !wrap,
  });
  const shown = wrap
    ? { first: 0, last: count - 1, before: 0, after: 0 }
    : lineWindow(slice.start, slice.end, count, blocks);

  // The height of a row follows the text size, so it is measured on a hidden row, not guessed.
  useLayoutEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;
    const measure = () => {
      const measured = probe.getBoundingClientRect().height;
      if (measured > 0)
        setRowHeight((prev) => (Math.abs(prev - measured) < 0.01 ? prev : measured));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(probe);
    return () => observer.disconnect();
  }, [density, columns, lineNumbers, tone]);

  // ── Following the end ─────────────────────────────────────────────────────
  const stick = useCallback(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = newest ? el.scrollHeight : 0;
  }, [newest]);
  useLayoutEffect(() => {
    if (follow) stick();
  }, [follow, stick, visible, slots, rowHeight, wrap]);
  // A wrapped line or a row that grows moves the end after the render: stay on it.
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!follow || !content) return;
    const observer = new ResizeObserver(stick);
    observer.observe(content);
    return () => observer.disconnect();
  }, [follow, stick]);

  // Where the scroll position was left by the last change of content or by our own code. A scroll
  // event that finds it there is theirs, not the reader's: a filter that shortens the list makes
  // the browser clamp the position, often to the end, and that must not resume a paused viewer.
  const settled = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el) settled.current = el.scrollTop;
  }, [visible, slots, rowHeight, wrap, newest]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const distance = newest ? el.scrollHeight - el.scrollTop - el.clientHeight : el.scrollTop;
    const atEnd = distance <= Math.max(24, rowHeight);
    if (follow && !atEnd) setFollow(false);
    else if (!follow && atEnd && el.scrollTop !== settled.current) setFollow(true);
  };

  // Paused: remember the newest line, to count the ones that arrive after it.
  const newestId = count > 0 ? visible[count - 1]!.id : null;
  const [pausedAt, setPausedAt] = useState<{ id: LogLine['id'] | null } | null>(null);
  if (follow && pausedAt !== null) setPausedAt(null);
  else if (!follow && pausedAt === null) setPausedAt({ id: newestId });
  const waiting = useMemo(
    () =>
      follow || pausedAt === null
        ? 0
        : filterLogLines(newLinesSince(lines, pausedAt.id), activeLevels, activeSources).length,
    [follow, pausedAt, lines, activeLevels, activeSources]
  );

  // Newest first and paused: the lines that arrive push the ones being read down; keep them put.
  const lastSeen = useRef<{ id: LogLine['id'] | null; lines: readonly LogLine[] }>({
    id: newestId,
    lines: visible,
  });
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    const before = lastSeen.current;
    lastSeen.current = { id: newestId, lines: visible };
    if (!el || newest || follow || wrap || before.id === null || before.id === newestId) return;
    const added = newLinesSince(visible, before.id).length;
    if (added > 0 && added < visible.length) {
      el.scrollTop += added * rowHeight;
      settled.current = el.scrollTop;
    }
  }, [visible, newestId, newest, follow, wrap, rowHeight]);

  // ── The active match ──────────────────────────────────────────────────────
  // Scrolled into view when the active line changes (a new search, a click on next), not on every
  // line that arrives: the effect reads the latest state through a ref.
  const latest = useRef({ activeIndex, drawnOf, blocks, rowHeight, wrap });
  useLayoutEffect(() => {
    latest.current = { activeIndex, drawnOf, blocks, rowHeight, wrap };
  });
  const activeId = activeIndex >= 0 ? visible[activeIndex]!.id : null;
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    const state = latest.current;
    if (!el || activeId === null) return;
    const drawn = state.drawnOf(state.activeIndex);
    let top: number;
    if (state.wrap) {
      const row = el.querySelector<HTMLElement>(`[data-index="${drawn}"]`);
      if (!row) return;
      top = row.offsetTop - (el.clientHeight - row.offsetHeight) / 2;
    } else {
      top = slotOf(drawn, state.blocks) * state.rowHeight - (el.clientHeight - state.rowHeight) / 2;
    }
    el.scrollTop = Math.max(0, top);
    settled.current = el.scrollTop;
  }, [activeId, expression]);

  // ── Announcing the errors ─────────────────────────────────────────────────
  const [announced, setAnnounced] = useState<{ last: LogLine['id'] | null; text: string }>({
    last: newestId,
    text: '',
  });
  if (announced.last !== newestId) {
    setAnnounced({
      last: newestId,
      text: announce ? announceErrors(visible, announced.last) : '',
    });
  }

  // ── Rows ──────────────────────────────────────────────────────────────────
  const toggle = (line: LogLine) =>
    setExpandedIds((ids) =>
      ids.includes(line.id) ? ids.filter((id) => id !== line.id) : [...ids, line.id]
    );
  const rowFor = (d: number, fixed: boolean) => {
    const line = lineAtDrawn(d);
    const i = newest ? d : count - 1 - d;
    const expandable = hasDetails(line);
    const expanded = expandable && expandedSet.has(line.id);
    const detailsId = `${uid}-details-${d}`;
    const number = lineNumbers ? i + 1 : null;
    const extra = expanded && fixed ? detailSlots(line) : 0;
    return (
      <Fragment key={line.id}>
        <LogRow
          line={line}
          index={d}
          number={number}
          tone={tone}
          density={density}
          wrap={wrap}
          columns={columns}
          expression={expression === 'invalid' ? null : expression}
          matchState={i === activeIndex ? 'active' : matchSet.has(i) ? 'match' : 'none'}
          current={currentId !== undefined && line.id === currentId}
          expanded={expanded}
          detailsId={detailsId}
          onToggle={expandable ? () => toggle(line) : null}
          isClient={isClient}
          locale={locale}
          timeZone={timeZone}
          height={fixed ? rowHeight : undefined}
        />
        {expanded && (
          <LogDetails
            line={line}
            id={detailsId}
            tone={tone}
            fixed={fixed}
            number={number}
            style={extra > 0 ? { height: extra * rowHeight } : undefined}
            onOpen={onOpenLine ? () => onOpenLine(line) : null}
          />
        )}
      </Fragment>
    );
  };

  const rows: ReactNode[] = [];
  for (let d = shown.first; d <= shown.last; d++) rows.push(rowFor(d, !wrap));

  const jump = (
    <div
      className={clsx(
        'pointer-events-none absolute inset-x-0 flex justify-center',
        newest ? 'bottom-3' : 'top-3'
      )}
    >
      <Button
        size="sm"
        shape="pill"
        icon={newest ? ArrowDown : ArrowUp}
        className="pointer-events-auto shadow-lg"
        onClick={() => setFollow(true)}
      >
        {waiting > 0 ? `Jump to latest (${waiting.toLocaleString('en-US')} new)` : 'Jump to latest'}
      </Button>
    </div>
  );

  const probeLine: LogLine = { id: '', time: 0, level: 'info', source: 'a', message: '0' };
  return (
    <div
      style={{ height }}
      className={clsx('@container relative min-h-0 overflow-hidden', palette.root, className)}
    >
      <div
        ref={mergedRef}
        role="log"
        aria-live="off"
        aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : 'Log')}
        aria-labelledby={ariaLabelledBy}
        tabIndex={0}
        onScroll={onScroll}
        className="focus-visible:focus-indicator relative h-full overflow-auto py-2 [overflow-anchor:none] focus-visible:ring-inset"
      >
        {/* Measures a row, so the window knows how tall one is at this text size. */}
        <div
          ref={probeRef}
          aria-hidden
          className="pointer-events-none invisible absolute top-0 left-0"
        >
          <LogRow
            line={probeLine}
            index={0}
            number={lineNumbers ? 0 : null}
            tone={tone}
            density={density}
            wrap={false}
            columns={columns}
            expression={null}
            matchState="none"
            current={false}
            expanded={false}
            detailsId=""
            onToggle={null}
            isClient={false}
            height={undefined}
          />
        </div>
        <div ref={contentRef}>
          {count === 0 ? (
            <p className={clsx('m-0 px-3 py-2 font-sans text-sm', palette.muted)}>{emptyMessage}</p>
          ) : (
            <>
              {shown.before > 0 && <div aria-hidden style={{ height: shown.before * rowHeight }} />}
              {rows}
              {shown.after > 0 && <div aria-hidden style={{ height: shown.after * rowHeight }} />}
            </>
          )}
        </div>
      </div>
      {!follow && jump}
      <span role="status" aria-live="polite" className="sr-only">
        {announced.text}
      </span>
    </div>
  );
};
