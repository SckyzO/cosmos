import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { CalendarChart, type CalendarDay } from './CalendarChart';
import {
  HOSTILE,
  contrastRatio,
  expectEmptyMessage,
  expectNoInjectedImage,
  switchTheme,
  themeColor,
} from './storybook-recharts';

const DAY_MS = 86_400_000;

// Every day from `from` to `to` (UTC), with the value `valueOf` gives it.
const eachDay = (
  from: string,
  to: string,
  valueOf: (index: number, date: Date) => number
): CalendarDay[] => {
  const days: CalendarDay[] = [];
  for (let t = Date.parse(from), i = 0; t <= Date.parse(to); t += DAY_MS, i++) {
    const date = new Date(t);
    days.push({ day: date.toISOString().slice(0, 10), value: valueOf(i, date) });
  }
  return days;
};

// Deploys per day: busy on weekdays, quiet at the weekend, deterministic.
const deploys = (from: string, to: string) => {
  let seed = 7;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return eachDay(from, to, (_, date) => {
    const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
    const r = random();
    return r < (weekend ? 0.55 : 0.12) ? 0 : Math.round(r * (weekend ? 4 : 11));
  });
};

const unit = (value: number) => `${value} ${value === 1 ? 'deploy' : 'deploys'}`;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Calendar',
  component: CalendarChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof CalendarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const YEAR = deploys('2026-01-01', '2026-12-31');

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * The `calendar` layout: one block per year, the weeks as columns and the
 * weekdays as rows, the months named above their first full week. The title
 * and the total are the host's.
 */
export const DeploysPerDay: Story = {
  args: { data: YEAR, formatValue: unit, ariaLabel: 'Deploys per day in 2026' },
};

/** Days with no entry are empty, so a sparse year is data and nothing else. */
export const SparseYear: Story = {
  args: {
    ariaLabel: 'Incidents in 2026',
    formatValue: (value) => `${value} ${value === 1 ? 'incident' : 'incidents'}`,
    from: '2026-01-01',
    to: '2026-12-31',
    data: [
      { day: '2026-01-14', value: 1 },
      { day: '2026-02-03', value: 3 },
      { day: '2026-02-04', value: 2 },
      { day: '2026-04-21', value: 1 },
      { day: '2026-06-09', value: 5 },
      { day: '2026-06-10', value: 4 },
      { day: '2026-06-11', value: 1 },
      { day: '2026-09-30', value: 2 },
      { day: '2026-11-17', value: 1 },
    ],
  },
};

/** The `range` layout: any span, with larger cells when it is short. */
export const Last20Weeks: Story = {
  args: {
    layout: 'range',
    data: deploys('2026-06-08', '2026-10-25'),
    formatValue: unit,
    ariaLabel: 'Deploys over the last 20 weeks',
  },
};

/** A long range keeps small cells and scrolls inside its box when it is wider. */
export const LongRange: Story = {
  args: {
    layout: 'range',
    data: deploys('2024-09-02', '2026-10-25'),
    formatValue: unit,
    ariaLabel: 'Deploys over two years',
  },
};

/** The `calendar` layout draws one block per year of the range, each headed by its year. */
export const SeveralYears: Story = {
  args: {
    data: deploys('2024-03-04', '2026-10-25'),
    formatValue: unit,
    ariaLabel: 'Deploys per day',
  },
};

/** `from` and `to` cut the grid: days outside have no cell. */
export const PartOfAYear: Story = {
  args: {
    data: YEAR,
    from: '2026-03-10',
    to: '2026-08-20',
    formatValue: unit,
    ariaLabel: 'Deploys from March to August',
  },
};

/** `weekStart={0}` starts the weeks on Sunday. */
export const WeekStartsOnSunday: Story = {
  args: { data: YEAR, weekStart: 0, formatValue: unit, ariaLabel: 'Deploys per day in 2026' },
};

