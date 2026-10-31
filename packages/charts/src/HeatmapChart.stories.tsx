import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HeatmapChart } from './HeatmapChart';
import {
  contrastRatio,
  expectEmptyMessage,
  expectNoInjectedImage,
  HOSTILE,
  LegendSides,
  resolveColor,
  switchTheme,
  themeColor,
} from './storybook-recharts';

const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}h`);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const RACKS = ['rack-a01', 'rack-a02', 'rack-a03', 'rack-a04', 'rack-b01', 'rack-b02', 'rack-b03'];

// Inlet temperature: a daytime bump on top of each rack's baseline, with a
// little deterministic jitter.
const rackTemperatures = (slots: number, hoursPerSlot: number) =>
  RACKS.map((name, r) => ({
    name,
    data: Array.from({ length: slots }, (_, s) => {
      const hour = s * hoursPerSlot;
      const daytime = Math.max(0, Math.sin(((hour - 7) / 24) * 2 * Math.PI));
      return Math.round(21 + r * 1.1 + daytime * (5 + r) + ((r * 7 + s * 3) % 5) * 0.4);
    }),
  }));

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Heatmap',
  component: HeatmapChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof HeatmapChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * One row per series, one column per category. The default scale is five
 * brand steps of the current theme and accent, over buckets with round bounds.
 */
export const RackTemperature: Story = {
  args: {
    categories: HOURS,
    series: rackTemperatures(24, 1),
    formatValue: (v) => `${v} °C`,
  },
};

/** `showValues` prints each value in its cell, in a color readable on it. */
export const CpuPerNode: Story = {
  args: {
    categories: DAYS,
    showValues: true,
    formatValue: (v) => `${v}%`,
    series: [
      { name: 'node-01', data: [62, 71, 68, 74, 81, 34, 28] },
      { name: 'node-02', data: [58, 64, 66, 70, 77, 31, 25] },
      { name: 'node-03', data: [88, 92, 90, 95, 97, 61, 52] },
      { name: 'node-04', data: [41, 45, 39, 48, 52, 22, 18] },
      { name: 'node-05', data: [12, 15, 14, 11, 16, 9, 8] },
      { name: 'node-06', data: [70, 76, 73, 79, 85, 44, 37] },
    ],
  },
};

/** Zero cells take the lowest step: a muted cell that stays visible in dark themes. */
export const IncidentsPerDatacenter: Story = {
  args: {
    categories: DAYS,
    showValues: true,
    height: 240,
    series: [
      { name: 'DC1 Paris', data: [0, 2, 1, 0, 4, 0, 0] },
      { name: 'DC2 Frankfurt', data: [1, 0, 0, 3, 1, 0, 1] },
      { name: 'DC3 London', data: [0, 0, 6, 2, 0, 1, 0] },
      { name: 'DC4 Tokyo', data: [3, 1, 0, 0, 9, 2, 0] },
    ],
  },
};

/** `ranges` sets explicit thresholds, such as alerting levels, with their own colors. */
export const Thresholds: Story = {
  args: {
    categories: HOURS.filter((_, h) => h % 2 === 0),
    series: rackTemperatures(12, 2),
    showValues: true,
    formatValue: (v) => `${v} °C`,
    ranges: [
      { from: 0, to: 27, color: '#10b981', name: 'OK' },
      { from: 27, to: 32, color: '#f59e0b', name: 'WARN ≥ 27 °C' },
      { from: 32, to: 60, color: '#ef4444', name: 'CRIT ≥ 32 °C' },
    ],
  },
};

/** `colors` replaces the brand scale and keeps the automatic buckets. */
export const CustomColors: Story = {
  args: {
    categories: DAYS,
    formatValue: (v) => `${v} ms`,
    colors: ['#3b528b', '#21918c', '#5ec962', '#fde725'],
    series: [
      { name: 'ceph-osd-01', data: [4, 5, 4, 6, 7, 3, 2] },
      { name: 'ceph-osd-02', data: [5, 6, 5, 8, 9, 3, 3] },
      { name: 'ceph-osd-03', data: [12, 14, 11, 18, 21, 6, 5] },
      { name: 'ceph-osd-04', data: [3, 4, 3, 5, 6, 2, 2] },
      { name: 'ceph-osd-05', data: [7, 9, 8, 10, 13, 4, 4] },
    ],
  },
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { series: [], categories: [] },
  play: expectEmptyMessage('No data'),
};

/** `xTitle` and `yTitle` name the columns and the rows. */
export const AxisTitles: Story = {
  args: { ...RackTemperature.args, xTitle: 'Hour of day', yTitle: 'Rack' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[role="grid"]')).not.toBeNull();
    await expect(canvasElement).toHaveTextContent('Hour of day');
    await expect(canvasElement).toHaveTextContent('Rack');
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

const gridOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[role="grid"]') as HTMLElement;
const cellsOf = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[role="gridcell"]')];
const cellAt = (root: HTMLElement, row: number, column: number) =>
  root.querySelector<HTMLElement>(`[data-position="${row}:${column}"]`) as HTMLElement;
const tooltipOf = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-heat-tooltip]');
const legendNames = (root: HTMLElement) =>
  [...root.querySelectorAll('[data-heat-legend] li')].map((el) => el.textContent);

// A CSS color in any syntax (color-mix, relative colors, oklch grays) as `#rrggbb`.
const toHex = (color: string) => {
  const context = document.createElement('canvas').getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};
