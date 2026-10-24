import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { Fragment, useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
} from './Table';
import { EmptyState } from '../feedback/EmptyState';
import { Sk } from '../feedback/Skeleton';
import { HealthDot } from '../status/HealthDot';
import { StatusBadge } from '../status/StatusBadge';
import type { HealthStatus } from '../status/types';
import { ProgressBar, type ProgressBarIntent } from '../ui/ProgressBar';
import { RowActionButton } from '../ui/RowActionButton';
import { expectFocusRing } from '../storybook-helpers';

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
};

export const Densities: Story = {
  render: () => (
    <Wrap>
      <div className="grid gap-6 lg:grid-cols-2">
        {(['default', 'comfortable'] as const).map((density) => (
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
          {rooms.map((room) => (
            <TableBody key={room}>
              <TableRow className="bg-gray-50/60 dark:bg-white/[0.03]">
                <TableHeaderCell
                  scope="rowgroup"
                  colSpan={5}
                  className="text-2xs tracking-wider text-[var(--color-text-secondary)] uppercase"
                >
                  {room}
                </TableHeaderCell>
              </TableRow>
              {NODES.filter((n) => n.room === room).map((n) => (
                <NodeRow key={n.name} node={n} />
              ))}
            </TableBody>
          ))}
        </Table>
      </Wrap>
    );
  },
  play: async ({ canvas }) => {
    // Each group header spans its own <tbody> with scope="rowgroup".
    const groupHeader = canvas.getAllByText('Room A').find((el) => el.tagName === 'TH');
    await expect(groupHeader).toHaveAttribute('scope', 'rowgroup');
  },
};

const ExpandableTable = () => {
  const [open, setOpen] = useState<Set<string>>(new Set());
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
};

export const Loading: Story = {
  render: () => (
    <Wrap>
      <Table aria-busy="true">
        <NodeHead />
        <TableBody>
          {Array.from({ length: 4 }, (_, row) => (
            <TableRow key={row}>
              <TableCell>
                <Sk h="h-3" w="w-24" />
              </TableCell>
              <TableCell>
                <Sk h="h-3" w="w-16" />
              </TableCell>
              {Array.from({ length: 3 }, (_, col) => (
                <TableCell key={col}>
                  <Sk h="h-3" w="w-10" className="ml-auto" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Wrap>
  ),
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
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="min-w-40">Memory</TableHeaderCell>
            <TableHeaderCell numeric>Power 24h</TableHeaderCell>
            <TableHeaderCell align="right">Action</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {NODES.map((n) => (
            <TableRow key={n.name}>
              <TableCell>
                <span className="flex items-center gap-2 font-medium whitespace-nowrap">
                  <HealthDot status={n.status} pulse={n.status === 'CRIT'} />
                  {n.name}
                </span>
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
              <TableCell numeric>
                <Trend value={n.trend} />
              </TableCell>
              <TableCell align="right">
                <RowActionButton aria-label={`View ${n.name}`} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Wrap>
  ),
};