/** `locale` names the months, the weekdays and the dates; `lessLabel` and `moreLabel` the ends of the scale. */
export const French: Story = {
  args: {
    data: YEAR,
    locale: 'fr-FR',
    lessLabel: 'Moins',
    moreLabel: 'Plus',
    formatValue: unit,
    ariaLabel: 'Déploiements par jour en 2026',
  },
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the grid. */
export const Empty: Story = {
  args: { data: [] },
};

export const EmptyChecks: Story = {
  ...Empty,
  tags: ['!dev', '!autodocs'],
  play: expectEmptyMessage('No data'),
};

// ── Interaction tests ────────────────────────────────────────────────────────

const gridOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[role="grid"]') as HTMLElement;
const cellsOf = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[role="gridcell"]')];
const tooltipOf = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-heat-tooltip]');
// A day's cell, found by the start of its name: the date in full.
const cellOn = (root: HTMLElement, date: string) =>
  root.querySelector<HTMLElement>(`[role="gridcell"][aria-label^="${date}"]`) as HTMLElement;
const monthNames = (root: HTMLElement) =>
  [...root.querySelectorAll('[data-heat-column]')].map((el) => el.textContent).filter(Boolean);
const weekdayNames = (root: HTMLElement) =>
  [...root.querySelectorAll('[data-heat-row]')].map((el) => el.textContent);
const steps = (root: HTMLElement) => [...root.querySelectorAll('[data-calendar-step]')];
const px = (el: Element | null) => parseFloat(el ? getComputedStyle(el).fontSize : '');

// A CSS color in any syntax, over the card, as `#rrggbb`: the steps are mixes
// and the empty one is translucent.
const flatCanvas = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
const flat = (color: string, over: string) => {
  flatCanvas.clearRect(0, 0, 1, 1);
  flatCanvas.fillStyle = over;
  flatCanvas.fillRect(0, 0, 1, 1);
  flatCanvas.fillStyle = color;
  flatCanvas.fillRect(0, 0, 1, 1);
  const [r, g, b] = flatCanvas.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};
const panel = () => flat(themeColor('--color-bg-panel'), '#000');
const fillOf = (el: Element) => flat(getComputedStyle(el).backgroundColor, panel());

const ACCENT_IDS = [
  'blue',
  'indigo',
  'violet',
  'purple',
  'rose',
  'teal',
  'cyan',
  'graphite',
  'red',
  'orange',
  'amber',
  'green',
];

/** The tooltip and the names of the days are text: markup in a formatted value shows as written. */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    data: [{ day: '2026-03-02', value: 3 }],
    from: '2026-03-01',
    to: '2026-03-31',
    layout: 'range',
    formatValue: () => HOSTILE,
    ariaLabel: HOSTILE,
    emptyMessage: HOSTILE,
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(gridOf(canvasElement)).toHaveAttribute('aria-label', HOSTILE));
    const cell = cellOn(canvasElement, 'Monday, March 2, 2026');
    await expect(cell).toHaveAttribute('aria-label', `Monday, March 2, 2026: ${HOSTILE}`);
    await userEvent.hover(cell);
    await waitFor(() => {
      const card = tooltipOf(canvasElement);
      expect(card?.querySelector('p')?.textContent).toBe('Monday, March 2, 2026');
      expect(card?.querySelector('li')?.textContent).toContain(HOSTILE);
    });
    await expectNoInjectedImage(canvasElement);
    await userEvent.unhover(cell);
  },
};

/** The message of the empty state is text too. */
export const HtmlInEmptyMessageRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: [], emptyMessage: HOSTILE },
  play: async ({ canvasElement }) => {
    await expectEmptyMessage(HOSTILE)({ canvasElement });
    await expectNoInjectedImage(canvasElement);
  },
};

/** The cell under the pointer shows the date in full and the formatted value. */
export const TooltipGivesTheDateAndTheValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    data: [
      { day: '2026-01-12', value: 7 },
      { day: '2026-01-13', value: 1 },
    ],
    from: '2026-01-01',
    to: '2026-01-31',
    formatValue: unit,
  },
  play: async ({ canvasElement }) => {
    await expect(tooltipOf(canvasElement)).toBeNull();
    const cell = cellOn(canvasElement, 'Monday, January 12, 2026');
    await userEvent.hover(cell);
    await waitFor(() => {
      const card = tooltipOf(canvasElement) as HTMLElement;
      expect(card.querySelector('p')?.textContent).toBe('Monday, January 12, 2026');
      expect(card.querySelector('li')?.textContent).toContain('7 deploys');
    });
    await userEvent.unhover(cell);
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
    // A day with no entry is a day of zero.
    await userEvent.hover(cellOn(canvasElement, 'Tuesday, January 20, 2026'));
    await waitFor(() => expect(tooltipOf(canvasElement)?.textContent).toContain('0 deploys'));
  },
};

