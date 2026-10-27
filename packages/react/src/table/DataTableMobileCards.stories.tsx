import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Menu } from '../ui/Menu';
import { Badge } from '../ui/Badge';
import { placeholderAvatar } from '../storybook-avatars';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { DataTable } from './DataTable';
import { TableIdentityCell } from './cells';
import { RowActionsMenu } from './RowActionsMenu';
import type { ColumnDef } from './types';

// DataTable's `mobileLayout="cards"`, in its own file with the other DataTable additions:
// DataTable.stories.tsx is already one of the largest stories files of the package.
const meta = {
  title: 'Tables/DataTable cards on phones',
  component: DataTable,
  parameters: { ...portalDocsParams.lg(), layout: 'padded' },
  tags: ['autodocs'],
  args: { rows: [], columns: [], rowKey: () => '' },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Invited' | 'Suspended';
  team: string;
  lastSeen: string;
};

const rows: User[] = [
  ['Ada Lovelace', 'Engineer', 'Active', 'Core', '2 min ago'],
  ['Grace Hopper', 'Admiral', 'Active', 'Navy', '1 h ago'],
  ['Linus Torvalds', 'Maintainer', 'Invited', 'Kernel', 'never'],
  ['Margaret Hamilton', 'Director', 'Active', 'Core', 'yesterday'],
  ['Alan Turing', 'Researcher', 'Suspended', 'Crypto', '3 days ago'],
  ['Barbara Liskov', 'Professor', 'Active', 'Types', '5 min ago'],
].map(([name, role, status, team, lastSeen], i) => ({
  id: `user-${i + 1}`,
  name: name!,
  email: `${name!.toLowerCase().replace(' ', '.')}@example.com`,
  role: role!,
  status: status as User['status'],
  team: team!,
  lastSeen: lastSeen!,
}));

const STATUS_INTENT = { Active: 'success', Invited: 'info', Suspended: 'danger' } as const;

const columns: ColumnDef<User>[] = [
  {
    key: 'name',
    label: 'User',
    mobile: 'title',
    sortable: true,
    sortValue: (r) => r.name,
    render: (r) => (
      <TableIdentityCell title={r.name} subtitle={r.email} src={placeholderAvatar(r.name, 80)} />
    ),
  },
  { key: 'role', label: 'Role', sortable: true, sortValue: (r) => r.role, render: (r) => r.role },
  {
    key: 'status',
    label: 'Status',
    render: (r) => <Badge intent={STATUS_INTENT[r.status]}>{r.status}</Badge>,
  },
  { key: 'team', label: 'Team', mobileLabel: 'Squad', render: (r) => r.team },
  { key: 'lastSeen', label: 'Last seen', mobile: 'hidden', render: (r) => r.lastSeen },
];

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-4 text-[var(--color-text-base)]">{children}</div>
);

const rowAction = (onAction?: (user: User) => void) => (r: User) => (
  <RowActionsMenu aria-label={`Actions for ${r.name}`}>
    <Menu.Item onClick={() => onAction?.(r)}>Edit</Menu.Item>
    <Menu.Item intent="danger">Remove</Menu.Item>
  </RowActionsMenu>
);

const cards = (canvas: ReturnType<typeof within>) => canvas.getAllByRole('listitem');
const titleOf = (card: HTMLElement) =>
  within(card).getByText(/^[A-Z][a-z]+ [A-Z][a-z]+$/).textContent;

/**
 * `mobileLayout="cards"`: below `sm` each row is a block of the table card. The first line holds
 * the checkbox, the `mobile: 'title'` column and the row action; under it, one label/value pair
 * per column. `Last seen` is `mobile: 'hidden'`, `Team` is relabelled `Squad`. The second line of
 * the toolbar has the "Sort by" select and the columns button.
 */
