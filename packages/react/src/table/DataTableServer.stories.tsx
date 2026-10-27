import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { DataTable } from './DataTable';
import type { ColumnDef, DataTableSort } from './types';

// The server mode of DataTable (`manual`, `rowCount`, `filterOptions`, the controlled sort and
// page, and `loading` with rows on screen) has its own file, in the `Tables/DataTable` family.
const meta = {
  title: 'Tables/DataTable server',
  component: DataTable,
  parameters: { ...portalDocsParams.lg(), layout: 'padded' },
  tags: ['autodocs'],
  args: { rows: [], columns: [], rowKey: () => '' },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

type Order = { id: string; customer: string; status: string; total: number };

const STATUSES = ['Paid', 'Pending', 'Refunded', 'Failed'];
const ORDER_COUNT = 10_000;

// 10,000 orders with nothing random in them: the same server on every run.
const ORDERS: Order[] = Array.from({ length: ORDER_COUNT }, (_, i) => ({
  id: `ord-${String(i + 1).padStart(5, '0')}`,
  customer: `Customer ${String((i * 7919) % 1000).padStart(3, '0')}`,
  status: STATUSES[(i * 3 + Math.floor(i / 7)) % STATUSES.length],
  total: ((i * 7919) % 49_900) / 100 + 5,
}));

type Query = {
  search: string;
  status: string[];
  sort: DataTableSort;
  page: number;
  pageSize: number;
};

// What the server does with a request: search, filter, sort, then cut the page.
const queryOrders = ({ search, status, sort, page, pageSize }: Query) => {
  const needle = search.trim().toLowerCase();
  let found = ORDERS.filter(
    (o) =>
      (!needle || o.customer.toLowerCase().includes(needle) || o.id.includes(needle)) &&
      (status.length === 0 || status.includes(o.status))
  );
  if (sort) {
    const dir = sort.direction === 'asc' ? 1 : -1;
    const pick = (o: Order) =>
      sort.key === 'total' ? o.total : String(o[sort.key as keyof Order]);
    found = [...found].sort((a, b) => (pick(a) < pick(b) ? -dir : pick(a) > pick(b) ? dir : 0));
  }
  return { rows: found.slice((page - 1) * pageSize, page * pageSize), total: found.length };
};

const columns: ColumnDef<Order>[] = [
  { key: 'id', label: 'Order', sortable: true, sortValue: (o) => o.id, render: (o) => o.id },
  {
    key: 'customer',
    label: 'Customer',
    sortable: true,
    sortValue: (o) => o.customer,
    render: (o) => o.customer,
  },
  {
    key: 'status',
    label: 'Status',
    filterable: true,
    // A page holds a few statuses only: the server says which exist.
    filterOptions: STATUSES,
    filterValue: (o) => o.status,
    render: (o) => o.status,
  },
  {
    key: 'total',
    label: 'Total',
    align: 'right',
    sortable: true,
    sortValue: (o) => o.total,
    render: (o) => `$${o.total.toFixed(2)}`,
  },
];

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

// A host that keeps what the table reports and asks the server for the page. `latency` is the
// time the "network" takes, in ms; none answers in the same render.
const ServerTable = ({ latency }: { latency: number }) => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [sort, setSort] = useState<DataTableSort>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const status = [...(filters.status ?? [])];
  const query: Query = { search, status, sort, page, pageSize };

  // With no latency the page is a plain function of the state; with some, it is fetched.
  const [fetched, setFetched] = useState<{ rows: Order[]; total: number } | null>(null);
  const key = JSON.stringify(query);
  const [pending, setPending] = useState(latency > 0);
  useEffect(() => {
    if (latency === 0) return;
    setPending(true);
    const timer = setTimeout(() => {
      setFetched(queryOrders(JSON.parse(key) as Query));
      setPending(false);
    }, latency);
    // A request that is no longer the latest is dropped, as a real client does.
    return () => clearTimeout(timer);
  }, [key, latency]);
  const result = latency === 0 ? queryOrders(query) : fetched;

  return (
    <DataTable
      manual
      rows={result?.rows ?? []}
      rowCount={result?.total}
      columns={columns}
      rowKey={(o) => o.id}
      loading={latency > 0 && pending}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search orders…"
      filters={filters}
      onFiltersChange={setFilters}
      sort={sort}
      onSortChange={setSort}
      page={page}
      onPageChange={setPage}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      pageSizeOptions={[10, 25, 50]}
      exportable
      onExport={fn()}
      aria-label="Orders"
    />
  );
};

