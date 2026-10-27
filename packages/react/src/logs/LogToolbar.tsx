import { clsx } from 'clsx';
import {
  ArrowDownUp,
  ChevronDown,
  ChevronUp,
  Download,
  Regex,
  SlidersHorizontal,
  Trash2,
  WrapText,
} from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Checkbox } from '../forms/Checkbox';
import { MultiSelect } from '../forms/MultiSelect';
import { SearchInput } from '../forms/SearchInput';
import { useControllableState } from '../hooks/useControllableState';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { HealthDot } from '../status/HealthDot';
import { Button } from '../ui/Button';
import { Popover } from '../ui/Popover';
import { LOG_LEVEL_LABEL } from './LogLevelBadge';
import { compileLogSearch, stepLogMatch } from './log-lines';
import type { LogLevelKey, LogOrder } from './types';

export type LogToolbarProps = {
  /** Accessible name of the group of controls. Default `Log controls`. */
  'aria-label'?: string;

  /** The stream is running. Controlled; the toolbar has the Live / Paused button when `onLiveChange` is given. */
  live?: boolean;
  /** Initial `live` while uncontrolled. Default `true`. */
  defaultLive?: boolean;
  /**
   * Called with the state to move to. Wire it to the viewer's `follow` to have the pause on
   * scroll shown in the bar, or to your own switch that stops feeding the stream.
   */
  onLiveChange?: (live: boolean) => void;

  /** The levels to offer as toggles, in the order to show them. No level toggles when omitted. */
  levels?: readonly LogLevelKey[];
  /** The number of lines per level, shown in the toggle. Count them with `countLogLevels`. */
  levelCounts?: Partial<Record<LogLevelKey, number>>;
  /** The levels that are on, when controlled. Default: all of `levels`. */
  activeLevels?: readonly LogLevelKey[];
  /** The levels on at first, when uncontrolled. Default: all of `levels`. */
  defaultActiveLevels?: readonly LogLevelKey[];
  /** Called with the levels to move to (in the order of `levels`). */
  onActiveLevelsChange?: (levels: readonly LogLevelKey[]) => void;

  /** The search text, when controlled. The search field is there when `onSearchChange` is given. */
  search?: string;
  /** Initial search text while uncontrolled. Default empty. */
  defaultSearch?: string;
  /** Called with the text typed. Reset the viewer's `activeMatch` to 0 here. */
  onSearchChange?: (search: string) => void;
  /** Read the search as a regular expression, when controlled. The toggle is there when `onSearchRegexChange` is given. */
  searchRegex?: boolean;
  /** Initial `searchRegex` while uncontrolled. Default `false`. */
  defaultSearchRegex?: boolean;
  /** Called with the state to move to. */
  onSearchRegexChange?: (regex: boolean) => void;
  /** How many lines match (the viewer's `onMatchCountChange`): shown as "2 of 3", and enables previous / next. */
  matchCount?: number;
  /** The active match, counted from 0. */
  activeMatch?: number;
  /**
   * Called with the match to go to, wrapping around the ends, when previous or next is pressed
   * (also Enter and Shift+Enter in the field). Previous and next are there when it is given.
   */
  onActiveMatchChange?: (index: number) => void;

  /** The sources to offer in the filter, which is there when this is given. */
  sources?: readonly string[];
  /** The sources that are on, when controlled. Empty means all of them. */
  activeSources?: readonly string[];
  /** The sources on at first, when uncontrolled. Default none: all of them. */
  defaultActiveSources?: readonly string[];
  /** Called with the sources to move to. */
  onActiveSourcesChange?: (sources: readonly string[]) => void;

  /** Wrap the long lines, when controlled. The toggle is there when `onWrapChange` is given. */
  wrap?: boolean;
  /** Initial `wrap` while uncontrolled. Default `false`. */
  defaultWrap?: boolean;
  /** Called with the state to move to. */
  onWrapChange?: (wrap: boolean) => void;
  /** Newest line first or last, when controlled. The toggle is there when `onOrderChange` is given. */
  order?: LogOrder;
  /** Initial `order` while uncontrolled. Default `newest-last`. */
  defaultOrder?: LogOrder;
  /** Called with the order to move to. */
  onOrderChange?: (order: LogOrder) => void;
  /** The download button is there when this is given. The host builds the file from its buffer. */
  onDownload?: () => void;
  /** The clear button is there when this is given. */
  onClear?: () => void;

  /** BCP 47 tag for the counts. Default `en-US`: the numbers do not change between server and browser. */
  locale?: string;
  className?: string;
};

const NONE: readonly never[] = [];
const LEVEL_NAME = (level: LogLevelKey) =>
  LOG_LEVEL_LABEL[level].charAt(0) + LOG_LEVEL_LABEL[level].slice(1).toLowerCase();

