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
import { HOSTS, makeHosts, type Host } from './storybook-fixtures';
import { EmptyState } from '../feedback/EmptyState';
import { Badge } from '../ui/Badge';
import { StatusBadge } from '../status/StatusBadge';
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
  scrollAlong,
  startEdge,
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

// The seven hosts of the shared fixtures, and 24 generated ones for the tables that scroll.
const NODES = HOSTS;
const MANY_NODES = makeHosts(24);

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

const NodeRow = ({ node }: { node: Host }) => (
  <TableRow>
    <TableCell className="font-medium whitespace-nowrap">{node.host}</TableCell>
    <TableCell>{node.room}</TableCell>
    <TableCell numeric>{node.cpu}%</TableCell>
    <TableCell numeric>{node.memory}%</TableCell>
    <TableCell numeric>{node.power} W</TableCell>
  </TableRow>
);

export const Basic: Story = {
  render: (args) => (
    <Table {...args}>
      <TableCaption>Compute nodes</TableCaption>
      <NodeHead />
      <TableBody>
        {NODES.map((n) => (
          <NodeRow key={n.host} node={n} />
        ))}
      </TableBody>
    </Table>
  ),
};

export const BasicChecks: Story = {
  ...Basic,
  tags: ['!dev', '!autodocs'],
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
};

export const StripedChecks: Story = {
  ...Striped,
  tags: ['!dev', '!autodocs'],
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
    <div className="grid gap-6 lg:grid-cols-2">
      {(['compact', 'default', 'comfortable'] as const).map((density) => (
        <Table key={density} density={density}>
          <TableCaption>Density: {density}</TableCaption>
          <NodeHead />
          <TableBody>
            {NODES.slice(0, 3).map((n) => (
              <NodeRow key={n.host} node={n} />
            ))}
          </TableBody>
        </Table>
      ))}
    </div>
  ),
};

export const StickyHeader: Story = {
  args: { stickyHeader: true, containerClassName: 'max-h-80' },
  render: (args) => (
    <Table {...args}>
      <TableCaption>All compute nodes</TableCaption>
      <NodeHead />
      <TableBody>
        {MANY_NODES.map((n) => (
          <NodeRow key={n.host} node={n} />
        ))}
      </TableBody>
    </Table>
  ),
};

export const StickyHeaderChecks: Story = {
  ...StickyHeader,
  tags: ['!dev', '!autodocs'],
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
    <div className="space-y-6">
      <Table stickyHeader containerClassName="max-h-32">
        <TableCaption>Scrolls</TableCaption>
        <NodeHead />
        <TableBody>
          {MANY_NODES.map((n) => (
            <NodeRow key={n.host} node={n} />
          ))}
        </TableBody>
      </Table>
      <Table>
        <TableCaption>Fits</TableCaption>
        <NodeHead />
        <TableBody>
          {NODES.slice(0, 2).map((n) => (
            <NodeRow key={n.host} node={n} />
          ))}
        </TableBody>
      </Table>
    </div>
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
    <Table stickyHeader containerClassName="max-h-32">
      <NodeHead />
      <TableBody>
        {MANY_NODES.map((n) => (
          <NodeRow key={n.host} node={n} />
        ))}
      </TableBody>
    </Table>
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

const PowerTotals = () => {
  const total = NODES.reduce((sum, n) => sum + n.power, 0);
  return (
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
          <TableRow key={n.host}>
            <TableCell className="font-medium whitespace-nowrap">{n.host}</TableCell>
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
  );
};

export const FooterTotals: Story = {
  render: () => <PowerTotals />,
};

export const FooterTotalsChecks: Story = {
  ...FooterTotals,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('rowheader', { name: 'Total' })).toHaveAttribute('scope', 'row');
  },
};

// The lines a cell's text takes: the distinct tops of the rectangles of its content.
const linesOf = (cell: Element) => {
  const range = document.createRange();
  range.selectNodeContents(cell);
  return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
};

/**
 * In a column a phone's width, a host name is not broken after its hyphen and a value is not
 * parted from its unit: a narrow column is scrolled, not wrapped inside a word.
 */
