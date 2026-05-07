import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { DataTable } from './DataTable';
import type { ColumnDef } from './types';
import { StatusBadge } from '../status/StatusBadge';
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
