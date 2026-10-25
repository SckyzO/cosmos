import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { Pagination } from './Pagination';

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
  args: { page: 5, totalPages: 10, onPageChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /previous/i }));
    await expect(args.onPageChange).toHaveBeenCalledWith(4);
  },
};

export const NextAdvancesPage: Story = {
  args: { page: 5, totalPages: 10, onPageChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /next/i }));
    await expect(args.onPageChange).toHaveBeenCalledWith(6);
  },
};

export const ActivePageHasAriaCurrent: Story = {
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
