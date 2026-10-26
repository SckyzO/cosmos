import { TEXT_SIZE } from './core/axes';
import { CALENDAR_DARK_CLASS, CALENDAR_STEPS, MUTED, TEXT } from './core/colors';
import { ChartEmpty } from './core/frame';
import { HeatGrid, type HeatCell } from './core/HeatGrid';
import {
  cellMetrics,
  collectDays,
  DAY_MS,
  dayOf,
  monthMarks,
  parseDay,
  partsOf,
  stepOf,
  weekGrid,
  yearSpans,
  type WeekStart,
} from './calendarGrid';
import type { ChartEmptyProps, ChartProps } from './types';

export type CalendarDay = {
  /** The date, `YYYY-MM-DD`. A day listed twice adds up; anything else is ignored. */
  day: string;
  value: number;
};

export type CalendarChartProps = Omit<ChartProps, 'children' | 'height'> &
  ChartEmptyProps & {
    data: CalendarDay[];
    /**
     * First day shown, `YYYY-MM-DD`. Default: the first day of the earliest
     * year of `data` in the `calendar` layout, the earliest day in `range`.
     */
    from?: string;
    /** Last day shown, `YYYY-MM-DD`. Default: the end of the latest year, or the latest day in `range`. */
    to?: string;
    /**
     * `calendar` draws one block per year, with the months named above their
     * first full week. `range` draws one continuous grid from `from` to `to`,
     * with larger cells when the range is short. Default `calendar`.
     */
    layout?: 'calendar' | 'range';
    /** The weekday a week starts on: 1 for Monday (default), 0 for Sunday. */
    weekStart?: WeekStart;
    /** Format the value in the tooltip and in the name of each day. */
    formatValue?: (value: number) => string;
    /** Text at the low end of the scale under the grid. Default `Less`. */
    lessLabel?: string;
    /** Text at the high end of the scale under the grid. Default `More`. */
    moreLabel?: string;
    /** The language of the month, weekday and date names (BCP 47). Default `en-US`. */
    locale?: string;
  };

// Height of the empty state, which has no grid to take one from.
const EMPTY_HEIGHT = 120;

// Tuesday, Thursday and the weekend carry no name: a name every second row
// leaves each one room.
const NAMED_WEEKDAYS = [1, 3, 5];

type Block = { year: number | undefined; from: number; to: number };

export const CalendarChart = ({
  data,
  from,
  to,
  layout = 'calendar',
  weekStart = 1,
  formatValue = String,
  locale = 'en-US',
  lessLabel = 'Less',
  moreLabel = 'More',
  emptyMessage = 'No data',
  ariaLabel,
  width,
}: CalendarChartProps) => {
  const name = ariaLabel ?? 'Calendar chart';
  const days = collectDays(data);
  if (!days) {
    return (
      <ChartEmpty message={emptyMessage} ariaLabel={name} height={EMPTY_HEIGHT} width={width} />
    );
  }
  const given = {
    from: from === undefined ? undefined : parseDay(from),
    to: to === undefined ? undefined : parseDay(to),
  };
  const calendar = layout === 'calendar';
  const start = given.from ?? (calendar ? dayOf(partsOf(days.first).year, 0, 1) : days.first);
  const end = given.to ?? (calendar ? dayOf(partsOf(days.last).year, 11, 31) : days.last);
  const blocks: Block[] = calendar
    ? yearSpans(start, end)
    : end >= start
      ? [{ year: undefined, from: start, to: end }]
      : [];
  if (blocks.length === 0) {
    return (
      <ChartEmpty message={emptyMessage} ariaLabel={name} height={EMPTY_HEIGHT} width={width} />
    );
  }

  const month = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' });
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  const monthName = (m: number) => month.format(Date.UTC(2024, m, 1));
  // 2024-01-07 was a Sunday.
  const weekdayName = (d: number) => weekday.format(Date.UTC(2024, 0, 7 + d));
  const rows = Array.from({ length: 7 }, (_, row) => {
    const d = (row + weekStart) % 7;
    return NAMED_WEEKDAYS.includes(d) ? weekdayName(d) : '';
  });

  // One scale for every block, so two years compare.
  const max = Math.max(0, ...days.values.values());
  const color = (value: number) => CALENDAR_STEPS[stepOf(value, max)];

  const grids = blocks.map((block) => {
    const grid = weekGrid(block.from, block.to, weekStart);
    const metrics = cellMetrics(grid.weeks);
    const columns = Array.from({ length: grid.weeks }, () => '');
    for (const mark of monthMarks(grid)) columns[mark.column] = monthName(mark.month);
    const cells = grid.days.map((d): HeatCell => {
      const value = days.values.get(d.day) ?? 0;
      return {
        row: d.row,
        column: d.column,
        color: color(value),
        title: date.format(d.day * DAY_MS),
        label: '',
        value: formatValue(value),
      };
    });
    const label = block.year !== undefined && blocks.length > 1 ? `${name}, ${block.year}` : name;
    return { block, grid, metrics, columns, cells, label };
  });

  const metrics = grids[0].metrics;
  return (
    <div
      className={CALENDAR_DARK_CLASS}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        // As wide as the grid, so the scale lines up with its right edge.
        width: width ?? 'fit-content',
        maxWidth: '100%',
        minWidth: 0,
        fontSize: TEXT_SIZE,
        color: MUTED,
      }}
    >
      {grids.map(({ block, metrics: m, columns, cells, label }) => (
        <div key={block.year ?? 'range'} data-calendar-block="" style={{ minWidth: 0 }}>
          {blocks.length > 1 && (
            <p style={{ margin: '0 0 0.25rem', fontWeight: 600, color: TEXT }}>{block.year}</p>
          )}
          <HeatGrid
            rows={rows}
            columns={columns}
            cells={cells}
            cellHeight={m.size}
            columnWidth={m.size}
            gap={m.gap}
            cellRadius={m.radius}
            labelsAbove
            thinLabels={false}
            ariaLabel={label}
          />
        </div>
      ))}
      <div
        data-calendar-legend=""
        aria-hidden
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          // The grid sits in a box padded by 3px, room for its focus rings.
          paddingRight: 3,
          gap: metrics.gap,
        }}
      >
        <span style={{ marginRight: 4 }}>{lessLabel}</span>
        {CALENDAR_STEPS.map((step, i) => (
          <span
            key={i}
            data-calendar-step=""
            style={{
              width: metrics.size,
              height: metrics.size,
              borderRadius: metrics.radius,
              background: step,
            }}
          />
        ))}
        <span style={{ marginLeft: 4 }}>{moreLabel}</span>
      </div>
    </div>
  );
};
