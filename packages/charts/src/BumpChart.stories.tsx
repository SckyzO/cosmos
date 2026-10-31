import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { ReferenceLine } from 'recharts';
import { expect, userEvent, waitFor } from 'storybook/test';
import { BumpChart, type BumpChartProps } from './BumpChart';
import { SERIES_FALLBACKS } from './core/colors';
import {
  HOSTILE,
  closeTooltip,
  expectAccessibleChart,
  expectEmptyMessage,
  expectNoInjectedImage,
  expectRepaintsWithTheme,
  openTooltip,
  resolveColor,
  seriesStrokes,
  surface,
  themeColor,
  tickTexts,
  tooltipCard,
} from './storybook-recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

const ranked = (name: string, ranks: (number | undefined)[]) => ({
  name,
  data: ranks.flatMap((rank, i) => (rank === undefined ? [] : [{ x: MONTHS[i], rank }])),
});

/** Five products over eight months: the order of the ranking changes in every period. */
const PRODUCTS = [
  ranked('Aurora', [1, 1, 2, 3, 2, 1, 1, 1]),
  ranked('Basalt', [2, 3, 1, 1, 1, 2, 3, 2]),
  ranked('Cobalt', [3, 2, 3, 2, 4, 4, 2, 3]),
  ranked('Dune', [4, 5, 5, 4, 3, 3, 4, 5]),
  ranked('Ember', [5, 4, 4, 5, 5, 5, 5, 4]),
];

/** The same, with a sixth product that enters in May, and Ember that leaves after June. */
const WITH_ENTRIES = [
  ranked('Aurora', [1, 1, 2, 3, 3, 1, 1, 1]),
  ranked('Basalt', [2, 3, 1, 1, 1, 2, 3, 3]),
  ranked('Cobalt', [3, 2, 3, 2, 4, 4, 2, 4]),
  ranked('Dune', [4, 5, 5, 4, 2, 3, 4, 5]),
  ranked('Ember', [5, 4, 4, 5, 5, 5, undefined, undefined]),
  ranked('Fjord', [undefined, undefined, undefined, undefined, 6, 6, 5, 2]),
];

/** Ties: two products share a rank in March, three in June. */
const WITH_TIES = [
  ranked('Aurora', [1, 1, 2, 3, 2, 1, 1, 1]),
  ranked('Basalt', [2, 3, 2, 1, 1, 1, 3, 2]),
  ranked('Cobalt', [3, 2, 3, 2, 4, 1, 2, 3]),
  ranked('Dune', [4, 4, 5, 4, 3, 4, 4, 4]),
  ranked('Ember', [5, 5, 4, 5, 5, 5, 5, 4]),
];

