import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HEALTH_NOW, MATRIX_COLUMNS, MATRIX_ROWS } from '../storybook-health';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectMirrored,
  expectNoHorizontalOverflow,
  inDirection,
  keyToEnd,
  keyToStart,
  mobileViewport,
  portalDocsParams,
  startOffset,
} from '../storybook-helpers';
import { InEachDensity, expectDensitySteps } from '../storybook-density';
import { HealthMatrix, type HealthMatrixRow } from './HealthMatrix';
import type { HealthStatus } from './types';

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

/** `rowHeader` names the first header cell, "Service" by default: a cluster says "Rack". */
export const RowHeader: Story = {
  args: { rowHeader: 'Rack', title: 'Nodes by rack', ariaLabel: 'Nodes by rack' },
};

// Thirty-six racks on twelve nodes: every third rack holds a problem, a few hold several.
const RACK_COLUMNS = Array.from({ length: 12 }, (_, c) => {
  const id = `n${String(c + 1).padStart(2, '0')}`;
  return { id, label: id };
});
const RACK_ROWS: HealthMatrixRow[] = Array.from({ length: 36 }, (_, r) => {
  const label = `R${String(r + 1).padStart(2, '0')}`;
  const bad = r % 3 === 1;
  return {
    id: label,
    label,
    cells: Object.fromEntries(
      RACK_COLUMNS.map((column, c): [string, HealthMatrixRow['cells'][string]] => {
        let status: HealthStatus = 'OK';
        if (bad && c === r % 12) status = 'WARN';
        if (bad && r % 2 === 0 && c === (r + 5) % 12) status = 'CRIT';
        if (bad && r % 4 === 0 && c === (r + 7) % 12) status = 'WARN';
        return [column.id, { status, checkedAt: HEALTH_NOW - 30_000 }];
      })
    ),
  };
});

/**
 * `attentionStrip` lists the rows that hold a warning or a critical cell above the grid, worst
 * first. Picking a chip scrolls its row into view, inside the grid's own box here, and moves the
 * focus to its first problem cell.
 */
export const AttentionStrip: Story = {
  args: {
    attentionStrip: true,
    rowHeader: 'Rack',
    columns: RACK_COLUMNS,
    rows: RACK_ROWS,
    title: 'Nodes by rack',
    ariaLabel: 'Nodes by rack',
    maxHeight: 320,
  },
};

export const AttentionStripPills: Story = { args: { ...AttentionStrip.args, variant: 'pills' } };

/** At 375px the strip scrolls sideways on its own, and the page does not. */
export const AttentionStripMobile: Story = {
  ...AttentionStrip,
  globals: mobileViewport,
};

export const AttentionStripMobileChecks: Story = {
  ...AttentionStripMobile,
  tags: ['!dev', '!autodocs'],
  play: ({ canvas }) => {
    expectNoHorizontalOverflow();
    const strip = canvas.getByRole('list', { name: 'Needs attention' });
    expect(strip.scrollWidth).toBeGreaterThan(strip.clientWidth);
  },
};

/** The strip on the services matrix: three rows, the two with a critical cell first. */
export const AttentionStripFewRows: Story = { args: { attentionStrip: true } };

/** At 375px the grid scrolls in its own box: the page does not. */
export const Mobile: Story = {
  globals: mobileViewport,
};

export const MobileChecks: Story = {
  ...Mobile,
  tags: ['!dev', '!autodocs'],
  play: ({ canvasElement }) => {
    expectNoHorizontalOverflow();
    const box = canvasElement.querySelector('table')!.parentElement!;
    expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);
  },
};

/**
 * `stale` is when the last data came in. The marks turn grey, the header says "Stale · 4 minutes
 * ago" and every cell is named as stale, for the screen reader.
 */
export const Stale: Story = { args: { stale: HEALTH_NOW - 4 * 60_000 } };

export const StalePills: Story = { args: { stale: HEALTH_NOW - 4 * 60_000, variant: 'pills' } };

export const StaleMobile: Story = { ...Mobile, args: { stale: HEALTH_NOW - 4 * 60_000 } };

export const StaleMobileChecks: Story = {
  ...StaleMobile,
  tags: ['!dev', '!autodocs'],
  play: MobileChecks.play,
};

export const MobilePills: Story = { ...Mobile, args: { variant: 'pills' } };

export const MobilePillsChecks: Story = {
  ...MobilePills,
  tags: ['!dev', '!autodocs'],
  play: MobileChecks.play,
};

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
      await expect(grid.getAllByText(name, { selector: 'span > bdi' }).length).toBeGreaterThan(0);
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

