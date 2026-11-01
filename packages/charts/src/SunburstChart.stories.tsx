import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { PANEL, SERIES } from './core/colors';
import {
  contrastRatio,
  expectNoInjectedImage,
  HOSTILE,
  LegendSides,
  NarrowBox,
  switchTheme,
  themeColor,
} from './storybook-recharts';
import { SunburstChart, type SunburstNode } from './SunburstChart';

// Headcount of a company: five divisions, three levels. 313 people.
const ORG: SunburstNode[] = [
  {
    name: 'Engineering',
    children: [
      {
        name: 'Platform',
        children: [
          { name: 'Infra', value: 18 },
          { name: 'Data', value: 14 },
          { name: 'Security', value: 9 },
        ],
      },
      {
        name: 'Product',
        children: [
          { name: 'Web', value: 26 },
          { name: 'Mobile', value: 20 },
          { name: 'Design systems', value: 8 },
        ],
      },
      {
        name: 'Quality',
        children: [
          { name: 'Automation', value: 12 },
          { name: 'Release', value: 7 },
        ],
      },
    ],
  },
  {
    name: 'Sales',
    children: [
      { name: 'EMEA', value: 31 },
      { name: 'Americas', value: 27 },
      { name: 'APAC', value: 16 },
    ],
  },
  {
    name: 'Operations',
    children: [
      { name: 'Support', value: 22 },
      { name: 'Logistics', value: 28 },
      { name: 'Facilities', value: 9 },
    ],
  },
  {
    name: 'People & Finance',
    children: [
      { name: 'HR', value: 11 },
      { name: 'Finance', value: 17 },
      { name: 'Legal', value: 7 },
    ],
  },
  {
    name: 'Design',
    children: [
      { name: 'Brand', value: 12 },
      { name: 'Product design', value: 19 },
    ],
  },
];

const DIVISIONS = ['Engineering', 'Sales', 'Operations', 'People & Finance', 'Design'];
// Engineering, Sales, Operations, People & Finance, Design.
const DIVISION_VALUES = [114, 74, 59, 35, 31];
const TOTAL = 313;

const wideViewport = { viewport: { value: 'laptop', isRotated: false } } as const;

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
    {children}
  </div>
);

const meta = {
  title: 'Charts/Sunburst',
  component: SunburstChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { data: ORG, centerLabel: 'People' },
  decorators: [
    (Story) => (
      <Card>
        <Story />
      </Card>
    ),
  ],
} satisfies Meta<typeof SunburstChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Helpers ──────────────────────────────────────────────────────────────────

const arcs = (root: HTMLElement) => [...root.querySelectorAll<SVGPathElement>('path[data-arc]')];
const arcEl = (root: HTMLElement, id: string) =>
  root.querySelector<SVGPathElement>(`path[data-arc="${id}"]`) as SVGPathElement;
const opacityOf = (root: HTMLElement, id: string) => arcEl(root, id).getAttribute('opacity');
const tooltipOf = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-sunburst-tooltip]');
const centerOf = (root: HTMLElement) =>
  [...(root.querySelector('[data-sunburst-center]')?.children ?? [])].map((el) => el.textContent);
const legendButtons = (root: HTMLElement) => [...root.querySelectorAll('button[aria-pressed]')];
const legendNames = (root: HTMLElement) => legendButtons(root).map((el) => el.textContent);
const ringOf = (root: HTMLElement) => root.querySelector('[data-sunburst-ring]');
const selectedOf = (root: HTMLElement) => root.querySelector('[data-sunburst-selected]');
const labelsOf = (root: HTMLElement) => [
  ...root.querySelectorAll<SVGTextElement>('text[data-arc-label]'),
];
const plotOf = (root: HTMLElement) => root.querySelector('[data-sunburst-plot]') as HTMLElement;
const svgOf = (root: HTMLElement) =>
  root.querySelector('[data-sunburst-plot] svg') as SVGSVGElement;
const sizeOf = (root: HTMLElement) => svgOf(root).getBoundingClientRect().width;
// The visually hidden nested list: the last child of the chart.
const outlineOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[data-sunburst] > div:last-child > ul');
// A click leaves the pointer on the sector and the focus in it. The story tests click with a
// scripted event, which Chromium counts as keyboard focus (a ring and a card); a person's click
// does not. Let go of both before reading what the chart shows at rest.
const release = async (el: Element) => {
  await userEvent.unhover(el);
  (document.activeElement as HTMLElement | null)?.blur();
};
const px = (el: Element | null) => parseFloat(el ? getComputedStyle(el).fontSize : '');

// The ids of the nodes of ORG: the index at each level.
const ID = {
  engineering: '0',
  platform: '0.0',
  infra: '0.0.0',
  data: '0.0.1',
  security: '0.0.2',
  product: '0.1',
  web: '0.1.0',
  quality: '0.2',
  sales: '1',
  emea: '1.0',
  operations: '2',
  people: '3',
  design: '4',
};
// Every node of ORG that has a value: 5 on the first ring, 14 on the second, 8 on the third.
const NODES = 5 + 14 + 8;

