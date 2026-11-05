import type { Meta, StoryObj } from '@storybook/react-vite';
import { Archive, Copy, Download, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  directionBox,
  endOffset,
  expectBelow,
  expectFocusBorder,
  expectFocusRing,
  expectOutsideClip,
  keyToEnd,
  portalDocsParams,
  scrollAlong,
  scrollAnchor,
  startEdge,
  startOffset,
} from '../storybook-helpers';
import { LabelsProvider, type LabelsInput } from '../labels/LabelsProvider';
import { ColumnFilterDropdown } from './ColumnFilterDropdown';
import { DataTable } from './DataTable';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from './Table';
import type { ColumnDef, DataTableDensity } from './types';
import { Button } from '../ui/Button';
import { Menu } from '../ui/Menu';
import { RowActionButton } from '../ui/RowActionButton';
import { RowActionsMenu } from './RowActionsMenu';
import { TableAmountCell, TableDescriptionCell, TableIdCell } from './cells';
import {
  alertColumns,
  FRENCH_ACTIVE_FILTERS_LABELS,
  FRENCH_COLUMN_FILTER_LABELS,
  FRENCH_COLUMN_HEADER_LABELS,
  FRENCH_TABLE_LABELS,
  makeHosts,
  PEOPLE,
  peopleColumns,
  narrowMins,
  patchColumns,
  pickColumns,
  type Person,
  withIdentity,
  withPins,
} from './storybook-fixtures';
import { expectNoHorizontalOverflow, mobileViewport } from '../storybook-helpers';
import { SectionCard } from '../templates/SectionCard';

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

// The base table of the page: 60 hosts with an alert each, in the columns of an alerts list.
const rows = makeHosts(60);
const columns = alertColumns;

export const Alerts: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'When a table is wider than its box it scrolls sideways, and the edge that has more content fades.',
      },
    },
  },
  render: () => (
    <SectionCard title="DataTable — sortable, filterable, paginated">
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.host}
        renderRowAction={() => <RowActionButton>View</RowActionButton>}
        pageSize={10}
      />
    </SectionCard>
  ),
};

/**
 * The base table fits the docs page: with its selection and action columns it needs less than the
 * 790px a card of the docs page leaves it, so it does not scroll sideways and its edge does not
 * fade. `MobileScrollsWithAnEdgeFade` is the story where the table is wider than its box.
 */
export const AlertsFitTheDocsWidth: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div style={{ width: 790 }}>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.host}
        selectable
        renderRowAction={() => <RowActionButton>View</RowActionButton>}
        pageSize={10}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const scroller = scrollerOf(canvas.getByRole('table'));
    await expect(scroller.clientWidth).toBeGreaterThan(780);
    await expect(scroller.scrollWidth).toBeLessThanOrEqual(scroller.clientWidth);
    await expect(getComputedStyle(scroller).maskImage).toBe('none');
  },
};

export const Loading: Story = {
  render: () => (
    <DataTable rows={[]} columns={columns} rowKey={(r) => r.host} loading loadingRows={4} />
  ),
};

export const LoadingChecks: Story = {
  ...Loading,
  tags: ['!dev', '!autodocs'],
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
    <DataTable
      rows={[]}
      columns={columns}
      rowKey={(r) => r.host}
      loading
      selectable
      renderRowAction={() => <RowActionButton>View</RowActionButton>}
    />
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
    <DataTable
      rows={[]}
      columns={columns}
      rowKey={(r) => r.host}
      error="Failed to fetch alerts."
      onRetry={() => {}}
    />
  ),
};

export const ErrorWithRetryChecks: Story = {
  ...ErrorWithRetry,
  tags: ['!dev', '!autodocs'],
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
    <DataTable
      rows={[]}
      columns={columns}
      rowKey={(r) => r.host}
      emptyTitle="No active alerts"
      emptyDescription="All nodes are healthy."
    />
  ),
};

export const EmptyChecks: Story = {
  ...Empty,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('columnheader')).toHaveLength(columns.length);
    await expect(canvas.getByRole('table').querySelector('thead')).not.toBeNull();
    await expect(canvas.getByText('No active alerts')).toBeInTheDocument();
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const NextPageButton: Story = {
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.host} pageSize={10} />,
};

export const NextPageButtonChecks: Story = {
  ...NextPageButton,
  tags: ['!dev', '!autodocs'],
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
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.host} pageSize={10} />,
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

const mobile: Story = {
  globals: mobileViewport,
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.host} pageSize={10} />,
};

export const MobileChecks: Story = {
  ...mobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(canvas.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
    await expect(canvas.getByText(/^Page/)).toHaveTextContent('Page 1 / 6');
  },
};

export const SortByName: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.host} pageSize={10} />,
  play: async ({ canvas }) => {
    // Default order: node-00001, node-00002, …
    const nameCol = canvas.getByRole('button', { name: /Name/ });
    await userEvent.click(nameCol); // asc
    await userEvent.click(nameCol); // desc
    // After desc, the highest node-00060 should appear in the first row
    await expect(canvas.getByText('node-00060')).toBeInTheDocument();
  },
};

export const ColumnFilterOpensBeforeAnyFilter: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.host} pageSize={10} />,
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
    <div className="space-y-6">
      <DataTable
        aria-label="Scrolling alerts"
        className="max-h-72"
        rows={rows.slice(0, 30)}
        columns={columns}
        rowKey={(r) => r.host}
        pageSize={30}
      />
      <DataTable
        aria-label="Short alerts"
        rows={rows.slice(0, 2)}
        columns={columns}
        rowKey={(r) => r.host}
      />
    </div>
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
    <DataTable
      className="max-h-72"
      rows={rows.slice(0, 30)}
      columns={columns}
      rowKey={(r) => r.host}
      pageSize={30}
    />
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
    <>
      <h2 id="alerts-title" className="mb-3 text-lg font-semibold">
        Open alerts
      </h2>
      <DataTable
        aria-labelledby="alerts-title"
        className="max-h-72"
        rows={rows.slice(0, 30)}
        columns={columns}
        rowKey={(r) => r.host}
        pageSize={30}
      />
    </>
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
    <DataTable
      aria-label="Searchable alerts"
      className="h-96"
      defaultSearchValue=""
      rows={rows.slice(0, 30)}
      columns={columns}
      rowKey={(r) => r.host}
      pageSize={30}
    />
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
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.host} pageSize={10} />,
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
    <DataTable
      rows={rows.slice(0, 8)}
      columns={columns}
      rowKey={(r) => r.host}
      pageSize={10}
      selectable
      renderRowAction={() => <RowActionButton>View</RowActionButton>}
    />
  ),
};