/**
 * The months are named above the first full week of each month, every one of
 * them: the labels are not thinned as a heatmap's are. Mon, Wed and Fri name
 * the rows, the weeks start on Monday.
 */
export const MonthsAndWeekdaysAreNamed: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: YEAR },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(monthNames(canvasElement)).toEqual([
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ])
    );
    await expect(weekdayNames(canvasElement)).toEqual(['Mon', '', 'Wed', '', 'Fri', '', '']);
    // Columns are weeks: Monday 5 January heads the second, over the labels' row.
    await expect(cellOn(canvasElement, 'Monday, January 5, 2026')).toHaveAttribute(
      'data-position',
      '0:1'
    );
    await expect(cellOn(canvasElement, 'Thursday, January 1, 2026')).toHaveAttribute(
      'data-position',
      '3:0'
    );
    // The label sits over the first full week of its month.
    const jan = [...canvasElement.querySelectorAll('[data-heat-column]')].find(
      (el) => el.textContent === 'Jan'
    ) as HTMLElement;
    const top = cellOn(canvasElement, 'Monday, January 5, 2026');
    await expect(jan.getBoundingClientRect().left).toBeCloseTo(top.getBoundingClientRect().left, 0);
    await expect(jan.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      top.getBoundingClientRect().top
    );
  },
};

/** With a Sunday start, Sunday is the first row and the named rows move with it. */
export const SundayStartMovesTheRows: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: YEAR, weekStart: 0 },
  play: async ({ canvasElement }) => {
    await expect(weekdayNames(canvasElement)).toEqual(['', 'Mon', '', 'Wed', '', 'Fri', '']);
    await expect(cellOn(canvasElement, 'Sunday, January 4, 2026')).toHaveAttribute(
      'data-position',
      '0:1'
    );
    await expect(cellOn(canvasElement, 'Thursday, January 1, 2026')).toHaveAttribute(
      'data-position',
      '4:0'
    );
  },
};

/** Only the days of `from` to `to` have a cell. */
export const OnlyTheRangeHasCells: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...PartOfAYear.args },
  play: async ({ canvasElement }) => {
    await expect(cellsOf(canvasElement)).toHaveLength(164);
    await expect(cellOn(canvasElement, 'Tuesday, March 10, 2026')).toBeTruthy();
    await expect(canvasElement.querySelector('[aria-label^="Monday, March 9, 2026"]')).toBeNull();
    await expect(canvasElement.querySelector('[aria-label^="Friday, August 21, 2026"]')).toBeNull();
  },
};

/** The range layout has larger cells than a year, and a year block's cells are 12px. */
export const ShortRangesGetLargerCells: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Last20Weeks.args },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <div data-testid="short">
        <CalendarChart {...args} />
      </div>
      <div data-testid="long">
        <CalendarChart {...args} data={YEAR} layout="calendar" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const size = (id: string) => {
      const cell = canvasElement.querySelector(`[data-testid="${id}"] [role="gridcell"]`);
      const box = (cell as HTMLElement).getBoundingClientRect();
      return [box.width, box.height, getComputedStyle(cell as Element).borderTopLeftRadius];
    };
    await waitFor(() => {
      expect(size('short')).toEqual([18, 18, '4px']);
      expect(size('long')).toEqual([12, 12, '3px']);
    });
  },
};

/**
 * Five steps: the neutral track for a day with nothing, then four of the
 * accent. The "Less … More" scale under the grid shows them, at the right.
 */
