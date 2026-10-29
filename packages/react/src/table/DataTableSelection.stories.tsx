import type { Meta, StoryObj } from '@storybook/react-vite';
import { Archive, Printer, Trash2, Truck } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, spyOn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../ui/Button';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { DataTable } from './DataTable';
import type { ColumnDef, DataTableBulkAction } from './types';

// What DataTable does around a selection and on a phone: the toolbar that stays while rows are
// selected, the Export that follows the selection, the filters sheet of the cards and the empty
// state's actions. Its own file: DataTable.stories.tsx is already one of the largest of the package.
const meta = {
  title: 'Tables/DataTable selection and filters',
  component: DataTable,
  parameters: { ...portalDocsParams.lg(), layout: 'padded' },
  tags: ['autodocs'],
  args: { rows: [], columns: [], rowKey: () => '' },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

type Order = {
  id: string;
  customer: string;
  status: 'Pending' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';
  payment: 'Paid' | 'Pending' | 'Failed';
  total: string;
};

const rows: Order[] = [
  ['Maya Lindqvist', 'Pending', 'Pending', '€64.80'],
  ['Tomás Herrera', 'Packed', 'Paid', '€18.50'],
  ['Aiko Tanaka', 'Packed', 'Paid', '€112.30'],
  ['Oliver Brandt', 'Shipped', 'Paid', '€39.00'],
  ['Fatima Okonkwo', 'Packed', 'Paid', '€87.40'],
  ['Lucas Moreau', 'Delivered', 'Paid', '€24.90'],
  ['Sofia Petrov', 'Cancelled', 'Failed', '€41.60'],
  ['Daniel Whitfield', 'Delivered', 'Paid', '€143.20'],
].map(([customer, status, payment, total], i) => ({
  id: `BK-${20421 - i}`,
  customer: customer!,
  status: status as Order['status'],
  payment: payment as Order['payment'],
  total: total!,
}));

const columns: ColumnDef<Order>[] = [
  { key: 'id', label: 'Order', mobile: 'title', render: (r) => r.id },
  {
    key: 'customer',
    label: 'Customer',
    sortable: true,
    sortValue: (r) => r.customer,
    searchValue: (r) => r.customer,
    render: (r) => r.customer,
  },
  {
    key: 'status',
    label: 'Status',
    filterable: true,
    filterValue: (r) => r.status,
    render: (r) => r.status,
  },
  {
    key: 'payment',
    label: 'Payment',
    filterable: true,
    filterValue: (r) => r.payment,
    render: (r) => r.payment,
  },
  { key: 'total', label: 'Total', align: 'end', render: (r) => r.total },
];

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-4 text-[var(--color-text-base)]">{children}</div>
);

const laptop = { viewport: { value: 'laptop', isRotated: false } } as const;
const tablet = { viewport: { value: 'tablet', isRotated: false } } as const;

const actions = (onClick: DataTableBulkAction<Order>['onClick'] = () => {}) =>
  [
    { key: 'ship', label: 'Mark as shipped', icon: Truck, onClick },
    { key: 'print', label: 'Print labels', icon: Printer, onClick },
    { key: 'archive', label: 'Archive', icon: Archive, onClick },
    { key: 'delete', label: 'Delete', icon: Trash2, intent: 'danger', onClick },
  ] satisfies DataTableBulkAction<Order>[];

const selected = new Set<string | number>(['BK-20420', 'BK-20419', 'BK-20417']);

type OrdersProps = Partial<React.ComponentProps<typeof DataTable<Order>>>;

const Orders = (props: OrdersProps) => (
  <DataTable
    aria-label="Orders"
    rows={rows}
    columns={columns}
    rowKey={(r) => r.id}
    selectable
    defaultSearchValue=""
    searchPlaceholder="Search orders, customers"
    columnsMenu
    exportable
    bulkActionItems={actions()}
    {...props}
  />
);

/**
 * Rows selected: the count and the bulk actions on the start side, the search and the toolbar on
 * the end side, all on one row. The toolbar's Export says what it exports: "Export 3".
 */
export const SelectionKeepsTheToolbar: Story = {
  globals: laptop,
  render: () => (
    <Wrap>
      <Orders defaultSelection={selected} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('3 selected')).toBeVisible();
    await expect(canvas.getByRole('searchbox', { name: 'Search rows' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Export 3' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Columns' })).toBeVisible();
    // One row: the actions and the search share the same line.
    const search = canvas.getByRole('searchbox', { name: 'Search rows' });
    const ship = canvas.getByRole('button', { name: 'Mark as shipped' });
    await expect(
      Math.abs(search.getBoundingClientRect().top - ship.getBoundingClientRect().top)
    ).toBeLessThan(40);
    // Wide enough: every action is a button, nothing is folded.
    await expect(canvas.getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Actions' })).toBeNull();
  },
};

