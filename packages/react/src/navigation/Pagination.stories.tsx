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
            Currently viewing items{' '}
            <span className="font-mono">{(page - 1) * pageSize + 1}</span>–
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