export const WithSelectionChecks: Story = {
  ...WithSelection,
  tags: ['!dev', '!autodocs'],
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
    <DataTable
      rows={rows.slice(0, 8)}
      columns={columns}
      rowKey={(r) => r.host}
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
  ),
};

export const WithGlobalSearch: Story = {
  render: () => (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.host}
      pageSize={10}
      defaultSearchValue=""
      labels={{ searchPlaceholder: 'Search by name…' }}
    />
  ),
};

export const SelectionBulkSearchCombined: Story = {
  render: () => {
    const [selection, setSelection] = useState<Set<string | number>>(new Set());
    const [search, setSearch] = useState('');
    return (
      <SectionCard
        title={`DataTable — ${selection.size} selected · search: "${search || '(none)'}"`}
      >
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.host}
          pageSize={10}
          selectable
          selection={selection}
          onSelectionChange={setSelection}
          searchValue={search}
          onSearchChange={setSearch}
          labels={{ searchPlaceholder: 'Filter by name…' }}
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
    );
  },
};

// ── New interaction tests ────────────────────────────────────────────────────

export const SelectAllToggles: Story = {
  tags: ['!dev'],
  render: (args) => (
    <DataTable
      rows={rows.slice(0, 5)}
      columns={columns}
      rowKey={(r) => r.host}
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
  tags: ['!dev'],
  render: () => (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.host}
      pageSize={10}
      defaultSearchValue=""
    />
  ),
  play: async ({ canvas }) => {
    // Initially node-00001 should be visible
    await expect(canvas.getByText('node-00001')).toBeInTheDocument();
    const search = canvas.getByLabelText(/search rows/i);
    await userEvent.type(search, 'node-00060');
    // After search, only node-00060 should be visible
    await expect(canvas.getByText('node-00060')).toBeInTheDocument();
    await expect(canvas.queryByText('node-00001')).toBeNull();
  },
};

export const BulkActionsAppearWhenSelected: Story = {
  tags: ['!dev'],
  render: () => (
    <DataTable
      rows={rows.slice(0, 3)}
      columns={columns}
      rowKey={(r) => r.host}
      pageSize={10}
      selectable
      bulkActions={(s) => <Button size="sm">Delete {s.length}</Button>}
    />
  ),
  play: async ({ canvas }) => {
    // No bulk action visible yet
    await expect(canvas.queryByRole('button', { name: /delete/i })).toBeNull();
    // Select first row
    const firstRowCb = canvas.getByLabelText(/select row node-00001$/i);
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

// Eight people for the density stories: the person, the role with its team under it, the status
// and the last visit, in 76% of the table so the selection and action columns have room.
const members = PEOPLE.slice(0, 8);

const memberColumns = narrowMins(
  patchColumns(withIdentity(pickColumns(peopleColumns, ['name', 'role', 'status', 'lastSeen'])), {
    name: { label: 'Member', width: '30%' },
    role: {
      width: '18%',
      render: (m) => (
        <>
          <p>{m.role}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{m.team} team</p>
        </>
      ),
    },
    status: { width: '14%' },
    lastSeen: { width: '14%' },
  })
);

export const CompactDensity: Story = {
  render: () => (
    <SectionCard title="DataTable — compact density for long lists">
      <DataTable
        rows={members}
        columns={memberColumns}
        rowKey={(m) => m.id}
        renderRowAction={() => <RowActionButton>Edit</RowActionButton>}
        selectable
        density="compact"
      />
    </SectionCard>
  ),
};

export const ComfortableDensity: Story = {
  render: () => (
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
  ),
};

/**
 * The same rows in both densities. Comfortable headers and rows are taller,
 * the selection and action cells take the padding of the data cells, and the
 * extra height splits evenly above and below the content, which stays centred.
 */
export const ComfortableRowsAreTaller: Story = {
  tags: ['!dev'],
  render: () => (
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
        row.getByLabelText('Select row user-1').closest('label')!,
        row.getByLabelText('Ada Lovelace'),
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

/** Compact headers and rows are shorter than the default ones, with the padding of the theme's cell tokens. */
export const CompactRowsAreShorter: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-6">
      {(['default', 'compact'] as const).map((density) => (
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
    const compact = rowsOf('compact');

    await expect(height(compact.header)).toBeLessThan(height(standard.header));
    await expect(height(compact.firstRow)).toBeLessThan(height(standard.firstRow));
    await expect(paddings(compact.header)).toEqual(new Set(['8px']));
    await expect(paddings(compact.firstRow)).toEqual(new Set(['10px']));
    // Even compact keeps a row well above the 24px floor of a target.
    await expect(height(compact.firstRow)).toBeGreaterThanOrEqual(24);
  },
};

/**
 * Without a `density` prop the table follows the page's `data-density`; with one, it keeps its
 * own whatever the page says. The wrappers stand for the attribute on `<html>`.
 */
export const FollowsThePageDensity: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-6">
      {(['compact', 'default', 'comfortable'] as const).map((page) => (
        <div key={page} data-density={page} aria-label={`page ${page}`} role="group">
          <DataTable
            aria-label={`${page} page, no prop`}
            rows={members.slice(0, 2)}
            columns={memberColumns}
            rowKey={(m) => m.id}
          />
          <DataTable
            aria-label={`${page} page, default prop`}
            rows={members.slice(0, 2)}
            columns={memberColumns}
            rowKey={(m) => m.id}
            density="default"
          />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const cellPadding = (name: string) => {
      const [header, firstRow] = within(canvas.getByRole('table', { name })).getAllByRole('row');
      return [header, firstRow].map((row) => getComputedStyle(row.children[0]).paddingTop);
    };
    await expect(cellPadding('compact page, no prop')).toEqual(['8px', '10px']);
    await expect(cellPadding('default page, no prop')).toEqual(['12px', '14px']);
    await expect(cellPadding('comfortable page, no prop')).toEqual(['16px', '20px']);
    // A density of its own wins over the page.
    for (const page of ['compact', 'default', 'comfortable']) {
      await expect(cellPadding(`${page} page, default prop`)).toEqual(['12px', '14px']);
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
  ),
  play: async ({ canvas }) => {
    const [header, firstRow] = within(canvas.getByRole('table')).getAllByRole('row');
    const centre = (el: Element) => {
      const box = el.getBoundingClientRect();
      return box.top + box.height / 2;
    };
    const row = within(firstRow);
    for (const el of [
      row.getByLabelText('Select row user-1').closest('label')!,
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
    <DataTable rows={rows} columns={columns} rowKey={(r) => r.host} defaultSearchValue="" />
  ),
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('searchbox', { name: 'Search rows' }));
  },
};

export const ColumnFilterSearchFocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  render: () => (
    <div className="relative h-72">
      <ColumnFilterDropdown
        values={['critical', 'warning', 'info']}
        selected={new Set()}
        onToggle={() => {}}
        onClear={() => {}}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByPlaceholderText('Search…'));
  },
};

export const SortableHeadersExposeAriaSort: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.host} pageSize={10} />,
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
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.host} pageSize={10} />,
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
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.host} pageSize={10} />,
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
      <DataTable rows={rows} columns={columns} rowKey={(r) => r.host} pageSize={10} />
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
        <DataTable rows={rows.slice(0, 5)} columns={columns} rowKey={(r) => r.host} />
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
    <DataTable
      rows={rows.slice(0, 6)}
      columns={columns}
      rowKey={(r) => r.host}
      selectable
      renderRowAction={() => <RowActionButton>View</RowActionButton>}
      onRowClick={args.onRowClick}
    />
  ),
};

