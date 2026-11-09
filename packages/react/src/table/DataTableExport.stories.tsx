import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, spyOn, userEvent, waitFor, within } from 'storybook/test';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { DataTable } from './DataTable';
import { PEOPLE, patchColumns, peopleColumns, pickColumns } from './storybook-fixtures';

// The CSV export of DataTable lives in its own file, with the same `Tables/DataTable` family:
// DataTable.stories.tsx is already one of the largest stories files of the package.
const meta = {
  title: 'Tables/DataTable export',
  component: DataTable,
  parameters: { ...portalDocsParams.lg(), layout: 'padded' },
  // A feature, guide or provider page: not counted as a component (Welcome, README).
  tags: ['autodocs', 'not-a-component'],
  args: { rows: [], columns: [], rowKey: () => '' },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// The shared people, in four columns: City starts hidden, so the export leaves it out.
const rows = PEOPLE;

const columns = patchColumns(pickColumns(peopleColumns, ['name', 'role', 'team', 'city']), {
  city: { defaultHidden: true, exportValue: (r) => r.city },
});

// The check of the file's text needs a name with quotes in it, which the CSV doubles: the shared
// list with that one name changed.
const QUOTED = PEOPLE.map((p) =>
  p.name === 'Donald Knuth' ? { ...p, name: 'Donald "Don" Knuth' } : p
);

type Canvas = ReturnType<typeof within>;

// The engineers of the Core team whose name has an "o": 5 of the 12 rows, so 2 pages of 3. The
// filters come in as the table's default. A hidden column leaves the search (not the filters), so
// the search looks at what stays visible: the name.
const SEARCH = 'o';
const FILTERS = { role: new Set(['Engineer']), team: new Set(['Core']) };

// Search, sort by name (descending) and hide the Team column, as a user would.
const setUpTable = async (canvas: Canvas) => {
  await userEvent.type(canvas.getByRole('searchbox', { name: 'Search rows' }), SEARCH);
  const sort = canvas.getByRole('button', { name: /Name/ });
  await userEvent.click(sort);
  await userEvent.click(sort);
  await userEvent.click(canvas.getByRole('button', { name: 'Columns' }));
  const panel = within(await within(document.body).findByRole('menu', { name: 'Columns' }));
  await userEvent.click(panel.getByRole('menuitemcheckbox', { name: 'Team' }));
  await userEvent.keyboard('{Escape}');
};

// Stands in for the download: records the Blob handed to the object URL, the file name of the link
// that is clicked and the URL that is revoked, and starts nothing.
const interceptDownload = () => {
  const create = spyOn(URL, 'createObjectURL');
  const revoke = spyOn(URL, 'revokeObjectURL');
  const names: string[] = [];
  const click = spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    names.push(this.download);
  });
  return {
    create,
    revoke,
    names,
    restore: () => [create, revoke, click].forEach((spy) => spy.mockRestore()),
  };
};

const readBlob = async (blob: Blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  // `ignoreBOM`: keep the mark in the text, `decode` drops it by default.
  const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);
  return { type: blob.type, text };
};

/** `exportable` adds the Export button before Columns. `City` starts hidden, so it is not exported. */
export const Export: Story = {
  render: () => (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      pageSize={5}
      exportable
      exportFileName="team.csv"
      columnsMenu
      defaultSearchValue=""
      labels={{ searchPlaceholder: 'Search users…' }}
    />
  ),
};

export const ExportChecks: Story = {
  ...Export,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const buttons = canvas.getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    await expect(buttons.indexOf('Export')).toBeGreaterThan(-1);
    await expect(buttons.indexOf('Export')).toBeLessThan(buttons.indexOf('Columns'));
  },
};

/** Without a search field the toolbar still shows, for the button alone. */
export const ExportWithoutSearch: Story = {
  tags: ['!autodocs'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} exportable />,
};

export const ExportWithoutSearchChecks: Story = {
  ...ExportWithoutSearch,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Export' })).toBeVisible();
    await expect(canvas.queryByRole('searchbox')).toBeNull();
  },
};

/** A table without `exportable` has no button. */
export const NoExportByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: 'Export' })).toBeNull();
  },
};

/**
 * The file holds every page of what search, filters and sort keep, in the visible columns and
 * their order, with a byte order mark; the selection and action columns stay out.
 */
export const ExportFollowsSearchFiltersSortAndColumns: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <DataTable
      rows={QUOTED}
      columns={columns}
      rowKey={(r) => r.id}
      pageSize={3}
      selectable
      renderRowAction={() => <span>⋮</span>}
      exportable
      exportFileName="engineers.csv"
      columnsMenu
      defaultSearchValue=""
      defaultFilters={FILTERS}
    />
  ),
  play: async ({ canvas }) => {
    await setUpTable(canvas);
    // 5 rows kept, 3 on the page.
    await expect(canvas.getAllByRole('row')).toHaveLength(1 + 3);
    const download = interceptDownload();
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Export' }));
      await expect(download.create).toHaveBeenCalledTimes(1);
      const { type, text } = await readBlob(download.create.mock.calls[0][0] as Blob);
      await expect(type).toBe('text/csv;charset=utf-8');
      await expect(text).toBe(
        [
          '﻿Name,Role',
          'Zoë Kowalski,Engineer',
          'Ken Thompson,Engineer',
          '"Donald ""Don"" Knuth",Engineer',
          'Barbara Liskov,Engineer',
          'Ada Lovelace,Engineer',
          '',
        ].join('\r\n')
      );
      await expect(download.names).toEqual(['engineers.csv']);
      await expect(download.revoke).toHaveBeenCalledTimes(1);
    } finally {
      download.restore();
    }
  },
};

/** `onExport` gets what the table shows and builds no file. */
export const OnExportReceivesTheQueryAndBuildsNoFile: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onExport: fn() },
  render: (args) => (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      pageSize={3}
      exportable
      onExport={args.onExport}
      columnsMenu
      defaultSearchValue=""
      defaultFilters={FILTERS}
    />
  ),
  play: async ({ canvas, args }) => {
    await setUpTable(canvas);
    const download = interceptDownload();
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Export' }));
      await waitFor(() => expect(args.onExport).toHaveBeenCalledTimes(1));
      await expect(args.onExport).toHaveBeenCalledWith({
        search: SEARCH,
        filters: { role: ['Engineer'], team: ['Core'] },
        sort: { key: 'name', direction: 'desc' },
        columns: ['name', 'role'],
      });
      await expect(download.create).not.toHaveBeenCalled();
      await expect(download.names).toEqual([]);
    } finally {
      download.restore();
    }
  },
};

/** The file name defaults to `export.csv`. */
export const ExportFileNameDefaultsToExportCsv: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} exportable />,
  play: async ({ canvas }) => {
    const download = interceptDownload();
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Export' }));
      await expect(download.names).toEqual(['export.csv']);
    } finally {
      download.restore();
    }
  },
};

/** Below `sm` the button keeps its icon and its name "Export" and drops the label. */
const mobile: Story = {
  globals: mobileViewport,
  render: () => (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      exportable
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
    const button = canvas.getByRole('button', { name: 'Export' });
    await expect(button).toBeVisible();
    await expect(button.getBoundingClientRect().width).toBeLessThan(48);
    await expect(canvas.getByLabelText(/search rows/i)).toBeVisible();
  },
};
