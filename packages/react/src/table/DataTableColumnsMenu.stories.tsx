import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { DataTable } from './DataTable';
import {
  PEOPLE,
  patchColumns,
  peopleColumns,
  pickColumns,
  type Person,
} from './storybook-fixtures';

// The columns menu of DataTable lives in its own file, with the same `Tables/DataTable` family:
// DataTable.stories.tsx is already one of the largest stories files of the package.
const meta = {
  title: 'Tables/DataTable columns menu',
  component: DataTable,
  parameters: { ...portalDocsParams.lg(), layout: 'padded' },
  tags: ['autodocs'],
  args: { rows: [], columns: [], rowKey: () => '' },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// The shared people, with five of their columns: City starts hidden, and Name, which names the row,
// cannot be hidden.
const rows = PEOPLE;

const columns = patchColumns(
  pickColumns(peopleColumns, ['name', 'email', 'role', 'team', 'city']),
  { name: { hideable: false }, city: { defaultHidden: true } }
);

// The menu is a portal: it is queried from the body, not the canvas.
const menu = () => within(document.body).findByRole('menu', { name: 'Columns' });
type Canvas = {
  getByRole: (role: string, options?: { name: string }) => HTMLElement;
  getAllByRole: (role: string) => HTMLElement[];
};
const openMenu = async (canvas: Canvas) => {
  await userEvent.click(canvas.getByRole('button', { name: 'Columns' }));
  return menu();
};
const headers = (canvas: Canvas) =>
  canvas.getAllByRole('columnheader').map((h) => h.textContent?.trim());

/** `columnsMenu` adds the Columns button after the search field. `City` starts hidden. */
export const ColumnsMenu: Story = {
  render: () => (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      columnsMenu
      defaultSearchValue=""
      labels={{ searchPlaceholder: 'Search users…' }}
    />
  ),
};

export const ColumnsMenuChecks: Story = {
  ...ColumnsMenu,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(headers(canvas)).toEqual(['Name', 'Email', 'Role', 'Team']);
    await expect(canvas.getByRole('button', { name: 'Columns' })).toHaveAttribute(
      'aria-haspopup',
      'menu'
    );
  },
};

/** Without a search field the toolbar still shows, for the button alone. */
export const ColumnsMenuWithoutSearch: Story = {
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} columnsMenu />,
};

export const ColumnsMenuWithoutSearchChecks: Story = {
  ...ColumnsMenuWithoutSearch,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Columns' })).toBeVisible();
    await expect(canvas.queryByRole('searchbox')).toBeNull();
  },
};

/** A table without `columnsMenu` has no button and no toolbar of its own. */
export const NoColumnsMenuByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: 'Columns' })).toBeNull();
    // `defaultHidden` is a menu feature too: without the prop the table is as before.
    await expect(headers(canvas)).toEqual(['Name', 'Email', 'Role', 'Team']);
  },
};

/** The menu lists every column; `hideable: false` shows checked and disabled, `defaultHidden` unchecked. */
export const MenuStates: Story = {
  tags: ['!autodocs'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} columnsMenu />,
  // The menu open, to show its states.
  play: async ({ canvas }) => {
    await openMenu(canvas);
  },
};

