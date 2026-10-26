import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { TreemapChart } from './TreemapChart';
import {
  HOSTILE,
  contrastRatio,
  expectColorInThemes,
  expectNoInjectedImage,
  resolveColor,
  switchTheme,
  themeColor,
} from './storybook-helpers';
import { expectEmptyMessage } from './storybook-recharts';

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

// ── Interaction tests ────────────────────────────────────────────────────────

const tilesOf = (root: HTMLElement) => [...root.querySelectorAll<SVGGElement>('[data-tile]')];
const rectOf = (tile: Element) => tile.querySelector('rect') as SVGRectElement;
const cardOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('.recharts-tooltip-wrapper [role="status"]');
// The name of a tile: its accessible name is `group, name: value`.
const nameOf = (tile: Element) =>
  (tile.getAttribute('aria-label') ?? '')
    .replace(/: [^:]*$/, '')
    .split(', ')
    .at(-1);
const labelOf = (tile: Element) => tile.querySelector('foreignObject div');
const px = (el: Element | null) => parseFloat(el ? getComputedStyle(el).fontSize : '');

// A CSS color in any syntax (relative colors, color-mix) as `#rrggbb`.
const toHex = (color: string) => {
  const context = document.createElement('canvas').getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};

// The fill of every tile, and the color of its label.
const labelledTiles = (root: HTMLElement) =>
  tilesOf(root).flatMap((tile) => {
    const label = labelOf(tile);
    return label
      ? [
          {
            fill: toHex(getComputedStyle(rectOf(tile)).fill),
            text: toHex(getComputedStyle(label).color),
          },
        ]
      : [];
  });

/** The tooltip is a card in the colors of the theme, a live region for screen readers. */
export const TooltipCardShowsTheTile: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...MultipleSeries.args, formatValue: tb },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(tilesOf(canvasElement)).toHaveLength(6));
    await expect(cardOf(canvasElement)).toBeNull();
    // The first tile of Paris: `compute`.
    const tile = tilesOf(canvasElement)[0];
    await waitFor(async () => {
      await userEvent.hover(tile);
      const card = cardOf(canvasElement);
      expect(card).not.toBeNull();
      expect(card).toHaveAttribute('aria-live', 'polite');
      expect(card?.querySelector('p')).toHaveTextContent('Paris');
      expect(card?.querySelector('li')).toHaveTextContent('compute');
      expect(card?.querySelector('li')).toHaveTextContent('120 TB');
    });
    await userEvent.unhover(tile);
    await waitFor(() => expect(cardOf(canvasElement)).toBeNull());
  },
};