const fillOf = (cell: Element) => toHex(getComputedStyle(cell).backgroundColor);
const px = (el: Element | null) => parseFloat(el ? getComputedStyle(el).fontSize : '');

/**
 * The legend lists the ranges, not the rows; the tooltip and the cell names
 * are React text: row names, categories and range names show as written.
 */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!autodocs'],
  args: {
    xTitle: HOSTILE,
    yTitle: HOSTILE,
    series: [
      { name: HOSTILE, data: [3, 5, 2] },
      { name: 'Normal', data: [4, 1, 6] },
    ],
    categories: [HOSTILE, 'B', 'C'],
    ranges: [
      { from: 0, to: 3, color: '#10b981', name: HOSTILE },
      { from: 3, to: 10, color: '#ef4444' },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(legendNames(canvasElement)).toEqual([HOSTILE, '3 – 10']));
    await expectNoInjectedImage(canvasElement);
    // The titles and the labels are text too.
    await expect(gridOf(canvasElement).textContent).toContain(HOSTILE);
    await expectNoInjectedImage(canvasElement);

    // The tooltip shows on hover of a cell: its column is the title, its row the label.
    const cell = cellAt(canvasElement, 0, 0);
    await expect(cell).toHaveAttribute('aria-label', `${HOSTILE}, ${HOSTILE}: 3`);
    await userEvent.hover(cell);
    await waitFor(() => {
      const card = tooltipOf(canvasElement);
      expect(card?.querySelector('p')?.textContent).toBe(HOSTILE);
      expect(card?.querySelector('li')?.textContent).toContain(HOSTILE);
    });
    await expectNoInjectedImage(canvasElement);
    await userEvent.unhover(cell);
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
  },
};

/** The cell under the pointer shows a tooltip with its row, column and formatted value. */
export const TooltipFollowsThePointer: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...RackTemperature.args },
  play: async ({ canvasElement }) => {
    await expect(tooltipOf(canvasElement)).toBeNull();
    const cell = cellAt(canvasElement, 1, 3);
    await userEvent.hover(cell);
    await waitFor(() => {
      const card = tooltipOf(canvasElement) as HTMLElement;
      expect(card).not.toBeNull();
      expect(card.textContent).toContain('03h');
      expect(card.textContent).toContain('rack-a02');
      expect(card.textContent).toContain('°C');
    });
    await userEvent.unhover(cell);
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
  },
};

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

/**
 * In the dark themes the lowest step of the default scale stays a cell of its
 * own, whatever the accent: its fill is at least 1.5:1 against the card the
 * chart sits on, and against the panel color it is mixed over. The accent
 * changes the fill without a redraw, so the check waits for the repaint.
 */
export const LowestStepStaysVisibleInDark: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['a', 'b', 'c'],
    series: [
      { name: 'x', data: [0, 5, 10] },
      { name: 'y', data: [2, 6, 9] },
    ],
  },
  play: async ({ canvasElement }) => {
    for (const theme of ['dark', 'deep-blue']) {
      const restore = switchTheme(theme);
      try {
        for (const accent of ACCENT_IDS) {
          document.documentElement.setAttribute('data-accent', accent);
          await waitFor(() => {
            const fill = fillOf(cellAt(canvasElement, 0, 0));
            for (const surface of ['--color-gray-900', '--color-bg-panel']) {
              const ratio = contrastRatio(fill, toHex(themeColor(surface)));
              expect(ratio, `${theme} ${accent} on ${surface}`).toBeGreaterThanOrEqual(1.5);
            }
          });
        }
      } finally {
        document.documentElement.removeAttribute('data-accent');
        restore();
      }
    }
  },
};

