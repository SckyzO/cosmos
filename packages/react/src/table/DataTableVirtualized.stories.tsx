import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { DataTable } from './DataTable';
import { expectNoHorizontalOverflow, mobileViewport } from '../storybook-helpers';
import type { ColumnDef } from './types';

// `virtualize` has its own file, in the `Tables/DataTable` family: DataTable.stories.tsx is already
// one of the largest stories files of the package.
const meta = {
  title: 'Tables/DataTable virtualised',
  component: DataTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { rows: [], columns: [], rowKey: () => '' },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

type Node = { id: string; name: string; team: string; cpu: number };

const TEAMS = ['Core', 'Kernel', 'Web', 'Data', 'Infra'];
const COUNT = 10_000;

// 10,000 rows with nothing random in them: the same table on every run.
const rows: Node[] = Array.from({ length: COUNT }, (_, i) => ({
  id: `node-${String(i + 1).padStart(5, '0')}`,
  name: `node-${String(i + 1).padStart(5, '0')}`,
  team: TEAMS[i % TEAMS.length],
  cpu: (i * 37) % 100,
}));

const columns: ColumnDef<Node>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    sortValue: (r) => r.name,
    render: (r) => <span className="font-medium text-gray-900 dark:text-white">{r.name}</span>,
  },
  { key: 'team', label: 'Team', render: (r) => r.team },
  { key: 'cpu', label: 'CPU %', align: 'end', render: (r) => `${r.cpu}%` },
];

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

/** The rows of the table's body that are drawn: the spacers are `aria-hidden`, so not rows. */
const bodyRows = (table: HTMLElement) =>
  within(table)
    .getAllByRole('row')
    // The first row is the header.
    .slice(1);

const scrollerOf = (table: HTMLElement) => table.parentElement as HTMLElement;

/**
 * `virtualize` draws only the rows in view and a few around them, whatever the length of the list:
 * 10,000 rows here, on one page. The header stays in place while they scroll, and the scroll bar
 * stands for the whole list. Give the table a height (`max-h-96`): its own area is what scrolls.
 */
export const TenThousandRows: Story = {
  render: () => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        pageSize={COUNT}
        selectable
        virtualize
        aria-label="Nodes"
        className="max-h-96"
      />
    </Wrap>
  ),
};

/** `compact` rows are shorter; the window follows the density. */
export const Compact: Story = {
  tags: ['!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        pageSize={COUNT}
        density="compact"
        virtualize
        aria-label="Nodes"
        className="max-h-96"
      />
    </Wrap>
  ),
};

/** `comfortable` rows are taller; the window follows the density. */
export const Comfortable: Story = {
  tags: ['!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        pageSize={COUNT}
        density="comfortable"
        virtualize
        aria-label="Nodes"
        className="max-h-96"
      />
    </Wrap>
  ),
};

/** 10,000 rows, a few dozen in the DOM, and the header and the spacers say where the window is. */
export const OnlyTheWindowIsDrawn: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        pageSize={COUNT}
        virtualize
        aria-label="Nodes"
        className="max-h-96"
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Nodes' });
    // Header (row 1) plus 10,000 rows.
    await expect(table).toHaveAttribute('aria-rowcount', String(COUNT + 1));
    await expect(within(table).getAllByRole('columnheader')[0]).toHaveAttribute('aria-sort');

    const first = bodyRows(table);
    await expect(first.length).toBeGreaterThan(5);
    await expect(first.length).toBeLessThan(40);
    await expect(first[0]).toHaveAttribute('aria-rowindex', '2');
    await expect(within(first[0]).getByText('node-00001')).toBeVisible();
    await expect(canvas.queryByText('node-05000')).toBeNull();

    // Far down: another window, the same number of rows, and the first ones gone.
    const scroller = scrollerOf(table);
    scroller.scrollTop = 4999 * 49;
    await waitFor(() => expect(canvas.getByText('node-05000')).toBeInTheDocument());
    const middle = bodyRows(table);
    await expect(middle.length).toBeLessThan(40);
    await expect(canvas.queryByText('node-00001')).toBeNull();
    // The rows keep their place in the whole list: 5000 is the 5000th, under the header.
    const row = canvas.getByText('node-05000').closest('tr')!;
    await expect(row).toHaveAttribute('aria-rowindex', '5001');

    // The spacers are what the scroll bar measures, and they are hidden from assistive technology.
    const spacers = table.querySelectorAll('tbody > tr[aria-hidden="true"]');
    await expect(spacers.length).toBe(2);

    // The last row is reachable.
    scroller.scrollTop = scroller.scrollHeight;
    await waitFor(() => expect(canvas.getByText('node-10000')).toBeInTheDocument());
    await expect(table.querySelectorAll('tbody > tr[aria-hidden="true"]').length).toBe(1);
  },
};

