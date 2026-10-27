import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { DataTable } from './DataTable';
import { editableColumns, REFUSED_HOST, useFakeSaves } from './storybook-hosts';

// Inline editing (`edit` on a column, `editTrigger`, `onCellEdit`, `onRowEdit`), in its own file
// with the other DataTable additions: DataTable.stories.tsx is already one of the largest stories
// files of the package. One visible story per trigger, with a fake save that refuses one host.
const meta = {
  title: 'Tables/DataTable inline editing',
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

// What the tests read: the calls the table made to its handlers.
const cellSaved = fn();
const rowSaved = fn();

const Hosts = ({ trigger, delay }: { trigger: 'cell' | 'button' | 'row'; delay?: number }) => {
  const { rows, onCellEdit, onRowEdit } = useFakeSaves(delay);
  return (
    <Wrap>
      <DataTable
        aria-label="Hosts"
        rows={rows}
        columns={editableColumns}
        rowKey={(r) => r.host}
        editTrigger={trigger}
        onCellEdit={(row, key, value) => {
          cellSaved(row.host, key, value);
          return onCellEdit(row, key, value);
        }}
        onRowEdit={(row, changes) => {
          rowSaved(row.host, changes);
          return onRowEdit(row, changes);
        }}
      />
    </Wrap>
  );
};

/** A click, Enter or F2 on Rack, Owner or Note opens its field in place. Enter saves, Esc cancels. */
export const ClickTheCell: Story = { render: () => <Hosts trigger="cell" /> };

/** A pencil in each editable cell, shown on the hovered or focused row. */
export const PencilPerCell: Story = { render: () => <Hosts trigger="button" /> };

/** An Edit button per row turns its editable cells into fields; Save commits them together. */
export const EditTheRow: Story = { render: () => <Hosts trigger="row" /> };

const rowOf = (canvas: ReturnType<typeof within>, host: string) =>
  canvas.getByRole('row', { name: new RegExp(host) });

// ── 'cell' ──────────────────────────────────────────────────────────────────

export const CellEnterCommits: Story = {
  // A slow save, so the test sees the cell while it waits.
  render: () => <Hosts trigger="cell" delay={600} />,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    cellSaved.mockClear();
    const row = rowOf(canvas, 'node-a01');
    await userEvent.click(within(row).getByRole('button', { name: /R-12.*edit Rack/ }));
    const field = within(row).getByRole('textbox', { name: 'Rack for node-a01' });
    await expect(field).toHaveFocus();
    await userEvent.clear(field);
    await userEvent.type(field, 'R-13{Enter}');
    await expect(cellSaved).toHaveBeenCalledTimes(1);
    await expect(cellSaved).toHaveBeenCalledWith('node-a01', 'rack', 'R-13');
    // The save is pending: the cell says so, and nothing else can open meanwhile.
    const cell = within(row)
      .getByRole('button', { name: /edit Rack/ })
      .closest('td')!;
    await expect(cell).toHaveAttribute('aria-busy', 'true');
    await expect(within(cell).getByRole('img', { name: 'Saving' })).toBeVisible();
    await waitFor(() => expect(cell).not.toHaveAttribute('aria-busy'));
    const trigger = within(row).getByRole('button', { name: /R-13.*edit Rack/ });
    await expect(trigger).toHaveFocus();
    await expect(within(row).queryByRole('textbox')).toBeNull();
  },
};

export const CellEscapeCancelsAndRestoresFocus: Story = {
  ...ClickTheCell,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    cellSaved.mockClear();
    const row = rowOf(canvas, 'node-a01');
    await userEvent.click(within(row).getByRole('button', { name: /R-12.*edit Rack/ }));
    await userEvent.keyboard('X{Escape}');
    await expect(within(row).queryByRole('textbox')).toBeNull();
    await expect(within(row).getByRole('button', { name: /R-12.*edit Rack/ })).toHaveFocus();
    await expect(cellSaved).not.toHaveBeenCalled();
  },
};

