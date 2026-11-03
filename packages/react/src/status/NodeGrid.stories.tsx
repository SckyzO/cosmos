import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectFocusRing,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  keyToEnd,
  keyToStart,
  mobileViewport,
  portalDocsParams,
  withCanvasPadding,
} from '../storybook-helpers';
import { NodeGrid, type NodeGridProps } from './NodeGrid';
import type { NodeGridGroup } from './nodeGridModel';
import type { HealthStatus } from './types';

// ── Data ─────────────────────────────────────────────────────────────────────

// A seeded generator: the same grid on every run, in every capture.
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

const DETAIL = {
  CRIT: ['No answer for 3 checks', 'Disk 98% full', 'Power supply lost', 'Fan failure'],
  WARN: ['Load above 8 for 15 minutes', 'Temperature 78 °C', 'Memory 91% used'],
  OK: ['Up 41 days'],
} as const;

// Three rooms, 136 nodes: 40 critical, 19 warning, 77 OK.
const ROOMS = [
  { id: 'a', label: 'Room A', total: 72, crit: 30, warn: 12 },
  { id: 'b', label: 'Room B', total: 40, crit: 8, warn: 5 },
  { id: 'c', label: 'Room C', total: 24, crit: 2, warn: 2 },
];

const GROUPS: NodeGridGroup[] = (() => {
  const random = seeded(7);
  return ROOMS.map(({ id, label, total, crit, warn }) => {
    const statuses = Array.from({ length: total }, (_, index): 'CRIT' | 'WARN' | 'OK' =>
      index < crit ? 'CRIT' : index < crit + warn ? 'WARN' : 'OK'
    );
    for (let index = statuses.length - 1; index > 0; index -= 1) {
      const other = Math.floor(random() * (index + 1));
      [statuses[index], statuses[other]] = [statuses[other]!, statuses[index]!];
    }
    return {
      id,
      label,
      nodes: statuses.map((status, index) => {
        const number = String(index + 1).padStart(2, '0');
        const details = DETAIL[status];
        return {
          id: `${id}-${number}`,
          label: `node-${id}-${number}`,
          status,
          detail: details[index % details.length],
        };
      }),
    };
  });
})();

const ALL_NODES = GROUPS.flatMap((group) => group.nodes);
const firstWith = (status: HealthStatus) => ALL_NODES.find((node) => node.status === status)!;
const nameOf = (node: (typeof ALL_NODES)[number], word: string) => `${node.label}, ${word}`;

const SHAPES = { CRIT: 'square', WARN: 'diamond', OK: 'circle' } as const;

const meta = {
  title: 'Monitoring/Node Grid',
  component: NodeGrid,
  parameters: portalDocsParams.md(),
  decorators: [withCanvasPadding],
  tags: ['autodocs'],
  args: { groups: GROUPS, title: 'Node health' },
} satisfies Meta<typeof NodeGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * Three rooms and 136 nodes, one mark each, in the order given. The counts at the end of the
 * header come from every node. Hover or focus a node for its tooltip.
 */
export const Default: Story = {};

/**
 * `show="alerting"` draws the nodes that are not OK, as an operations card does. The 77 OK nodes
 * are still counted in the header, and a room with nothing to show is left out.
 */
export const AlertingOnly: Story = { args: { show: 'alerting' } };

/**
 * `marks` picks the shape of each status: here critical stays a square, warning is a diamond
 * and OK is a circle, so the grid reads without the colors. Every status is a square until
 * the host says otherwise.
 */
export const Shapes: Story = { args: { marks: SHAPES } };

/** `legend` adds one entry per status in the grid, each with its mark. */
export const WithLegend: Story = { args: { marks: SHAPES, legend: true } };

const SelectableDemo = (args: NodeGridProps) => {
  const [picked, setPicked] = useState<string>();
  return (
    <div className="space-y-3">
      <NodeGrid
        {...args}
        onNodeSelect={(node, group) => setPicked(`${node.label ?? node.id} in ${group.label}`)}
      />
      <p className="m-0 text-sm text-[var(--color-text-secondary)]">
        {picked ? `Opened ${picked}` : 'Pick a node'}
      </p>
    </div>
  );
};

/** `onNodeSelect` makes every node a button, called with the node and its group. */
export const Selectable: Story = {
  args: { show: 'alerting' },
  render: (args) => <SelectableDemo {...args} />,
};