export const MenuStatesChecks: Story = {
  ...MenuStates,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const panel = within(await openMenu(canvas));
    const items = panel.getAllByRole('menuitemcheckbox');
    await expect(items.map((i) => i.textContent)).toEqual([
      'Name',
      'Email',
      'Role',
      'Team',
      'City',
    ]);
    const name = panel.getByRole('menuitemcheckbox', { name: 'Name' });
    await expect(name).toHaveAttribute('aria-checked', 'true');
    await expect(name).toBeDisabled();
    await expect(panel.getByRole('menuitemcheckbox', { name: 'City' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    await expect(panel.getByRole('menuitemcheckbox', { name: 'Email' })).toBeEnabled();
  },
};

/** Unchecking an item hides the column and checking it brings it back; the menu stays open. */
export const HidingAndShowingAColumn: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} columnsMenu />,
  play: async ({ canvas }) => {
    const panel = within(await openMenu(canvas));
    const email = panel.getByRole('menuitemcheckbox', { name: 'Email' });
    await userEvent.click(email);
    await expect(email).toHaveAttribute('aria-checked', 'false');
    await expect(headers(canvas)).toEqual(['Name', 'Role', 'Team']);
    await expect(canvas.queryByText('ada.lovelace@example.com')).toBeNull();
    await expect(await menu()).toBeVisible();
    // A hidden-by-default column shows the same way.
    await userEvent.click(panel.getByRole('menuitemcheckbox', { name: 'City' }));
    await expect(headers(canvas)).toEqual(['Name', 'Role', 'Team', 'City']);
    await userEvent.click(email);
    await expect(headers(canvas)).toEqual(['Name', 'Email', 'Role', 'Team', 'City']);
    await expect(canvas.getByText('ada.lovelace@example.com')).toBeInTheDocument();
  },
};

/** Space toggles an item from the keyboard, and the menu stays open. */
export const ColumnsMenuKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} columnsMenu />,
  play: async ({ canvas }) => {
    canvas.getByRole('button', { name: 'Columns' }).focus();
    await userEvent.keyboard('{Enter}');
    // `Name` can't be hidden, so it is skipped: the first item to focus is Email.
    await waitFor(() => expect(document.activeElement).toHaveTextContent('Email'));
    await userEvent.keyboard(' ');
    await expect(headers(canvas)).toEqual(['Name', 'Role', 'Team']);
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toHaveTextContent('Role');
    await userEvent.keyboard('{Enter}');
    await expect(headers(canvas)).toEqual(['Name', 'Team']);
    await expect(await menu()).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
  },
};

const FewColumns = () => {
  const two = pickColumns(peopleColumns, ['name', 'email']);
  return <DataTable rows={rows} columns={two} rowKey={(r) => r.id} columnsMenu />;
};

/** The last shown column cannot be hidden: its item is disabled while it is the only one left. */
export const LastColumnIsProtected: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <FewColumns />,
  play: async ({ canvas }) => {
    const panel = within(await openMenu(canvas));
    const name = panel.getByRole('menuitemcheckbox', { name: 'Name' });
    const email = panel.getByRole('menuitemcheckbox', { name: 'Email' });
    await expect(name).toBeEnabled();
    await userEvent.click(email);
    await expect(headers(canvas)).toEqual(['Name']);
    await expect(name).toBeDisabled();
    await expect(name).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(name, { pointerEventsCheck: 0 });
    await expect(headers(canvas)).toEqual(['Name']);
    // Showing the other one again frees it.
    await userEvent.click(email);
    await expect(name).toBeEnabled();
  },
};

/** `hideable: false` keeps the column: checked, disabled, and a click changes nothing. */
export const NonHideableColumn: Story = {
  tags: ['!autodocs'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} columnsMenu />,
};

export const NonHideableColumnChecks: Story = {
  ...NonHideableColumn,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const panel = within(await openMenu(canvas));
    const name = panel.getByRole('menuitemcheckbox', { name: 'Name' });
    await expect(name).toBeDisabled();
    await userEvent.click(name, { pointerEventsCheck: 0 });
    await expect(headers(canvas)[0]).toBe('Name');
  },
};

/** `defaultColumnVisibility` starts the table from the host's choice; the callback gets every column. */
export const Uncontrolled: Story = {
  tags: ['!autodocs'],
  args: { onColumnVisibilityChange: fn() },
  render: (args) => (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      columnsMenu
      defaultColumnVisibility={{ role: false, city: true }}
      onColumnVisibilityChange={args.onColumnVisibilityChange}
    />
  ),
};

