import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { Box, Building2, Cpu, Server } from 'lucide-react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Breadcrumb } from './Breadcrumb';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectMirrored,
  expectNoHorizontalOverflow,
  mobileViewport,
  portalDocsParams,
} from '../storybook-helpers';

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

/** The page-header path: a Home icon on the first item, the rest as usual. */
export const HomeIcon: Story = {
  args: {
    items: [
      { label: 'Overview', href: '/' },
      { label: 'Monitoring', href: '/monitoring' },
      { label: 'Production' },
    ],
    homeIcon: true,
  },
};

export const SeparatorSlash: Story = { args: { items: PATH, separator: 'slash' } };

export const SeparatorDot: Story = { args: { items: PATH, separator: 'dot' } };

export const SeparatorCustom: Story = {
  args: {
    items: PATH,
    separator: (
      <span className="inline-block text-xs text-[var(--color-text-muted)] rtl:-scale-x-100">
        →
      </span>
    ),
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
          <Breadcrumb items={PATH} separator={sep} aria-label={`Breadcrumb, ${sep} separator`} />
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

/** `aria-label` renames the landmark, so several breadcrumbs on a page stay distinguishable. */
export const AriaLabelNamesTheLandmark: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: PATH, 'aria-label': 'You are here' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('navigation', { name: 'You are here' })).toBeInTheDocument();
    await expect(canvas.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull();
  },
};

/** The last item is the current page, said as such to assistive technology; no other item is. */
export const LastItemIsTheCurrentPage: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: PATH },
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(nav.querySelector('[aria-current]')).toHaveTextContent('Breadcrumb');
    await expect(nav.querySelector('[aria-current]')).toHaveAttribute('aria-current', 'page');
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
    // The prop is `() => void`: the click event stays with the button.
    await expect(home.onClick).toHaveBeenCalledWith();
    // `onClick` wins over `href`.
    await expect(canvas.queryByRole('link', { name: 'Library' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Library' }));
    await expect(library.onClick).toHaveBeenCalledTimes(1);
    await expect(home.onClick).toHaveBeenCalledTimes(1);
    // No `href`, no `onClick`: a link to `#`.
    await expect(canvas.getByRole('link', { name: 'Components' })).toHaveAttribute('href', '#');
  },
};

// ── Long trails and narrow screens (#291) ────────────────────────────────────

const DEEP_PATH = [
  { icon: Building2, label: 'DC Paris', href: '#' },
  { icon: Server, label: 'Room A', onClick: fn() },
  { label: 'Aisle 03', onClick: fn() },
  { icon: Box, label: 'Rack 01-A', href: '#' },
  { label: 'Chassis 4', href: '#' },
  { icon: Cpu, label: 'server-alpha-01-with-a-very-long-hostname' },
];

/** `maxItems` keeps the first crumb and the last ones; the crumbs between collapse into a menu. */
export const CollapsedMiddle: Story = {
  parameters: portalDocsParams.lg(),
  args: { items: DEEP_PATH, maxItems: 3 },
};

export const CollapsedMiddleChecks: Story = {
  ...CollapsedMiddle,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    // First and last two crumbs stay; the middle three are in the menu.
    await expect(within(nav).getByRole('link', { name: 'DC Paris' })).toBeVisible();
    await expect(within(nav).getByRole('link', { name: 'Chassis 4' })).toBeVisible();
    await expect(nav.querySelector('[aria-current]')).toHaveTextContent(/server-alpha-01/);
    await expect(within(nav).queryByText('Room A')).toBeNull();

    const menu = within(document.body);
    await userEvent.click(within(nav).getByRole('button', { name: 'Show 3 more pages' }));
    await userEvent.click(await menu.findByRole('menuitem', { name: 'Room A' }));
    await expect(args.items[1].onClick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(menu.queryByRole('menu')).toBeNull());
  },
};

export const MenuListsTheHiddenCrumbsInOrder: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams.lg(),
  args: { items: DEEP_PATH, maxItems: 3 },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show 3 more pages' }));
    const items = await within(document.body).findAllByRole('menuitem');
    await expect(items.map((item) => item.textContent)).toEqual([
      'Room A',
      'Aisle 03',
      'Rack 01-A',
    ]);
    // Like the visible crumbs: a crumb with onClick is a button, one with href a link.
    await expect(items[0].tagName).toBe('BUTTON');
    await expect(items[2].tagName).toBe('A');
    await expect(items[2]).toHaveAttribute('href', '#');
  },
};

export const ShortTrailIsNotCollapsed: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: PATH, maxItems: 6 },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: /more pages/ })).toBeNull();
    await expect(canvas.getAllByRole('link').length + 1).toBe(PATH.length);
  },
};

/** Below `sm` the labels truncate and the current crumb stays in view. */
const mobile: Story = {
  globals: mobileViewport,
  args: { items: DEEP_PATH, maxItems: 3 },
};

export const MobileChecks: Story = {
  ...mobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    expectNoHorizontalOverflow(nav);
    const current = within(nav)
      .getByText(/server-alpha-01/)
      .closest('[aria-current]')!;
    await expect(endOffset(current, nav)).toBeGreaterThanOrEqual(0);
    // The label is cut with an ellipsis, not clipped mid-word.
    const label = current.querySelector('span')!;
    await expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
  },
};

const mobileWithIcons: Story = {
  globals: mobileViewport,
  args: {
    items: [
      { icon: Building2, label: 'DC Paris', href: '#' },
      { icon: Server, label: 'Room A', href: '#' },
      { icon: Box, label: 'Rack 01-A', href: '#' },
      { icon: Cpu, label: 'server-alpha-01' },
    ],
  },
};