export const ClickableRowsChecks: Story = {
  ...ClickableRows,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas }) => {
    const onRowClick = args.onRowClick as ReturnType<typeof fn>;
    const row = canvas.getByRole('row', { name: /node-00001/ });
    await expect(row).toHaveClass('cursor-pointer');
    // A click on a cell is a click on the row.
    await userEvent.click(within(row).getByText('node-00001'));
    await expect(onRowClick).toHaveBeenCalledTimes(1);
    await expect(onRowClick).toHaveBeenLastCalledWith(
      expect.objectContaining({ host: 'node-00001' })
    );
    // The checkbox and the action column keep their own meaning.
    await userEvent.click(within(row).getByRole('checkbox', { name: 'Select row node-00001' }));
    await userEvent.click(within(row).getByRole('button', { name: 'View' }));
    await expect(onRowClick).toHaveBeenCalledTimes(1);
  },
};

export const ClickableRowFocusesFromTheKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onRowClick: fn() },
  render: (args) => (
    <DataTable
      rows={rows.slice(0, 3)}
      columns={columns}
      rowKey={(r) => r.host}
      onRowClick={args.onRowClick}
    />
  ),
  play: async ({ args, canvas }) => {
    const onRowClick = args.onRowClick as ReturnType<typeof fn>;
    const row = canvas.getByRole('row', { name: /node-00002/ });
    await expect(row).toHaveAttribute('tabindex', '0');
    await expectFocusRing(row, { inset: true });
    await userEvent.keyboard('{Enter}');
    await expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ host: 'node-00002' }));
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
    <DataTable
      rows={rows.slice(0, 6)}
      columns={linkColumns}
      rowKey={(r) => r.host}
      selectable
      rowHref={(r) => `#${r.host}`}
      renderRowAction={() => <RowActionButton>Edit</RowActionButton>}
    />
  ),
};

export const LinkRowsChecks: Story = {
  ...LinkRows,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = canvas.getByRole('row', { name: /node-00001/ });
    const link = within(row).getByRole('link', { name: /node-00001/ });
    await expect(link).toHaveAttribute('href', '#node-00001');
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
      await expect(clicks.followed).toEqual(['#node-00001']);
    } finally {
      clicks.stop();
    }
  },
};

export const LinkRowFocusesFromTheKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <DataTable
      rows={rows.slice(0, 3)}
      columns={linkColumns}
      rowKey={(r) => r.host}
      rowHref={(r) => `#${r.host}`}
    />
  ),
  play: async ({ canvas }) => {
    const row = canvas.getByRole('row', { name: /node-00003/ });
    const link = within(row).getByRole('link');
    // The row draws the ring: the link itself would only outline its cell.
    await expectFocusRing(link, { ring: row, inset: true });
    const clicks = recordLinkClicks();
    try {
      await userEvent.keyboard('{Enter}');
      await expect(clicks.followed).toEqual(['#node-00003']);
    } finally {
      clicks.stop();
    }
  },
};

export const RowMenu: Story = {
  parameters: portalDocsParams.lg(),
  args: { onRowClick: fn() },
  render: (args) => (
    <DataTable
      rows={rows.slice(0, 6)}
      columns={columns}
      rowKey={(r) => r.host}
      onRowClick={args.onRowClick}
      renderRowAction={(r) => (
        <RowActionsMenu aria-label={`Actions for ${r.host}`}>
          <Menu.Item icon={Pencil} onSelect={fn()}>
            Edit
          </Menu.Item>
          <Menu.Item icon={Copy}>Duplicate</Menu.Item>
          <Menu.Separator />
          <Menu.Item icon={Trash2} intent="danger" onSelect={() => deleted(r.host)}>
            Delete
          </Menu.Item>
        </RowActionsMenu>
      )}
    />
  ),
};

export const RowMenuChecks: Story = {
  ...RowMenu,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas }) => {
    const onRowClick = args.onRowClick as ReturnType<typeof fn>;
    const page = within(document.body);
    deleted.mockClear();
    const trigger = canvas.getByRole('button', { name: 'Actions for node-00002' });
    // The 32px button fits the action column.
    await expect(trigger.getBoundingClientRect().width).toBe(32);
    await userEvent.click(trigger);
    const menu = await page.findByRole('menu', { name: 'Actions for node-00002' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // The danger item is red, and choosing it runs it, closes the menu, and is not a row click.
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }));
    await expect(deleted).toHaveBeenCalledWith('node-00002');
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
    <div className="space-y-6">
      <DataTable
        rows={rows.slice(0, 2)}
        columns={columns.slice(0, 2)}
        rowKey={(r) => r.host}
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
            <TableCell>node-00001</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
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

// Wide enough to scroll sideways on a phone.
const wideColumns = columns.map((c) => ({ ...c, width: '160px' }));

const scrollerOf = (table: HTMLElement) => table.parentElement as HTMLElement;

const mobileScrollsWithAnEdgeFade: Story = {
  globals: mobileViewport,
  render: () => <DataTable rows={rows} columns={wideColumns} rowKey={(r) => r.host} pageSize={5} />,
};

