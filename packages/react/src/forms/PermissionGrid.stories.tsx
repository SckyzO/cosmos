import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { InEachDensity, expectDensitySteps } from '../storybook-density';
import {
  bothDirections,
  directionBox,
  endEdge,
  expectMirrored,
  expectNoHorizontalOverflow,
  inDirection,
  keyToEnd,
  keyToStart,
  mobileViewport,
  scrollAlong,
  startEdge,
  startOffset,
} from '../storybook-helpers';
import {
  PermissionGrid,
  cellKey,
  type PermissionGridColumn,
  type PermissionGridGroup,
  type PermissionGridLabels,
} from './PermissionGrid';

// ── Data ─────────────────────────────────────────────────────────────────────

// The editor of one role: what it may do (columns) on each permission (rows), by area. Some
// permissions do not make sense for every action: payments are created, never edited.
const ACTIONS: PermissionGridColumn[] = [
  { id: 'view', label: 'View' },
  { id: 'create', label: 'Create' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' },
];

const AREAS: PermissionGridGroup[] = [
  {
    id: 'billing',
    label: 'Billing',
    rows: [
      { id: 'invoices', label: 'Invoices' },
      { id: 'payments', label: 'Payments', columns: ['view', 'create'] },
      { id: 'refunds', label: 'Refunds', columns: ['view', 'create'] },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    rows: [
      { id: 'records', label: 'Customer records' },
      { id: 'notes', label: 'Notes' },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    rows: [
      { id: 'members', label: 'Team members' },
      { id: 'audit', label: 'Audit log', columns: ['view'] },
    ],
  },
];

const EDITOR_VALUE = [
  ...ACTIONS.map((action) => cellKey('invoices', action.id)),
  cellKey('payments', 'view'),
  cellKey('records', 'view'),
  cellKey('records', 'edit'),
  cellKey('audit', 'view'),
];

// The matrix of roles: the same permissions read the other way round. Admin is built in, so its
// column is read-only and shows what it holds.
const ROLES: PermissionGridColumn[] = [
  { id: 'admin', label: 'Admin', readOnly: true },
  { id: 'manager', label: 'Manager' },
  { id: 'editor', label: 'Editor' },
  { id: 'viewer', label: 'Viewer' },
  { id: 'billing', label: 'Billing' },
];

const PERMISSIONS: PermissionGridGroup[] = [
  {
    id: 'invoicing',
    label: 'Invoicing',
    rows: [
      { id: 'invoices.view', label: 'View invoices' },
      { id: 'invoices.create', label: 'Create invoices', columns: ['admin', 'manager', 'billing'] },
      { id: 'invoices.edit', label: 'Edit invoices', columns: ['admin', 'manager', 'billing'] },
      { id: 'invoices.delete', label: 'Delete invoices', columns: ['admin', 'manager'] },
      { id: 'refunds.issue', label: 'Issue refunds', columns: ['admin', 'manager', 'billing'] },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    rows: [
      { id: 'customers.view', label: 'View customers' },
      { id: 'customers.edit', label: 'Edit customers', columns: ['admin', 'manager', 'editor'] },
      { id: 'customers.export', label: 'Export customers', columns: ['admin', 'manager'] },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    rows: [
      { id: 'members.manage', label: 'Manage members', columns: ['admin', 'manager'] },
      { id: 'audit.view', label: 'View audit log', columns: ['admin', 'manager'] },
      { id: 'plan.change', label: 'Change plan', columns: ['admin', 'billing'] },
    ],
  },
];

// Admin holds every permission that applies to it, as the host's data says.
const ADMIN_KEYS = PERMISSIONS.flatMap((group) =>
  group.rows
    .filter((row) => row.columns?.includes('admin') ?? true)
    .map((row) => cellKey(row.id, 'admin'))
);
const MATRIX_VALUE = [
  ...ADMIN_KEYS,
  cellKey('invoices.view', 'editor'),
  cellKey('invoices.view', 'viewer'),
  cellKey('customers.view', 'viewer'),
];

const FRENCH: Partial<PermissionGridLabels> = {
  rowHeader: 'Permission',
  selectAll: 'Tout sélectionner',
  selectAllFor: (label) => `Tout sélectionner pour ${label}`,
  readOnlyCell: (cell, granted) =>
    `${cell} : ${granted ? 'accordée' : 'non accordée'}, lecture seule`,
  notApplicable: (cell) => `${cell} : sans objet`,
  readOnlyColumn: 'Lecture seule',
  summary: (granted, total) => `${granted} sur ${total} permissions accordées`,
};

// ── Stories ──────────────────────────────────────────────────────────────────

const meta = {
  title: 'Forms/Permission Grid',
  component: PermissionGrid,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    groups: AREAS,
    columns: ACTIONS,
    ariaLabel: 'Permissions of the Support agent role',
    defaultValue: EDITOR_VALUE,
  },
} satisfies Meta<typeof PermissionGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The editor of a role: permissions grouped by area, the actions across the top. The box of a row,
 * a column, a group and the corner grant all of what they cover, and show a dash when only some
 * of it is granted. "Payments" cannot be edited, so that cell is empty and counts for nothing.
 */
export const RoleEditor: Story = {};

/**
 * The matrix of roles against permissions. Admin is built in: its column is read-only, shown as
 * icons with a lock in the header, and no box of the grid touches it. `maxHeight` keeps the header
 * row in view while the rows scroll.
 */
export const RoleMatrix: Story = {
  args: {
    groups: PERMISSIONS,
    columns: ROLES,
    ariaLabel: 'Permissions by role',
    defaultValue: MATRIX_VALUE,
    maxHeight: 440,
  },
};

/** The whole grid read-only, for a role someone may look at but not change. */
export const ReadOnly: Story = { args: { readOnly: true } };

/**
 * The value is the list of granted cells, `cellKey(rowId, columnId)`: the host owns it with
 * `value` and `onChange`.
 */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState([cellKey('invoices', 'view'), cellKey('invoices', 'edit')]);
    return (
      <div className="space-y-3">
        <PermissionGrid {...args} value={value} onChange={setValue} />
        <p className="m-0 text-xs break-all text-[var(--color-text-secondary)]">
          Granted: <code>{value.join(', ') || 'nothing'}</code>
        </p>
      </div>
    );
  },
};

/** `error` is written under the grid, outlines it, and is read with it. */
export const WithError: Story = {
  args: { defaultValue: [], error: 'Grant at least one permission' },
};

/** `labels` replaces every text the grid writes, here in French. */
export const Translated: Story = {
  args: {
    groups: PERMISSIONS,
    columns: ROLES,
    ariaLabel: 'Permissions par rôle',
    defaultValue: MATRIX_VALUE,
    labels: FRENCH,
    maxHeight: 360,
  },
};

/**
 * At 375px the grid scrolls inside its own frame, the page does not. The header row and the
 * first column stay in view, so a cell is always read with its permission and its action.
 */
export const RoleEditorMobile: Story = { globals: mobileViewport };

export const RoleMatrixMobile: Story = {
  ...RoleMatrix,
  args: { ...RoleMatrix.args, maxHeight: 360 },
  globals: mobileViewport,
};

// ── Tests ────────────────────────────────────────────────────────────────────

const box = (scope: ReturnType<typeof within>, name: string) =>
  scope.getByRole('checkbox', { name });

const stops = (root: HTMLElement) => root.querySelectorAll('[data-grid-row][tabindex="0"]');

const status = (canvasElement: HTMLElement) => canvasElement.querySelector('[role="status"]')!;

// The value `onChange` was last called with.
const lastValue = (onChange: unknown) =>
  (onChange as ReturnType<typeof fn>).mock.lastCall![0] as string[];

const expectUnchecked = async (element: HTMLElement) => {
  await expect(element).not.toBeChecked();
  await expect(element).not.toBePartiallyChecked();
};

/** Every cell is a box named by its permission and its column, in that order. */
export const CellsAreNamedByRowAndColumn: Story = {
  ...RoleMatrix,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(box(canvas, 'Edit invoices, Manager')).toBeVisible();
    await expect(box(canvas, 'View customers, Viewer')).toBeChecked();
    await expectUnchecked(box(canvas, 'Edit invoices, Billing'));
  },
};

/** `labels.cell` renames the boxes, and every other text follows `labels` too. */
export const LabelsReplaceTheTexts: Story = {
  ...Translated,
  args: { ...Translated.args, onChange: fn() },
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('columnheader', { name: /Permission/ })).toBeVisible();
    await expect(
      canvas.getByText('Edit invoices, Admin : accordée, lecture seule')
    ).toBeInTheDocument();
    await expect(canvas.getByText('Delete invoices, Viewer : sans objet')).toBeInTheDocument();
    await expect(canvas.getByRole('columnheader', { name: /Admin.*Lecture seule/ })).toBeVisible();
    await userEvent.click(box(canvas, 'Tout sélectionner pour Manager'));
    await waitFor(() =>
      expect(status(canvasElement)).toHaveTextContent('13 sur 21 permissions accordées')
    );
  },
};

