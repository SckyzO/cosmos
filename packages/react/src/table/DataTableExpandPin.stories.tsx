import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { DataTable } from './DataTable';
import { HOSTS, hostColumns, type Host } from './storybook-hosts';
import type { ColumnDef } from './types';

// Expandable rows (`renderExpandedRow`) and pinned columns (`pin`), in their own file with the
// other DataTable additions: DataTable.stories.tsx is already one of the largest stories files of
// the package.
const meta = {
  title: 'Tables/DataTable expandable rows and pinned columns',
  component: DataTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { rows: [], columns: [], rowKey: () => '' },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">
    <div className={className}>{children}</div>
  </div>
);

const EVENTS = [
  ['06:12', 'CPU above 80% for 10 minutes'],
  ['05:58', 'Fan 3 below its minimum speed'],
  ['04:30', 'Agent restarted'],
] as const;

const detail = (r: Host) => (
  <div className="flex flex-wrap gap-x-12 gap-y-4">
    <dl className="grid w-72 grid-cols-2 gap-x-10 gap-y-4">
      {[
        ['IP address', r.ip],
        ['Datacenter', r.dc],
        ['Uptime', '41 days'],
        ['Owner', r.owner],
      ].map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-[var(--color-text-muted)]">{k}</dt>
          <dd className="text-sm text-[var(--color-text-base)]">{v}</dd>
        </div>
      ))}
    </dl>
    <div className="min-w-0 flex-1">
      <p className="mb-2 text-xs text-[var(--color-text-muted)]">Recent events</p>
      <ul className="flex flex-col gap-2 text-sm">
        {EVENTS.map(([time, text]) => (
          <li key={time} className="flex gap-4">
            <span className="w-11 text-[var(--color-text-muted)]">{time}</span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const summaryColumns: ColumnDef<Host>[] = [
  hostColumns[0],
  hostColumns[1],
  hostColumns[9],
  hostColumns[4],
  hostColumns[7],
  hostColumns[8],
].map((c) => ({ ...c, width: undefined }));

/** `renderExpandedRow` adds a chevron column; the detail opens in a row below, over every column. */
export const ExpandableRows: Story = {
  render: () => (
    <Wrap>
      <DataTable
        aria-label="Hosts"
        rows={HOSTS.slice(0, 5)}
        columns={summaryColumns}
        rowKey={(r) => r.host}
        renderExpandedRow={detail}
        defaultExpandedRows={new Set(['node-a02'])}
      />
    </Wrap>
  ),
};

const toggleOf = (canvas: ReturnType<typeof within>, host: string) =>
  canvas.getByRole('button', { name: new RegExp(`details for ${host}$`) });

export const ExpandAndCollapseByKeyboard: Story = {
  ...ExpandableRows,
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        aria-label="Hosts"
        rows={HOSTS.slice(0, 3)}
        columns={summaryColumns}
        rowKey={(r) => r.host}
        renderExpandedRow={detail}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    // The sortable Host header is the first Tab stop, the first row's toggle the next.
    await userEvent.tab();
    await userEvent.tab();
    await expect(toggleOf(canvas, 'node-a01')).toHaveFocus();
    await expect(toggleOf(canvas, 'node-a01')).toHaveAttribute('aria-expanded', 'false');
    await expect(toggleOf(canvas, 'node-a01')).not.toHaveAttribute('aria-controls');
    await userEvent.keyboard('{Enter}');
    const toggle = canvas.getByRole('button', { name: 'Hide details for node-a01' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveFocus();
    // It controls the row below, which spans every column.
    const detailRow = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    await expect(detailRow).toBeVisible();
    await expect(within(detailRow).getByText('Agent restarted')).toBeVisible();
    await expect(detailRow.querySelector('td')!.colSpan).toBe(
      canvas.getAllByRole('columnheader').length
    );
    // Space collapses it again.
    await userEvent.keyboard(' ');
    await expect(toggleOf(canvas, 'node-a01')).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByText('Agent restarted')).toBeNull();
    // Tab goes on to the next row's toggle.
    await userEvent.tab();
    await expect(toggleOf(canvas, 'node-a02')).toHaveFocus();
  },
};

export const TogglingNeverSelectsOrClicksTheRow: Story = {
  ...ExpandableRows,
  tags: ['!dev', '!autodocs'],
  args: { onRowClick: fn(), onSelectionChange: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        aria-label="Hosts"
        rows={HOSTS.slice(0, 3)}
        columns={summaryColumns}
        rowKey={(r) => r.host}
        renderExpandedRow={detail}
        selectable
        onRowClick={args.onRowClick}
        onSelectionChange={args.onSelectionChange}
      />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    await userEvent.click(toggleOf(canvas, 'node-a01'));
    await expect(canvas.getByText('Agent restarted')).toBeVisible();
    await expect(args.onRowClick).not.toHaveBeenCalled();
    await expect(args.onSelectionChange).not.toHaveBeenCalled();
    await expect(canvas.getByRole('checkbox', { name: 'Select row node-a01' })).not.toBeChecked();
  },
};

export const ControlledExpandedRows: Story = {
  ...ExpandableRows,
  tags: ['!dev', '!autodocs'],
  args: { onExpandedRowsChange: fn() },
  render: (args) => {
    const [expanded, setExpanded] = useState<Set<string | number>>(new Set(['node-a02']));
    return (
      <Wrap>
        <DataTable
          aria-label="Hosts"
          rows={HOSTS.slice(0, 3)}
          columns={summaryColumns}
          rowKey={(r) => r.host}
          renderExpandedRow={detail}
          expandedRows={expanded}
          onExpandedRowsChange={(next) => {
            args.onExpandedRowsChange?.(next);
            setExpanded(next);
          }}
        />
      </Wrap>
    );
  },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole('button', { name: 'Hide details for node-a02' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await userEvent.click(toggleOf(canvas, 'node-a01'));
    await expect(args.onExpandedRowsChange).toHaveBeenLastCalledWith(
      new Set(['node-a02', 'node-a01'])
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Hide details for node-a02' }));
    await expect(args.onExpandedRowsChange).toHaveBeenLastCalledWith(new Set(['node-a01']));
    await waitFor(() => expect(canvas.getAllByText('Agent restarted')).toHaveLength(1));
  },
};

/** A controlled set the host does not update never moves: the row stays as it was. */
export const ControlledExpandedRowsFollowTheHost: Story = {
  ...ExpandableRows,
  tags: ['!dev', '!autodocs'],
  args: { onExpandedRowsChange: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        aria-label="Hosts"
        rows={HOSTS.slice(0, 3)}
        columns={summaryColumns}
        rowKey={(r) => r.host}
        renderExpandedRow={detail}
        expandedRows={new Set()}
        onExpandedRowsChange={args.onExpandedRowsChange}
      />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    await userEvent.click(toggleOf(canvas, 'node-a01'));
    await expect(args.onExpandedRowsChange).toHaveBeenCalledWith(new Set(['node-a01']));
    await expect(toggleOf(canvas, 'node-a01')).toHaveAttribute('aria-expanded', 'false');
  },
};

export const VirtualizedTablesDoNotExpand: Story = {
  ...ExpandableRows,
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        aria-label="Hosts"
        rows={HOSTS}
        columns={summaryColumns}
        rowKey={(r) => r.host}
        renderExpandedRow={detail}
        virtualize
        pageSize={HOSTS.length}
        className="max-h-96"
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('table', { name: 'Hosts' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: /details for/ })).toBeNull();
  },
};

// ── Pinned columns ──────────────────────────────────────────────────────────

const pinnedColumns: ColumnDef<Host>[] = hostColumns.map((c) =>
  c.key === 'host' ? { ...c, pin: 'start' } : c.key === 'status' ? { ...c, pin: 'end' } : c
);

const PinnedTable = ({ columns = pinnedColumns }: { columns?: ColumnDef<Host>[] }) => (
  <Wrap className="max-w-3xl">
    <DataTable
      aria-label="Hosts"
      rows={HOSTS}
      columns={columns}
      rowKey={(r) => r.host}
      selectable
      renderRowAction={(r) => (
        <button
          type="button"
          aria-label={`Actions for ${r.host}`}
          className="focus-visible:focus-indicator rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
        >
          <MoreVertical aria-hidden className="h-4 w-4" />
        </button>
      )}
    />
  </Wrap>
);

/**
 * `pin: 'start'` on Host and `pin: 'end'` on Status keep them in place while the table scrolls
 * sideways: the selection column goes with the start, the action column with the end. A shadow
 * marks an edge while content scrolls under it.
 */
export const PinnedStartAndEnd: Story = { render: () => <PinnedTable /> };

const scrollerOf = (table: HTMLElement) => table.parentElement as HTMLElement;
const box = (el: Element) => el.getBoundingClientRect();
// The soft shadow of an edge: the line is there always, the 8px shadow only while content scrolls.
const casts = (el: Element) => getComputedStyle(el).boxShadow.includes('8px');

export const PinnedColumnsKeepTheirPlace: Story = {
  ...PinnedStartAndEnd,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Hosts' });
    const scroller = scrollerOf(table);
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    const row = within(table).getAllByRole('row')[1];
    const cells = within(row).getAllByRole('cell');
    // select, host, rack … status, action
    const [select, host, rack] = cells;
    const status = cells[cells.length - 2];
    const action = cells[cells.length - 1];
    const heads = within(table).getAllByRole('columnheader');
    const frame = box(scroller);
    const rackBefore = box(rack).left;
    scroller.scrollLeft = 300;
    await waitFor(() => expect(box(rack).left).toBeLessThan(rackBefore));
    // Start side: the selection column at the edge, the host right after it, header and body alike.
    await expect(Math.round(box(select).left)).toBe(Math.round(frame.left));
    await expect(Math.round(box(host).left)).toBe(Math.round(box(select).right));
    await expect(Math.round(box(heads[1]).left)).toBe(Math.round(box(host).left));
    // End side: the action column at the edge, the status right before it.
    await expect(Math.round(box(action).right)).toBe(Math.round(frame.right));
    await expect(Math.round(box(status).right)).toBe(Math.round(box(action).left));
    await expect(Math.round(box(heads[heads.length - 2]).left)).toBe(Math.round(box(status).left));
    // Pinned cells are opaque, or the ones under them would show through.
    for (const cell of [select, host, status, action]) {
      await expect(getComputedStyle(cell).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    }
    // Scrolled all the way, the end side has nothing under it any more.
    scroller.scrollLeft = scroller.scrollWidth;
    await waitFor(() => expect(casts(status)).toBe(false));
    await expect(Math.round(box(status).right)).toBe(Math.round(box(action).left));
  },
};

export const PinnedEdgeShadowsFollowTheScroll: Story = {
  ...PinnedStartAndEnd,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Hosts' });
    const scroller = scrollerOf(table);
    const row = within(table).getAllByRole('row')[1];
    const cells = within(row).getAllByRole('cell');
    const host = cells[1];
    const status = cells[cells.length - 2];
    // At the start nothing scrolls under the start side, and the end side has content under it.
    await waitFor(() => expect(casts(status), 'check 1 status').toBe(true));
    await expect(casts(host), 'check 2 host').toBe(false);
    // In the middle both do.
    scroller.scrollLeft = 200;
    await waitFor(() => expect(casts(host), 'check 3 host').toBe(true));
    await expect(casts(status), 'check 4 status').toBe(true);
    // At the end only the start side does.
    scroller.scrollLeft = scroller.scrollWidth;
    await waitFor(() => expect(casts(status), 'check 5 status').toBe(false));
    await expect(casts(host), 'check 6 host').toBe(true);
    // The edge fades give way to the pinned columns: no mask at either end.
    await expect(getComputedStyle(scroller).maskImage).toBe('none');
  },
};

export const SeveralPinnedColumnsAddUp: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <PinnedTable
      columns={hostColumns.map((c) =>
        c.key === 'host' || c.key === 'rack'
          ? { ...c, pin: 'start' }
          : c.key === 'status' || c.key === 'updated'
            ? { ...c, pin: 'end' }
            : c
      )}
    />
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Hosts' });
    const scroller = scrollerOf(table);
    scroller.scrollLeft = 400;
    const cells = within(within(table).getAllByRole('row')[1]).getAllByRole('cell');
    // select, host, rack, … , updated, status, action: each pinned cell follows the one before it.
    await waitFor(() =>
      expect(Math.round(box(cells[2]).left)).toBe(Math.round(box(cells[1]).right))
    );
    const n = cells.length;
    await expect(Math.round(box(cells[n - 3]).right)).toBe(Math.round(box(cells[n - 2]).left));
    await expect(Math.round(box(cells[n - 2]).right)).toBe(Math.round(box(cells[n - 1]).left));
  },
};

