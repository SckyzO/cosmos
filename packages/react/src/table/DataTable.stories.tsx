import type { Meta, StoryObj } from '@storybook/react-vite';
import { Archive, Copy, Download, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  expectBelow,
  expectFocusBorder,
  expectFocusRing,
  expectOutsideClip,
  portalDocsParams,
  scrollAnchor,
} from '../storybook-helpers';
import { ColumnFilterDropdown } from './ColumnFilterDropdown';
import { DataTable } from './DataTable';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from './Table';
import type { ColumnDef, DataTableDensity } from './types';
import { StatusBadge } from '../status/StatusBadge';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import type { Intent } from '../ui/intent';
import { Button } from '../ui/Button';
import { Menu } from '../ui/Menu';
import { RowActionButton } from '../ui/RowActionButton';
import { RowActionsMenu } from './RowActionsMenu';
import { expectNoHorizontalOverflow, mobileViewport } from '../storybook-helpers';
import { SectionCard } from '../templates/SectionCard';
import type { HealthStatus } from '../status/types';

// What the row menu's danger item calls.
const deleted = fn();

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
      <DataTable rows={[]} columns={columns} rowKey={(r) => r.id} loading loadingRows={4} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    // The header stays, so the columns do not jump: its cells, then one row per placeholder.
    await expect(canvas.getAllByRole('columnheader')).toHaveLength(columns.length);
    const table = canvas.getByRole('table');
    await expect(table).toHaveAttribute('aria-busy', 'true');
    await expect(table.querySelector('thead')).not.toBeNull();
    await expect(table.querySelectorAll('tbody > tr')).toHaveLength(4);
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading…');
  },
};