/** The box of a row, a column, a group and the corner follow the cells they cover. */
export const TriStatesFollowTheCells: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    // Invoices holds all four actions, Payments one of two, Refunds none.
    await expect(box(canvas, 'Select all for Invoices')).toBeChecked();
    await expect(box(canvas, 'Select all for Payments')).toBePartiallyChecked();
    await expectUnchecked(box(canvas, 'Select all for Refunds'));
    // Billing: 5 of its 8 cells. Workspace: only the audit log.
    await expect(box(canvas, 'Select all for Billing')).toBePartiallyChecked();
    await expect(box(canvas, 'Select all for Workspace')).toBePartiallyChecked();
    // Columns: View is granted on some rows, Delete on one, and no column holds them all.
    await expect(box(canvas, 'Select all for View')).toBePartiallyChecked();
    await expect(box(canvas, 'Select all for Delete')).toBePartiallyChecked();
    await expect(box(canvas, 'Select all')).toBePartiallyChecked();

    // One cell moves its row, its group, its column and the corner.
    await userEvent.click(box(canvas, 'Refunds, View'));
    await expect(box(canvas, 'Select all for Refunds')).toBePartiallyChecked();
    await userEvent.click(box(canvas, 'Refunds, Create'));
    await expect(box(canvas, 'Select all for Refunds')).toBeChecked();
    await userEvent.click(box(canvas, 'Refunds, View'));
    await userEvent.click(box(canvas, 'Refunds, Create'));
    await expectUnchecked(box(canvas, 'Select all for Refunds'));
  },
};

