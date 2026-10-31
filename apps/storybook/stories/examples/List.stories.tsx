import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Archive,
  BarChart3,
  BookOpen,
  Home,
  Megaphone,
  Plus,
  Printer,
  Settings,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  Users,
} from 'lucide-react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  DataTable,
  Menu,
  PageContainer,
  PageHeader,
  RowActionsMenu,
  Shell,
  Sidebar,
  TableIdentityCell,
  Topbar,
  type ColumnDef,
  type DataTableBulkAction,
  type DataTableFilterTabsConfig,
  type DataTableView,
  type Intent,
} from '../../../../packages/react/src';
import {
  expectNoHorizontalOverflow,
  mobileViewport,
  portalDocsParams,
} from '../../../../packages/react/src/storybook-helpers';
import {
  CARRIERS,
  CHANNELS,
  COUNTRIES,
  EXTREME_COUNT,
  EXTREME_ORDERS,
  EXTREME_TABS,
  FULFILMENTS,
  LONG_COUPON,
  LONG_CUSTOMER,
  ORDERS,
  PAYMENTS,
  type Fulfilment,
  type Order,
  type Payment,
} from './list.data';

// A list screen: the orders of a bookshop on a DataTable inside a Shell. The table does the work
// (tabs, saved views, search, column filters, sort, selection and its bulk actions, export,
// pagination, cards on phones); this file only chooses its options and gives it rows. Each state
// is a value of `state`, not a copy of the screen, so the chrome around the table is the same in
// all of them.

// ── The table's configuration ────────────────────────────────────────────────

const PAYMENT_INTENT: Record<Payment, Intent> = {
  Paid: 'success',
  Pending: 'warning',
  Failed: 'danger',
  Refunded: 'neutral',
};
const FULFILMENT_INTENT: Record<Fulfilment, Intent> = {
  Unfulfilled: 'warning',
  Shipped: 'info',
  Delivered: 'success',
  Returned: 'neutral',
};

const euro = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });
const count = new Intl.NumberFormat('en-US');

// A business status is a `Badge`; `StatusBadge` is for the health of a system.
// The short columns have a width and the customer takes what they leave, so the names keep the
// room; narrower than what the columns need, the table scrolls.
const baseColumns: ColumnDef<Order>[] = [
  {
    key: 'order',
    label: 'Order',
    width: '96px',
    sortable: true,
    sortValue: (o) => o.id,
    searchValue: (o) => o.id,
    hideable: false,
    render: (o) => <span className="font-medium tabular-nums">{o.id}</span>,
  },
  {
    key: 'customer',
    label: 'Customer',
    // The card's heading on a phone.
    mobile: 'title',
    sortable: true,
    sortValue: (o) => o.customer,
    searchValue: (o) => `${o.customer} ${o.email}`,
    exportValue: (o) => o.customer,
    render: (o) => <TableIdentityCell title={o.customer} subtitle={o.email} />,
  },
  {
    key: 'items',
    label: 'Items',
    width: '88px',
    align: 'end',
    mobile: 'hidden',
    sortable: true,
    sortValue: (o) => o.items,
    render: (o) => <span className="tabular-nums">{count.format(o.items)}</span>,
  },
  {
    key: 'total',
    label: 'Total',
    width: '96px',
    align: 'end',
    sortable: true,
    sortValue: (o) => o.total,
    render: (o) => <span className="tabular-nums">{euro.format(o.total)}</span>,
  },
  {
    key: 'payment',
    label: 'Payment',
    width: '116px',
    filterable: true,
    // The values a filter offers: the same whatever the rows on screen hold.
    filterOptions: [...PAYMENTS],
    filterValue: (o) => o.payment,
    render: (o) => <Badge intent={PAYMENT_INTENT[o.payment]}>{o.payment}</Badge>,
  },
  {
    key: 'fulfilment',
    label: 'Fulfilment',
    width: '136px',
    filterable: true,
    filterOptions: [...FULFILMENTS],
    filterValue: (o) => o.fulfilment,
    render: (o) => <Badge intent={FULFILMENT_INTENT[o.fulfilment]}>{o.fulfilment}</Badge>,
  },
  // Off until the Columns menu turns them on.
  {
    key: 'channel',
    label: 'Channel',
    defaultHidden: true,
    filterable: true,
    filterOptions: [...CHANNELS],
    filterValue: (o) => o.channel,
    render: (o) => o.channel,
  },
  {
    key: 'country',
    label: 'Country',
    defaultHidden: true,
    filterable: true,
    filterOptions: [...COUNTRIES],
    filterValue: (o) => o.country,
    render: (o) => o.country,
  },
  {
    key: 'carrier',
    label: 'Carrier',
    defaultHidden: true,
    filterable: true,
    filterOptions: [...CARRIERS],
    filterValue: (o) => o.carrier,
    render: (o) => o.carrier,
  },
  {
    key: 'coupon',
    label: 'Coupon',
    defaultHidden: true,
    filterValue: (o) => o.coupon,
    render: (o) => (o.coupon ? <span className="block truncate">{o.coupon}</span> : '—'),
  },
  {
    key: 'date',
    label: 'Date',
    width: '120px',
    sortable: true,
    sortValue: (o) => o.date,
    render: (o) => <span className="whitespace-nowrap">{day.format(new Date(o.date))}</span>,
  },
];