const CONTROL =
  'focus-visible:focus-indicator inline-flex h-9 items-center justify-center gap-2 rounded-lg border text-sm font-medium whitespace-nowrap';
const CONTROL_IDLE =
  'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700';
const CONTROL_ON =
  'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-300';

/** A button that is on or off: `aria-pressed`, with the on state a tint and not only a fill. */
const ToggleButton = ({
  pressed,
  onToggle,
  icon: Icon,
  children,
  iconOnly = false,
  className,
}: {
  pressed: boolean;
  onToggle: () => void;
  icon?: typeof WrapText;
  children: string;
  /** Draw the icon alone; the text stays as the accessible name and the tooltip. */
  iconOnly?: boolean;
  className?: string;
}) => (
  <button
    type="button"
    aria-pressed={pressed}
    aria-label={iconOnly ? children : undefined}
    title={iconOnly ? children : undefined}
    onClick={onToggle}
    className={clsx(
      CONTROL,
      pressed ? CONTROL_ON : CONTROL_IDLE,
      iconOnly ? 'w-9' : 'px-3',
      className
    )}
  >
    {Icon && <Icon aria-hidden className="h-4 w-4" />}
    {!iconOnly && children}
  </button>
);

/**
 * LogToolbar — the controls above a `LogViewer`, each there only when its props are given: Live /
 * Paused, level toggles with their counts, search with previous / next and an optional regular
 * expression, a source filter, wrap, order, download and clear. It holds none of the log: the host
 * passes the same filters to the toolbar and the viewer.
 *
 * From `sm` up it is one bar. Below, Live / Paused and the search stay in the bar, and the levels,
 * the sources and the view options move into a "Filters" popover whose button counts the active
 * filters (levels narrowed, sources chosen). It sits in a page header, a card header, or on its own.
 */