// A CSS color in any syntax (color-mix, oklab…) as `#rrggbb`.
const toHex = (color: string) => {
  const context = document.createElement('canvas').getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};
const fillOf = (root: HTMLElement, id: string) => toHex(getComputedStyle(arcEl(root, id)).fill);
const resolved = (color: string) => {
  const probe = document.createElement('div');
  probe.style.background = color;
  document.body.append(probe);
  const hex = toHex(getComputedStyle(probe).backgroundColor);
  probe.remove();
  return hex;
};

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * A hierarchy in rings: the first ring shares the circle by value, each ring
 * after it shares the arc of its parent. A branch has one color, and the rings
 * after the first are lighter steps of it. The center is the total, and the
 * value and name of the sector the pointer or the keyboard is on. A name is
 * written on its arc when it fits whole. The legend lists the first ring.
 */
export const Default: Story = {};

export const DefaultChecks: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(arcs(canvasElement)).toHaveLength(NODES));
    await waitFor(() => expect(svgOf(canvasElement)).not.toBeNull());
    await expect(legendNames(canvasElement)).toEqual(DIVISIONS);
    await expect(centerOf(canvasElement)).toEqual([String(TOTAL), 'People']);
    // The first ring wears the palette, in the order of the data.
    for (const [i, id] of [
      ID.engineering,
      ID.sales,
      ID.operations,
      ID.people,
      ID.design,
    ].entries()) {
      await expect(fillOf(canvasElement, id), id).toBe(resolved(SERIES[i]));
    }
    // The rings after it are lighter steps of the branch, each a step apart.
    const fills = [ID.engineering, ID.platform, ID.infra].map((id) => fillOf(canvasElement, id));
    await expect(new Set(fills).size).toBe(3);
    await expect(fillOf(canvasElement, ID.data)).toBe(fills[2]);
    // A name is on its arc when it fits: Engineering does, a group of 7 people of 313 does not.
    const named = labelsOf(canvasElement).map((el) => el.textContent);
    await expect(named).toContain('Engineering');
    await expect(named).not.toContain('Release');
    // Each label sits inside its own arc.
    for (const label of labelsOf(canvasElement)) {
      const arc = arcEl(canvasElement, label.dataset.arcLabel as string).getBoundingClientRect();
      const text = label.getBoundingClientRect();
      await expect(text.left, label.textContent ?? '').toBeGreaterThanOrEqual(arc.left - 1);
      await expect(text.right, label.textContent ?? '').toBeLessThanOrEqual(arc.right + 1);
      await expect(text.top, label.textContent ?? '').toBeGreaterThanOrEqual(arc.top - 1);
      await expect(text.bottom, label.textContent ?? '').toBeLessThanOrEqual(arc.bottom + 1);
    }
    // The line between sectors is the color of the card.
    await expect(toHex(getComputedStyle(arcEl(canvasElement, ID.sales)).stroke)).toBe(
      resolved(PANEL)
    );
  },
};

/**
 * `onSelect` makes the sectors selectable: a click, or Enter or Space on the
 * one the keyboard is on, selects it and calls `onSelect` with its path; the
 * same again, or Escape, clears it with `[]`. The selected sector keeps its
 * color with the sectors it belongs to and contains; the rest fades.
 */
export const Selectable: Story = {
  args: { onSelect: fn() },
  render: (args) => {
    const [selected, setSelected] = useState<string[]>(['Engineering', 'Platform']);
    return (
      <>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300" data-testid="selected">
          Selected: {selected.length > 0 ? selected.join(' › ') : 'none'}
        </p>
        <SunburstChart
          {...args}
          selected={selected}
          onSelect={(path) => {
            args.onSelect?.(path);
            setSelected(path);
          }}
        />
      </>
    );
  },
};

export const SelectableChecks: Story = {
  ...Selectable,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement, args }) => {
    const selected = () => canvasElement.querySelector('[data-testid="selected"]')?.textContent;
    await waitFor(() => expect(arcs(canvasElement)).toHaveLength(NODES));
    // The initial selection: Platform and its line stay in color.
    await waitFor(() => expect(selectedOf(canvasElement)).not.toBeNull());
    const line = [ID.engineering, ID.platform, ID.infra, ID.data, ID.security];
    for (const arc of arcs(canvasElement)) {
      const id = arc.dataset.arc as string;
      await expect(arc.getAttribute('opacity'), id).toBe(line.includes(id) ? '1' : '0.3');
    }
    await expect(arcEl(canvasElement, ID.platform)).toHaveAttribute('aria-pressed', 'true');
    await expect(arcEl(canvasElement, ID.sales)).toHaveAttribute('aria-pressed', 'false');
    await expect(centerOf(canvasElement)).toEqual(['41', 'Platform', '13% of total']);
    // A click on another sector selects it.
    await userEvent.click(arcEl(canvasElement, ID.sales));
    await waitFor(() => expect(selected()).toBe('Selected: Sales'));
    await expect(args.onSelect).toHaveBeenLastCalledWith(['Sales']);
    await release(arcEl(canvasElement, ID.sales));
    await waitFor(() => expect(opacityOf(canvasElement, ID.engineering)).toBe('0.3'));
    await expect(opacityOf(canvasElement, ID.emea)).toBe('1');
    // The same again clears it, and nothing fades.
    await userEvent.click(arcEl(canvasElement, ID.sales));
    await waitFor(() => expect(selected()).toBe('Selected: none'));
    await expect(args.onSelect).toHaveBeenLastCalledWith([]);
    await release(arcEl(canvasElement, ID.sales));
    await waitFor(() => expect(selectedOf(canvasElement)).toBeNull());
    for (const arc of arcs(canvasElement)) await expect(arc).toHaveAttribute('opacity', '1');
    await expect(centerOf(canvasElement)).toEqual([String(TOTAL), 'People']);
    // A nested sector: the path starts at the first ring.
    await userEvent.click(arcEl(canvasElement, ID.infra));
    await waitFor(() => expect(selected()).toBe('Selected: Engineering › Platform › Infra'));
    await expect(args.onSelect).toHaveBeenLastCalledWith(['Engineering', 'Platform', 'Infra']);
    // Escape clears it too.
    arcEl(canvasElement, ID.infra).focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(selected()).toBe('Selected: none'));
    await expect(args.onSelect).toHaveBeenLastCalledWith([]);
    await release(arcEl(canvasElement, ID.infra));
  },
};