/** Two neighboring steps of the default scale differ in every theme and accent, so the legend can be read. */
export const StepsAreToldApart: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['a', 'b', 'c', 'd', 'e'],
    series: [{ name: 'x', data: [0, 25, 50, 75, 100] }],
    // Round bounds put each value in its own step.
    ranges: undefined,
  },
  play: async ({ canvasElement }) => {
    for (const theme of ['', 'sand', 'dark', 'deep-blue']) {
      const restore = switchTheme(theme);
      try {
        for (const accent of ACCENT_IDS) {
          document.documentElement.setAttribute('data-accent', accent);
          await waitFor(() => {
            const fills = [0, 1, 2, 3, 4].map((c) => fillOf(cellAt(canvasElement, 0, c)));
            expect(new Set(fills).size, `${theme || 'light'} ${accent}`).toBe(5);
            for (let i = 0; i < 4; i++) {
              expect(
                contrastRatio(fills[i], fills[i + 1]),
                `${theme || 'light'} ${accent} step ${i + 1}`
              ).toBeGreaterThanOrEqual(1.18);
            }
          });
        }
      } finally {
        document.documentElement.removeAttribute('data-accent');
        restore();
      }
    }
  },
};

/**
 * A theme or accent switch repaints the cells with no redraw: the top step is
 * the accent, and the colors follow `<html>` as it changes.
 */
export const RepaintsWithTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['a', 'b', 'c'],
    series: [{ name: 'x', data: [0, 5, 10] }],
  },
  play: async ({ canvasElement }) => {
    const top = () => cellAt(canvasElement, 0, 2);
    const low = () => cellAt(canvasElement, 0, 0);
    await waitFor(() => expect(resolveColor(fillOf(top()))).toBe(themeColor('--color-brand-500')));
    const before = fillOf(low());
    // Another theme than the one the story runs in: the contrast pass renders it in each.
    const restore = switchTheme(document.documentElement.classList.contains('dark') ? '' : 'dark');
    try {
      await waitFor(() => expect(fillOf(low())).not.toBe(before));
    } finally {
      restore();
    }
    const html = document.documentElement;
    html.setAttribute('data-accent', 'teal');
    try {
      await waitFor(() => expect(fillOf(top())).toBe(resolveColor('#038378')));
    } finally {
      html.removeAttribute('data-accent');
    }
  },
};

// The value printed in a cell reads on it, white or black, on the scale and on custom ranges, in
// every accent of one theme. One story per theme: all 16 pairs in one test took half its timeout.
const valuesReadOnCellsIn = (theme: '' | 'sand' | 'dark' | 'deep-blue'): Story => ({
  args: { ...CpuPerNode.args, ranges: Thresholds.args?.ranges },
  render: (args) => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="scale">
        <HeatmapChart {...args} ranges={undefined} />
      </div>
      <div data-testid="ranges">
        <HeatmapChart {...args} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const restore = switchTheme(theme);
    try {
      for (const accent of ['blue', 'teal', 'amber', 'graphite']) {
        document.documentElement.setAttribute('data-accent', accent);
        await waitFor(() => {
          const printed = cellsOf(canvasElement).filter((cell) => cell.textContent);
          expect(printed.length).toBeGreaterThan(60);
          for (const cell of printed) {
            const ratio = contrastRatio(toHex(getComputedStyle(cell).color), fillOf(cell));
            expect(
              ratio,
              `${theme || 'light'} ${accent} ${cell.textContent}`
            ).toBeGreaterThanOrEqual(4.5);
          }
        });
      }
    } finally {
      document.documentElement.removeAttribute('data-accent');
      restore();
    }
  },
});

/** The value printed in a cell reads on it in the light theme, in every accent. */
export const ValuesReadOnCellsLight: Story = {
  ...valuesReadOnCellsIn(''),
  tags: ['!dev', '!autodocs'],
};

/** The value printed in a cell reads on it in the sand theme, in every accent. */
export const ValuesReadOnCellsSand: Story = {
  ...valuesReadOnCellsIn('sand'),
  tags: ['!dev', '!autodocs'],
};

/** The value printed in a cell reads on it in the dark theme, in every accent. */
export const ValuesReadOnCellsDark: Story = {
  ...valuesReadOnCellsIn('dark'),
  tags: ['!dev', '!autodocs'],
};

/** The value printed in a cell reads on it in the deep-blue theme, in every accent. */
export const ValuesReadOnCellsDeepBlue: Story = {
  ...valuesReadOnCellsIn('deep-blue'),
  tags: ['!dev', '!autodocs'],
};