export const MobileScrollsWithAnEdgeFadeChecks: Story = {
  ...mobileScrollsWithAnEdgeFade,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const scroller = scrollerOf(canvas.getByRole('table'));
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    // At the start, only the end fades: there is more past the end. The gradient runs from the
    // start edge, so it is `to right` in left to right and `to left` in right to left.
    const toward = getComputedStyle(scroller).direction === 'rtl' ? 'left' : 'right';
    await waitFor(() => expect(getComputedStyle(scroller).maskImage).not.toBe('none'));
    await expect(getComputedStyle(scroller).maskImage).toMatch(
      new RegExp(`^linear-gradient\\(to ${toward}, rgb\\(0, 0, 0\\), rgb\\(0, 0, 0\\) 24px`)
    );
    // Scrolled into the middle, both do; at the end, only the start.
    scrollAlong(scroller, 200);
    await waitFor(() =>
      expect(getComputedStyle(scroller).maskImage).toMatch(
        new RegExp(
          `^linear-gradient\\(to ${toward}, rgba\\(0, 0, 0, 0\\).*rgba\\(0, 0, 0, 0\\)\\)$`
        )
      )
    );
    scrollAlong(scroller, scroller.scrollWidth);
    await waitFor(() =>
      expect(getComputedStyle(scroller).maskImage).toMatch(
        new RegExp(`^linear-gradient\\(to ${toward}, rgba\\(0, 0, 0, 0\\).*rgb\\(0, 0, 0\\)\\)$`)
      )
    );
  },
};

export const TableThatFitsHasNoFade: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DataTable rows={rows.slice(0, 5)} columns={columns} rowKey={(r) => r.host} />,
  play: async ({ canvas }) => {
    const scroller = scrollerOf(canvas.getByRole('table'));
    await expect(scroller.scrollWidth).toBeLessThanOrEqual(scroller.clientWidth);
    await expect(getComputedStyle(scroller).maskImage).toBe('none');
  },
};

// The width each data column is drawn at, read from its header.
const headerWidths = (canvasElement: HTMLElement, labels: string[]) =>
  [...canvasElement.querySelectorAll('thead th')]
    .filter((th) => labels.includes(th.textContent?.trim() ?? ''))
    .map((th) => th.getBoundingClientRect().width);

// On a phone, percentages are a share of the screen and columns without a width split what is
// left: each column keeps its minimum instead (8rem by default), and the table scrolls.
export const PercentColumnsScrollOnAPhone: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <>
      {/* The fixture's own 5rem minimums off: this is about the default one. */}
      <DataTable
        rows={rows}
        columns={columns.map(({ minWidth: _minWidth, ...c }) => c)}
        rowKey={(r) => r.host}
        pageSize={5}
      />
    </>
  ),
  play: async ({ canvas, canvasElement }) => {
    expectNoHorizontalOverflow();
    const scroller = scrollerOf(canvas.getByRole('table'));
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    const widths = headerWidths(
      canvasElement,
      columns.map((c) => c.label as string)
    );
    await expect(widths).toHaveLength(columns.length);
    for (const width of widths) await expect(width).toBeGreaterThanOrEqual(128);
  },
};

export const ColumnsWithoutWidthScrollOnAPhone: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <DataTable
      rows={rows}
      columns={columns.map(({ width: _width, ...c }, i) =>
        i === 1 ? { ...c, minWidth: '12rem' } : c
      )}
      rowKey={(r) => r.host}
      pageSize={5}
      selectable
    />
  ),
  play: async ({ canvas, canvasElement }) => {
    const scroller = scrollerOf(canvas.getByRole('table'));
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    const widths = headerWidths(
      canvasElement,
      columns.map((c) => c.label as string)
    );
    await expect(widths).toHaveLength(columns.length);
    // They share what is left equally: each gets the widest minimum, the Name column's 12rem.
    for (const width of widths) await expect(width).toBeGreaterThanOrEqual(192);
  },
};

const pinnedStartColumn: Story = {
  globals: mobileViewport,
  render: () => (
    <DataTable
      rows={rows}
      columns={withPins(wideColumns, { start: ['host'] })}
      rowKey={(r) => r.host}
      pageSize={5}
      selectable
    />
  ),
};

export const PinnedStartColumnChecks: Story = {
  ...pinnedStartColumn,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const table = canvas.getByRole('table');
    const scroller = scrollerOf(table);
    const left = (el: Element) => startEdge(el.getBoundingClientRect());
    const row = within(table).getAllByRole('row')[1];
    const [select, first, second] = within(row).getAllByRole('cell');
    const [selectHead, firstHead] = within(table).getAllByRole('columnheader');
    const start = left(scroller);
    const secondBefore = left(second);
    scrollAlong(scroller, 150);
    await waitFor(() => expect(left(second)).toBeLessThan(secondBefore));
    // The selection column and the first data column stay where they were, header and body
    // alike, with the second one scrolling under the pinned pair.
    await expect(left(select)).toBe(start);
    await expect(left(selectHead)).toBe(start);
    await expect(left(first)).toBe(start + 44);
    await expect(left(firstHead)).toBe(start + 44);
    // The start edge is the pinned column's: it does not fade.
    await expect(getComputedStyle(scroller).maskImage).not.toMatch(
      new RegExp(
        `^linear-gradient\\(to ${getComputedStyle(scroller).direction === 'rtl' ? 'left' : 'right'}, rgba`
      )
    );
    // Pinned cells are opaque, or the ones under them would show through.
    await expect(getComputedStyle(first).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    await expect(getComputedStyle(select).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  },
};

export const PinnedStartColumnKeepsRowLinks: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <DataTable
      rows={rows.slice(0, 4)}
      columns={withPins(pickColumns(wideColumns, ['host', 'metric', 'dc', 'rack', 'room']), {
        start: ['host'],
      })}
      rowKey={(r) => r.host}
      rowHref={(r) => `#${r.host}`}
    />
  ),
  play: async ({ canvas }) => {
    const row = canvas.getByRole('row', { name: /node-00002/ });
    const clicks = recordLinkClicks();
    try {
      // A click on a cell that scrolls follows the link of the pinned one, which does not cover it.
      await userEvent.click(within(row).getAllByRole('cell')[2]);
      await expect(clicks.followed).toEqual(['#node-00002']);
      await userEvent.click(within(row).getByRole('link'));
      await expect(clicks.followed).toEqual(['#node-00002', '#node-00002']);
    } finally {
      clicks.stop();
    }
  },
};

// Three people with a billing record. The cells cut what is too long for their column, and Ada's
// email and plan are.
type Customer = Person & { customerId: string; plan: string; balance: number };

const customers: Customer[] = [
  {
    ...PEOPLE[0]!,
    email: 'ada.lovelace@analytical-engine.example.org',
    customerId: 'cus_9f2a41c07d5e8b3a6c1d',
    plan: 'Business, billed yearly, with the audit log and single sign-on add-ons',
    balance: 1240.5,
  },
  { ...PEOPLE[1]!, customerId: 'cus_1b7c88e02f4a9d63e5b0', plan: 'Team', balance: -89 },
  { ...PEOPLE[4]!, customerId: 'cus_5d0e73a91c2b4f8a6e37', plan: 'Free', balance: 0 },
];