/** Without `onSelect` the sectors only show: hover and focus read them, a click does nothing, and they are images, not buttons. */
export const ReadOnlyChecks: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(arcs(canvasElement)).toHaveLength(NODES));
    for (const arc of arcs(canvasElement)) {
      await expect(arc).toHaveAttribute('role', 'img');
      await expect(arc).not.toHaveAttribute('aria-pressed');
      await expect(getComputedStyle(arc).cursor).not.toBe('pointer');
    }
    await userEvent.click(arcEl(canvasElement, ID.sales));
    await userEvent.keyboard('{Enter}{Escape}');
    await release(arcEl(canvasElement, ID.sales));
    await expect(selectedOf(canvasElement)).toBeNull();
    for (const arc of arcs(canvasElement)) await expect(arc).toHaveAttribute('opacity', '1');
  },
};

/** A `selected` path with no `onSelect` is shown and cannot change: the host marks a sector from outside, as when a table is filtered. */
export const ReadOnlySelectionChecks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { selected: ['Sales'] },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(selectedOf(canvasElement)).not.toBeNull());
    await expect(opacityOf(canvasElement, ID.engineering)).toBe('0.3');
    await expect(opacityOf(canvasElement, ID.emea)).toBe('1');
    await expect(arcEl(canvasElement, ID.sales)).toHaveAttribute('role', 'img');
    await userEvent.click(arcEl(canvasElement, ID.operations));
    await release(arcEl(canvasElement, ID.operations));
    await waitFor(() => expect(opacityOf(canvasElement, ID.sales)).toBe('1'));
    await expect(opacityOf(canvasElement, ID.operations)).toBe('0.3');
  },
};

/**
 * `selected` is controlled: the chart shows the path it is given, and a click
 * calls `onSelect` without moving it until the host passes the new path back.
 * `[]` is no selection.
 */
export const ControlledSelectionChecks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { selected: ['Design'], onSelect: fn() },
  play: async ({ canvasElement, args }) => {
    await waitFor(() => expect(selectedOf(canvasElement)).not.toBeNull());
    await expect(arcEl(canvasElement, ID.design)).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(arcEl(canvasElement, ID.sales));
    await expect(args.onSelect).toHaveBeenLastCalledWith(['Sales']);
    await release(arcEl(canvasElement, ID.sales));
    await expect(arcEl(canvasElement, ID.design)).toHaveAttribute('aria-pressed', 'true');
    await expect(arcEl(canvasElement, ID.sales)).toHaveAttribute('aria-pressed', 'false');
  },
};

/** The path of a selection that is not in the data selects nothing, and fades nothing. */
export const UnknownSelectionChecks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { selected: ['Engineering', 'Nope'], onSelect: fn() },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(arcs(canvasElement)).toHaveLength(NODES));
    await expect(selectedOf(canvasElement)).toBeNull();
    for (const arc of arcs(canvasElement)) await expect(arc).toHaveAttribute('opacity', '1');
  },
};