// Extreme content: every column on, each with a width, so the table is wider than its box and
// scrolls sideways under the first two, which stay pinned. The rows are one page of a server's
// (`manual`), so the filters can't read their values from them and list the values themselves.
const WIDTH: Record<string, string> = {
  order: '130px',
  customer: '280px',
  items: '90px',
  total: '150px',
  payment: '130px',
  fulfilment: '150px',
  channel: '130px',
  country: '130px',
  carrier: '190px',
  coupon: '260px',
  date: '130px',
};
const EXTREME_OPTIONS: Record<string, string[]> = {
  customer: [LONG_CUSTOMER],
  coupon: [LONG_COUPON, 'AUTUMN10', 'READERS15'],
};
const extremeColumns: ColumnDef<Order>[] = baseColumns.map((c) => {
  const filterable = c.filterable || c.key in EXTREME_OPTIONS;
  return {
    ...c,
    width: WIDTH[c.key],
    defaultHidden: false,
    pin: c.key === 'order' || c.key === 'customer' ? 'start' : undefined,
    filterable,
    filterOptions: EXTREME_OPTIONS[c.key] ?? c.filterOptions,
  };
});

const view = (id: string, name: string, part: Partial<DataTableView>): DataTableView => ({
  id,
  name,
  search: '',
  filters: {},
  sort: { key: 'date', direction: 'desc' },
  columnVisibility: {},
  pageSize: 10,
  density: 'default',
  ...part,
});
const VIEWS = [
  view('to-ship', 'To ship', {
    filters: { fulfilment: ['Unfulfilled'] },
    sort: { key: 'date', direction: 'asc' },
  }),
  view('payment-problems', 'Payment problems', { filters: { payment: ['Pending', 'Failed'] } }),
];

// The actions of a selection. Each receives the selected orders; the first is a button and the
// others fold into an "Actions" menu when the bar is narrow.
const bulkActions: DataTableBulkAction<Order>[] = [
  { key: 'ship', label: 'Mark as shipped', icon: Truck, onClick: () => {} },
  { key: 'print', label: 'Print labels', icon: Printer, onClick: () => {} },
  { key: 'archive', label: 'Archive', icon: Archive, onClick: () => {} },
  { key: 'delete', label: 'Delete', icon: Trash2, intent: 'danger', onClick: () => {} },
];