/** The window is one density's arithmetic: a drawn row is as tall as a row of a normal table. */
export const RowIsAsTallAsAStandardRow: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="flex flex-col gap-6">
        {(['compact', 'default', 'comfortable'] as const).map((density) => (
          <div key={density} className="flex gap-6">
            <div className="min-w-0 flex-1">
              <DataTable
                rows={rows.slice(0, 20)}
                columns={columns}
                rowKey={(r) => r.id}
                density={density}
                pageSize={20}
                selectable
                aria-label={`Standard ${density}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <DataTable
                rows={rows}
                columns={columns}
                rowKey={(r) => r.id}
                density={density}
                pageSize={COUNT}
                selectable
                virtualize
                aria-label={`Windowed ${density}`}
                className="max-h-96"
              />
            </div>
          </div>
        ))}
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    for (const density of ['compact', 'default', 'comfortable']) {
      const standard = bodyRows(canvas.getByRole('table', { name: `Standard ${density}` }));
      const windowed = bodyRows(canvas.getByRole('table', { name: `Windowed ${density}` }));
      // Rows 2 and 3: the first one has no divider above it in either table.
      const pitch = (list: HTMLElement[]) =>
        list[2].getBoundingClientRect().top - list[1].getBoundingClientRect().top;
      await expect(pitch(windowed)).toBe(pitch(standard));
      await expect(windowed[1].getBoundingClientRect().height).toBe(
        standard[1].getBoundingClientRect().height
      );
    }
  },
};

/** Without a `density` the window follows the page's: a drawn row is as tall as a standard one. */
export const RowFollowsThePageDensity: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="flex flex-col gap-6">
        {(['compact', 'comfortable'] as const).map((page) => (
          <div key={page} data-density={page} className="flex gap-6">
            <div className="min-w-0 flex-1">
              <DataTable
                rows={rows.slice(0, 20)}
                columns={columns}
                rowKey={(r) => r.id}
                pageSize={20}
                aria-label={`Standard ${page}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <DataTable
                rows={rows}
                columns={columns}
                rowKey={(r) => r.id}
                pageSize={COUNT}
                virtualize
                aria-label={`Windowed ${page}`}
                className="max-h-96"
              />
            </div>
          </div>
        ))}
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const heights: number[] = [];
    for (const page of ['compact', 'comfortable']) {
      const standard = bodyRows(canvas.getByRole('table', { name: `Standard ${page}` }));
      const windowed = bodyRows(canvas.getByRole('table', { name: `Windowed ${page}` }));
      const height = windowed[1].getBoundingClientRect().height;
      await expect(height).toBe(standard[1].getBoundingClientRect().height);
      heights.push(height);
    }
    await expect(heights[0]).toBeLessThan(heights[1]);
  },
};