const customerColumns: ColumnDef<Customer>[] = [
  ...patchColumns(withIdentity(pickColumns(peopleColumns, ['name'])), {
    name: { label: 'Customer', width: '30%' },
  }),
  {
    key: 'customerId',
    label: 'ID',
    width: '20%',
    render: (r) => <TableIdCell>{r.customerId}</TableIdCell>,
  },
  {
    key: 'plan',
    label: 'Plan',
    width: '28%',
    render: (r) => <TableDescriptionCell lines={2}>{r.plan}</TableDescriptionCell>,
  },
  {
    key: 'balance',
    label: 'Balance',
    width: '22%',
    align: 'end',
    sortable: true,
    sortValue: (r) => r.balance,
    render: (r) => <TableAmountCell value={r.balance} currency="USD" locale="en-US" />,
  },
];

export const CellHelpers: Story = {
  render: () => (
    <div className="max-w-3xl">
      <DataTable
        rows={customers}
        columns={customerColumns}
        rowKey={(r) => r.id}
        density="comfortable"
        aria-label="Customers"
      />
    </div>
  ),
};

export const CellHelpersChecks: Story = {
  ...CellHelpers,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    // In the fixed layout of a DataTable the cells truncate to their column, whatever they hold.
    const email = canvas.getByText('ada.lovelace@analytical-engine.example.org');
    await expect(email.scrollWidth).toBeGreaterThan(email.clientWidth);
    await expect(canvas.getByText('cus_9f2a41c07d5e8b3a6c1d')).toHaveAttribute(
      'title',
      'cus_9f2a41c07d5e8b3a6c1d'
    );
    const plan = canvas.getByText(/^Business, billed yearly/);
    await expect(plan).toHaveAttribute('title', expect.stringContaining('single sign-on'));
    await expect(canvas.getByText('+$1,240.50')).toBeVisible();
    await expect(canvas.getByText('-$89.00')).toBeVisible();
    expectNoHorizontalOverflow();
  },
};

// The people of a team, split by status tabs: seven are active, two suspended and three invited.
const teammates = PEOPLE;

const teammateColumns = patchColumns(withIdentity(pickColumns(peopleColumns, ['name', 'status'])), {
  name: { width: '45%' },
  status: { width: '30%' },
});

// The host owns the counts (they may come from a server); here they are read off the sample.
const countOf = (status: Person['status']) => teammates.filter((m) => m.status === status).length;

const statusTabs = {
  columnKey: 'status',
  allCount: teammates.length,
  options: (['Active', 'Suspended', 'Invited'] as const).map((status) => ({
    value: status,
    label: status,
    count: countOf(status),
  })),
};

const TEAMMATE_NAMES = new Set(teammates.map((m) => m.name));

const teammateNames = (canvas: Canvas) =>
  canvas.getAllByText((text) => TEAMMATE_NAMES.has(text)).map((el) => el.textContent);

export const WithStatusTabs: Story = {
  render: () => (
    <DataTable
      rows={teammates}
      columns={teammateColumns}
      rowKey={(r) => r.id}
      filterTabs={statusTabs}
      labels={{ searchPlaceholder: 'Search members…' }}
      defaultSearchValue=""
      aria-label="Members"
    />
  ),
};