const Wrap = ({ children }: { children: ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

/** A box of fixed width, to test the wide and the narrow layout whatever the canvas is. */
const Box = ({ width, ...props }: BumpChartProps & { width: number }) => (
  <div data-testid="box" style={{ width, maxWidth: '100%' }}>
    <BumpChart {...props} width={undefined} />
  </div>
);

const meta = {
  title: 'Charts/Bump',
  component: BumpChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof BumpChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// The drawn parts of the chart.
const circles = (root: HTMLElement) => [
  ...root.querySelectorAll<SVGCircleElement>('[data-bump-point] circle'),
];
const discs = (root: HTMLElement) => circles(root).filter((c) => c.getAttribute('r') !== '4');
const smallDots = (root: HTMLElement) => circles(root).filter((c) => c.getAttribute('r') === '4');
const rankTexts = (root: HTMLElement) => [
  ...root.querySelectorAll<SVGTextElement>('[data-bump-point] text'),
];
// An end label: a color dot and a name.
const names = (root: HTMLElement) => [...root.querySelectorAll<SVGGElement>('[data-bump-name]')];
const nameTexts = (root: HTMLElement) => names(root).map((g) => g.textContent);
const lines = (root: HTMLElement) => [
  ...root.querySelectorAll<SVGPathElement>('.recharts-line-curve'),
];

const strokeWidths = (root: HTMLElement) =>
  lines(root).map((l) => parseFloat(getComputedStyle(l).strokeWidth));
const strokeOpacities = (root: HTMLElement) =>
  lines(root).map((l) => parseFloat(getComputedStyle(l).strokeOpacity));

/** Wait for the chart to be drawn and the entrance animation of every line to be over. */
const drawn = (root: HTMLElement, lineCount: number) =>
  waitFor(() => {
    expect(lines(root)).toHaveLength(lineCount);
    // Recharts adds a line's label list, which holds its names, once its own animation is over.
    expect(root.querySelectorAll('.recharts-label-list')).toHaveLength(lineCount);
  });

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * Five products ranked over eight months, 1 at the top. The name of each sits
 * at both ends of its line, with its color; there is no legend. The point of
 * each period is a disc with the rank in it.
 */
export const Basic: Story = {
  args: { series: PRODUCTS, ariaLabel: 'Revenue rank of five products, January to August' },
};

/** `points="dot"` draws a small filled dot with a ring in the card's color instead of the disc. */
export const DotPoints: Story = {
  args: { series: PRODUCTS, points: 'dot' },
};

/**
 * A product that enters late has no point before it enters, and one that
 * leaves stops: each is named where its line starts and ends.
 */
export const EntersAndLeaves: Story = {
  args: { series: WITH_ENTRIES },
};

/** Ties are allowed: products on the same rank are drawn apart around it, and both say the rank. */
export const Ties: Story = {
  args: { series: WITH_TIES },
};

/** `colors` overrides the palette, and `formatValue` writes the rank in the tooltip. */
export const CustomColorsAndRankFormat: Story = {
  args: {
    series: PRODUCTS,
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
    formatValue: (rank) => `rank ${rank}`,
  },
};

/**
 * `children` takes Recharts elements drawn after the lines: here a line under
 * the top three. A `y` is a rank, 1 at the top.
 */
export const ReferenceLineInChildren: Story = {
  args: {
    series: PRODUCTS,
    children: (
      <ReferenceLine
        y={3.5}
        stroke="var(--color-status-warn)"
        strokeDasharray="6 4"
        label={{ value: 'Top 3', position: 'insideTopRight', fill: 'var(--color-text-muted)' }}
      />
    ),
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.recharts-reference-line line')).not.toBeNull();
      expect(canvasElement.textContent).toContain('Top 3');
    });
  },
};

/**
 * On a narrow screen the plot gets the room: the names stay on the right,
 * cut short, and the ones on the left go. Full names are in the tooltip.
 */
export const Narrow: Story = {
  args: { series: PRODUCTS },
  render: (args) => <Box {...args} width={343} />,
};

/**
 * Where the discs would touch, the points are dots: the periods are too close
 * for 24px discs. The names stay.
 */
export const TooNarrowForDiscs: Story = {
  args: { series: PRODUCTS },
  render: (args) => <Box {...args} width={260} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 5);
    await waitFor(() => expect(smallDots(canvasElement)).toHaveLength(40));
    await expect(discs(canvasElement)).toHaveLength(0);
    await expect(nameTexts(canvasElement)).toHaveLength(5);
  },
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { series: [] },
  play: expectEmptyMessage('No data'),
};

/** `emptyMessage` says why there is nothing to draw. */
export const EmptyWithMessage: Story = {
  args: { series: [{ name: 'Aurora', data: [] }], emptyMessage: 'No ranking this quarter' },
  play: expectEmptyMessage('No ranking this quarter'),
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** Every product is named at both ends of its line, with a color dot and no legend. */
export const NamesAtBothEnds: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: PRODUCTS },
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 5);
    const expected = PRODUCTS.map((s) => s.name);
    // Two labels per product: one left of the first point, one right of the last.
    const labels = names(canvasElement);
    expect(labels).toHaveLength(10);
    const plot = surface(canvasElement)!.getBoundingClientRect();
    for (const name of expected) {
      const [left, right] = labels.filter((g) => g.textContent === name);
      expect(left.getBoundingClientRect().right, name).toBeLessThan(plot.left + plot.width / 2);
      expect(right.getBoundingClientRect().left, name).toBeGreaterThan(plot.left + plot.width / 2);
    }
    await expect(canvasElement.querySelector('.recharts-legend-wrapper')).toBeNull();
    // The dot before each name takes the color of its line.
    const strokes = seriesStrokes(canvasElement).map(resolveColor);
    for (const [i, name] of expected.entries()) {
      for (const label of labels.filter((g) => g.textContent === name)) {
        expect(resolveColor(getComputedStyle(label.querySelector('circle')!).fill), name).toBe(
          strokes[i]
        );
      }
    }
  },
};