/**
 * The labels, the legend and the tooltip follow the text size setting, and the
 * row labels make room for it: at the largest size none is cut.
 */
export const TextFollowsTheTextSize: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: DAYS,
    series: rackTemperatures(7, 24),
    xTitle: 'Day',
    yTitle: 'Rack',
    showValues: true,
  },
  play: async ({ canvasElement }) => {
    const html = document.documentElement;
    const sizes = () => ({
      row: px(canvasElement.querySelector('[data-heat-row]')),
      column: px(canvasElement.querySelector('[data-heat-column]')),
      legend: px(canvasElement.querySelector('[data-heat-legend] li')),
      cell: px(cellAt(canvasElement, 0, 0)),
    });
    const clipped = () =>
      [
        ...canvasElement.querySelectorAll<HTMLElement>('[data-heat-row], [data-heat-column]'),
      ].filter((el) => el.scrollWidth > el.clientWidth);
    await waitFor(() => expect(sizes()).toEqual({ row: 12, column: 12, legend: 12, cell: 11 }));
    const previous = html.getAttribute('data-text-size');
    try {
      html.setAttribute('data-text-size', 'lg');
      await waitFor(() =>
        expect(sizes()).toEqual({ row: 13.5, column: 13.5, legend: 13.5, cell: 12.375 })
      );
      await userEvent.hover(cellAt(canvasElement, 0, 0));
      await waitFor(() =>
        expect(px(tooltipOf(canvasElement)?.firstElementChild ?? null)).toBe(13.5)
      );
      await userEvent.unhover(cellAt(canvasElement, 0, 0));
      html.setAttribute('data-text-size', 'xl');
      await waitFor(() => expect(sizes().row).toBeGreaterThan(13.5));
      await waitFor(() => expect(clipped().map((el) => el.textContent)).toEqual([]));
    } finally {
      if (previous === null) html.removeAttribute('data-text-size');
      else html.setAttribute('data-text-size', previous);
    }
  },
};

/** `legendPosition` puts the legend on each side of the grid. */
export const LegendOnEachSide: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['A', 'B', 'C'],
    series: [
      { name: 'a', data: [3, 5, 4] },
      { name: 'b', data: [4, 2, 5] },
    ],
  },
  render: (args) => (
    <LegendSides>
      {(legendPosition) => <HeatmapChart {...args} legendPosition={legendPosition} />}
    </LegendSides>
  ),
  play: async ({ canvasElement }) => {
    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      const chart = canvasElement.querySelector(`[data-side="${side}"]`) as HTMLElement;
      await waitFor(() => {
        const legend = chart.querySelector('[data-heat-legend]')?.getBoundingClientRect();
        const plot = gridOf(chart)?.getBoundingClientRect();
        expect(legend && plot, side).toBeTruthy();
        if (!legend || !plot) return;
        const outside = {
          top: legend.bottom <= plot.top + 1,
          bottom: legend.top >= plot.bottom - 1,
          left: legend.right <= plot.left + 1,
          right: legend.left >= plot.right - 1,
        };
        expect(outside[side], side).toBe(true);
      });
    }
  },
};

/** `showLegend={false}` leaves only the grid. */
export const LegendCanBeHidden: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...RackTemperature.args, showLegend: false },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(gridOf(canvasElement)).toBeTruthy());
    await expect(canvasElement.querySelector('[data-heat-legend]')).toBeNull();
  },
};

/** Too many columns for the width: every n-th label is drawn, and none touches the next. */
export const ColumnLabelsDoNotOverlap: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...RackTemperature.args },
  render: (args) => (
    <div data-testid="box" style={{ width: 375, maxWidth: '100%' }}>
      <HeatmapChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const labels = [...canvasElement.querySelectorAll('[data-heat-column]')].filter(
        (el) => el.textContent
      );
      expect(labels.length).toBeGreaterThan(2);
      expect(labels.length).toBeLessThan(24);
      const boxes = labels.map(
        (el) =>
          el.firstChild &&
          (() => {
            const range = document.createRange();
            range.selectNodeContents(el);
            return range.getBoundingClientRect();
          })()
      );
      for (let i = 0; i < boxes.length - 1; i++) {
        expect((boxes[i] as DOMRect).right, `label ${i}`).toBeLessThanOrEqual(
          (boxes[i + 1] as DOMRect).left
        );
      }
    });
  },
};