/** A cell taller than the row is clipped to it, so that the window's arithmetic holds. */
export const TallContentIsClipped: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        rows={rows.slice(0, 50)}
        columns={[
          {
            key: 'name',
            label: 'Name',
            render: (r) => (
              <div>
                <p>{r.name}</p>
                <p>second line</p>
                <p>third line</p>
              </div>
            ),
          },
        ]}
        rowKey={(r) => r.id}
        pageSize={50}
        virtualize
        aria-label="Nodes"
        className="max-h-96"
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Nodes' });
    const [a, b] = bodyRows(table).slice(1);
    await expect(b.getBoundingClientRect().top - a.getBoundingClientRect().top).toBe(49);
  },
};

/**
 * Scrolling far from the row that holds the keyboard focus does not drop it: it stays drawn, in
 * its place, and still is the active element. The selection is the table's state, not the DOM's,
 * so it is the same before and after.
 */
export const ScrollingKeepsTheFocusAndTheSelection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const Host = () => {
      return (
        <Wrap>
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            pageSize={COUNT}
            selectable
            virtualize
            defaultSelection={new Set(['node-00002', 'node-09000'])}
            aria-label="Nodes"
            className="max-h-96"
          />
        </Wrap>
      );
    };
    return <Host />;
  },
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Nodes' });
    const scroller = scrollerOf(table);
    await expect(canvas.getByText('2 selected')).toBeInTheDocument();

    // Focus the checkbox of the 5th row, as a keyboard user who tabbed to it.
    const checkbox = canvas.getByRole('checkbox', { name: 'Select row node-00005' });
    checkbox.focus();
    await expect(checkbox).toHaveFocus();

    // Far away: the 5th row is out of any window, but the focus is still on its checkbox.
    scroller.scrollTop = 7000 * 49;
    await waitFor(() => expect(canvas.getByText('node-07000')).toBeInTheDocument());
    await expect(canvas.queryByText('node-00004')).toBeNull();
    await expect(checkbox.isConnected).toBe(true);
    await expect(checkbox).toHaveFocus();
    await expect(document.activeElement).toBe(checkbox);
    // It is drawn in its place, 5th among 10,000 (row 6 with the header), not next to the rows in view.
    await expect(checkbox.closest('tr')).toHaveAttribute('aria-rowindex', '6');
    await expect(bodyRows(table).length).toBeLessThan(40);
    await expect(canvas.getByText('2 selected')).toBeInTheDocument();

    // The selected row that is out of the window is selected still, once scrolled back to it.
    scroller.scrollTop = 8990 * 49;
    await waitFor(() => expect(canvas.getByText('node-09000')).toBeInTheDocument());
    await expect(canvas.getByRole('checkbox', { name: 'Select row node-09000' })).toBeChecked();
    await expect(canvas.getByText('2 selected')).toBeInTheDocument();
    await expect(checkbox).toHaveFocus();

    // Focus moves to a row in view: the 5th row is no longer kept, and goes away.
    const inView = canvas.getByRole('checkbox', { name: 'Select row node-09000' });
    inView.focus();
    await waitFor(() => expect(checkbox.isConnected).toBe(false));
    await expect(inView).toHaveFocus();
  },
};

/** A click on a checkbox of a drawn row selects it, as in any other table. */
export const SelectionWorksInTheWindow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onSelectionChange: fn() },
  render: (args) => (
    <Wrap>
      <DataTable
        {...args}
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        pageSize={COUNT}
        selectable
        virtualize
        aria-label="Nodes"
        className="max-h-96"
      />
    </Wrap>
  ),
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select row node-00003' }));
    await expect(args.onSelectionChange).toHaveBeenLastCalledWith(new Set(['node-00003']));
    await expect(canvas.getByText('1 selected')).toBeInTheDocument();
  },
};

/** At 375px the windowed table scrolls in its own area and the page does not move sideways. */
export const OnAPhone: Story = {
  tags: ['!autodocs'],
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        pageSize={COUNT}
        virtualize
        aria-label="Nodes"
        className="max-h-96"
      />
    </Wrap>
  ),
};