/** With `show="alerting"` and every node OK, the card says so. */
export const Empty: Story = {
  args: {
    show: 'alerting',
    groups: GROUPS.map((group) => ({
      ...group,
      nodes: group.nodes.map((node) => ({ ...node, status: 'OK' as const })),
    })),
  },
};

/** `maxHeight` scrolls the groups inside the card; the header and the legend stay in view. */
export const MaxHeight: Story = { args: { maxHeight: 160, legend: true } };

// One node of each status.
const EVERY_STATUS: NodeGridGroup[] = [
  {
    id: 'every',
    label: 'Every status',
    nodes: (['CRIT', 'WARN', 'UNKNOWN', 'INFO', 'OK'] as const).flatMap((status) =>
      Array.from({ length: 4 }, (_, index) => ({
        id: `${status}-${index}`,
        label: `${status.toLowerCase()}-${index + 1}`,
        status,
      }))
    ),
  },
];

/** The five statuses, as squares: unknown is grey and info is blue. */
export const EveryStatus: Story = { args: { groups: EVERY_STATUS, legend: true } };

/**
 * `labels` writes the counts and the statuses in another language: the words after the counts,
 * and the status in a node's name, its tooltip and the legend.
 */
export const Translated: Story = {
  args: {
    title: 'Santé des nœuds',
    ariaLabel: 'Santé des nœuds',
    groups: GROUPS.map((group) => ({ ...group, label: group.label.replace('Room', 'Salle') })),
    marks: SHAPES,
    legend: true,
    labels: {
      counts: { CRIT: 'CRIT', WARN: 'ALERTE', OK: 'OK' },
      statuses: { CRIT: 'Critique', WARN: 'Avertissement', OK: 'OK' },
    },
  },
};

/** At 375px the marks wrap in the card and the page does not scroll sideways. */
export const Mobile: Story = {
  globals: mobileViewport,
  args: { marks: SHAPES, legend: true },
};

// ── Tests ────────────────────────────────────────────────────────────────────

const nodesOf = (root: ParentNode) => Array.from(root.querySelectorAll<HTMLElement>('[data-node]'));
const body = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);
const centre = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

/** The header counts every node, worst first, and each room is a list of its nodes. */
export const CountsAndGroups: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    await expect(nodesOf(canvasElement)).toHaveLength(136);
    const counts = ['40 CRIT', '19 WARN', '77 OK'].map((text) => canvas.getByText(text));
    // Worst first: critical, warning, then OK.
    await expect(counts[0]!.compareDocumentPosition(counts[1]!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    await expect(counts[1]!.compareDocumentPosition(counts[2]!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    await expect(canvas.getByText('Node health')).toBeVisible();
    for (const [name, size] of [
      ['Room A', 72],
      ['Room B', 40],
      ['Room C', 24],
    ] as const) {
      const list = canvas.getByRole('list', { name });
      await expect(within(list).getAllByRole('listitem')).toHaveLength(size);
    }
  },
};

/** Critical and warning are written only above 0, OK always; `showCounts` hides them all. */
export const CountsAppearWhenAboveZero: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="space-y-4">
      <NodeGrid
        {...args}
        ariaLabel="Healthy"
        groups={[{ id: 'a', label: 'Room A', nodes: [{ id: 'n1', status: 'OK' }] }]}
      />
      <NodeGrid
        {...args}
        ariaLabel="Warning only"
        groups={[
          {
            id: 'a',
            label: 'Room A',
            nodes: [
              { id: 'n1', status: 'OK' },
              { id: 'n2', status: 'WARN' },
            ],
          },
        ]}
      />
      <NodeGrid {...args} ariaLabel="Hidden" showCounts={false} />
      <NodeGrid {...args} ariaLabel="Nothing" title={undefined} groups={[]} />
    </div>
  ),
  play: async ({ canvas }) => {
    const healthy = within(canvas.getByRole('group', { name: 'Healthy' }));
    await expect(healthy.getByText('1 OK')).toBeVisible();
    await expect(healthy.queryByText(/CRIT|WARN/)).toBeNull();
    const warning = within(canvas.getByRole('group', { name: 'Warning only' }));
    await expect(warning.getByText('1 WARN')).toBeVisible();
    await expect(warning.getByText('1 OK')).toBeVisible();
    await expect(warning.queryByText(/CRIT/)).toBeNull();
    const hidden = within(canvas.getByRole('group', { name: 'Hidden' }));
    await expect(hidden.getByText('Node health')).toBeVisible();
    await expect(hidden.queryByText(/ OK$/)).toBeNull();
    // Nothing at all: "0 OK", and no title.
    await expect(
      within(canvas.getByRole('group', { name: 'Nothing' })).getByText('0 OK')
    ).toBeVisible();
  },
};