/** The first header cell reads `rowHeader`, and "Service" when there is none. */
export const RowHeaderNamesTheFirstHeaderCell: Story = {
  ...RowHeader,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('columnheader', { name: 'Rack' })).toBeVisible();
    await expect(canvas.queryByRole('columnheader', { name: 'Service' })).toBeNull();
  },
};

export const FirstHeaderCellIsServiceByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('columnheader', { name: 'Service' })).toBeVisible();
  },
};

/** The strip names each row and counts its critical and warning cells in words, worst first. */
export const AttentionStripCountsInWords: Story = {
  ...AttentionStripFewRows,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const strip = canvas.getByRole('list', { name: 'Needs attention' });
    const chips = within(strip).getAllByRole('button');
    await expect(chips.map((chip) => chip.textContent)).toEqual([
      'API: 1 Critical, 1 Warning',
      'Collector: 1 Critical, 1 Warning',
      'Cache: 1 Warning',
    ]);
    await expect(chips[0]).toHaveTextContent('1 Critical');
    await expect(chips[0]).toHaveTextContent('1 Warning');
    await expect(canvas.getByText('3 of 6 rows · 2 Critical · 3 Warning')).toBeVisible();
  },
};

/** No strip unless asked for, and none when no row holds a problem. */
export const NoStripWithoutTheOptionOrAProblem: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <>
      <HealthMatrix {...args} />
      <HealthMatrix
        {...args}
        attentionStrip
        ariaLabel="All clear"
        rows={[{ id: 'ok', label: 'API', cells: { 'par-1a': { status: 'OK' } } }]}
      />
    </>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('Needs attention')).toBeNull();
    await expect(canvas.queryByRole('list', { name: 'Needs attention' })).toBeNull();
  },
};

/** A chip scrolls its row into the grid's own box, below the sticky header, and focuses it. */
export const ChipScrollsItsRowIntoViewAndFocusesIt: Story = {
  ...AttentionStrip,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const scroller = canvasElement.querySelector<HTMLElement>('.overflow-auto')!;
    await expect(scroller.scrollTop).toBe(0);
    const pageScroll = window.scrollY;

    const strip = within(canvas.getByRole('list', { name: 'Needs attention' }));
    const chips = strip.getAllByRole('button');
    const last = chips.at(-1)!;
    const name = last.textContent!.split(':')[0]!;
    await userEvent.click(last);

    const row = canvas.getByRole('rowheader', { name }).closest('tr')!;
    await waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(0));
    const box = scroller.getBoundingClientRect();
    const header = scroller.querySelector('thead')!.getBoundingClientRect();
    const rect = row.getBoundingClientRect();
    await expect(rect.top).toBeGreaterThanOrEqual(header.bottom - 1);
    await expect(rect.bottom).toBeLessThanOrEqual(box.bottom + 1);
    await expect(window.scrollY).toBe(pageScroll);

    // The focus lands on a problem cell of that row, and nothing opened.
    const focused = document.activeElement as HTMLElement;
    await expect(row.contains(focused)).toBe(true);
    await expect(focused.getAttribute('aria-label')).toMatch(/: (Critical|Warning)$/);
    await expect(within(canvasElement.ownerDocument.body).queryByRole('dialog')).toBeNull();
  },
};

/** The focus goes to the worst cell of the row: its first critical cell before a warning. */
export const ChipFocusesTheWorstCellOfItsRow: Story = {
  ...AttentionStripFewRows,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: /^Collector\W+1 Critical\W+1 Warning$/ })
    );
    await expect(cell(canvas, 'Collector on fra-1a: Critical')).toHaveFocus();
    await userEvent.click(canvas.getByRole('button', { name: /^Cache\W+1 Warning$/ }));
    await expect(cell(canvas, 'Cache on lon-1a: Warning')).toHaveFocus();
  },
};

/** The header says how old the data is, and each cell says it is stale. */
export const StaleIsWrittenAndNamed: Story = {
  ...Stale,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/^Stale/)).toHaveTextContent('Stale · 4 minutes ago');
    await expect(cell(canvas, 'API on par-1a: OK, stale')).toBeVisible();
    await expect(cell(canvas, 'Collector on fra-1a: Critical, stale')).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'API on par-1a: OK' })).toBeNull();
  },
};

