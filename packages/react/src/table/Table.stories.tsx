import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronRight, Server, TrendingDown, TrendingUp } from 'lucide-react';
import { Fragment, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeletonRows,
} from './Table';
import { TableAmountCell, TableDescriptionCell, TableIdCell, TableIdentityCell } from './cells';
import { EmptyState } from '../feedback/EmptyState';
import { Badge } from '../ui/Badge';
import { StatusBadge } from '../status/StatusBadge';
import type { HealthStatus } from '../status/types';
import { ProgressBar, type ProgressBarIntent } from '../ui/ProgressBar';
import { RowActionButton } from '../ui/RowActionButton';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectFocusRing,
  expectNoHorizontalOverflow,
  expectTextContrast,
  inEachTheme,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';

const meta = {
  title: 'Tables/Table',
  component: Table,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

type Node = {
  name: string;
  status: HealthStatus;
  room: string;
  cpu: number;
  memory: number;
  power: number;
  trend: number;
};

const NODES: Node[] = [
  { name: 'node-101', status: 'OK', room: 'Room A', cpu: 42, memory: 61, power: 412, trend: 3.2 },
  { name: 'node-102', status: 'WARN', room: 'Room A', cpu: 78, memory: 83, power: 538, trend: 8.4 },
  { name: 'node-103', status: 'OK', room: 'Room B', cpu: 18, memory: 37, power: 296, trend: -1.5 },
  {
    name: 'node-104',
    status: 'CRIT',
    room: 'Room B',
    cpu: 96,
    memory: 94,
    power: 604,
    trend: 12.1,
  },
  { name: 'node-105', status: 'OK', room: 'Room C', cpu: 33, memory: 48, power: 351, trend: -4.0 },
  { name: 'node-106', status: 'INFO', room: 'Room C', cpu: 9, memory: 22, power: 248, trend: 0.6 },
];

// What the dashboard story's cells show beside the node's metrics.
const NOTES: Record<string, string> = {
  'node-101': 'Primary database replica, nightly backup runs at 02:00.',
  'node-102': 'Memory above the usual ceiling since the last firmware update.',
  'node-103': 'Idle, kept as a spare for the Room B racks.',
  'node-104': 'Fan 3 failed: ticket opened with the vendor, replacement due Friday.',
  'node-105': 'Batch workers.',
  'node-106': 'Decommissioning planned for next quarter.',
};

const COSTS: Record<string, number> = {
  'node-101': 12.4,
  'node-102': -3.15,
  'node-103': 0,
  'node-104': 148.9,
  'node-105': -27.8,
  'node-106': 1042.5,
};

const MANY_NODES: Node[] = Array.from({ length: 24 }, (_, i) => ({
  ...NODES[i % NODES.length],
  name: `node-${101 + i}`,
}));

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

const NodeHead = () => (
  <TableHead>
    <TableRow>
      <TableHeaderCell>Name</TableHeaderCell>
      <TableHeaderCell>Room</TableHeaderCell>
      <TableHeaderCell numeric>CPU</TableHeaderCell>
      <TableHeaderCell numeric>Memory</TableHeaderCell>
      <TableHeaderCell numeric>Power</TableHeaderCell>
    </TableRow>
  </TableHead>
);

const NodeRow = ({ node }: { node: Node }) => (
  <TableRow>
    <TableCell className="font-medium">{node.name}</TableCell>
    <TableCell>{node.room}</TableCell>
    <TableCell numeric>{node.cpu}%</TableCell>
    <TableCell numeric>{node.memory}%</TableCell>
    <TableCell numeric>{node.power} W</TableCell>
  </TableRow>
);

export const Basic: Story = {
  render: (args) => (
    <Wrap>
      <Table {...args}>
        <TableCaption>Compute nodes</TableCaption>
        <NodeHead />
        <TableBody>
          {NODES.map((n) => (
            <NodeRow key={n.name} node={n} />
          ))}
        </TableBody>
      </Table>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    // The caption names the table, and every header cell carries its scope.
    const table = canvas.getByRole('table', { name: 'Compute nodes' });
    await expect(table).toBeInTheDocument();
    const headers = canvas.getAllByRole('columnheader');
    await expect(headers).toHaveLength(5);
    for (const th of headers) await expect(th).toHaveAttribute('scope', 'col');
  },
};

export const Striped: Story = {
  args: { striped: true },
  render: Basic.render,
  play: async ({ canvas }) => {
    // The shaded rows must stand out from the panel in every theme, dark ones included: a
    // stripe under about 5% white is invisible on a dark panel.
    const rows = canvas.getAllByRole('row').slice(1);
    const alphaOf = (row: HTMLElement) => {
      const bg = getComputedStyle(row).backgroundColor;
      const alpha = /\/\s*([\d.]+%?)\s*\)|,\s*([\d.]+)\s*\)$/.exec(bg);
      if (!alpha) return bg === 'rgba(0, 0, 0, 0)' ? 0 : 1;
      const value = alpha[1] ?? alpha[2];
      return value.endsWith('%') ? parseFloat(value) / 100 : parseFloat(value);
    };
    await expect(alphaOf(rows[0])).toBe(0);
    await expect(alphaOf(rows[1])).toBeGreaterThanOrEqual(0.05);
  },
};