/** Only the nodes that are not OK are drawn, the OK ones still counted, healthy rooms dropped. */
export const AlertingOnlyDrawsTheNodesThatNeedALook: Story = {
  ...AlertingOnly,
  tags: ['!dev', '!autodocs'],
  args: {
    show: 'alerting',
    groups: [
      ...GROUPS,
      { id: 'd', label: 'Room D', nodes: [{ id: 'd-01', status: 'OK' as const }] },
    ],
  },
  play: async ({ canvas, canvasElement }) => {
    const nodes = nodesOf(canvasElement);
    await expect(nodes).toHaveLength(59);
    for (const node of nodes) {
      await expect(node.getAttribute('aria-label')).toMatch(/, (Critical|Warning)$/);
    }
    await expect(canvas.getByText('40 CRIT')).toBeVisible();
    await expect(canvas.getByText('19 WARN')).toBeVisible();
    // The header counts the 77 OK nodes of the rooms and the one of the healthy room.
    await expect(canvas.getByText('78 OK')).toBeVisible();
    await expect(
      within(canvas.getByRole('list', { name: 'Room A' })).getAllByRole('listitem')
    ).toHaveLength(42);
    await expect(canvas.queryByText('Room D')).toBeNull();
  },
};

/** A node is named by its label and its status in words, with no shape or color needed. */
export const NodesAreNamedWithTheirStatus: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    for (const [status, word] of [
      ['CRIT', 'Critical'],
      ['WARN', 'Warning'],
      ['OK', 'OK'],
    ] as const) {
      await expect(
        canvas.getByRole('img', { name: nameOf(firstWith(status), word) })
      ).toBeVisible();
    }
    // Every node, all squares: the status is in the name of each.
    for (const node of nodesOf(canvasElement)) {
      await expect(node.getAttribute('aria-label')).toMatch(
        /^node-[abc]-\d\d, (Critical|Warning|OK)$/
      );
    }
  },
};

/** Every mark is a 16px square, 4px from the next, until `marks` says otherwise. */
export const MarksAreSquaresByDefault: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const nodes = nodesOf(canvasElement);
    for (const node of nodes) {
      const mark = node.firstElementChild!;
      const style = getComputedStyle(mark);
      await expect(node.getBoundingClientRect().width).toBe(16);
      await expect(node.getBoundingClientRect().height).toBe(16);
      await expect((mark as HTMLElement).offsetWidth).toBe(16);
      await expect(style.rotate).toBe('none');
      await expect(parseFloat(style.borderTopLeftRadius)).toBeLessThan(4);
    }
    const [first, second] = nodes.map((node) => node.getBoundingClientRect()) as [DOMRect, DOMRect];
    await expect(
      Math.min(Math.abs(second.left - first.right), Math.abs(first.left - second.right))
    ).toBe(4);
  },
};

/** `marks` gives each status its own shape: a square, a rotated diamond, a circle. */
export const MarksTakeTheShapeOfTheirStatus: Story = {
  ...Shapes,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const markOf = (status: HealthStatus, word: string) =>
      canvas.getByRole('img', { name: nameOf(firstWith(status), word) })
        .firstElementChild as HTMLElement;
    const crit = markOf('CRIT', 'Critical');
    const warn = markOf('WARN', 'Warning');
    const ok = markOf('OK', 'OK');
    // The square is as big as the node and almost square-cornered.
    await expect(crit.offsetWidth).toBe(16);
    await expect(getComputedStyle(crit).rotate).toBe('none');
    await expect(parseFloat(getComputedStyle(crit).borderTopLeftRadius)).toBeLessThan(4);
    // The diamond is a smaller square turned by 45 degrees.
    await expect(warn.offsetWidth).toBeLessThan(16);
    await expect(getComputedStyle(warn).rotate).toBe('45deg');
    // The circle has a corner of half its side or more.
    await expect(ok.offsetWidth).toBeLessThan(16);
    await expect(parseFloat(getComputedStyle(ok).borderTopLeftRadius)).toBeGreaterThanOrEqual(
      ok.offsetWidth / 2
    );
    // Every status keeps its own color.
    const fills = [crit, warn, ok].map((mark) => getComputedStyle(mark).backgroundColor);
    await expect(new Set(fills).size).toBe(3);
  },
};