/**
 * Less room: the first action stays a button and the others fold into an "Actions" menu, the
 * search narrows and the toolbar buttons keep their icon only.
 */
export const BulkActionsFoldIntoAMenu: Story = {
  globals: tablet,
  render: () => (
    <Wrap>
      <Orders defaultSelection={selected} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Mark as shipped' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Actions' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Delete' })).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Print labels' })).toBeNull();
    await expect(canvas.getByRole('searchbox', { name: 'Search rows' })).toBeVisible();
    // The toolbar buttons keep their names and lose their text.
    const columnsButton = canvas.getByRole('button', { name: 'Columns' });
    await expect(columnsButton.getBoundingClientRect().width).toBeLessThan(48);
  },
};

/**
 * In cards mode on a phone the bulk actions are icon buttons with their names, on the count's
 * line; the search is on the line under it, then the cards' own sort line.
 */
export const BulkActionsOnAPhone: Story = {
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <Orders mobileLayout="cards" defaultSelection={selected} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(canvas.getByText('3 selected')).toBeVisible();
    for (const name of ['Mark as shipped', 'Print labels', 'Archive', 'Delete']) {
      const button = canvas.getByRole('button', { name });
      await expect(button).toBeVisible();
      // Icon only: as wide as it is tall.
      const box = button.getBoundingClientRect();
      await expect(Math.round(box.width)).toBe(Math.round(box.height));
    }
    const search = canvas.getByRole('searchbox', { name: 'Search rows' });
    await expect(search).toBeVisible();
    await expect(search.getBoundingClientRect().top).toBeGreaterThan(
      canvas.getByText('3 selected').getBoundingClientRect().bottom
    );
  },
};

/** The existing `bulkActions` render function still works, next to the search and the toolbar. */
export const BulkActionsAsNodes: Story = {
  globals: laptop,
  tags: ['!autodocs'],
  render: () => (
    <Wrap>
      <Orders
        bulkActionItems={undefined}
        defaultSelection={selected}
        bulkActions={(rows) => (
          <Button variant="secondary" size="md" icon={Archive}>
            Archive {rows.length}
          </Button>
        )}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Archive 3' })).toBeVisible();
    await expect(canvas.getByRole('searchbox', { name: 'Search rows' })).toBeVisible();
  },
};

/**
 * Cards mode: a "Filters" button with the number of active filters opens a sheet with the filter
 * of each filterable column. Two filters are active here.
 */
export const FiltersOnAPhone: Story = {
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <Orders
        mobileLayout="cards"
        defaultFilters={{ status: new Set(['Packed']), payment: new Set(['Paid']) }}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const button = canvas.getByRole('button', { name: /^Filters/ });
    await expect(button).toBeVisible();
    await expect(button).toHaveTextContent('2');
  },
};

/** The sheet, opened: one group of checkboxes per filterable column. */
export const FiltersSheetOpen: Story = {
  globals: mobileViewport,
  tags: ['!autodocs'],
  render: () => (
    <Wrap>
      <Orders
        mobileLayout="cards"
        defaultFilters={{ status: new Set(['Packed']) }}
        selectable={false}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Filters/ }));
    const sheet = within(await within(document.body).findByRole('dialog', { name: 'Filters' }));
    await expect(sheet.getByRole('group', { name: 'Status' })).toBeVisible();
    await expect(sheet.getByRole('group', { name: 'Payment' })).toBeVisible();
    await expect(sheet.getByRole('checkbox', { name: 'Packed' })).toBeChecked();
    await expect(sheet.getByRole('button', { name: 'Show 3 rows' })).toBeVisible();
  },
};

/** No data at all: the host's call to action. */
export const EmptyWithAnAction: Story = {
  globals: laptop,
  render: () => (
    <Wrap>
      <DataTable
        aria-label="Orders"
        rows={[]}
        columns={columns}
        rowKey={(r) => r.id}
        defaultSearchValue=""
        emptyTitle="No orders yet"
        emptyDescription="Orders appear here as soon as a customer checks out."
        emptyAction={<Button size="sm">Create the first order</Button>}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Create the first order' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Clear filters' })).toBeNull();
  },
};