/** Each tile label reads on its tile, in every theme and accent: white or black, 4.5:1 at least. */
export const LabelsReadOnTiles: Story = {
  tags: ['!dev', '!autodocs'],
  args: Distributed.args,
  play: async ({ canvasElement }) => {
    for (const theme of ['', 'sand', 'dark', 'deep-blue']) {
      const restore = switchTheme(theme);
      try {
        for (const accent of ['blue', 'teal', 'amber', 'graphite', 'rose']) {
          document.documentElement.setAttribute('data-accent', accent);
          await waitFor(() => {
            const tiles = labelledTiles(canvasElement);
            expect(tiles.length).toBeGreaterThanOrEqual(5);
            for (const { fill, text } of tiles) {
              expect(
                contrastRatio(text, fill),
                `${theme || 'light'} ${accent}`
              ).toBeGreaterThanOrEqual(4.5);
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

/** Every tile takes a color from `colors`, and its label reads on that color. */
export const ColorsOverridePalette: Story = {
  tags: ['!dev', '!autodocs'],
  args: CustomColors.args,
  play: async ({ canvasElement }) => {
    const fills = () =>
      labelledTiles(canvasElement)
        .map(({ fill }) => fill)
        .sort();
    await waitFor(() => expect(fills()).toEqual(BLUE_RAMP.map(resolveColor).sort()));
    for (const { fill, text } of labelledTiles(canvasElement)) {
      expect(contrastRatio(text, fill)).toBeGreaterThanOrEqual(4.5);
    }
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
      [...canvasElement.querySelectorAll(`[data-testid="${id}"] [data-tile] foreignObject > div`)]
        .map((el) => [...el.children].map((row) => row.textContent))
        .filter((rows) => rows.length > 0);
    await waitFor(() => expect(lines('valued')).toContainEqual(['compute', '120 TB']));
    await expect(lines('valued')).toContainEqual(['storage', '51 TB']);
    await waitFor(() => expect(lines('plain').length).toBeGreaterThan(0));
    for (const label of lines('plain')) expect(label).toHaveLength(1);
  },
};

/**
 * The name of a group sits on a plate in the card's color, with the theme's
 * text color, in every theme.
 */
export const GroupHeaderFollowsTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { ...MultipleSeries.args },
  play: async ({ canvasElement }) => {
    const plate = () =>
      canvasElement.querySelector<HTMLElement>(
        '[data-tile] foreignObject > div[style*="inline-block"]'
      );
    await waitFor(() => expect(plate()).toBeTruthy());
    await expect(
      [
        ...canvasElement.querySelectorAll('[data-tile] foreignObject > div[style*="inline-block"]'),
      ].map((el) => el.textContent)
    ).toEqual(['Paris', 'Frankfurt']);
    const themes = ['', 'sand', 'dark', 'deep-blue'];
    await expectColorInThemes(
      () => plate() && getComputedStyle(plate() as HTMLElement).backgroundColor,
      Object.fromEntries(themes.map((theme) => [theme, '--color-bg-panel']))
    );
    await expectColorInThemes(
      () => plate() && getComputedStyle(plate() as HTMLElement).color,
      Object.fromEntries(themes.map((theme) => [theme, '--color-text-primary']))
    );
  },
};

/** With no data, the chart draws `emptyMessage` (default "No data") in place of the plot. */
export const Empty: Story = {
  args: { series: [] },
  play: expectEmptyMessage('No data'),
};

/** A series of zeros has nothing to draw either. */
export const OnlyZerosIsEmpty: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [
      {
        data: [
          { x: 'a', y: 0 },
          { x: 'b', y: 0 },
        ],
      },
    ],
    emptyMessage: 'Nothing used',
  },
  play: expectEmptyMessage('Nothing used'),
};

/** The gap between tiles is the card's color in every theme. */
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
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(tilesOf(canvasElement)).toHaveLength(2));
    const themes = ['', 'sand', 'dark', 'deep-blue'];
    await expectColorInThemes(
      () => getComputedStyle(rectOf(tilesOf(canvasElement)[0])).stroke,
      Object.fromEntries(themes.map((theme) => [theme, '--color-bg-panel']))
    );
  },
};

/** One name keeps its color in every group: `compute` is the same in Paris and Frankfurt. */
export const NameKeepsItsColor: Story = {
  tags: ['!dev'],
  args: MultipleSeries.args,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const fills: Record<string, Set<string>> = {};
      for (const tile of tilesOf(canvasElement)) {
        (fills[nameOf(tile) as string] ??= new Set()).add(getComputedStyle(rectOf(tile)).fill);
      }
      expect(Object.keys(fills).sort()).toEqual(['compute', 'gpu', 'network', 'storage']);
      for (const colors of Object.values(fills)) expect(colors.size).toBe(1);
      expect(new Set(Object.values(fills).map(([...c]) => c[0])).size).toBe(4);
    });
  },
};

/** The tiles take the default palette of the theme, and follow the accent. */
export const PaletteFromTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    series: [{ data: ['a', 'b', 'c', 'd', 'e'].map((x, i) => ({ x, y: 5 - i })) }],
  },
  play: async ({ canvasElement }) => {
    const tokens = [
      '--color-brand-500',
      '--color-chart-2',
      '--color-chart-3',
      '--color-chart-4',
      '--color-chart-5',
    ];
    const fills = () =>
      tilesOf(canvasElement).map((tile) => resolveColor(getComputedStyle(rectOf(tile)).fill));
    await waitFor(() => expect(fills()).toEqual(tokens.map(themeColor)));
    const html = document.documentElement;
    html.setAttribute('data-accent', 'teal');
    try {
      await waitFor(() => expect(fills()[0]).toBe(resolveColor('#038378')));
    } finally {
      html.removeAttribute('data-accent');
    }
  },
};

/** The labels follow the text size setting: 12px at the normal size, 13.5px at the large one. */
export const TextFollowsTheTextSize: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...Distributed.args, showValues: true, formatValue: tb },
  play: async ({ canvasElement }) => {
    const html = document.documentElement;
    const label = () => px(canvasElement.querySelector('[data-tile] foreignObject > div'));
    await waitFor(() => expect(label()).toBe(12));
    const previous = html.getAttribute('data-text-size');
    try {
      html.setAttribute('data-text-size', 'lg');
      await waitFor(() => expect(label()).toBe(13.5));
      const tile = tilesOf(canvasElement)[0];
      await waitFor(async () => {
        await userEvent.hover(tile);
        expect(px(cardOf(canvasElement))).toBe(13.5);
      });
      await userEvent.unhover(tile);
    } finally {
      if (previous === null) html.removeAttribute('data-text-size');
      else html.setAttribute('data-text-size', previous);
    }
  },
};

