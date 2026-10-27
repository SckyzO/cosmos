import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { Pagination } from './Pagination';
import { expectNoHorizontalOverflow, mobileViewport } from '../storybook-helpers';

const meta = {
  title: 'Navigation/Pagination',
  component: Pagination,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { page: 1, totalPages: 10, onPageChange: fn() },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { page: 5, totalPages: 10 },
};

export const FewPages: Story = {
  args: { page: 2, totalPages: 4 },
};

export const ManyPages: Story = {
  args: { page: 25, totalPages: 50 },
};

export const FirstPage: Story = {
  args: { page: 1, totalPages: 50 },
};

export const LastPage: Story = {
  args: { page: 50, totalPages: 50 },
};

export const WithInfo: Story = {
  args: {
    page: 2,
    totalPages: 9,
    showInfo: true,
    pageSize: 10,
    total: 87,
  },
};

export const Compact: Story = {
  args: { page: 7, totalPages: 25, variant: 'compact' },
};

export const SizeMd: Story = {
  args: { page: 5, totalPages: 10, size: 'md' },
};

export const SinglePage: Story = {
  args: { page: 1, totalPages: 1 },
};

export const Controlled: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    const total = 245;
    const pageSize = 10;
    const totalPages = Math.ceil(total / pageSize);
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Currently viewing items <span className="font-mono">{(page - 1) * pageSize + 1}</span>–
            <span className="font-mono">{Math.min(page * pageSize, total)}</span> of{' '}
            <span className="font-mono">{total}</span>.
          </p>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          showInfo
          pageSize={pageSize}
          total={total}
        />
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickPageFiresChange: Story = {
  tags: ['!dev'],
  args: { page: 5, totalPages: 10, onPageChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Page 6' }));
    await expect(args.onPageChange).toHaveBeenCalledWith(6);
  },
};

export const PrevDisabledOnFirstPage: Story = {
  args: { page: 1, totalPages: 10, onPageChange: fn() },
  play: async ({ args, canvas }) => {
    const prev = canvas.getByRole('button', { name: /previous/i });
    await expect(prev).toBeDisabled();
    await userEvent.click(prev).catch(() => undefined);
    await expect(args.onPageChange).not.toHaveBeenCalled();
  },
};

export const NextDisabledOnLastPage: Story = {
  args: { page: 10, totalPages: 10, onPageChange: fn() },
  play: async ({ args, canvas }) => {
    const next = canvas.getByRole('button', { name: /next/i });
    await expect(next).toBeDisabled();
    await userEvent.click(next).catch(() => undefined);
    await expect(args.onPageChange).not.toHaveBeenCalled();
  },
};

export const PrevAdvancesPage: Story = {
  tags: ['!dev'],
  args: { page: 5, totalPages: 10, onPageChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /previous/i }));
    await expect(args.onPageChange).toHaveBeenCalledWith(4);
  },
};

export const NextAdvancesPage: Story = {
  tags: ['!dev'],
  args: { page: 5, totalPages: 10, onPageChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /next/i }));
    await expect(args.onPageChange).toHaveBeenCalledWith(6);
  },
};

export const ActivePageHasAriaCurrent: Story = {
  tags: ['!dev'],
  args: { page: 3, totalPages: 10 },
  play: async ({ canvas }) => {
    const active = canvas.getByRole('button', { name: 'Page 3' });
    await expect(active).toHaveAttribute('aria-current', 'page');
  },
};

// ── Controlled or not (#151) ─────────────────────────────────────────────────
// Only `undefined` means uncontrolled. The uncontrolled instance starts from its
// default and moves on its own; the controlled one, held at a fixed value, reports
// the change and keeps showing the value it is given.