/** The default point is a 24px disc in the card's color ringed with the series color, the rank inside. */
export const RankPointsAreDiscs: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: PRODUCTS },
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 5);
    await waitFor(() => expect(discs(canvasElement)).toHaveLength(40));
    await expect(smallDots(canvasElement)).toHaveLength(0);
    const strokes = seriesStrokes(canvasElement).map(resolveColor);
    // Disc 0 to 7 are Aurora's: its ring is its line's color, its fill the card's.
    for (const [i, disc] of discs(canvasElement).entries()) {
      // 21.5px of geometry and the 2.5px ring around it: 24px across.
      expect(disc.getBoundingClientRect().width + 2.5).toBeCloseTo(24, 0);
      expect(resolveColor(getComputedStyle(disc).stroke)).toBe(strokes[Math.floor(i / 8)]);
      expect(resolveColor(getComputedStyle(disc).fill)).toBe(themeColor('--color-bg-panel'));
    }
    await expect(rankTexts(canvasElement).map((t) => t.textContent)).toEqual(
      PRODUCTS.flatMap((s) => s.data.map((p) => String(p.rank)))
    );
  },
};

/** `points="dot"` draws a 10px dot filled with the series color and ringed with the card's. */
export const DotPointsAreFilledDots: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: PRODUCTS, points: 'dot' },
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 5);
    await waitFor(() => expect(smallDots(canvasElement)).toHaveLength(40));
    await expect(discs(canvasElement)).toHaveLength(0);
    await expect(rankTexts(canvasElement)).toHaveLength(0);
    const strokes = seriesStrokes(canvasElement).map(resolveColor);
    for (const [i, dot] of smallDots(canvasElement).entries()) {
      // 8px of fill and the 2px ring around it, which the box does not count.
      expect(dot.getBoundingClientRect().width + 2).toBeCloseTo(10, 0);
      expect(resolveColor(getComputedStyle(dot).fill)).toBe(strokes[Math.floor(i / 8)]);
      expect(resolveColor(getComputedStyle(dot).stroke)).toBe(themeColor('--color-bg-panel'));
    }
  },
};

/** Lines are `bumpX` curves 3px wide, and the periods are under the plot, in order. */
export const LinesAreBumpCurves: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: PRODUCTS },
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 5);
    await expect(strokeWidths(canvasElement)).toEqual([3, 3, 3, 3, 3]);
    // A bump curve is cubic Béziers whose control points sit at half of each step: 'C x1 y1, x2 y2, x y'.
    for (const line of lines(canvasElement)) {
      expect(line.getAttribute('d')).toMatch(/^M[^C]+(C[^C]+)+$/);
    }
    await expect(tickTexts(canvasElement, 'xAxis')).toEqual(MONTHS);
    // Rank 1 is at the top: Aurora (1 in January) starts higher than Ember (5).
    const start = (i: number) => lines(canvasElement)[i].getPointAtLength(0).y;
    expect(start(0)).toBeLessThan(start(4));
  },
};

/** A product that enters late has no point before it enters, and no line either. */
export const LateEntryHasNoPointBefore: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: WITH_ENTRIES },
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 6);
    // 4 points of Fjord (May to August) and 6 of Ember (January to June), out of 8 x 4 + 6 + 4.
    await waitFor(() => expect(discs(canvasElement)).toHaveLength(8 * 4 + 6 + 4));
    const plot = surface(canvasElement)!.getBoundingClientRect();
    const fjord = discs(canvasElement).slice(-4);
    const may = tickTexts(canvasElement, 'xAxis').indexOf('May');
    const ticks = [
      ...canvasElement.querySelectorAll(
        '.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value'
      ),
    ].map((t) => t.getBoundingClientRect());
    const mayX = ticks[may].left + ticks[may].width / 2;
    expect(fjord[0].getBoundingClientRect().left + 10.75).toBeCloseTo(mayX, -1);
    expect(fjord[0].getBoundingClientRect().left).toBeGreaterThan(plot.left + plot.width / 2 - 20);
    // Both ends are named where the lines really start and stop.
    expect(nameTexts(canvasElement).filter((n) => n === 'Fjord')).toHaveLength(2);
    expect(nameTexts(canvasElement).filter((n) => n === 'Ember')).toHaveLength(2);
    const fjordLine = lines(canvasElement)[5].getBoundingClientRect();
    expect(fjordLine.left).toBeGreaterThan(plot.left + plot.width / 2 - 20);
  },
};

