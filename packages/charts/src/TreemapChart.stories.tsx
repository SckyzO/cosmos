import type { Meta, StoryObj } from '@storybook/react-vite';
import { TreemapChart } from './TreemapChart';
import { expect, waitFor } from 'storybook/test';
import {
  contrastRatio,
  expectTooltipFollowsTheme,
  hover,
  resolveColor,
  Rerender,
  expectNoRedrawOnRerender,
  freshCopy,
  expectAccessibleChart,
  expectPaletteFromTheme,
  expectMessageOnly,
  expectColorInThemes,
} from './storybook-helpers';

const BLUE_RAMP = ['#1e3a8a', '#2563eb', '#93c5fd', '#dbeafe'];
const tb = (v: number) => `${v} TB`;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Treemap',
  component: TreemapChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof TreemapChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/** Tile area follows `y`; every tile takes the next palette color. */
export const Distributed: Story = {
  args: {
    series: [
      {
        data: [
          { x: 'DC1', y: 218 },
          { x: 'DC2', y: 152 },
          { x: 'DC3', y: 96 },
          { x: 'edge-east', y: 64 },
          { x: 'edge-west', y: 48 },
          { x: 'lab', y: 22 },
        ],
      },
    ],
  },
};

/** One series per group: the tiles of a series stay together. */
export const MultipleSeries: Story = {
  args: {
    series: [
      {
        name: 'Paris',
        data: [
          { x: 'compute', y: 120 },
          { x: 'storage', y: 64 },
          { x: 'gpu', y: 38 },
        ],
      },
      {
        name: 'Frankfurt',
        data: [
          { x: 'compute', y: 92 },
          { x: 'storage', y: 51 },
          { x: 'network', y: 17 },
        ],
      },
    ],
  },
};

/**
 * `colors` overrides the palette, here with a ramp from navy to pale blue. The
 * labels stay readable: dark on the pale tiles, white on the deep ones.
 */
export const CustomColors: Story = {
  args: {
    colors: BLUE_RAMP,
    series: [
      {
        data: [
          { x: 'NVMe', y: 96 },
          { x: 'SSD', y: 184 },
          { x: 'HDD', y: 412 },
          { x: 'Tape', y: 640 },
        ],
      },
    ],
  },
};

/** `formatValue` formats the tooltip values. */
export const FormattedValues: Story = {
  args: { ...Distributed.args, formatValue: tb },
};

/**
 * `showValues` writes each tile's value under its name, in the format of
 * `formatValue`. The group names sit on plates in the card's colors.
 */
export const ShowValues: Story = {
  args: { ...MultipleSeries.args, showValues: true, formatValue: tb },
};

/** The tooltip follows the Cosmos theme: dark in the dark themes, light in the others. */
export const TooltipFollowsTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: {
    series: [
      {
        data: [
          { x: 'DC1', y: 218 },
          { x: 'DC2', y: 152 },
        ],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    await expectTooltipFollowsTheme(canvasElement, () =>
      canvasElement.querySelector('.apexcharts-treemap-rect')
    );
  },
};

// The fill of every tile and of its label.
const labelledTiles = (root: HTMLElement) =>
  [...root.querySelectorAll('.apexcharts-treemap-rect')].flatMap((rect) => {
    const label = rect.nextElementSibling?.querySelector('text');
    const fill = rect.getAttribute('fill');
    const text = label?.getAttribute('fill');
    return fill && text ? [{ fill, text }] : [];
  });

/** Each tile label reads on its tile: white on the green or amber was under 3:1. */
export const LabelsReadOnTiles: Story = {
  tags: ['!dev', '!autodocs'],
  args: Distributed.args,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(labelledTiles(canvasElement).length).toBeGreaterThanOrEqual(5));
    for (const { fill, text } of labelledTiles(canvasElement)) {
      expect(contrastRatio(text, fill)).toBeGreaterThanOrEqual(4.5);
    }
  },
};

/** Every tile takes a color from `colors`, and its label reads on that color. */
export const ColorsOverridePalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: CustomColors.args,
  play: async ({ canvasElement }) => {
    const fills = () =>
      labelledTiles(canvasElement)
        .map(({ fill }) => resolveColor(fill))
        .sort();
    await waitFor(() => expect(fills()).toEqual([...BLUE_RAMP].sort()));
    for (const { fill, text } of labelledTiles(canvasElement)) {
      expect(contrastRatio(text, fill)).toBeGreaterThanOrEqual(4.5);
    }
  },
};

/** `formatValue` formats the tooltip value. */
export const FormatValueFormatsTooltip: Story = {
  tags: ['!dev', '!autodocs'],
  args: FormattedValues.args,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      hover(canvasElement.querySelector('.apexcharts-treemap-rect') as Element);
      expect(canvasElement.querySelector('.apexcharts-tooltip-text-y-value')?.textContent).toBe(
        '218 TB'
      );
    });
  },
};

