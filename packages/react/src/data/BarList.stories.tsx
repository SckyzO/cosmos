import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileText, Globe, Mail, Search, Users } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  expectFocusRing,
  expectGraphicContrast,
  expectNoHorizontalOverflow,
  expectTextContrast,
  inEachTheme,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';
import { BarList, type BarListItem } from './BarList';
import { TrendDelta } from './TrendDelta';

const meta = {
  title: 'Data/Bar List',
  component: BarList,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
  args: { items: [] },
} satisfies Meta<typeof BarList>;

export default meta;
type Story = StoryObj<typeof meta>;

const PAGES: BarListItem[] = [
  { id: 'home', label: 'Home', value: 12480 },
  { id: 'pricing', label: 'Pricing', value: 8230 },
  { id: 'docs', label: 'Documentation', value: 6410 },
  { id: 'blog', label: 'Blog', value: 3150 },
  { id: 'contact', label: 'Contact', value: 940 },
];

const COUNTRIES: BarListItem[] = [
  { id: 'us', label: 'United States', value: 48200, icon: '🇺🇸' },
  { id: 'de', label: 'Germany', value: 21400, icon: '🇩🇪' },
  { id: 'fr', label: 'France', value: 17900, icon: '🇫🇷' },
  { id: 'jp', label: 'Japan', value: 9600, icon: '🇯🇵' },
  { id: 'br', label: 'Brazil', value: 4100, icon: '🇧🇷' },
];

const trend = (value: number, goodDirection?: 'down') => (
  <TrendDelta value={value} size="sm" goodDirection={goodDirection} />
);

// The bar of a row: the filled part of the decorative track.
const fillOf = (row: Element) =>
  row.querySelector<HTMLElement>('[aria-hidden="true"] > span') as HTMLElement;
const trackOf = (row: Element) => fillOf(row).parentElement as HTMLElement;
const widthOf = (row: Element) =>
  fillOf(row).getBoundingClientRect().width / trackOf(row).getBoundingClientRect().width;

export const Default: Story = {
  args: { items: PAGES, 'aria-label': 'Top pages' },
};

/** `showRank` numbers the rows in the order they are shown and makes the list an `ol`. */
export const WithRank: Story = {
  args: { items: PAGES, showRank: true, 'aria-label': 'Top pages' },
};

/** `icon` takes an icon or a flag, before the label. */
export const WithIcons: Story = {
  args: {
    'aria-label': 'Traffic by source',
    items: [
      { id: 'search', label: 'Organic search', value: 31200, icon: <Search /> },
      { id: 'direct', label: 'Direct', value: 18400, icon: <Globe /> },
      { id: 'email', label: 'Email', value: 7300, icon: <Mail /> },
      { id: 'referral', label: 'Referral', value: 4900, icon: <Users /> },
    ],
  },
};

export const WithFlags: Story = {
  args: { items: COUNTRIES, showRank: true, 'aria-label': 'Traffic by country' },
};

/** The `delta` slot sits after the value and takes a small `TrendDelta`. */
export const WithDeltas: Story = {
  args: {
    'aria-label': 'Top pages',
    showRank: true,
    items: [
      { ...PAGES[0], delta: trend(12.4) },
      { ...PAGES[1], delta: trend(-3.1) },
      { ...PAGES[2], delta: trend(0) },
      { ...PAGES[3], delta: trend(-8.6, 'down') },
      { ...PAGES[4], delta: trend(24) },
    ],
  },
};

/** `hint` is muted text after the label; it truncates with it. */
export const WithHints: Story = {
  args: {
    'aria-label': 'Top pages',
    items: [
      { ...PAGES[0], hint: '/' },
      { ...PAGES[1], hint: '/pricing' },
      { ...PAGES[2], hint: '/docs' },
      { ...PAGES[3], hint: '/blog' },
    ],
  },
};

/** An item with `href` is one link: the whole row, with a hover tint and the package's focus ring. */
export const AsLinks: Story = {
  args: {
    'aria-label': 'Top pages',
    showRank: true,
    items: PAGES.map((page) => ({ ...page, href: `#${page.id}`, icon: <FileText /> })),
  },
};

/** `onItemClick` makes every row one button. */
export const AsButtons: Story = {
  args: { items: PAGES, showRank: true, onItemClick: fn(), 'aria-label': 'Top pages' },
};