export const CellF2AndEnterOpenTheEditor: Story = {
  ...ClickTheCell,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = rowOf(canvas, 'node-a01');
    const trigger = () => within(row).getByRole('button', { name: /Platform.*edit Owner/ });
    trigger().focus();
    await userEvent.keyboard('{F2}');
    await expect(within(row).getByRole('combobox', { name: 'Owner for node-a01' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    // The editor closed and its trigger, drawn again, has the focus.
    await expect(trigger()).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(within(row).getByRole('combobox', { name: 'Owner for node-a01' })).toHaveFocus();
  },
};

export const CellBlurCommitsAndAnUnchangedDraftSavesNothing: Story = {
  ...ClickTheCell,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    cellSaved.mockClear();
    const row = rowOf(canvas, 'node-a01');
    // Opened and left as it was: no call.
    await userEvent.click(within(row).getByRole('button', { name: /R-12.*edit Rack/ }));
    await userEvent.tab();
    await expect(within(row).queryByRole('textbox')).toBeNull();
    await expect(cellSaved).not.toHaveBeenCalled();
    // Changed, then focus leaves: saved.
    await userEvent.click(within(row).getByRole('button', { name: /R-12.*edit Rack/ }));
    await userEvent.type(within(row).getByRole('textbox'), '4');
    await userEvent.click(canvas.getByRole('table'));
    await expect(cellSaved).toHaveBeenCalledTimes(1);
    await expect(cellSaved).toHaveBeenCalledWith('node-a01', 'rack', 'R-124');
  },
};

export const CellRejectedSaveKeepsTheValueAndShowsTheError: Story = {
  ...ClickTheCell,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = rowOf(canvas, REFUSED_HOST);
    await userEvent.click(within(row).getByRole('button', { name: /edit Note/ }));
    await userEvent.type(within(row).getByRole('textbox'), 'Moving to R-15{Enter}');
    const field = await within(row).findByRole('textbox', { name: `Note for ${REFUSED_HOST}` });
    await expect(field).toHaveValue('Moving to R-15');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    const error = within(row).getByRole('alert');
    await expect(error).toHaveTextContent('Not saved: the server refused the change.');
    await expect(field).toHaveAccessibleDescription(/Not saved/);
    await expect(error.id).toBe(field.getAttribute('aria-describedby'));
    // Fixing the draft and leaving with Escape drops it.
    await userEvent.keyboard('{Escape}');
    await expect(within(row).queryByRole('textbox')).toBeNull();
    await expect(within(row).getByRole('button', { name: /edit Note/ })).toHaveTextContent('—');
  },
};

export const OnlyOneCellEditsAtATime: Story = {
  ...ClickTheCell,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table');
    await userEvent.click(
      within(rowOf(canvas, 'node-a01')).getByRole('button', { name: /edit Rack/ })
    );
    await userEvent.click(
      within(rowOf(canvas, 'node-c03')).getByRole('button', { name: /edit Note/ })
    );
    await expect(within(table).getAllByRole('textbox')).toHaveLength(1);
    await expect(
      within(rowOf(canvas, 'node-c03')).getByRole('textbox', { name: 'Note for node-c03' })
    ).toBeVisible();
  },
};

// ── 'button' ────────────────────────────────────────────────────────────────

export const ButtonOpensTheEditorAndEnterCommits: Story = {
  ...PencilPerCell,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    cellSaved.mockClear();
    const row = rowOf(canvas, 'node-a01');
    const pencil = within(row).getByRole('button', { name: 'Edit Rack for node-a01' });
    await userEvent.click(pencil);
    const field = within(row).getByRole('textbox', { name: 'Rack for node-a01' });
    await expect(field).toHaveFocus();
    await userEvent.type(field, '9{Enter}');
    await expect(cellSaved).toHaveBeenCalledTimes(1);
    await expect(cellSaved).toHaveBeenCalledWith('node-a01', 'rack', 'R-129');
    await waitFor(() =>
      expect(within(row).getByRole('button', { name: 'Edit Rack for node-a01' })).toHaveFocus()
    );
  },
};

export const ButtonEscapeCancelsAndRestoresFocus: Story = {
  ...PencilPerCell,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    cellSaved.mockClear();
    const row = rowOf(canvas, 'node-a01');
    await userEvent.click(within(row).getByRole('button', { name: 'Edit Rack for node-a01' }));
    await userEvent.keyboard('X{Escape}');
    await expect(within(row).queryByRole('textbox')).toBeNull();
    await expect(within(row).getByRole('button', { name: 'Edit Rack for node-a01' })).toHaveFocus();
    await expect(cellSaved).not.toHaveBeenCalled();
  },
};

export const ButtonRejectedSaveShowsTheError: Story = {
  ...PencilPerCell,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = rowOf(canvas, REFUSED_HOST);
    await userEvent.click(
      within(row).getByRole('button', { name: `Edit Note for ${REFUSED_HOST}` })
    );
    await userEvent.type(within(row).getByRole('textbox'), 'Moving{Enter}');
    const field = await within(row).findByRole('textbox');
    await expect(field).toHaveValue('Moving');
    await expect(within(row).getByRole('alert')).toHaveTextContent('Not saved');
    await expect(field).toHaveAccessibleDescription(/Not saved/);
  },
};