/**
 * `manual` hands the table to the host: the search, the filters, the sort and the page only report,
 * and `rows` is the page the server returned, drawn in its order. `rowCount` is the total for the
 * pager, `filterOptions` the values a filter offers (a page holds only some of them), and
 * `loading` keeps the rows, dimmed, under a spinner while the next page comes. This one answers
 * in 600 ms, from 10,000 orders; the skeleton shows for the first load only.
 */
export const FakeServer: Story = {
  tags: ['no-capture'],
  render: () => (
    <Wrap>
      <ServerTable latency={600} />
    </Wrap>
  ),
};

/** The same host with a server that answers at once, so the page is always the same one. */
export const FakeServerWithoutLatency: Story = {
  tags: ['!autodocs'],
  render: () => (
    <Wrap>
      <ServerTable latency={0} />
    </Wrap>
  ),
};

/** At 375px the table scrolls in its own area, the pager and the page size select wrap. */
export const OnAPhone: Story = {
  tags: ['!autodocs'],
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <ServerTable latency={0} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('table', { name: 'Orders' })).toBeInTheDocument();
    expectNoHorizontalOverflow();
  },
};

/**
 * `loading` with rows on screen keeps them, dimmed and inert, under a centred spinner. The pager
 * stays, and the table is `aria-busy`.
 */
export const ReloadingWithRows: Story = {
  render: () => (
    <Wrap>
      <DataTable
        manual
        rows={queryOrders({ search: '', status: [], sort: null, page: 1, pageSize: 6 }).rows}
        rowCount={ORDER_COUNT}
        columns={columns}
        rowKey={(o) => o.id}
        pageSize={6}
        loading
        aria-label="Orders"
      />
    </Wrap>
  ),
};

// ── Tests ────────────────────────────────────────────────────────────────────

// A page as the host gives it: in an order no sort of ours would produce.
const PAGE: Order[] = ['ord-00007', 'ord-00002', 'ord-00009', 'ord-00001', 'ord-00005'].map((id) =>
  ORDERS.find((o) => o.id === id)!
);

const cellTexts = (canvas: ReturnType<typeof within>, column: number) =>
  canvas
    .getAllByRole('row')
    .slice(1)
    .map((row: HTMLElement) => within(row).getAllByRole('cell')[column].textContent);

const ids = (canvas: ReturnType<typeof within>) => cellTexts(canvas, 0);

/** A click on a sortable header reports the sort, and the rows keep the order the host gave. */
export const ManualSortReportsAndKeepsTheOrder: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onSortChange: fn() },
  render: (args) => (
    <Wrap>
      <DataTable {...args} manual rows={PAGE} columns={columns} rowKey={(o) => o.id} />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    const given = ids(canvas);
    await expect(given).toEqual(['ord-00007', 'ord-00002', 'ord-00009', 'ord-00001', 'ord-00005']);
    await userEvent.click(canvas.getByRole('button', { name: /Order/ }));
    await expect(args.onSortChange).toHaveBeenLastCalledWith({ key: 'id', direction: 'asc' });
    await expect(ids(canvas)).toEqual(given);
    // The header still shows the sort the table moved to (uncontrolled), the rows do not follow.
    await expect(canvas.getByRole('columnheader', { name: /Order/ })).toHaveAttribute(
      'aria-sort',
      'ascending'
    );
    await userEvent.click(canvas.getByRole('button', { name: /Order/ }));
    await expect(args.onSortChange).toHaveBeenLastCalledWith({ key: 'id', direction: 'desc' });
    await userEvent.click(canvas.getByRole('button', { name: /Order/ }));
    await expect(args.onSortChange).toHaveBeenLastCalledWith(null);
    await expect(ids(canvas)).toEqual(given);
  },
};

/** `rowCount` is what the pager counts; a page change reports, and the rows stay the host's. */
export const RowCountDrivesThePagerAndAPageChangeReports: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onPageChange: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        {...args}
        manual
        rows={PAGE}
        rowCount={95}
        pageSize={10}
        columns={columns}
        rowKey={(o) => o.id}
      />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    const info = (range: string) =>
      canvas.getByText((_, el) => el?.tagName === 'SPAN' && el.textContent === `Showing ${range}`);
    // Five rows on screen, 95 in all: 10 pages.
    await expect(info('1 to 10 of 95')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Page 10' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Page 11' })).toBeNull();

    const given = ids(canvas);
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(args.onPageChange).toHaveBeenLastCalledWith(2);
    await expect(info('11 to 20 of 95')).toBeInTheDocument();
    await expect(ids(canvas)).toEqual(given);

    await userEvent.click(canvas.getByRole('button', { name: 'Page 10' }));
    await expect(args.onPageChange).toHaveBeenLastCalledWith(10);
    // The last page is short: 91 to 95.
    await expect(info('91 to 95 of 95')).toBeInTheDocument();
  },
};