/** A chart wider than its box is cut to it, so a narrow screen never scrolls sideways. */
export const NoHorizontalOverflow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...RackTemperature.args, width: 900 },
  render: (args) => (
    <div data-testid="box" style={{ width: 375, maxWidth: '100%' }}>
      <HeatmapChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>('[data-testid="box"]') as HTMLElement;
    await waitFor(() => expect(gridOf(canvasElement)).toBeTruthy());
    await waitFor(() => {
      expect(box.scrollWidth, 'the box scrolls sideways').toBeLessThanOrEqual(box.clientWidth);
      expect(gridOf(canvasElement).getBoundingClientRect().width).toBeLessThanOrEqual(375);
    });
    const root = document.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/**
 * The grid is named by `ariaLabel` and each cell by its row, column and
 * value. Keyboard: one tab stop; the arrows move between cells (the tooltip
 * follows), Home and End go to the ends of the row, Ctrl+Home and Ctrl+End to
 * the ends of the grid; Tab leaves.
 */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...RackTemperature.args, ariaLabel: 'Rack temperature per hour' },
  play: async ({ canvasElement, args }) => {
    await waitFor(() =>
      expect(gridOf(canvasElement)).toHaveAttribute('aria-label', args.ariaLabel)
    );
    const last = (args.categories?.length ?? 0) - 1;
    const stops = () => cellsOf(canvasElement).filter((cell) => cell.tabIndex === 0);
    await expect(stops()).toHaveLength(1);
    await expect(cellAt(canvasElement, 0, 0)).toHaveAccessibleName(/^rack-a01, 00h: \d+ °C$/);

    await userEvent.tab();
    await expect(cellAt(canvasElement, 0, 0)).toHaveFocus();
    await waitFor(() => expect(tooltipOf(canvasElement)?.textContent).toContain('rack-a01'));
    const press = async (keys: string, row: number, column: number) => {
      await userEvent.keyboard(keys);
      await expect(cellAt(canvasElement, row, column), keys).toHaveFocus();
      await expect(stops()).toEqual([cellAt(canvasElement, row, column)]);
      await waitFor(() =>
        expect(tooltipOf(canvasElement)?.textContent).toContain(args.series?.[row].name as string)
      );
    };
    await press('{ArrowRight}', 0, 1);
    await press('{ArrowDown}', 1, 1);
    await press('{ArrowLeft}', 1, 0);
    // The edge stops the arrows.
    await press('{ArrowLeft}', 1, 0);
    await press('{ArrowUp}', 0, 0);
    await press('{ArrowUp}', 0, 0);
    await press('{End}', 0, last);
    await press('{Home}', 0, 0);
    await press('{Control>}{End}{/Control}', 6, last);
    await press('{Control>}{Home}{/Control}', 0, 0);

    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
    // Back in, the grid resumes where it was left.
    await userEvent.tab({ shift: true });
    await expect(cellAt(canvasElement, 0, 0)).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
  },
};

/** Empty slots have no cell: the arrows jump over them, and Tab still lands on a cell. */
export const KeyboardSkipsMissingCells: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['a', 'b', 'c'],
    series: [
      { name: 'x', data: [Number.NaN, 4, 5] },
      { name: 'y', data: [1, Number.NaN, 3] },
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(cellsOf(canvasElement)).toHaveLength(4);
    await userEvent.tab();
    // The first cell is the first one that exists.
    await expect(cellAt(canvasElement, 0, 1)).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    // Straight below is empty, and nothing lies further down: the focus stays.
    await expect(cellAt(canvasElement, 0, 1)).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(cellAt(canvasElement, 0, 1)).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}{ArrowDown}');
    await expect(cellAt(canvasElement, 1, 2)).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(cellAt(canvasElement, 1, 0)).toHaveFocus();
    await userEvent.tab();
  },
};

// Values that don't fit their cells are not drawn cut: the cells keep their colour, and the value
// stays in the tooltip and in the cell's name. With room, they show.
export const ValuesShowOnlyWhenTheyFit: Story = {
  tags: ['!dev', '!autodocs'],
  args: Thresholds.args,
  render: (args) => (
    <div className="flex flex-col gap-6">
      <div data-testid="narrow" style={{ width: 300 }}>
        <HeatmapChart {...args} />
      </div>
      <div data-testid="wide" style={{ width: 1000 }}>
        <HeatmapChart {...args} />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const cells = (id: string) => [
      ...canvas.getByTestId(id).querySelectorAll<HTMLElement>('[data-heat-cell]'),
    ];
    await waitFor(() => {
      for (const cell of cells('narrow'))
        expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth);
    });
    await expect(cells('wide').some((cell) => cell.textContent?.includes('°C'))).toBe(true);
    for (const cell of cells('wide'))
      await expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth);
  },
};