/** `max` is what a full bar stands for: two lists given the same one share a scale. */
export const SharedMax: Story = {
  render: () => {
    const thisWeek = [
      { id: 'a', label: 'Home', value: 12480 },
      { id: 'b', label: 'Pricing', value: 8230 },
      { id: 'c', label: 'Docs', value: 6410 },
    ];
    const lastWeek = [
      { id: 'a', label: 'Home', value: 11100 },
      { id: 'b', label: 'Pricing', value: 9150 },
      { id: 'c', label: 'Docs', value: 3200 },
    ];
    return (
      <div className="grid gap-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">This week</h3>
          <BarList items={thisWeek} max={12480} aria-label="This week" />
        </section>
        <section>
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Last week</h3>
          <BarList items={lastWeek} max={12480} intent="info" aria-label="Last week" />
        </section>
      </div>
    );
  },
};

/** `intent` colors the bars of the list; an item's own `intent` wins for its row. */
export const Intents: Story = {
  args: {
    'aria-label': 'Error rate by service',
    intent: 'warning',
    formatValue: (value) => `${value}%`,
    items: [
      { id: 'api', label: 'API', value: 12, intent: 'danger' },
      { id: 'web', label: 'Web', value: 7 },
      { id: 'jobs', label: 'Jobs', value: 4 },
      { id: 'search', label: 'Search', value: 1, intent: 'success' },
    ],
  },
};

/** `sort="desc"` orders the rows by value; the rank follows the order shown. */
export const Sorted: Story = {
  args: {
    sort: 'desc',
    showRank: true,
    'aria-label': 'Top pages',
    items: [PAGES[3], PAGES[0], PAGES[4], PAGES[2], PAGES[1]],
  },
};

/** `formatValue` writes the value: a currency here. */
export const FormattedValues: Story = {
  args: {
    'aria-label': 'Revenue by product',
    formatValue: (value) => `$${(value / 1000).toFixed(1)}k`,
    items: [
      { id: 'pro', label: 'Pro plan', value: 48200 },
      { id: 'team', label: 'Team plan', value: 31900 },
      { id: 'addons', label: 'Add-ons', value: 6400 },
    ],
  },
};

/** Skeleton rows, as many as there are `items`, so the card does not jump when the data arrives. */
export const Loading: Story = {
  args: { items: PAGES, showRank: true, loading: true, 'aria-label': 'Top pages' },
};

export const Empty: Story = {
  args: { items: [] },
};

export const CustomEmptyMessage: Story = {
  args: { items: [], emptyMessage: 'No visits in this period' },
};

/** At 375px a long label truncates, the value (and the delta) stay visible, nothing widens the page. */
export const Mobile: Story = {
  globals: mobileViewport,
  args: {
    showRank: true,
    'aria-label': 'Top pages',
    items: [
      {
        id: 'long',
        label:
          'Getting started with the monitoring stack: installation, configuration and upgrades',
        value: 128430,
        delta: trend(12.4),
        icon: <FileText />,
        href: '#long',
      },
      {
        id: 'hint',
        label: 'Pricing',
        hint: '/pricing/enterprise/compare-plans/all-features',
        value: 8230,
        delta: trend(-3.1),
      },
      { id: 'short', label: 'Contact', value: 940, delta: trend(24) },
    ],
  },
  decorators: [
    (Story) => (
      <div>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas, canvasElement }) => {
    expectNoHorizontalOverflow();
    const rows = canvas.getAllByRole('listitem');
    const long = rows[0];
    // The truncating span wraps the label's `<bdi>`.
    const label = within(long).getByText(/Getting started/).parentElement!;
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    const value = within(long).getByText('128,430');
    expect(value).toBeVisible();
    expect(value.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth);
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

/** Each bar is its value over the largest one, 100% for the largest. */
export const BarWidthsFollowTheLargestValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    items: [
      { id: 'a', label: 'A', value: 200 },
      { id: 'b', label: 'B', value: 100 },
      { id: 'c', label: 'C', value: 50 },
    ],
  },
  play: async ({ canvas }) => {
    const [a, b, c] = canvas.getAllByRole('listitem');
    expect(widthOf(a)).toBeCloseTo(1, 2);
    expect(widthOf(b)).toBeCloseTo(0.5, 2);
    expect(widthOf(c)).toBeCloseTo(0.25, 2);
  },
};