export const ScaleUnderTheGrid: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: YEAR },
  play: async ({ canvasElement }) => {
    const legend = canvasElement.querySelector('[data-calendar-legend]') as HTMLElement;
    await waitFor(() => expect(legend.textContent).toBe('LessMore'));
    await expect(steps(canvasElement)).toHaveLength(5);
    await expect(legend.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      gridOf(canvasElement).getBoundingClientRect().bottom
    );
    // Aligned with the grid's right edge: "More" ends where the grid does.
    const more = legend.lastElementChild as HTMLElement;
    await expect(
      Math.abs(
        more.getBoundingClientRect().right - gridOf(canvasElement).getBoundingClientRect().right
      )
    ).toBeLessThanOrEqual(1);
    // The scale is the cells' palette: the days with nothing take its first step,
    // the busiest ones its last.
    const fills = new Set(cellsOf(canvasElement).map(fillOf));
    await expect(fills.has(fillOf(steps(canvasElement)[0]))).toBe(true);
    await expect(fills.has(fillOf(steps(canvasElement)[4]))).toBe(true);
    await expect(fills.size).toBe(5);
  },
};

/**
 * Each of the five steps differs from the next in every theme and accent, and
 * the empty one differs from the card: a day without activity stays a cell of
 * its own, the dark steps stay apart.
 */
export const StepsAreToldApart: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: YEAR },
  play: async ({ canvasElement }) => {
    for (const theme of ['', 'sand', 'dark', 'deep-blue']) {
      const restore = switchTheme(theme);
      try {
        for (const accent of ACCENT_IDS) {
          document.documentElement.setAttribute('data-accent', accent);
          await waitFor(() => {
            const fills = steps(canvasElement).map(fillOf);
            const where = `${theme || 'light'} ${accent}`;
            expect(new Set(fills).size, where).toBe(5);
            for (let i = 0; i < 4; i++) {
              expect(
                contrastRatio(fills[i], fills[i + 1]),
                `${where} step ${i}`
              ).toBeGreaterThanOrEqual(1.19);
            }
            expect(
              contrastRatio(fills[0], panel()),
              `${where} empty on the card`
            ).toBeGreaterThanOrEqual(1.1);
          });
        }
      } finally {
        document.documentElement.removeAttribute('data-accent');
        restore();
      }
    }
  },
};

/** A theme or accent switch repaints the cells with no redraw. */
export const RepaintsWithTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: YEAR },
  play: async ({ canvasElement }) => {
    const top = () => steps(canvasElement)[4];
    const empty = () => steps(canvasElement)[0];
    const html = document.documentElement;
    // The top step is a lighter accent in the dark themes.
    const dark = () => ['dark', 'deep-blue'].some((theme) => html.classList.contains(theme));
    const topToken = () => (dark() ? '--color-brand-400' : '--color-brand-500');
    await waitFor(() => expect(fillOf(top())).toBe(flat(themeColor(topToken()), '#000')));
    const before = fillOf(empty());
    const restore = switchTheme(document.documentElement.classList.contains('dark') ? '' : 'dark');
    try {
      await waitFor(() => expect(fillOf(empty())).not.toBe(before));
    } finally {
      restore();
    }
    html.setAttribute('data-accent', 'teal');
    try {
      await waitFor(() => expect(fillOf(top())).toBe(flat(dark() ? '#02b3a5' : '#038378', '#000')));
    } finally {
      html.removeAttribute('data-accent');
    }
  },
};

/** The month and weekday names, the scale and the tooltip follow the text size setting. */
export const TextFollowsTheTextSize: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: YEAR },
  play: async ({ canvasElement }) => {
    const html = document.documentElement;
    const sizes = () => ({
      month: px(
        [...canvasElement.querySelectorAll('[data-heat-column]')].find((el) => el.textContent)!
      ),
      weekday: px(
        [...canvasElement.querySelectorAll('[data-heat-row]')].find((el) => el.textContent)!
      ),
      legend: px(canvasElement.querySelector('[data-calendar-legend] span')),
    });
    await waitFor(() => expect(sizes()).toEqual({ month: 12, weekday: 12, legend: 12 }));
    const previous = html.getAttribute('data-text-size');
    try {
      html.setAttribute('data-text-size', 'lg');
      await waitFor(() => expect(sizes()).toEqual({ month: 13.5, weekday: 13.5, legend: 13.5 }));
      const cell = cellsOf(canvasElement)[10];
      await userEvent.hover(cell);
      await waitFor(() =>
        expect(px(tooltipOf(canvasElement)?.firstElementChild ?? null)).toBe(13.5)
      );
      await userEvent.unhover(cell);
      // At the largest size no month name runs over the next one.
      html.setAttribute('data-text-size', 'xl');
      await waitFor(() => {
        const labels = [...canvasElement.querySelectorAll('[data-heat-column]')].filter(
          (el) => el.textContent
        );
        const boxes = labels.map((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return range.getBoundingClientRect();
        });
        expect(boxes).toHaveLength(12);
        for (let i = 0; i < boxes.length - 1; i++) {
          expect(boxes[i].right, `label ${i}`).toBeLessThanOrEqual(boxes[i + 1].left);
        }
      });
    } finally {
      if (previous === null) html.removeAttribute('data-text-size');
      else html.setAttribute('data-text-size', previous);
    }
  },
};

