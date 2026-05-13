import type { Meta, StoryObj } from '@storybook/react-vite';
import { Archive, Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { DataTable } from './DataTable';
import type { ColumnDef } from './types';
import { StatusBadge } from '../status/StatusBadge';
import { Button } from '../ui/Button';
import { RowActionButton } from '../ui/RowActionButton';
import { SectionCard } from '../templates/SectionCard';
import type { HealthStatus } from '../status/types';

const meta = {
  title: 'Tables/DataTable',
  component: DataTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { rows: [], columns: [], rowKey: () => '' },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

type Alert = {
  id: string;
  severity: HealthStatus;
  name: string;
  type: string;
  location: string;
  rack: string;
  room: string;
};

const SEVERITIES: HealthStatus[] = ['OK', 'WARN', 'CRIT', 'INFO'];
const TYPES = ['cpu', 'memory', 'temp', 'power', 'disk', 'network'];
const ROOMS = ['Room A', 'Room B', 'Room C'];

const rows: Alert[] = Array.from({ length: 60 }, (_, i) => ({
  id: `alert-${i + 1}`,
  severity: SEVERITIES[i % SEVERITIES.length],
  name: `node-${100 + i}`,
  type: TYPES[i % TYPES.length],
  location: `DC${(i % 3) + 1}`,
  rack: `rack-${String((i % 12) + 1).padStart(2, '0')}`,
  room: ROOMS[i % ROOMS.length],
}));

const columns: ColumnDef<Alert>[] = [
  {
    key: 'severity',
    label: 'Severity',
    width: '12%',
    sortable: true,
    filterable: true,
    sortValue: (r) => r.severity,
    filterValue: (r) => r.severity,
    render: (r) => <StatusBadge status={r.severity} size="md" />,
  },
  {
    key: 'name',
    label: 'Name',
    width: '20%',
    sortable: true,
    sortValue: (r) => r.name,
    searchValue: (r) => r.name,
    render: (r) => <span className="font-medium text-gray-900 dark:text-white">{r.name}</span>,
  },
  {
    key: 'type',
    label: 'Type',
    width: '12%',
    sortable: true,
    filterable: true,
    sortValue: (r) => r.type,
    filterValue: (r) => r.type,
    render: (r) => r.type,
  },
  {
    key: 'location',
    label: 'Location',
    width: '12%',
    sortable: true,
    filterable: true,
    sortValue: (r) => r.location,
    filterValue: (r) => r.location,
    render: (r) => r.location,
  },
  {
    key: 'rack',
    label: 'Rack',
    width: '12%',
    sortable: true,
    sortValue: (r) => r.rack,
    render: (r) => r.rack,
  },
  {
    key: 'room',
    label: 'Room',
    width: '12%',
    sortable: true,
    filterable: true,
    sortValue: (r) => r.room,
    filterValue: (r) => r.room,
    render: (r) => r.room,
  },
];

export const Alerts: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="DataTable — sortable, filterable, paginated">
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          renderRowAction={() => <RowActionButton>View</RowActionButton>}
          pageSize={10}
        />
      </SectionCard>
    </Wrap>
  ),
};

export const Loading: Story = {
  render: () => (
    <Wrap>
      <DataTable rows={[]} columns={columns} rowKey={(r) => r.id} loading />
    </Wrap>
  ),
};

export const ErrorWithRetry: Story = {
  render: () => (
    <Wrap>
      <DataTable
        rows={[]}
        columns={columns}
        rowKey={(r) => r.id}
        error="Failed to fetch alerts."
        onRetry={() => {}}
      />
    </Wrap>
  ),
};

export const Empty: Story = {
  render: () => (
    <Wrap>
      <DataTable
        rows={[]}
        columns={columns}
        rowKey={(r) => r.id}
        emptyTitle="No active alerts"
        emptyDescription="All nodes are healthy."
      />
    </Wrap>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const NextPageButton: Story = {
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} pageSize={10} />,
  play: async ({ canvas }) => {
    // 60 rows / 10 = 6 pages. Initial range is "1–10" — but the dash and the
    // numbers live in separate `<b>` nodes around the `Showing` literal. Use
    // a function matcher with normalized text to handle whitespace + spans.
    const findRange = (range: string) =>
      canvas.getByText(
        (_, el) =>
          el?.tagName === 'P' &&
          /^Showing\s/.test(el.textContent ?? '') &&
          (el.textContent ?? '').includes(range)
      );
    await expect(findRange('1–10')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /Next/ }));
    await expect(findRange('11–20')).toBeInTheDocument();
  },
};