/** The pointer on a sector fades the sectors that are not on its line, shows its card, and puts its value and name in the center. */
export const HoverReadsASector: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(arcs(canvasElement)).toHaveLength(NODES));
    await userEvent.hover(arcEl(canvasElement, ID.platform));
    await waitFor(() => expect(tooltipOf(canvasElement)).not.toBeNull());
    // A nested sector: the title is its parents, the rows its value and its share of the total.
    const card = tooltipOf(canvasElement) as HTMLElement;
    await expect(card.querySelector('p')?.textContent).toBe('Engineering');
    await expect([...card.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'Platform41',
      'Share of total13%',
    ]);
    const chip = card.querySelector('span[aria-hidden]') as HTMLElement;
    await expect(toHex(getComputedStyle(chip).backgroundColor)).toBe(
      fillOf(canvasElement, ID.platform)
    );
    await expect(centerOf(canvasElement)).toEqual(['41', 'Platform', '13% of total']);
    // On the line: the sector, its parent and its children. Off it: the rest.
    for (const id of [ID.platform, ID.engineering, ID.infra, ID.data, ID.security]) {
      await expect(opacityOf(canvasElement, id), id).toBe('1');
    }
    for (const id of [ID.product, ID.web, ID.sales, ID.emea, ID.design]) {
      await expect(opacityOf(canvasElement, id), id).toBe('0.3');
    }
    // A label fades with its arc.
    const label = labelsOf(canvasElement).find((el) => el.textContent === 'Sales');
    await expect(label).toHaveAttribute('opacity', '0.3');
    await userEvent.unhover(arcEl(canvasElement, ID.platform));
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
    for (const arc of arcs(canvasElement)) await expect(arc).toHaveAttribute('opacity', '1');
    await expect(centerOf(canvasElement)).toEqual([String(TOTAL), 'People']);
    // A sector of the first ring has no parents: no title.
    await userEvent.hover(arcEl(canvasElement, ID.sales));
    await waitFor(() => expect(tooltipOf(canvasElement)).not.toBeNull());
    await expect(tooltipOf(canvasElement)?.querySelector('p')).toBeNull();
    await expect(tooltipOf(canvasElement)?.textContent).toBe('Sales74Share of total24%');
    await userEvent.unhover(arcEl(canvasElement, ID.sales));
  },
};

/**
 * `centerValue` and `centerLabel` replace the total and "Total" while nothing is
 * hovered or selected; the card stays inside the plot.
 */
export const CustomCenter: Story = {
  args: { centerValue: '313 FTE', centerLabel: 'Headcount' },
};

export const CustomCenterChecks: Story = {
  ...CustomCenter,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(centerOf(canvasElement)).toEqual(['313 FTE', 'Headcount']));
    await userEvent.hover(arcEl(canvasElement, ID.web));
    await waitFor(() => expect(centerOf(canvasElement)).toEqual(['26', 'Web', '8% of total']));
    // The card hangs inside the box of the chart.
    const card = (
      tooltipOf(canvasElement) as HTMLElement
    ).firstElementChild?.getBoundingClientRect();
    const plot = plotOf(canvasElement).getBoundingClientRect();
    await expect((card as DOMRect).left).toBeGreaterThanOrEqual(plot.left - 1);
    await expect((card as DOMRect).right).toBeLessThanOrEqual(plot.right + 1);
    await userEvent.unhover(arcEl(canvasElement, ID.web));
    await waitFor(() => expect(centerOf(canvasElement)).toEqual(['313 FTE', 'Headcount']));
  },
};

/** `formatValue` formats the center, the card, the legend and the names screen readers read. */
export const FormattedValues: Story = {
  args: { formatValue: (value) => `${value} FTE`, legendValues: true },
};

export const FormattedValuesChecks: Story = {
  ...FormattedValues,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(centerOf(canvasElement)[0]).toBe('313 FTE'));
    await expect(arcEl(canvasElement, ID.platform)).toHaveAttribute(
      'aria-label',
      'Engineering, Platform: 41 FTE, 36% of Engineering'
    );
    await userEvent.hover(arcEl(canvasElement, ID.platform));
    await waitFor(() => expect(tooltipOf(canvasElement)?.textContent).toContain('41 FTE'));
    await userEvent.unhover(arcEl(canvasElement, ID.platform));
    await expect(legendButtons(canvasElement)[0].textContent).toBe('Engineering114 FTE36%');
  },
};

/**
 * `legendValues` writes each branch's value and its share of the total in the
 * legend, in whole percents that add up to 100. A click on a branch hides it
 * and gives its share of the circle to the others, which keep their colors and
 * their figures.
 */
export const LegendWithValues: Story = {
  args: { legendValues: true },
};

export const LegendWithValuesChecks: Story = {
  ...LegendWithValues,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(arcs(canvasElement)).toHaveLength(NODES));
    await expect(legendButtons(canvasElement)).toHaveLength(5);
    const figures = () =>
      legendButtons(canvasElement).map((button) =>
        [...button.querySelectorAll('span:not([aria-hidden])')].map((el) => el.textContent)
      );
    const shares = ['36%', '24%', '19%', '11%', '10%'];
    await expect(figures()).toEqual(
      DIVISIONS.map((name, i) => [name, String(DIVISION_VALUES[i]), shares[i]])
    );
    // Hide Sales: the others share the circle, and the figures do not move.
    const first = fillOf(canvasElement, ID.operations);
    await userEvent.click(legendButtons(canvasElement)[1]);
    await waitFor(() => expect(arcEl(canvasElement, ID.sales)).toBeNull());
    await expect(legendButtons(canvasElement)[1]).toHaveAttribute('aria-pressed', 'false');
    await expect(centerOf(canvasElement)).toEqual(['239', 'People']);
    await expect(figures()).toEqual(
      DIVISIONS.map((name, i) => [name, String(DIVISION_VALUES[i]), shares[i]])
    );
    await expect(arcs(canvasElement)).toHaveLength(NODES - 4);
    // The branch keeps its color when the ones before it go.
    await expect(fillOf(canvasElement, ID.operations)).toBe(first);
    await userEvent.click(legendButtons(canvasElement)[1]);
    await waitFor(() => expect(arcs(canvasElement)).toHaveLength(NODES));
    await expect(centerOf(canvasElement)).toEqual([String(TOTAL), 'People']);
  },
};