/** Tied products keep their rank in the disc and are drawn apart, not on top of one another. */
export const TiesAreDrawnApart: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: WITH_TIES },
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 5);
    await waitFor(() => expect(discs(canvasElement)).toHaveLength(40));
    const all = discs(canvasElement).map((d) => d.getBoundingClientRect());
    for (let a = 0; a < all.length; a++) {
      for (let b = a + 1; b < all.length; b++) {
        const dx = Math.abs(all[a].left - all[b].left);
        const dy = Math.abs(all[a].top - all[b].top);
        // Two points of one period never sit on top of each other.
        if (dx < 1) expect(dy, `points ${a} and ${b}`).toBeGreaterThan(5);
      }
    }
    // March: Aurora and Basalt are both 2nd, and both discs say 2.
    const texts = rankTexts(canvasElement).map((t) => t.textContent);
    await expect(texts[2]).toBe('2');
    await expect(texts[8 + 2]).toBe('2');
  },
};

const focusedLine = (root: HTMLElement, i: number) => lines(root)[i];

/** Hovering a line gives it a 4px stroke and fades the others (lines to 20%, names and points to 30%). */
export const HoverFocusesASeries: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: PRODUCTS },
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 5);
    await waitFor(() => expect(discs(canvasElement)).toHaveLength(40));
    await expect(strokeOpacities(canvasElement)).toEqual([1, 1, 1, 1, 1]);
    // The entrance animation can replace the node under the pointer: hover again until it holds.
    await waitFor(async () => {
      await userEvent.unhover(focusedLine(canvasElement, 2));
      await userEvent.hover(focusedLine(canvasElement, 2));
      expect(strokeWidths(canvasElement)).toEqual([3, 3, 4, 3, 3]);
    });
    await expect(strokeOpacities(canvasElement)).toEqual([0.2, 0.2, 1, 0.2, 0.2]);
    // The names and the points of the others fade to 30%; the focused series' stay.
    const groupOpacity = (g: Element) => parseFloat(g.getAttribute('opacity') ?? '1');
    await waitFor(() => {
      const labels = names(canvasElement);
      expect(labels.filter((g) => groupOpacity(g) === 0.3)).toHaveLength(8);
      expect(labels.filter((g) => g.textContent === 'Cobalt').map(groupOpacity)).toEqual([1, 1]);
      const points = discs(canvasElement).map((d) => groupOpacity(d.parentElement!));
      expect(points.filter((o) => o === 0.3)).toHaveLength(32);
      expect(points.filter((o) => o === 1)).toHaveLength(8);
    });
    await userEvent.unhover(focusedLine(canvasElement, 2));
    await waitFor(() => expect(strokeWidths(canvasElement)).toEqual([3, 3, 3, 3, 3]));
    await expect(strokeOpacities(canvasElement)).toEqual([1, 1, 1, 1, 1]);
  },
};

/** The names are hover targets too: a name focuses its series like its line does. */
export const HoveringANameFocusesItsSeries: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: PRODUCTS },
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 5);
    await waitFor(async () => {
      const dune = names(canvasElement).filter((g) => g.textContent === 'Dune')[1];
      await userEvent.unhover(dune);
      await userEvent.hover(dune);
      expect(strokeWidths(canvasElement)).toEqual([3, 3, 3, 4, 3]);
    });
    const group = names(canvasElement).filter((g) => g.textContent === 'Dune')[1];
    await userEvent.unhover(group);
    await waitFor(() => expect(strokeWidths(canvasElement)).toEqual([3, 3, 3, 3, 3]));
  },
};

/**
 * One tab stop. The arrows Left and Right walk the periods and announce them in
 * the tooltip, Up and Down focus the series one after the other (the same
 * focus as the pointer's), Escape lets go. The tooltip says the change in words.
 */
