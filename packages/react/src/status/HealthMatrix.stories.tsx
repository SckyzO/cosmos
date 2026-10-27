import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HEALTH_NOW, MATRIX_COLUMNS, MATRIX_ROWS } from '../storybook-health';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { HealthMatrix } from './HealthMatrix';

const meta = {
  title: 'Monitoring/Health Matrix',
  component: HealthMatrix,
  parameters: portalDocsParams.lg(),
  tags: ['autodocs'],
  args: {
    columns: MATRIX_COLUMNS,
    rows: MATRIX_ROWS,
    ariaLabel: 'Services by node',
    title: 'Services by node',
    now: HEALTH_NOW,
  },
} satisfies Meta<typeof HealthMatrix>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Six services on twenty nodes. Each mark has a shape as well as a colour, and the legend shows them. */
export const Dots: Story = {};

/** The same grid with the status written in each cell. */
export const Pills: Story = { args: { variant: 'pills' } };

/** Every status, the info triangle included, and a service that does not run on one node. */
export const EveryStatus: Story = {
  args: {
    title: 'Every status',
    ariaLabel: 'Every status',
    columns: [
      { id: 'ok', label: 'ok' },
      { id: 'warn', label: 'warn' },
      { id: 'crit', label: 'crit' },
      { id: 'unknown', label: 'unknown' },
      { id: 'info', label: 'info' },
      { id: 'none', label: 'none' },
    ],
    rows: [
      {
        id: 'api',
        label: 'API',
        cells: {
          ok: { status: 'OK' },
          warn: { status: 'WARN' },
          crit: { status: 'CRIT' },
          unknown: { status: 'UNKNOWN' },
          info: { status: 'INFO' },
        },
      },
    ],
  },
};

export const EveryStatusPills: Story = { args: { ...EveryStatus.args, variant: 'pills' } };

/** `maxHeight` makes the grid scroll vertically, the column headers staying in view. */
export const StickyHeaders: Story = { args: { maxHeight: 180 } };

/** The popover of a cell can carry more than the status: a link to its checks. */
export const WithDetail: Story = {
  args: {
    rows: MATRIX_ROWS.map((row) => ({
      ...row,
      cells: Object.fromEntries(
        Object.entries(row.cells).map(([id, cell]) => [
          id,
          cell && {
            ...cell,
            detail: (
              <a
                href="#checks"
                className="text-brand-600 dark:text-brand-400 text-sm font-medium underline"
              >
                View checks
              </a>
            ),
          },
        ])
      ),
    })),
  },
};

/** At 375px the grid scrolls in its own box: the page does not. */
export const Mobile: Story = {
  globals: mobileViewport,
  play: ({ canvasElement }) => {
    expectNoHorizontalOverflow();
    const box = canvasElement.querySelector('table')!.parentElement!;
    expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);
  },
};

export const MobilePills: Story = { ...Mobile, args: { variant: 'pills' } };

// ── Tests ────────────────────────────────────────────────────────────────────

const cell = (canvas: ReturnType<typeof within>, name: string) =>
  canvas.getByRole('button', { name });

/** Every cell is named by the service, the column and the status in words. */
export const CellsAreNamedWithTheirStatus: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(cell(canvas, 'API on par-1a: OK')).toBeVisible();
    await expect(cell(canvas, 'API on par-2b: Warning')).toBeVisible();
    await expect(cell(canvas, 'Collector on fra-1a: Critical')).toBeVisible();
    await expect(cell(canvas, 'Scheduler on ams-1a: Unknown')).toBeVisible();
    await expect(cell(canvas, 'Database on lon-2a: Info')).toBeVisible();
  },
};

/** The legend and the pills say each status in text. */
export const LegendAndPillsConveyStatusAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...EveryStatus.args, legend: true, variant: 'pills' },
  play: async ({ canvas }) => {
    const legend = within(canvas.getByRole('list', { name: 'Legend' }));
    for (const name of ['OK', 'Warning', 'Critical', 'Unknown', 'Info']) {
      await expect(legend.getByText(name)).toBeVisible();
    }
    const grid = within(canvas.getByRole('grid'));
    for (const name of ['OK', 'Warning', 'Critical', 'Unknown', 'Info']) {
      await expect(grid.getAllByText(name, { selector: 'span' }).length).toBeGreaterThan(0);
    }
  },
};

