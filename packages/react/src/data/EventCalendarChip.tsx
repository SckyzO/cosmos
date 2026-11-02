import { clsx } from 'clsx';
import type { CSSProperties, ReactNode } from 'react';
import { Popover } from '../ui/Popover';
import type { CalendarEvent, EventCalendarIntent } from './EventCalendar';

// What the month grid and the hour grid share: an event's colors, its chip, and the "+N" list.
// Internal: not re-exported from the package.

export const INTENT_DOT: Record<EventCalendarIntent, string> = {
  brand: 'bg-brand-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  violet: 'bg-violet-500',
};

export const INTENT_CHIP: Record<EventCalendarIntent, string> = {
  brand: 'bg-brand-50 dark:bg-brand-500/15',
  success: 'bg-green-50 dark:bg-green-500/15',
  warning: 'bg-amber-50 dark:bg-amber-500/15',
  danger: 'bg-red-50 dark:bg-red-500/15',
  info: 'bg-blue-50 dark:bg-blue-500/15',
  violet: 'bg-violet-50 dark:bg-violet-500/15',
};

export const INTENT_CHIP_HOVER: Record<EventCalendarIntent, string> = {
  brand: 'hover:bg-brand-100 dark:hover:bg-brand-500/25',
  success: 'hover:bg-green-100 dark:hover:bg-green-500/25',
  warning: 'hover:bg-amber-100 dark:hover:bg-amber-500/25',
  danger: 'hover:bg-red-100 dark:hover:bg-red-500/25',
  info: 'hover:bg-blue-100 dark:hover:bg-blue-500/25',
  violet: 'hover:bg-violet-100 dark:hover:bg-violet-500/25',
};

/** The strip on the start side of an event in the hour grid. */
export const INTENT_EDGE: Record<EventCalendarIntent, string> = {
  brand: 'border-brand-500',
  success: 'border-green-500',
  warning: 'border-amber-500',
  danger: 'border-red-500',
  info: 'border-blue-500',
  violet: 'border-violet-500',
};

/**
 * An event as a chip: a color dot, the start time when it has one, the title. A button when
 * `onClick` is given.
 */
export const EventChip = ({
  event,
  time,
  description,
  onClick,
  compact = false,
  continuation = false,
  flat,
}: {
  event: CalendarEvent;
  /** The start time to write before the title: none for an all-day event. */
  time?: string;
  /** Read by a screen reader after the title, not shown (the dates of a run of days). */
  description?: string;
  onClick?: (event: CalendarEvent) => void;
  /** In a day cell: below `sm` only the dot shows, the title stays for screen readers. */
  compact?: boolean;
  /** A later day of a multi-day event: the title is not repeated, screen readers still get it. */
  continuation?: boolean;
  /** The chip runs on past that edge (a bar over several days that was cut by the grid). */
  flat?: 'start' | 'end';
}) => {
  const intent = event.intent ?? 'brand';
  const content = (
    <>
      <span aria-hidden className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', INTENT_DOT[intent])} />
      {time && !continuation && (
        <span
          className={clsx(
            'shrink-0 text-gray-600 tabular-nums dark:text-gray-300',
            compact && 'max-sm:sr-only'
          )}
        >
          <bdi>{time}</bdi>
        </span>
      )}
      <span className={clsx('truncate', continuation ? 'sr-only' : compact && 'max-sm:sr-only')}>
        <bdi>{event.title}</bdi>
      </span>
      {description && <span className="sr-only">, {description}</span>}
    </>
  );
  const className = clsx(
    'flex min-w-0 items-center gap-1.5 px-1.5 py-0.5 text-start text-xs text-gray-700 dark:text-gray-200',
    flat === 'start' ? 'rounded-e-md' : flat === 'end' ? 'rounded-s-md' : 'rounded-md',
    // Without a title the chip keeps the height of one that has it, so the rows stay aligned.
    continuation && 'min-h-5',
    INTENT_CHIP[intent],
    compact ? 'max-sm:bg-transparent max-sm:px-1 sm:w-full max-sm:dark:bg-transparent' : 'w-full'
  );
  if (!onClick) {
    return (
      <div title={event.title} className={className}>
        {content}
      </div>
    );
  }
  return (
    <button
      type="button"
      title={event.title}
      onClick={() => onClick(event)}
      className={clsx(className, INTENT_CHIP_HOVER[intent], 'focus-visible:focus-indicator')}
    >
      {content}
    </button>
  );
};

/**
 * The "+N" button of a day and the list it opens: every event of the day, as chips. `children` is
 * what the button says; `label` names the day, for the list and for the button.
 */
export const DayEventsPopover = ({
  open,
  onOpenChange,
  label,
  hidden,
  events,
  timeOn,
  onEventClick,
  triggerClassName,
  triggerStyle,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  hidden: number;
  events: CalendarEvent[];
  /** The start time to show on an event's chip, or none. */
  timeOn: (event: CalendarEvent) => string | undefined;
  onEventClick?: (event: CalendarEvent) => void;
  triggerClassName?: string;
  triggerStyle?: CSSProperties;
  children: ReactNode;
}) => (
  <Popover open={open} onOpenChange={onOpenChange}>
    <Popover.Trigger
      aria-label={`+${hidden} more on ${label}`}
      data-calendar-hit
      style={triggerStyle}
      className={triggerClassName}
    >
      {children}
    </Popover.Trigger>
    <Popover.Content aria-label={`Events on ${label}`} width="w-60">
      <p className="mb-2 text-xs font-semibold text-[var(--color-text-primary)]">{label}</p>
      <ul className="space-y-1">
        {events.map((event) => (
          <li key={event.id}>
            <EventChip
              event={event}
              time={timeOn(event)}
              onClick={
                onEventClick &&
                ((e) => {
                  onOpenChange(false);
                  onEventClick(e);
                })
              }
            />
          </li>
        ))}
      </ul>
    </Popover.Content>
  </Popover>
);
