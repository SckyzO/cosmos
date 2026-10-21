import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Mail, Phone } from 'lucide-react';
import { placeholderAvatar } from '../storybook-avatars';
import { GridList } from './GridList';

const meta = {
  title: 'Lists/Grid List',
  component: GridList,
  subcomponents: {
    'GridList.Card': GridList.Card,
    'GridList.Footer': GridList.Footer,
    'GridList.FooterAction': GridList.FooterAction,
  },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof GridList>;

export default meta;
type Story = StoryObj<typeof meta>;

const PEOPLE = [
  { name: 'Aiden Park', role: 'SRE Lead', img: placeholderAvatar('Aiden Park', 96), admin: true },
  { name: 'Mei Tanaka', role: 'Platform Engineer', img: placeholderAvatar('Mei Tanaka', 96) },
  { name: 'Olivier Dubois', role: 'Observability', img: placeholderAvatar('Olivier Dubois', 96) },
  { name: 'Priya Singh', role: 'Backend Engineer', img: placeholderAvatar('Priya Singh', 96) },
  { name: 'Marcus Bell', role: 'Security', img: placeholderAvatar('Marcus Bell', 96), admin: true },
  { name: 'Aubrey Pham', role: 'Frontend Engineer', img: placeholderAvatar('Aubrey Pham', 96) },
];

// TUI Plus pattern "Contact cards with small portraits" — 3-col grid of
// contact cards with split Email/Call footer.
export const ContactCardsWithSmallPortraits: Story = {
  render: () => (
    <GridList cols={3}>
      {PEOPLE.map((p) => (
        <GridList.Card key={p.name}>
          <div className="flex w-full items-center justify-between gap-x-6 p-6">
            <div className="min-w-0 flex-1 truncate">
              <div className="flex items-center gap-x-3">
                <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {p.name}
                </h3>
                {p.admin && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/30">
                    Admin
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{p.role}</p>
            </div>
            <img alt="" src={p.img} className="size-10 shrink-0 rounded-full bg-gray-300" />
          </div>
          <GridList.Footer>
            <GridList.FooterAction
              href={`mailto:${p.name.toLowerCase().replace(' ', '.')}@example.com`}
            >
              <Mail className="size-5 text-gray-400" aria-hidden />
              Email<span className="sr-only"> {p.name}</span>
            </GridList.FooterAction>
            <GridList.FooterAction index={1} href={`tel:+33000000000`}>
              <Phone className="size-5 text-gray-400" aria-hidden />
              Call<span className="sr-only"> {p.name}</span>
            </GridList.FooterAction>
          </GridList.Footer>
        </GridList.Card>
      ))}
    </GridList>
  ),
  play: async ({ canvas }) => {
    // Each Email / Call link names its person for screen readers.
    for (const p of PEOPLE) {
      await expect(canvas.getByRole('link', { name: `Email ${p.name}` })).toBeInTheDocument();
      await expect(canvas.getByRole('link', { name: `Call ${p.name}` })).toBeInTheDocument();
    }
  },
};

// Simple 2-column grid without footer.
export const SimpleTwoColumn: Story = {
  render: () => (
    <GridList cols={2}>
      {PEOPLE.slice(0, 4).map((p) => (
        <GridList.Card key={p.name}>
          {/* One section: the card draws a divider between its direct children. */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{p.role}</p>
          </div>
        </GridList.Card>
      ))}
    </GridList>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RootIsUlGrid: Story = {
  render: () => (
    <GridList data-testid="gl">
      <GridList.Card>x</GridList.Card>
    </GridList>
  ),
  play: async ({ canvasElement }) => {
    const ul = canvasElement.querySelector('ul[data-testid="gl"]');
    await expect(ul).not.toBeNull();
    await expect(ul?.className ?? '').toMatch(/grid/);
  },
};

export const ColsPropMapsToGridCols: Story = {
  render: () => (
    <GridList cols={4} data-testid="gl">
      <GridList.Card>x</GridList.Card>
    </GridList>
  ),
  play: async ({ canvasElement }) => {
    const ul = canvasElement.querySelector('ul[data-testid="gl"]');
    await expect(ul?.className ?? '').toMatch(/xl:grid-cols-4/);
  },
};

/**
 * Each footer action rounds the card corner it sits in, so its hover background
 * follows the card: the first the bottom-left, the last the bottom-right.
 */
export const FooterActionsRoundTheirOuterCorner: Story = {
  render: () => (
    <GridList cols={2}>
      <GridList.Card>
        <div className="p-6 text-sm font-medium text-gray-900 dark:text-white">Two actions</div>
        <GridList.Footer>
          <GridList.FooterAction href="mailto:aiden.park@example.com">Email</GridList.FooterAction>
          <GridList.FooterAction index={1} href="tel:+33000000000">
            Call
          </GridList.FooterAction>
        </GridList.Footer>
      </GridList.Card>
      <GridList.Card>
        <div className="p-6 text-sm font-medium text-gray-900 dark:text-white">One action</div>
        <GridList.Footer>
          <GridList.FooterAction href="/people/aiden.park">View profile</GridList.FooterAction>
        </GridList.Footer>
      </GridList.Card>
    </GridList>
  ),
  play: async ({ canvas }) => {
    const corners = (name: string) => {
      const style = getComputedStyle(canvas.getByRole('link', { name }));
      return [style.borderBottomLeftRadius !== '0px', style.borderBottomRightRadius !== '0px'];
    };
    await expect(corners('Email')).toEqual([true, false]);
    await expect(corners('Call')).toEqual([false, true]);
    await expect(corners('View profile')).toEqual([true, true]);
  },
};

export const FooterActionAddsMlPxAfterFirst: Story = {
  render: () => (
    <GridList>
      <GridList.Card>
        <GridList.Footer>
          <GridList.FooterAction href="#">A</GridList.FooterAction>
          <GridList.FooterAction href="#" index={1} data-testid="b">
            B
          </GridList.FooterAction>
        </GridList.Footer>
      </GridList.Card>
    </GridList>
  ),
  play: async ({ canvasElement }) => {
    const wrap = canvasElement.querySelector('[data-testid="b"]')?.parentElement;
    await expect(wrap?.className ?? '').toMatch(/-ml-px/);
  },
};