export const Densities: Story = {
  render: () => (
    <Wrap>
      <div className="grid gap-6 lg:grid-cols-2">
        {(['compact', 'default', 'comfortable'] as const).map((density) => (
          <Table key={density} density={density}>
            <TableCaption>Density: {density}</TableCaption>
            <NodeHead />
            <TableBody>
              {NODES.slice(0, 3).map((n) => (
                <NodeRow key={n.name} node={n} />
              ))}
            </TableBody>
          </Table>
        ))}
      </div>
    </Wrap>
  ),
};

export const StickyHeader: Story = {
  args: { stickyHeader: true, containerClassName: 'max-h-80' },
  render: (args) => (
    <Wrap>
      <Table {...args}>
        <TableCaption>All compute nodes</TableCaption>
        <NodeHead />
        <TableBody>
          {MANY_NODES.map((n) => (
            <NodeRow key={n.name} node={n} />
          ))}
        </TableBody>
      </Table>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    // The rows overflow the container: it is a focusable region, named by the caption.
    const region = await canvas.findByRole('region', { name: 'All compute nodes' });
    await expect(region).toHaveAttribute('tabindex', '0');
  },
};

/** A table that scrolls takes the focus, as a region named by its caption; one that fits does not. */
export const ScrollingTableIsFocusableOneThatFitsIsNot: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="space-y-6">
        <Table stickyHeader containerClassName="max-h-32">
          <TableCaption>Scrolls</TableCaption>
          <NodeHead />
          <TableBody>
            {MANY_NODES.map((n) => (
              <NodeRow key={n.name} node={n} />
            ))}
          </TableBody>
        </Table>
        <Table>
          <TableCaption>Fits</TableCaption>
          <NodeHead />
          <TableBody>
            {NODES.slice(0, 2).map((n) => (
              <NodeRow key={n.name} node={n} />
            ))}
          </TableBody>
        </Table>
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const region = await canvas.findByRole('region', { name: 'Scrolls' });
    await expect(region).toHaveAttribute('tabindex', '0');
    // The name is the caption's text alone, not the text of the cells.
    await expect(region).toHaveAccessibleName('Scrolls');
    await expect(region.scrollHeight).toBeGreaterThan(region.clientHeight);
    await expectFocusRing(region, { inset: true });

    // The other table fits: no tab stop, no region.
    const fitting = canvas.getByRole('table', { name: 'Fits' }).parentElement;
    await expect(fitting).not.toHaveAttribute('tabindex');
    await expect(fitting).not.toHaveAttribute('role');
    await expect(canvas.queryByRole('region', { name: 'Fits' })).toBeNull();
  },
};

/** With no caption a scrolling table has no name to give: focusable, but not a region. */
export const ScrollingTableWithoutCaptionIsFocusableNotARegion: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Table stickyHeader containerClassName="max-h-32">
        <NodeHead />
        <TableBody>
          {MANY_NODES.map((n) => (
            <NodeRow key={n.name} node={n} />
          ))}
        </TableBody>
      </Table>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const container = canvas.getByRole('table').parentElement!;
    await waitFor(() => expect(container).toHaveAttribute('tabindex', '0'));
    await expect(container.scrollHeight).toBeGreaterThan(container.clientHeight);
    // Not labelled by the table either: that would name it after every cell.
    await expect(container).not.toHaveAttribute('role');
    await expect(container).not.toHaveAttribute('aria-labelledby');
    await expect(canvas.queryByRole('region')).toBeNull();
    await expectFocusRing(container, { inset: true });
  },
};