/** A search and filters hide every row: the table offers to clear them. */
export const FiltersHideEveryRow: Story = {
  globals: laptop,
  render: () => (
    <Wrap>
      <Orders
        selectable={false}
        defaultSearchValue="zzz"
        defaultFilters={{ status: new Set(['Packed']) }}
        emptyAction={<Button size="sm">Create the first order</Button>}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Clear filters' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Create the first order' })).toBeNull();
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

/** Typing in the search while rows are selected keeps the selection. */
export const TypingKeepsTheSelection: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  render: () => (
    <Wrap>
      <Orders defaultSelection={selected} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const search = canvas.getByRole('searchbox', { name: 'Search rows' });
    await userEvent.type(search, 'aiko');
    await expect(search).toHaveValue('aiko');
    await expect(canvas.getByText('3 selected')).toBeVisible();
    await expect(canvas.getByText('Aiko Tanaka')).toBeVisible();
    await expect(canvas.queryByText('Oliver Brandt')).toBeNull();
    await expect(canvas.getByRole('checkbox', { name: 'Select row BK-20419' })).toBeChecked();
    // The search clears and the selection is still there.
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
    await expect(canvas.getByText('3 selected')).toBeVisible();
    await expect(canvas.getByText('Oliver Brandt')).toBeVisible();
  },
};

/** Clear empties the selection and the bar gives back the plain toolbar. */
export const ClearLeavesTheToolbar: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  render: () => (
    <Wrap>
      <Orders defaultSelection={selected} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Clear' }));
    await expect(canvas.queryByText(/selected/)).toBeNull();
    await expect(canvas.getByRole('searchbox', { name: 'Search rows' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Export' })).toBeVisible();
  },
};

/** A bulk action gets the selected rows. */
export const BulkActionsReceiveTheRows: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  render: () => {
    const [last, setLast] = useState('none');
    return (
      <Wrap>
        <p data-testid="last">{last}</p>
        <Orders
          defaultSelection={selected}
          bulkActionItems={actions((rows) =>
            setLast(
              rows
                .map((r) => r.id)
                .sort()
                .join(',')
            )
          )}
        />
      </Wrap>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Delete' }));
    await expect(canvas.getByTestId('last')).toHaveTextContent('BK-20417,BK-20419,BK-20420');
  },
};

/** The folded menu runs the others, and closes. */
export const FoldedMenuRunsAnAction: Story = {
  tags: ['!dev', '!autodocs'],
  globals: tablet,
  render: () => {
    const [last, setLast] = useState('none');
    const items: DataTableBulkAction<Order>[] = actions().map((a) => ({
      ...a,
      onClick: (selectedRows) => setLast(`${a.label}:${selectedRows.length}`),
    }));
    return (
      <Wrap>
        <p data-testid="last">{last}</p>
        <Orders defaultSelection={selected} bulkActionItems={items} />
      </Wrap>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }));
    const menu = within(await within(document.body).findByRole('menu', { name: 'Actions' }));
    // The first action is the button; the menu holds the others, the destructive one last.
    await expect(menu.queryByRole('menuitem', { name: 'Mark as shipped' })).toBeNull();
    const items = menu.getAllByRole('menuitem').map((i) => i.textContent);
    await expect(items).toEqual(['Print labels', 'Archive', 'Delete']);
    await userEvent.click(menu.getByRole('menuitem', { name: 'Archive' }));
    await expect(canvas.getByTestId('last')).toHaveTextContent('Archive:3');
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
  },
};

// Stands in for the download: records the Blob handed to the object URL and starts nothing.
const interceptDownload = () => {
  const blobs: Blob[] = [];
  const create = spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    blobs.push(blob as Blob);
    return 'blob:fake';
  });
  const revoke = spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const click = spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  return { blobs, restore: () => [create, revoke, click].forEach((spy) => spy.mockRestore()) };
};

const csvOf = async (blob: Blob) =>
  new TextDecoder('utf-8').decode(new Uint8Array(await blob.arrayBuffer()));