// The counts on the tabs come from the host: from the rows here, from the server in a real app.
const countsOf = (rows: Order[]) =>
  Object.fromEntries(
    FULFILMENTS.map((f) => [f, rows.filter((o) => o.fulfilment === f).length])
  ) as Record<Fulfilment, number>;

const tabsFor = (counts?: Record<Fulfilment, number>): DataTableFilterTabsConfig => ({
  columnKey: 'fulfilment',
  allCount: counts && FULFILMENTS.reduce((sum, f) => sum + counts[f], 0),
  options: FULFILMENTS.map((f) => ({ value: f, label: f, count: counts?.[f] })),
});

// ── The screen ───────────────────────────────────────────────────────────────

type State = 'content' | 'noResults' | 'empty' | 'loading' | 'error' | 'extreme';

type OrdersScreenProps = {
  /** Which state of the list to show. */
  state?: State;
  /** Starts with the Payment filter on (Pending and Failed). */
  filtered?: boolean;
  /** The orders selected from the start. */
  selected?: string[];
  /** Called by the error state's "Try again". */
  onRetry?: () => void;
};

const OrdersScreen = ({
  state = 'content',
  filtered = false,
  selected,
  onRetry,
}: OrdersScreenProps) => {
  const extreme = state === 'extreme';
  const rows =
    state === 'content' || state === 'noResults' ? ORDERS : extreme ? EXTREME_ORDERS : [];
  const total = extreme ? EXTREME_COUNT : rows.length;
  // No counts on the tabs while the orders are not known.
  const counts =
    state === 'loading' || state === 'error' ? undefined : extreme ? EXTREME_TABS : countsOf(rows);

  const description =
    state === 'loading'
      ? 'Loading orders…'
      : state === 'error'
        ? 'Orders unavailable'
        : `${count.format(total)} ${total === 1 ? 'order' : 'orders'} · updated 2 min ago`;

  // What the table starts with: nothing, the Payment filter, filters that hide every row, or a
  // dozen of them. A real screen keeps these in its URL and passes them as `search` / `filters`.
  const defaultFilters: Record<string, Set<string>> = state === 'noResults'
    ? { payment: new Set(['Refunded']), fulfilment: new Set(['Unfulfilled']) }
    : extreme
      ? {
          payment: new Set(['Pending', 'Failed']),
          fulfilment: new Set(['Unfulfilled', 'Shipped']),
          channel: new Set(['Web shop', 'Marketplace']),
          customer: new Set([LONG_CUSTOMER]),
          country: new Set(['Germany', 'Netherlands', 'Belgium', 'Austria']),
          carrier: new Set(['Northline Express', 'ParcelHub Europe']),
          coupon: new Set([LONG_COUPON]),
        }
      : filtered
        ? { payment: new Set(['Pending', 'Failed']) }
        : {};
  const defaultSearchValue =
    state === 'noResults'
      ? 'tolstoy hardback'
      : extreme
        ? 'Q3 bulk orders from schools and libraries'
        : '';

  return (
    <Shell
      topbar={
        // The page title is text here: the `PageHeader` below holds the one `h1`.
        <Topbar pageTitle="Orders" endActions={<Avatar name="Eva Verhoeven" size="sm" />} />
      }
      sidebar={
        <Sidebar>
          <Sidebar.Brand title="Folio & Co" logo={<BookOpen className="size-5" />} />
          <Sidebar.Section label="Shop">
            <Sidebar.Item icon={Home} label="Overview" />
            <Sidebar.Item icon={ShoppingBag} label="Orders" active />
            <Sidebar.Item icon={BookOpen} label="Catalogue" />
            <Sidebar.Item icon={Users} label="Customers" />
          </Sidebar.Section>
          <Sidebar.Section label="Grow">
            <Sidebar.Item icon={Megaphone} label="Marketing" />
            <Sidebar.Item icon={Tag} label="Discounts" />
            <Sidebar.Item icon={BarChart3} label="Reports" />
          </Sidebar.Section>
          <Sidebar.Section label="System">
            <Sidebar.Item icon={Settings} label="Settings" />
          </Sidebar.Section>
        </Sidebar>
      }
    >
      <PageContainer width="full" className="flex flex-col gap-6">
        <PageHeader
          as="h1"
          title="Orders"
          breadcrumb={<Breadcrumb items={[{ label: 'Shop', href: '#' }, { label: 'Orders' }]} />}
          description={description}
          actions={<Button icon={Plus}>New order</Button>}
        />

        <DataTable
          aria-label="Orders"
          rows={rows}
          columns={extreme ? extremeColumns : baseColumns}
          rowKey={(o) => o.id}
          // The state of the load: the table draws its own skeleton and error.
          loading={state === 'loading'}
          error={
            state === 'error' ? 'Couldn’t load the orders (504). Your filters are kept.' : null
          }
          onRetry={onRetry}
          // Nothing to show: the first order, or, when a search and filters hid every row, the
          // table swaps this for its own "Clear filters".
          emptyTitle={state === 'noResults' ? 'No orders match' : 'No orders yet'}
          emptyDescription={
            state === 'noResults'
              ? 'Nothing matches “tolstoy hardback” with these filters. Try another search, or clear the filters.'
              : 'Orders from the web shop and the Berlin store show up here as soon as a customer checks out.'
          }
          emptyAction={<Button size="sm">Create the first order</Button>}
          // Status tabs on one column, search, saved views, column filters and the Columns menu.
          filterTabs={tabsFor(counts)}
          defaultSearchValue={defaultSearchValue}
          searchPlaceholder="Search orders, customers"
          defaultFilters={defaultFilters}
          defaultSort={extreme ? null : { key: 'date', direction: 'desc' }}
          defaultViews={VIEWS}
          columnsMenu
          // Export follows the selection: "Export 3" downloads those orders alone.
          exportable
          exportFileName="folio-orders.csv"
          // Selection, its bulk actions, and one menu of actions per row.
          selectable
          defaultSelection={selected ? new Set(selected) : undefined}
          bulkActionItems={bulkActions}
          renderRowAction={(o) => (
            <RowActionsMenu aria-label={`Actions for ${o.id}`}>
              <Menu.Item>View order</Menu.Item>
              <Menu.Item>Print packing slip</Menu.Item>
              <Menu.Item disabled={o.fulfilment !== 'Unfulfilled'}>Mark as shipped</Menu.Item>
              <Menu.Separator />
              <Menu.Item intent="danger">Cancel order</Menu.Item>
            </RowActionsMenu>
          )}
          // Pages. A server fetches them in a real app: `manual` and `rowCount` say so.
          manual={extreme}
          rowCount={extreme ? EXTREME_COUNT : undefined}
          defaultPageSize={extreme ? 25 : 10}
          pageSizeOptions={[10, 25, 50]}
          // Cards below 640px, with a Filters button that opens a sheet.
          mobileLayout="cards"
        />
      </PageContainer>
    </Shell>
  );
};

