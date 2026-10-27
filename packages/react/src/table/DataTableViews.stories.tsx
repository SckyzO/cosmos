import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { DataTable } from './DataTable';
import type { ColumnDef, DataTableView } from './types';

// The saved views of DataTable live in their own file, with the same `Tables/DataTable` family:
// DataTable.stories.tsx is already one of the largest stories files of the package.
const meta = {
  title: 'Tables/DataTable saved views',
  component: DataTable,
  parameters: { ...portalDocsParams.lg(), layout: 'padded' },
  tags: ['autodocs'],
  args: { rows: [], columns: [], rowKey: () => '' },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

type User = { id: string; name: string; role: string; team: string; city: string };

const rows: User[] = [
  ['Ada Lovelace', 'Engineer', 'Core', 'London'],
  ['Grace Hopper', 'Admiral', 'Navy', 'New York'],
  ['Linus Torvalds', 'Engineer', 'Kernel', 'Portland'],
  ['Margaret Hamilton', 'Director', 'Core', 'Boston'],
  ['Alan Turing', 'Researcher', 'Crypto', 'Manchester'],
  ['Zoë Kowalski', 'Engineer', 'Core', 'Kraków'],
  ['Edsger Dijkstra', 'Engineer', 'Core', 'Eindhoven'],
  ['Barbara Liskov', 'Engineer', 'Core', 'Boston'],
  ['Ken Thompson', 'Engineer', 'Core', 'New Orleans'],
  ['Dennis Ritchie', 'Engineer', 'Core', 'Bronxville'],
  ['Donald Knuth', 'Engineer', 'Core', 'Milwaukee'],
  ['Tim Berners-Lee', 'Engineer', 'Web', 'London'],
].map(([name, role, team, city], i) => ({ id: `user-${i + 1}`, name, role, team, city }));

const columns: ColumnDef<User>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    sortValue: (r) => r.name,
    searchValue: (r) => r.name,
    render: (r) => <span className="font-medium text-gray-900 dark:text-white">{r.name}</span>,
  },
  {
    key: 'role',
    label: 'Role',
    filterable: true,
    filterValue: (r) => r.role,
    render: (r) => r.role,
  },
  {
    key: 'team',
    label: 'Team',
    filterable: true,
    filterValue: (r) => r.team,
    render: (r) => r.team,
  },
  { key: 'city', label: 'City', defaultHidden: true, render: (r) => r.city },
];

// Every part differs from the table's defaults (25 rows, no search, filter or sort, `City`
// hidden, default density): applying it moves the whole state. Five engineers of the Core team
// have an "o" in their name: two pages of three.
const CORE_ENGINEERS: DataTableView = {
  id: 'core-engineers',
  name: 'Core engineers',
  search: 'o',
  filters: { role: ['Engineer'], team: ['Core'] },
  sort: { key: 'name', direction: 'desc' },
  columnVisibility: { name: true, role: true, team: false, city: true },
  pageSize: 3,
  density: 'comfortable',
};
const EVERYONE: DataTableView = {
  id: 'everyone',
  name: 'Everyone',
  search: '',
  filters: {},
  sort: null,
  columnVisibility: { name: true, role: true, team: true, city: false },
  pageSize: 'all',
  density: 'default',
};
const VIEWS = [CORE_ENGINEERS, EVERYONE];

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

type Canvas = {
  getByRole: (role: string, options?: { name: string | RegExp }) => HTMLElement;
  getAllByRole: (role: string) => HTMLElement[];
};
const body = within(document.body);

const openViews = async (canvas: Canvas, button: string | RegExp = 'Views') => {
  await userEvent.click(canvas.getByRole('button', { name: button }));
  return within(await body.findByRole('menu', { name: 'Views' }));
};
const pick = async (canvas: Canvas, view: string, button?: string | RegExp) => {
  await userEvent.click(
    (await openViews(canvas, button)).getByRole('menuitemradio', { name: view })
  );
};
const command = async (canvas: Canvas, name: string, button?: string | RegExp) => {
  await userEvent.click((await openViews(canvas, button)).getByRole('menuitem', { name }));
};
// A filtered column's header carries the count of its filter after the label.
const headers = (canvas: Canvas) =>
  canvas.getAllByRole('columnheader').map((h) => h.textContent?.trim().replace(/\d+$/, ''));
const names = (canvas: Canvas) =>
  canvas
    .getAllByRole('row')
    .slice(1)
    .map((r) => r.querySelector('td')?.textContent);