export const KeyboardWalksPeriodsAndSeries: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: PRODUCTS },
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 5);
    await waitFor(() => expect(discs(canvasElement)).toHaveLength(40));
    // One tab stop for the whole chart.
    await expect(canvasElement.querySelectorAll('[tabindex]:not([tabindex="-1"])')).toHaveLength(1);
    await userEvent.tab();
    await expect(surface(canvasElement)).toHaveFocus();
    await waitFor(() => expect(tooltipCard(canvasElement)?.textContent).toContain('Jan'));
    // January has nothing to compare with.
    await expect(tooltipCard(canvasElement)?.textContent).not.toMatch(/vs/);
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await waitFor(() =>
      expect(tooltipCard(canvasElement)?.querySelector('p')).toHaveTextContent('Mar')
    );
    // Every product, best rank first, with its change.
    const rows = () =>
      [...(tooltipCard(canvasElement)?.querySelectorAll('li') ?? [])].map((li) => li.textContent);
    await expect(rows()).toEqual([
      'Basalt#1up 2 vs Feb',
      'Aurora#2down 1 vs Feb',
      'Cobalt#3down 1 vs Feb',
      'Ember#4unchanged vs Feb',
      'Dune#5unchanged vs Feb',
    ]);
    // Down focuses the first series; the tooltip narrows to it, and the others fade.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(strokeWidths(canvasElement)).toEqual([4, 3, 3, 3, 3]));
    await expect(strokeOpacities(canvasElement)).toEqual([1, 0.2, 0.2, 0.2, 0.2]);
    await waitFor(() => expect(rows()).toEqual(['Aurora#2down 1 vs Feb']));
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await waitFor(() => expect(strokeWidths(canvasElement)).toEqual([3, 3, 4, 3, 3]));
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(rows()).toEqual(['Cobalt#2up 1 vs Mar']));
    // Up walks back, and wraps around past the first.
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    await waitFor(() => expect(strokeWidths(canvasElement)).toEqual([3, 3, 3, 3, 4]));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(strokeWidths(canvasElement)).toEqual([3, 3, 3, 3, 3]));
    await expect(strokeOpacities(canvasElement)).toEqual([1, 1, 1, 1, 1]);
    // Leaving the chart lets go too.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(strokeWidths(canvasElement)).toEqual([4, 3, 3, 3, 3]));
    await userEvent.tab();
    await waitFor(() => expect(strokeWidths(canvasElement)).toEqual([3, 3, 3, 3, 3]));
    await closeTooltip(canvasElement);
  },
};

/**
 * The tooltip gives the period, the rank and the change from the previous
 * period in words, never by color alone: "unchanged vs May", "up 2 vs Apr",
 * "down 1 vs Mar".
 */
export const TooltipSaysTheChangeInWords: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: PRODUCTS },
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 5);
    await waitFor(() => expect(discs(canvasElement)).toHaveLength(40));
    // Cobalt: 3, 2, 3, 2, 4, 4, 2, 3.
    await userEvent.tab();
    const card = () => tooltipCard(canvasElement) as HTMLElement;
    const row = (name: string) =>
      [...card().querySelectorAll('li')].find((li) => li.textContent?.startsWith(name))
        ?.textContent;
    const to = async (period: string) => {
      const target = MONTHS.indexOf(period);
      const current = () => MONTHS.indexOf(card()?.querySelector('p')?.textContent ?? '');
      while (current() < target) {
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(current()).toBeGreaterThan(-1));
      }
    };
    await to('Feb');
    await waitFor(() => expect(row('Cobalt')).toBe('Cobalt#2up 1 vs Jan'));
    await to('Mar');
    await waitFor(() => expect(row('Cobalt')).toBe('Cobalt#3down 1 vs Feb'));
    await to('Jun');
    await waitFor(() => expect(row('Cobalt')).toBe('Cobalt#4unchanged vs May'));
    await to('Jul');
    await waitFor(() => expect(row('Cobalt')).toBe('Cobalt#2up 2 vs Jun'));
    await userEvent.tab();
    await closeTooltip(canvasElement);
  },
};