export const Cards: Story = {
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <DataTable
        aria-label="Users"
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        mobileLayout="cards"
        selectable
        columnsMenu
        defaultSearchValue=""
        searchPlaceholder="Search users…"
        renderRowAction={rowAction()}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const list = canvas.getByRole('list', { name: 'Users' });
    await expect(list).toBeVisible();
    await expect(cards(within(list))).toHaveLength(rows.length);
    // The table is still in the DOM, out of the accessibility tree.
    await expect(canvas.queryByRole('table')).toBeNull();
    await expect(canvas.getByRole('combobox', { name: 'Sort by' })).toBeVisible();
    await expect(
      canvas.getAllByRole('button', { name: 'Columns' }).filter((b) => b.offsetParent)
    ).toHaveLength(1);
  },
};

/** The same cards on a table with only a title and an action: no pairs, no sort, no toolbar. */
export const CardsWithoutPairs: Story = {
  tags: ['!autodocs'],
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <DataTable
        aria-label="Users"
        rows={rows}
        columns={[{ ...columns[0]!, sortable: false }]}
        rowKey={(r) => r.id}
        mobileLayout="cards"
        renderRowAction={rowAction()}
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(cards(canvas)).toHaveLength(rows.length);
    await expect(canvas.queryByRole('combobox', { name: 'Sort by' })).toBeNull();
    await expect(canvas.queryAllByRole('term')).toHaveLength(0);
  },
};

/** The cards show what the table shows: every shown column of every row, the hidden one left out. */
export const CardsShowTheTableData: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <DataTable
        aria-label="Users"
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        mobileLayout="cards"
      />
    </Wrap>
  ),
  play: async ({ canvas, canvasElement }) => {
    const items = cards(canvas);
    await expect(items).toHaveLength(rows.length);
    // The table is hidden below `sm`; read its cells to compare.
    const tableRows = Array.from(canvasElement.querySelectorAll('tbody tr'));
    await expect(tableRows).toHaveLength(rows.length);
    const shown = columns.filter((c) => c.mobile !== 'hidden');
    tableRows.forEach((tr, r) => {
      const cells = Array.from(tr.querySelectorAll('td')).map((td) => td.textContent?.trim());
      const card = within(items[r]!);
      shown.forEach((col, c) => {
        const cell = cells[columns.indexOf(col)]!;
        if (c === 0) {
          // The title column: the card holds the same cell.
          expect(items[r]!.textContent).toContain(cell);
        } else {
          const label = String(col.mobileLabel ?? col.label);
          const term = card.getByText(label, { selector: 'dt' });
          expect(term.nextElementSibling?.textContent?.trim()).toBe(cell);
        }
      });
      expect(items[r]!.textContent).not.toContain(rows[r]!.lastSeen);
    });
  },
};

