import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PageBreadcrumb } from './PageBreadcrumb';

const meta = {
  title: 'Navigation/Page Breadcrumb',
  component: PageBreadcrumb,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { items: [] },
} satisfies Meta<typeof PageBreadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Library', href: '/library' },
      { label: 'Components', href: '/library/components' },
      { label: 'Breadcrumb' },
    ],
  },
};

export const TwoLevels: Story = {
  args: {
    items: [{ label: 'Home', href: '/' }, { label: 'Settings' }],
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** The path is an ordered list: each ancestor a link, the last item the page, as plain text. */
export const AncestorsAreLinksAndTheLastIsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: Default.args,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(within(nav).getAllByRole('listitem')).toHaveLength(4);
    const links = within(nav).getAllByRole('link');
    await expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Home', '/'],
      ['Library', '/library'],
      ['Components', '/library/components'],
    ]);
    await expect(within(nav).getByText('Breadcrumb').closest('a, button')).toBeNull();

    for (const link of links) {
      await userEvent.tab();
      await expect(link).toHaveFocus();
    }
    await userEvent.tab();
    await expect(nav.contains(document.activeElement)).toBe(false);
  },
};

/** The last item is the current page, said as such to assistive technology; no other item is. */
export const LastItemIsTheCurrentPage: Story = {
  tags: ['!dev', '!autodocs'],
  args: Default.args,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(within(nav).getByText('Breadcrumb')).toHaveAttribute('aria-current', 'page');
    await expect(nav.querySelectorAll('[aria-current]')).toHaveLength(1);
  },
};

/** An item with `onClick` is a button that calls it, even with an `href`; with neither, a link to `#`. */
export const ClickHandlersMakeButtons: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    items: [
      { label: 'Home', onClick: fn() },
      { label: 'Library', href: '/library', onClick: fn() },
      { label: 'Components' },
      { label: 'Breadcrumb' },
    ],
  },
  play: async ({ args, canvas }) => {
    const [home, library] = args.items;
    await userEvent.click(canvas.getByRole('button', { name: 'Home' }));
    await expect(home.onClick).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('link', { name: 'Library' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Library' }));
    await expect(library.onClick).toHaveBeenCalledTimes(1);
    await expect(home.onClick).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('link', { name: 'Components' })).toHaveAttribute('href', '#');
  },
};