/**
 * At 375px the grid scrolls inside its box, with the weekday names kept in
 * view, and the page never overflows. All twelve months are still named.
 */
export const NoHorizontalOverflow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: YEAR, width: 900 },
  render: (args) => (
    <div data-testid="box" style={{ width: 375, maxWidth: '100%' }}>
      <CalendarChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>('[data-testid="box"]') as HTMLElement;
    await waitFor(() => expect(gridOf(canvasElement)).toBeTruthy());
    const scroller = canvasElement.querySelector<HTMLElement>('[data-heat-scroll]') as HTMLElement;
    await waitFor(() => {
      expect(box.scrollWidth, 'the box scrolls sideways').toBeLessThanOrEqual(box.clientWidth);
      expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
      expect(scroller.clientWidth).toBeLessThanOrEqual(375);
    });
    await expect(monthNames(canvasElement)).toHaveLength(12);
    const root = document.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    // Scrolled to the end, a weekday name stays at the left of the box.
    scroller.scrollLeft = scroller.scrollWidth;
    const mon = canvasElement.querySelector('[data-heat-row]') as HTMLElement;
    await waitFor(() =>
      expect(mon.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        scroller.getBoundingClientRect().left - 1
      )
    );
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/** A range of several years scrolls inside its box too, and one block per year does not widen the page. */
export const SeveralYearsDoNotWidenThePage: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...SeveralYears.args },
  render: (args) => (
    <div data-testid="box" style={{ width: 375, maxWidth: '100%' }}>
      <CalendarChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>('[data-testid="box"]') as HTMLElement;
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('[data-calendar-block]')).toHaveLength(3)
    );
    await expect(
      [...canvasElement.querySelectorAll('[data-calendar-block] p')].map((el) => el.textContent)
    ).toEqual(['2024', '2025', '2026']);
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    const root = document.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/**
 * Each block is named by `ariaLabel` and each day by its date and value.
 * Keyboard: one tab stop; the arrows move between days (left and right by a
 * week, up and down by a day) and show the tooltip; Home and End go to the
 * ends of the weekday's row; Tab leaves.
 */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: YEAR, formatValue: unit, ariaLabel: 'Deploys per day in 2026' },
  play: async ({ canvasElement, args }) => {
    await waitFor(() =>
      expect(gridOf(canvasElement)).toHaveAttribute('aria-label', args.ariaLabel)
    );
    const stops = () => cellsOf(canvasElement).filter((cell) => cell.tabIndex === 0);
    await expect(stops()).toHaveLength(1);
    await expect(cellOn(canvasElement, 'Monday, January 5, 2026')).toHaveAccessibleName(
      /^Monday, January 5, 2026: \d+ deploys?$/
    );
    await userEvent.tab();
    await expect(cellOn(canvasElement, 'Monday, January 5, 2026')).toHaveFocus();
    await waitFor(() =>
      expect(tooltipOf(canvasElement)?.textContent).toContain('Monday, January 5, 2026')
    );
    const press = async (keys: string, date: string) => {
      await userEvent.keyboard(keys);
      await expect(cellOn(canvasElement, date), keys).toHaveFocus();
      await expect(stops()).toEqual([cellOn(canvasElement, date)]);
      await waitFor(() => expect(tooltipOf(canvasElement)?.textContent).toContain(date));
    };
    await press('{ArrowRight}', 'Monday, January 12, 2026');
    await press('{ArrowDown}', 'Tuesday, January 13, 2026');
    await press('{ArrowLeft}', 'Tuesday, January 6, 2026');
    await press('{ArrowUp}', 'Monday, January 5, 2026');
    await press('{End}', 'Monday, December 28, 2026');
    await press('{Home}', 'Monday, January 5, 2026');
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
  },
};