/** The first ring takes `colors`, cycling when there are fewer than branches; the rings after it are lighter steps of the same color. */
export const CustomColors: Story = {
  args: { colors: ['#e11d48', '#0ea5e9'] },
};

export const CustomColorsChecks: Story = {
  ...CustomColors,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(arcs(canvasElement)).toHaveLength(NODES));
    const colors = [ID.engineering, ID.sales, ID.operations, ID.people, ID.design].map((id) =>
      fillOf(canvasElement, id)
    );
    await expect(colors).toEqual(['#e11d48', '#0ea5e9', '#e11d48', '#0ea5e9', '#e11d48']);
    await expect(fillOf(canvasElement, ID.platform)).not.toBe('#e11d48');
    await expect(
      legendButtons(canvasElement).map((button) =>
        toHex(getComputedStyle(button.firstElementChild as Element).backgroundColor)
      )
    ).toEqual(colors);
  },
};

/** One level is a donut: the ring is as thick as the room allows. Allowed, not encouraged: `DonutChart` is lighter. */
export const OneLevel: Story = {
  args: { data: ORG.map(({ name }, i) => ({ name, value: DIVISION_VALUES[i] })) },
};

/** Four levels read well: the rings share the room, so each is thinner. */
export const FourLevels: Story = {
  args: {
    data: [
      {
        name: 'Engineering',
        children: [
          {
            name: 'Platform',
            children: [
              {
                name: 'Infra',
                children: [
                  { name: 'Network', value: 6 },
                  { name: 'Compute', value: 8 },
                  { name: 'Storage', value: 4 },
                ],
              },
              {
                name: 'Data',
                children: [
                  { name: 'Pipelines', value: 9 },
                  { name: 'BI', value: 5 },
                ],
              },
            ],
          },
          {
            name: 'Product',
            children: [
              { name: 'Web', value: 26 },
              { name: 'Mobile', value: 20 },
            ],
          },
        ],
      },
      {
        name: 'Sales',
        children: [
          { name: 'EMEA', value: 31 },
          { name: 'Americas', value: 27 },
        ],
      },
      { name: 'Operations', value: 30 },
    ],
  },
};

export const FourLevelsChecks: Story = {
  ...FourLevels,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(arcs(canvasElement)).toHaveLength(16));
    // Deeper than the third ring wears the lightest step.
    await expect(fillOf(canvasElement, '0.0.0.0')).toBe(fillOf(canvasElement, '0.0.0'));
    await expect(fillOf(canvasElement, '0.0.0')).not.toBe(fillOf(canvasElement, '0.0'));
    await expect(centerOf(canvasElement)[0]).toBe('166');
  },
};

/**
 * What cannot be drawn is left out: a value that is zero, negative or not a
 * number, a node with no value and no children, and a branch whose children
 * have none. A value on a node with children is ignored: the children win.
 */
export const LeavesOutWhatItCannotDraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    centerLabel: undefined,
    data: [
      {
        name: 'A',
        value: 999,
        children: [
          { name: 'a1', value: 3 },
          { name: 'a2', value: 1 },
        ],
      },
      { name: 'zero', value: 0 },
      { name: 'negative', value: -4 },
      { name: 'nan', value: Number.NaN },
      { name: 'none' },
      { name: 'hollow', children: [{ name: 'x', value: 0 }, { name: 'y' }] },
      { name: 'B', value: 4 },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(arcs(canvasElement)).toHaveLength(4));
    await expect(arcs(canvasElement).map((arc) => arc.dataset.arc)).toEqual([
      '0',
      '0.0',
      '0.1',
      '6',
    ]);
    await expect(centerOf(canvasElement)).toEqual(['8', 'Total']);
    // The legend lists what is drawn, and counts the first ring by its children.
    await expect(legendNames(canvasElement)).toEqual(['A', 'B']);
    // The hidden outline lists what is drawn, with the sums.
    await expect(outlineOf(canvasElement)?.textContent).toBe('A: 4a1: 3a2: 1B: 4');
  },
};

/** The hidden outline is the reading path: every node with its value, children nested under their parent. */
export const HiddenOutlineListsTheHierarchy: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(arcs(canvasElement)).toHaveLength(NODES));
    const outline = outlineOf(canvasElement) as HTMLElement;
    await expect(outline).not.toBeNull();
    const top = [...outline.children].map((li) => li.firstChild?.textContent);
    await expect(top).toEqual(DIVISIONS.map((name, i) => `${name}: ${DIVISION_VALUES[i]}`));
    const platform = outline.querySelector('li > ul > li') as HTMLElement;
    await expect(platform.firstChild?.textContent).toBe('Platform: 41');
    await expect(
      [...platform.querySelectorAll('li')].map((li) => li.firstChild?.textContent)
    ).toEqual(['Infra: 18', 'Data: 14', 'Security: 9']);
    // Visually hidden, yet in the accessibility tree.
    const { width, height } = (outline.parentElement as HTMLElement).getBoundingClientRect();
    await expect(Math.max(width, height)).toBeLessThanOrEqual(1);
    await expect(outline.parentElement).not.toHaveAttribute('aria-hidden');
  },
};