export const FooterTotals: Story = {
  render: () => {
    const total = NODES.reduce((sum, n) => sum + n.power, 0);
    return (
      <Wrap>
        <Table>
          <TableCaption>Power draw per node</TableCaption>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Room</TableHeaderCell>
              <TableHeaderCell numeric>Power</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {NODES.map((n) => (
              <TableRow key={n.name}>
                <TableCell className="font-medium">{n.name}</TableCell>
                <TableCell>{n.room}</TableCell>
                <TableCell numeric>{n.power} W</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFoot>
            <TableRow>
              <TableHeaderCell colSpan={2}>Total</TableHeaderCell>
              <TableCell numeric>{total} W</TableCell>
            </TableRow>
          </TableFoot>
        </Table>
      </Wrap>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('rowheader', { name: 'Total' })).toHaveAttribute('scope', 'row');
  },
};

export const GroupedRows: Story = {
  render: () => {
    const rooms = [...new Set(NODES.map((n) => n.room))];
    return (
      <Wrap>
        <Table>
          <TableCaption>Nodes by room</TableCaption>
          <NodeHead />
          {rooms.map((room) => {
            const nodes = NODES.filter((n) => n.room === room);
            return (
              <TableBody key={room}>
                <TableRow className="bg-gray-100 dark:bg-white/[0.06]">
                  <TableHeaderCell
                    scope="rowgroup"
                    colSpan={5}
                    className="text-[var(--color-text-primary)]"
                  >
                    <span className="flex items-center gap-2">
                      {room}
                      <Badge size="sm">
                        {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}
                      </Badge>
                    </span>
                  </TableHeaderCell>
                </TableRow>
                {nodes.map((n) => (
                  <NodeRow key={n.name} node={n} />
                ))}
              </TableBody>
            );
          })}
        </Table>
      </Wrap>
    );
  },
  play: async ({ canvas }) => {
    // Each group header spans its own <tbody> with scope="rowgroup", and carries a count.
    const groupHeader = canvas.getAllByText(/^Room A/)[0]?.closest('th');
    await expect(groupHeader).toHaveAttribute('scope', 'rowgroup');
    await expect(within(groupHeader!).getByText(/^\d+ nodes?$/)).toBeInTheDocument();
    inEachTheme(() => expectTextContrast(groupHeader!));
  },
};

const ExpandableTable = ({ initiallyOpen = [] }: { initiallyOpen?: string[] }) => {
  const [open, setOpen] = useState<Set<string>>(new Set(initiallyOpen));
  const toggle = (name: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  return (
    <Table>
      <TableCaption>Expandable nodes</TableCaption>
      <TableHead>
        <TableRow>
          <TableHeaderCell className="w-10">
            <span className="sr-only">Details</span>
          </TableHeaderCell>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Room</TableHeaderCell>
          <TableHeaderCell numeric>CPU</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {NODES.slice(0, 4).map((n) => {
          const expanded = open.has(n.name);
          const detailsId = `details-${n.name}`;
          return (
            <Fragment key={n.name}>
              <TableRow>
                <TableCell>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={expanded ? detailsId : undefined}
                    aria-label={`Details for ${n.name}`}
                    onClick={() => toggle(n.name)}
                    className="focus-visible:ring-brand-500 rounded p-1 text-[var(--color-text-secondary)] hover:bg-gray-100 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-white/10"
                  >
                    <ChevronRight
                      aria-hidden
                      className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
                    />
                  </button>
                </TableCell>
                <TableCell className="font-medium">{n.name}</TableCell>
                <TableCell>{n.room}</TableCell>
                <TableCell numeric>{n.cpu}%</TableCell>
              </TableRow>
              {expanded && (
                <TableRow id={detailsId}>
                  <TableCell colSpan={4} className="text-[var(--color-text-secondary)]">
                    Memory {n.memory}% · power {n.power} W · status {n.status}
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
};

export const ExpandableRows: Story = {
  render: () => (
    <Wrap>
      <ExpandableTable />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole('button', { name: 'Details for node-101' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByText(/Memory 61%/)).toBeInTheDocument();
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByText(/Memory 61%/)).toBeNull();
  },
};

/** Rows that start open: the first node shows its details at once. */
export const ExpandableRowsOpenByDefault: Story = {
  render: () => (
    <Wrap>
      <ExpandableTable initiallyOpen={['node-101']} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole('button', { name: 'Details for node-101' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByText(/Memory 61%/)).toBeInTheDocument();
    // The others stay closed, and the caret of an open row has turned.
    await expect(canvas.getByRole('button', { name: 'Details for node-102' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await expect(toggle.querySelector('svg')).toHaveClass('rotate-90');
  },
};

export const Empty: Story = {
  render: () => (
    <Wrap>
      <Table>
        <NodeHead />
        <TableBody>
          <TableRow>
            <TableCell colSpan={5}>
              <EmptyState title="No nodes" description="No node reports to this site yet." />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('columnheader')).toHaveLength(5);
    await expect(canvas.getByText('No nodes')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  render: () => (
    <Wrap>
      <Table aria-busy="true">
        <TableCaption>Compute nodes</TableCaption>
        <NodeHead />
        <TableBody>
          <TableSkeletonRows rows={4} columns={5} numericColumns={[2, 3, 4]} />
        </TableBody>
      </Table>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    // The header stays, with the rows in its place.
    await expect(canvas.getAllByRole('columnheader')).toHaveLength(5);
    const table = canvas.getByRole('table', { hidden: true });
    await expect(table.querySelector('thead')).not.toBeNull();
    await expect(table.querySelectorAll('tbody > tr')).toHaveLength(4);
    await expect(table.querySelectorAll('tbody > tr:first-child > td')).toHaveLength(5);
  },
};

export const LoadingRowsFollowTheDensity: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      {(['default', 'comfortable'] as const).map((density) => (
        <Table key={density} density={density} aria-label={density} className="mb-4">
          <TableBody>
            <TableSkeletonRows rows={1} columns={3} />
          </TableBody>
        </Table>
      ))}
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const height = (name: string) =>
      canvas.getByRole('table', { name, hidden: true }).querySelector('tr')!.getBoundingClientRect()
        .height;
    await expect(height('comfortable')).toBeGreaterThan(height('default'));
  },
};

/** Without a `density` a table takes the page's `data-density`, and `compact` pads the cells less. */
export const CellsFollowThePageDensity: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      {(['compact', 'default', 'comfortable'] as const).map((page) => (
        <div key={page} data-density={page}>
          <Table aria-label={`${page} page`} className="mb-4">
            <TableBody>
              <TableRow>
                <TableCell>Cell</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ))}
      <Table density="compact" aria-label="compact on a default page" className="mb-4">
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const padding = (name: string) =>
      getComputedStyle(canvas.getByRole('table', { name }).querySelector('td')!).paddingTop;
    await expect(padding('compact page')).toBe('10px');
    await expect(padding('default page')).toBe('14px');
    await expect(padding('comfortable page')).toBe('20px');
    await expect(padding('compact on a default page')).toBe('10px');
  },
};

const usageIntent = (pct: number): ProgressBarIntent =>
  pct >= 90 ? 'danger' : pct >= 75 ? 'warning' : 'success';

const Trend = ({ value }: { value: number }) => {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${
        up ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'
      }`}
    >
      <Icon aria-hidden className="h-3.5 w-3.5" />
      {up ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
};

export const DashboardCells: Story = {
  render: () => (
    <Wrap>
      <Table>
        <TableCaption>Node health</TableCaption>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="min-w-40">Memory</TableHeaderCell>
            <TableHeaderCell>Note</TableHeaderCell>
            <TableHeaderCell numeric>Power 24h</TableHeaderCell>
            <TableHeaderCell numeric>Cost, 24h</TableHeaderCell>
            <TableHeaderCell align="end">Action</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {NODES.map((n) => (
            <TableRow key={n.name}>
              <TableCell>
                <TableIdentityCell title={n.name} subtitle={n.room} icon={Server} />
              </TableCell>
              <TableCell>
                <TableIdCell>{`i-${n.name.slice(-3)}a9f${n.power}c0e41d7`}</TableIdCell>
              </TableCell>
              <TableCell>
                <StatusBadge status={n.status} size="sm" />
              </TableCell>
              <TableCell>
                <ProgressBar
                  value={n.memory}
                  size="xs"
                  intent={usageIntent(n.memory)}
                  label="outside"
                  aria-label={`Memory used on ${n.name}`}
                />
              </TableCell>
              <TableCell>
                <TableDescriptionCell className="max-w-48">{NOTES[n.name]}</TableDescriptionCell>
              </TableCell>
              <TableCell numeric>
                <Trend value={n.trend} />
              </TableCell>
              <TableCell numeric>
                <TableAmountCell value={COSTS[n.name]} currency="EUR" locale="en-GB" />
              </TableCell>
              <TableCell align="end">
                <RowActionButton aria-label={`View ${n.name}`} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const row = canvas.getByRole('row', { name: /node-104/ });
    // The identity cell: the name, then its detail line, under an icon that says nothing more.
    await expect(within(row).getByText('node-104')).toBeVisible();
    await expect(within(row).getByText('Room B')).toBeVisible();
    // The identifier is monospaced, and the note is cut with its whole text as a tooltip.
    await expect(getComputedStyle(within(row).getByText(/^i-104/)).fontFamily).toMatch(/mono/i);
    const note = within(row).getByText(/Fan 3 failed/);
    await expect(note).toHaveAttribute('title', expect.stringContaining('replacement due Friday.'));
    await expect(note.scrollWidth).toBeGreaterThan(note.clientWidth);
    // Gains are green and losses red, signed so the colour is not the only cue, and readable in
    // every theme.
    const gain = within(row).getByText('+€148.90');
    const loss = within(canvas.getByRole('row', { name: /node-102/ })).getByText('-€3.15');
    const zero = within(canvas.getByRole('row', { name: /node-103/ })).getByText('€0.00');
    await expect(getComputedStyle(gain).color).not.toBe(getComputedStyle(loss).color);
    await expect(zero.className).not.toMatch(/green|red/);
    inEachTheme(() => {
      for (const el of [gain, loss, zero]) expectTextContrast(el);
    });
  },
};

export const MobileStickyFirstColumn: Story = {
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <Table stickyFirstColumn striped>
        <TableCaption>Compute nodes</TableCaption>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell className="min-w-40">Room</TableHeaderCell>
            <TableHeaderCell numeric className="min-w-32">
              CPU
            </TableHeaderCell>
            <TableHeaderCell numeric className="min-w-32">
              Memory
            </TableHeaderCell>
            <TableHeaderCell numeric className="min-w-32">
              Power
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {NODES.map((n) => (
            <NodeRow key={n.name} node={n} />
          ))}
        </TableBody>
      </Table>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const table = canvas.getByRole('table', { name: 'Compute nodes' });
    const scroller = table.parentElement as HTMLElement;
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    // A region that scrolls is a tab stop, so the keyboard can scroll it.
    await waitFor(() => expect(scroller).toHaveAttribute('tabindex', '0'));
    // The end fades, the start does not: the first column is pinned there.
    await waitFor(() => expect(getComputedStyle(scroller).maskImage).not.toBe('none'));
    const left = (el: Element) => Math.round(el.getBoundingClientRect().left);
    const head = canvas.getAllByRole('columnheader')[0];
    const cell = canvas.getAllByRole('row')[2].firstElementChild as HTMLElement;
    const second = canvas.getAllByRole('row')[2].children[1];
    // Pinned to the padding box of the wrapper, inside its 1px border.
    const start = left(scroller) + scroller.clientLeft;
    const before = left(second);
    scroller.scrollLeft = 120;
    await waitFor(() => expect(left(second)).toBeLessThan(before));
    await expect(left(head)).toBe(start);
    await expect(left(cell)).toBe(start);
    // Opaque even on a striped row, which has a background of its own.
    await expect(getComputedStyle(cell).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * `start` and `end` name the reading direction: a cell aligned to the end hugs the left edge in
 * right to left, and `numeric` is the end.
 */
export const AlignFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell align="start">Start</TableHeaderCell>
            <TableHeaderCell align="end">End</TableHeaderCell>
            <TableHeaderCell numeric>Numeric</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell align="start">
              <span>start cell</span>
            </TableCell>
            <TableCell align="end">
              <span>end cell</span>
            </TableCell>
            <TableCell numeric>
              <span>numeric cell</span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const sit = (text: string, side: 'start' | 'end') => {
        const span = within(box).getByText(text);
        const cell = span.closest('td')!;
        const [near, far] = side === 'start' ? [startOffset, endOffset] : [endOffset, startOffset];
        expect(near(span, cell), `${dir}: ${text}`).toBeLessThan(far(span, cell));
      };
      sit('start cell', 'start');
      sit('end cell', 'end');
      sit('numeric cell', 'end');
      expect(getComputedStyle(within(box).getByText('Start')).textAlign).toBe('start');
      expect(getComputedStyle(within(box).getByText('End')).textAlign).toBe('end');
      expect(getComputedStyle(within(box).getByText('Numeric')).textAlign).toBe('end');
    }
  },
};