/** A range that starts mid-week leaves the slots before it empty: the arrows stop at them. */
export const KeyboardSkipsDaysOutsideTheRange: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: YEAR, from: '2026-03-04', to: '2026-03-20', layout: 'range' },
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    // The first cell is Monday 9 March: the Monday before it is outside the range.
    await expect(cellOn(canvasElement, 'Monday, March 9, 2026')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(cellOn(canvasElement, 'Monday, March 9, 2026')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowLeft}');
    // Wednesday 4 March is the first day of the range.
    await expect(cellOn(canvasElement, 'Wednesday, March 4, 2026')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(cellOn(canvasElement, 'Wednesday, March 4, 2026')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(cellOn(canvasElement, 'Thursday, March 5, 2026')).toHaveFocus();
    await userEvent.tab();
  },
};

/** On a short range the scale sits under the grid's right edge, not the card's. */
export const ScaleFollowsAShortGrid: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Last20Weeks.args },
  render: (args) => (
    <div style={{ width: 1000 }}>
      <CalendarChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const more = canvasElement.querySelector('[data-calendar-legend]')?.lastElementChild;
      const grid = gridOf(canvasElement).getBoundingClientRect();
      expect(grid.width).toBeLessThan(500);
      expect(
        Math.abs((more as Element).getBoundingClientRect().right - grid.right)
      ).toBeLessThanOrEqual(1);
    });
  },
};

/** At 375px the scale stays at the right of the visible box while the grid scrolls. */
export const ScaleStaysInViewWhenTheGridScrolls: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: YEAR },
  render: (args) => (
    <div data-testid="box" style={{ width: 375, maxWidth: '100%' }}>
      <CalendarChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-testid="box"]') as HTMLElement;
    const scroller = () => canvasElement.querySelector('[data-heat-scroll]') as HTMLElement;
    await waitFor(() => expect(scroller().scrollWidth).toBeGreaterThan(scroller().clientWidth));
    const more = canvasElement.querySelector('[data-calendar-legend]')
      ?.lastElementChild as HTMLElement;
    await expect(more.getBoundingClientRect().right).toBeLessThanOrEqual(
      box.getBoundingClientRect().right
    );
    await expect(more.getBoundingClientRect().right).toBeGreaterThan(300);
  },
};

/**
 * The top step is the accent in the light themes and a lighter one in the dark
 * themes, as in the mockups, while the steps under it come down.
 */
export const TopStepIsLighterInDark: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: YEAR },
  play: async ({ canvasElement }) => {
    const top = () => fillOf(steps(canvasElement)[4]);
    for (const theme of ['', 'sand']) {
      const restore = switchTheme(theme);
      try {
        await waitFor(() => expect(top()).toBe(flat(themeColor('--color-brand-500'), '#000')));
      } finally {
        restore();
      }
    }
    for (const theme of ['dark', 'deep-blue']) {
      const restore = switchTheme(theme);
      try {
        await waitFor(() => {
          expect(top()).toBe(flat(themeColor('--color-brand-400'), '#000'));
          expect(top()).not.toBe(flat(themeColor('--color-brand-500'), '#000'));
          const [, , , third] = steps(canvasElement).map(fillOf);
          // The step under the top one is the accent itself.
          expect(third).toBe(flat(themeColor('--color-brand-500'), '#000'));
        });
      } finally {
        restore();
      }
    }
  },
};

// In a box narrower than the year the grid scrolls sideways, and its end fades while there are
// weeks past it: the half week at the edge reads as more to come, not as a cut grid.
export const NarrowBoxFadesTheEnd: Story = {
  tags: ['!dev', '!autodocs'],
  args: DeploysPerDay.args,
  render: (args) => (
    <div style={{ width: 300 }}>
      <CalendarChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const scroller = canvasElement.querySelector<HTMLElement>('[data-heat-scroll]')!;
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    await waitFor(() => expect(getComputedStyle(scroller).maskImage).not.toBe('none'));
    scroller.scrollLeft = scroller.scrollWidth;
    scroller.dispatchEvent(new Event('scroll'));
    await waitFor(() => expect(getComputedStyle(scroller).maskImage).toBe('none'));
  },
};