/** `max` sets the scale: a full bar is `max`, and a value over it is capped. */
export const BarWidthsFollowMax: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    max: 400,
    items: [
      { id: 'a', label: 'A', value: 200 },
      { id: 'b', label: 'B', value: 100 },
      { id: 'c', label: 'C', value: 800 },
    ],
  },
  play: async ({ canvas }) => {
    const [a, b, c] = canvas.getAllByRole('listitem');
    expect(widthOf(a)).toBeCloseTo(0.5, 2);
    expect(widthOf(b)).toBeCloseTo(0.25, 2);
    expect(widthOf(c)).toBeCloseTo(1, 2);
  },
};

/** A zero draws no bar, and a list of zeros does not divide by zero. */
export const ZeroValuesDrawNoBar: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-6">
      <div data-testid="mixed">
        <BarList
          items={[
            { id: 'a', label: 'A', value: 10 },
            { id: 'b', label: 'B', value: 0 },
          ]}
        />
      </div>
      <div data-testid="zeros">
        <BarList
          items={[
            { id: 'a', label: 'A', value: 0 },
            { id: 'b', label: 'B', value: 0 },
          ]}
        />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const [a, b] = within(canvas.getByTestId('mixed')).getAllByRole('listitem');
    expect(widthOf(a)).toBeCloseTo(1, 2);
    expect(widthOf(b)).toBe(0);
    for (const row of within(canvas.getByTestId('zeros')).getAllByRole('listitem')) {
      expect(widthOf(row)).toBe(0);
      expect(fillOf(row).style.width).toBe('0%');
    }
  },
};

/** Equal values all fill their bar. */
export const EqualValuesFillEveryBar: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    items: [
      { id: 'a', label: 'A', value: 7 },
      { id: 'b', label: 'B', value: 7 },
      { id: 'c', label: 'C', value: 7 },
    ],
  },
  play: async ({ canvas }) => {
    for (const row of canvas.getAllByRole('listitem')) expect(widthOf(row)).toBeCloseTo(1, 2);
  },
};

/** The bar repeats the value: no role, hidden from assistive technology. The value is text. */
export const BarIsDecorative: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: PAGES, 'aria-label': 'Top pages' },
  play: async ({ canvas, canvasElement }) => {
    expect(canvas.queryAllByRole('progressbar')).toHaveLength(0);
    expect(canvas.queryAllByRole('img')).toHaveLength(0);
    for (const row of canvas.getAllByRole('listitem')) {
      expect(trackOf(row)).toHaveAttribute('aria-hidden', 'true');
    }
    expect(canvas.getByText('12,480')).toBeVisible();
    expect(canvasElement.querySelectorAll('a, button')).toHaveLength(0);
  },
};

/** An unranked list is a `ul`, a ranked one an `ol`; the rank follows the displayed order. */
export const RankedListIsAnOl: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid gap-6">
      <div data-testid="plain">
        <BarList items={PAGES} />
      </div>
      <div data-testid="ranked">
        <BarList items={[PAGES[3], PAGES[0], PAGES[1]]} showRank sort="desc" />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const plain = canvas.getByTestId('plain').firstElementChild as HTMLElement;
    const ranked = canvas.getByTestId('ranked').firstElementChild as HTMLElement;
    expect(plain.tagName).toBe('UL');
    expect(ranked.tagName).toBe('OL');
    const rows = within(ranked).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringMatching(/^1Home/),
      expect.stringMatching(/^2Pricing/),
      expect.stringMatching(/^3Blog/),
    ]);
    // The bars of every row start at the same place, rank or not.
    const offsets = rows.map((row) => startOffset(trackOf(row), ranked));
    expect(new Set(offsets).size).toBe(1);
    expect(offsets[0]).toBeGreaterThan(0);
  },
};

/** The bar is thin and fully rounded, and the label is named in full on hover. */
export const BarIsThin: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: PAGES },
  play: async ({ canvas }) => {
    const row = canvas.getAllByRole('listitem')[0];
    expect(trackOf(row).getBoundingClientRect().height).toBe(6);
    expect(getComputedStyle(trackOf(row)).borderTopLeftRadius).not.toBe('0px');
    expect(within(row).getByText('Home').closest('[title]')).toHaveAttribute('title', 'Home');
  },
};

/** Fill against track and value against the card: readable in the four themes. */
export const ContrastInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: PAGES, showRank: true },
  play: async ({ canvas }) => {
    const row = canvas.getAllByRole('listitem')[0];
    inEachTheme(() => {
      expectGraphicContrast(fillOf(row), 'backgroundColor');
      expectTextContrast(within(row).getByText('12,480'));
      expectTextContrast(within(row).getByText('Home'));
      expectTextContrast(within(row).getByText('1'));
    });
  },
};

