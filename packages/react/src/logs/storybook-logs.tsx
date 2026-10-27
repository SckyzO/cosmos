import { useEffect, useMemo, useState } from 'react';
import { LogEntryDetail } from './LogEntryDetail';
import { LogToolbar } from './LogToolbar';
import { LogViewer, type LogViewerProps } from './LogViewer';
import { countLogLevels } from './log-lines';
import { LOG_LEVELS, type LogLevelKey, type LogLine, type LogOrder } from './types';

// Fake logs for the stories: every line is a pure function of its index, so a story draws the
// same lines on every run, in any order, and the live feed continues where the buffer ends.
// Internal to the package, not exported.

export const SOURCES = ['api.http', 'prom.client', 'scheduler', 'collector', 'db.pool', 'snmp'];

const START = Date.parse('2026-01-15T06:12:00.000Z');

/** A small seeded generator (mulberry32): the same seed gives the same sequence. */
const seeded = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const STACK = `TimeoutError: query exceeded 5000 ms
    at PromClient.query (prom/client.py:118)
    at MetricsService.cpu (services/metrics.py:64)
    at Router.dispatch (api/router.py:211)`;

/** The line at `index` of the fake feed: ids start at 1. */
export const fakeLine = (index: number): LogLine => {
  const random = seeded(index * 7919 + 13);
  const pick = random();
  const level =
    pick < 0.01
      ? 'trace'
      : pick < 0.14
        ? 'debug'
        : pick < 0.76
          ? 'info'
          : pick < 0.9
            ? 'warn'
            : pick < 0.99
              ? 'error'
              : 'fatal';
  const source = SOURCES[Math.floor(random() * SOURCES.length)]!;
  const ms = Math.floor(random() * 900) + 20;
  const rack = `R-${Math.floor(random() * 40) + 1}`;
  const messages: Record<string, string[]> = {
    trace: [`poll tick ${index}`],
    debug: [`Connection ${index % 12} returned to the pool`, `Job snmp-poll finished in ${ms} ms`],
    info: [
      `GET /api/racks/${rack} 200 · ${ms} ms`,
      `GET /api/nodes?rack=${rack} 200`,
      `POST /api/silences 201`,
    ],
    warn: [`Query timeout after 5 s, retrying (1/3)`, `Fan 3 on node-a02 below its minimum speed`],
    error: [
      `Query timeout after 5 s (3/3), giving up`,
      `Walk failed on pdu-${rack.toLowerCase()}: no response`,
    ],
    fatal: [`Out of memory: worker ${index % 4} killed`],
  };
  const options = messages[level]!;
  const hasFields = random() < 0.3 || level === 'error' || level === 'fatal';
  return {
    id: index,
    time: START + index * 137,
    level,
    source,
    message: options[Math.floor(random() * options.length)]!,
    fields: hasFields
      ? {
          request_id: `7f3c9a1e-${(index * 31).toString(16).padStart(4, '0')}`,
          rack,
          duration_ms: ms,
        }
      : undefined,
    stack: level === 'error' && random() < 0.5 ? STACK : undefined,
  };
};

/** `count` lines of the fake feed, from index `from` (ids start at 1). */
export const fakeLines = (count: number, from = 1): LogLine[] =>
  Array.from({ length: count }, (_, i) => fakeLine(from + i));

const KEY_LEVELS: readonly LogLevelKey[] = [...LOG_LEVELS, 'unknown'];

type ConsoleProps = {
  /** How many lines the buffer starts with. */
  count?: number;
  /** Lines added every 400 ms, 0 for a still buffer. Timers: a story that sets it takes `no-capture`. */
  feed?: number;
  /** The viewer's options. */
  viewer?: Partial<LogViewerProps>;
  /** Start the toolbar's search with this text. */
  search?: string;
  height?: number | string;
  /** Leave the toolbar out. */
  bare?: boolean;
  /** Start paused: the viewer is not following. */
  paused?: boolean;
  /** Called when "Open details" is pressed on a line. */
  onOpen?: (line: LogLine) => void;
};

/**
 * The toolbar and the viewer wired the way a host does, for the stories: one state for the
 * filters, the search, the view options and the buffer, passed to both.
 */
export const LogConsole = ({
  count = 300,
  feed = 0,
  viewer,
  search: initialSearch = '',
  height = 420,
  bare = false,
  paused = false,
  onOpen,
}: ConsoleProps) => {
  const [lines, setLines] = useState(() => fakeLines(count));
  const [follow, setFollow] = useState(!paused);
  const [levels, setLevels] = useState<readonly LogLevelKey[]>(KEY_LEVELS);
  const [sources, setSources] = useState<readonly string[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [regex, setRegex] = useState(false);
  const [active, setActive] = useState(0);
  const [matches, setMatches] = useState(0);
  const [wrap, setWrap] = useState(viewer?.wrap ?? false);
  const [order, setOrder] = useState<LogOrder>(viewer?.order ?? 'newest-last');
  const counts = useMemo(() => countLogLevels(lines), [lines]);

  useEffect(() => {
    if (feed <= 0) return;
    const timer = window.setInterval(() => {
      setLines((previous) => {
        const next = previous.length > 0 ? Number(previous[previous.length - 1]!.id) + 1 : 1;
        return [...previous, ...fakeLines(feed, next)].slice(-2000);
      });
    }, 400);
    return () => window.clearInterval(timer);
  }, [feed]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {!bare && (
        <LogToolbar
          className="border-b border-gray-100 px-3 py-3 dark:border-gray-800"
          live={follow}
          onLiveChange={setFollow}
          levels={KEY_LEVELS.filter((level) => level !== 'unknown')}
          levelCounts={counts}
          activeLevels={levels}
          onActiveLevelsChange={setLevels}
          search={search}
          onSearchChange={(text) => {
            setSearch(text);
            setActive(0);
          }}
          searchRegex={regex}
          onSearchRegexChange={(on) => {
            setRegex(on);
            setActive(0);
          }}
          matchCount={matches}
          activeMatch={active}
          onActiveMatchChange={setActive}
          sources={SOURCES}
          activeSources={sources}
          onActiveSourcesChange={setSources}
          wrap={wrap}
          onWrapChange={setWrap}
          order={order}
          onOrderChange={setOrder}
          onDownload={() => {}}
          onClear={() => setLines([])}
        />
      )}
      <LogViewer
        aria-label="Backend logs"
        height={height}
        {...viewer}
        lines={lines}
        follow={follow}
        onFollowChange={setFollow}
        activeLevels={levels}
        activeSources={sources}
        search={search}
        searchRegex={regex}
        activeMatch={active}
        onMatchCountChange={setMatches}
        wrap={wrap}
        order={order}
        onOpenLine={onOpen}
      />
    </div>
  );
};

/** A `LogEntryDetail` of the fake feed, with its neighbours as context. */
export const DetailOf = ({ index = 4 }: { index?: number }) => {
  const line = fakeLine(index);
  return (
    <LogEntryDetail
      line={{ ...line, stack: line.stack ?? STACK }}
      context={{ before: fakeLines(3, index - 3), after: fakeLines(3, index + 1) }}
    />
  );
};