export const UncontrolledFromDefaultPage: Story = {
  tags: ['!dev', '!autodocs'],
  args: { page: undefined, defaultPage: 3, totalPages: 10, onPageChange: fn() },
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Page 3' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(args.onPageChange).toHaveBeenLastCalledWith(4);
    await expect(canvas.getByRole('button', { name: 'Page 4' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  },
};

export const ControlledPageOnlyReports: Story = {
  tags: ['!dev', '!autodocs'],
  args: { page: 5, defaultPage: 2, totalPages: 10, onPageChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(args.onPageChange).toHaveBeenLastCalledWith(6);
    await expect(canvas.getByRole('button', { name: 'Page 5' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  },
};

// ── Active page is visible (#290) ────────────────────────────────────────────
// The active page used to carry both its own and the neutral classes, and the
// neutral ones won: a white digit on a white button. The test compares computed
// colors, which is what the eye sees.

export const ActivePageDiffersFromInactive: Story = {
  tags: ['!dev', '!autodocs'],
  args: { page: 3, totalPages: 10 },
  play: async ({ canvas }) => {
    const active = getComputedStyle(canvas.getByRole('button', { name: 'Page 3' }));
    const inactive = getComputedStyle(canvas.getByRole('button', { name: 'Page 4' }));
    await expect(active.backgroundColor).not.toBe(inactive.backgroundColor);
    await expect(active.borderTopColor).not.toBe(inactive.borderTopColor);
    await expect(active.color).not.toBe(active.backgroundColor);
  },
};

// ── Narrow screens (#291) ────────────────────────────────────────────────────

export const Mobile: Story = {
  globals: mobileViewport,
  args: { page: 2, totalPages: 9, showInfo: true, pageSize: 10, total: 87 },
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Pagination' });
    expectNoHorizontalOverflow(nav);
    // The numbered buttons give way to "Page 2 / 9" between Previous and Next...
    await expect(canvas.queryByRole('button', { name: 'Page 3' })).toBeNull();
    await expect(canvas.getByText(/^Page/)).toHaveTextContent('Page 2 / 9');
    await expect(canvas.getByRole('button', { name: 'Previous page' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Next page' })).toBeVisible();
    // ...and the info sits on a row of its own, above the controls.
    const info = canvas.getByText(/^Showing/);
    await expect(info.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      canvas.getByRole('button', { name: 'Next page' }).getBoundingClientRect().top
    );
  },
};

export const ShowAll: Story = {
  render: (args) => {
    const [showAll, setShowAll] = useState(false);
    return (
      <Pagination
        {...args}
        showAll={showAll}
        onShowAllChange={setShowAll}
        showInfo
        pageSize={10}
        total={87}
      />
    );
  },
  args: { page: 2, totalPages: 9 },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show all' }));
    await expect(canvas.getByText(/^Showing all/)).toHaveTextContent('Showing all 87 results');
    await expect(canvas.queryByRole('button', { name: 'Next page' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Show paginated' }));
    await expect(canvas.getByRole('button', { name: 'Next page' })).toBeVisible();
  },
};

// ── First and last page (#303) ───────────────────────────────────────────────

export const WithEdges: Story = {
  args: { page: 25, totalPages: 50, showEdges: true },
};

export const CompactWithEdges: Story = {
  args: { page: 7, totalPages: 25, variant: 'compact', showEdges: true },
};

export const EdgesJumpToFirstAndLast: Story = {
  tags: ['!dev', '!autodocs'],
  args: { page: undefined, defaultPage: 25, totalPages: 50, showEdges: true, onPageChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Last page' }));
    await expect(args.onPageChange).toHaveBeenLastCalledWith(50);
    await expect(canvas.getByRole('button', { name: 'Page 50' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    // On the last page, Last and Next have nowhere to go.
    await expect(canvas.getByRole('button', { name: 'Last page' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Next page' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'First page' }));
    await expect(args.onPageChange).toHaveBeenLastCalledWith(1);
    await expect(canvas.getByRole('button', { name: 'First page' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  },
};

export const NoEdgesByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  args: { page: 5, totalPages: 10 },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: 'First page' })).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Last page' })).toBeNull();
  },
};

/** Below `sm` the edges stay with Previous and Next, around "Page 2 / 9". */
export const MobileWithEdges: Story = {
  tags: ['!autodocs'],
  globals: mobileViewport,
  args: { page: 2, totalPages: 9, showEdges: true, showInfo: true, pageSize: 10, total: 87 },
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow(canvas.getByRole('navigation', { name: 'Pagination' }));
    await expect(canvas.getByRole('button', { name: 'First page' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Last page' })).toBeVisible();
    await expect(canvas.getByText(/^Page/)).toHaveTextContent('Page 2 / 9');
  },
};

// ── Previous and Next as text (#411) ─────────────────────────────────────────
// `prevNextLabel="text"` adds the word beside the chevron. The accessible names stay
// "Previous page" and "Next page": they contain the visible word (WCAG 2.5.3).

/** The box of the word inside a Previous or Next button: its text node, not the chevron. */
const wordRect = (button: HTMLElement) => {
  const text = [...button.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
  const range = document.createRange();
  range.selectNodeContents(text!);
  return range.getBoundingClientRect();
};

const expectWordsAndChevrons = async (
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas']
) => {
  const prev = canvas.getByRole('button', { name: 'Previous page' });
  const next = canvas.getByRole('button', { name: 'Next page' });
  // The word is visible, and it is added to the chevron, not put in its place.
  await expect(prev).toHaveTextContent('Previous');
  await expect(next).toHaveTextContent('Next');
  await expect(prev).toBeVisible();
  await expect(next).toBeVisible();
  const prevIcon = prev.querySelector('svg')!.getBoundingClientRect();
  const nextIcon = next.querySelector('svg')!.getBoundingClientRect();
  // "‹ Previous" and "Next ›": the chevron is on the outer side of the word.
  await expect(prevIcon.right).toBeLessThanOrEqual(wordRect(prev).left);
  await expect(wordRect(next).right).toBeLessThanOrEqual(nextIcon.left);
  // The accessible name is unchanged, and it contains the visible word.
  await expect(prev).toHaveAttribute('aria-label', 'Previous page');
  await expect(next).toHaveAttribute('aria-label', 'Next page');
  await expect(prev.getAttribute('aria-label')).toContain(prev.textContent);
  await expect(next.getAttribute('aria-label')).toContain(next.textContent);
};

export const TextLabels: Story = {
  args: { page: 5, totalPages: 10, prevNextLabel: 'text' },
  play: async ({ canvas }) => {
    await expectWordsAndChevrons(canvas);
  },
};

export const TextLabelsSizeMd: Story = {
  args: { page: 5, totalPages: 10, prevNextLabel: 'text', size: 'md' },
  play: async ({ canvas }) => {
    await expectWordsAndChevrons(canvas);
    // Same height as the page buttons, whatever the size: the word does not grow the button.
    await expect(canvas.getByRole('button', { name: 'Previous page' }).offsetHeight).toBe(
      canvas.getByRole('button', { name: 'Page 5' }).offsetHeight
    );
  },
};

export const TextLabelsCompact: Story = {
  args: { page: 7, totalPages: 25, variant: 'compact', prevNextLabel: 'text' },
};

export const TextLabelsWithInfo: Story = {
  args: {
    page: 2,
    totalPages: 9,
    showInfo: true,
    pageSize: 10,
    total: 87,
    prevNextLabel: 'text',
  },
};

/** The words stay below `sm`: "Previous · Page 5 / 10 · Next" fits on one row. */
export const MobileTextLabels: Story = {
  globals: mobileViewport,
  args: {
    page: 5,
    totalPages: 10,
    showInfo: true,
    pageSize: 10,
    total: 100,
    prevNextLabel: 'text',
  },
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow(canvas.getByRole('navigation', { name: 'Pagination' }));
    await expectWordsAndChevrons(canvas);
    await expect(canvas.queryByRole('button', { name: 'Page 6' })).toBeNull();
    await expect(canvas.getByText(/^Page/)).toHaveTextContent('Page 5 / 10');
    // Previous, "Page 5 / 10" and Next share a row.
    const prev = canvas.getByRole('button', { name: 'Previous page' }).getBoundingClientRect();
    const next = canvas.getByRole('button', { name: 'Next page' }).getBoundingClientRect();
    await expect(Math.abs(prev.top - next.top)).toBeLessThan(1);
  },
};

/** The widest case below `sm`: the edges keep their icons around the two words. */
export const MobileTextLabelsWithEdges: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  args: { page: 5, totalPages: 10, showEdges: true, prevNextLabel: 'text' },
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow(canvas.getByRole('navigation', { name: 'Pagination' }));
    await expectWordsAndChevrons(canvas);
    await expect(canvas.getByRole('button', { name: 'First page' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Last page' })).toBeVisible();
  },
};

export const IconLabelsByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  args: { page: 5, totalPages: 10 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Previous page' })).toHaveTextContent('');
    await expect(canvas.getByRole('button', { name: 'Next page' })).toHaveTextContent('');
  },
};

export const TextLabelsLeaveEdgesAlone: Story = {
  tags: ['!dev', '!autodocs'],
  args: { page: 25, totalPages: 50, showEdges: true, prevNextLabel: 'text' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'First page' })).toHaveTextContent('');
    await expect(canvas.getByRole('button', { name: 'Last page' })).toHaveTextContent('');
    await expectWordsAndChevrons(canvas);
  },
};

export const TextPrevDisabledOnFirstPage: Story = {
  tags: ['!dev', '!autodocs'],
  args: { page: 1, totalPages: 10, prevNextLabel: 'text', onPageChange: fn() },
  play: async ({ args, canvas }) => {
    const prev = canvas.getByRole('button', { name: 'Previous page' });
    await expect(prev).toBeDisabled();
    // Same disabled state as the page buttons: dimmed to 40%, not clickable.
    await expect(getComputedStyle(prev).opacity).toBe('0.4');
    await expect(canvas.getByRole('button', { name: 'Next page' })).toBeEnabled();
    await userEvent.click(prev).catch(() => undefined);
    await expect(args.onPageChange).not.toHaveBeenCalled();
  },
};

export const TextNextDisabledOnLastPage: Story = {
  tags: ['!dev', '!autodocs'],
  args: { page: 10, totalPages: 10, prevNextLabel: 'text', onPageChange: fn() },
  play: async ({ args, canvas }) => {
    const next = canvas.getByRole('button', { name: 'Next page' });
    await expect(next).toBeDisabled();
    await expect(getComputedStyle(next).opacity).toBe('0.4');
    await expect(canvas.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    await userEvent.click(next).catch(() => undefined);
    await expect(args.onPageChange).not.toHaveBeenCalled();
  },
};

export const TextLabelsGoToNeighbourPage: Story = {
  tags: ['!dev', '!autodocs'],
  args: { page: 5, totalPages: 10, prevNextLabel: 'text', onPageChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Previous page' }));
    await expect(args.onPageChange).toHaveBeenLastCalledWith(4);
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(args.onPageChange).toHaveBeenLastCalledWith(6);
  },
};
