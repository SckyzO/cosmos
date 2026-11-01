import { clsx } from 'clsx';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { directionOf } from '../hooks/direction';
import { useElementWidth } from '../hooks/useElementWidth';
import { isoDate, isoWeekday, sameDay, startOfDay, type CalendarFormats } from './calendar-dates';
import {
  DAY_MINUTES,
  HOUR_HEIGHT,
  MIN_EVENT_HEIGHT,
  SLOT_MINUTES,
  columnsFitting,
  compareEvents,
  firstStart,
  isAllDay,
  lastDay,
  layoutAllDay,
  layoutDay,
  minutesOfDay,
  minutesToPx,
  moveCursor,
  openHour,
  segmentOn,
  slotAt,
  type CursorKey,
  type DaySegment,
  type SlotCursor,
} from './calendar-grid';
import type { CalendarEvent } from './EventCalendar';
import {
  DayEventsPopover,
  EventChip,
  INTENT_CHIP,
  INTENT_CHIP_HOVER,
  INTENT_EDGE,
} from './EventCalendarChip';

// The week and day views: a grid of hours, one column per day, with a row for all-day events above
// it. Internal: EventCalendar draws it.

/** The gutter of hours, then one column per day. A week has seven columns, a day one. */
const COLUMNS: Record<number, string> = {
  1: 'grid-cols-[3.5rem_minmax(0,1fr)]',
  7: 'grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]',
};

const GRID_HEIGHT = (DAY_MINUTES / 60) * HOUR_HEIGHT;
const HALF = HOUR_HEIGHT / 2;
// A line at every hour and a fainter one at every half hour, in the color the column is set to.
const GRID_LINES = [
  `repeating-linear-gradient(to bottom, currentColor 0, currentColor 1px, transparent 1px, transparent ${HOUR_HEIGHT}px)`,
  `repeating-linear-gradient(to bottom, transparent 0, transparent ${HALF - 1}px, color-mix(in srgb, currentColor 55%, transparent) ${HALF - 1}px, color-mix(in srgb, currentColor 55%, transparent) ${HALF}px, transparent ${HALF}px, transparent ${HOUR_HEIGHT}px)`,
].join(', ');

// Room left on the end side of a group that has hidden events, for its "+N" button.
const MORE_ROOM = 32;
// An event shorter than this has no room for a second line: the title and the time share one.
const ONE_LINE_BELOW = 38;
const SLOT_HEIGHT = minutesToPx(SLOT_MINUTES);

const CURSOR_KEYS = new Set<string>([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
]);

const slotStart = (day: Date, minutes: number) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);

const ROUND = { none: 'rounded-md', before: 'rounded-b-md', after: 'rounded-t-md', both: '' };

/** One timed event, drawn to fill its box in the grid. */
const TimedEvent = ({
  event,
  segment,
  height,
  fmt,
  onClick,
}: {
  event: CalendarEvent;
  segment: DaySegment;
  height: number;
  fmt: CalendarFormats;
  onClick?: (event: CalendarEvent) => void;
}) => {
  const intent = event.intent ?? 'brand';
  const oneLine = height < ONE_LINE_BELOW;
  const start = fmt.time(event.start);
  const range = event.end ? fmt.timeRange(event.start, event.end) : start;
  const className = clsx(
    'flex h-full w-full min-w-0 overflow-hidden border-s-[3px] px-1.5 text-start text-xs text-gray-700 dark:text-gray-200',
    ROUND[segment.before ? (segment.after ? 'both' : 'before') : segment.after ? 'after' : 'none'],
    INTENT_CHIP[intent],
    INTENT_EDGE[intent],
    oneLine ? 'items-center gap-1.5' : 'flex-col py-0.5 leading-snug'
  );
  const content = (
    <>
      <span className={clsx('truncate font-medium', oneLine && 'min-w-0')}>
        <bdi>{event.title}</bdi>
      </span>
      <span
        className={clsx(
          'text-2xs truncate text-gray-600 tabular-nums dark:text-gray-300',
          oneLine && 'shrink-0 @max-[6rem]:hidden'
        )}
      >
        <bdi>{oneLine ? start : range}</bdi>
      </span>
      {segment.before && <span className="sr-only">, continued from the previous day</span>}
      {segment.after && <span className="sr-only">, continues on the next day</span>}
    </>
  );
  if (!onClick) {
    return (
      <div data-calendar-hit title={event.title} className={className}>
        {content}
      </div>
    );
  }
  return (
    <button
      type="button"
      data-calendar-hit
      title={event.title}
      onClick={() => onClick(event)}
      className={clsx(className, INTENT_CHIP_HOVER[intent], 'focus-visible:focus-indicator')}
    >
      {content}
    </button>
  );
};