/** Without `rowCount` the pager counts the rows it was given. */
export const WithoutRowCountThePagerCountsTheRows: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        manual
        rows={PAGE}
        pageSize={10}
        columns={columns}
        rowKey={(o) => o.id}
        aria-label="Orders"
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText(
        (_, el) => el?.tagName === 'SPAN' && el.textContent === 'Showing 1 to 5 of 5'
      )
    ).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Page 2' })).toBeNull();
    // The table does not offer to show all: it does not hold the rows.
    await expect(canvas.queryByRole('button', { name: 'Show all' })).toBeNull();
  },
};

/**
 * Search and filters report and filter nothing: a search no order matches leaves the page as it
 * was. The filter dropdown offers `filterOptions`, which the page does not hold.
 */
export const ManualSearchAndFiltersReportWithoutFiltering: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onSearchChange: fn(), onFiltersChange: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        {...args}
        manual
        rows={PAGE}
        columns={columns}
        rowKey={(o) => o.id}
        defaultSearchValue=""
      />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    const given = ids(canvas);
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search rows' }), 'nobody');
    await expect(args.onSearchChange).toHaveBeenLastCalledWith('nobody');
    await expect(ids(canvas)).toEqual(given);

    await userEvent.click(canvas.getByRole('button', { name: 'Filter Status' }));
    const dropdown = within(document.body);
    // The four statuses the server knows, in its order, whatever the five rows hold.
    await expect(dropdown.getAllByRole('checkbox')).toHaveLength(4);
    await userEvent.click(dropdown.getByRole('checkbox', { name: 'Refunded' }));
    await expect(args.onFiltersChange).toHaveBeenLastCalledWith({ status: new Set(['Refunded']) });
    await expect(ids(canvas)).toEqual(given);
  },
};

/** `filterOptions` also serve a table that filters in memory, in the order they are given. */
export const FilterOptionsReplaceTheValuesOfTheRows: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        rows={PAGE.filter((o) => o.status === 'Paid')}
        columns={columns}
        rowKey={(o) => o.id}
        aria-label="Orders"
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter Status' }));
    const labels = within(document.body)
      .getAllByRole('checkbox')
      .map((c) => c.closest('label')!.textContent);
    await expect(labels).toEqual(STATUSES);
  },
};

/** With rows on screen, `loading` keeps them dimmed and inert under a spinner; the pager stays. */
export const LoadingWithRowsKeepsThemDimmed: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        manual
        rows={PAGE}
        rowCount={95}
        pageSize={10}
        columns={columns}
        rowKey={(o) => o.id}
        loading
        aria-label="Orders"
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Orders' });
    await expect(table).toHaveAttribute('aria-busy', 'true');
    // The rows are still there, not placeholders.
    await expect(ids(canvas)).toEqual(PAGE.map((o) => o.id));
    const body = table.querySelector('tbody')!;
    await expect(body.inert).toBe(true);
    await expect(getComputedStyle(body).opacity).toBe('0.5');
    // The spinner is drawn over them, and hidden from assistive technology, which hears the
    // "Loading…" status once.
    const spinner = canvas.getByRole('status', { hidden: true, name: 'Loading' });
    await expect(spinner.closest('[aria-hidden="true"]')).not.toBeNull();
    await expect(canvas.getAllByRole('status')).toHaveLength(1);
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading…');
    await expect(canvas.getByRole('navigation', { name: 'Orders pagination' })).toBeInTheDocument();
  },
};

/** With no rows yet, `loading` draws the placeholder rows, as before. */
export const LoadingWithoutRowsShowsSkeletons: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        manual
        rows={[]}
        columns={columns}
        rowKey={(o) => o.id}
        loading
        loadingRows={4}
        aria-label="Orders"
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Orders' });
    await expect(table).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getAllByRole('row')).toHaveLength(1 + 4);
    await expect(table.querySelector('tbody')!.inert).toBe(false);
    await expect(getComputedStyle(table.querySelector('tbody')!).opacity).toBe('1');
    // Nothing to dim: no spinner over placeholders.
    await expect(canvas.queryByRole('status', { hidden: true, name: 'Loading' })).toBeNull();
  },
};

