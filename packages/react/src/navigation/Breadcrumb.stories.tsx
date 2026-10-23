import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Building2, Cpu, Server } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Breadcrumb } from './Breadcrumb';

const meta = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { items: [] },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcons: Story = {
  args: {
    items: [
      { icon: Building2, label: 'DC Paris', href: '#' },
      { icon: Server, label: 'Room A', href: '#' },
      { icon: Box, label: 'Rack 01-A', href: '#' },
      { icon: Cpu, label: 'server-alpha-01' },
    ],
  },
};

export const SimpleText: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Library', href: '/library' },
      { label: 'Components', href: '/library/components' },
      { label: 'Breadcrumb' },
    ],
  },
};

const PATH = [
  { label: 'Home', href: '/' },
  { label: 'Library', href: '/library' },
  { label: 'Components', href: '/library/components' },
  { label: 'Breadcrumb' },
];

export const SeparatorSlash: Story = { args: { items: PATH, separator: 'slash' } };

export const SeparatorDot: Story = { args: { items: PATH, separator: 'dot' } };

export const SeparatorCustom: Story = {
  args: {
    items: PATH,
    separator: <span className="text-xs text-[var(--color-text-muted)]">→</span>,
  },
};

export const SeparatorMatrix: Story = {
  render: () => (
    <div className="space-y-3">
      {(['chevron', 'slash', 'dot'] as const).map((sep) => (
        <div key={sep} className="flex items-center gap-3">
          <span className="w-16 font-mono text-[10px] text-[var(--color-text-muted)] uppercase">
            {sep}
          </span>
          <Breadcrumb items={PATH} separator={sep} />
        </div>
      ))}
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** Every item but the last is a link, in the tab order; the last is the page, as plain text. */
export const AncestorsAreLinksAndTheLastIsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: PATH, separator: 'slash' },
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
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

    // The separators are decoration: hidden from assistive technology.
    const slashes = within(nav).getAllByText('/');
    await expect(slashes).toHaveLength(PATH.length - 1);
    for (const slash of slashes) await expect(slash).toHaveAttribute('aria-hidden', 'true');
  },
};

/** The last item is the current page, said as such to assistive technology; no other item is. */
export const LastItemIsTheCurrentPage: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: PATH },
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(within(nav).getByText('Breadcrumb')).toHaveAttribute('aria-current', 'page');
    await expect(nav.querySelectorAll('[aria-current]')).toHaveLength(1);
  },
};

/** An item with `onClick` is a button that calls it; an `href` alone, or nothing, makes a link. */
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
    // `onClick` wins over `href`.
    await expect(canvas.queryByRole('link', { name: 'Library' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Library' }));
    await expect(library.onClick).toHaveBeenCalledTimes(1);
    await expect(home.onClick).toHaveBeenCalledTimes(1);
    // No `href`, no `onClick`: a link to `#`.
    await expect(canvas.getByRole('link', { name: 'Components' })).toHaveAttribute('href', '#');
  },
};