/** The legend has one entry per status in the grid, in words, with the mark the grid uses. */
export const LegendFollowsTheStatusesInUse: Story = {
  ...WithLegend,
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="space-y-4">
      <NodeGrid {...args} />
      <NodeGrid
        {...args}
        ariaLabel="Alerting"
        title="Alerting"
        show="alerting"
        groups={GROUPS.slice(0, 1)}
      />
      <NodeGrid {...args} ariaLabel="No legend" title="No legend" legend={false} />
    </div>
  ),
  play: async ({ canvas }) => {
    const [all, alerting] = canvas.getAllByRole('list', { name: 'Legend' });
    await expect(
      within(all!)
        .getAllByRole('listitem')
        .map((li) => li.textContent)
    ).toEqual(['Critical', 'Warning', 'OK']);
    await expect(
      within(alerting!)
        .getAllByRole('listitem')
        .map((li) => li.textContent)
    ).toEqual(['Critical', 'Warning']);
    await expect(canvas.getAllByRole('list', { name: 'Legend' })).toHaveLength(2);
    // The mark beside "Warning" is the diamond of the grid.
    const legendWarn = within(all!).getByText('Warning').firstElementChild as HTMLElement;
    const gridWarn = canvas.getAllByRole('img', { name: nameOf(firstWith('WARN'), 'Warning') })[0]!
      .firstElementChild as HTMLElement;
    await expect(getComputedStyle(legendWarn).rotate).toBe(getComputedStyle(gridWarn).rotate);
    await expect(getComputedStyle(legendWarn).rotate).toBe('45deg');
    await expect(getComputedStyle(legendWarn).backgroundColor).toBe(
      getComputedStyle(gridWarn).backgroundColor
    );
  },
};

export const LegendListsEveryStatus: Story = {
  ...EveryStatus,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const items = within(canvas.getByRole('list', { name: 'Legend' })).getAllByRole('listitem');
    await expect(items.map((li) => li.textContent)).toEqual([
      'Critical',
      'Warning',
      'Unknown',
      'Info',
      'OK',
    ]);
    // Header: critical and warning, then unknown and info, then OK.
    for (const text of ['4 CRIT', '4 WARN', '4 UNKNOWN', '4 INFO', '4 OK']) {
      await expect(canvas.getByText(text)).toBeVisible();
    }
  },
};

/** Hovering or focusing a node shows its name, its status and its detail; Escape hides it. */
export const TooltipShowsTheNodeItsStatusAndItsDetail: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const page = body(canvasElement);
    const nodes = nodesOf(canvasElement);
    const crit = firstWith('CRIT');
    const node = nodes.find((el) => el.getAttribute('aria-label') === nameOf(crit, 'Critical'))!;
    await expect(page.queryByRole('tooltip')).toBeNull();

    // The pointer.
    await userEvent.hover(node);
    const tip = await page.findByRole('tooltip');
    await expect(tip).toHaveTextContent(crit.label!);
    await expect(tip).toHaveTextContent('Critical');
    await expect(tip).toHaveTextContent(String(crit.detail));
    await expect(node).toHaveAttribute('aria-describedby', tip.id);
    await userEvent.unhover(node);
    await waitFor(() => expect(page.queryByRole('tooltip')).toBeNull());
    await expect(node).not.toHaveAttribute('aria-describedby');

    // The keyboard, and Escape. The tooltip stays closed until the focus moves again.
    await userEvent.tab();
    const first = nodes[0]!;
    await expect(first).toHaveFocus();
    await expect(await page.findByRole('tooltip')).toHaveTextContent(
      first.getAttribute('aria-label')!.split(', ')[0]!
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(page.queryByRole('tooltip')).toBeNull());
    await expect(first).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(await page.findByRole('tooltip')).toBeVisible();
  },
};