/**
 * One tab stop for the circle. Left and Right go to the previous and the next
 * sibling, clockwise, Down to the first child (outward) and Up to the parent
 * (inward), Home and End to the first and the last sector of the ring. Each
 * sector is named by its path, its value and its share of its parent. Enter,
 * Space and Escape do what a click does.
 */
export const KeyboardWalksTheRings: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onSelect: fn() },
  play: async ({ canvasElement, args }) => {
    await waitFor(() => expect(arcs(canvasElement)).toHaveLength(NODES));
    await expect(arcs(canvasElement).filter((arc) => arc.tabIndex === 0)).toHaveLength(1);
    const on = (id: string) =>
      waitFor(() => {
        expect(document.activeElement).toBe(arcEl(canvasElement, id));
        expect(ringOf(canvasElement)).not.toBeNull();
        expect(tooltipOf(canvasElement)).not.toBeNull();
      });
    await userEvent.tab();
    await on(ID.engineering);
    await expect(tooltipOf(canvasElement)?.textContent).toBe('Engineering114Share of total36%');
    // The ring is on the sector, in the text color.
    await expect(ringOf(canvasElement)?.getAttribute('d')).toBe(
      arcEl(canvasElement, ID.engineering).getAttribute('d')
    );
    const walk: [key: string, id: string][] = [
      ['{ArrowRight}', ID.sales],
      ['{ArrowRight}', ID.operations],
      ['{ArrowLeft}', ID.sales],
      ['{ArrowLeft}', ID.engineering],
      ['{ArrowLeft}', ID.engineering],
      ['{ArrowDown}', ID.platform],
      ['{ArrowDown}', ID.infra],
      ['{ArrowRight}', ID.data],
      ['{ArrowRight}', ID.security],
      ['{ArrowRight}', ID.security],
      ['{ArrowUp}', ID.platform],
      ['{ArrowRight}', ID.product],
      ['{End}', '4.1'],
      ['{Home}', ID.platform],
      ['{ArrowUp}', ID.engineering],
      ['{ArrowUp}', ID.engineering],
      ['{End}', ID.design],
      ['{Home}', ID.engineering],
    ];
    for (const [key, id] of walk) {
      await userEvent.keyboard(key);
      await on(id);
    }
    // A leaf has no child: Down stays.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    await on(ID.infra);
    await userEvent.keyboard('{ArrowDown}');
    await on(ID.infra);
    await expect(arcEl(canvasElement, ID.infra)).toHaveAttribute(
      'aria-label',
      'Engineering, Platform, Infra: 18, 44% of Platform'
    );
    await expect(arcEl(canvasElement, ID.engineering)).toHaveAttribute(
      'aria-label',
      'Engineering: 114, 36% of total'
    );
    // Enter and Space select, Escape clears.
    await userEvent.keyboard('{Enter}');
    await expect(args.onSelect).toHaveBeenLastCalledWith(['Engineering', 'Platform', 'Infra']);
    await userEvent.keyboard('{ArrowRight} ');
    await expect(args.onSelect).toHaveBeenLastCalledWith(['Engineering', 'Platform', 'Data']);
    await userEvent.keyboard('{Escape}');
    await expect(args.onSelect).toHaveBeenLastCalledWith([]);
    // The tab stop is where the keyboard left it, and the card goes when it leaves the circle.
    await userEvent.tab();
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
    await expect(ringOf(canvasElement)).toBeNull();
    await userEvent.tab({ shift: true });
    await on(ID.data);
    await userEvent.tab();
  },
};

/** `ariaLabel` names the chart for screen readers; without one, the branches name it. */
export const AccessibleName: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ariaLabel: 'Headcount by division, team and group' },
  play: async ({ canvasElement }) => {
    const group = () => canvasElement.querySelector('[data-sunburst]') as HTMLElement;
    await waitFor(() =>
      expect(group()).toHaveAttribute('aria-label', 'Headcount by division, team and group')
    );
    await expect(group()).toHaveAttribute('role', 'group');
  },
};

export const DefaultNameChecks: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-sunburst]')).toHaveAttribute(
        'aria-label',
        `Sunburst chart: ${DIVISIONS.join(', ')}`
      )
    );
  },
};

/** The four sides: the legend takes its room from the plot, on a wide screen. */
export const LegendSidesStory: Story = {
  name: 'Legend sides',
  tags: ['!autodocs'],
  globals: wideViewport,
  render: (args) => (
    <LegendSides>{(side) => <SunburstChart {...args} legendPosition={side} />}</LegendSides>
  ),
};