/** A product that has just entered says so, and the tooltip lists only the products ranked that period. */
export const TooltipForANewEntry: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: WITH_ENTRIES },
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 6);
    await userEvent.tab();
    const card = () => tooltipCard(canvasElement) as HTMLElement;
    await waitFor(() => expect(card().querySelectorAll('li')).toHaveLength(5));
    for (let i = 0; i < 4; i++) await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(card().querySelector('p')).toHaveTextContent('May'));
    const rows = [...card().querySelectorAll('li')].map((li) => li.textContent);
    await expect(rows).toContain('Fjord#6new entry');
    await expect(rows).toHaveLength(6);
    // Focus on Fjord, then walk back to a period it is not in.
    for (let i = 0; i < 6; i++) await userEvent.keyboard('{ArrowDown}');
    for (let i = 0; i < 2; i++) await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(card().querySelector('p')).toHaveTextContent('Mar'));
    await expect(card().querySelector('li')).toHaveTextContent('Fjordnot ranked');
    await userEvent.tab();
    await closeTooltip(canvasElement);
  },
};

/** `formatValue` writes the rank in the tooltip; the points keep the bare number. */
export const FormatValueFormatsTheRank: Story = {
  tags: ['!dev', '!autodocs'],
  args: CustomColorsAndRankFormat.args,
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 5);
    await userEvent.tab();
    await waitFor(() => expect(tooltipCard(canvasElement)).toHaveTextContent('Aurorarank 1'));
    await expect(rankTexts(canvasElement)[0]).toHaveTextContent(/^1$/);
    await userEvent.tab();
    await closeTooltip(canvasElement);
  },
};

/** Each line takes the color of its index in `colors`. */
export const ColorsOverridePalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: CustomColorsAndRankFormat.args,
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(seriesStrokes(canvasElement).map(resolveColor)).toEqual(
        ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'].map(resolveColor)
      )
    );
  },
};

/** The lines take the default palette of the theme: the accent, then the hues after it. */
export const PaletteFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: PRODUCTS },
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    const tokens = [
      '--color-brand-500',
      ...SERIES_FALLBACKS.slice(1, 5).map((_, i) => `--color-chart-${i + 2}`),
    ];
    await waitFor(() =>
      expect(seriesStrokes(canvasElement).map(resolveColor)).toEqual(tokens.map(themeColor))
    );
  },
};

/**
 * Colors are CSS variables handed to the SVG: a theme or accent switch on
 * `<html>` repaints the chart with no observer and no redraw.
 */
export const RepaintsWithTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { series: PRODUCTS },
  render: (args) => <Box {...args} width={880} />,
  play: ({ canvasElement }) => expectRepaintsWithTheme(canvasElement),
};

const px = (el: Element | null | undefined) => parseFloat(el ? getComputedStyle(el).fontSize : '');

/**
 * The period labels, the names, the ranks in the discs and the tooltip are
 * drawn at the size of the text size setting, as the page's text is.
 */
export const TextFollowsTheTextSize: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: PRODUCTS },
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    const sizes = () => ({
      period: px(
        canvasElement.querySelector(
          '.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value'
        )
      ),
      name: px(names(canvasElement)[0]?.querySelector('text')),
      rank: px(rankTexts(canvasElement)[0]),
    });
    await drawn(canvasElement, 5);
    await waitFor(() => expect(sizes()).toEqual({ period: 12, name: 14, rank: 11 }));
    const html = document.documentElement;
    const previous = html.getAttribute('data-text-size');
    try {
      html.setAttribute('data-text-size', 'lg');
      await waitFor(() => expect(sizes()).toEqual({ period: 13.5, name: 15.75, rank: 12.375 }));
      await userEvent.tab();
      await waitFor(() => expect(px(tooltipCard(canvasElement))).toBe(13.5));
    } finally {
      if (previous === null) html.removeAttribute('data-text-size');
      else html.setAttribute('data-text-size', previous);
      await userEvent.tab();
      await closeTooltip(canvasElement);
    }
  },
};

