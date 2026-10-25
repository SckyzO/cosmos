import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { BarChart } from './BarChart';
import {
  HOSTILE,
  Rerender,
  expectNoRedrawOnRerender,
  closeTooltip,
  expectNoInjectedImage,
  expectTooltipFollowsTheme,
  freshCopy,
  hover,
  legendTexts,
  loadLateFont,
  xAxisLayout,
  expectAccessibleChart,
  expectPaletteFromTheme,
  opaqueColor,
  resolveColor,
  LegendSides,
  expectLegendsOnTheirSide,
} from './storybook-helpers';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const DCS = ['DC1 Paris', 'DC2 Frankfurt', 'DC3 London', 'DC4 Tokyo'];
const SERVICES = [
  'api-gateway',
  'auth-service',
  'billing-service',
  'catalog-service',
  'checkout-service',
  'inventory-service',
  'notification-service',
  'order-service',
  'payment-service',
  'search-service',
  'shipping-service',
  'user-profile-service',
];

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Bar & Column',
  component: BarChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/** Vertical columns, one series. */
export const SingleSeries: Story = {
  args: {
    categories: MONTHS,
    series: [{ name: 'Incidents', data: [12, 18, 14, 22, 28, 19, 24, 31, 16] }],
  },
};

/** Two series or more are grouped side by side, with a legend. */
export const MultiSeries: Story = {
  args: {
    categories: MONTHS,
    series: [
      { name: 'CRIT', data: [3, 4, 2, 6, 5, 4, 7, 9, 5] },
      { name: 'WARN', data: [9, 14, 12, 16, 23, 15, 17, 22, 11] },
    ],
  },
};

/** `stacked` piles the series on each other. */
export const Stacked: Story = {
  args: {
    categories: MONTHS,
    stacked: true,
    series: [
      { name: 'CRIT', data: [3, 4, 2, 6, 5, 4, 7, 9, 5] },
      { name: 'WARN', data: [9, 14, 12, 16, 23, 15, 17, 22, 11] },
      { name: 'INFO', data: [4, 2, 5, 7, 4, 6, 3, 5, 4] },
    ],
  },
};

/** Columns below zero grow downward from the axis. */
export const NegativeValues: Story = {
  args: {
    categories: MONTHS,
    series: [{ name: 'Net rack change', data: [6, 4, -3, 8, -5, 2, -7, 5, 3] }],
  },
};

/** Long category labels rotate when they don't fit under their column. */
export const ManyCategories: Story = {
  args: {
    categories: SERVICES,
    series: [{ name: 'Errors (24 h)', data: [182, 64, 23, 41, 137, 58, 12, 96, 151, 37, 44, 19] }],
  },
};

/** `orientation="horizontal"` draws bars rightward. */
export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
    categories: DCS,
    series: [{ name: 'Active racks', data: [42, 38, 26, 19] }],
  },
};

export const HorizontalMultiSeries: Story = {
  args: {
    orientation: 'horizontal',
    categories: DCS,
    series: [
      { name: 'In use', data: [42, 38, 26, 19] },
      { name: 'Available', data: [8, 12, 14, 21] },
    ],
  },
};

export const HorizontalStacked: Story = {
  args: {
    orientation: 'horizontal',
    stacked: true,
    categories: DCS,
    series: [
      { name: 'In use', data: [42, 38, 26, 19] },
      { name: 'Available', data: [8, 12, 14, 21] },
    ],
  },
};

/**
 * Stacked bars with one series below zero face each other across the axis.
 * `formatValue` drops the sign from the axis and the tooltip.
 */
export const HorizontalNegativeStacked: Story = {
  args: {
    orientation: 'horizontal',
    stacked: true,
    categories: DCS,
    formatValue: (v) => `${Math.abs(v)} Gb/s`,
    series: [
      { name: 'Outbound', data: [-31, -27, -19, -12] },
      { name: 'Inbound', data: [42, 35, 28, 16] },
    ],
  },
};

export const FormattedValues: Story = {
  args: {
    categories: MONTHS,
    formatValue: (v) => `${v} k€`,
    series: [{ name: 'Revenue', data: [120, 145, 132, 168, 195, 178, 210, 234, 198] }],
  },
};

export const CustomColors: Story = {
  args: {
    categories: MONTHS,
    colors: ['#10b981', '#f59e0b', '#ef4444'],
    series: [
      { name: 'OK', data: [80, 78, 82, 75, 70, 72, 68, 65, 70] },
      { name: 'WARN', data: [12, 14, 12, 16, 20, 18, 22, 25, 20] },
      { name: 'CRIT', data: [3, 4, 2, 6, 5, 4, 7, 9, 5] },
    ],
  },
};