export const LoadingKeepsTheSelectionAndActionColumns: Story = {
  tags: ['!dev'],
  render: () => (
    <Wrap>
      <DataTable
        rows={[]}
        columns={columns}
        rowKey={(r) => r.id}
        loading
        selectable
        renderRowAction={() => <RowActionButton>View</RowActionButton>}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    // The default is five rows, and every one has a cell per column.
    const rowsLoading = within(canvas.getByRole('table')).getAllByRole('row').slice(1);
    await expect(rowsLoading).toHaveLength(5);
    for (const row of rowsLoading) await expect(row.children).toHaveLength(columns.length + 2);
    const heads = canvas.getAllByRole('columnheader');
    await expect(heads[0].getBoundingClientRect().width).toBe(44);
  },
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
  play: async ({ canvas }) => {
    // The header stays above the error, so the page has the same shape as with rows.
    await expect(canvas.getAllByRole('columnheader')).toHaveLength(columns.length);
    await expect(canvas.getByRole('table').querySelector('thead')).not.toBeNull();
    await expect(canvas.getByText('Failed to fetch alerts.')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  },
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
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('columnheader')).toHaveLength(columns.length);
    await expect(canvas.getByRole('table').querySelector('thead')).not.toBeNull();
    await expect(canvas.getByText('No active alerts')).toBeInTheDocument();
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const NextPageButton: Story = {
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} pageSize={10} />,
  play: async ({ canvas }) => {
    // 60 rows / 10 = 6 pages. The range is split over several nodes: match
    // the info line by its normalized text.
    const findRange = (range: string) =>
      canvas.getByText((_, el) => el?.tagName === 'SPAN' && el.textContent === `Showing ${range}`);
    await expect(findRange('1 to 10 of 60')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(findRange('11 to 20 of 60')).toBeInTheDocument();
  },
};

export const PagerIsANavigation: Story = {
  tags: ['!dev'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} pageSize={10} />,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Pagination' });
    await expect(within(nav).getByRole('button', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await userEvent.click(within(nav).getByRole('button', { name: 'Page 3' }));
    await expect(within(nav).getByRole('button', { name: 'Page 3' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await userEvent.click(within(nav).getByRole('button', { name: 'Show all' }));
    await expect(nav).toHaveTextContent('Showing all 60 results');
  },
};

export const Mobile: Story = {
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} pageSize={10} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(canvas.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
    await expect(canvas.getByText(/^Page/)).toHaveTextContent('Page 1 / 6');
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

export const ColumnFilterOpensBeforeAnyFilter: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} pageSize={10} />,
  play: async ({ canvas }) => {
    // No filter is applied yet: the first click on a filter icon must still
    // open the dropdown with its options.
    const [firstFilter] = canvas.getAllByRole('button', { name: /^Filter / });
    await userEvent.click(firstFilter);
    // The dropdown is queried from the whole page, wherever it renders.
    const page = within(document.body);
    await expect(page.getByPlaceholderText('Search…')).toBeInTheDocument();
    const [firstOption] = page.getAllByRole('checkbox');
    await userEvent.click(firstOption);
    await expect(page.getByRole('button', { name: /Clear \(1 selected\)/ })).toBeInTheDocument();
  },
};

// ── Scrolling rows ───────────────────────────────────────────────────────────

/** Rows that scroll take the focus, as a region named by `aria-label`; rows that fit do not. */
export const ScrollingRowsAreFocusableOnesThatFitAreNot: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="space-y-6">
        <DataTable
          aria-label="Scrolling alerts"
          className="max-h-72"
          rows={rows.slice(0, 30)}
          columns={columns}
          rowKey={(r) => r.id}
          pageSize={30}
        />
        <DataTable
          aria-label="Short alerts"
          rows={rows.slice(0, 2)}
          columns={columns}
          rowKey={(r) => r.id}
        />
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const region = await canvas.findByRole('region', { name: 'Scrolling alerts' });
    await expect(region).toHaveAttribute('tabindex', '0');
    // The name is the label alone, not the text of the cells.
    await expect(region).toHaveAccessibleName('Scrolling alerts');
    await expect(canvas.getByRole('table', { name: 'Scrolling alerts' })).toBeVisible();
    await expect(region.scrollHeight).toBeGreaterThan(region.clientHeight);
    await expectFocusRing(region, { inset: true });

    // The other table fits: no tab stop, no region, but still a named table.
    const fitting = canvas.getByRole('table', { name: 'Short alerts' }).parentElement!;
    await expect(fitting).not.toHaveAttribute('tabindex');
    await expect(fitting).not.toHaveAttribute('role');
    await expect(fitting).not.toHaveAttribute('aria-label');
    await expect(canvas.queryByRole('region', { name: 'Short alerts' })).toBeNull();
  },
};

/** With no label the scrolling rows have no name to give: focusable, but not a region. */
export const ScrollingRowsWithoutLabelAreFocusableNotARegion: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        className="max-h-72"
        rows={rows.slice(0, 30)}
        columns={columns}
        rowKey={(r) => r.id}
        pageSize={30}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const scroller = canvas.getByRole('table').parentElement!;
    await waitFor(() => expect(scroller).toHaveAttribute('tabindex', '0'));
    await expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
    // Not named after the table's content either: that would read out every cell.
    await expect(scroller).not.toHaveAttribute('role');
    await expect(scroller).not.toHaveAttribute('aria-label');
    await expect(scroller).not.toHaveAttribute('aria-labelledby');
    await expect(canvas.queryByRole('region')).toBeNull();
    await expectFocusRing(scroller, { inset: true });
  },
};

/** `aria-labelledby` names the table and its scrolling area after a heading on the page. */
export const ScrollingRowsNamedByAHeading: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <h2 id="alerts-title" className="mb-3 text-lg font-semibold">
        Open alerts
      </h2>
      <DataTable
        aria-labelledby="alerts-title"
        className="max-h-72"
        rows={rows.slice(0, 30)}
        columns={columns}
        rowKey={(r) => r.id}
        pageSize={30}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const region = await canvas.findByRole('region', { name: 'Open alerts' });
    await expect(region).toHaveAttribute('tabindex', '0');
    await expect(canvas.getByRole('table', { name: 'Open alerts' })).toBeVisible();
  },
};

/**
 * The scrolling area follows what it holds: when a search leaves nothing, the empty state fits
 * and the tab stop goes; when the search is cleared, the rows come back and so does the tab stop.
 */