/** With rows selected the toolbar's Export downloads them alone; without, the filtered rows. */
export const ExportFollowsTheSelection: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  render: () => (
    <Wrap>
      <Orders />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const download = interceptDownload();
    try {
      await expect(canvas.queryByRole('button', { name: /^Export \d/ })).toBeNull();
      await userEvent.click(canvas.getByRole('button', { name: 'Export' }));
      await expect(download.blobs).toHaveLength(1);
      await expect((await csvOf(download.blobs[0]!)).trim().split('\n')).toHaveLength(
        rows.length + 1
      );

      await userEvent.click(canvas.getByRole('checkbox', { name: 'Select row BK-20420' }));
      await userEvent.click(canvas.getByRole('checkbox', { name: 'Select row BK-20417' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Export 2' }));
      await expect(download.blobs).toHaveLength(2);
      const lines = (await csvOf(download.blobs[1]!)).trim().split('\n');
      await expect(lines).toHaveLength(3);
      await expect(lines.join('\n')).toContain('Tomás Herrera');
      await expect(lines.join('\n')).toContain('Fatima Okonkwo');
      await expect(lines.join('\n')).not.toContain('Maya Lindqvist');

      await userEvent.click(canvas.getByRole('button', { name: 'Clear' }));
      await expect(canvas.getByRole('button', { name: 'Export' })).toBeVisible();
    } finally {
      download.restore();
    }
  },
};

/** `onExport` hears the selected keys, and only while rows are selected. */
export const ExportQueryCarriesTheSelection: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  args: { onExport: fn() },
  render: (args) => (
    <Wrap>
      <Orders onExport={args.onExport} />
    </Wrap>
  ),
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Export' }));
    await expect(args.onExport).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ selection: expect.anything() })
    );
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select row BK-20420' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Export 1' }));
    await expect(args.onExport).toHaveBeenLastCalledWith(
      expect.objectContaining({ selection: ['BK-20420'] })
    );
  },
};

/** The sheet drives the same `filters` state as the column filters: controlled, here. */
export const FiltersSheetDrivesTheFilters: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  args: { onFiltersChange: fn() },
  render: (args) => {
    const [filters, setFilters] = useState<Record<string, Set<string>>>({});
    return (
      <Wrap>
        <Orders
          selectable={false}
          mobileLayout="cards"
          filters={filters}
          onFiltersChange={(next) => {
            args.onFiltersChange?.(next);
            setFilters(next);
          }}
        />
      </Wrap>
    );
  },
  play: async ({ args, canvas }) => {
    const open = canvas.getByRole('button', { name: /^Filters/ });
    await expect(open).not.toHaveTextContent(/\d/);
    await userEvent.click(open);
    const sheet = within(await within(document.body).findByRole('dialog', { name: 'Filters' }));
    await expect(sheet.getByRole('button', { name: 'Show 8 rows' })).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Clear all' })).toBeDisabled();

    await userEvent.click(sheet.getByRole('checkbox', { name: 'Packed' }));
    await expect(args.onFiltersChange).toHaveBeenLastCalledWith({ status: new Set(['Packed']) });
    await expect(sheet.getByRole('checkbox', { name: 'Packed' })).toBeChecked();
    await expect(sheet.getByRole('button', { name: 'Show 3 rows' })).toBeVisible();
    await userEvent.click(sheet.getByRole('checkbox', { name: 'Failed' }));
    await userEvent.click(sheet.getByRole('checkbox', { name: 'Paid' }));
    await expect(sheet.getByRole('button', { name: 'Show 3 rows' })).toBeVisible();
    await userEvent.click(sheet.getByRole('checkbox', { name: 'Failed' }));

    // Closing keeps the filters, and the button counts them.
    await userEvent.click(sheet.getByRole('button', { name: 'Show 3 rows' }));
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull());
    await expect(canvas.getByRole('button', { name: /^Filters/ })).toHaveTextContent('2');
    await expect(canvas.getByText(/Active filters/)).toBeVisible();

    // Clear all empties them.
    await userEvent.click(canvas.getByRole('button', { name: /^Filters/ }));
    const again = within(await within(document.body).findByRole('dialog', { name: 'Filters' }));
    await userEvent.click(again.getByRole('button', { name: 'Clear all' }));
    await expect(args.onFiltersChange).toHaveBeenLastCalledWith({});
    await expect(again.getByRole('button', { name: 'Show 8 rows' })).toBeVisible();
    await userEvent.click(again.getByRole('button', { name: 'Show 8 rows' }));
    await expect(canvas.getByRole('button', { name: /^Filters/ })).not.toHaveTextContent(/\d/);
  },
};

/** Uncontrolled: `defaultFilters` start the sheet, the checkboxes filter the cards. */
export const FiltersSheetUncontrolled: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <Orders
        selectable={false}
        mobileLayout="cards"
        defaultFilters={{ payment: new Set(['Failed']) }}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const cards = () => canvas.getAllByRole('listitem');
    await expect(cards()).toHaveLength(1);
    await userEvent.click(canvas.getByRole('button', { name: /^Filters/ }));
    const sheet = within(await within(document.body).findByRole('dialog', { name: 'Filters' }));
    await expect(sheet.getByRole('checkbox', { name: 'Failed' })).toBeChecked();
    await userEvent.click(sheet.getByRole('checkbox', { name: 'Failed' }));
    await expect(sheet.getByRole('button', { name: 'Show 8 rows' })).toBeVisible();
    await userEvent.click(sheet.getByRole('button', { name: 'Show 8 rows' }));
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull());
    await expect(cards()).toHaveLength(8);
  },
};