export const NarrowColumnsKeepNamesAndValuesWhole: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-4" style={{ width: 343 }}>
      <Table>
        <NodeHead />
        <TableBody>
          {NODES.map((n) => (
            <NodeRow key={n.host} node={n} />
          ))}
        </TableBody>
      </Table>
      <PowerTotals />
      {/* A column whose header is shorter than its values: the squeezed table gives it the
          header's width, which the values then wrap inside. */}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Room</TableHeaderCell>
            <TableHeaderCell numeric>CPU</TableHeaderCell>
            <TableHeaderCell numeric>Memory</TableHeaderCell>
            <TableHeaderCell numeric>W</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {NODES.map((n) => (
            <TableRow key={n.host}>
              <TableCell className="font-medium whitespace-nowrap">{n.host}</TableCell>
              <TableCell>{n.room}</TableCell>
              <TableCell numeric>{n.cpu}%</TableCell>
              <TableCell numeric>{n.memory}%</TableCell>
              <TableCell numeric>{n.power * 5} W</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
  play: ({ canvasElement }) => {
    // The name and the value of every row, and the total: the other columns may wrap at a space.
    const cells = [...canvasElement.querySelectorAll('tr')].flatMap((row) =>
      row.closest('thead') ? [] : [row.firstElementChild!, row.lastElementChild!]
    );
    expect(cells.length).toBeGreaterThan(20);
    for (const cell of cells) {
      expect(linesOf(cell), `"${cell.textContent}" wraps`).toBe(1);
    }
  },
};

export const GroupedRows: Story = {
  render: () => {
    const rooms = [...new Set(NODES.map((n) => n.room))];
    return (
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
                <NodeRow key={n.host} node={n} />
              ))}
            </TableBody>
          );
        })}
      </Table>
    );
  },
};