/** The legend shows the shapes of the dots: one per status, and the info one only when used. */
export const LegendFollowsTheStatusesInUse: Story = {
  tags: ['!dev', '!autodocs'],
  args: { rows: MATRIX_ROWS.slice(0, 1) },
  play: async ({ canvas }) => {
    const items = within(canvas.getByRole('list', { name: 'Legend' })).getAllByRole('listitem');
    await expect(items.map((li) => li.textContent)).toEqual([
      'OK',
      'Warning',
      'Critical',
      'Unknown',
    ]);
  },
};

/** One tab stop for the whole grid, then arrow keys, Home and End between cells. */
export const KeyboardNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const stops = () => canvasElement.querySelectorAll('button[tabindex="0"]');
    await expect(stops()).toHaveLength(1);

    await userEvent.tab();
    await expect(cell(canvas, 'API on par-1a: OK')).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    await expect(cell(canvas, 'API on par-1b: OK')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(cell(canvas, 'Scheduler on par-1b: OK')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(cell(canvas, 'Scheduler on par-1a: OK')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(cell(canvas, 'API on par-1a: OK')).toHaveFocus();

    // The ends of the grid stop the arrows.
    await userEvent.keyboard('{ArrowLeft}{ArrowUp}');
    await expect(cell(canvas, 'API on par-1a: OK')).toHaveFocus();

    await userEvent.keyboard('{End}');
    await expect(cell(canvas, 'API on osl-1b: OK')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(cell(canvas, 'API on par-1a: OK')).toHaveFocus();

    // The tab stop moved with the focus: still one.
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect(stops()).toHaveLength(1);
    await expect(stops()[0]).toBe(cell(canvas, 'API on par-1c: OK'));

    // Tab leaves the grid instead of walking its cells.
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
    // Coming back lands on the cell the grid remembered.
    await userEvent.tab({ shift: true });
    await expect(cell(canvas, 'API on par-1c: OK')).toHaveFocus();
  },
};

/** Enter opens the popover of a cell, Escape closes it and the focus returns to the cell. */
export const PopoverOpensOnEnterAndClosesOnEscape: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const warn = cell(canvas, 'API on par-2b: Warning');
    warn.focus();
    await expect(warn).toHaveAttribute('aria-expanded', 'false');

    await userEvent.keyboard('{Enter}');
    const dialog = await page.findByRole('dialog', { name: 'API on par-2b' });
    await expect(warn).toHaveAttribute('aria-expanded', 'true');
    await expect(within(dialog).getByText('Warning')).toBeVisible();
    await expect(within(dialog).getByText('p95 latency 1.4 s, above 1 s')).toBeVisible();
    await expect(dialog).toHaveTextContent('Checked 30 seconds ago');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(page.queryByRole('dialog')).toBeNull());
    await expect(warn).toHaveFocus();
    await expect(warn).toHaveAttribute('aria-expanded', 'false');
  },
};

/** The popover opens on a click too, and a click on the same cell closes it. */
export const ClickTogglesThePopover: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const crit = cell(canvas, 'Collector on fra-1a: Critical');
    await userEvent.click(crit);
    await expect(
      await page.findByRole('dialog', { name: 'Collector on fra-1a' })
    ).toHaveTextContent('No answer for 3 checks in a row');
    await userEvent.click(crit);
    await waitFor(() => expect(page.queryByRole('dialog')).toBeNull());
  },
};

/** A column with no entry is an empty cell: named, not a status, and it opens nothing. */
export const MissingCellOpensNothing: Story = {
  ...EveryStatus,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const none = cell(canvas, 'API on none: no data');
    await userEvent.click(none);
    await expect(within(canvasElement.ownerDocument.body).queryByRole('dialog')).toBeNull();
    await expect(none).not.toHaveAttribute('aria-haspopup');
  },
};