// The arguments of the first call of a story `fn()`.
const firstCall = (spy: unknown) => (spy as { mock: { calls: unknown[][] } }).mock.calls[0];
const gone = (role: string) => waitFor(() => expect(body.queryByRole(role)).toBeNull());

/**
 * `views` and `activeView` held by the host, here in `useState`: the Views button applies a view,
 * saves the current state as a new one, renames or deletes the active one. Storing the list is the
 * host's job.
 */
export const SavedViews: Story = {
  render: () => {
    const Host = () => {
      const [views, setViews] = useState<DataTableView[]>(VIEWS);
      const [active, setActive] = useState<string | null>(null);
      return (
        <Wrap>
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            defaultPageSize={5}
            pageSizeOptions={[3, 5, 10]}
            defaultSearchValue=""
            searchPlaceholder="Search users…"
            columnsMenu
            exportable
            views={views}
            onViewsChange={setViews}
            activeView={active}
            onActiveViewChange={setActive}
          />
        </Wrap>
      );
    };
    return <Host />;
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Views' })).toHaveAttribute(
      'aria-haspopup',
      'menu'
    );
  },
};

/** Without a search field the toolbar still shows, for the button alone. */
export const ViewsWithoutSearch: Story = {
  tags: ['!autodocs'],
  render: () => (
    <Wrap>
      <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} defaultViews={VIEWS} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Views' })).toBeVisible();
    await expect(canvas.queryByRole('searchbox')).toBeNull();
  },
};

/** A table without `views` or `defaultViews` has no Views button. */
export const NoViewsByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} defaultSearchValue="" />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: /views/i })).toBeNull();
  },
};

/** Applying a view restores the search, filters, sort, visible columns, page size and density. */
export const ApplyingAViewRestoresEveryPart: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        defaultPageSize={5}
        pageSizeOptions={[3, 5, 10]}
        defaultSearchValue=""
        columnsMenu
        defaultViews={VIEWS}
      />
    </Wrap>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(headers(canvas)).toEqual(['Name', 'Role', 'Team']);
    await expect(canvasElement.querySelector('tbody td')).toHaveClass('py-3.5');

    await pick(canvas, 'Core engineers');
    await expect(canvas.getByRole('searchbox', { name: 'Search rows' })).toHaveValue('o');
    await expect(canvas.getByText('Active filters:')).toBeVisible();
    await expect(headers(canvas)).toEqual(['Name', 'Role', 'City']);
    await expect(canvas.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
      'aria-sort',
      'descending'
    );
    await expect(names(canvas)).toEqual(['Zoë Kowalski', 'Ken Thompson', 'Donald Knuth']);
    await expect(canvas.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('3');
    await expect(canvasElement.querySelector('tbody td')).toHaveClass('py-5');
    await expect(canvas.getByRole('button', { name: 'Core engineers' })).toBeVisible();

    // Another view puts everything back, and "Show all" shows every row.
    await pick(canvas, 'Everyone', 'Core engineers');
    await expect(canvas.getByRole('searchbox', { name: 'Search rows' })).toHaveValue('');
    await expect(canvas.queryByText('Active filters:')).toBeNull();
    await expect(headers(canvas)).toEqual(['Name', 'Role', 'Team']);
    await expect(canvas.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
      'aria-sort',
      'none'
    );
    await expect(names(canvas)).toHaveLength(rows.length);
    await expect(canvas.getByRole('button', { name: 'Show paginated' })).toBeVisible();
    await expect(canvasElement.querySelector('tbody td')).toHaveClass('py-3.5');
  },
};

/** Applying a view goes back to the first page. */
export const ApplyingAViewGoesBackToTheFirstPage: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        defaultPageSize={5}
        defaultViews={[{ ...EVERYONE, pageSize: 5 }]}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(names(canvas)[0]).toBe('Zoë Kowalski');
    await pick(canvas, 'Everyone');
    await expect(names(canvas)[0]).toBe('Ada Lovelace');
  },
};