export const WithStatusTabsChecks: Story = {
  ...WithStatusTabs,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const all = canvas.getByRole('tab', { name: 'All 12' });
    await expect(all).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tab', { name: 'Active 7' })).toBeVisible();
    await userEvent.click(canvas.getByRole('tab', { name: 'Suspended 2' }));
    await expect(canvas.getByRole('tab', { name: 'Suspended 2' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(all).toHaveAttribute('aria-selected', 'false');
    await expect(teammateNames(canvas)).toEqual(['Linus Torvalds', 'Ken Thompson']);
    await userEvent.click(all);
    await expect(teammateNames(canvas)).toHaveLength(12);
  },
};

export const TabsAreOnTopOfTheCard: Story = {
  tags: ['!dev'],
  render: () => (
    <DataTable
      rows={teammates}
      columns={teammateColumns}
      rowKey={(r) => r.id}
      filterTabs={statusTabs}
      defaultSearchValue=""
      aria-label="Members"
    />
  ),
  play: async ({ canvas }) => {
    const tablist = canvas.getByRole('tablist');
    const card = tablist.closest('.rounded-2xl') as HTMLElement;
    // Above the toolbar: the strip is the first thing in the card, the search follows it.
    await expect(card.firstElementChild?.contains(tablist)).toBe(true);
    await expect(
      tablist.compareDocumentPosition(canvas.getByRole('searchbox', { name: 'Search rows' })) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    await expect(getComputedStyle(tablist).borderBottomWidth).toBe('1px');
    const active = canvas.getByRole('tab', { name: /^All/ });
    await expect(getComputedStyle(active).borderBottomWidth).toBe('2px');
  },
};

export const ClearingTheFilterMovesTheTabBackToAll: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <DataTable
      rows={teammates}
      columns={teammateColumns}
      rowKey={(r) => r.id}
      filterTabs={statusTabs}
      aria-label="Members"
    />
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Invited 3' }));
    await expect(canvas.getByText('Active filters:')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Clear Status filter' }));
    await expect(canvas.getByRole('tab', { name: 'All 12' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(teammateNames(canvas)).toHaveLength(12);
    // And the other way: a filter picked in the chips bar's "Clear all" does the same.
    await userEvent.click(canvas.getByRole('tab', { name: 'Active 7' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Clear all' }));
    await expect(canvas.getByRole('tab', { name: 'All 12' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  },
};

export const ColumnHeaderFilterSelectsItsTab: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <DataTable
      rows={teammates}
      columns={teammateColumns}
      rowKey={(r) => r.id}
      filterTabs={statusTabs}
      aria-label="Members"
    />
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Status/ }));
    await userEvent.click(
      await within(document.body).findByRole('checkbox', { name: /Suspended/ })
    );
    await expect(canvas.getByRole('tab', { name: 'Suspended 2' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  },
};

export const StatusTabsKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <DataTable
      rows={teammates}
      columns={teammateColumns}
      rowKey={(r) => r.id}
      filterTabs={statusTabs}
      aria-label="Members"
    />
  ),
  play: async ({ canvas }) => {
    // Roving tabindex: only the active tab is a tab stop.
    const tabs = canvas.getAllByRole('tab');
    await expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1, -1]);
    tabs[0].focus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(canvas.getByRole('tab', { name: 'Active 7' })).toHaveFocus();
    await expect(canvas.getByRole('tab', { name: 'Active 7' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(teammateNames(canvas)).toHaveLength(7);
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('tab', { name: 'Invited 3' })).toHaveFocus();
    await expect(teammateNames(canvas)).toHaveLength(3);
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(canvas.getByRole('tab', { name: 'All 12' })).toHaveFocus();
    await expect(teammateNames(canvas)).toHaveLength(12);
  },
};

export const ControlledFilters: Story = {
  tags: ['!dev', '!autodocs'],
  render: function Render() {
    const [filters, setFilters] = useState<Record<string, Set<string>>>({
      status: new Set(['Suspended']),
    });
    return (
      <>
        <div className="mb-3 flex items-center gap-3 text-sm">
          <Button variant="secondary" size="sm" onClick={() => setFilters({})}>
            Reset from the host
          </Button>
          <span data-testid="host-filters">
            {Object.entries(filters)
              .map(([k, v]) => `${k}: ${Array.from(v).join(', ')}`)
              .join(' | ') || 'no filter'}
          </span>
        </div>
        <DataTable
          rows={teammates}
          columns={teammateColumns}
          rowKey={(r) => r.id}
          filterTabs={statusTabs}
          filters={filters}
          onFiltersChange={setFilters}
          aria-label="Members"
        />
      </>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('tab', { name: 'Suspended 2' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await userEvent.click(canvas.getByRole('tab', { name: 'Invited 3' }));
    await expect(canvas.getByTestId('host-filters')).toHaveTextContent('status: Invited');
    await userEvent.click(canvas.getByRole('button', { name: 'Reset from the host' }));
    await expect(canvas.getByRole('tab', { name: 'All 12' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(teammateNames(canvas)).toHaveLength(12);
  },
};

export const ControlledFiltersWaitForTheHost: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onFiltersChange: fn() },
  render: (args) => (
    <DataTable
      rows={teammates}
      columns={teammateColumns}
      rowKey={(r) => r.id}
      filterTabs={statusTabs}
      filters={{}}
      onFiltersChange={args.onFiltersChange}
      aria-label="Members"
    />
  ),
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Active 7' }));
    await expect(args.onFiltersChange).toHaveBeenCalledTimes(1);
    const next = (args.onFiltersChange as ReturnType<typeof fn>).mock.calls[0][0] as Record<
      string,
      Set<string>
    >;
    await expect(Array.from(next.status)).toEqual(['Active']);
    // The host passed nothing back: the table still shows everything.
    await expect(canvas.getByRole('tab', { name: 'All 12' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(teammateNames(canvas)).toHaveLength(12);
  },
};

export const DefaultFiltersStartUncontrolled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onFiltersChange: fn() },
  render: (args) => (
    <DataTable
      rows={teammates}
      columns={teammateColumns}
      rowKey={(r) => r.id}
      filterTabs={statusTabs}
      defaultFilters={{ status: new Set(['Invited']) }}
      onFiltersChange={args.onFiltersChange}
      aria-label="Members"
    />
  ),
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole('tab', { name: 'Invited 3' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(teammateNames(canvas)).toHaveLength(3);
    // Uncontrolled: the table moves on its own, and still reports it.
    await userEvent.click(canvas.getByRole('tab', { name: 'All 12' }));
    await expect(args.onFiltersChange).toHaveBeenCalledWith({});
    await expect(teammateNames(canvas)).toHaveLength(12);
  },
};

const statusTabsMobile: Story = {
  globals: mobileViewport,
  render: () => (
    <DataTable
      rows={teammates}
      columns={teammateColumns}
      rowKey={(r) => r.id}
      filterTabs={{
        ...statusTabs,
        options: [
          ...statusTabs.options,
          { value: 'Archived', label: 'Archived', count: 0 },
          { value: 'Pending review', label: 'Pending review', count: 0 },
        ],
      }}
      aria-label="Members"
    />
  ),
};

export const StatusTabsMobileChecks: Story = {
  ...statusTabsMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const list = canvas.getByRole('tablist');
    // The strip scrolls inside the card instead of widening the page.
    await expect(list.parentElement!.scrollWidth).toBeGreaterThan(list.parentElement!.clientWidth);
  },
};

export const MultiValueFilterKeepsTheStripReachable: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <DataTable
      rows={teammates}
      columns={teammateColumns}
      rowKey={(r) => r.id}
      filterTabs={statusTabs}
      defaultFilters={{ status: new Set(['Active', 'Invited']) }}
      aria-label="Teammates"
    />
  ),
  play: async ({ canvas }) => {
    // Two values match no single tab: none is selected, and Tab still lands on the strip.
    await expect(canvas.queryAllByRole('tab', { selected: true })).toHaveLength(0);
    await userEvent.tab();
    await expect(canvas.getByRole('tab', { name: 'All 12' })).toHaveFocus();
  },
};

// ── Rows per page ────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 25, 50];

type Canvas = Parameters<NonNullable<Story['play']>>[0]['canvas'];

const findRange = (canvas: Canvas, range: string) =>
  canvas.getByText((_, el) => el?.tagName === 'SPAN' && el.textContent === `Showing ${range}`);

export const WithPageSizeOptions: Story = {
  render: () => (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.host}
      defaultPageSize={10}
      pageSizeOptions={PAGE_SIZES}
    />
  ),
};

export const WithPageSizeOptionsChecks: Story = {
  ...WithPageSizeOptions,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const select = canvas.getByRole('combobox', { name: 'Rows per page' });
    await expect(select).toHaveValue('10');
    await expect(canvas.getAllByRole('row')).toHaveLength(11);
    await userEvent.selectOptions(select, '25');
    await expect(canvas.getAllByRole('row')).toHaveLength(26);
    await expect(findRange(canvas, '1 to 25 of 60')).toBeInTheDocument();
  },
};

export const PageSizeChangeGoesBackToPageOne: Story = {
  tags: ['!dev'],
  render: () => (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.host}
      defaultPageSize={10}
      pageSizeOptions={PAGE_SIZES}
    />
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Page 3' }));
    await expect(findRange(canvas, '21 to 30 of 60')).toBeInTheDocument();
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Rows per page' }), '25');
    await expect(findRange(canvas, '1 to 25 of 60')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  },
};

export const PageSizeControlled: Story = {
  render: () => {
    const [size, setSize] = useState(10);
    return (
      <>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.host}
          pageSize={size}
          onPageSizeChange={setSize}
          pageSizeOptions={PAGE_SIZES}
        />
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Page size held by the host: <span data-testid="host-size">{size}</span>
        </p>
      </>
    );
  },
};

export const PageSizeControlledChecks: Story = {
  ...PageSizeControlled,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Rows per page' }), '50');
    await expect(canvas.getByTestId('host-size')).toHaveTextContent('50');
    await expect(canvas.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('50');
    await expect(findRange(canvas, '1 to 50 of 60')).toBeInTheDocument();
  },
};

const pickedSizes = fn();

export const PageSizeWithoutCallbackStaysFixed: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.host}
      pageSize={10}
      onPageSizeChange={pickedSizes}
      pageSizeOptions={PAGE_SIZES}
    />
  ),
  play: async ({ canvas }) => {
    // A controlled size the host never updates: the pick is reported, the size stays.
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Rows per page' }), '25');
    await expect(pickedSizes).toHaveBeenCalledWith(25);
    await expect(findRange(canvas, '1 to 10 of 60')).toBeInTheDocument();
    await expect(canvas.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('10');
  },
};

export const PageSizeOutsideTheOptionsIsListed: Story = {
  tags: ['!dev'],
  render: () => (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.host}
      pageSize={15}
      pageSizeOptions={PAGE_SIZES}
    />
  ),
  play: async ({ canvas }) => {
    const select = canvas.getByRole('combobox', { name: 'Rows per page' });
    await expect(select).toHaveValue('15');
    await expect(within(select).getAllByRole('option')).toHaveLength(4);
  },
};

export const NoPageSizeSelectByDefault: Story = {
  tags: ['!dev'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.host} pageSize={10} />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('combobox', { name: 'Rows per page' })).not.toBeInTheDocument();
  },
};

const pageSizeOptionsMobile: Story = {
  globals: mobileViewport,
  render: () => (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.host}
      defaultPageSize={10}
      pageSizeOptions={PAGE_SIZES}
    />
  ),
};