/** A box that is all granted, a group and the corner included, shows as checked, and empties again. */
export const EveryBoxReachesCheckedAndUnchecked: Story = {
  args: { defaultValue: [] },
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expectUnchecked(box(canvas, 'Select all'));
    await userEvent.click(box(canvas, 'Select all'));
    for (const name of [
      'Select all',
      'Select all for Billing',
      'Select all for Customers',
      'Select all for Workspace',
      'Select all for View',
      'Select all for Create',
      'Select all for Edit',
      'Select all for Delete',
      'Select all for Invoices',
      'Select all for Audit log',
    ]) {
      await expect(box(canvas, name), name).toBeChecked();
    }
    await userEvent.click(box(canvas, 'Select all'));
    for (const name of ['Select all', 'Select all for Billing', 'Select all for Edit']) {
      await expectUnchecked(box(canvas, name));
    }
  },
};

/** A click on a mixed box grants everything it covers; the next click clears. */
export const MixedBoxSelectsAllThenClears: Story = {
  args: { onChange: fn() },
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, args }) => {
    const payments = box(canvas, 'Select all for Payments');
    await expect(payments).toBePartiallyChecked();

    await userEvent.click(payments);
    await expect(payments).toBeChecked();
    await expect(box(canvas, 'Payments, View')).toBeChecked();
    await expect(box(canvas, 'Payments, Create')).toBeChecked();
    await expect(args.onChange).toHaveBeenLastCalledWith(
      expect.arrayContaining([cellKey('payments', 'view'), cellKey('payments', 'create')])
    );

    await userEvent.click(payments);
    await expectUnchecked(payments);
    await expectUnchecked(box(canvas, 'Payments, View'));
    await expectUnchecked(box(canvas, 'Payments, Create'));
    const last = lastValue(args.onChange);
    await expect(last).not.toContain(cellKey('payments', 'view'));
    // What the Payments box does not own stays: Invoices is still all granted.
    await expect(last).toContain(cellKey('invoices', 'delete'));
  },
};

/**
 * A cell that does not apply has no box and is no one's to grant: no box covers it and no count
 * includes it.
 */