export const OnAPhoneChecks: Story = {
  ...OnAPhone,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(bodyRows(canvas.getByRole('table', { name: 'Nodes' })).length).toBeLessThan(40);
    expectNoHorizontalOverflow();
  },
};

/**
 * `virtualize` is for the table layout. With `mobileLayout="cards"` below `sm` the cards are the
 * rows, and they keep the pagination: a page of them, not the 10,000.
 */
export const CardsKeepThePagination: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        virtualize
        mobileLayout="cards"
        aria-label="Nodes"
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    // The default page size: 25 cards, and the pager that goes to the others.
    await expect(canvas.getAllByRole('listitem')).toHaveLength(25);
    await expect(canvas.getByRole('button', { name: 'Next page' })).toBeInTheDocument();
    // The table is not what shows.
    const table = canvas.getByRole('table', { hidden: true });
    await expect(getComputedStyle(table.parentElement!.parentElement!).display).toBe('none');
    expectNoHorizontalOverflow();
  },
};

/**
 * The row height follows the text size: at `xl` the rows are taller, no cell's content overflows
 * its box, the spacers are the hidden rows times the measured row height, and the last row can be
 * reached.
 */
export const RowsFollowTheTextSize: Story = {
  tags: ['!dev', '!autodocs'],
  // The toolbar's Text size menu, set by the story: the appearance decorator puts it on <html>.
  globals: { textSize: 'xl' },
  render: () => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        pageSize={COUNT}
        selectable
        virtualize
        aria-label="Nodes"
        className="max-h-96"
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Nodes' });
    const scroller = scrollerOf(table);
    await expect(document.documentElement.getAttribute('data-text-size')).toBe('xl');
    // A row of the table at xl is taller than the 49px of the default size.
    await waitFor(() =>
      expect(bodyRows(table)[1].getBoundingClientRect().height).toBeGreaterThan(55)
    );
    const rowHeight = bodyRows(table)[1].getBoundingClientRect().height;

    const noOverflow = () => {
      for (const box of table.querySelectorAll<HTMLElement>('tbody td > div')) {
        expect(box.scrollHeight).toBeLessThanOrEqual(box.clientHeight);
      }
    };
    const spacersMatch = () => {
      const drawn = bodyRows(table);
      const first = Number(drawn[0].getAttribute('aria-rowindex')) - 2;
      const last = Number(drawn[drawn.length - 1].getAttribute('aria-rowindex')) - 2;
      const [above, below] = ['first', 'last'].map((end) => {
        const tr = table.querySelector<HTMLElement>(`tbody > tr[aria-hidden="true"]:${end}-child`);
        return tr ? tr.getBoundingClientRect().height : 0;
      });
      // One row per index outside the drawn ones, each as tall as a measured row.
      expect(above).toBeCloseTo(first * rowHeight, 0);
      expect(below).toBeCloseTo((COUNT - 1 - last) * rowHeight, 0);
    };
    noOverflow();
    spacersMatch();

    scroller.scrollTop = 5000 * rowHeight;
    await waitFor(() => expect(canvas.getByText('node-05001')).toBeInTheDocument());
    noOverflow();
    spacersMatch();

    scroller.scrollTop = scroller.scrollHeight;
    await waitFor(() => expect(canvas.getByText('node-10000')).toBeInTheDocument());
    noOverflow();
    await expect(canvas.getByText('node-10000')).toBeVisible();
  },
};

/** The cells of a window follow their column's `end` alignment too, not only the table cells. */
export const EndColumnIsJustifiedInTheWindow: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        pageSize={COUNT}
        virtualize
        aria-label="Nodes"
        className="max-h-96"
      />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Nodes' });
    const cells = within(bodyRows(table)[0]).getAllByRole('cell');
    const box = (cell: HTMLElement) => getComputedStyle(cell.firstElementChild!).justifyContent;
    await expect(box(cells[2])).toBe('flex-end');
    await expect(box(cells[1])).toBe('normal');
  },
};