/** Widths are measured: a bigger text size and a narrower table keep every offset right. */
export const PinnedOffsetsFollowTheTextSizeAndTheWidth: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <PinnedTable
      columns={hostColumns.map((c) =>
        c.key === 'host'
          ? { ...c, width: '20%', pin: 'start' }
          : c.key === 'rack'
            ? { ...c, width: '12%', pin: 'start' }
            : c
      )}
    />
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Hosts' });
    const cells = () => within(within(table).getAllByRole('row')[1]).getAllByRole('cell');
    const aligned = () => {
      const [select, host, rack] = cells();
      expect(Math.round(box(host).left)).toBe(Math.round(box(select).right));
      expect(Math.round(box(rack).left)).toBe(Math.round(box(host).right));
    };
    scrollerOf(table).scrollLeft = 300;
    const root = document.documentElement;
    const before = root.getAttribute('data-text-size');
    try {
      for (const size of ['xl', 'sm']) {
        root.setAttribute('data-text-size', size);
        await waitFor(() => aligned());
      }
      // A narrower table moves the percentage widths.
      const wrap = table.closest('.max-w-3xl') as HTMLElement;
      wrap.style.maxWidth = '36rem';
      await waitFor(() => aligned());
    } finally {
      if (before === null) root.removeAttribute('data-text-size');
      else root.setAttribute('data-text-size', before);
    }
  },
};