/** Escape closes the sheet and the focus goes back to the Filters button. */
export const FiltersSheetClosesOnEscape: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <Orders selectable={false} mobileLayout="cards" />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const open = canvas.getByRole('button', { name: /^Filters/ });
    await expect(open).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(open);
    await within(document.body).findByRole('dialog', { name: 'Filters' });
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull());
    await expect(open).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(open).toHaveFocus());
  },
};

/** Where the table is a table the columns carry their filters: no Filters button. */
export const NoFiltersButtonOnADesktop: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  render: () => (
    <Wrap>
      <Orders selectable={false} mobileLayout="cards" />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: /^Filters/ })).toBeNull();
  },
};

/** A table without filterable columns has nothing to put in the sheet. */
export const NoFiltersButtonWithoutFilterableColumns: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <Orders
        selectable={false}
        mobileLayout="cards"
        columns={columns.map((c) => ({ ...c, filterable: false }))}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: /^Filters/ })).toBeNull();
  },
};

/** "Clear filters" empties the search and the filters together and gives the rows back. */
export const ClearFiltersGivesTheRowsBack: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  args: { onSearchChange: fn(), onFiltersChange: fn() },
  render: (args) => (
    <Wrap>
      <Orders
        selectable={false}
        defaultSearchValue="zzz"
        defaultFilters={{ status: new Set(['Packed']) }}
        onSearchChange={args.onSearchChange}
        onFiltersChange={args.onFiltersChange}
      />
    </Wrap>
  ),
  play: async ({ args, canvas }) => {
    await expect(canvas.getByText('No results')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Clear filters' }));
    await expect(args.onSearchChange).toHaveBeenLastCalledWith('');
    await expect(args.onFiltersChange).toHaveBeenLastCalledWith({});
    await expect(canvas.getByRole('searchbox', { name: 'Search rows' })).toHaveValue('');
    await expect(canvas.getByText('Maya Lindqvist')).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Clear filters' })).toBeNull();
  },
};

/** Rows exist and nothing hides them, or the table is empty to start with: no "Clear filters". */
export const ClearFiltersOnlyWhenTheyHideRows: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  render: () => (
    <Wrap>
      <div className="flex flex-col gap-4">
        <DataTable
          aria-label="No data"
          rows={[]}
          columns={columns}
          rowKey={(r) => r.id}
          defaultSearchValue=""
          emptyAction={<Button size="sm">Create the first order</Button>}
        />
        <DataTable
          aria-label="Filtered"
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          defaultSearchValue="zzz"
          emptyAction={<Button size="sm">Create another order</Button>}
        />
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const none = within(canvas.getByRole('table', { name: 'No data' }));
    await expect(none.getByRole('button', { name: 'Create the first order' })).toBeVisible();
    await expect(none.queryByRole('button', { name: 'Clear filters' })).toBeNull();
    const filtered = within(canvas.getByRole('table', { name: 'Filtered' }));
    await expect(filtered.getByRole('button', { name: 'Clear filters' })).toBeVisible();
    await expect(filtered.queryByRole('button', { name: 'Create another order' })).toBeNull();
  },
};

/** The cards' empty state has the same actions. */
export const CardsEmptyActions: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <div className="flex flex-col gap-4">
        <DataTable
          aria-label="No data"
          rows={[]}
          columns={columns}
          rowKey={(r) => r.id}
          mobileLayout="cards"
          emptyAction={<Button size="sm">Create the first order</Button>}
        />
        <DataTable
          aria-label="Filtered"
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          mobileLayout="cards"
          defaultFilters={{ status: new Set(['Cancelled']), payment: new Set(['Paid']) }}
          emptyAction={<Button size="sm">Create another order</Button>}
        />
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const visible = (name: string) =>
      canvas.queryAllByRole('button', { name }).filter((b) => b.offsetParent);
    await expect(visible('Create the first order')).toHaveLength(1);
    await expect(visible('Create another order')).toHaveLength(0);
    await expect(visible('Clear filters')).toHaveLength(1);
    await userEvent.click(visible('Clear filters')[0]!);
    await expect(canvas.getAllByRole('listitem').filter((e) => e.offsetParent).length).toBe(8);
  },
};