export const PageSizeOptionsMobileChecks: Story = {
  ...pageSizeOptionsMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const nav = canvas.getByRole('navigation', { name: 'Pagination' });
    await expect(within(nav).getByRole('combobox', { name: 'Rows per page' })).toBeVisible();
    await expect(within(nav).getByRole('button', { name: 'Next page' })).toBeVisible();
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

// The alignment checks need one column of each `align` and a cell that says which: a model of their
// own, kept local, since no shared column is made for it.
type AlignRow = { id: string; a: string; b: string; c: string };

const ALIGN_COLUMNS: ColumnDef<AlignRow>[] = [
  { key: 'a', label: 'Start column', align: 'start', render: (r) => <span>{r.a}</span> },
  { key: 'b', label: 'End column', align: 'end', render: (r) => <span>{r.b}</span> },
  { key: 'c', label: 'Default column', render: (r) => <span>{r.c}</span> },
];

/**
 * A column aligned to `start` or `end` follows the reading direction, header and cells: the
 * default is the start.
 */
export const ColumnAlignFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      {(['ltr', 'rtl'] as const).map((dir) => (
        <div key={dir} dir={dir} data-direction={dir} className="mb-4">
          <DataTable
            aria-label={`Alignment ${dir}`}
            rows={[{ id: '1', a: 'start cell', b: 'end cell', c: 'default cell' }]}
            columns={ALIGN_COLUMNS}
            rowKey={(r) => r.id}
          />
        </div>
      ))}
    </>
  ),
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
      sit('default cell', 'start');
      const header = (name: string) =>
        within(box).getByRole('columnheader', { name: new RegExp(name) });
      expect(getComputedStyle(header('Start column')).textAlign).toBe('start');
      expect(getComputedStyle(header('End column')).textAlign).toBe('end');
      expect(getComputedStyle(header('Default column')).textAlign).toBe('start');
    }
  },
};

/** `start` lines the menu up with the start edge of its trigger, `end` with the end edge. */
export const RowActionsMenuAlignFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      {(['ltr', 'rtl'] as const).map((dir) => (
        <div key={dir} dir={dir} data-direction={dir} className="mx-auto mb-4 flex w-[600px] gap-4">
          <RowActionsMenu aria-label={`Start actions ${dir}`} align="start">
            <Menu.Item>Edit</Menu.Item>
          </RowActionsMenu>
          <RowActionsMenu aria-label={`End actions ${dir}`} align="end">
            <Menu.Item>Edit</Menu.Item>
          </RowActionsMenu>
        </div>
      ))}
    </>
  ),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      for (const align of ['start', 'end'] as const) {
        const name = `${align === 'start' ? 'Start' : 'End'} actions ${dir}`;
        const trigger = within(box).getByRole('button', { name });
        await userEvent.click(trigger);
        const menu = await within(document.body).findByRole('menu');
        const edge = align === 'start' ? startOffset : endOffset;
        await waitFor(() =>
          expect(edge(menu, trigger), `${dir}: ${align} edge of the menu`).toBeCloseTo(0, 0)
        );
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
      }
    }
  },
};

/** A loading placeholder sits at the end of a column aligned to `end`. */
export const LoadingPlaceholderFollowsTheColumnAlign: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <DataTable
      rows={[]}
      columns={ALIGN_COLUMNS}
      rowKey={(r) => r.id}
      loading
      loadingRows={2}
      aria-label="Loading"
    />
  ),
  play: ({ canvas }) => {
    const row = canvas.getByRole('table', { name: 'Loading' }).querySelector('tbody > tr')!;
    const justify = (i: number) =>
      getComputedStyle(row.children[i].firstElementChild!).justifyContent;
    expect(justify(1)).toBe('flex-end');
    expect(justify(0)).toBe('normal');
  },
};

/**
 * The selection bar keeps its count and actions at the start and the search at the end, the search
 * icon is at the start of the field and its clear button at the end, and what is typed in it reads
 * in its own script.
 */