/** The tooltip sits above the node it is for, also when the focus moves from node to node. */
export const TooltipFollowsTheFocusedNode: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const page = body(canvasElement);
    const nodes = nodesOf(canvasElement);
    const near = (node: HTMLElement) => async () => {
      const tip = await page.findByRole('tooltip');
      await expect(Math.abs(centre(tip).x - centre(node).x)).toBeLessThan(2);
      // Above the node, or below it when the page has no room above: never over it.
      const tipBox = tip.getBoundingClientRect();
      const nodeBox = node.getBoundingClientRect();
      await expect(tipBox.bottom <= nodeBox.top + 1 || tipBox.top >= nodeBox.bottom - 1).toBe(true);
    };
    nodes[10]!.focus();
    await waitFor(near(nodes[10]!));
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(nodes[11]).toHaveFocus();
    await waitFor(near(nodes[11]!));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(near(document.activeElement as HTMLElement));
    await expect(page.getAllByRole('tooltip')).toHaveLength(1);
  },
};

// Twenty nodes and five more, in 200px: eight marks to a row, so the first group wraps to three.
const RACKS: NodeGridGroup[] = [
  {
    id: 'x',
    label: 'Rack X',
    nodes: Array.from({ length: 20 }, (_, index) => ({
      id: `x${index + 1}`,
      status: index % 5 === 3 ? ('CRIT' as const) : ('OK' as const),
    })),
  },
  {
    id: 'y',
    label: 'Rack Y',
    nodes: Array.from({ length: 5 }, (_, index) => ({
      id: `y${index + 1}`,
      status: 'OK' as const,
    })),
  },
];

/**
 * One tab stop for the grid. Left and right follow the reading order, mirrored in right to left,
 * across the end of a row and the end of a group; up and down follow the visual column, into
 * the next group; Home and End go to the first and the last node; the ends stop the arrows.
 */
export const KeyboardMovesAcrossTheWrappingGrid: Story = {
  tags: ['!dev', '!autodocs'],
  args: { groups: RACKS },
  render: (args) =>
    bothDirections(() => (
      <div className="w-[200px]">
        <NodeGrid {...args} />
      </div>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const nodes = nodesOf(box);
      await expect(nodes).toHaveLength(25);
      // Eight to a row: the second row starts at the ninth.
      const tops = nodes.map((node) => Math.round(node.getBoundingClientRect().top));
      await expect(tops[7]).toBe(tops[0]);
      await expect(tops[8]).toBeGreaterThan(tops[7]!);
      // Reading order runs from the start edge of the line.
      const lefts = nodes.map((node) => node.getBoundingClientRect().left);
      await expect(dir === 'rtl' ? lefts[1]! < lefts[0]! : lefts[1]! > lefts[0]!).toBe(true);

      const stops = () => box.querySelectorAll('[data-node][tabindex="0"]');
      await expect(stops()).toHaveLength(1);
      const end = keyToEnd(box);
      const start = keyToStart(box);
      const go = async (key: string, index: number) => {
        await userEvent.keyboard(`{${key}}`);
        await expect(nodes[index], `${dir}: ${key} lands on node ${index}`).toHaveFocus();
      };

      nodes[0]!.focus();
      await go(end, 1);
      await go('ArrowDown', 9);
      await go('ArrowDown', 17);
      // The third row of rack X holds four marks, and the second group sits under them: the
      // column of the focused node is kept into Rack Y.
      await go('ArrowDown', 21);
      // The last row: nothing under it.
      await go('ArrowDown', 21);
      await go('ArrowUp', 17);
      await go('ArrowUp', 9);
      await go('ArrowUp', 1);
      await go('ArrowUp', 1);
      // End and Home are the ends of the whole grid, and stop the arrows there.
      await go('End', 24);
      await go(end, 24);
      await go('Home', 0);
      await go(start, 0);
      for (let step = 1; step <= 8; step += 1) await go(end, step);
      await go(start, 7);

      // The tab stop moved with the focus: still one.
      await expect(stops()).toHaveLength(1);
      await expect(stops()[0]).toBe(nodes[7]);
      (document.activeElement as HTMLElement).blur();
    }
  },
};