export const NotApplicableCellsAreLeftOut: Story = {
  args: { defaultValue: [], onChange: fn() },
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText('Payments, Delete: not applicable')).toBeInTheDocument();
    await expect(canvas.queryByRole('checkbox', { name: 'Payments, Delete' })).toBeNull();
    // The Delete column covers four rows, not seven.
    await userEvent.click(box(canvas, 'Select all for Delete'));
    await expect(args.onChange).toHaveBeenLastCalledWith([
      cellKey('invoices', 'delete'),
      cellKey('records', 'delete'),
      cellKey('notes', 'delete'),
      cellKey('members', 'delete'),
    ]);
    // The row of the audit log has one box to select: its view.
    await userEvent.click(box(canvas, 'Select all for Audit log'));
    await expect(args.onChange).toHaveBeenLastCalledWith(
      expect.arrayContaining([cellKey('audit', 'view')])
    );
    await expect(box(canvas, 'Audit log, View')).toBeChecked();
  },
};

/** A read-only column draws what is granted, not a box, and the boxes around it leave it alone. */
export const ReadOnlyColumnShowsIconsNotBoxes: Story = {
  ...RoleMatrix,
  args: { ...RoleMatrix.args, onChange: fn() },
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, args }) => {
    await expect(canvas.queryByRole('checkbox', { name: /, Admin$/ })).toBeNull();
    await expect(canvas.queryByRole('checkbox', { name: 'Select all for Admin' })).toBeNull();
    await expect(canvas.getByText('Edit invoices, Admin: granted, read-only')).toBeInTheDocument();
    await expect(canvas.getByText('View customers, Admin: granted, read-only')).toBeInTheDocument();
    // The header says it in words too, next to the lock.
    await expect(canvas.getByRole('columnheader', { name: /Admin.*Read-only/ })).toBeVisible();

    // Clear and fill the grid: the admin grants stay as the host gave them.
    await userEvent.click(box(canvas, 'Select all'));
    await userEvent.click(box(canvas, 'Select all'));
    const value = lastValue(args.onChange);
    await expect(value.filter((key) => key.endsWith(':admin'))).toHaveLength(ADMIN_KEYS.length);
    await expect(value).toHaveLength(ADMIN_KEYS.length);
  },
};

/** A read-only grid has no box at all, only icons and their text. */
export const ReadOnlyGridHasNoBoxes: Story = {
  ...ReadOnly,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.queryAllByRole('checkbox')).toHaveLength(0);
    await expect(canvas.getByText('Invoices, Edit: granted, read-only')).toBeInTheDocument();
    await expect(canvas.getByText('Refunds, Edit: not applicable')).toBeInTheDocument();
    await expect(canvas.getByText('Notes, Delete: not granted, read-only')).toBeInTheDocument();
    // Still a grid, still one tab stop, and its cells are reached with the arrows.
    await expect(canvas.getByRole('grid')).toBeVisible();
    await userEvent.tab();
    await expect(document.activeElement).toHaveTextContent('Permission');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect(document.activeElement).toHaveTextContent('Invoices');
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(document.activeElement).toHaveTextContent('Invoices, View: granted, read-only');
  },
};

/**
 * After a box that grants several cells, a polite status says how many permissions are granted,
 * out of those the user can change. A single cell says nothing.
 */
export const StatusAnnouncesAfterABulkBoxOnly: Story = {
  ...RoleMatrix,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const live = status(canvasElement);
    await expect(live).toHaveAttribute('role', 'status');
    await expect(live).toBeEmptyDOMElement();

    // The admin grants and the cells that do not apply are out of both numbers: 21 can be changed.
    await userEvent.click(box(canvas, 'Select all for Manager'));
    await waitFor(() => expect(live).toHaveTextContent('13 of 21 permissions granted'));

    // A single box clears the message and says nothing.
    await userEvent.click(box(canvas, 'Edit invoices, Billing'));
    await expect(live).toBeEmptyDOMElement();

    await userEvent.click(box(canvas, 'Select all'));
    await waitFor(() => expect(live).toHaveTextContent('21 of 21 permissions granted'));
    await userEvent.click(box(canvas, 'Select all'));
    await waitFor(() => expect(live).toHaveTextContent('0 of 21 permissions granted'));
  },
};

