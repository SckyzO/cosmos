import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataTable } from './DataTable';
import type { ColumnDef } from './types';
import { StatusBadge } from '../status/StatusBadge';
import { RowActionButton } from '../ui/RowActionButton';
import { SectionCard } from '../templates/SectionCard';
import type { HealthStatus } from '../status/types';

const meta = {
  title: 'Tables/DataTable',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

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