/** The marks are muted: the same shapes in grey, the text still readable. */
export const StaleMutesTheMarks: Story = {
  ...Stale,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const grid = canvasElement.querySelector<HTMLElement>('.overflow-auto')!;
    await expect(getComputedStyle(grid).filter).toContain('grayscale');
    await expect(getComputedStyle(canvas.getByText(/^Stale/)).filter).toBe('none');
  },
};

export const FreshDataSaysNothingOfStaleness: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.queryByText(/^Stale/)).toBeNull();
    await expect(cell(canvas, 'API on par-1a: OK')).toBeVisible();
    await expect(getComputedStyle(canvasElement.querySelector('.overflow-auto')!).filter).toBe(
      'none'
    );
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

    // The columns run along the line, so the arrows along them swap in right to left.
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(cell(canvas, 'API on par-1b: OK')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(cell(canvas, 'Scheduler on par-1b: OK')).toHaveFocus();
    await userEvent.keyboard(`{${keyToStart()}}`);
    await expect(cell(canvas, 'Scheduler on par-1a: OK')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(cell(canvas, 'API on par-1a: OK')).toHaveFocus();

    // The ends of the grid stop the arrows.
    await userEvent.keyboard(`{${keyToStart()}}{ArrowUp}`);
    await expect(cell(canvas, 'API on par-1a: OK')).toHaveFocus();

    await userEvent.keyboard('{End}');
    await expect(cell(canvas, 'API on osl-1b: OK')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(cell(canvas, 'API on par-1a: OK')).toHaveFocus();

    // The tab stop moved with the focus: still one.
    await userEvent.keyboard(`{${keyToEnd()}}{${keyToEnd()}}`);
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

/** The header cells and the cell buttons follow the page's `data-density`. */
export const CellsFollowPageDensity: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <InEachDensity>
      <HealthMatrix {...args} />
    </InEachDensity>
  ),
  play: async ({ canvas }) => {
    await expectDensitySteps(canvas, (scope) => scope.getAllByRole('columnheader')[0]!);
    await expectDensitySteps(
      canvas,
      (scope) => scope.getAllByRole('gridcell')[0]!.firstElementChild!,
      {
        control: true,
      }
    );
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * The service column sits at the start and sticks there while the nodes scroll, the legend ends
 * the header, and the nodes run from the start of the line.
 */
export const ServiceColumnSticksAtTheStart: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) =>
    bothDirections(() => (
      <div className="max-w-xl">
        <HealthMatrix {...args} />
      </div>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const canvas = within(box);
      const first = canvas.getByRole('columnheader', { name: 'par-1a' });
      const last = canvas.getByRole('columnheader', { name: MATRIX_COLUMNS.at(-1)!.label });
      expect(startOffset(first, box), `${dir}: first node`).toBeLessThan(startOffset(last, box));
      const service = canvas.getByRole('columnheader', { name: 'Service' });
      const scroller = service.closest<HTMLElement>('.overflow-auto')!;
      expect(scroller.scrollWidth, `${dir}: the grid scrolls`).toBeGreaterThan(
        scroller.clientWidth
      );
      // Scrolled to the end (negative in right to left), the column is still at the start edge.
      scroller.scrollLeft = dir === 'rtl' ? -scroller.scrollWidth : scroller.scrollWidth;
      await waitFor(() => expect(Math.abs(scroller.scrollLeft)).toBeGreaterThan(0));
      const row = canvas.getByRole('rowheader', { name: 'API' });
      expect(startOffset(row, scroller), `${dir}: sticky column`).toBeCloseTo(0, 0);
      expect(endOffset(row, scroller), `${dir}: sticky column`).toBeGreaterThan(0);
      scroller.scrollLeft = 0;
    }
    expectMirrored(canvasElement, (box) => within(box).getByText('Services by node'));
    expectMirrored(canvasElement, (box) => within(box).getByRole('rowheader', { name: 'API' }));
  },
};

/** The arrows along a row follow the direction of the page, however it was set. */
export const ArrowsFollowTheDirectionOfThePage: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      await inDirection(dir, async () => {
        cell(canvas, 'API on par-1a: OK').focus();
        // ArrowRight is the next node in left to right, the previous one in right to left.
        await userEvent.keyboard('{ArrowRight}');
        await expect(
          cell(canvas, dir === 'ltr' ? 'API on par-1b: OK' : 'API on par-1a: OK')
        ).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
        await expect(
          cell(canvas, dir === 'ltr' ? 'API on par-1a: OK' : 'API on par-1c: OK')
        ).toHaveFocus();
        cell(canvas, 'API on par-1a: OK').focus();
      });
    }
  },
};