export const ToolbarFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      {(['ltr', 'rtl'] as const).map((dir) => (
        <div key={dir} dir={dir} data-direction={dir} className="mb-4">
          <DataTable
            aria-label={`Alerts ${dir}`}
            rows={rows.slice(0, 5)}
            columns={columns}
            rowKey={(r) => r.host}
            defaultSearchValue="مرحبا"
            selectable
            defaultSelection={new Set([rows[0]!.host])}
            bulkActions={() => <button type="button">Archive</button>}
          />
        </div>
      ))}
    </>
  ),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const archive = within(box).getByRole('button', { name: 'Archive' });
      const selectionSearch = within(box).getByRole('searchbox', { name: 'Search rows' });
      // The actions sit at the start of the line, the search at its end.
      await expect(startOffset(archive, box), `${dir}: actions at the start`).toBeLessThan(
        endOffset(archive, box)
      );
      await expect(endOffset(selectionSearch, box), `${dir}: search at the end`).toBeLessThan(
        startOffset(selectionSearch, box)
      );
      // Deselect: the plain toolbar keeps the search.
      await userEvent.click(within(box).getByRole('button', { name: 'Clear' }));
      const field = within(box).getByRole('searchbox', { name: 'Search rows' });
      await expect(field).toHaveAttribute('dir', 'auto');
      await expect(getComputedStyle(field).direction).toBe('rtl');
      const holder = field.parentElement!;
      const icon = holder.querySelector('svg')!;
      const clear = within(holder).getByRole('button', { name: 'Clear search' });
      await expect(startOffset(icon, holder), `${dir}: icon at the start`).toBeLessThan(
        endOffset(icon, holder)
      );
      await expect(endOffset(clear, holder), `${dir}: clear at the end`).toBeLessThan(
        startOffset(clear, holder)
      );
    }
  },
};

// ── Labels ───────────────────────────────────────────────────────────────────

const FRENCH: LabelsInput = {
  dataTable: FRENCH_TABLE_LABELS,
  columnHeader: FRENCH_COLUMN_HEADER_LABELS,
  columnFilterDropdown: FRENCH_COLUMN_FILTER_LABELS,
  activeFiltersBar: FRENCH_ACTIVE_FILTERS_LABELS,
  rowActionsMenu: { trigger: 'Actions de la ligne' },
};

const teamColumns = pickColumns(peopleColumns, ['name', 'role', 'team']);

/**
 * A table with every part that writes a word, under a provider with the French labels: the
 * toolbar of a selection, the export, the columns and bulk menus, the expanders, the row action
 * column, the status tabs, the page size and the pager's name.
 */
export const TranslatedByLabels: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams.lg(),
  render: () => (
    <LabelsProvider labels={FRENCH}>
      <DataTable
        aria-label="Équipe"
        rows={PEOPLE}
        columns={teamColumns}
        rowKey={(p) => p.id}
        pageSize={5}
        pageSizeOptions={[5, 10]}
        defaultSearchValue=""
        selectable
        defaultSelection={new Set(['user-1'])}
        bulkActionItems={[
          { key: 'archive', label: 'Archiver', onClick: () => {} },
          { key: 'remove', label: 'Retirer', intent: 'danger', onClick: () => {} },
        ]}
        exportable
        columnsMenu
        renderExpandedRow={(p) => p.email}
        renderRowAction={() => (
          <RowActionsMenu>
            <Menu.Item>Voir</Menu.Item>
          </RowActionsMenu>
        )}
        filterTabs={{ columnKey: 'team', options: [{ value: 'Core', label: 'Core' }] }}
      />
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    const search = canvas.getByRole('searchbox', { name: 'Rechercher dans les lignes' });
    await expect(search).toHaveAttribute('placeholder', 'Rechercher…');
    // The bar of the selection.
    await expect(canvas.getByText('1 sélectionnée')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Effacer' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Exporter 1' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Archiver' })).toBeVisible();
    // The bulk actions that fold are in the DOM, hidden when the bar is wide.
    await expect(canvas.getByRole('button', { name: 'Actions', hidden: true })).toBeInTheDocument();
    // The columns of the table.
    await expect(
      canvas.getByRole('checkbox', { name: 'Sélectionner toutes les lignes' })
    ).toBeVisible();
    await expect(
      canvas.getByRole('checkbox', { name: 'Sélectionner la ligne user-1' })
    ).toBeChecked();
    await expect(canvas.getByRole('columnheader', { name: 'Détails' })).toBeInTheDocument();
    await expect(canvas.getByRole('columnheader', { name: 'Action' })).toBeVisible();
    await expect(canvas.getAllByRole('button', { name: 'Actions de la ligne' })).toHaveLength(5);
    await expect(canvas.getByRole('button', { name: 'Filtrer Role' })).toBeVisible();
    // The expander says what it does, then what it does next.
    await userEvent.click(canvas.getByRole('button', { name: 'Afficher les détails de user-1' }));
    await expect(
      canvas.getByRole('button', { name: 'Masquer les détails de user-1' })
    ).toHaveAttribute('aria-expanded', 'true');
    // The footer and the tabs.
    await expect(canvas.getByRole('tab', { name: 'Tous' })).toBeVisible();
    await expect(canvas.getByRole('navigation', { name: 'Pagination de Équipe' })).toBeVisible();
    await expect(canvas.getByRole('combobox', { name: 'Lignes par page' })).toBeVisible();
    // The menu of the columns, a portal.
    await userEvent.click(canvas.getByRole('button', { name: 'Colonnes' }));
    const menu = within(await within(document.body).findByRole('menu', { name: 'Colonnes' }));
    await expect(menu.getByRole('group', { name: 'Colonnes' })).toBeVisible();
  },
};

/** The table's own `labels` win over the provider's, key by key; the provider keeps the rest. */
export const OwnLabelsWinOverTheProvider: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LabelsProvider labels={FRENCH}>
      <DataTable
        aria-label="Équipe"
        rows={PEOPLE}
        columns={teamColumns}
        rowKey={(p) => p.id}
        pageSize={5}
        defaultSearchValue=""
        selectable
        exportable
        labels={{ search: 'Chercher', export: () => 'Télécharger' }}
      />
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('searchbox', { name: 'Chercher' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Télécharger' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Exporter' })).toBeNull();
    await expect(
      canvas.getByRole('checkbox', { name: 'Sélectionner toutes les lignes' })
    ).toBeVisible();
  },
};

/** The loading and empty states, and the button that undoes a search that hid every row. */
export const StatesTranslatedByLabels: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LabelsProvider labels={FRENCH}>
      <DataTable
        aria-label="Chargement"
        rows={[]}
        columns={teamColumns}
        rowKey={(p) => p.id}
        loading
        loadingRows={2}
      />
      <DataTable
        aria-label="Équipe"
        rows={PEOPLE}
        columns={teamColumns}
        rowKey={(p) => p.id}
        defaultSearchValue="zzz"
      />
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Chargement…')).toBeInTheDocument();
    await expect(canvas.getByText('Aucun résultat')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Effacer les filtres' }));
    await expect(canvas.queryByText('Aucun résultat')).toBeNull();
    await expect(canvas.getByRole('searchbox', { name: 'Rechercher dans les lignes' })).toHaveValue(
      ''
    );
  },
};