export const LogToolbar = ({
  'aria-label': ariaLabel = 'Log controls',
  live: liveProp,
  defaultLive = true,
  onLiveChange,
  levels,
  levelCounts,
  activeLevels: levelsProp,
  defaultActiveLevels,
  onActiveLevelsChange,
  search: searchProp,
  defaultSearch = '',
  onSearchChange,
  searchRegex: regexProp,
  defaultSearchRegex = false,
  onSearchRegexChange,
  matchCount,
  activeMatch = 0,
  onActiveMatchChange,
  sources,
  activeSources: sourcesProp,
  defaultActiveSources = NONE,
  onActiveSourcesChange,
  wrap: wrapProp,
  defaultWrap = false,
  onWrapChange,
  order: orderProp,
  defaultOrder = 'newest-last',
  onOrderChange,
  onDownload,
  onClear,
  locale = 'en-US',
  className,
}: LogToolbarProps) => {
  const wide = useMediaQuery('(min-width: 640px)', true);
  const [live, setLive] = useControllableState({
    value: liveProp,
    defaultValue: defaultLive,
    onChange: onLiveChange,
    name: 'LogToolbar.live',
  });
  const [activeLevels, setActiveLevels] = useControllableState<readonly LogLevelKey[]>({
    value: levelsProp,
    defaultValue: defaultActiveLevels ?? levels ?? NONE,
    onChange: onActiveLevelsChange,
    name: 'LogToolbar.activeLevels',
  });
  const [search, setSearch] = useControllableState({
    value: searchProp,
    defaultValue: defaultSearch,
    onChange: onSearchChange,
    name: 'LogToolbar.search',
  });
  const [regex, setRegex] = useControllableState({
    value: regexProp,
    defaultValue: defaultSearchRegex,
    onChange: onSearchRegexChange,
    name: 'LogToolbar.searchRegex',
  });
  const [activeSources, setActiveSources] = useControllableState<readonly string[]>({
    value: sourcesProp,
    defaultValue: defaultActiveSources,
    onChange: onActiveSourcesChange,
    name: 'LogToolbar.activeSources',
  });
  const [wrap, setWrap] = useControllableState({
    value: wrapProp,
    defaultValue: defaultWrap,
    onChange: onWrapChange,
    name: 'LogToolbar.wrap',
  });
  const [order, setOrder] = useControllableState<LogOrder>({
    value: orderProp,
    defaultValue: defaultOrder,
    onChange: onOrderChange,
    name: 'LogToolbar.order',
  });

  const format = (n: number) => n.toLocaleString(locale);
  const hasLive = onLiveChange !== undefined;
  const hasSearch = onSearchChange !== undefined;
  const hasNav = hasSearch && matchCount !== undefined && onActiveMatchChange !== undefined;
  const invalid = hasSearch && compileLogSearch(search, { regex }) === 'invalid';

  // ── Controls ──────────────────────────────────────────────────────────────
  const liveButton = hasLive && (
    <button
      type="button"
      aria-pressed={live}
      aria-label={live ? 'Live, pause the stream' : 'Paused, resume the stream'}
      onClick={() => setLive(!live)}
      className={clsx(CONTROL, 'px-3', live ? CONTROL_ON : CONTROL_IDLE)}
    >
      <span aria-hidden>
        <HealthDot status={live ? 'OK' : 'UNKNOWN'} pulse={live} />
      </span>
      {live ? 'Live' : 'Paused'}
    </button>
  );

  const toggleLevel = (level: LogLevelKey) => {
    if (!levels) return;
    const on = new Set(activeLevels);
    if (on.has(level)) on.delete(level);
    else on.add(level);
    setActiveLevels(levels.filter((key) => on.has(key)));
  };
  const levelCount = (level: LogLevelKey) =>
    levelCounts?.[level] === undefined ? null : format(levelCounts[level]);

  const levelGroup = levels && (
    <div
      role="group"
      aria-label="Levels"
      className="inline-flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
    >
      {levels.map((level) => {
        const pressed = activeLevels.includes(level);
        const count = levelCount(level);
        return (
          <button
            key={level}
            type="button"
            aria-pressed={pressed}
            onClick={() => toggleLevel(level)}
            className={clsx(
              'focus-visible:focus-indicator inline-flex h-[34px] items-center gap-1.5 border-r border-gray-200 px-2.5 text-sm font-medium last:border-r-0 focus-visible:ring-inset dark:border-gray-700',
              pressed
                ? 'bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            )}
          >
            {LEVEL_NAME(level)}
            {count !== null && (
              <span className="text-xs text-gray-600 tabular-nums dark:text-gray-400">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  const regexToggle = onSearchRegexChange !== undefined && (
    <ToggleButton pressed={regex} onToggle={() => setRegex(!regex)} icon={Regex} iconOnly>
      Regular expression
    </ToggleButton>
  );

  const step = (direction: 1 | -1) =>
    onActiveMatchChange?.(stepLogMatch(activeMatch, matchCount ?? 0, direction));
  const onSearchKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || !hasNav) return;
    event.preventDefault();
    step(event.shiftKey ? -1 : 1);
  };
  const matchText =
    search === ''
      ? null
      : invalid
        ? 'Invalid pattern'
        : matchCount === undefined
          ? null
          : matchCount === 0
            ? 'No matches'
            : `${format(Math.min(activeMatch, matchCount - 1) + 1)} of ${format(matchCount)}`;

  const searchInput = hasSearch && (
    <div onKeyDown={onSearchKeyDown} className="min-w-0 flex-1 sm:max-w-xs">
      <SearchInput
        aria-label="Search logs"
        placeholder="Search…"
        size="md"
        value={search}
        onChange={setSearch}
      />
    </div>
  );
  // The count and the arrows follow the field in the bar; narrow, they get a row under it.
  const searchNav = hasSearch && search !== '' && (matchText !== null || hasNav) && (
    <div className="flex shrink-0 items-center gap-1">
      {matchText !== null && (
        <span
          aria-live="polite"
          className={clsx(
            'text-xs whitespace-nowrap tabular-nums',
            invalid ? 'text-red-700 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
          )}
        >
          {matchText}
        </span>
      )}
      {hasNav && (
        <>
          <Button
            variant="ghost"
            size="sm"
            shape="square"
            icon={ChevronUp}
            aria-label="Previous match"
            disabled={!matchCount}
            onClick={() => step(-1)}
          />
          <Button
            variant="ghost"
            size="sm"
            shape="square"
            icon={ChevronDown}
            aria-label="Next match"
            disabled={!matchCount}
            onClick={() => step(1)}
          />
        </>
      )}
    </div>
  );

  const sourceField = (visibleLabel: boolean): ReactNode =>
    sources && (
      <MultiSelect
        size="sm"
        label={visibleLabel ? 'Sources' : <span className="sr-only">Sources</span>}
        placeholder="All sources"
        emptyMessage="No such source."
        options={sources.map((source) => ({ value: source, label: source }))}
        value={[...activeSources]}
        onChange={setActiveSources}
      />
    );

  const wrapToggle = onWrapChange !== undefined && (
    <ToggleButton pressed={wrap} onToggle={() => setWrap(!wrap)} icon={WrapText} iconOnly={wide}>
      Wrap lines
    </ToggleButton>
  );
  const orderToggle = onOrderChange !== undefined && (
    <ToggleButton
      pressed={order === 'newest-first'}
      onToggle={() => setOrder(order === 'newest-first' ? 'newest-last' : 'newest-first')}
      icon={ArrowDownUp}
      iconOnly={wide}
    >
      Newest first
    </ToggleButton>
  );
  const downloadButton = onDownload !== undefined && (
    <Button
      variant="secondary"
      size="md"
      icon={Download}
      shape={wide ? 'square' : 'rounded'}
      aria-label={wide ? 'Download' : undefined}
      title={wide ? 'Download' : undefined}
      onClick={onDownload}
    >
      {wide ? undefined : 'Download'}
    </Button>
  );
  const clearButton = onClear !== undefined && (
    <Button
      variant="secondary"
      size="md"
      icon={Trash2}
      shape={wide ? 'square' : 'rounded'}
      aria-label={wide ? 'Clear' : undefined}
      title={wide ? 'Clear' : undefined}
      onClick={onClear}
    >
      {wide ? undefined : 'Clear'}
    </Button>
  );

  if (wide) {
    return (
      <div
        role="group"
        aria-label={ariaLabel}
        className={clsx('flex flex-wrap items-center gap-2', className)}
      >
        {liveButton}
        {levelGroup}
        {searchInput && (
          <div className="flex min-w-0 flex-1 items-center gap-1 sm:max-w-lg">
            {searchInput}
            {searchNav}
            {regexToggle}
          </div>
        )}
        {sources && <div className="w-56">{sourceField(false)}</div>}
        {(wrapToggle || orderToggle || downloadButton || clearButton) && (
          <div className="ml-auto flex items-center gap-1.5">
            {wrapToggle}
            {orderToggle}
            {downloadButton}
            {clearButton}
          </div>
        )}
      </div>
    );
  }

  // Narrow: the stream state and the search stay in the bar, the rest goes into a popover.
  const activeFilters =
    (levels !== undefined && activeLevels.length < levels.length ? 1 : 0) +
    (sources !== undefined && activeSources.length > 0 ? 1 : 0);
  const hasFilters =
    levelGroup ||
    sources ||
    wrapToggle ||
    orderToggle ||
    regexToggle ||
    downloadButton ||
    clearButton;
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={clsx('flex flex-wrap items-center gap-2', className)}
    >
      <div className="flex w-full items-center gap-2">
        {liveButton}
        {searchInput}
        {hasFilters && (
          <Popover>
            <Popover.Trigger
              aria-label={activeFilters > 0 ? `Filters, ${activeFilters} active` : 'Filters'}
              className={clsx(CONTROL, 'px-3', CONTROL_IDLE)}
            >
              <SlidersHorizontal aria-hidden className="h-4 w-4" />
              Filters
              {activeFilters > 0 && (
                <span
                  aria-hidden
                  className="bg-brand-600 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs text-white"
                >
                  {activeFilters}
                </span>
              )}
            </Popover.Trigger>
            <Popover.Content
              aria-label="Log filters"
              align="end"
              width="w-[calc(100vw-2rem)] max-w-sm"
              padding="p-4"
            >
              <div className="flex flex-col gap-4">
                {levels && (
                  <fieldset className="m-0 min-w-0 border-0 p-0">
                    <legend className="mb-1 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">
                      Levels
                    </legend>
                    <div className="flex flex-col gap-2.5">
                      {levels.map((level) => {
                        const count = levelCount(level);
                        return (
                          <Checkbox
                            key={level}
                            checked={activeLevels.includes(level)}
                            onChange={() => toggleLevel(level)}
                            label={
                              <span className="flex w-full items-center justify-between gap-4">
                                {LEVEL_NAME(level)}
                                {count !== null && (
                                  <span className="text-gray-600 tabular-nums dark:text-gray-400">
                                    {count}
                                  </span>
                                )}
                              </span>
                            }
                          />
                        );
                      })}
                    </div>
                  </fieldset>
                )}
                {sources && sourceField(true)}
                {(wrapToggle || orderToggle || regexToggle) && (
                  <div>
                    <p className="m-0 mb-1 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">
                      View
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {wrapToggle}
                      {onSearchRegexChange !== undefined && (
                        <ToggleButton
                          pressed={regex}
                          onToggle={() => setRegex(!regex)}
                          icon={Regex}
                        >
                          Regex
                        </ToggleButton>
                      )}
                      {orderToggle}
                    </div>
                  </div>
                )}
                {(downloadButton || clearButton) && (
                  <div className="flex gap-2 [&>*]:flex-1">
                    {downloadButton}
                    {clearButton}
                  </div>
                )}
              </div>
            </Popover.Content>
          </Popover>
        )}
      </div>
      {searchNav && <div className="flex w-full justify-end">{searchNav}</div>}
    </div>
  );
};