export const UncontrolledChecks: Story = {
  ...Uncontrolled,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas }) => {
    await expect(headers(canvas)).toEqual(['Name', 'Email', 'Team', 'City']);
    const panel = within(await openMenu(canvas));
    await userEvent.click(panel.getByRole('menuitemcheckbox', { name: 'Team' }));
    await expect(args.onColumnVisibilityChange).toHaveBeenCalledWith({
      name: true,
      email: true,
      role: false,
      team: false,
      city: true,
    });
    await expect(headers(canvas)).toEqual(['Name', 'Email', 'City']);
  },
};

const ControlledTable = ({ locked }: { locked?: boolean }) => {
  const [visibility, setVisibility] = useState<Record<string, boolean>>({ email: false });
  return (
    <>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        columnsMenu
        columnVisibility={visibility}
        onColumnVisibilityChange={(next) => {
          if (!locked) setVisibility(next);
        }}
      />
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Hidden by the host:{' '}
        <span data-testid="hidden">
          {Object.keys(visibility)
            .filter((k) => !visibility[k])
            .join(', ') || 'none'}
        </span>
      </p>
    </>
  );
};

/** The host owns the visibility: the table shows what it passes back. */
export const ControlledVisibility: Story = {
  render: () => <ControlledTable />,
};

export const ControlledVisibilityChecks: Story = {
  ...ControlledVisibility,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(headers(canvas)).toEqual(['Name', 'Role', 'Team']);
    const panel = within(await openMenu(canvas));
    await userEvent.click(panel.getByRole('menuitemcheckbox', { name: 'Role' }));
    await expect(headers(canvas)).toEqual(['Name', 'Team']);
    await expect(canvas.getByTestId('hidden')).toHaveTextContent('email, role');
    await userEvent.click(panel.getByRole('menuitemcheckbox', { name: 'Email' }));
    await expect(headers(canvas)).toEqual(['Name', 'Email', 'Team']);
  },
};

/** A controlled table whose host ignores the change keeps showing its own value. */
export const ControlledVisibilityFollowsTheHost: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ControlledTable locked />,
  play: async ({ canvas }) => {
    const panel = within(await openMenu(canvas));
    await userEvent.click(panel.getByRole('menuitemcheckbox', { name: 'Role' }));
    await expect(headers(canvas)).toEqual(['Name', 'Role', 'Team']);
    await expect(panel.getByRole('menuitemcheckbox', { name: 'Role' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  },
};

/** A hidden column is not searched; a filter set on it stays in the chip bar. */
export const HiddenColumnsLeaveTheSearch: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const searchable = columns.map((c) => ({
      ...c,
      filterValue: (r: Person) => String(r[c.key as keyof Person]),
    }));
    return (
      <DataTable
        rows={rows}
        columns={searchable}
        rowKey={(r) => r.id}
        columnsMenu
        defaultSearchValue=""
      />
    );
  },
  play: async ({ canvas }) => {
    const search = canvas.getByLabelText(/search rows/i);
    // `City` is hidden by default: Boston is not in the shown text.
    await userEvent.type(search, 'boston');
    await expect(canvas.getByText(/no results/i)).toBeInTheDocument();
    const panel = within(await openMenu(canvas));
    await userEvent.click(panel.getByRole('menuitemcheckbox', { name: 'City' }));
    await expect(canvas.getByText('Margaret Hamilton')).toBeInTheDocument();
  },
};

/** Below `sm` the button keeps its icon and its name "Columns" and drops the label and the chevron. */
const mobile: Story = {
  globals: mobileViewport,
  render: () => (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      columnsMenu
      defaultSearchValue=""
    />
  ),
};

export const MobileChecks: Story = {
  ...mobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const button = canvas.getByRole('button', { name: 'Columns' });
    await expect(button).toBeVisible();
    await expect(button.getBoundingClientRect().width).toBeLessThan(48);
    await expect(canvas.getByLabelText(/search rows/i)).toBeVisible();
    const panel = within(await openMenu(canvas));
    await expect(panel.getAllByRole('menuitemcheckbox')).toHaveLength(5);
    const rect = (await menu()).getBoundingClientRect();
    await expect(rect.left).toBeGreaterThanOrEqual(0);
    await expect(rect.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
  },
};