/** One Tab stop, then arrows, Home, End, Ctrl+Home, Ctrl+End; Space toggles the box in focus. */
export const KeyboardModel: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    await expect(stops(canvasElement)).toHaveLength(1);

    await userEvent.tab();
    await expect(box(canvas, 'Select all')).toHaveFocus();

    // Along the header row, then down: the group row has one cell, the focus lands on it.
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(box(canvas, 'Select all for View')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(box(canvas, 'Select all for Billing')).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(box(canvas, 'Select all for Billing')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(box(canvas, 'Select all for Invoices')).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(box(canvas, 'Invoices, View')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(box(canvas, 'Payments, View')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(box(canvas, 'Invoices, View')).toHaveFocus();
    await userEvent.keyboard(`{${keyToStart()}}{${keyToStart()}}`);
    await expect(box(canvas, 'Select all for Invoices')).toHaveFocus();

    // Home and End go to the ends of the row. The last cell of Payments does not apply: the cell
    // itself takes the focus, and says so.
    await userEvent.keyboard('{ArrowDown}');
    await expect(box(canvas, 'Select all for Payments')).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(document.activeElement).toHaveTextContent('Payments, Delete: not applicable');
    await userEvent.keyboard('{Home}');
    await expect(box(canvas, 'Select all for Payments')).toHaveFocus();

    // The ends of the grid.
    await userEvent.keyboard('{Control>}{End}{/Control}');
    await expect(document.activeElement).toHaveTextContent('Audit log, Delete: not applicable');
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toHaveTextContent('Audit log, Delete: not applicable');
    await userEvent.keyboard('{Control>}{Home}{/Control}');
    await expect(box(canvas, 'Select all')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(box(canvas, 'Select all')).toHaveFocus();

    // Space toggles the box in focus.
    const cell = box(canvas, 'Invoices, Create');
    cell.focus();
    await expect(cell).toBeChecked();
    await userEvent.keyboard(' ');
    await expectUnchecked(cell);
    await userEvent.keyboard(' ');
    await expect(cell).toBeChecked();

    // The tab stop moved with the focus: still one, and Tab leaves the grid.
    await expect(stops(canvasElement)).toHaveLength(1);
    await expect(stops(canvasElement)[0]).toBe(cell);
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
    // Coming back lands on the cell the grid remembered.
    await userEvent.tab({ shift: true });
    await expect(cell).toHaveFocus();
  },
};

/** Left and Right follow the reading direction, whichever way the page was set. */
export const ArrowsFollowTheDirectionOfThePage: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      await inDirection(dir, async () => {
        const first = box(canvas, 'Invoices, View');
        const second = box(canvas, 'Invoices, Create');
        first.focus();
        // ArrowRight goes to Create in left to right, and back before View in right to left.
        await userEvent.keyboard('{ArrowRight}');
        await expect(dir === 'ltr' ? second : box(canvas, 'Select all for Invoices')).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}');
        await expect(first).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}');
        await expect(dir === 'ltr' ? box(canvas, 'Select all for Invoices') : second).toHaveFocus();
      });
    }
  },
};

/** The error is the description of the grid, so it is read with it. */
export const ErrorIsTheDescriptionOfTheGrid: Story = {
  ...WithError,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const grid = canvas.getByRole('grid', { name: 'Permissions of the Support agent role' });
    await expect(grid).toHaveAccessibleDescription('Grant at least one permission');
    await expect(canvas.getByText('Grant at least one permission')).toBeVisible();
  },
};

export const NoErrorNoDescription: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('grid')).not.toHaveAttribute('aria-describedby');
  },
};

/** The whole cell takes the click, not only the 18px box: a pixel in its corner reaches the box. */
export const WholeCellIsTheClickTarget: Story = {
  args: { defaultValue: [], onChange: fn() },
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const input = box(canvas, 'Invoices, Edit');
    const cell = input.closest('td')!;
    const rect = cell.getBoundingClientRect();
    await expect(rect.width).toBeGreaterThanOrEqual(24);
    await expect(rect.height).toBeGreaterThanOrEqual(24);
    for (const [x, y] of [
      [rect.left + 3, rect.top + 3],
      [rect.right - 3, rect.bottom - 3],
    ] as const) {
      const hit = document.elementFromPoint(x, y);
      await expect(hit?.closest('label')?.contains(input)).toBe(true);
    }
    await userEvent.click(document.elementFromPoint(rect.left + 3, rect.top + 3)!);
    await expect(input).toBeChecked();
    // The header and the first column are covered the same way.
    const header = box(canvas, 'Select all for Edit').closest('th')!.getBoundingClientRect();
    const hitHeader = document.elementFromPoint(header.left + 3, header.top + 3);
    await expect(hitHeader?.closest('label')?.contains(box(canvas, 'Select all for Edit'))).toBe(
      true
    );
  },
};