/** Each part goes through the table's own setters, so a host that controls one hears about it. */
export const ApplyingAViewCallsTheChangeCallbacks: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    onSearchChange: fn(),
    onFiltersChange: fn(),
    onColumnVisibilityChange: fn(),
    onPageSizeChange: fn(),
    onDensityChange: fn(),
    onActiveViewChange: fn(),
  },
  render: (args) => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        defaultViews={VIEWS}
        onSearchChange={args.onSearchChange}
        onFiltersChange={args.onFiltersChange}
        onColumnVisibilityChange={args.onColumnVisibilityChange}
        onPageSizeChange={args.onPageSizeChange}
        onDensityChange={args.onDensityChange}
        onActiveViewChange={args.onActiveViewChange}
      />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    await pick(canvas, 'Core engineers');
    await expect(args.onSearchChange).toHaveBeenCalledWith('o');
    await expect(args.onFiltersChange).toHaveBeenCalledWith({
      role: new Set(['Engineer']),
      team: new Set(['Core']),
    });
    await expect(args.onColumnVisibilityChange).toHaveBeenCalledWith(
      CORE_ENGINEERS.columnVisibility
    );
    await expect(args.onPageSizeChange).toHaveBeenCalledWith(3);
    await expect(args.onDensityChange).toHaveBeenCalledWith('comfortable');
    await expect(args.onActiveViewChange).toHaveBeenCalledWith('core-engineers');
  },
};

/** "Save as…" adds a view that holds the current state, and makes it the active one. */
export const SaveAsAddsTheCurrentState: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onViewsChange: fn(), onActiveViewChange: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        defaultPageSize={5}
        defaultSearchValue=""
        defaultDensity="comfortable"
        defaultViews={[]}
        onViewsChange={args.onViewsChange}
        onActiveViewChange={args.onActiveViewChange}
      />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search rows' }), 'o');
    await userEvent.click(canvas.getByRole('button', { name: 'Name' }));
    await command(canvas, 'Save as…');
    const dialog = within(await body.findByRole('dialog', { name: 'Save view as' }));
    // The field takes the focus: Enter submits.
    await expect(dialog.getByRole('textbox', { name: 'View name' })).toHaveFocus();
    await userEvent.keyboard('Mine{Enter}');
    await gone('dialog');

    await expect(args.onViewsChange).toHaveBeenCalledTimes(1);
    const [views] = firstCall(args.onViewsChange);
    await expect(views).toEqual([
      {
        id: expect.any(String),
        name: 'Mine',
        search: 'o',
        filters: {},
        sort: { key: 'name', direction: 'asc' },
        columnVisibility: { name: true, role: true, team: true, city: false },
        pageSize: 5,
        density: 'comfortable',
      },
    ]);
    await expect(args.onActiveViewChange).toHaveBeenCalledWith((views as DataTableView[])[0].id);
    await expect(canvas.getByRole('button', { name: 'Mine' })).toBeVisible();
    // The picker lists it, as the checked one.
    const menu = await openViews(canvas, 'Mine');
    await expect(menu.getByRole('menuitemradio', { name: 'Mine' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  },
};

/** The button adds "(modified)" once the table no longer matches the active view, in its name too. */
export const TheButtonSaysWhenTheViewIsModified: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        defaultPageSize={5}
        pageSizeOptions={[3, 5, 10]}
        defaultSearchValue=""
        defaultViews={VIEWS}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await pick(canvas, 'Core engineers');
    await expect(canvas.getByRole('button', { name: 'Core engineers' })).toHaveTextContent(
      /^Core engineers$/
    );
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search rows' }), 'a');
    const modified = canvas.getByRole('button', { name: 'Core engineers (modified)' });
    await expect(modified).toHaveTextContent('Core engineers (modified)');
    // Undoing the change clears the mark.
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search rows' }), '{Backspace}');
    await expect(canvas.getByRole('button', { name: 'Core engineers' })).toBeVisible();
  },
};

/** "Rename…" and "Delete" act on the active view: disabled without one. */
export const RenameAndDeleteNeedAnActiveView: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} defaultViews={VIEWS} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const menu = await openViews(canvas);
    await expect(menu.getByRole('menuitem', { name: 'Save as…' })).toBeEnabled();
    await expect(menu.getByRole('menuitem', { name: 'Rename…' })).toBeDisabled();
    await expect(menu.getByRole('menuitem', { name: 'Delete' })).toBeDisabled();
    await expect(
      menu.getAllByRole('menuitemradio').map((i) => i.getAttribute('aria-checked'))
    ).toEqual(['false', 'false']);
    await userEvent.click(menu.getByRole('menuitemradio', { name: 'Everyone' }));
    const again = await openViews(canvas, 'Everyone');
    await expect(again.getByRole('menuitem', { name: 'Rename…' })).toBeEnabled();
    await expect(again.getByRole('menuitem', { name: 'Delete' })).toBeEnabled();
  },
};