export const MobileWithIconsChecks: Story = {
  ...mobileWithIcons,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow(canvas.getByRole('navigation', { name: 'Breadcrumb' }));
  },
};

// ── Folding on a phone (#634) ───────────────────────────────────────────────

/** Whether a crumb's label is cut: its text is wider than the room the crumb gives it. */
const isCut = (crumb: Element) => {
  const label = crumb.querySelector('.truncate')!;
  return label.scrollWidth > label.clientWidth;
};

/** The trail in a box `width` px wide, the one `play` resizes through `data-testid="box"`. */
const inBox =
  (width: number): Decorator =>
  (Story) => (
    <div data-testid="box" style={{ width }}>
      <Story />
    </div>
  );

/** The crumbs of a trail, the current page last: the links and buttons, then the current crumb. */
const crumbs = (nav: HTMLElement) => [
  ...nav.querySelectorAll('a, button:not([aria-haspopup]), [aria-current="page"]'),
];

/**
 * On a phone (a 375px screen less its 16px gutters), a trail that doesn't fit folds its middle
 * crumbs into the "…" menu, as few as it needs: the first crumb and the current page read whole.
 */
export const PhoneFoldsTheMiddleCrumbs: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  decorators: [inBox(343)],
  args: { items: PATH },
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    expectNoHorizontalOverflow(nav);
    for (const crumb of crumbs(nav)) await expect(isCut(crumb), crumb.textContent!).toBe(false);
    await expect(within(nav).getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(nav.querySelector('[aria-current="page"]')).toHaveTextContent('Breadcrumb');
    await userEvent.click(within(nav).getByRole('button', { name: 'Show 2 more pages' }));
    const items = await within(document.body).findAllByRole('menuitem');
    await expect(items.map((item) => item.textContent)).toEqual(['Library', 'Components']);
  },
};

/** The crumbs come back when the box grows, and go again when it narrows. */
export const PhoneUnfoldsWhenTheBoxGrows: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  decorators: [inBox(200)],
  args: { items: [PATH[0], PATH[1], PATH[3]] },
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(within(nav).getByRole('button', { name: 'Show 1 more page' })).toBeVisible();
    canvas.getByTestId('box').style.width = '343px';
    await waitFor(() => expect(within(nav).getByRole('link', { name: 'Library' })).toBeVisible());
    await expect(within(nav).queryByRole('button', { name: /more page/ })).toBeNull();
    canvas.getByTestId('box').style.width = '200px';
    await waitFor(() => expect(within(nav).queryByRole('link', { name: 'Library' })).toBeNull());
  },
};

/** A trail that fits a phone is drawn whole. */
export const PhoneKeepsATrailThatFits: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  decorators: [inBox(343)],
  args: { items: [PATH[0], { label: 'Orders', href: '#' }, { label: '#20431' }] },
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(within(nav).queryByRole('button', { name: /more page/ })).toBeNull();
    await expect(within(nav).getAllByRole('link')).toHaveLength(2);
    for (const crumb of crumbs(nav)) await expect(isCut(crumb), crumb.textContent!).toBe(false);
  },
};

/** A host's `maxItems` wins on a phone: the trail folds what it says, and the labels give way. */
export const PhoneKeepsTheHostsMaxItems: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  decorators: [inBox(200)],
  args: { items: PATH, maxItems: PATH.length },
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(within(nav).queryByRole('button', { name: /more page/ })).toBeNull();
    await expect(within(nav).getAllByRole('link')).toHaveLength(3);
    expectNoHorizontalOverflow(nav);
  },
};

/** Above `sm`, a box too narrow for the trail cuts the labels and folds nothing. */
export const WideScreenNarrowBoxFoldsNothing: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: [inBox(200)],
  args: { items: PATH },
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(within(nav).queryByRole('button', { name: /more page/ })).toBeNull();
    await expect(within(nav).getAllByRole('link')).toHaveLength(3);
  },
};

/** `homeIcon` puts one icon, named "Home", on the first crumb only; an item's own `icon` wins. */
export const HomeIconIsNamedAndOnTheFirstCrumbOnly: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...HomeIcon.args, 'aria-label': 'Path' },
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Path' });
    const icon = within(nav).getByRole('img', { name: 'Home' });
    await expect(within(nav).getAllByRole('img')).toHaveLength(1);
    await expect(
      within(nav)
        .getByRole('link', { name: /Overview/ })
        .contains(icon)
    ).toBe(true);
  },
};

export const OwnIconBeatsHomeIcon: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    items: [{ icon: Building2, label: 'DC Paris', href: '/' }, { label: 'Room A' }],
    homeIcon: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('img', { name: 'Home' })).toBeNull();
  },
};

/** The icon is also the first crumb when the path has a single item (the current page). */
export const HomeIconOnASingleCrumb: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: [{ label: 'Overview' }], homeIcon: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Home' })).toBeInTheDocument();
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The trail starts at the start edge, its separators point the other way, and a label is an island. */
export const MirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Library', href: '/library' },
      { label: 'Breadcrumb' },
    ],
  },
  render: (args) => {
    // Both copies are on the page: each landmark needs a name of its own.
    let count = 0;
    return bothDirections(() => <Breadcrumb {...args} aria-label={`Trail ${++count}`} />);
  },
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => within(box).getByRole('link', { name: 'Home' }));
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      for (const separator of box.querySelectorAll('nav > div > svg')) {
        expect(getComputedStyle(separator).scale, dir).toBe(dir === 'rtl' ? '-1 1' : 'none');
      }
      expect(getComputedStyle(within(box).getByText('Home')).unicodeBidi).toBe('isolate');
    }
  },
};