/**
 * The names, the periods and the tooltip are React text: markup in them shows
 * as written, and nothing is injected.
 */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [
      {
        name: HOSTILE,
        data: [
          { x: HOSTILE, rank: 1 },
          { x: 'B', rank: 2 },
          { x: 'C', rank: 1 },
        ],
      },
      {
        name: 'B',
        data: [
          { x: HOSTILE, rank: 2 },
          { x: 'B', rank: 1 },
          { x: 'C', rank: 2 },
        ],
      },
    ],
  },
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 2);
    await expectNoInjectedImage(canvasElement);
    // The name is cut short on the chart; the tooltip has it whole. Each line adds its names
    // when its own animation ends, so their order in the page is not the series order.
    await expect(nameTexts(canvasElement)).toContain(HOSTILE.slice(0, 11) + '…');
    await userEvent.tab();
    // The checks are the wait: a card found once can be drawn again before it is read.
    await waitFor(() => {
      const card = tooltipCard(canvasElement);
      expect(card?.querySelector('p')).toHaveTextContent(HOSTILE);
      expect(card?.querySelector('li')).toHaveTextContent(HOSTILE);
    });
    await expectNoInjectedImage(canvasElement);
    await userEvent.tab();
    await closeTooltip(canvasElement);
  },
};

/** A chart wider than its box is cut to it, and the names stay inside the chart. */
export const NoHorizontalOverflow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: WITH_ENTRIES, width: 900 },
  render: (args) => (
    <div data-testid="box" style={{ width: 375, maxWidth: '100%' }}>
      <BumpChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>('[data-testid="box"]') as HTMLElement;
    await drawn(canvasElement, 6);
    await waitFor(() => {
      expect(box.scrollWidth, 'the box scrolls sideways').toBeLessThanOrEqual(box.clientWidth);
      expect(surface(canvasElement)?.getBoundingClientRect().width).toBeLessThanOrEqual(375);
    });
    const root = document.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    // At 375px: only the names on the right, cut short, and every one inside the chart.
    const plot = surface(canvasElement)!.getBoundingClientRect();
    const labels = names(canvasElement);
    await expect(labels).toHaveLength(6);
    for (const label of labels) {
      const r = label.getBoundingClientRect();
      expect(r.left, label.textContent!).toBeGreaterThanOrEqual(plot.left);
      expect(r.right, label.textContent!).toBeLessThanOrEqual(plot.right);
    }
    for (const point of discs(canvasElement)) {
      const r = point.getBoundingClientRect();
      expect(r.left).toBeGreaterThanOrEqual(plot.left);
      expect(r.right).toBeLessThanOrEqual(plot.right);
    }
  },
};

/** Wide, the longest names fit inside the chart on both sides too. */
export const LongNamesStayInside: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: PRODUCTS.map((s, i) => ({
      ...s,
      name: `${s.name} ${'extended edition'.slice(0, 4 + i * 3)}`,
    })),
  },
  render: (args) => <Box {...args} width={700} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 5);
    await expect(names(canvasElement)).toHaveLength(10);
    const plot = surface(canvasElement)!.getBoundingClientRect();
    for (const label of names(canvasElement)) {
      const r = label.getBoundingClientRect();
      expect(r.left, label.textContent!).toBeGreaterThanOrEqual(plot.left);
      expect(r.right, label.textContent!).toBeLessThanOrEqual(plot.right);
    }
  },
};

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its periods. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: PRODUCTS, ariaLabel: 'Revenue rank of five products' },
  render: (args) => <Box {...args} width={880} />,
  play: expectAccessibleChart({ keyboard: true }),
};

/** Without `ariaLabel`, the chart is named from its series. */
export const NamedFromItsSeries: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: PRODUCTS },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(surface(canvasElement)).toHaveAttribute(
        'aria-label',
        'Bump chart: Aurora, Basalt, Cobalt, Dune, Ember'
      )
    );
  },
};

// Opens a tooltip with the pointer, then lets go: a hovered chart must not stay focused.
export const PointerTooltipThenLeave: Story = {
  tags: ['!dev', '!autodocs'],
  args: { series: PRODUCTS },
  render: (args) => <Box {...args} width={880} />,
  play: async ({ canvasElement }) => {
    await drawn(canvasElement, 5);
    await openTooltip(canvasElement, 0.5);
    await expect(tooltipCard(canvasElement)?.querySelectorAll('li')).toHaveLength(5);
    await closeTooltip(canvasElement);
    await expect(strokeWidths(canvasElement)).toEqual([3, 3, 3, 3, 3]);
  },
};