export type EventCalendarTimeGridProps = {
  /** The days to draw, consecutive, at 00:00: seven for a week, one for a day. */
  days: Date[];
  events: CalendarEvent[];
  /** The current moment: the line sits at its time, on its day. */
  now: Date;
  fmt: CalendarFormats;
  /** Names the scrolling area. */
  label: string;
  /** Days that PageUp and PageDown move the keyboard cursor by. */
  periodDays: number;
  /** Draws the weekday and date above each column. The phone's strip of days does it there. */
  header?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: Date) => void;
  onSlotClick?: (start: Date, info: { allDay: boolean }) => void;
  /** The keyboard cursor went to a day that is not drawn: show it. */
  onShowDay: (date: Date) => void;
};

export const EventCalendarTimeGrid = ({
  days,
  events,
  now,
  fmt,
  label,
  periodDays,
  header = true,
  onEventClick,
  onDayClick,
  onSlotClick,
  onShowDay,
}: EventCalendarTimeGridProps) => {
  const scroller = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const firstColumn = useRef<HTMLDivElement>(null);
  const cursorBox = useRef<HTMLDivElement>(null);
  const maxColumns = columnsFitting(useElementWidth(firstColumn));
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [cursor, setCursor] = useState<SlotCursor | null>(null);
  const [active, setActive] = useState(false);
  const [hover, setHover] = useState<{ key: string; minutes: number } | null>(null);
  const interactive = onSlotClick !== undefined;
  const count = days.length;

  const columns = useMemo(
    () =>
      days.map((day) => {
        const segments = events
          .flatMap((event) => {
            const segment = segmentOn(event, day);
            return segment ? [{ event, ...segment }] : [];
          })
          .sort(
            (a, b) => a.startMin - b.startMin || b.endMin - b.startMin - (a.endMin - a.startMin)
          );
        const dayEvents = events
          .filter((event) => startOfDay(event.start) <= day && day <= lastDay(event))
          .sort(compareEvents);
        return { day, segments, dayEvents, layout: layoutDay(segments, maxColumns) };
      }),
    [days, events, maxColumns]
  );
  const bars = useMemo(() => layoutAllDay(events, days), [events, days]);

  // Opens on 7 AM, or the hour before the first event. Only when the grid appears: moving on to
  // another week keeps the scroll.
  const [opensAt] = useState(() => openHour(firstStart(events, days)));
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollTop = opensAt * HOUR_HEIGHT;
  }, [opensAt]);

  const shownCursor = cursor && days.some((day) => sameDay(day, cursor.date)) ? cursor : null;
  useEffect(() => {
    const box = cursorBox.current;
    if (!active || !box) return;
    // The sticky header covers the top of the area: keep the cursor out from under it.
    box.style.scrollMarginTop = `${top.current?.offsetHeight ?? 0}px`;
    box.scrollIntoView({ block: 'nearest' });
  }, [active, cursor]);

  const timeOn = (event: CalendarEvent, day: Date) =>
    !isAllDay(event) && sameDay(event.start, day) ? fmt.time(event.start) : undefined;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || e.target !== e.currentTarget || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!shownCursor) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSlotClick(slotStart(shownCursor.date, shownCursor.minutes), { allDay: false });
      return;
    }
    if (!CURSOR_KEYS.has(e.key)) return;
    e.preventDefault();
    const next = moveCursor(shownCursor, e.key as CursorKey, {
      periodDays,
      rtl: directionOf(e.currentTarget) === 'rtl',
    });
    setCursor(next);
    if (!days.some((day) => sameDay(day, next.date))) onShowDay(next.date);
  };

  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    if (!interactive || e.target !== e.currentTarget) return;
    setActive(true);
    if (shownCursor) return;
    // Where the area is looking now: the first slot under the sticky header.
    const first = slotAt((scroller.current?.scrollTop ?? 0) + (top.current?.offsetHeight ?? 0));
    setCursor({ date: days.find((day) => sameDay(day, now)) ?? days[0], minutes: first });
  };

  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setActive(false);
  };

  // A pointer over an event or a "+N" button, or inside a list that opened in a portal (it
  // bubbles through React, not through the DOM), is not over a slot.
  const overSlot = (e: { target: EventTarget; currentTarget: HTMLElement }) => {
    const target = e.target as Element;
    return e.currentTarget.contains(target) && !target.closest('[data-calendar-hit]');
  };
  const slotUnder = (e: { clientY: number; currentTarget: HTMLElement }) =>
    slotAt(e.clientY - e.currentTarget.getBoundingClientRect().top);

  const nowMinutes = minutesOfDay(now);
  const nowInView = days.some((day) => sameDay(day, now));
  const status =
    active && shownCursor
      ? `${fmt.fullDate(shownCursor.date)}, ${fmt.time(slotStart(shownCursor.date, shownCursor.minutes))}. Press Enter to choose this time.`
      : '';

  return (
    <>
      <div
        ref={scroller}
        role={interactive ? 'application' : 'group'}
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        className="focus-visible:focus-indicator min-h-0 shrink grow basis-[36rem] overflow-auto border-t border-gray-200 focus-visible:ring-inset dark:border-gray-800"
      >
        <div ref={top} className="sticky top-0 z-30 bg-white dark:bg-gray-900">
          {header && (
            <div className={clsx('grid', COLUMNS[count])}>
              <div />
              {days.map((day) => {
                const isToday = sameDay(day, now);
                const dayLabel = fmt.fullDate(day);
                const numberClass = clsx(
                  'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-sm font-medium',
                  isToday ? 'bg-brand-500 text-white' : 'text-gray-700 dark:text-gray-200'
                );
                return (
                  <div
                    key={isoDate(day)}
                    aria-hidden={onDayClick ? undefined : true}
                    className="flex flex-col items-center gap-0.5 border-s border-gray-200 pt-2 pb-1.5 dark:border-gray-800"
                  >
                    <span
                      className={clsx(
                        'text-2xs font-semibold tracking-wider uppercase',
                        isToday
                          ? 'text-brand-600 dark:text-brand-400'
                          : 'text-gray-500 dark:text-gray-400'
                      )}
                    >
                      <bdi>{fmt.weekdays[isoWeekday(day)]}</bdi>
                    </span>
                    {onDayClick ? (
                      <button
                        type="button"
                        aria-label={dayLabel}
                        aria-current={isToday ? 'date' : undefined}
                        onClick={() => onDayClick(day)}
                        className={clsx(
                          numberClass,
                          !isToday && 'hover:bg-gray-100 dark:hover:bg-white/5',
                          'focus-visible:focus-indicator'
                        )}
                      >
                        {fmt.dayNumber(day)}
                      </button>
                    ) : (
                      <span className={numberClass}>{fmt.dayNumber(day)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {(bars.length > 0 || interactive) && (
            <div
              role="group"
              aria-label="All-day events"
              className="relative border-y border-gray-200 py-1 dark:border-gray-800"
            >
              <div aria-hidden className={clsx('absolute inset-0 grid', COLUMNS[count])}>
                <span className="text-2xs pe-2 pt-1 text-end text-gray-500 dark:text-gray-400">
                  all-day
                </span>
                {days.map((day) => (
                  <div
                    key={isoDate(day)}
                    onClick={
                      onSlotClick ? () => onSlotClick(startOfDay(day), { allDay: true }) : undefined
                    }
                    className={clsx(
                      'border-s border-gray-200 dark:border-gray-800',
                      onSlotClick && 'hover:bg-brand-500/10'
                    )}
                  />
                ))}
              </div>
              <ul
                className={clsx(
                  'pointer-events-none relative m-0 grid list-none gap-y-0.5 p-0',
                  COLUMNS[count]
                )}
                style={{ gridAutoRows: 22, minHeight: 22 }}
              >
                {bars.map((bar) => {
                  const event = events[bar.index];
                  const lastShown = lastDay(event);
                  return (
                    <li
                      key={event.id}
                      className="pointer-events-auto min-w-0 px-0.5"
                      style={{
                        gridColumn: `${bar.column + 2} / span ${bar.span}`,
                        gridRow: bar.lane + 1,
                      }}
                    >
                      <EventChip
                        event={event}
                        onClick={onEventClick}
                        flat={bar.before ? 'start' : bar.after ? 'end' : undefined}
                        description={
                          sameDay(startOfDay(event.start), lastShown)
                            ? undefined
                            : fmt.dateRange(event.start, lastShown)
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className={clsx('relative grid', COLUMNS[count])}>
          <div aria-hidden className="relative" style={{ height: GRID_HEIGHT }}>
            {Array.from({ length: 23 }, (_, i) => (
              <span
                key={i}
                className="text-2xs absolute end-2 -translate-y-1/2 whitespace-nowrap text-gray-500 tabular-nums dark:text-gray-400"
                style={{ top: minutesToPx((i + 1) * 60) }}
              >
                {fmt.hour(i + 1)}
              </span>
            ))}
            {nowInView && (
              <span
                className="text-3xs bg-brand-500 absolute end-0.5 z-20 -translate-y-1/2 rounded-full px-1 font-semibold whitespace-nowrap text-white tabular-nums"
                style={{ top: minutesToPx(nowMinutes) }}
              >
                {fmt.time(now)}
              </span>
            )}
          </div>

          {columns.map(({ day, segments, dayEvents, layout }, i) => {
            const key = isoDate(day);
            const dayLabel = fmt.fullDate(day);
            const isToday = sameDay(day, now);
            return (
              <div
                key={i}
                ref={i === 0 ? firstColumn : undefined}
                role="group"
                aria-label={dayLabel}
                onPointerMove={
                  interactive
                    ? (e) => {
                        if (e.pointerType !== 'mouse') return;
                        setHover(overSlot(e) ? { key, minutes: slotUnder(e) } : null);
                      }
                    : undefined
                }
                onPointerLeave={interactive ? () => setHover(null) : undefined}
                onClick={
                  onSlotClick
                    ? (e) => {
                        if (overSlot(e))
                          onSlotClick(slotStart(day, slotUnder(e)), { allDay: false });
                      }
                    : undefined
                }
                className={clsx(
                  'relative border-s border-gray-200 text-gray-200 dark:border-gray-800 dark:text-gray-800',
                  isToday && 'bg-brand-500/5'
                )}
                style={{ height: GRID_HEIGHT, backgroundImage: GRID_LINES }}
              >
                <ul className="m-0 list-none p-0">
                  {layout.placed.map((placed) => {
                    const { event, startMin, endMin, ...edges } = segments[placed.index];
                    const topPx = minutesToPx(startMin);
                    const height = Math.max(minutesToPx(endMin) - topPx - 2, MIN_EVENT_HEIGHT);
                    const room = placed.reserved ? `(100% - ${MORE_ROOM}px)` : '100%';
                    return (
                      <li
                        key={event.id}
                        className="@container absolute min-w-0"
                        style={{
                          top: topPx,
                          height,
                          insetInlineStart: `calc(${room} / ${placed.columns} * ${placed.column})`,
                          width: `calc(${room} / ${placed.columns} - 2px)`,
                        }}
                      >
                        <TimedEvent
                          event={event}
                          segment={{ startMin, endMin, ...edges }}
                          height={height}
                          fmt={fmt}
                          onClick={onEventClick}
                        />
                      </li>
                    );
                  })}
                </ul>

                {layout.overflow.map((group) => {
                  const moreKey = `${key}:${group.startMin}`;
                  return (
                    <DayEventsPopover
                      key={moreKey}
                      open={openKey === moreKey}
                      onOpenChange={(open) => setOpenKey(open ? moreKey : null)}
                      label={dayLabel}
                      hidden={group.indices.length}
                      events={dayEvents}
                      timeOn={(event) => timeOn(event, day)}
                      onEventClick={onEventClick}
                      triggerClassName="text-2xs absolute z-10 h-[18px] min-w-6 rounded-full border border-gray-200 bg-gray-100 px-1 font-semibold text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                      triggerStyle={{ top: minutesToPx(group.startMin) + 2, insetInlineEnd: 1 }}
                    >
                      <bdi>+{group.indices.length}</bdi>
                    </DayEventsPopover>
                  );
                })}

                {isToday && (
                  <div
                    aria-hidden
                    data-calendar-now
                    className="bg-brand-500 before:bg-brand-500 pointer-events-none absolute inset-x-0 z-20 h-0.5 before:absolute before:-start-[5px] before:-top-1 before:h-2.5 before:w-2.5 before:rounded-full before:content-['']"
                    style={{ top: minutesToPx(nowMinutes) - 1 }}
                  />
                )}
                {hover?.key === key && (
                  <div
                    aria-hidden
                    className="bg-brand-500/10 text-2xs text-brand-600 dark:text-brand-400 pointer-events-none absolute inset-x-0.5 rounded-sm px-1.5 font-medium"
                    style={{
                      top: minutesToPx(hover.minutes),
                      height: SLOT_HEIGHT,
                      lineHeight: `${SLOT_HEIGHT}px`,
                    }}
                  >
                    {fmt.time(slotStart(day, hover.minutes))}
                  </div>
                )}
                {active && shownCursor && sameDay(shownCursor.date, day) && (
                  <div
                    ref={cursorBox}
                    aria-hidden
                    className="ring-brand-500 pointer-events-none absolute inset-x-0.5 z-10 rounded-sm ring-2 ring-inset"
                    style={{ top: minutesToPx(shownCursor.minutes), height: SLOT_HEIGHT }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      {interactive && (
        <p
          role="status"
          className={clsx(
            status
              ? 'border-t border-gray-200 px-4 py-2 text-xs text-[var(--color-text-muted)] dark:border-gray-800'
              : 'sr-only'
          )}
        >
          {status}
        </p>
      )}
    </>
  );
};
