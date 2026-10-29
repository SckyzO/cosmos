import { clsx } from 'clsx';
import {
  ArrowDown,
  Check,
  ChevronRight,
  CircleDashed,
  CircleMinus,
  LoaderCircle,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { TimeLabel, TimePlaceholder } from '../data/TimeLabel';
import { formatDateTime, toTimestamp } from '../data/time';
import { useControllableState } from '../hooks/useControllableState';
import { useIsClient } from '../hooks/useIsClient';
import { windowSlice } from '../hooks/useVirtualWindow';
import { downloadFile } from '../table/download';
import { mergeRefs } from '../ui/mergeRefs';
import { JobLogToolbar } from './JobLogToolbar';
import { TIME_OPTIONS, TONE } from './LogViewer';
import type { LogTone } from './LogLevelBadge';
import { markAnsiSegments, parseAnsi } from './ansi';
import {
  defaultExpandedSteps,
  findJobLogMatches,
  formatElapsed,
  formatJobDuration,
  jobLogLineHref,
  jobLogText,
  lineText,
  matchRanges,
  sameLine,
  statusLabel,
  stepOrigin,
  toggleStep,
  withStep,
  type JobLogControl,
  type JobLogLine,
  type JobLogLineRef,
  type JobLogStep,
  type JobLogTimestampFormat,
  type JobStatus,
} from './job-log';
import { FRAME, STATUS, ansiClass } from './job-log-styles';
import { compileLogSearch, stepLogMatch } from './log-lines';

export type JobLogProps = {
  /** The steps of the job, in order. Each `id` is unique and stays the same from one render to the next. */
  steps: readonly JobLogStep[];
  /** Accessible name of the log. Default: the `title`, else `Job log`. */
  'aria-label'?: string;
  /** Id of an element that names the log, instead of `aria-label`. */
  'aria-labelledby'?: string;
  /** Heading of the log: the job's name. The header is drawn when any of `title`, `status`, `meta` or `duration` is given. */
  title?: ReactNode;
  /** The status of the job as a whole. */
  status?: JobStatus;
  /** What goes with the title: a branch and a commit, a trigger. Drawn in monospace. */
  meta?: ReactNode;
  /** How long the job took, in milliseconds. The host measures it. */
  duration?: number;
  /**
   * `terminal` (default) is a dark panel in every theme, as a console is. `surface` follows the
   * theme: for a card on a page.
   */
  tone?: LogTone;
  /** The controls of the toolbar to draw. Default all of them; an empty list leaves the toolbar out. */
  controls?: readonly JobLogControl[];
  /** Ids of the open steps, when controlled. */
  expandedSteps?: readonly string[];
  /**
   * Ids of the steps open at first, when uncontrolled. Default: the failed and the running
   * steps. A step that starts running later opens, as the reader would open it.
   */
  defaultExpandedSteps?: readonly string[];
  /** Called with the ids to move to when a step is opened or closed. */
  onExpandedStepsChange?: (ids: readonly string[]) => void;
  /**
   * The line in focus, when controlled: its step opens, it scrolls into view and is marked
   * (`aria-current`). `null` is none. A line is a step id and a number counted from 1 in that step.
   */
  currentLine?: JobLogLineRef | null;
  /** The line in focus at first, when uncontrolled. None by default. */
  defaultCurrentLine?: JobLogLineRef | null;
  /**
   * Called with the line to move to when a line number is clicked. The log never reads or writes
   * `location`: a host that syncs it with the URL hash does it here (see `parseJobLogHash`). A
   * click with a modifier key is the browser's own, so "open in a new tab" works.
   */
  onCurrentLineChange?: (line: JobLogLineRef) => void;
  /** Put in front of the ids of the line links (`#<prefix><step id>-L<n>`), to tell two logs on a page apart. */
  idPrefix?: string;
  /** Show the timestamps column, when controlled. Default off. */
  timestamps?: boolean;
  /** Initial `timestamps` while uncontrolled. Default `false`. */
  defaultTimestamps?: boolean;
  /** Called with the state to move to. */
  onTimestampsChange?: (timestamps: boolean) => void;
  /**
   * What the timestamps column says: the time of day of each line (`clock`, default), or the time
   * since its step started (`elapsed`, `+0:04.2`).
   */
  timestampFormat?: JobLogTimestampFormat;
  /**
   * Wrap the long lines, when controlled. Default off: each line stays on one line and the lines
   * of a step scroll sideways. Wrapped lines have no fixed height, so all of them are drawn, not
   * windowed: keep a step to a few thousand lines, or leave `wrap` off.
   */
  wrap?: boolean;
  /** Initial `wrap` while uncontrolled. Default `false`. */
  defaultWrap?: boolean;
  /** Called with the state to move to. */
  onWrapChange?: (wrap: boolean) => void;
  /** The text to find in the lines, highlighted, case-insensitive: the search of the toolbar, when controlled. */
  search?: string;
  /** Initial search while uncontrolled. Default empty. */
  defaultSearch?: string;
  /** Called with the text typed. */
  onSearchChange?: (search: string) => void;
  /**
   * Stay at the end while a step is running (`true`). Scrolling away from the end pauses it, and
   * scrolling back to it, or "Jump to latest", resumes it. Controlled; defaults to `defaultFollow`.
   */
  follow?: boolean;
  /** Initial `follow` while uncontrolled. Default `true`. */
  defaultFollow?: boolean;
  /** Called with the state to move to. */
  onFollowChange?: (follow: boolean) => void;
  /** Name of the downloaded file. Default `job-log.txt`. */
  fileName?: string;
  /** BCP 47 tag for the clock times (`fr-FR`). Default: the browser's language. */
  locale?: string;
  /** IANA zone for the clock times (`Asia/Tokyo`). Default: the browser's zone. */
  timeZone?: string;
  /** The height of the log: a CSS length, or a number of px. Default `32rem`. */
  height?: number | string;
  className?: string;
  /** Ref to the scrolling element. */
  ref?: Ref<HTMLDivElement>;
};

const ALL_CONTROLS: readonly JobLogControl[] = [
  'search',
  'timestamps',
  'wrap',
  'expand',
  'download',
];
const OVERSCAN = 8;
// Rows drawn for an open step before its place in the scroller is measured.
const FIRST_ROWS = 40;
const ESTIMATE = 20;

const STATUS_ICON: Record<JobStatus, LucideIcon> = {
  passed: Check,
  failed: X,
  running: LoaderCircle,
  queued: CircleDashed,
  skipped: CircleMinus,
};

/** The icon of a status, named for assistive technology: the colour only backs it. */
const StatusIcon = ({ status, tone }: { status: JobStatus; tone: LogTone }) => {
  const Icon = STATUS_ICON[status];
  return (
    <span role="img" aria-label={statusLabel(status)} className="inline-flex shrink-0">
      <Icon
        aria-hidden
        strokeWidth={status === 'passed' || status === 'failed' || status === 'running' ? 2.5 : 2}
        className={clsx(
          'size-4',
          STATUS[tone][status].icon,
          status === 'running' && 'motion-safe:animate-spin'
        )}
      />
    </span>
  );
};

type RowProps = {
  line: string | JobLogLine;
  stepId: string;
  /** From 1, in the step. */
  number: number;
  /** Digits of the highest number of the step: the column keeps its width. */
  digits: number;
  prefix: string;
  tone: LogTone;
  wrap: boolean;
  timestamps: boolean;
  format: JobLogTimestampFormat;
  origin: number | null;
  expression: RegExp | null;
  matchState: 'none' | 'match' | 'active';
  current: boolean;
  onSelect: ((ref: JobLogLineRef) => void) | null;
  isClient: boolean;
  locale?: string;
  timeZone?: string;
  height?: number;
};

/** One line of a step. Also drawn by the hidden probe that measures a row. */
const JobLogRow = ({
  line,
  stepId,
  number,
  digits,
  prefix,
  tone,
  wrap,
  timestamps,
  format,
  origin,
  expression,
  matchState,
  current,
  onSelect,
  isClient,
  locale,
  timeZone,
  height,
}: RowProps) => {
  const palette = TONE[tone];
  const look = FRAME[tone];
  const ref: JobLogLineRef = { step: stepId, line: number };
  const text = lineText(line);
  const stamp =
    typeof line === 'string' || line.timestamp === undefined ? null : toTimestamp(line.timestamp);
  const segments = parseAnsi(text);
  const active = matchState === 'active';
  const ranges =
    matchState === 'none' || expression === null
      ? []
      : matchRanges(segments.map((segment) => segment.text).join(''), expression);
  const pieces = markAnsiSegments(segments, ranges);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // A click with a modifier or a button other than the first is the browser's own.
    if (
      onSelect === null ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    onSelect(ref);
  };

  return (
    <div
      data-line={number > 0 ? number : undefined}
      style={height === undefined ? undefined : { height }}
      className={clsx(
        'flex gap-x-3 px-4 font-mono text-xs leading-5',
        wrap ? 'w-full' : 'w-max min-w-full',
        wrap && '[contain-intrinsic-size:auto_1.25rem] [content-visibility:auto]',
        current ? palette.current : active ? palette.activeMatch : palette.hover
      )}
    >
      {/* A raw anchor, not an AppLink: it points inside this log, which handles the click itself
          and never goes through a router. */}
      <a
        href={jobLogLineHref(prefix, ref)}
        aria-label={`Line ${number}`}
        aria-current={current ? 'location' : undefined}
        onClick={onClick}
        style={{ minWidth: `${digits}ch` }}
        className={clsx(
          'focus-visible:focus-indicator shrink-0 rounded-xs text-end tabular-nums select-none focus-visible:ring-inset',
          current ? look.linkCurrent : look.link
        )}
      >
        {number}
      </a>
      {timestamps &&
        (format === 'elapsed' ? (
          <span
            className={clsx(
              'inline-block min-w-[9ch] shrink-0 text-end tabular-nums select-none',
              palette.muted
            )}
          >
            {stamp !== null && origin !== null ? formatElapsed(stamp - origin) : ''}
          </span>
        ) : stamp === null ? (
          <span aria-hidden className="w-[12ch] shrink-0" />
        ) : isClient ? (
          <TimeLabel
            timestamp={stamp}
            text={formatDateTime(stamp, TIME_OPTIONS, locale, timeZone)}
            tooltip={false}
            className={clsx('shrink-0 tabular-nums select-none', palette.muted)}
          />
        ) : (
          <TimePlaceholder width="12ch" className="shrink-0" />
        ))}
      <span
        className={clsx(
          'min-w-0 [unicode-bidi:isolate]',
          wrap ? 'flex-1 break-words whitespace-pre-wrap' : 'whitespace-pre'
        )}
      >
        {pieces.map((piece, index) => (
          <span key={index} className={ansiClass(piece.style, tone)}>
            {piece.match ? (
              <mark className={clsx('rounded-xs', active ? palette.markActive : palette.mark)}>
                {piece.text}
              </mark>
            ) : (
              piece.text
            )}
          </span>
        ))}
      </span>
    </div>
  );
};

const EMPTY_STEP: Record<JobStatus, string> = {
  queued: 'Not started.',
  running: 'No output yet.',
  passed: 'No output.',
  failed: 'No output.',
  skipped: 'Skipped.',
};

/**
 * JobLog — the output of a CI job or a build: collapsible steps, each with its status and
 * duration, its lines numbered from 1 and drawn with their ANSI colours as theme colours. Failed
 * and running steps start open. The header of an open step sticks to the top while its lines
 * scroll, and a long step is windowed, so tens of thousands of lines stay smooth.
 *
 * It is read differently from a live tail (`LogViewer`): a line number is a link, `currentLine`
 * marks one line and scrolls to it, and the toolbar searches across all the steps, shows
 * timestamps (the time of day, or the time since the step started), wraps lines, expands or
 * collapses every step and downloads the log as plain text. While a step runs the log follows the
 * end, pauses when the reader scrolls up, and has a "Jump to latest" button.
 *
 * The host owns the data and the clock: it passes `steps`, their durations and the new lines as
 * they come. A line is text, never HTML: the ANSI colour codes are read into styled spans, and
 * every other escape sequence is dropped.
 */
export const JobLog = ({
  steps,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  title,
  status,
  meta,
  duration,
  tone = 'terminal',
  controls = ALL_CONTROLS,
  expandedSteps: expandedProp,
  defaultExpandedSteps: defaultExpandedProp,
  onExpandedStepsChange,
  currentLine: currentProp,
  defaultCurrentLine = null,
  onCurrentLineChange,
  idPrefix = '',
  timestamps: timestampsProp,
  defaultTimestamps = false,
  onTimestampsChange,
  timestampFormat = 'clock',
  wrap: wrapProp,
  defaultWrap = false,
  onWrapChange,
  search: searchProp,
  defaultSearch = '',
  onSearchChange,
  follow: followProp,
  defaultFollow = true,
  onFollowChange,
  fileName = 'job-log.txt',
  locale,
  timeZone,
  height = '32rem',
  className,
  ref,
}: JobLogProps) => {
  const uid = useId();
  const isClient = useIsClient();
  const palette = TONE[tone];
  const look = FRAME[tone];
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(scrollerRef, ref), [ref]);
  const controlSet = useMemo(() => new Set(controls), [controls]);

  const [expanded, setExpanded] = useControllableState<readonly string[]>({
    value: expandedProp,
    defaultValue: () => defaultExpandedProp ?? defaultExpandedSteps(steps),
    onChange: onExpandedStepsChange,
    name: 'JobLog.expandedSteps',
  });
  const [current, setCurrent] = useControllableState<JobLogLineRef | null>({
    value: currentProp,
    defaultValue: defaultCurrentLine,
    onChange: (line) => {
      if (line !== null) onCurrentLineChange?.(line);
    },
    name: 'JobLog.currentLine',
  });
  const [timestamps, setTimestamps] = useControllableState({
    value: timestampsProp,
    defaultValue: defaultTimestamps,
    onChange: onTimestampsChange,
    name: 'JobLog.timestamps',
  });
  const [wrap, setWrap] = useControllableState({
    value: wrapProp,
    defaultValue: defaultWrap,
    onChange: onWrapChange,
    name: 'JobLog.wrap',
  });
  const [search, setSearch] = useControllableState({
    value: searchProp,
    defaultValue: defaultSearch,
    onChange: onSearchChange,
    name: 'JobLog.search',
  });
  const [follow, setFollow] = useControllableState({
    value: followProp,
    defaultValue: defaultFollow,
    onChange: onFollowChange,
    name: 'JobLog.follow',
  });
  const expandedSet = useMemo(() => new Set(expanded), [expanded]);

  // ── The search ────────────────────────────────────────────────────────────
  const expression = useMemo(() => compileLogSearch(search), [search]);
  const matches = useMemo(() => findJobLogMatches(steps, expression), [steps, expression]);
  const matchSets = useMemo(() => {
    const byStep = new Map<string, Set<number>>();
    for (const match of matches) {
      const set = byStep.get(match.step) ?? new Set<number>();
      set.add(match.line);
      byStep.set(match.step, set);
    }
    return byStep;
  }, [matches]);
  const [matchIndex, setMatchIndex] = useState(0);
  const activeIndex = matches.length > 0 ? Math.min(matchIndex, matches.length - 1) : -1;
  const activeMatch = activeIndex >= 0 ? matches[activeIndex]! : null;

  // ── The row height and the window ─────────────────────────────────────────
  const [rowHeight, setRowHeight] = useState(ESTIMATE);
  const [ranges, setRanges] = useState<Record<string, readonly [number, number]>>({});

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
  }, [tone]);

  // Each open step is windowed on its own: the rows in view, and a few more on each side, are
  // drawn between two spacers. Its place in the scroller is read from the DOM, since the
  // headers above it and the closed steps are not rows.
  const measureWindows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || wrap) return;
    const top = el.getBoundingClientRect().top + el.clientTop;
    const next: Record<string, readonly [number, number]> = {};
    for (const node of el.querySelectorAll<HTMLElement>('[data-lines]')) {
      const offset = node.getBoundingClientRect().top - top + el.scrollTop;
      const scrolled = el.scrollTop - offset;
      const slice = windowSlice({
        scrollTop: scrolled,
        viewportHeight: el.clientHeight + Math.min(0, scrolled),
        rowHeight,
        count: Number(node.dataset.count),
        overscan: OVERSCAN,
      });
      next[node.dataset.lines!] = [slice.start, slice.end];
    }
    setRanges((prev) => {
      const same =
        Object.keys(next).length === Object.keys(prev).length &&
        Object.entries(next).every(
          ([id, [start, end]]) => prev[id]?.[0] === start && prev[id]?.[1] === end
        );
      return same ? prev : next;
    });
  }, [rowHeight, wrap]);
  useLayoutEffect(() => {
    measureWindows();
  }, [measureWindows, steps, expanded]);
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measureWindows);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measureWindows]);

  // ── Following the running step ────────────────────────────────────────────
  const running = steps.some((step) => step.status === 'running');
  const following = follow && running;
  const stick = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    measureWindows();
  }, [measureWindows]);
  useLayoutEffect(() => {
    if (following) stick();
  }, [following, stick, steps, expanded, rowHeight, wrap, timestamps]);
  // A wrapped line or a row that grows moves the end after the render: stay on it.
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!following || !content) return;
    const observer = new ResizeObserver(stick);
    observer.observe(content);
    return () => observer.disconnect();
  }, [following, stick]);

  // Where the scroll position was left by the last change of content or by our own code. A scroll
  // event that finds it there is theirs, not the reader's: it must not resume a paused log.
  const settled = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el) settled.current = el.scrollTop;
  }, [steps, expanded, rowHeight, wrap, timestamps]);

  const onScroll = () => {
    measureWindows();
    const el = scrollerRef.current;
    if (!el || !running) return;
    const atEnd = el.scrollHeight - el.scrollTop - el.clientHeight <= Math.max(24, rowHeight);
    if (follow && !atEnd) setFollow(false);
    else if (!follow && atEnd && el.scrollTop !== settled.current) setFollow(true);
  };

  // Paused: remember how many lines there were, to count the ones that arrive after.
  const total = steps.reduce((sum, step) => sum + step.lines.length, 0);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  if (following && pausedAt !== null) setPausedAt(null);
  else if (!following && running && pausedAt === null) setPausedAt(total);
  const waiting = pausedAt === null ? 0 : Math.max(0, total - pausedAt);

  // ── Opening a step and scrolling to a line ────────────────────────────────
  // What the effects below read: the latest state, without being rerun by it.
  const latest = useRef({ current, activeMatch, expandedSet, following });
  useLayoutEffect(() => {
    latest.current = { current, activeMatch, expandedSet, following };
  });

  // A line to scroll to once its step is open: opened first when it is closed.
  const pending = useRef<{ target: JobLogLineRef; asked: boolean } | null>(null);
  const reveal = useCallback(
    (target: JobLogLineRef) => {
      pending.current = { target, asked: false };
      if (!latest.current.expandedSet.has(target.step))
        setExpanded((ids) => withStep(ids, target.step));
      // Scrolling to a line is leaving the end.
      if (latest.current.following) setFollow(false);
    },
    [setExpanded, setFollow]
  );
  const currentKey = current === null ? '' : `${current.step}\0${current.line}`;
  useLayoutEffect(() => {
    if (latest.current.current !== null) reveal(latest.current.current);
  }, [currentKey, reveal]);
  const matchKey = activeMatch === null ? '' : `${search}\0${activeIndex}`;
  useLayoutEffect(() => {
    if (latest.current.activeMatch !== null) reveal(latest.current.activeMatch);
  }, [matchKey, reveal]);

  useLayoutEffect(() => {
    const job = pending.current;
    const el = scrollerRef.current;
    if (!job || !el) return;
    const { step, line } = job.target;
    if (!expandedSet.has(step)) {
      // The step is asked to open: if the next render still finds it closed, the host said no.
      if (job.asked) pending.current = null;
      job.asked = true;
      return;
    }
    pending.current = null;
    const lines = [...el.querySelectorAll<HTMLElement>('[data-lines]')].find(
      (node) => node.dataset.lines === step
    );
    const header = [...el.querySelectorAll<HTMLElement>('[data-step-header]')].find(
      (node) => node.dataset.stepHeader === step
    );
    if (!lines || !header) return;
    const count = Number(lines.dataset.count);
    const at = Math.min(Math.max(1, line), count);
    const origin = el.getBoundingClientRect().top + el.clientTop;
    const row = wrap ? lines.querySelector<HTMLElement>(`[data-line="${at}"]`) : null;
    const rowTop = row
      ? row.getBoundingClientRect().top - origin + el.scrollTop
      : lines.getBoundingClientRect().top - origin + el.scrollTop + (at - 1) * rowHeight;
    const rowSize = row ? row.offsetHeight : rowHeight;
    // The line goes in the middle of what the sticky header leaves in view.
    const stuck = header.offsetHeight;
    el.scrollTop = Math.max(0, rowTop - stuck - (el.clientHeight - stuck - rowSize) / 2);
    settled.current = el.scrollTop;
    measureWindows();
  });

  // A step that starts running opens, as the reader would open it.
  const statuses = useRef(new Map(steps.map((step) => [step.id, step.status])));
  useLayoutEffect(() => {
    const before = statuses.current;
    const started = steps.filter(
      (step) => step.status === 'running' && before.get(step.id) !== 'running'
    );
    statuses.current = new Map(steps.map((step) => [step.id, step.status]));
    if (started.length > 0)
      setExpanded((ids) => started.reduce((open, step) => withStep(open, step.id), ids));
  }, [steps, setExpanded]);

  // ── What the controls do ──────────────────────────────────────────────────
  const allExpanded = steps.length > 0 && steps.every((step) => expandedSet.has(step.id));
  const toggleAll = () => setExpanded(allExpanded ? [] : steps.map((step) => step.id));
  const step = (direction: 1 | -1) =>
    setMatchIndex(stepLogMatch(activeIndex, matches.length, direction));
  const onDownload = () => downloadFile(jobLogText(steps), fileName, 'text/plain;charset=utf-8');
  const select = useCallback((target: JobLogLineRef) => setCurrent(target), [setCurrent]);

  // ── Drawing ───────────────────────────────────────────────────────────────
  const hasHeader =
    title !== undefined || status !== undefined || meta !== undefined || duration !== undefined;
  const titleId = `${uid}-title`;
  // The log is named by what the host says, else by its title, else by a default.
  const regionLabelledBy =
    ariaLabelledBy ?? (ariaLabel === undefined && title !== undefined ? titleId : undefined);
  const regionName = regionLabelledBy !== undefined ? undefined : (ariaLabel ?? 'Job log');
  const searchExpression = expression === 'invalid' ? null : expression;

  const probeLine: JobLogLine = { text: '0' };
  const probeProps = {
    line: probeLine,
    stepId: '',
    number: 0,
    digits: 1,
    prefix: '',
    tone,
    wrap: false,
    timestamps: false,
    format: 'clock' as const,
    origin: null,
    expression: null,
    matchState: 'none' as const,
    current: false,
    onSelect: null,
    isClient: false,
  };

  const stepElements = steps.map((job, index) => {
    const open = expandedSet.has(job.id);
    const count = job.lines.length;
    const bodyId = `${uid}-body-${index}`;
    const origin = timestamps && timestampFormat === 'elapsed' ? stepOrigin(job) : null;
    const digits = String(count).length;
    const matched = matchSets.get(job.id);
    const [from, to] = wrap ? [0, count] : (ranges[job.id] ?? [0, Math.min(count, FIRST_ROWS)]);
    const end = Math.min(to, count);
    const start = Math.min(from, end);
    const rows: ReactNode[] = [];
    if (open)
      for (let at = start; at < end; at++) {
        const number = at + 1;
        const isActive =
          activeMatch !== null && activeMatch.step === job.id && activeMatch.line === number;
        rows.push(
          <JobLogRow
            key={number}
            line={job.lines[at]!}
            stepId={job.id}
            number={number}
            digits={digits}
            prefix={idPrefix}
            tone={tone}
            wrap={wrap}
            timestamps={timestamps}
            format={timestampFormat}
            origin={origin}
            expression={searchExpression}
            matchState={isActive ? 'active' : matched?.has(number) ? 'match' : 'none'}
            current={sameLine(current, { step: job.id, line: number })}
            onSelect={select}
            isClient={isClient}
            locale={locale}
            timeZone={timeZone}
            height={wrap ? undefined : rowHeight}
          />
        );
      }
    const trailing =
      job.status === 'queued' || job.status === 'skipped'
        ? job.status
        : job.duration !== undefined
          ? formatJobDuration(job.duration)
          : '';
    return (
      <div key={job.id} data-step={job.id}>
        <button
          type="button"
          data-step-header={job.id}
          aria-expanded={open}
          aria-controls={open ? bodyId : undefined}
          onClick={() => setExpanded((ids) => toggleStep(ids, job.id))}
          className={clsx(
            'focus-visible:focus-indicator h-ctrl-40 sticky top-0 z-10 flex w-full items-center gap-2.5 px-4 text-start text-sm font-medium focus-visible:ring-inset',
            index > 0 && clsx('border-t', palette.divider),
            open ? look.stepOpen : look.stepClosed,
            (job.status === 'queued' || job.status === 'skipped') && !open && look.stepMuted
          )}
        >
          <ChevronRight
            aria-hidden
            className={clsx(
              'size-4 shrink-0 transition-transform motion-reduce:transition-none',
              open ? 'rotate-90' : 'rtl:-scale-x-100',
              palette.muted
            )}
          />
          <StatusIcon status={job.status} tone={tone} />
          <span className="min-w-0 flex-1 truncate [unicode-bidi:isolate]">{job.name}</span>
          {trailing !== '' && (
            <span className={clsx('shrink-0 font-mono text-xs font-normal', palette.muted)}>
              <bdi>{trailing}</bdi>
            </span>
          )}
        </button>
        {open && (
          <div
            id={bodyId}
            role="group"
            aria-label={`${job.name} output`}
            className={clsx('py-row-6 border-t', palette.divider)}
          >
            {count === 0 ? (
              <p className={clsx('m-0 px-4 py-1 font-sans text-xs', palette.muted)}>
                {EMPTY_STEP[job.status]}
              </p>
            ) : (
              <div
                data-lines={job.id}
                data-count={count}
                // The lines are output: they keep their order, and scroll from the left, whatever
                // the page reads.
                dir="ltr"
                className={wrap ? undefined : 'overflow-x-auto'}
              >
                {start > 0 && <div aria-hidden style={{ height: start * rowHeight }} />}
                {rows}
                {end < count && <div aria-hidden style={{ height: (count - end) * rowHeight }} />}
              </div>
            )}
          </div>
        )}
      </div>
    );
  });

  return (
    <div
      style={{ height }}
      className={clsx(
        '@container relative flex min-h-0 flex-col overflow-hidden rounded-xl border',
        palette.root,
        look.border,
        className
      )}
    >
      {hasHeader && (
        <div
          className={clsx(
            'py-row-12 flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4',
            look.border
          )}
        >
          {title !== undefined && (
            <p id={titleId} className={clsx('m-0 text-sm font-semibold', look.title)}>
              <bdi>{title}</bdi>
            </p>
          )}
          {meta !== undefined && (
            <span
              className={clsx(
                'font-mono text-xs [unicode-bidi:isolate] @max-md:order-last @max-md:w-full',
                palette.muted
              )}
            >
              {meta}
            </span>
          )}
          {status !== undefined && (
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                STATUS[tone][status].pill
              )}
            >
              {status === 'running' && (
                <LoaderCircle
                  aria-hidden
                  strokeWidth={3}
                  className="size-3 motion-safe:animate-spin"
                />
              )}
              {statusLabel(status)}
            </span>
          )}
          {duration !== undefined && (
            <span className={clsx('ms-auto font-mono text-xs', palette.muted)}>
              <bdi>{formatJobDuration(duration)}</bdi>
            </span>
          )}
        </div>
      )}
      {controlSet.size > 0 && (
        <JobLogToolbar
          tone={tone}
          controls={controlSet}
          search={search}
          onSearchChange={(text) => {
            setSearch(text);
            // A new search starts at its first match.
            setMatchIndex(0);
          }}
          matchCount={matches.length}
          activeMatch={activeIndex}
          onStep={step}
          timestamps={timestamps}
          onTimestampsChange={setTimestamps}
          wrap={wrap}
          onWrapChange={setWrap}
          allExpanded={allExpanded}
          onToggleAll={toggleAll}
          onDownload={onDownload}
        />
      )}
      <div
        ref={mergedRef}
        role="region"
        aria-label={regionName}
        aria-labelledby={regionLabelledBy}
        tabIndex={0}
        onScroll={onScroll}
        className="focus-visible:focus-indicator relative min-h-0 flex-1 overflow-y-auto [overflow-anchor:none] focus-visible:ring-inset"
      >
        {/* Measures a row, so the window knows how tall one is at this text size. */}
        <div
          ref={probeRef}
          aria-hidden
          dir="ltr"
          className="inset-s-0 pointer-events-none invisible absolute top-0"
        >
          <JobLogRow {...probeProps} height={undefined} />
        </div>
        <div ref={contentRef}>
          {steps.length === 0 ? (
            <p className={clsx('m-0 px-4 py-2 font-sans text-sm', palette.muted)}>No steps.</p>
          ) : (
            stepElements
          )}
        </div>
      </div>
      {running && (
        <div
          className={clsx(
            'py-row-6 flex items-center gap-2 border-t px-4 text-xs',
            look.border,
            palette.muted
          )}
        >
          <span
            aria-hidden
            className={clsx('size-2 shrink-0 rounded-full', following ? look.dot : 'bg-gray-400')}
          />
          <span>{following ? 'Following the running step' : 'Paused'}</span>
          <button
            type="button"
            onClick={() => setFollow(!following)}
            className={clsx(
              'focus-visible:focus-indicator h-ctrl-28 ms-auto inline-flex items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium',
              look.footerButton
            )}
          >
            {following ? (
              'Pause'
            ) : (
              <>
                <ArrowDown aria-hidden className="size-3.5" />
                <bdi>
                  {waiting > 0
                    ? `Jump to latest (${waiting.toLocaleString('en-US')} new)`
                    : 'Jump to latest'}
                </bdi>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