export const SortByName: Story = {
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} pageSize={10} />,
  play: async ({ canvas }) => {
    // Default order: node-100, node-101, …
    const nameCol = canvas.getByRole('button', { name: /Name/ });
    await userEvent.click(nameCol); // asc
    await userEvent.click(nameCol); // desc
    // After desc, the highest node-159 should appear in the first row
    await expect(canvas.getByText('node-159')).toBeInTheDocument();
  },
};

// ── New: Selection + Bulk actions + Global search ────────────────────────────

export const WithSelection: Story = {
  render: () => (
    <Wrap>
      <DataTable
        rows={rows.slice(0, 8)}
        columns={columns}
        rowKey={(r) => r.id}
        pageSize={10}
        selectable
      />
    </Wrap>
  ),
};

export const WithBulkActions: Story = {
  render: () => (
    <Wrap>
      <DataTable
        rows={rows.slice(0, 8)}
        columns={columns}
        rowKey={(r) => r.id}
        pageSize={10}
        selectable
        bulkActions={(selected) => (
          <>
            <Button variant="ghost" size="sm" icon={Download}>
              Export ({selected.length})
            </Button>
            <Button variant="secondary" size="sm" icon={Archive}>
              Archive
            </Button>
            <Button variant="danger" size="sm" icon={Trash2}>
              Delete
            </Button>
          </>
        )}
      />
    </Wrap>
  ),
};

export const WithGlobalSearch: Story = {
  render: () => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        pageSize={10}
        defaultSearchValue=""
        searchPlaceholder="Search by name…"
      />
    </Wrap>
  ),
};

export const SelectionBulkSearchCombined: Story = {
  render: () => {
    const [selection, setSelection] = useState<Set<string | number>>(new Set());
    const [search, setSearch] = useState('');
    return (
      <Wrap>
        <SectionCard title={`DataTable — ${selection.size} selected · search: "${search || '(none)'}"`}>
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            pageSize={10}
            selectable
            selection={selection}
            onSelectionChange={setSelection}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Filter by name…"
            bulkActions={(selected) => (
              <>
                <Button variant="ghost" size="sm" icon={Download}>
                  Export ({selected.length})
                </Button>
                <Button variant="danger" size="sm" icon={Trash2}>
                  Delete
                </Button>
              </>
            )}
          />
        </SectionCard>
      </Wrap>
    );
  },
};

// ── New interaction tests ────────────────────────────────────────────────────

export const SelectAllToggles: Story = {
  render: (args) => (
    <DataTable
      rows={rows.slice(0, 5)}
      columns={columns}
      rowKey={(r) => r.id}
      pageSize={10}
      selectable
      onSelectionChange={args.onSelectionChange as (s: Set<string | number>) => void}
    />
  ),
  args: { onSelectionChange: fn() },
  play: async ({ args, canvas }) => {
    const selectAll = canvas.getByLabelText(/select all rows/i);
    await userEvent.click(selectAll);
    // 5 rows selected
    await expect(args.onSelectionChange).toHaveBeenCalled();
    // The header checkbox should now reflect "all selected"
    await expect((selectAll as HTMLInputElement).checked).toBe(true);
  },
};

export const SearchFiltersRows: Story = {
  render: () => (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      pageSize={10}
      defaultSearchValue=""
    />
  ),
  play: async ({ canvas }) => {
    // Initially node-100 should be visible
    await expect(canvas.getByText('node-100')).toBeInTheDocument();
    const search = canvas.getByLabelText(/search rows/i);
    await userEvent.type(search, 'node-159');
    // After search, only node-159 should be visible
    await expect(canvas.getByText('node-159')).toBeInTheDocument();
    await expect(canvas.queryByText('node-100')).toBeNull();
  },
};

export const BulkActionsAppearWhenSelected: Story = {
  render: () => (
    <DataTable
      rows={rows.slice(0, 3)}
      columns={columns}
      rowKey={(r) => r.id}
      pageSize={10}
      selectable
      bulkActions={(s) => <Button size="sm">Delete {s.length}</Button>}
    />
  ),
  play: async ({ canvas }) => {
    // No bulk action visible yet
    await expect(canvas.queryByRole('button', { name: /delete/i })).toBeNull();
    // Select first row
    const firstRowCb = canvas.getByLabelText(/select row alert-1$/i);
    await userEvent.click(firstRowCb);
    // Bulk action toolbar appears
    await expect(canvas.getByText(/1 selected/)).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /delete 1/i })).toBeInTheDocument();
    // Clear button restores
    await userEvent.click(canvas.getByRole('button', { name: /clear/i }));
    await expect(canvas.queryByText(/selected/i)).toBeNull();
  },
};