export const ScrollingAreaFollowsItsContent: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        aria-label="Searchable alerts"
        className="h-72"
        defaultSearchValue=""
        rows={rows.slice(0, 30)}
        columns={columns}
        rowKey={(r) => r.id}
        pageSize={30}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const region = await canvas.findByRole('region', { name: 'Searchable alerts' });
    const search = canvas.getByRole('searchbox', { name: 'Search rows' });

    await userEvent.type(search, 'no such node');
    await waitFor(() => expect(region).not.toHaveAttribute('tabindex'));
    await expect(region).not.toHaveAttribute('role');
    await expect(canvas.queryByRole('region', { name: 'Searchable alerts' })).toBeNull();

    await userEvent.clear(search);
    await waitFor(() => expect(region).toHaveAttribute('tabindex', '0'));
    await expect(canvas.getByRole('region', { name: 'Searchable alerts' })).toBe(region);
  },
};

export const SortableHeadersShowTheirAffordance: Story = {
  tags: ['!dev'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} pageSize={10} />,
  play: async ({ canvas }) => {
    // Before any sort every sortable column carries a muted two-way icon, hidden from assistive
    // technology (the button is named by its label).
    const name = canvas.getByRole('columnheader', { name: /Name/ });
    const button = within(name).getByRole('button', { name: 'Name' });
    const icon = button.querySelector('svg');
    await expect(icon).not.toBeNull();
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await expect(icon).toHaveClass('lucide-chevrons-up-down');
    await expect(name).toHaveAttribute('aria-sort', 'none');
    // Sorted, the icon points the way, and aria-sort follows.
    await userEvent.click(button);
    await expect(name).toHaveAttribute('aria-sort', 'ascending');
    await expect(button.querySelector('svg')).toHaveClass('lucide-chevron-up');
    await userEvent.click(button);
    await expect(name).toHaveAttribute('aria-sort', 'descending');
    await expect(button.querySelector('svg')).toHaveClass('lucide-chevron-down');
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
        renderRowAction={() => <RowActionButton>View</RowActionButton>}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    // The story's column widths add up to 80%: the rest goes to a data column, not to the
    // selection and action columns, which keep their fixed width.
    const heads = canvas.getAllByRole('columnheader');
    await expect(heads[0].getBoundingClientRect().width).toBe(44);
    const action = heads[heads.length - 1];
    await expect(action).toHaveTextContent('Action');
    await expect(action.getBoundingClientRect().width).toBe(96);
  },
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
            <Button intent="danger" size="sm" icon={Trash2}>
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
        <SectionCard
          title={`DataTable — ${selection.size} selected · search: "${search || '(none)'}"`}
        >
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
                <Button intent="danger" size="sm" icon={Trash2}>
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

// ── Comfortable density ──────────────────────────────────────────────────────

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  status: 'Active' | 'Invited' | 'Suspended';
  lastSeen: string;
};

const MEMBER_STATUS_INTENT: Record<Member['status'], Intent> = {
  Active: 'success',
  Invited: 'warning',
  Suspended: 'neutral',
};

const members: Member[] = (
  [
    ['Olivia Martin', 'Admin', 'Platform', 'Active', '2 min ago'],
    ['Liam Chen', 'Operator', 'Datacenter', 'Active', '18 min ago'],
    ['Sofia Rossi', 'Operator', 'Network', 'Active', '1 h ago'],
    ['Noah Dubois', 'Viewer', 'Finance', 'Invited', 'Never'],
    ['Emma Novak', 'Admin', 'Security', 'Active', 'Yesterday'],
    ['Lucas Silva', 'Operator', 'Datacenter', 'Suspended', '3 weeks ago'],
    ['Ava Patel', 'Viewer', 'Support', 'Active', '5 h ago'],
    ['Ethan Moreau', 'Operator', 'Network', 'Invited', 'Never'],
  ] as const
).map(([name, role, team, status, lastSeen], i) => ({
  id: `m-${i + 1}`,
  name,
  email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
  role,
  team,
  status,
  lastSeen,
}));