/** Controlled: the host decides. A change it does not apply leaves the grid as it was. */
export const ControlledHostDecides: Story = {
  args: { value: [cellKey('invoices', 'view')], onChange: fn() },
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, args }) => {
    await userEvent.click(box(canvas, 'Invoices, Edit'));
    await expect(args.onChange).toHaveBeenLastCalledWith([
      cellKey('invoices', 'view'),
      cellKey('invoices', 'edit'),
    ]);
    await expectUnchecked(box(canvas, 'Invoices, Edit'));
    await expect(box(canvas, 'Invoices, View')).toBeChecked();
  },
};

/** The same, with a host that keeps the value. */
export const ControlledHostKeepsTheValue: Story = {
  ...Controlled,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await userEvent.click(box(canvas, 'Select all for Invoices'));
    await expect(box(canvas, 'Invoices, Delete')).toBeChecked();
    await expect(canvas.getByText(/invoices:delete/)).toBeVisible();
  },
};

/** Uncontrolled: `defaultValue` is only the start, and `onChange` still fires. */
export const UncontrolledKeepsItsOwnValue: Story = {
  args: { onChange: fn() },
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, args }) => {
    await userEvent.click(box(canvas, 'Notes, Delete'));
    await expect(box(canvas, 'Notes, Delete')).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledOnce();
    await expect(lastValue(args.onChange)).toContain(cellKey('notes', 'delete'));
  },
};

/** The rows follow the page's `data-density`. */
export const RowsFollowPageDensity: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <InEachDensity>
      <PermissionGrid {...args} />
    </InEachDensity>
  ),
  play: async ({ canvas }) => {
    // The first rowheader is the Billing group's.
    await expectDensitySteps(canvas, (scope) => scope.getAllByRole('rowheader')[1]!);
  },
};

// ── Narrow screens ───────────────────────────────────────────────────────────

const frameOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector('table')!.parentElement as HTMLElement;

/** At the mobile width the page does not scroll sideways: the grid does, in its own frame. */
export const RoleEditorMobileChecks: Story = {
  ...RoleEditorMobile,
  tags: ['!dev', '!autodocs'],
  play: ({ canvasElement }) => {
    expectNoHorizontalOverflow();
    const frame = frameOf(canvasElement);
    expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth);
  },
};

export const RoleMatrixMobileChecks: Story = {
  ...RoleMatrixMobile,
  tags: ['!dev', '!autodocs'],
  play: ({ canvasElement }) => {
    expectNoHorizontalOverflow();
    const frame = frameOf(canvasElement);
    expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth);
    expect(frame.scrollHeight).toBeGreaterThan(frame.clientHeight);
  },
};

/** Scrolled down and along, the header row and the first column are still where they were. */
export const PinnedPartsStayInView: Story = {
  ...RoleMatrixMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const frame = frameOf(canvasElement);
    const corner = canvas.getByRole('columnheader', { name: /Permission/ });
    const header = canvas.getByRole('columnheader', { name: /Billing/ });
    const firstRow = canvas.getByRole('rowheader', { name: /View invoices/ });
    const lastRow = canvas.getByRole('rowheader', { name: /Change plan/ });
    const box0 = frame.getBoundingClientRect();
    const rowStart = startOffset(firstRow, frame);

    frame.scrollTop = frame.scrollHeight;
    scrollAlong(frame, frame.scrollWidth);
    await waitFor(() => expect(frame.scrollTop).toBeGreaterThan(0));
    await waitFor(() => expect(Math.abs(frame.scrollLeft)).toBeGreaterThan(0));

    // The header row sits on the top edge of the frame, the rows having gone under it.
    await expect(header.getBoundingClientRect().top).toBeCloseTo(box0.top, 0);
    await expect(corner.getBoundingClientRect().top).toBeCloseTo(box0.top, 0);
    // The first column sits on the start edge, whether the row is the first or the last.
    await expect(startOffset(firstRow, frame)).toBeCloseTo(rowStart, 0);
    await expect(startOffset(lastRow, frame)).toBeCloseTo(rowStart, 0);
    await expect(startOffset(corner, frame)).toBeCloseTo(rowStart, 0);
    // The last row came into the frame.
    await expect(lastRow.getBoundingClientRect().bottom).toBeLessThanOrEqual(box0.bottom + 1);
    await expect(lastRow.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      header.getBoundingClientRect().bottom - 1
    );
  },
};