/** A linked row is one tab stop named by its content, with the package's focus ring. */
export const LinkedRowsAreFocusableWithKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: PAGES.slice(0, 3).map((page) => ({ ...page, href: `#${page.id}` })) },
  play: async ({ canvas, canvasElement }) => {
    const links = canvas.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAccessibleName(/Home.*12,480/);
    expect(links[0]).toHaveAttribute('href', '#home');
    expect(canvasElement.querySelectorAll('a a, a button, button a')).toHaveLength(0);
    await expectFocusRing(links[0], { inset: true });
    await userEvent.tab();
    expect(links[1]).toHaveFocus();
    await userEvent.tab();
    expect(links[2]).toHaveFocus();
  },
};

/** With `onItemClick` each row is a button; Enter and Space activate the focused one. */
export const ButtonRowsRespondToKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: PAGES.slice(0, 3), onItemClick: fn() },
  play: async ({ canvas, args }) => {
    const buttons = canvas.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    await expectFocusRing(buttons[0], { inset: true });
    await userEvent.tab();
    expect(buttons[1]).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await userEvent.click(buttons[2]);
    expect(args.onItemClick).toHaveBeenCalledTimes(3);
    expect(args.onItemClick).toHaveBeenNthCalledWith(1, PAGES[1]);
    expect(args.onItemClick).toHaveBeenNthCalledWith(3, PAGES[2]);
  },
};

/** An item with `href` stays a link when `onItemClick` is set, and the click is reported. */
export const LinkWinsOverButton: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    items: [{ ...PAGES[0], href: '#home' }, PAGES[1]],
    onItemClick: fn(),
  },
  play: async ({ canvas, args }) => {
    expect(canvas.getAllByRole('link')).toHaveLength(1);
    expect(canvas.getAllByRole('button')).toHaveLength(1);
    const link = canvas.getByRole('link', { name: /Home/ });
    // The click must not follow the href: the test page would navigate away.
    link.addEventListener('click', (event) => event.preventDefault());
    await userEvent.click(link);
    expect(args.onItemClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'home' }));
  },
};

/** Loading: busy, as many rows as items, the same height as the loaded list, nothing to focus. */
export const LoadingKeepsHeight: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid w-[420px] grid-cols-2 items-start gap-6">
      <div data-testid="loaded">
        <BarList items={PAGES} showRank />
      </div>
      <div data-testid="loading">
        <BarList items={PAGES} showRank loading />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const loaded = canvas.getByTestId('loaded').firstElementChild as HTMLElement;
    const loading = canvas.getByTestId('loading').firstElementChild as HTMLElement;
    expect(loading).toHaveAttribute('aria-busy', 'true');
    expect(loaded).not.toHaveAttribute('aria-busy');
    expect(within(loading).getAllByRole('listitem')).toHaveLength(PAGES.length);
    expect(loading.querySelectorAll('a, button')).toHaveLength(0);
    expect(loading.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(within(loading).queryByText('Home')).toBeNull();
    expect(loading.getBoundingClientRect().height).toBe(loaded.getBoundingClientRect().height);
  },
};

/** Five skeleton rows when nothing is known yet. */
export const LoadingWithoutItemsShowsFiveRows: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: [], loading: true },
  play: async ({ canvas }) => {
    expect(canvas.getAllByRole('listitem')).toHaveLength(5);
  },
};

/** No items: the message in place of the list, no empty `ul`. */
export const EmptyShowsMessage: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: [], emptyMessage: 'Nothing here yet' },
  play: async ({ canvas }) => {
    expect(canvas.getByText('Nothing here yet')).toBeVisible();
    expect(canvas.queryByRole('list')).toBeNull();
  },
};

/** The first row of a list sorted `desc` is the largest, whatever order the host passed. */
export const SortDescOrdersByValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: [PAGES[3], PAGES[0], PAGES[1]], sort: 'desc' },
  play: async ({ canvas }) => {
    const rows = canvas.getAllByRole('listitem');
    expect(within(rows[0]).getByText('Home')).toBeVisible();
    expect(widthOf(rows[0])).toBeCloseTo(1, 2);
    expect(within(rows[2]).getByText('Blog')).toBeVisible();
  },
};