const memberColumns: ColumnDef<Member>[] = [
  {
    key: 'member',
    label: 'Member',
    width: '34%',
    sortable: true,
    sortValue: (m) => m.name,
    render: (m) => (
      <div className="flex items-center gap-3">
        <Avatar name={m.name} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium text-[var(--color-text-primary)]">{m.name}</p>
          <p className="truncate text-xs text-[var(--color-text-secondary)]">{m.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'role',
    label: 'Role',
    width: '20%',
    sortable: true,
    filterable: true,
    sortValue: (m) => m.role,
    filterValue: (m) => m.role,
    render: (m) => (
      <>
        <p>{m.role}</p>
        <p className="text-xs text-[var(--color-text-secondary)]">{m.team} team</p>
      </>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: '16%',
    filterable: true,
    filterValue: (m) => m.status,
    render: (m) => <Badge intent={MEMBER_STATUS_INTENT[m.status]}>{m.status}</Badge>,
  },
  {
    key: 'lastSeen',
    label: 'Last seen',
    width: '16%',
    render: (m) => <span className="text-[var(--color-text-secondary)]">{m.lastSeen}</span>,
  },
];

export const ComfortableDensity: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="DataTable — comfortable density for two-line rows">
        <DataTable
          rows={members}
          columns={memberColumns}
          rowKey={(m) => m.id}
          renderRowAction={() => <RowActionButton>Edit</RowActionButton>}
          selectable
          density="comfortable"
        />
      </SectionCard>
    </Wrap>
  ),
};

/**
 * The same rows in both densities. Comfortable headers and rows are taller,
 * the selection and action cells take the padding of the data cells, and the
 * extra height splits evenly above and below the content, which stays centred.
 */
export const ComfortableRowsAreTaller: Story = {
  render: () => (
    <Wrap>
      <div className="space-y-6">
        {(['default', 'comfortable'] as const).map((density) => (
          <section key={density} aria-label={`${density} density`}>
            <DataTable
              aria-label={`${density} density members`}
              rows={members.slice(0, 3)}
              columns={memberColumns}
              rowKey={(m) => m.id}
              renderRowAction={() => <RowActionButton>Edit</RowActionButton>}
              selectable
              density={density}
            />
          </section>
        ))}
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const rowsOf = (density: DataTableDensity) => {
      const region = within(canvas.getByRole('region', { name: `${density} density` }));
      const [header, firstRow] = within(region.getByRole('table')).getAllByRole('row');
      return { header, firstRow };
    };
    const height = (el: Element) => el.getBoundingClientRect().height;
    const paddings = (row: Element) =>
      new Set(Array.from(row.children, (cell) => getComputedStyle(cell).paddingTop));
    const standard = rowsOf('default');
    const comfortable = rowsOf('comfortable');

    await expect(height(comfortable.header)).toBeGreaterThan(height(standard.header));
    await expect(height(comfortable.firstRow)).toBeGreaterThan(height(standard.firstRow));

    // The default keeps today's padding, on every cell of the row.
    await expect(paddings(standard.header)).toEqual(new Set(['12px']));
    await expect(paddings(standard.firstRow)).toEqual(new Set(['14px']));
    await expect(paddings(comfortable.header).size).toBe(1);
    await expect(paddings(comfortable.firstRow).size).toBe(1);

    // Content stays centred, within a pixel, at the same offset as in the
    // default rows: the extra padding splits evenly above and below it.
    const centre = (el: Element) => {
      const box = el.getBoundingClientRect();
      return box.top + box.height / 2;
    };
    const offsets = (firstRow: HTMLElement) => {
      const row = within(firstRow);
      return [
        row.getByLabelText('Select row m-1').closest('label')!,
        row.getByLabelText('Olivia Martin'),
        row.getByRole('button', { name: 'Edit' }),
      ].map((el) => centre(el) - centre(firstRow));
    };
    const standardOffsets = offsets(standard.firstRow);
    for (const [i, offset] of offsets(comfortable.firstRow).entries()) {
      await expect(Math.abs(offset)).toBeLessThanOrEqual(1);
      await expect(offset).toBeCloseTo(standardOffsets[i], 0);
    }
  },
};

/**
 * The selection and action cells centre their content whatever the font: an
 * inline checkbox or button sat on the text baseline, so a fallback font,
 * shown while the web font loads, moved it off centre.
 */
export const CellsStayCentredWithAnyFont: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div style={{ fontFamily: 'serif', fontSize: 28 }}>
        <DataTable
          rows={members.slice(0, 1)}
          columns={memberColumns}
          rowKey={(m) => m.id}
          renderRowAction={() => <RowActionButton>Edit</RowActionButton>}
          selectable
          density="comfortable"
        />
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const [header, firstRow] = within(canvas.getByRole('table')).getAllByRole('row');
    const centre = (el: Element) => {
      const box = el.getBoundingClientRect();
      return box.top + box.height / 2;
    };
    const row = within(firstRow);
    for (const el of [
      row.getByLabelText('Select row m-1').closest('label')!,
      row.getByRole('button', { name: 'Edit' }),
    ]) {
      await expect(Math.abs(centre(el) - centre(firstRow))).toBeLessThanOrEqual(1);
    }
    const selectAll = within(header).getByLabelText('Select all rows').closest('label')!;
    await expect(Math.abs(centre(selectAll) - centre(header))).toBeLessThanOrEqual(1);
  },
};