/** Moving by keyboard to a far cell scrolls it clear of the pinned header and column. */
export const FocusedCellNeverHidesUnderPinnedParts: Story = {
  ...RoleMatrixMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const frame = frameOf(canvasElement);
    const corner = canvas.getByRole('columnheader', { name: /Permission/ });
    const header = canvas.getByRole('columnheader', { name: /Billing/ });
    const rowHeader = canvas.getByRole('rowheader', { name: /View invoices/ });
    box(canvas, 'Select all').focus();

    await userEvent.keyboard('{Control>}{End}{/Control}');
    const last = box(canvas, 'Change plan, Billing');
    await expect(last).toHaveFocus();
    await waitFor(() => expect(frame.scrollTop).toBeGreaterThan(0));
    const cell = last.closest('td')!.getBoundingClientRect();
    const pinnedHeader = Math.max(
      corner.getBoundingClientRect().bottom,
      header.getBoundingClientRect().bottom
    );
    await expect(cell.top).toBeGreaterThanOrEqual(pinnedHeader - 1);
    await expect(startEdge(cell)).toBeGreaterThanOrEqual(
      endEdge(rowHeader.getBoundingClientRect()) - 1
    );

    // Back at the corner, which is pinned and never scrolls out, then toward what scrolled away:
    // the first group header, above the rows in view, and the first column, before the cells in
    // view. Each comes to rest clear of the pinned header and column, not under them.
    await userEvent.keyboard('{Control>}{Home}{/Control}');
    await expect(box(canvas, 'Select all')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    const group = box(canvas, 'Select all for Invoicing');
    await expect(group).toHaveFocus();
    await waitFor(() =>
      expect(group.closest('th')!.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        corner.getBoundingClientRect().bottom - 1
      )
    );
    await expect(frame.scrollTop).toBe(0);

    await userEvent.keyboard('{Control>}{Home}{/Control}');
    await userEvent.keyboard(`{${keyToEnd()}}`);
    const admin = canvas.getByRole('columnheader', { name: /Admin/ });
    await expect(admin).toHaveFocus();
    await waitFor(() =>
      expect(startEdge(admin.getBoundingClientRect())).toBeGreaterThanOrEqual(
        endEdge(corner.getBoundingClientRect()) - 1
      )
    );
  },
};

/** The first column sits at the start and stays there, the other way round in right to left. */
export const FirstColumnSticksAtTheStart: Story = {
  ...RoleMatrix,
  args: { ...RoleMatrix.args, maxHeight: 300 },
  tags: ['!dev', '!autodocs'],
  render: (args) =>
    bothDirections(() => (
      <div className="max-w-md">
        <PermissionGrid {...args} />
      </div>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const direction = directionBox(canvasElement, dir);
      const canvas = within(direction);
      const frame = canvas.getByRole('grid').parentElement as HTMLElement;
      await expect(frame.scrollWidth, `${dir}: the grid scrolls`).toBeGreaterThan(
        frame.clientWidth
      );
      const row = canvas.getByRole('rowheader', { name: /Edit invoices/ });
      const first = canvas.getByRole('columnheader', { name: /Admin/ });
      const last = canvas.getByRole('columnheader', { name: /Billing/ });
      await expect(startOffset(first, direction), `${dir}: Admin before Billing`).toBeLessThan(
        startOffset(last, direction)
      );
      const before = startOffset(row, frame);
      scrollAlong(frame, frame.scrollWidth);
      await waitFor(() => expect(Math.abs(frame.scrollLeft)).toBeGreaterThan(0));
      await expect(startOffset(row, frame), `${dir}: sticky column`).toBeCloseTo(before, 0);
      frame.scrollLeft = 0;
    }
    expectMirrored(canvasElement, (direction) =>
      within(direction).getByRole('rowheader', { name: /Edit invoices/ })
    );
  },
};