// ── Stories ──────────────────────────────────────────────────────────────────

const meta = {
  title: 'Examples/List',
  component: OrdersScreen,
  parameters: { ...portalDocsParams.full(), layout: 'fullscreen' },
  // The shell shows its sidebar from 1024px; the table's toolbar adapts to the width it gets.
  globals: { viewport: { value: 'tw-xl', isRotated: false } },
  tags: ['autodocs'],
} satisfies Meta<typeof OrdersScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Thirty-six orders over four pages, with the tabs, the views, the toolbar and a menu per row. */
export const Content: Story = {
  args: {},
};

/** Two orders selected under a Payment filter: the bar holds the count, the bulk actions, and still the search and Export. */
export const WithSelection: Story = {
  args: { filtered: true, selected: ['FC-20481', 'FC-20474'] },
};

/** No order yet: the table's empty state, with the call to create the first one. */
export const Empty: Story = {
  args: { state: 'empty' },
};

/** A search and filters hide every row: the empty state offers "Clear filters". */
export const NoResults: Story = {
  args: { state: 'noResults' },
};

/** The first load: the header, tabs and toolbar are there, skeleton rows take the body. */
export const Loading: Story = {
  args: { state: 'loading' },
};

/** The load failed: the table's body holds an error with a retry; tabs and toolbar stay. */
export const LoadError: Story = {
  name: 'Error',
  args: { state: 'error' },
};