// In the dark themes `dark:border-*` used to win over `focus:border-*` (#151).
export const SearchFocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  render: () => (
    <Wrap>
      <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} defaultSearchValue="" />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('searchbox', { name: 'Search rows' }));
  },
};

export const ColumnFilterSearchFocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  render: () => (
    <Wrap>
      <div className="relative h-72">
        <ColumnFilterDropdown
          values={['critical', 'warning', 'info']}
          selected={new Set()}
          onToggle={() => {}}
          onClear={() => {}}
        />
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByPlaceholderText('Search…'));
  },
};

export const SortableHeadersExposeAriaSort: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} pageSize={10} />,
  play: async ({ canvas }) => {
    const header = canvas.getByRole('columnheader', { name: /Name/ });
    await expect(header).toHaveAttribute('aria-sort', 'none');
    await userEvent.click(within(header).getByRole('button', { name: /Name/ }));
    await expect(header).toHaveAttribute('aria-sort', 'ascending');
    await userEvent.click(within(header).getByRole('button', { name: /Name/ }));
    await expect(header).toHaveAttribute('aria-sort', 'descending');
  },
};

export const FilterButtonsAreNamedAfterTheirColumn: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} pageSize={10} />,
  play: async ({ canvas }) => {
    const filters = canvas.getAllByRole('button', { name: /^Filter / });
    const names = filters.map((b) => b.getAttribute('aria-label'));
    await expect(new Set(names).size).toBe(names.length);
    await expect(canvas.getByRole('button', { name: 'Filter Severity' })).toBeInTheDocument();
  },
};

/** The filter button shows how many values are checked, and its name says it too (WCAG 2.5.3). */
export const FilterButtonNameHoldsTheCheckedCount: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} pageSize={10} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter Severity' }));
    // The dropdown is queried from the whole page, wherever it renders.
    const page = within(document.body);
    const [first, second] = page.getAllByRole('checkbox');
    await userEvent.click(first);
    const one = canvas.getByRole('button', { name: 'Filter Severity, 1 selected' });
    await expect(one).toHaveTextContent('1');
    await userEvent.click(second);
    await expect(
      canvas.getByRole('button', { name: 'Filter Severity, 2 selected' })
    ).toHaveTextContent('2');
  },
};

// ── Floating column filter (#151) ────────────────────────────────────────────
// The filter dropdown renders in a portal: the table's scrolling body no longer
// clips it, and it follows its header while the page scrolls.

/** A box cut just under the header row clips the table, not the dropdown. */
export const ColumnFilterEscapesTheTable: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="clip" className="overflow-hidden">
      <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} pageSize={10} />
    </div>
  ),
  play: async ({ canvas }) => {
    const filter = canvas.getByRole('button', { name: 'Filter Severity' });
    const clip = canvas.getByTestId('clip');
    const bottom = filter.getBoundingClientRect().bottom - clip.getBoundingClientRect().top;
    clip.style.height = `${bottom + 8}px`;
    await userEvent.click(filter);
    const search = await within(document.body).findByPlaceholderText('Search…');
    expectOutsideClip(search.closest<HTMLElement>('.rounded-xl')!, clip);
  },
};

/**
 * The dropdown stays under its header on scroll, focus in its search field; Escape and
 * an outside click close it, Escape returning focus to the filter button.
 */