export const LegendSidesChecks: Story = {
  ...LegendSidesStory,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      const chart = canvasElement.querySelector(`[data-side="${side}"]`) as HTMLElement;
      await waitFor(() => {
        const plot = chart.querySelector('[data-sunburst-plot] svg');
        const legend = chart.querySelector('ul')?.parentElement;
        expect(plot, side).toBeTruthy();
        expect(legend, side).toBeTruthy();
        const l = (legend as Element).getBoundingClientRect();
        const p = (plot as Element).getBoundingClientRect();
        const outside = {
          top: l.bottom <= p.top + 1,
          bottom: l.top >= p.bottom - 1,
          left: l.right <= p.left + 1,
          right: l.left >= p.right - 1,
        };
        expect(
          outside[side],
          `${side}: legend ${JSON.stringify(l)}, plot ${JSON.stringify(p)}`
        ).toBe(true);
      });
    }
  },
};

/** The circle is as wide as its box, up to 380px; on a wide screen the legend sits beside it, and the pair is centered. */
export const OnWideScreen: Story = {
  tags: ['!autodocs'],
  args: { legendValues: true },
  globals: wideViewport,
};

export const OnWideScreenChecks: Story = {
  ...OnWideScreen,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(svgOf(canvasElement)).not.toBeNull());
    await waitFor(() => expect(sizeOf(canvasElement)).toBeCloseTo(380, 0));
    const legend = canvasElement.querySelector('ul')?.parentElement as HTMLElement;
    await expect(legend.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      svgOf(canvasElement).getBoundingClientRect().right - 1
    );
  },
};

/** In a box of 375px the circle takes the width, and the legend goes under it, with its figures. */
export const OnNarrowScreen: Story = {
  tags: ['!autodocs'],
  args: { legendValues: true },
  render: (args) => (
    <NarrowBox>
      <SunburstChart {...args} />
    </NarrowBox>
  ),
};

export const OnNarrowScreenChecks: Story = {
  ...OnNarrowScreen,
  tags: ['!dev', '!autodocs'],
  play: async (context) => {
    const root = context.canvasElement;
    await waitFor(() => expect(svgOf(root)).not.toBeNull());
    await waitFor(() => expect(sizeOf(root)).toBeGreaterThan(300));
    await expect(sizeOf(root)).toBeLessThanOrEqual(375);
    // The legend wrapped under the circle: a side legend does not squeeze it.
    const legend = root.querySelector('ul')?.parentElement as HTMLElement;
    await expect(legend.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      svgOf(root).getBoundingClientRect().bottom - 1
    );
    const box = root.querySelector('[data-testid="box"]') as HTMLElement;
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    const html = document.documentElement;
    await expect(html.scrollWidth).toBeLessThanOrEqual(html.clientWidth);
    await expect(legendButtons(root)).toHaveLength(5);
  },
};

/** `height` sets the height of the whole chart: the circle takes what the legend leaves. */
export const FixedHeight: Story = {
  tags: ['!dev', '!autodocs'],
  args: { height: 300, legendPosition: 'bottom' },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-sunburst]') as HTMLElement;
    await waitFor(() => expect(svgOf(canvasElement)).not.toBeNull());
    await expect(root.getBoundingClientRect().height).toBeCloseTo(300, 0);
    await waitFor(() => {
      const svg = svgOf(canvasElement).getBoundingClientRect();
      const legend = (
        canvasElement.querySelector('ul')?.parentElement as HTMLElement
      ).getBoundingClientRect();
      expect(svg.bottom).toBeLessThanOrEqual(legend.top + 1);
      expect(legend.bottom).toBeLessThanOrEqual(root.getBoundingClientRect().bottom + 1);
    });
  },
};

/** No data: `emptyMessage` in place of the circle, and nothing around it. */
export const Empty: Story = {
  args: { data: [] },
};

export const EmptyChecks: Story = {
  ...Empty,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-chart-empty]')?.textContent).toBe('No data')
    );
    await expect(canvasElement.querySelector('svg')).toBeNull();
    await expect(canvasElement.querySelector('button')).toBeNull();
  },
};

export const EmptyWhenNothingHasAValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    data: [
      { name: 'A', value: 0 },
      { name: 'B', children: [{ name: 'b', value: -1 }] },
    ],
    emptyMessage: 'Nobody here',
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-chart-empty]')?.textContent).toBe('Nobody here')
    );
  },
};