/** Tab lands on the first node and leaves the grid at once; Shift+Tab returns where it was. */
export const OneTabStopForTheWholeGrid: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const nodes = nodesOf(canvasElement);
    await expect(canvasElement.querySelectorAll('[data-node][tabindex="0"]')).toHaveLength(1);
    await userEvent.tab();
    await expect(nodes[0]).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}{${keyToEnd()}}{${keyToEnd()}}`);
    await expect(nodes[3]).toHaveFocus();
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
    await userEvent.tab({ shift: true });
    await expect(nodes[3]).toHaveFocus();
    await expectFocusRing(nodes[3]!);
  },
};

const ShowToggle = (args: NodeGridProps) => {
  const [alerting, setAlerting] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAlerting(true)}>
        Only alerting
      </button>
      <NodeGrid {...args} show={alerting ? 'alerting' : 'all'} />
    </>
  );
};

/** A node of a group that is no longer drawn cannot hold the tab stop: the first node takes it. */
export const TabStopFallsBackWhenItsNodeLeaves: Story = {
  tags: ['!dev', '!autodocs'],
  args: { groups: GROUPS },
  render: (args) => <ShowToggle {...args} />,
  play: async ({ canvas, canvasElement }) => {
    const okNode = nodesOf(canvasElement).find((node) =>
      node.getAttribute('aria-label')!.endsWith(', OK')
    )!;
    okNode.focus();
    await expect(canvasElement.querySelector('[data-node][tabindex="0"]')).toBe(okNode);
    await userEvent.click(canvas.getByRole('button', { name: 'Only alerting' }));
    await waitFor(() => expect(nodesOf(canvasElement)).toHaveLength(59));
    const stops = canvasElement.querySelectorAll('[data-node][tabindex="0"]');
    await expect(stops).toHaveLength(1);
    await expect(stops[0]).toBe(nodesOf(canvasElement)[0]);
  },
};

/** Without `onNodeSelect` a node is a picture with a name; with it, a button. */
export const NodesAreButtonsOnlyWhenSelectable: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="space-y-4">
      <NodeGrid {...args} ariaLabel="Plain" title="Plain" groups={GROUPS.slice(2)} />
      <NodeGrid
        {...args}
        ariaLabel="Selectable"
        title="Selectable"
        groups={GROUPS.slice(2)}
        onNodeSelect={fn()}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const plain = within(canvas.getByRole('group', { name: 'Plain' }));
    await expect(plain.queryAllByRole('button')).toHaveLength(0);
    await expect(plain.getAllByRole('img')).toHaveLength(24);
    const selectable = within(canvas.getByRole('group', { name: 'Selectable' }));
    await expect(selectable.queryAllByRole('img')).toHaveLength(0);
    await expect(selectable.getAllByRole('button')).toHaveLength(24);
  },
};

/** A click, Enter or Space on a node calls `onNodeSelect` with the node and its group. */
export const SelectionCallsBackWithTheNodeAndItsGroup: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onNodeSelect: fn() },
  play: async ({ args, canvas, canvasElement }) => {
    const crit = firstWith('CRIT');
    const group = GROUPS.find((g) => g.nodes.includes(crit))!;
    const button = canvas.getByRole('button', { name: nameOf(crit, 'Critical') });
    await userEvent.click(button);
    await expect(args.onNodeSelect).toHaveBeenCalledTimes(1);
    await expect(args.onNodeSelect).toHaveBeenLastCalledWith(crit, group);

    const warn = firstWith('WARN');
    const warnGroup = GROUPS.find((g) => g.nodes.includes(warn))!;
    canvas.getByRole('button', { name: nameOf(warn, 'Warning') }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onNodeSelect).toHaveBeenLastCalledWith(warn, warnGroup);
    await userEvent.keyboard(' ');
    await expect(args.onNodeSelect).toHaveBeenCalledTimes(3);
    // The arrows move the focus and select nothing.
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(args.onNodeSelect).toHaveBeenCalledTimes(3);
    await expect(canvasElement.querySelectorAll('button[data-node]')).toHaveLength(136);
  },
};

/** With `show="alerting"` and nothing alerting, the card says so, and the counts stay. */
export const EmptyMessageSaysAllNodesAreHealthy: Story = {
  ...Empty,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('All nodes healthy')).toBeVisible();
    await expect(nodesOf(canvasElement)).toHaveLength(0);
    await expect(canvas.queryByRole('list')).toBeNull();
    await expect(canvas.getByText('136 OK')).toBeVisible();
    await expect(canvas.queryByText(/CRIT|WARN/)).toBeNull();
  },
};

/** The message can be replaced, and a grid with no nodes at all is not "healthy". */
export const EmptyMessageIsTheHosts: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="space-y-4">
      <NodeGrid
        {...args}
        ariaLabel="Custom"
        show="alerting"
        emptyMessage="Nothing to report"
        groups={[{ id: 'a', label: 'Room A', nodes: [{ id: 'n1', status: 'OK' }] }]}
      />
      <NodeGrid {...args} ariaLabel="No nodes, all" show="all" groups={[]} />
      <NodeGrid {...args} ariaLabel="No nodes, alerting" show="alerting" groups={[]} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Nothing to report')).toBeVisible();
    await expect(canvas.queryByText('All nodes healthy')).toBeNull();
    await expect(canvas.getAllByText('No nodes')).toHaveLength(2);
  },
};

/** `maxHeight` scrolls the groups in the card, and the focus brings a node into view. */
export const MaxHeightScrollsTheGroups: Story = {
  ...MaxHeight,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const nodes = nodesOf(canvasElement);
    const scroller = nodes[0]!.closest<HTMLElement>('.overflow-y-auto')!;
    await expect(scroller.clientHeight).toBeLessThanOrEqual(160);
    await expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
    await expect(scroller.scrollTop).toBe(0);
    const pageScroll = window.scrollY;
    nodes[0]!.focus();
    await userEvent.keyboard('{End}');
    await expect(nodes.at(-1)).toHaveFocus();
    await waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(0));
    // The header and the legend did not move with the groups.
    await expect(canvas.getByText('40 CRIT')).toBeVisible();
    await expect(canvas.getByRole('list', { name: 'Legend' })).toBeVisible();
    await expect(window.scrollY).toBe(pageScroll);
  },
};

/** The status words, the counts and the legend follow `labels`. */
export const LabelsTranslateTheTexts: Story = {
  ...Translated,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByText('40 CRIT')).toBeVisible();
    await expect(canvas.getByText('19 ALERTE')).toBeVisible();
    await expect(canvas.getByText('77 OK')).toBeVisible();
    await expect(
      canvas.getByRole('img', { name: nameOf(firstWith('WARN'), 'Avertissement') })
    ).toBeVisible();
    await expect(canvas.getByRole('list', { name: 'Salle A' })).toBeVisible();
    const legend = within(canvas.getByRole('list', { name: 'Legend' }));
    await expect(legend.getByText('Critique')).toBeVisible();
  },
};

/** At 375px the page does not scroll sideways and the marks wrap inside the card. */
export const MobileChecks: Story = {
  ...Mobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    expectNoHorizontalOverflow();
    const card = canvas.getByRole('group', { name: 'Node health' });
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    const nodes = nodesOf(canvasElement);
    await expect(nodes).toHaveLength(136);
    const list = canvas.getByRole('list', { name: 'Room A' });
    const rows = new Set(nodesOf(list).map((node) => Math.round(node.getBoundingClientRect().top)));
    await expect(rows.size).toBeGreaterThan(2);
  },
};

/** The header, the groups and the legend start at the start edge; the counts end the header. */
export const LayoutMirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  args: { marks: SHAPES, legend: true },
  render: (args) =>
    bothDirections(() => (
      <div className="w-[320px]">
        <NodeGrid {...args} />
      </div>
    )),
  play: async ({ canvasElement }) => {
    const find = (box: HTMLElement, selector: string) => box.querySelector(selector);
    expectMirrored(canvasElement, (box) => find(box, '[data-node]'));
    expectMirrored(canvasElement, (box) => within(box).getByText('Room A'));
    expectMirrored(canvasElement, (box) => within(box).getByText('Node health'));
    expectMirrored(canvasElement, (box) => find(box, 'ul[aria-label="Legend"] li'));
    const ltr = directionBox(canvasElement, 'ltr');
    const rtl = directionBox(canvasElement, 'rtl');
    const countsLtr = within(ltr).getByText('77 OK').closest('p')!;
    const countsRtl = within(rtl).getByText('77 OK').closest('p')!;
    await expect(endOffset(countsRtl, rtl)).toBeCloseTo(endOffset(countsLtr, ltr), 0);
    // Each count reads "40 CRIT" in both directions.
    for (const box of [ltr, rtl]) {
      for (const text of ['40 CRIT', '19 WARN', '77 OK']) {
        expectReadsLeftToRight(within(box).getByText(text));
      }
    }
    // And the header reads worst first from the start edge in both.
    await expect(within(rtl).getByText('40 CRIT').getBoundingClientRect().left).toBeGreaterThan(
      within(rtl).getByText('77 OK').getBoundingClientRect().left
    );
  },
};