/** "Rename…" opens the dialog with the current name; the list keeps its order and ids. */
export const RenameAView: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onViewsChange: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        defaultViews={VIEWS}
        defaultActiveView="everyone"
        onViewsChange={args.onViewsChange}
      />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    await command(canvas, 'Rename…', /^Everyone/);
    const dialog = within(await body.findByRole('dialog', { name: 'Rename view' }));
    const field = dialog.getByRole('textbox', { name: 'View name' });
    await expect(field).toHaveValue('Everyone');
    await userEvent.clear(field);
    await userEvent.type(field, 'All staff{Enter}');
    await gone('dialog');
    await expect(args.onViewsChange).toHaveBeenCalledWith([
      CORE_ENGINEERS,
      { ...EVERYONE, name: 'All staff' },
    ]);
    await expect(canvas.getByRole('button', { name: /^All staff/ })).toBeVisible();
  },
};

/** An empty name or one another view has is refused, with the reason under the field. */
export const NameMustBeFilledAndNew: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onViewsChange: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        defaultViews={VIEWS}
        onViewsChange={args.onViewsChange}
      />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    await command(canvas, 'Save as…');
    const dialog = within(await body.findByRole('dialog', { name: 'Save view as' }));
    const field = dialog.getByRole('textbox', { name: 'View name' });
    await userEvent.type(field, '{Enter}');
    await expect(dialog.getByText('Enter a name.')).toBeVisible();
    await expect(field).toHaveAttribute('aria-invalid', 'true');

    await userEvent.type(field, ' core ENGINEERS {Enter}');
    await expect(dialog.getByText('A view with this name already exists.')).toBeVisible();
    await expect(body.getByRole('dialog', { name: 'Save view as' })).toBeVisible();
    await expect(args.onViewsChange).not.toHaveBeenCalled();

    // Typing clears the error; a free name goes through.
    await userEvent.clear(field);
    await expect(dialog.queryByText('A view with this name already exists.')).toBeNull();
    await userEvent.type(field, 'Fresh{Enter}');
    await gone('dialog');
    await expect(args.onViewsChange).toHaveBeenCalledTimes(1);
  },
};

/** "Delete" asks first; Cancel keeps the view, Delete removes it and leaves no active view. */
export const DeleteAfterConfirmation: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onViewsChange: fn(), onActiveViewChange: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        defaultViews={VIEWS}
        defaultActiveView="everyone"
        onViewsChange={args.onViewsChange}
        onActiveViewChange={args.onActiveViewChange}
      />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    await command(canvas, 'Delete', /^Everyone/);
    const alert = within(await body.findByRole('alertdialog', { name: 'Delete "Everyone"?' }));
    await userEvent.click(alert.getByRole('button', { name: 'Cancel' }));
    await gone('alertdialog');
    await expect(args.onViewsChange).not.toHaveBeenCalled();
    await expect(canvas.getByRole('button', { name: /^Everyone/ })).toBeVisible();

    await command(canvas, 'Delete', /^Everyone/);
    const again = within(await body.findByRole('alertdialog', { name: 'Delete "Everyone"?' }));
    await userEvent.click(again.getByRole('button', { name: 'Delete' }));
    await gone('alertdialog');
    await expect(args.onViewsChange).toHaveBeenCalledWith([CORE_ENGINEERS]);
    await expect(args.onActiveViewChange).toHaveBeenCalledWith(null);
    await expect(canvas.getByRole('button', { name: 'Views' })).toBeVisible();
  },
};

/** A host that controls `views` decides: the list changes once it passes it back. */
export const ControlledViewsFollowTheHost: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onViewsChange: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        views={VIEWS}
        activeView={null}
        onViewsChange={args.onViewsChange}
      />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    await command(canvas, 'Save as…');
    await body.findByRole('dialog', { name: 'Save view as' });
    await userEvent.keyboard('Extra{Enter}');
    await gone('dialog');
    await expect(args.onViewsChange).toHaveBeenCalledTimes(1);
    const menu = await openViews(canvas);
    await expect(menu.getAllByRole('menuitemradio')).toHaveLength(2);
    // The active view is the host's too: picking one reports it and the button keeps "Views".
    await expect(canvas.getByRole('button', { name: 'Views' })).toBeVisible();
  },
};

/** Below `sm` the Views, Export and Columns buttons keep their icons and names and drop their labels. */
export const Mobile: Story = {
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        defaultSearchValue=""
        columnsMenu
        exportable
        defaultViews={VIEWS}
        defaultActiveView="core-engineers"
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const views = canvas.getByRole('button', { name: 'Core engineers (modified)' });
    await expect(views).toBeVisible();
    await expect(views.getBoundingClientRect().width).toBeLessThan(48);
    await expect(canvas.getByRole('button', { name: 'Export' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Columns' })).toBeVisible();
    await expect(canvas.getByLabelText(/search rows/i)).toBeVisible();
  },
};