/** 12,480 orders: long names and emails cut, six-figure totals, seven filters, 11 columns. */
export const ExtremeContent: Story = {
  args: { state: 'extreme' },
};

/** On a phone: the rows become cards and the column filters move into a sheet. */
export const Phone: Story = {
  globals: mobileViewport,
  args: { filtered: true },
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

const body = within(document.body);

/** The content state: one h1, the tabs with their counts, a page of ten rows, the pager. */
export const ContentShowsTheTable: Story = {
  tags: ['!dev', '!autodocs'],
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Orders' })).toBeVisible();
    await expect(canvas.getByText('36 orders · updated 2 min ago')).toBeVisible();
    const tab = canvas.getByRole('tab', { name: /^Unfulfilled/ });
    await expect(tab).toHaveTextContent(
      String(ORDERS.filter((o) => o.fulfilment === 'Unfulfilled').length)
    );
    const table = canvas.getByRole('table', { name: 'Orders' });
    // The header row and ten orders.
    await expect(within(table).getAllByRole('row')).toHaveLength(11);
    await expect(within(table).getByText('FC-20481')).toBeVisible();
    // A Badge, not a health badge, carries each status.
    await expect(within(table).getAllByText('Unfulfilled').length).toBeGreaterThan(0);
    for (const name of ['Views', 'Columns', 'Export']) {
      await expect(canvas.getByRole('button', { name })).toBeVisible();
    }
    await expect(canvas.getByRole('button', { name: 'Actions for FC-20481' })).toBeVisible();
  },
};

/** The table keeps the toolbar and the search while orders are selected, and Export follows them. */
export const SelectionKeepsTheToolbar: Story = {
  tags: ['!dev', '!autodocs'],
  args: {},
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select row FC-20481' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select row FC-20474' }));
    await expect(canvas.getByText('2 selected')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Mark as shipped' })).toBeVisible();
    await expect(canvas.getByRole('searchbox', { name: 'Search rows' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Columns' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Export 2' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Clear' }));
    await expect(canvas.queryByText(/selected/)).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Export' })).toBeVisible();
  },
};

/** The status tabs filter the table, and the active filters bar follows. */
export const TabsFilterTheTable: Story = {
  tags: ['!dev', '!autodocs'],
  args: {},
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('tab', { name: /^Returned/ }));
    const table = canvas.getByRole('table', { name: 'Orders' });
    const returned = ORDERS.filter((o) => o.fulfilment === 'Returned').length;
    await expect(within(table).getAllByRole('row')).toHaveLength(returned + 1);
    await expect(canvas.getByText('Active filters:')).toBeVisible();
    await userEvent.click(canvas.getByRole('tab', { name: /^All/ }));
    await expect(within(table).getAllByRole('row')).toHaveLength(11);
  },
};

/** No orders at all: the title, and the call to create the first one (no "Clear filters"). */
export const EmptyOffersTheFirstOrder: Story = {
  tags: ['!dev', '!autodocs'],
  args: { state: 'empty' },
  play: async ({ canvas }) => {
    await expect(
      within(canvas.getByRole('table', { name: 'Orders' })).getByText('No orders yet')
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Create the first order' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Clear filters' })).toBeNull();
    await expect(canvas.getByText('0 orders · updated 2 min ago')).toBeVisible();
  },
};

