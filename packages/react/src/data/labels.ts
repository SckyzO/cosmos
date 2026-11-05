// The English the data components write, their part of `CosmosLabels` (`englishLabels`).

import type { CalendarView } from './calendar-grid';

export type AuditDiffLabels = {
  /** Header of the first column of the `table` variant. Default `Field`. */
  field: string;
  /** Header of the old values, and the "before" a screen reader hears in `inline`. Default `Before`. */
  before: string;
  /** Header of the new values, and the "after" a screen reader hears in `inline`. Default `After`. */
  after: string;
  /** Read in place of the "—" shown for a value that is absent. Default `empty`. */
  empty: string;
  /** Read before a word the new text no longer has. Default `removed:`. */
  removed: string;
  /** Read before a word the new text adds. Default `added:`. */
  added: string;
};

export type BarListLabels = {
  /** Shown in place of the list when `items` is empty. Default `No data`. */
  empty: string;
};

export type CountdownLabels = {
  /** Caption of the days tile, and the unit a screen reader hears. Default `Days`. */
  days: string;
  /** … of the hours. Default `Hours`. */
  hours: string;
  /** … of the minutes. Default `Minutes`. */
  minutes: string;
  /** … of the seconds. Default `Seconds`. */
  seconds: string;
  /** Suffix of the days in the one-line forms (`2d 4h`). Default `d`. */
  shortDays: string;
  /** … of the hours. Default `h`. */
  shortHours: string;
  /** … of the minutes. Default `m`. */
  shortMinutes: string;
  /** … of the seconds. Default `s`. */
  shortSeconds: string;
  /** The text before the count when the host passes no `label`. Default `Ends in`. */
  ends: string;
  /** The text once the count has reached zero, when the host passes no `completedLabel`. Default `Ended`. */
  completed: string;
};

export type EventCalendarLabels = {
  /** Name of the switch between the three views. Default `Calendar view`. */
  viewSwitch: string;
  /** The month view's segment. Default `Month`. */
  month: string;
  /** The week view's segment. Default `Week`. */
  week: string;
  /** The day view's segment. Default `Day`. */
  day: string;
  /** The button that goes back to the period that holds today. Default `Today`. */
  today: string;
  /** Tooltip of Today while the period shown holds today, given the view. Default `Already showing the current month`. */
  alreadyShowing: (view: CalendarView) => string;
  /** Tooltip of Today otherwise. Default `Back to the current month`. */
  backToCurrent: (view: CalendarView) => string;
  /** Name of the button to the period before. Default `Previous month`. */
  previous: (view: CalendarView) => string;
  /** Name of the button to the period after. Default `Next month`. */
  next: (view: CalendarView) => string;
  /** Shown under the grid when no event falls in the period shown. Default `No events this month`. */
  empty: (view: CalendarView) => string;
  /** The word after "+3" on the button of a busy day; only a screen reader hears it on a phone. Default `more`. */
  more: string;
  /** Name of that button, given the hidden count and the day. Default `+3 more on Thursday, May 7, 2026`. */
  hiddenEvents: (hidden: number, day: string) => string;
  /** Name of the list of a day's events, given the day. Default `Events on Thursday, May 7, 2026`. */
  eventsOn: (day: string) => string;
  /** The line under the grid of a phone when the picked day has no event. Default `No events`. */
  noEventsOnDay: string;
  /** Name of the hour grid, given the period's title. Default `Schedule for May 2026`. */
  schedule: (period: string) => string;
  /** Name of the strip of days of a phone's week. Default `Days of the week`. */
  weekDays: string;
  /** Name of the row of all-day events. Default `All-day events`. */
  allDayEvents: string;
  /** The row's caption. Default `all-day`. */
  allDay: string;
  /** Read after an event that began the day before. Default `, continued from the previous day`. */
  continuedFrom: string;
  /** Read after an event that goes on the day after. Default `, continues on the next day`. */
  continuesOn: string;
  /** Read when the keyboard cursor is on the all-day row of a day. Default `Thursday, May 7, 2026, all-day. Press Enter to choose this day.` */
  cursorOnDay: (day: string) => string;
  /** Read when the cursor is on a time slot. Default `Thursday, May 7, 2026, 9:30 AM. Press Enter to choose this time.` */
  cursorOnSlot: (day: string, time: string) => string;
};