/** Names, the center and the values are React text: markup in them shows as written. */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    data: [
      {
        name: HOSTILE,
        children: [
          { name: `${HOSTILE} child`, value: 40 },
          { name: 'b', value: 20 },
        ],
      },
      { name: 'Other', value: 30 },
    ],
    centerLabel: HOSTILE,
    centerValue: HOSTILE,
    formatValue: (value) => `${value} ${HOSTILE}`,
    legendValues: true,
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(arcs(canvasElement)).toHaveLength(4));
    await expectNoInjectedImage(canvasElement);
    await expect(centerOf(canvasElement)).toEqual([HOSTILE, HOSTILE]);
    await userEvent.hover(arcEl(canvasElement, '0.0'));
    await waitFor(() => {
      const card = tooltipOf(canvasElement)?.textContent;
      expect(card).toContain(`${HOSTILE} child`);
      expect(card).toContain(`40 ${HOSTILE}`);
    });
    await expectNoInjectedImage(canvasElement);
    await userEvent.unhover(arcEl(canvasElement, '0.0'));
    await expect(legendButtons(canvasElement)[0].textContent).toContain(HOSTILE);
    await expect(arcEl(canvasElement, '0.0')).toHaveAttribute(
      'aria-label',
      `${HOSTILE}, ${HOSTILE} child: 40 ${HOSTILE}, 67% of ${HOSTILE}`
    );
    await expectNoInjectedImage(canvasElement);
    // The outline too.
    await expect(outlineOf(canvasElement)?.querySelector('li')?.firstChild?.textContent).toBe(
      `${HOSTILE}: 60 ${HOSTILE}`
    );
  },
};

/**
 * The colors are CSS variables: a theme or accent switch repaints the circle
 * with no redraw. The first ring wears the accent and the hues after it, the
 * rings after the first are lighter mixes with the card, and in every theme
 * the last ring stays 1.5:1 or more apart from the card.
 */
export const RepaintsWithThemeAndAccent: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(arcs(canvasElement)).toHaveLength(NODES));
    const html = document.documentElement;
    const lastRing = [ID.infra, '0.1.0', '0.2.0', ID.emea, '2.0', '3.0', '4.0'];
    const panel = () => toHex(themeColor('--color-bg-panel'));
    await waitFor(() =>
      expect(fillOf(canvasElement, ID.engineering)).toBe(toHex(themeColor('--color-brand-500')))
    );
    for (const theme of ['', 'sand', 'dark', 'deep-blue']) {
      const restore = switchTheme(theme);
      try {
        for (const accent of ['blue', 'teal', 'violet', 'amber']) {
          html.setAttribute('data-accent', accent);
          const where = `${theme || 'light'} ${accent}`;
          await waitFor(() =>
            expect(fillOf(canvasElement, ID.engineering), where).toBe(
              toHex(themeColor('--color-brand-500'))
            )
          );
          // The second branch is the second hue of the palette, whatever the accent skips.
          await expect(fillOf(canvasElement, ID.sales), where).toBe(
            toHex(themeColor('--color-chart-2'))
          );
          for (const id of lastRing) {
            await expect(
              contrastRatio(fillOf(canvasElement, id), panel()),
              `${where} ${id}`
            ).toBeGreaterThanOrEqual(1.5);
          }
          await expect(toHex(getComputedStyle(arcEl(canvasElement, ID.sales)).stroke), where).toBe(
            panel()
          );
        }
      } finally {
        html.removeAttribute('data-accent');
        restore();
      }
    }
  },
};

/** The legend, the card, the center and the names on the arcs follow the text size setting. */
export const TextFollowsTextSize: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const html = document.documentElement;
    const previous = html.getAttribute('data-text-size');
    const legendSize = () => px(canvasElement.querySelector('ul button'));
    const centerSize = () => px(canvasElement.querySelector('[data-sunburst-center] div'));
    const labelSize = () => px(labelsOf(canvasElement)[0]);
    await waitFor(() => expect(labelsOf(canvasElement).length).toBeGreaterThan(0));
    await waitFor(() => expect(legendSize()).toBe(12));
    await expect(centerSize()).toBe(24);
    await expect(labelSize()).toBe(12);
    try {
      html.setAttribute('data-text-size', 'lg');
      await waitFor(() => expect(legendSize()).toBe(13.5));
      await waitFor(() => expect(centerSize()).toBeGreaterThan(24));
      await waitFor(() => expect(labelSize()).toBe(13.5));
    } finally {
      if (previous === null) html.removeAttribute('data-text-size');
      else html.setAttribute('data-text-size', previous);
    }
  },
};

/** The circle keeps its left-to-right layout in a right-to-left page: the first ring starts at twelve o'clock and turns clockwise. */
export const KeepsItsDirection: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(arcs(canvasElement)).toHaveLength(NODES));
    const root = canvasElement.querySelector('[data-sunburst]') as HTMLElement;
    await expect(getComputedStyle(root).direction).toBe('ltr');
    // Engineering, over a third of the circle from twelve o'clock, is on the right half.
    const circle = svgOf(canvasElement).getBoundingClientRect();
    const engineering = arcEl(canvasElement, ID.engineering).getBoundingClientRect();
    await expect(engineering.left + engineering.width / 2).toBeGreaterThan(
      circle.left + circle.width / 2
    );
    await expect(engineering.top).toBeLessThan(circle.top + circle.height / 2);
  },
};

/** The chips of the legend are the first colors of the palette, as the page resolves them. */
export const LegendChipsAreTheSeries: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(legendButtons(canvasElement)).toHaveLength(5));
    const chips = legendButtons(canvasElement).map((button) =>
      toHex(getComputedStyle(button.firstElementChild as Element).backgroundColor)
    );
    await expect(chips).toEqual(SERIES.slice(0, 5).map((color) => resolved(color)));
  },
};