/** "Clear filters" empties the search and the filters, and the orders come back. */
export const NoResultsClearsFilters: Story = {
  tags: ['!dev', '!autodocs'],
  args: { state: 'noResults' },
  play: async ({ canvas }) => {
    await expect(
      within(canvas.getByRole('table', { name: 'Orders' })).getByText('No orders match')
    ).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Create the first order' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Clear filters' }));
    await expect(canvas.queryByText('No orders match')).toBeNull();
    await expect(canvas.queryByText('Active filters:')).toBeNull();
    await expect(canvas.getByRole('searchbox', { name: 'Search rows' })).toHaveValue('');
    await expect(canvas.getByRole('tab', { name: /^All/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(
      within(canvas.getByRole('table', { name: 'Orders' })).getAllByRole('row')
    ).toHaveLength(11);
  },
};

/** The first load: the table is busy, skeleton rows stand for the orders, no pager yet. */
export const LoadingIsBusy: Story = {
  tags: ['!dev', '!autodocs'],
  args: { state: 'loading' },
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Orders' });
    await expect(table).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading…');
    await expect(canvas.getByRole('heading', { level: 1, name: 'Orders' })).toBeVisible();
    await expect(canvas.getByRole('tab', { name: /^Unfulfilled/ })).toBeVisible();
    await expect(canvas.queryByText('FC-20481')).toBeNull();
    await expect(canvas.queryByText(/^Showing/)).toBeNull();
  },
};

/** The load failed: an alert with "Try again", which calls the host's reload. */
export const ErrorOffersARetry: Story = {
  tags: ['!dev', '!autodocs'],
  args: { state: 'error', onRetry: fn() },
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('Couldn’t load the orders');
    await expect(canvas.getByRole('tab', { name: /^Unfulfilled/ })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

/** Extreme content: the count, the cut text, the chips, and a table that scrolls under pinned columns. */
export const ExtremeContentCutsAndScrolls: Story = {
  tags: ['!dev', '!autodocs'],
  args: { state: 'extreme' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('12,480 orders · updated 2 min ago')).toBeVisible();
    await expect(canvas.getByRole('navigation', { name: 'Orders pagination' })).toHaveTextContent(
      'Showing 1 to 25 of 12480'
    );
    // Seven filters, one chip each.
    await expect(canvas.getAllByRole('button', { name: /^Clear .* filter$/ })).toHaveLength(7);
    // The long name is cut, not wrapped, and still readable whole as the cell's title.
    const name = within(canvas.getByRole('table', { name: 'Orders' })).getAllByTitle(
      LONG_CUSTOMER
    )[0]!;
    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    // The table is wider than its box and scrolls there, not the page.
    const scroller = canvas.getByRole('region', { name: 'Orders' });
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    expectNoHorizontalOverflow();
    // The first two columns stay put while it scrolls.
    for (const column of ['Order', 'Customer']) {
      const header = canvas.getByRole('columnheader', { name: new RegExp(`^${column}`) });
      await expect(getComputedStyle(header).position).toBe('sticky');
    }
  },
};

/** On a phone the filters are one button with a count; the sheet it opens holds each column's filter. */
export const PhoneFiltersSheet: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  args: { filtered: true },
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(canvas.getByRole('heading', { level: 1, name: 'Orders' })).toBeVisible();
    const button = canvas.getByRole('button', { name: /^Filters/ });
    await expect(button).toHaveTextContent('2');
    await userEvent.click(button);
    const sheet = within(await body.findByRole('dialog', { name: 'Filters' }));
    await expect(sheet.getByRole('group', { name: 'Payment' })).toBeVisible();
    await expect(sheet.getByRole('group', { name: 'Fulfilment' })).toBeVisible();
    await expect(sheet.getByRole('checkbox', { name: 'Pending' })).toBeChecked();
    await userEvent.click(sheet.getByRole('button', { name: 'Clear all' }));
    await waitFor(() => expect(button).not.toHaveTextContent('2'));
  },
};