export type IntegrationCardLabels = {
  /** The badge of a connected integration. Default `Connected`. */
  connected: string;
  /** … of one that can be connected. Default `Available`. */
  available: string;
  /** … of one in error. Default `Error`. */
  error: string;
  /** … of one waiting. Default `Pending`. */
  pending: string;
};

export type KanbanBoardLabels = {
  /** Name of the board when the host passes no `ariaLabel`. Default `Kanban board`. */
  board: string;
  /** What a screen reader hears on a card's grip. Default `Press Space or Enter to pick up the card. Use the arrow keys to move it, Space or Enter to drop it, Escape to cancel.` */
  dragInstructions: string;
  /** Announced when a card is picked up, given its title, its column and its place. Default `Picked up Fix login. Column Doing, position 2 of 5.` */
  pickedUp: (title: string, column: string, position: number, size: number) => string;
  /** Announced as the card moves, given the column and the place. Default `Column Doing, position 2 of 5.` */
  moved: (column: string, position: number, size: number) => string;
  /** Announced when it is dropped, or moved from its menu. Default `Fix login dropped in Doing, position 2 of 5.` */
  dropped: (title: string, column: string, position: number, size: number) => string;
  /** Announced when the move is cancelled. Default `Move cancelled. Fix login is back in Doing, position 2 of 5.` */
  cancelled: (title: string, column: string, position: number, size: number) => string;
  /** Name of a card's grip, given its title. Default `Move card: Fix login`. */
  moveCard: (title: string) => string;
  /** Name of a card's menu button. Default `Card actions: Fix login`. */
  cardActions: (title: string) => string;
  /** Name of a card's menu. Default `Actions for Fix login`. */
  actionsFor: (title: string) => string;
  /** The group of columns a card can move to. Default `Move to`. */
  moveTo: string;
  /** The menu item that moves a card up. Default `Move up`. */
  moveUp: string;
  /** The menu item that moves a card down. Default `Move down`. */
  moveDown: string;
  /** The unit a screen reader hears after a column's count, given the count. Default `cards`. */
  cards: (count: number) => string;
  /** Shown in a column with no card, when the column gives no `empty`. Default `No cards`. */
  empty: string;
  /** The button that adds a card to a column. Default `Add card`. */
  addCard: string;
  /** Read after it, given the column's title. Default `to Backlog`. */
  addCardTo: (column: string) => string;
};

export type KpiCardLabels = {
  /** The caption under the exact value in the tooltip of a shortened figure. Default `Exact value`. */
  exactValue: string;
  /** Read before the exact value, after the figure, for a screen reader. Default `, exact value`. */
  exactValueHint: string;
};

export type MiniCalendarLabels = {
  /** Name of the button to the month before. Default `Previous month`. */
  previousMonth: string;
  /** Name of the button to the month after. Default `Next month`. */
  nextMonth: string;
};

export type PipelineStagesLabels = {
  /** What a screen reader hears after a stage's figures, given the rate and the stage it comes from. Default `54.8% from Qualified`. */
  conversion: (rate: string, from: string) => string;
  /** The stage it comes from when its label is not text. Default `the previous stage`. */
  previousStage: string;
};

export type PlanCardLabels = {
  /** The disabled button of the plan in use. Default `Current plan`. */
  current: string;
  /** Read before a feature the plan has. Default `Included:`. */
  included: string;
  /** Read before a feature the plan lacks. Default `Not included:`. */
  notIncluded: string;
};