/** Screen readers: a list of cards, each pair a term and its description, no table roles left. */
export const CardsAreAListForScreenReaders: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <DataTable
        aria-label="Users"
        rows={rows.slice(0, 2)}
        columns={columns}
        rowKey={(r) => r.id}
        mobileLayout="cards"
      />
    </Wrap>
  ),
  play: async ({ canvas, canvasElement }) => {
    // Hidden by `display: none`, so neither a role nor a name of it is reachable.
    for (const role of ['table', 'row', 'cell', 'columnheader']) {
      await expect(canvas.queryByRole(role)).toBeNull();
    }
    const table = canvasElement.querySelector('table')!;
    await expect(getComputedStyle(table.parentElement!).display).toBe('none');
    const list = canvas.getByRole('list', { name: 'Users' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    // Role `term`/`definition` come from `dt`/`dd`: one of each per pair (Role, Status, Squad).
    const first = within(within(list).getAllByRole('listitem')[0]!);
    await expect(first.getAllByRole('term').map((t) => t.textContent)).toEqual([
      'Role',
      'Status',
      'Squad',
    ]);
    await expect(first.getAllByRole('definition').map((d) => d.textContent)).toEqual([
      'Engineer',
      'Active',
      'Core',
    ]);
  },
};

/** The checkbox of a card selects its row, and the toolbar counts it. */
export const CardsSelection: Story = {
  tags: ['!autodocs'],
  globals: mobileViewport,
  args: { onSelectionChange: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        aria-label="Users"
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        mobileLayout="cards"
        selectable
        onSelectionChange={args.onSelectionChange}
      />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    const first = canvas.getByRole('checkbox', { name: 'Select row user-1' });
    await userEvent.click(first);
    await expect(first).toBeChecked();
    await expect(args.onSelectionChange).toHaveBeenLastCalledWith(new Set(['user-1']));
    await expect(canvas.getByText('1 selected')).toBeVisible();
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select row user-3' }));
    await expect(canvas.getByText('2 selected')).toBeVisible();
    await userEvent.click(first);
    await expect(first).not.toBeChecked();
    expectNoHorizontalOverflow();
  },
};

/** The action at the end of a card's first line opens its menu, and acts on that row. */
export const CardsRowAction: Story = {
  tags: ['!autodocs'],
  globals: mobileViewport,
  args: { onRowClick: fn() },
  render: function Render(args) {
    const [acted, setActed] = useState('');
    return (
      <Wrap>
        <DataTable
          aria-label="Users"
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          mobileLayout="cards"
          onRowClick={args.onRowClick}
          renderRowAction={rowAction((u) => setActed(u.name))}
        />
        <p role="status">{acted && `Edit ${acted}`}</p>
      </Wrap>
    );
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Actions for Grace Hopper' }));
    await userEvent.click(await within(document.body).findByRole('menuitem', { name: 'Edit' }));
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Edit Grace Hopper'));
    // The action is not a click on the card.
    await expect(args.onRowClick).not.toHaveBeenCalled();
    // A click on the card itself is.
    await userEvent.click(within(cards(canvas)[2]!).getByText('Maintainer'));
    await expect(args.onRowClick).toHaveBeenCalledWith(rows[2]);
  },
};

/** "Sort by" lists the sortable columns, both ways; the cards follow, and "Default order" undoes it. */
export const CardsSort: Story = {
  tags: ['!autodocs'],
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <DataTable
        aria-label="Users"
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        mobileLayout="cards"
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const sort = canvas.getByRole('combobox', { name: 'Sort by' });
    const options = within(sort)
      .getAllByRole('option')
      .map((o) => o.textContent);
    await expect(options).toEqual([
      'Default order',
      'User, ascending',
      'User, descending',
      'Role, ascending',
      'Role, descending',
    ]);
    const names = () => cards(canvas).map(titleOf);
    const byName = [...rows].map((r) => r.name).sort();
    await userEvent.selectOptions(sort, 'name:desc');
    await expect(names()).toEqual([...byName].reverse());
    await userEvent.selectOptions(sort, 'name:asc');
    await expect(names()).toEqual(byName);
    await userEvent.selectOptions(sort, 'role:asc');
    await expect(names()[0]).toBe('Grace Hopper');
    await userEvent.selectOptions(sort, '');
    await expect(names()).toEqual(rows.map((r) => r.name));
  },
};

/** Loading keeps the cards' place, with a status for screen readers; an empty table says so. */
export const CardsLoadingAndEmpty: Story = {
  tags: ['!autodocs'],
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <div className="flex flex-col gap-4">
        <DataTable
          aria-label="Loading"
          rows={[]}
          columns={columns}
          rowKey={(r) => r.id}
          mobileLayout="cards"
          loading
          loadingRows={2}
        />
        <DataTable
          aria-label="Empty"
          rows={[]}
          columns={columns}
          rowKey={(r) => r.id}
          mobileLayout="cards"
          emptyTitle="No users"
        />
        <DataTable
          aria-label="Failed"
          rows={[]}
          columns={columns}
          rowKey={(r) => r.id}
          mobileLayout="cards"
          error="Could not load the users"
        />
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(
      canvas.getAllByRole('status').filter((s) => s.textContent === 'Loading…')
    ).toHaveLength(1);
    // Each table also holds its own state, hidden below `sm`.
    await expect(canvas.getAllByText('No users').filter((e) => e.offsetParent)).toHaveLength(1);
    await expect(
      canvas.getAllByText('Could not load the users').filter((e) => e.offsetParent)
    ).toHaveLength(1);
  },
};