export const ButtonSaveAndCancelButtons: Story = {
  ...PencilPerCell,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    cellSaved.mockClear();
    const row = rowOf(canvas, 'node-a01');
    await userEvent.click(within(row).getByRole('button', { name: 'Edit Rack for node-a01' }));
    await userEvent.type(within(row).getByRole('textbox'), '5');
    await userEvent.click(within(row).getByRole('button', { name: 'Cancel' }));
    await expect(cellSaved).not.toHaveBeenCalled();
    await userEvent.click(within(row).getByRole('button', { name: 'Edit Rack for node-a01' }));
    await userEvent.type(within(row).getByRole('textbox'), '5');
    await userEvent.click(within(row).getByRole('button', { name: 'Save' }));
    await expect(cellSaved).toHaveBeenCalledTimes(1);
    await expect(cellSaved).toHaveBeenCalledWith('node-a01', 'rack', 'R-125');
  },
};

// ── 'row' ───────────────────────────────────────────────────────────────────

export const RowSaveCallsOnRowEditOnceWithTheChanges: Story = {
  ...EditTheRow,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    rowSaved.mockClear();
    const row = rowOf(canvas, 'node-a02');
    await userEvent.click(within(row).getByRole('button', { name: 'Edit node-a02' }));
    // Every editable cell is a field; the others stay as they were.
    await expect(within(row).getByRole('textbox', { name: 'Rack for node-a02' })).toHaveFocus();
    await expect(within(row).getByRole('combobox', { name: 'Owner for node-a02' })).toBeVisible();
    await expect(within(row).getByRole('textbox', { name: 'Note for node-a02' })).toBeVisible();
    await userEvent.selectOptions(
      within(row).getByRole('combobox', { name: 'Owner for node-a02' }),
      'Storage'
    );
    await userEvent.click(within(row).getByRole('button', { name: 'Save' }));
    // Only the owner changed.
    await expect(rowSaved).toHaveBeenCalledTimes(1);
    await expect(rowSaved).toHaveBeenCalledWith('node-a02', { owner: 'Storage' });
    await waitFor(() => expect(within(row).queryByRole('textbox')).toBeNull());
    await expect(within(row).getByText('Storage')).toBeVisible();
    await expect(within(row).getByRole('button', { name: 'Edit node-a02' })).toHaveFocus();
  },
};

export const RowCancelDropsTheChanges: Story = {
  ...EditTheRow,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    rowSaved.mockClear();
    const row = rowOf(canvas, 'node-a02');
    await userEvent.click(within(row).getByRole('button', { name: 'Edit node-a02' }));
    await userEvent.type(within(row).getByRole('textbox', { name: 'Rack for node-a02' }), '!');
    await userEvent.click(within(row).getByRole('button', { name: 'Cancel' }));
    await expect(within(row).queryByRole('textbox')).toBeNull();
    await expect(within(row).getByText('R-12')).toBeVisible();
    // Escape does the same, from a field.
    await userEvent.click(within(row).getByRole('button', { name: 'Edit node-a02' }));
    await userEvent.type(
      within(row).getByRole('textbox', { name: 'Rack for node-a02' }),
      '!{Escape}'
    );
    await expect(within(row).queryByRole('textbox')).toBeNull();
    await expect(rowSaved).not.toHaveBeenCalled();
  },
};

export const RowSaveWithNoChangeCallsNothing: Story = {
  ...EditTheRow,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    rowSaved.mockClear();
    const row = rowOf(canvas, 'node-a02');
    await userEvent.click(within(row).getByRole('button', { name: 'Edit node-a02' }));
    await userEvent.click(within(row).getByRole('button', { name: 'Save' }));
    await expect(within(row).queryByRole('textbox')).toBeNull();
    await expect(rowSaved).not.toHaveBeenCalled();
  },
};

export const RowRejectedSaveKeepsTheFieldsOpenWithTheError: Story = {
  // A slow save, so the test sees the row while it waits.
  render: () => <Hosts trigger="row" delay={600} />,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = rowOf(canvas, REFUSED_HOST);
    await userEvent.click(within(row).getByRole('button', { name: `Edit ${REFUSED_HOST}` }));
    const rack = within(row).getByRole('textbox', { name: `Rack for ${REFUSED_HOST}` });
    await userEvent.clear(rack);
    await userEvent.type(rack, 'R-15');
    await userEvent.click(within(row).getByRole('button', { name: 'Save' }));
    // While it waits: the row is busy.
    await expect(row).toHaveAttribute('aria-busy', 'true');
    const error = await canvas.findByRole('alert');
    await expect(error).toHaveTextContent('Not saved: the server refused the change.');
    await expect(row).not.toHaveAttribute('aria-busy');
    // The fields are still open, with what was typed, and name the error.
    await expect(
      within(row).getByRole('textbox', { name: `Rack for ${REFUSED_HOST}` })
    ).toHaveValue('R-15');
    await expect(rack).toHaveAccessibleDescription(/Not saved/);
    await expect(within(row).getByRole('button', { name: 'Save' })).toBeEnabled();
  },
};