export const ColumnFilterFollowsAndCloses: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="scroller" className="h-96 overflow-y-auto">
      <div className="space-y-4 p-6 pb-[600px]">
        <DataTable rows={rows.slice(0, 5)} columns={columns} rowKey={(r) => r.id} />
        <button type="button">Outside</button>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const page = within(document.body);
    const filter = canvas.getByRole('button', { name: 'Filter Severity' });
    // The label and the filter button: what the dropdown is placed against.
    const header = filter.parentElement!;
    await userEvent.click(filter);
    await expect(filter).toHaveAttribute('aria-expanded', 'true');
    const search = await page.findByPlaceholderText('Search…');
    await waitFor(() => expect(search).toHaveFocus());
    const dropdown = search.closest<HTMLElement>('.rounded-xl')!;
    await scrollAnchor(canvas.getByTestId('scroller'), header);
    await waitFor(() => expectBelow(dropdown, header, { offset: 4, align: 'start' }));

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(page.queryByPlaceholderText('Search…')).toBeNull());
    await expect(filter).toHaveFocus();
    await expect(filter).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(filter);
    await page.findByPlaceholderText('Search…');
    await userEvent.click(canvas.getByRole('button', { name: 'Outside' }));
    await waitFor(() => expect(page.queryByPlaceholderText('Search…')).toBeNull());
  },
};

// ── Row click and row links ──────────────────────────────────────────────────

export const ClickableRows: Story = {
  args: { onRowClick: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        rows={rows.slice(0, 6)}
        columns={columns}
        rowKey={(r) => r.id}
        selectable
        renderRowAction={() => <RowActionButton>View</RowActionButton>}
        onRowClick={args.onRowClick}
      />
    </Wrap>
  ),
  play: async ({ args, canvas }) => {
    const onRowClick = args.onRowClick as ReturnType<typeof fn>;
    const row = canvas.getByRole('row', { name: /node-100/ });
    await expect(row).toHaveClass('cursor-pointer');
    // A click on a cell is a click on the row.
    await userEvent.click(within(row).getByText('node-100'));
    await expect(onRowClick).toHaveBeenCalledTimes(1);
    await expect(onRowClick).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'alert-1' }));
    // The checkbox and the action column keep their own meaning.
    await userEvent.click(within(row).getByRole('checkbox', { name: 'Select row alert-1' }));
    await userEvent.click(within(row).getByRole('button', { name: 'View' }));
    await expect(onRowClick).toHaveBeenCalledTimes(1);
  },
};

export const ClickableRowFocusesFromTheKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onRowClick: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        rows={rows.slice(0, 3)}
        columns={columns}
        rowKey={(r) => r.id}
        onRowClick={args.onRowClick}
      />
    </Wrap>
  ),
  play: async ({ args, canvas }) => {
    const onRowClick = args.onRowClick as ReturnType<typeof fn>;
    const row = canvas.getByRole('row', { name: /node-101/ });
    await expect(row).toHaveAttribute('tabindex', '0');
    await expectFocusRing(row, { inset: true });
    await userEvent.keyboard('{Enter}');
    await expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'alert-2' }));
    await userEvent.keyboard(' ');
    await expect(onRowClick).toHaveBeenCalledTimes(2);
  },
};

// The link of a row would navigate the page that runs the story: record the click that reaches
// the document and cancel it.
const recordLinkClicks = () => {
  const followed: (string | null)[] = [];
  const listener = (e: Event) => {
    const link = (e.target as Element).closest('a');
    if (!link) return;
    e.preventDefault();
    followed.push(link.getAttribute('href'));
  };
  document.addEventListener('click', listener);
  return { followed, stop: () => document.removeEventListener('click', listener) };
};

// The link sits in the first column: the name leads.
const linkColumns = [columns[1], columns[0], ...columns.slice(2)];