/** From `sm` up, `cards` is the table: nothing of the cards shows. */
export const CardsOnADesktopIsTheTable: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'laptop', isRotated: false } },
  render: () => (
    <Wrap>
      <DataTable
        aria-label="Users"
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        mobileLayout="cards"
        selectable
        columnsMenu
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('table', { name: 'Users' })).toBeVisible();
    await expect(canvas.getAllByRole('row')).toHaveLength(rows.length + 1);
    await expect(canvas.queryByRole('list')).toBeNull();
    await expect(canvas.queryByRole('combobox', { name: 'Sort by' })).toBeNull();
    await expect(canvas.getAllByRole('button', { name: 'Columns' })).toHaveLength(1);
  },
};

/** The default `scroll` layout is the table at every width. */
export const ScrollIsTheDefault: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <DataTable aria-label="Users" rows={rows} columns={columns} rowKey={(r) => r.id} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('table', { name: 'Users' })).toBeVisible();
    await expect(canvas.queryByRole('list')).toBeNull();
    await expect(canvas.queryByRole('combobox', { name: 'Sort by' })).toBeNull();
  },
};

const userDetail = (r: User) => (
  <div className="flex flex-col gap-3">
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
      <div>
        <dt className="text-xs text-[var(--color-text-muted)]">Email</dt>
        <dd className="break-all">{r.email}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-muted)]">Last seen</dt>
        <dd>{r.lastSeen}</dd>
      </div>
    </dl>
    <p>
      {r.name} joined the {r.team} team as {r.role}.
    </p>
  </div>
);

/**
 * With `renderExpandedRow`, a card gets a chevron button on its title line, before the checkbox:
 * the detail opens inside the card, under its fields. Editing (`edit`) is not offered in cards.
 */
export const ExpandableCards: Story = {
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <DataTable
        aria-label="Users"
        rows={rows.slice(0, 4)}
        columns={columns}
        rowKey={(r) => r.id}
        mobileLayout="cards"
        selectable
        renderRowAction={rowAction()}
        renderExpandedRow={userDetail}
        defaultExpandedRows={new Set(['user-2'])}
      />
    </Wrap>
  ),
};

export const CardChevronExpandsAndCollapses: Story = {
  ...ExpandableCards,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const list = canvas.getByRole('list', { name: 'Users' });
    const card = (id: string) => cards(within(list))[Number(id) - 1];
    const chevron = (id: string, open: boolean) =>
      within(card(id)).getByRole('button', {
        name: `${open ? 'Hide' : 'Show'} details for user-${id}`,
      });
    // The chevron is on the title line, before the checkbox, and a 44px target.
    const first = chevron('1', false);
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await expect(first.getBoundingClientRect().height).toBe(44);
    await expect(
      first.compareDocumentPosition(
        within(card('1')).getByRole('checkbox', { name: 'Select row user-1' })
      ) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    await expect(within(card('1')).queryByText(/joined the/)).toBeNull();
    await userEvent.click(first);
    const open = chevron('1', true);
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    // The detail is inside the card, below its fields, and what the chevron controls.
    const detailBox = document.getElementById(open.getAttribute('aria-controls')!)!;
    await expect(card('1').contains(detailBox)).toBe(true);
    await expect(within(detailBox).getByText(/joined the Core team/)).toBeVisible();
    await expect(detailBox.getBoundingClientRect().top).toBeGreaterThan(
      within(card('1')).getByText('Squad').getBoundingClientRect().bottom
    );
    expectNoHorizontalOverflow();
    // The keyboard does the same, and the toggle does not select the card.
    chevron('1', true).focus();
    await userEvent.keyboard('{Enter}');
    await expect(chevron('1', false)).toHaveAttribute('aria-expanded', 'false');
    await expect(within(card('1')).queryByText(/joined the/)).toBeNull();
    await expect(
      within(card('1')).getByRole('checkbox', { name: 'Select row user-1' })
    ).not.toBeChecked();
  },
};