export const ShortHeight: Story = {
  args: {
    height: 200,
    categories: MONTHS,
    series: [{ name: 'Compact', data: [12, 18, 14, 22, 28, 19, 24, 31, 16] }],
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** The legend and the tooltip are HTML: series names and categories show as text. */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!autodocs'],
  args: {
    series: [
      { name: HOSTILE, data: [3, 5, 2] },
      { name: 'Normal', data: [4, 1, 6] },
    ],
    categories: [HOSTILE, 'B', 'C'],
  },
  play: async ({ canvasElement }) => {
    // Legends render on mount: the name must show up as literal text.
    await waitFor(() => expect(legendTexts(canvasElement).length).toBeGreaterThan(1));
    await expect(legendTexts(canvasElement)).toContain(HOSTILE);
    await expectNoInjectedImage(canvasElement);

    // Tooltips render on hover: the title is the category.
    const bar = () => canvasElement.querySelector('.apexcharts-bar-area');
    await waitFor(() => {
      hover(bar() as Element);
      expect(canvasElement.querySelector('.apexcharts-tooltip-title')?.textContent).toBe(HOSTILE);
    });
    await expectNoInjectedImage(canvasElement);
    await closeTooltip(canvasElement, bar);
  },
};

const LATE_FONT = 'CosmosLateFont';

/**
 * A web font that loads after the first render: the labels are measured again
 * in that font, so their rotation and the plot area fit it.
 */
export const RemeasuresAfterFontLoad: Story = {
  tags: ['!dev', '!autodocs'],
  args: ManyCategories.args,
  render: (args) => (
    <div style={{ fontFamily: `'${LATE_FONT}', serif` }}>
      <BarChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('.apexcharts-xaxis-label')).toHaveLength(
        SERVICES.length
      )
    );
    const fallbackLayout = xAxisLayout(canvasElement);
    await loadLateFont(LATE_FONT, 'JetBrains Mono');
    await waitFor(() => expect(xAxisLayout(canvasElement)).not.toBe(fallbackLayout));
  },
};

/** The tooltip follows the Cosmos theme: dark in the dark themes, light in the others. */
export const TooltipFollowsTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { categories: MONTHS, series: [{ name: 'Revenue', data: [120, 145, 132, 168] }] },
  play: async ({ canvasElement }) => {
    await expectTooltipFollowsTheme(canvasElement, () =>
      canvasElement.querySelector('.apexcharts-bar-area')
    );
  },
};

/**
 * The default palette has eight categorical colors: the accent first, then
 * hues apart from each other, none of them green, amber or red in the first
 * places, so series never read as statuses. Past eight the colors repeat.
 */
export const EightSeriesPalette: Story = {
  args: {
    categories: MONTHS.slice(0, 5),
    stacked: true,
    legendPosition: 'bottom',
    series: ['web', 'api', 'batch', 'cache', 'queue', 'search', 'auth', 'mail'].map(
      (name, index) => ({ name, data: [4, 6, 5, 7, 3].map((v) => v + index) })
    ),
  },
  play: async ({ canvasElement }) => {
    await expectPaletteFromTheme(() =>
      [...canvasElement.querySelectorAll('.apexcharts-bar-area[j="0"]')].map((el) =>
        el.getAttribute('stroke')
      )
    );
  },
};

/** With the cyan accent the palette drops the cyan and the teal, which would repeat the accent. */
export const EightSeriesPaletteCyanAccent: Story = {
  ...EightSeriesPalette,
  globals: { accent: 'cyan' },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const fills = [...canvasElement.querySelectorAll('.apexcharts-bar-area[j="0"]')].map((el) =>
        opaqueColor(el.getAttribute('stroke') ?? '')
      );
      expect(fills).toHaveLength(8);
      expect(new Set(fills).size).toBe(8);
      expect(fills).not.toContain(resolveColor('#06b6d4'));
      expect(fills).not.toContain(resolveColor('#14b8a6'));
    });
  },
};

/** The bars take the default palette of the theme. */
export const PaletteFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    categories: ['A', 'B', 'C'],
    series: ['a', 'b', 'c', 'd', 'e'].map((name) => ({ name, data: [3, 5, 4] })),
  },
  play: async ({ canvasElement }) => {
    await expectPaletteFromTheme(() =>
      [...canvasElement.querySelectorAll('.apexcharts-bar-area[j="0"]')].map((el) =>
        el.getAttribute('stroke')
      )
    );
  },
};

/** `legendPosition` puts the legend on each side of the plot. */
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
      {(legendPosition) => <BarChart {...args} legendPosition={legendPosition} />}
    </LegendSides>
  ),
  play: expectLegendsOnTheirSide,
};

/**
 * A parent render with equal props leaves the chart as drawn; a new height
 * still redraws it.
 */
export const RerenderWithEqualPropsDoesNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...SingleSeries.args, formatValue: (v) => `${v} kW` },
  render: (args) => (
    <Rerender>{(grown) => <BarChart {...freshCopy(args)} height={grown ? 360 : 320} />}</Rerender>
  ),
  play: expectNoRedrawOnRerender,
};

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its points. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...SingleSeries.args, ariaLabel: 'Incidents per month' },
  play: expectAccessibleChart({ keyboard: true }),
};