/** Markup in a name, a group or a value shows as text: in the label, the tooltip and the names. */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!autodocs'],
  args: {
    showValues: true,
    series: [
      {
        name: HOSTILE,
        data: [
          { x: HOSTILE, y: 8 },
          { x: 'Normal', y: 4 },
        ],
      },
      { name: 'Other', data: [{ x: 'Third', y: 6 }] },
    ],
    formatValue: (v) => `${v} ${HOSTILE}`,
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(tilesOf(canvasElement)).toHaveLength(3));
    const tile = tilesOf(canvasElement)[0];
    await expect(labelOf(tile)).toHaveTextContent(HOSTILE);
    await expectNoInjectedImage(canvasElement);
    await waitFor(async () => {
      await userEvent.hover(tile);
      const card = cardOf(canvasElement);
      expect(card?.querySelector('p')?.textContent).toBe(HOSTILE);
      expect(card?.querySelector('li')?.textContent).toContain(HOSTILE);
    });
    await expectNoInjectedImage(canvasElement);
    await userEvent.unhover(tile);
    await waitFor(() => expect(cardOf(canvasElement)).toBeNull());
  },
};

/** `children` are SVG elements drawn over the tiles, inside the chart. */
export const ChildrenAreDrawnOverTheTiles: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    ...Distributed.args,
    children: (
      <text data-testid="note" x={12} y={310} fill="var(--color-text-muted)">
        Source: inventory
      </text>
    ),
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(tilesOf(canvasElement).length).toBeGreaterThan(0));
    const note = canvasElement.querySelector('[data-testid="note"]');
    await expect(note).toHaveTextContent('Source: inventory');
    await expect(note?.closest('svg')).toBe(canvasElement.querySelector('svg.recharts-surface'));
  },
};

/** A chart wider than its box is cut to it, so a narrow screen never scrolls sideways. */
export const NoHorizontalOverflow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...MultipleSeries.args, width: 900 },
  render: (args) => (
    <div data-testid="box" style={{ width: 375 }}>
      <TreemapChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>('[data-testid="box"]') as HTMLElement;
    await waitFor(() => expect(tilesOf(canvasElement).length).toBeGreaterThan(0));
    await waitFor(() => {
      expect(box.scrollWidth, 'the box scrolls sideways').toBeLessThanOrEqual(box.clientWidth);
      expect(
        canvasElement.querySelector('svg.recharts-surface')?.getBoundingClientRect().width
      ).toBeLessThanOrEqual(375);
    });
    const root = document.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/**
 * The chart is a group named by `ariaLabel` and each tile a named image
 * (`group, name: value`). Keyboard: one tab stop; the arrows walk the tiles in
 * the order of the data, Home and End go to the ends, and the tile with the
 * focus shows its tooltip and a ring. Tab leaves.
 */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...MultipleSeries.args, ariaLabel: 'Racks per datacenter', formatValue: tb },
  play: async ({ canvasElement, args }) => {
    const group = canvasElement.querySelector('[role="group"]') as HTMLElement;
    await expect(group).toHaveAttribute('aria-label', args.ariaLabel);
    await waitFor(() => expect(tilesOf(canvasElement)).toHaveLength(6));
    const tile = (n: number) => tilesOf(canvasElement)[n];
    const stops = () => tilesOf(canvasElement).filter((el) => el.tabIndex === 0);
    const ringed = () => canvasElement.querySelectorAll('[data-tile] rect[fill="none"]').length;
    await expect(tile(0)).toHaveAccessibleName('Paris, compute: 120 TB');
    await expect(stops()).toEqual([tile(0)]);

    await userEvent.tab();
    await expect(tile(0)).toHaveFocus();
    await waitFor(() => expect(cardOf(canvasElement)).toHaveTextContent('compute'));
    await expect(ringed()).toBe(1);
    const press = async (key: string, n: number, text: string) => {
      await userEvent.keyboard(key);
      await expect(tile(n), key).toHaveFocus();
      await expect(stops()).toEqual([tile(n)]);
      await waitFor(() => expect(cardOf(canvasElement)).toHaveTextContent(text));
      await expect(ringed()).toBe(1);
    };
    await press('{ArrowRight}', 1, 'storage');
    await press('{ArrowDown}', 2, 'gpu');
    await press('{ArrowRight}', 3, 'compute');
    await press('{ArrowLeft}', 2, 'gpu');
    await press('{End}', 5, 'network');
    // The end stops the arrows.
    await press('{ArrowRight}', 5, 'network');
    await press('{Home}', 0, 'compute');
    await press('{ArrowUp}', 0, 'compute');

    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
    await waitFor(() => expect(cardOf(canvasElement)).toBeNull());
    await expect(ringed()).toBe(0);
  },
};