export const LinkRows: Story = {
  render: () => (
    <Wrap>
      <DataTable
        rows={rows.slice(0, 6)}
        columns={linkColumns}
        rowKey={(r) => r.id}
        selectable
        rowHref={(r) => `#${r.id}`}
        renderRowAction={() => <RowActionButton>Edit</RowActionButton>}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const row = canvas.getByRole('row', { name: /node-100/ });
    const link = within(row).getByRole('link', { name: /node-100/ });
    await expect(link).toHaveAttribute('href', '#alert-1');
    // The link is drawn over the whole row: what sits under a point in another cell is the link,
    // and what sits under the checkbox and the action button is that control, not the link.
    const under = (el: Element) => {
      const r = el.getBoundingClientRect();
      return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    };
    await expect(under(within(row).getByText('cpu'))).toBe(link);
    const checkbox = within(row).getByRole('checkbox');
    const edit = within(row).getByRole('button', { name: 'Edit' });
    await expect(under(checkbox.closest('label') ?? checkbox)?.closest('label')).not.toBeNull();
    await expect(under(edit)?.closest('button')).toBe(edit);
    // Clicking a control does not follow the link; clicking elsewhere on the row does.
    const clicks = recordLinkClicks();
    try {
      await userEvent.click(within(row).getByRole('checkbox'));
      await userEvent.click(within(row).getByRole('button', { name: 'Edit' }));
      await expect(clicks.followed).toEqual([]);
      // userEvent clicks the element it is given, so give it the one under the cell's point.
      await userEvent.click(under(within(row).getByText('cpu'))!);
      await expect(clicks.followed).toEqual(['#alert-1']);
    } finally {
      clicks.stop();
    }
  },
};

export const LinkRowFocusesFromTheKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        rows={rows.slice(0, 3)}
        columns={linkColumns}
        rowKey={(r) => r.id}
        rowHref={(r) => `#${r.id}`}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const row = canvas.getByRole('row', { name: /node-102/ });
    const link = within(row).getByRole('link');
    // The row draws the ring: the link itself would only outline its cell.
    await expectFocusRing(link, { ring: row, inset: true });
    const clicks = recordLinkClicks();
    try {
      await userEvent.keyboard('{Enter}');
      await expect(clicks.followed).toEqual(['#alert-3']);
    } finally {
      clicks.stop();
    }
  },
};

export const RowMenu: Story = {
  parameters: portalDocsParams.lg(),
  args: { onRowClick: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        rows={rows.slice(0, 6)}
        columns={columns}
        rowKey={(r) => r.id}
        onRowClick={args.onRowClick}
        renderRowAction={(r) => (
          <RowActionsMenu aria-label={`Actions for ${r.name}`}>
            <Menu.Item icon={Pencil} onSelect={fn()}>
              Edit
            </Menu.Item>
            <Menu.Item icon={Copy}>Duplicate</Menu.Item>
            <Menu.Separator />
            <Menu.Item icon={Trash2} intent="danger" onSelect={() => deleted(r.id)}>
              Delete
            </Menu.Item>
          </RowActionsMenu>
        )}
      />
    </Wrap>
  ),
  play: async ({ args, canvas }) => {
    const onRowClick = args.onRowClick as ReturnType<typeof fn>;
    const page = within(document.body);
    deleted.mockClear();
    const trigger = canvas.getByRole('button', { name: 'Actions for node-101' });
    // The 32px button fits the action column.
    await expect(trigger.getBoundingClientRect().width).toBe(32);
    await userEvent.click(trigger);
    const menu = await page.findByRole('menu', { name: 'Actions for node-101' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // The danger item is red, and choosing it runs it, closes the menu, and is not a row click.
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }));
    await expect(deleted).toHaveBeenCalledWith('alert-2');
    await waitFor(() => expect(page.queryByRole('menu')).toBeNull());
    // Nor is the click on the trigger, or on the menu around its items, one on the row.
    await userEvent.click(trigger);
    await userEvent.click(await page.findByRole('separator'));
    await expect(onRowClick).not.toHaveBeenCalled();
  },
};

export const HeaderCellsShareOneStyleWithTable: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="space-y-6">
        <DataTable
          rows={rows.slice(0, 2)}
          columns={columns.slice(0, 2)}
          rowKey={(r) => r.id}
          selectable
          renderRowAction={() => <RowActionButton>View</RowActionButton>}
        />
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Severity</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>OK</TableCell>
              <TableCell>node-100</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const look = (el: Element) => {
      const cs = getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
      };
    };
    const [dataTable, table] = canvas.getAllByRole('table');
    const reference = look(within(table).getAllByRole('columnheader')[0]);
    await expect(reference.textTransform).toBe('uppercase');
    // Every header cell of the DataTable (selection, data and action) looks like the Table's,
    // and so does the label of a sortable one, which is a button.
    for (const th of within(dataTable).getAllByRole('columnheader')) {
      await expect(look(th)).toEqual(reference);
      const button = th.querySelector('button');
      if (button) await expect(look(button)).toMatchObject({ textTransform: 'uppercase' });
    }
  },
};