export type TrendDeltaLabels = {
  /** Read before a rise, hidden. Default `increase`. */
  increase: string;
  /** … a drop. Default `decrease`. */
  decrease: string;
  /** … a change of zero. Default `no change`. */
  noChange: string;
};

export const AUDIT_DIFF_LABELS: AuditDiffLabels = {
  field: 'Field',
  before: 'Before',
  after: 'After',
  empty: 'empty',
  removed: 'removed:',
  added: 'added:',
};

export const BAR_LIST_LABELS: BarListLabels = { empty: 'No data' };

export const COUNTDOWN_LABELS: CountdownLabels = {
  days: 'Days',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  shortDays: 'd',
  shortHours: 'h',
  shortMinutes: 'm',
  shortSeconds: 's',
  ends: 'Ends in',
  completed: 'Ended',
};

export const EVENT_CALENDAR_LABELS: EventCalendarLabels = {
  viewSwitch: 'Calendar view',
  month: 'Month',
  week: 'Week',
  day: 'Day',
  today: 'Today',
  alreadyShowing: (view) => `Already showing the current ${view}`,
  backToCurrent: (view) => `Back to the current ${view}`,
  previous: (view) => `Previous ${view}`,
  next: (view) => `Next ${view}`,
  empty: (view) => `No events this ${view}`,
  more: 'more',
  hiddenEvents: (hidden, day) => `+${hidden} more on ${day}`,
  eventsOn: (day) => `Events on ${day}`,
  noEventsOnDay: 'No events',
  schedule: (period) => `Schedule for ${period}`,
  weekDays: 'Days of the week',
  allDayEvents: 'All-day events',
  allDay: 'all-day',
  continuedFrom: ', continued from the previous day',
  continuesOn: ', continues on the next day',
  cursorOnDay: (day) => `${day}, all-day. Press Enter to choose this day.`,
  cursorOnSlot: (day, time) => `${day}, ${time}. Press Enter to choose this time.`,
};

export const INTEGRATION_CARD_LABELS: IntegrationCardLabels = {
  connected: 'Connected',
  available: 'Available',
  error: 'Error',
  pending: 'Pending',
};

export const KANBAN_BOARD_LABELS: KanbanBoardLabels = {
  board: 'Kanban board',
  dragInstructions:
    'Press Space or Enter to pick up the card. Use the arrow keys to move it, Space or Enter to drop it, Escape to cancel.',
  pickedUp: (title, column, position, size) =>
    `Picked up ${title}. Column ${column}, position ${position} of ${size}.`,
  moved: (column, position, size) => `Column ${column}, position ${position} of ${size}.`,
  dropped: (title, column, position, size) =>
    `${title} dropped in ${column}, position ${position} of ${size}.`,
  cancelled: (title, column, position, size) =>
    `Move cancelled. ${title} is back in ${column}, position ${position} of ${size}.`,
  moveCard: (title) => `Move card: ${title}`,
  cardActions: (title) => `Card actions: ${title}`,
  actionsFor: (title) => `Actions for ${title}`,
  moveTo: 'Move to',
  moveUp: 'Move up',
  moveDown: 'Move down',
  cards: (count) => (count === 1 ? 'card' : 'cards'),
  empty: 'No cards',
  addCard: 'Add card',
  addCardTo: (column) => `to ${column}`,
};

export const KPI_CARD_LABELS: KpiCardLabels = {
  exactValue: 'Exact value',
  exactValueHint: ', exact value',
};

export const MINI_CALENDAR_LABELS: MiniCalendarLabels = {
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
};

export const PIPELINE_STAGES_LABELS: PipelineStagesLabels = {
  conversion: (rate, from) => `${rate} from ${from}`,
  previousStage: 'the previous stage',
};

export const PLAN_CARD_LABELS: PlanCardLabels = {
  current: 'Current plan',
  included: 'Included:',
  notIncluded: 'Not included:',
};

export const TREND_DELTA_LABELS: TrendDeltaLabels = {
  increase: 'increase',
  decrease: 'decrease',
  noChange: 'no change',
};