/** Once the rows arrive the table is not busy, dimmed or inert any more. */
export const RowsArrivingEndTheWait: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const Host = () => {
      const [state, setState] = useState<'first' | 'rows' | 'again'>('first');
      return (
        <Wrap>
          <button type="button" onClick={() => setState((s) => (s === 'first' ? 'rows' : 'again'))}>
            Next
          </button>
          <DataTable
            manual
            rows={state === 'first' ? [] : PAGE}
            columns={columns}
            rowKey={(o) => o.id}
            loading={state !== 'rows'}
            aria-label="Orders"
          />
        </Wrap>
      );
    };
    return <Host />;
  },
  play: async ({ canvas }) => {
    const table = () => canvas.getByRole('table', { name: 'Orders' });
    await expect(table().querySelector('tbody')!.inert).toBe(false);
    await expect(canvas.queryByText('ord-00007')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(table()).not.toHaveAttribute('aria-busy'));
    await expect(canvas.getByText('ord-00007')).toBeInTheDocument();
    await expect(table().querySelector('tbody')!.inert).toBe(false);
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    // Reloading: the rows stay, dimmed.
    await expect(table()).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getByText('ord-00007')).toBeInTheDocument();
    await expect(table().querySelector('tbody')!.inert).toBe(true);
  },
};

/** The sort is controlled without `manual` too: the table still sorts, and reports. */
export const ControlledSortWorksInMemory: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onSortChange: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        {...args}
        rows={PAGE}
        columns={columns}
        rowKey={(o) => o.id}
        sort={{ key: 'id', direction: 'desc' }}
      />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    await expect(ids(canvas)).toEqual([
      'ord-00009',
      'ord-00007',
      'ord-00005',
      'ord-00002',
      'ord-00001',
    ]);
    // The host owns the sort: a click reports the next one and the table stays as it is.
    await userEvent.click(canvas.getByRole('button', { name: /Order/ }));
    await expect(args.onSortChange).toHaveBeenLastCalledWith(null);
    await expect(ids(canvas)[0]).toBe('ord-00009');
  },
};

/** `defaultSort` and `defaultPage` start an uncontrolled table where the host says. */
export const DefaultSortAndDefaultPage: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        rows={ORDERS.slice(0, 30)}
        columns={columns}
        rowKey={(o) => o.id}
        defaultSort={{ key: 'id', direction: 'desc' }}
        defaultPage={2}
        pageSize={10}
        aria-label="Orders"
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    // 30 orders, newest first, 10 a page: the second page holds ord-00020 down to ord-00011.
    await expect(ids(canvas)[0]).toBe('ord-00020');
    await expect(ids(canvas)).toHaveLength(10);
    await expect(canvas.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  },
};

/**
 * A change of search, filters, sort or page size goes back to page 1 through the page setter, so
 * a host that controls the page hears it; on page 1 already, it does not.
 */
export const ChangesGoBackToPageOne: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onPageChange: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        {...args}
        rows={ORDERS.slice(0, 60)}
        columns={columns}
        rowKey={(o) => o.id}
        page={3}
        pageSize={10}
        pageSizeOptions={[10, 20]}
        onPageSizeChange={fn()}
        defaultSearchValue=""
      />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    const onPage = args.onPageChange as ReturnType<typeof fn>;
    await expect(canvas.getByRole('button', { name: 'Page 3' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await userEvent.click(canvas.getByRole('button', { name: /Order/ }));
    await expect(onPage).toHaveBeenLastCalledWith(1);
    onPage.mockClear();
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search rows' }), 'a');
    await expect(onPage).toHaveBeenLastCalledWith(1);
    onPage.mockClear();
    await userEvent.click(canvas.getByRole('button', { name: 'Filter Status' }));
    await userEvent.click(within(document.body).getByRole('checkbox', { name: 'Paid' }));
    await expect(onPage).toHaveBeenLastCalledWith(1);
  },
};

/** On page 1 already, a change reports no page change. */
export const NoPageChangeFromPageOne: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onPageChange: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        {...args}
        rows={ORDERS.slice(0, 60)}
        columns={columns}
        rowKey={(o) => o.id}
        pageSize={10}
        defaultSearchValue=""
      />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search rows' }), 'ord');
    await userEvent.click(canvas.getByRole('button', { name: /Order/ }));
    await expect(args.onPageChange).not.toHaveBeenCalled();
  },
};