export const GroupedRowsChecks: Story = {
  ...GroupedRows,
  tags: ['!dev', '!autodocs'],
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
          const expanded = open.has(n.host);
          const detailsId = `details-${n.host}`;
          return (
            <Fragment key={n.host}>
              <TableRow>
                <TableCell>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={expanded ? detailsId : undefined}
                    aria-label={`Details for ${n.host}`}
                    onClick={() => toggle(n.host)}
                    className="focus-visible:ring-brand-500 rounded p-1 text-[var(--color-text-secondary)] hover:bg-gray-100 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-white/10"
                  >
                    <ChevronRight
                      aria-hidden
                      className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : 'rtl:-scale-x-100'}`}
                    />
                  </button>
                </TableCell>
                <TableCell className="font-medium">{n.host}</TableCell>
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
  render: () => <ExpandableTable />,
};

export const ExpandableRowsChecks: Story = {
  ...ExpandableRows,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole('button', { name: 'Details for node-a01' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByText(/Memory 52%/)).toBeInTheDocument();
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByText(/Memory 52%/)).toBeNull();
  },
};

/** Rows that start open: the first node shows its details at once. */
export const ExpandableRowsOpenByDefault: Story = {
  render: () => <ExpandableTable initiallyOpen={['node-a01']} />,
};

export const ExpandableRowsOpenByDefaultChecks: Story = {
  ...ExpandableRowsOpenByDefault,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole('button', { name: 'Details for node-a01' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByText(/Memory 52%/)).toBeInTheDocument();
    // The others stay closed, and the caret of an open row has turned.
    await expect(canvas.getByRole('button', { name: 'Details for node-a02' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await expect(toggle.querySelector('svg')).toHaveClass('rotate-90');
  },
};

// A cell that spans the columns is as wide as the table, which scrolls on a phone: the empty state
// would be centred on the whole table, off to one side and under the fade of the end edge. The
// container query unit takes the width of the part in view (`@container` on the wrapper): the
// block is that wide less the cell's 2rem of padding, sticks 1rem from the start of it, and its own
// padding clears the 1.5rem of the fade. It adds nothing to the table's width, so a table that fits
// still fits.
const EmptyNodes = () => (
  <Table containerClassName="@container">
    <NodeHead />
    <TableBody>
      <TableRow>
        <TableCell colSpan={5}>
          <div className="inset-s-4 sticky w-[calc(100cqw-2rem)] px-6">
            <EmptyState title="No nodes" description="No node reports to this site yet." />
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
);

export const Empty: Story = {
  render: () => <EmptyNodes />,
};

export const EmptyChecks: Story = {
  ...Empty,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('columnheader')).toHaveLength(5);
    await expect(canvas.getByText('No nodes')).toBeInTheDocument();
  },
};

/**
 * In a table that scrolls (here a phone's width) the empty state is centred on the part that is
 * in view, and its text stays out of the fade of the edges.
 */
export const EmptyIsCentredOnTheVisibleWidth: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="box" style={{ width: 343 }}>
      <EmptyNodes />
    </div>
  ),
  play: ({ canvas, canvasElement }) => {
    const container = canvasElement.querySelector('table')!.parentElement!;
    // The table is wider than what is in view.
    expect(container.scrollWidth).toBeGreaterThan(container.clientWidth);
    const view = container.getBoundingClientRect();
    const title = canvas.getByText('No nodes').getBoundingClientRect();
    const description = canvas.getByText('No node reports to this site yet.');
    const lines = description.getBoundingClientRect();
    expect(Math.abs(title.left + title.width / 2 - (view.left + view.width / 2))).toBeLessThan(2);
    // The fade covers 1.5rem at each edge.
    expect(lines.left).toBeGreaterThanOrEqual(view.left + 24);
    expect(lines.right).toBeLessThanOrEqual(view.right - 24);
  },
};

/** In a box the table fits, the empty state adds nothing to its width: the table does not scroll. */
export const EmptyStateKeepsAFittingTableFromScrolling: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div style={{ width: 900 }}>
      <EmptyNodes />
    </div>
  ),
  play: ({ canvasElement }) => {
    const container = canvasElement.querySelector('table')!.parentElement!;
    expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
  },
};

export const Loading: Story = {
  render: () => (
    <Table aria-busy="true">
      <TableCaption>Compute nodes</TableCaption>
      <NodeHead />
      <TableBody>
        <TableSkeletonRows rows={4} columns={5} numericColumns={[2, 3, 4]} />
      </TableBody>
    </Table>
  ),
};

export const LoadingChecks: Story = {
  ...Loading,
  tags: ['!dev', '!autodocs'],
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
    <>
      {(['default', 'comfortable'] as const).map((density) => (
        <Table key={density} density={density} aria-label={density} className="mb-4">
          <TableBody>
            <TableSkeletonRows rows={1} columns={3} />
          </TableBody>
        </Table>
      ))}
    </>
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
    <>
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
    </>
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
          <TableRow key={n.host}>
            <TableCell>
              <TableIdentityCell title={n.host} subtitle={n.room} icon={Server} />
            </TableCell>
            <TableCell>
              <TableIdCell>{`i-${n.host.slice(-3)}a9f${n.power}c0e41d7`}</TableIdCell>
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
                aria-label={`Memory used on ${n.host}`}
              />
            </TableCell>
            <TableCell>
              <TableDescriptionCell className="max-w-48">{n.note || '—'}</TableDescriptionCell>
            </TableCell>
            <TableCell numeric>
              <Trend value={n.trend} />
            </TableCell>
            <TableCell numeric>
              <TableAmountCell value={n.cost} currency="EUR" locale="en-GB" />
            </TableCell>
            <TableCell align="end">
              <RowActionButton aria-label={`View ${n.host}`} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const DashboardCellsChecks: Story = {
  ...DashboardCells,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = canvas.getByRole('row', { name: /node-b07/ });
    // The identity cell: the name, then its detail line, under an icon that says nothing more.
    await expect(within(row).getByText('node-b07')).toBeVisible();
    await expect(within(row).getByText('Room B')).toBeVisible();
    // The identifier is monospaced, and the note is cut with its whole text as a tooltip.
    await expect(getComputedStyle(within(row).getByText(/^i-b07/)).fontFamily).toMatch(/mono/i);
    const note = within(row).getByText(/Fan 3 failed/);
    await expect(note).toHaveAttribute('title', expect.stringContaining('replacement due Friday.'));
    await expect(note.scrollWidth).toBeGreaterThan(note.clientWidth);
    // Gains are green and losses red, signed so the colour is not the only cue, and readable in
    // every theme.
    const gain = within(row).getByText('+€148.90');
    const loss = within(canvas.getByRole('row', { name: /node-a02/ })).getByText('-€3.15');
    const zero = within(canvas.getByRole('row', { name: /node-b08/ })).getByText('€0.00');
    await expect(getComputedStyle(gain).color).not.toBe(getComputedStyle(loss).color);
    await expect(zero.className).not.toMatch(/green|red/);
    inEachTheme(() => {
      for (const el of [gain, loss, zero]) expectTextContrast(el);
    });
  },
};

// What `TableAmountCell` wrote before it shared its formatter with `Amount`: the same text, the
// same tint by sign, one element with no child. `format` still replaces the formatter.
const AMOUNT_CELLS = [
  { id: 'gain', cell: <TableAmountCell value={1240.5} currency="USD" locale="en-US" /> },
  { id: 'loss', cell: <TableAmountCell value={-89} currency="USD" locale="en-US" /> },
  { id: 'zero', cell: <TableAmountCell value={0} currency="USD" locale="en-US" /> },
  { id: 'euro', cell: <TableAmountCell value={148.9} currency="EUR" locale="en-GB" /> },
  { id: 'cents', cell: <TableAmountCell value={-0.001} currency="USD" locale="en-US" /> },
  { id: 'plain', cell: <TableAmountCell value={1234.5} locale="en-US" /> },
  { id: 'custom', cell: <TableAmountCell value={5} format={(v) => `${v} pts`} /> },
];

export const AmountCellKeepsItsOutput: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      {AMOUNT_CELLS.map(({ id, cell }) => (
        <div key={id} data-testid={id}>
          {cell}
        </div>
      ))}
    </>
  ),
  play: async ({ canvas }) => {
    const cell = (id: string) => canvas.getByTestId(id).firstElementChild as HTMLElement;
    const text: Record<string, string> = {
      gain: '+$1,240.50',
      loss: '-$89.00',
      zero: '$0.00',
      euro: '+€148.90',
      // Rounded to zero, so no sign: `exceptZero` does not write one in front of a nothing.
      cents: '$0.00',
      plain: '+1,234.5',
      custom: '5 pts',
    };
    for (const [id, expected] of Object.entries(text)) {
      await expect(cell(id).textContent, id).toBe(expected);
      // One element that holds the text and nothing else.
      await expect(cell(id).childElementCount, id).toBe(0);
      const style = getComputedStyle(cell(id));
      await expect(style.display, id).toBe('inline');
      await expect(style.whiteSpace, id).toBe('nowrap');
      await expect(style.fontWeight, id).toBe('500');
      await expect(style.fontVariantNumeric, id).toContain('tabular-nums');
    }
    // Green for a gain, red for a loss, the surrounding text colour for zero.
    const color = (id: string) => getComputedStyle(cell(id)).color;
    const around = getComputedStyle(canvas.getByTestId('zero')).color;
    await expect(color('gain')).not.toBe(around);
    await expect(color('loss')).not.toBe(around);
    await expect(color('gain')).not.toBe(color('loss'));
    await expect(color('gain')).toBe(color('euro'));
    await expect(color('zero')).toBe(around);
    // A cell that shows "$0.00" is still tinted by the sign of its value, as it always was.
    await expect(color('cents')).toBe(color('loss'));
  },
};

const mobileStickyFirstColumn: Story = {
  globals: mobileViewport,
  render: () => (
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
          <NodeRow key={n.host} node={n} />
        ))}
      </TableBody>
    </Table>
  ),
};

export const MobileStickyFirstColumnChecks: Story = {
  ...mobileStickyFirstColumn,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const table = canvas.getByRole('table', { name: 'Compute nodes' });
    const scroller = table.parentElement as HTMLElement;
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    // A region that scrolls is a tab stop, so the keyboard can scroll it.
    await waitFor(() => expect(scroller).toHaveAttribute('tabindex', '0'));
    // The end fades, the start does not: the first column is pinned there.
    await waitFor(() => expect(getComputedStyle(scroller).maskImage).not.toBe('none'));
    const left = (el: Element) => startEdge(el.getBoundingClientRect());
    const head = canvas.getAllByRole('columnheader')[0];
    const cell = canvas.getAllByRole('row')[2].firstElementChild as HTMLElement;
    const second = canvas.getAllByRole('row')[2].children[1];
    // Pinned to the padding box of the wrapper, inside its 1px border.
    const start = left(scroller) + scroller.clientLeft;
    const before = left(second);
    scrollAlong(scroller, 120);
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

/**
 * The first column sticks to the start edge, with its hairline on the side the rest scrolls
 * under, and the edge fade is on the end side only.
 */
export const StickyFirstColumnFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      {(['ltr', 'rtl'] as const).map((dir) => (
        <div key={dir} dir={dir} data-direction={dir} className="mb-4 w-80">
          <Table stickyFirstColumn aria-label={`Nodes ${dir}`}>
            <TableCaption>Nodes {dir}</TableCaption>
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
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{NODES[0]!.host}</TableCell>
                <TableCell>{NODES[0]!.room}</TableCell>
                <TableCell numeric>{NODES[0]!.cpu}%</TableCell>
                <TableCell numeric>{NODES[0]!.memory}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ))}
    </>
  ),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const table = within(box).getByRole('table');
      const scroller = table.parentElement as HTMLElement;
      const cell = within(box).getByText('node-a01');
      await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
      // At rest the first column is at the start edge of the scroller (inside its 1px border).
      await expect(startOffset(cell, scroller) - scroller.clientLeft, dir).toBeLessThan(
        endOffset(cell, scroller)
      );
      scrollAlong(scroller, 120);
      // Scrolled, it stays on the same edge, and its hairline is on the side facing the rest.
      await waitFor(() =>
        expect(startEdge(cell.getBoundingClientRect(), box)).toBe(
          startEdge(scroller.getBoundingClientRect(), box) + scroller.clientLeft
        )
      );
      await expect(getComputedStyle(cell).boxShadow, dir).toContain(
        dir === 'ltr' ? ' -1px 0px 0px 0px inset' : ' 1px 0px 0px 0px inset'
      );
      // The fade covers the end only: its gradient starts at the start edge and has no start fade.
      await expect(getComputedStyle(scroller).maskImage, dir).toMatch(
        new RegExp(`^linear-gradient\\(to ${dir === 'rtl' ? 'left' : 'right'}, rgb\\(0, 0, 0\\)`)
      );
    }
  },
};