/** Tiles show their name alone, and their name over their value with `showValues`. */
export const ValuesAreOptIn: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...MultipleSeries.args },
  render: (args) => (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-testid="plain">
        <TreemapChart {...args} />
      </div>
      <div data-testid="valued">
        <TreemapChart {...args} showValues formatValue={tb} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // The lines of each tile label: the name, then the value.
    const lines = (id: string) =>
      [...canvasElement.querySelectorAll(`[data-testid="${id}"] .apexcharts-datalabel`)].map(
        (el) => {
          const rows = [...el.querySelectorAll('tspan')];
          return rows.length > 0 ? rows.map((row) => row.textContent) : [el.textContent];
        }
      );
    await waitFor(() => expect(lines('valued')).toContainEqual(['compute', '120 TB']));
    await expect(lines('valued')).toContainEqual(['storage', '51 TB']);
    await waitFor(() => expect(lines('plain').length).toBeGreaterThan(0));
    for (const label of lines('plain')) expect(label).toHaveLength(1);
  },
};

/**
 * The name of a group sits on a plate in the card's color, with the theme's
 * text color and line color, in every theme.
 */
export const GroupHeaderFollowsTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { ...MultipleSeries.args },
  play: async ({ canvasElement }) => {
    const plate = () =>
      canvasElement.querySelector(
        '.apexcharts-treemap-series > rect:not(.apexcharts-treemap-rect)'
      );
    const title = () =>
      canvasElement.querySelector('.apexcharts-treemap-series > text')?.getAttribute('fill');
    await waitFor(() => expect(plate()).toBeTruthy());
    const themes = {
      dark: ['--color-gray-900', '--color-gray-800'],
      '': ['--color-white', '--color-gray-200'],
      sand: ['--color-white', '--color-gray-200'],
      'deep-blue': ['--color-gray-900', '--color-gray-800'],
    };
    const tokens = (index: number) =>
      Object.fromEntries(Object.entries(themes).map(([theme, pair]) => [theme, pair[index]]));
    await expectColorInThemes(() => plate()?.getAttribute('fill'), tokens(0));
    await expectColorInThemes(() => plate()?.getAttribute('stroke'), tokens(1));
    await expectColorInThemes(
      title,
      Object.fromEntries(Object.keys(themes).map((theme) => [theme, '--color-text-primary']))
    );
  },
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { series: [] },
  play: expectMessageOnly('No data'),
};

/** The gap between tiles is the card's color in every theme, never ApexCharts' white. */
export const TileGapsMatchTheSurface: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: {
    series: [
      {
        data: [
          { x: 'a', y: 5 },
          { x: 'b', y: 3 },
        ],
      },
    ],
  },
  play: ({ canvasElement }) =>
    expectColorInThemes(
      () => canvasElement.querySelector('.apexcharts-treemap-rect')?.getAttribute('stroke'),
      {
        dark: '--color-gray-900',
        'deep-blue': '--color-gray-900',
        '': '--color-white',
        sand: '--color-white',
      }
    ),
};

/** One name keeps its color in every group: `compute` is the same in Paris and Frankfurt. */
export const NameKeepsItsColor: Story = {
  tags: ['!dev'],
  args: MultipleSeries.args,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const fills: Record<string, Set<string | null>> = {};
      for (const tile of canvasElement.querySelectorAll('.apexcharts-treemap-rect')) {
        const name = tile.getAttribute('data:key')?.split(':').pop() ?? '';
        (fills[name] ??= new Set()).add(tile.getAttribute('fill'));
      }
      expect(Object.keys(fills).sort()).toEqual(['compute', 'gpu', 'network', 'storage']);
      for (const colors of Object.values(fills)) expect(colors.size).toBe(1);
      expect(new Set(Object.values(fills).map(([...c]) => c[0])).size).toBe(4);
    });
  },
};

/** The tiles take the default palette of the theme. */
export const PaletteFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [{ data: ['a', 'b', 'c', 'd', 'e'].map((x, i) => ({ x, y: 5 - i })) }],
  },
  play: async ({ canvasElement }) => {
    await expectPaletteFromTheme(() =>
      [...canvasElement.querySelectorAll('.apexcharts-treemap-rect')].map((el) =>
        el.getAttribute('fill')
      )
    );
  },
};

/**
 * A parent render with equal props leaves the chart as drawn; a new height
 * still redraws it.
 */
export const RerenderWithEqualPropsDoesNotRedraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Distributed.args, colors: BLUE_RAMP, formatValue: tb },
  render: (args) => (
    <Rerender>
      {(grown) => <TreemapChart {...freshCopy(args)} height={grown ? 400 : 320} />}
    </Rerender>
  ),
  play: expectNoRedrawOnRerender,
};

/** Screen readers read `ariaLabel` as the chart's name; Tab and the arrow keys walk its points. */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Distributed.args, ariaLabel: 'Racks per datacenter' },
  play: expectAccessibleChart({ keyboard: true }),
};
