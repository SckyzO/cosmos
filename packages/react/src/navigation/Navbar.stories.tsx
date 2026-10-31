import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Bell, Plus } from 'lucide-react';
import { placeholderAvatar } from '../storybook-avatars';
import { directionBox, endOffset, expectFocusRing, startOffset } from '../storybook-helpers';
import { Navbar } from './Navbar';
import { Button } from '../ui/Button';
import { Menu } from '../ui/Menu';

const meta = {
  title: 'Navigation/Navbar',
  component: Navbar,
  subcomponents: {
    'Navbar.Brand': Navbar.Brand,
    'Navbar.Items': Navbar.Items,
    'Navbar.Item': Navbar.Item,
    'Navbar.Menu': Navbar.Menu,
    'Navbar.Actions': Navbar.Actions,
    'Navbar.MobileMenuButton': Navbar.MobileMenuButton,
  },
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Avatar = () => (
  <img
    alt=""
    src={placeholderAvatar('cosmos-navbar-demo', 96)}
    className="size-8 rounded-full bg-gray-700"
  />
);

const BellIcon = ({ tone = 'dark' }: { tone?: 'dark' | 'light' }) => (
  <button
    type="button"
    aria-label="Notifications"
    className={
      tone === 'dark'
        ? 'relative rounded-full p-1 text-gray-400 hover:text-white'
        : 'relative rounded-full p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
    }
  >
    <Bell className="size-6" aria-hidden />
  </button>
);

// TUI Plus pattern "Simple dark with menu button on left" (the start of the line) — dark bg, hamburger
// on mobile, brand + items + actions (bell + avatar).
export const SimpleDarkMenuAtStart: Story = {
  render: () => (
    <Navbar theme="dark">
      <Navbar.Brand>
        <Navbar.MobileMenuButton theme="dark" />
        <span className="ms-2 text-lg font-semibold text-white">Acme</span>
        <Navbar.Items>
          <Navbar.Item theme="dark" active href="#">
            Dashboard
          </Navbar.Item>
          <Navbar.Item theme="dark" href="#">
            Team
          </Navbar.Item>
          <Navbar.Item theme="dark" href="#">
            Projects
          </Navbar.Item>
          <Navbar.Item theme="dark" href="#">
            Calendar
          </Navbar.Item>
        </Navbar.Items>
      </Navbar.Brand>
      <Navbar.Actions>
        <BellIcon />
        <Avatar />
      </Navbar.Actions>
    </Navbar>
  ),
};

// TUI Plus pattern "Dark with quick action" — same as above + a prominent
// quick-action primary button before the notification bell.
export const DarkWithQuickAction: Story = {
  render: () => (
    <Navbar theme="dark">
      <Navbar.Brand>
        <Navbar.MobileMenuButton theme="dark" />
        <span className="ms-2 text-lg font-semibold text-white">Acme</span>
        <Navbar.Items>
          <Navbar.Item theme="dark" active href="#">
            Dashboard
          </Navbar.Item>
          <Navbar.Item theme="dark" href="#">
            Team
          </Navbar.Item>
          <Navbar.Item theme="dark" href="#">
            Projects
          </Navbar.Item>
          <Navbar.Item theme="dark" href="#">
            Calendar
          </Navbar.Item>
        </Navbar.Items>
      </Navbar.Brand>
      <Navbar.Actions>
        <Button size="sm" icon={Plus}>
          New Job
        </Button>
        <BellIcon />
        <Avatar />
      </Navbar.Actions>
    </Navbar>
  ),
};

// Light variant — same structure, light surface.
export const Light: Story = {
  render: () => (
    <Navbar theme="light">
      <Navbar.Brand>
        <Navbar.MobileMenuButton theme="light" />
        <span className="ms-2 text-lg font-semibold text-gray-900 dark:text-white">Cosmos</span>
        <Navbar.Items>
          <Navbar.Item theme="light" active href="#">
            Dashboard
          </Navbar.Item>
          <Navbar.Item theme="light" href="#">
            Hosts
          </Navbar.Item>
          <Navbar.Item theme="light" href="#">
            Alerts
          </Navbar.Item>
          <Navbar.Item theme="light" href="#">
            Logs
          </Navbar.Item>
        </Navbar.Items>
      </Navbar.Brand>
      <Navbar.Actions>
        <BellIcon tone="light" />
        <Avatar />
      </Navbar.Actions>
    </Navbar>
  ),
};

// A dropdown group of links: the trigger shows as active while one of its links is the page.
export const WithMenus: Story = {
  render: () => (
    <Navbar>
      <Navbar.Brand>
        <Navbar.MobileMenuButton />
        <span className="ms-2 text-lg font-semibold text-gray-900 dark:text-white">Cosmos</span>
        <Navbar.Items>
          <Navbar.Item active href="#">
            Dashboard
          </Navbar.Item>
          <Navbar.Menu label="Monitoring">
            <Menu.Item href="#">Hosts</Menu.Item>
            <Menu.Item href="#">Alerts</Menu.Item>
            <Menu.Item href="#">Logs</Menu.Item>
          </Navbar.Menu>
          <Navbar.Menu label="Settings" active>
            <Menu.Item href="#">Profile</Menu.Item>
            <Menu.Item href="#" aria-current="page">
              Team
            </Menu.Item>
            <Menu.Item href="#">Billing</Menu.Item>
          </Navbar.Menu>
        </Navbar.Items>
      </Navbar.Brand>
      <Navbar.Actions>
        <BellIcon tone="light" />
        <Avatar />
      </Navbar.Actions>
    </Navbar>
  ),
};

const OVERFLOW_ITEMS = ['Dashboard', 'Hosts', 'Alerts', 'Logs', 'Reports', 'Billing', 'Team'];

const OverflowBar = ({ width }: { width?: number | string }) => (
  <div style={{ width, maxWidth: '100%' }} data-testid="frame">
    <Navbar theme="dark" aria-label="Main">
      <Navbar.Brand>
        <span className="text-lg font-semibold text-white">Acme</span>
        <Navbar.Items>
          {OVERFLOW_ITEMS.map((label, i) => (
            <Navbar.Item key={label} theme="dark" active={i === 0} href="#">
              {label}
            </Navbar.Item>
          ))}
          <Navbar.Menu label="Settings" theme="dark">
            <Menu.Item href="#">Profile</Menu.Item>
            <Menu.Item href="#">Security</Menu.Item>
          </Navbar.Menu>
        </Navbar.Items>
      </Navbar.Brand>
      <Navbar.Actions>
        <Avatar />
      </Navbar.Actions>
    </Navbar>
  </div>
);

// The items that do not fit leave for a "More" menu, and come back when the bar has room.
export const OverflowsIntoMore: Story = {
  render: () => <OverflowBar width={760} />,
};

// ── Interaction tests ────────────────────────────────────────────────────────

// The interaction tests below stay off the docs page (`!autodocs`): they render
// bare fixtures (a lone "x", a menu button hidden from `md` up) that read as
// broken examples there.
export const RootIsNavWithThemeAttribute: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Navbar theme="dark" data-testid="n">
      <Navbar.Brand>x</Navbar.Brand>
    </Navbar>
  ),
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('nav[data-testid="n"]');
    await expect(nav).not.toBeNull();
    await expect(nav).toHaveAttribute('data-theme', 'dark');
    await expect(nav?.className ?? '').toMatch(/bg-gray-800/);
  },
};

export const ActiveItemSetsAriaCurrent: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Navbar theme="dark">
      <Navbar.Items>
        <Navbar.Item theme="dark" active href="#" data-testid="a">
          Active
        </Navbar.Item>
        <Navbar.Item theme="dark" href="#" data-testid="b">
          Other
        </Navbar.Item>
      </Navbar.Items>
    </Navbar>
  ),
  play: async ({ canvasElement }) => {
    const a = canvasElement.querySelector('[data-testid="a"]');
    const b = canvasElement.querySelector('[data-testid="b"]');
    await expect(a).toHaveAttribute('aria-current', 'page');
    await expect(b).not.toHaveAttribute('aria-current');
  },
};

export const MobileMenuButtonHasLabel: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Navbar theme="dark">
      <Navbar.Brand>
        <Navbar.MobileMenuButton theme="dark" />
      </Navbar.Brand>
    </Navbar>
  ),
  play: async ({ canvasElement }) => {
    const btn = canvasElement.querySelector('button[aria-label="Toggle menu"]');
    await expect(btn).not.toBeNull();
  },
};

// An Item or MobileMenuButton without a `theme` prop takes the theme of its
// Navbar: inside a dark bar it must render exactly like an explicit dark one.
export const PartsInheritNavbarTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      <Navbar theme="dark" aria-label="Explicit">
        <Navbar.Brand>
          <Navbar.MobileMenuButton theme="dark" />
          <Navbar.Items>
            <Navbar.Item theme="dark" active href="#">
              Dashboard
            </Navbar.Item>
            <Navbar.Item theme="dark" href="#">
              Team
            </Navbar.Item>
          </Navbar.Items>
        </Navbar.Brand>
      </Navbar>
      <Navbar theme="dark" aria-label="Inherited">
        <Navbar.Brand>
          <Navbar.MobileMenuButton />
          <Navbar.Items>
            <Navbar.Item active href="#">
              Dashboard
            </Navbar.Item>
            <Navbar.Item href="#">Team</Navbar.Item>
          </Navbar.Items>
        </Navbar.Brand>
      </Navbar>
    </>
  ),
  play: async ({ canvas }) => {
    const explicit = within(canvas.getByRole('navigation', { name: 'Explicit' }));
    const inherited = within(canvas.getByRole('navigation', { name: 'Inherited' }));
    // The items show from `md` up and the menu button below it: whatever the
    // viewport, one of them is hidden, so query by text and label, which
    // include hidden elements.
    for (const label of ['Dashboard', 'Team']) {
      await expect(inherited.getByText(label).className).toBe(explicit.getByText(label).className);
    }
    await expect(inherited.getByLabelText('Toggle menu').className).toBe(
      explicit.getByLabelText('Toggle menu').className
    );
  },
};

// Resolves a computed CSS colour (rgb(), oklch()…) to sRGB through a canvas pixel.
const toRgb = (color: string) => {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) throw new Error('No 2D canvas context');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3));
};

// WCAG 2 contrast ratio between two CSS colours.
const contrast = (a: string, b: string) => {
  const luminance = (color: string) => {
    const [red, green, blue] = toRgb(color).map((v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// A dark Navbar sets its own text colour: content without one (a plain brand
// name here) stays readable when the page around the bar has dark text.
export const DarkNavbarSetsTextColor: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="bg-white text-gray-900">
      <Navbar theme="dark" aria-label="Main">
        <Navbar.Brand>Acme</Navbar.Brand>
      </Navbar>
    </div>
  ),
  play: async ({ canvas }) => {
    const bar = getComputedStyle(canvas.getByRole('navigation', { name: 'Main' }));
    const brand = getComputedStyle(canvas.getByText('Acme'));
    await expect(contrast(brand.color, bar.backgroundColor)).toBeGreaterThanOrEqual(4.5);
  },
};

// The light menu button draws its keyboard focus ring in the accent colour,
// like the rest of the library, so it follows the Accent toolbar menu.
export const MenuButtonFocusRingFollowsAccent: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Navbar>
      <Navbar.Brand>
        {/* The button hides from `md` up: keep it visible at any test viewport. */}
        <Navbar.MobileMenuButton className="inline-flex!" />
      </Navbar.Brand>
    </Navbar>
  ),
  play: async ({ canvas }) => {
    await expectFocusRing(canvas.getByRole('button', { name: 'Toggle menu' }));
  },
};

// The menu button pattern: Enter opens on the first link, the arrows move, Escape closes and gives
// the focus back to the trigger, Tab leaves it.
export const MenuOpensAndClosesByKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Navbar aria-label="Main">
      <Navbar.Items className="md:ms-0 md:block">
        <Navbar.Menu label="Monitoring">
          <Menu.Item href="#hosts">Hosts</Menu.Item>
          <Menu.Item href="#alerts">Alerts</Menu.Item>
          <Menu.Item href="#logs">Logs</Menu.Item>
        </Navbar.Menu>
        <Navbar.Item href="#after">After</Navbar.Item>
      </Navbar.Items>
    </Navbar>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Monitoring' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const menu = await within(document.body).findByRole('menu', { name: 'Monitoring' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const items = within(menu).getAllByRole('menuitem');
    await waitFor(() => expect(items[0]).toHaveFocus());

    await userEvent.keyboard('{ArrowDown}');
    await expect(items[1]).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(items[2]).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(items[0]).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // ArrowUp on the trigger opens on the last link.
    await userEvent.keyboard('{ArrowUp}');
    const again = await within(document.body).findByRole('menu', { name: 'Monitoring' });
    const last = within(again).getAllByRole('menuitem')[2];
    await waitFor(() => expect(last).toHaveFocus());

    // Tab closes the menu and moves on.
    await userEvent.tab();
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

// A group holding the current page shows like an active item; the others stay idle.
export const ActiveGroupShows: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Navbar aria-label="Main">
      <Navbar.Items className="md:ms-0 md:block">
        <Navbar.Menu label="Monitoring" active>
          <Menu.Item href="#">Hosts</Menu.Item>
        </Navbar.Menu>
        <Navbar.Menu label="Settings">
          <Menu.Item href="#">Profile</Menu.Item>
        </Navbar.Menu>
      </Navbar.Items>
    </Navbar>
  ),
  play: async ({ canvas }) => {
    const active = canvas.getByRole('button', { name: 'Monitoring' });
    const idle = canvas.getByRole('button', { name: 'Settings' });
    await expect(active).toHaveAttribute('aria-current', 'true');
    await expect(idle).not.toHaveAttribute('aria-current');
    await expect(getComputedStyle(active).backgroundColor).not.toBe(
      getComputedStyle(idle).backgroundColor
    );
  },
};

const sizeOf = (el: HTMLElement) => el.getBoundingClientRect();

// The bar's width is set by the test: items that do not fit move into "More", a link of the menu
// still works, and they come back when the bar grows.
export const OverflowMovesItemsToMoreAndBack: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <OverflowBar />,
  play: async ({ canvas, canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="frame"]');
    if (!frame) throw new Error('no frame');
    const bar = within(canvas.getByRole('navigation', { name: 'Main' }));
    const shown = (name: string) => {
      const el = bar.queryByRole('link', { name });
      return el !== null && getComputedStyle(el).visibility !== 'hidden';
    };
    const moreVisible = () => {
      const el = bar.queryByRole('button', { name: 'More' });
      return el !== null && getComputedStyle(el).visibility !== 'hidden';
    };

    frame.style.width = '1100px';
    await waitFor(() => expect(shown('Team')).toBe(true));
    await expect(moreVisible()).toBe(false);

    frame.style.width = '640px';
    await waitFor(() => expect(moreVisible()).toBe(true));
    await expect(shown('Dashboard')).toBe(true);
    await expect(shown('Team')).toBe(false);
    // Nothing spills out of the bar.
    const row = canvas.getByRole('navigation', { name: 'Main' });
    await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);

    const more = bar.getByRole('button', { name: 'More' });
    more.focus();
    await userEvent.keyboard('{Enter}');
    const menu = await within(document.body).findByRole('menu', { name: 'More' });
    await expect(within(menu).getByRole('menuitem', { name: 'Team' })).toHaveAttribute('href', '#');
    // A menu that does not fit comes along as a labelled group of its links.
    await expect(within(menu).getByRole('group', { name: 'Settings' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');

    frame.style.width = '1100px';
    await waitFor(() => expect(shown('Team')).toBe(true));
    await waitFor(() => expect(moreVisible()).toBe(false));
    await expect(sizeOf(bar.getByRole('link', { name: 'Team' })).width).toBeGreaterThan(0);
  },
};

// The active page that left the bar keeps showing on "More".
export const ActiveItemInMoreMarksIt: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="frame">
      <Navbar aria-label="Main">
        <Navbar.Brand>
          <Navbar.Items>
            {OVERFLOW_ITEMS.map((label) => (
              <Navbar.Item key={label} active={label === 'Team'} href="#">
                {label}
              </Navbar.Item>
            ))}
          </Navbar.Items>
        </Navbar.Brand>
      </Navbar>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="frame"]');
    if (!frame) throw new Error('no frame');
    frame.style.width = '420px';
    // Invisible while nothing overflows, so it has no accessible name yet.
    const more = canvas.getByRole('button', { hidden: true });
    await waitFor(() => expect(canvas.getByRole('button', { name: 'More' })).toBe(more));
    await expect(more).toHaveAttribute('aria-current', 'true');
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** `start` lines the panel up with the start edge of the trigger, `end` with its end edge. */
export const MenuAlignFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  // Each box labels its landmark: two unnamed `nav`s would fail axe, and `bothDirections` has
  // no way to tell its copies apart.
  render: () => (
    <>
      {(['ltr', 'rtl'] as const).map((dir) => (
        <div key={dir} dir={dir} data-direction={dir} className="mx-auto mb-4 w-[600px]">
          <Navbar aria-label={`Main ${dir}`}>
            <Navbar.Items className="md:ms-0 md:block">
              <Navbar.Menu label="Start menu" align="start">
                <Menu.Item href="#">Hosts</Menu.Item>
              </Navbar.Menu>
              <Navbar.Menu label="End menu" align="end">
                <Menu.Item href="#">Alerts</Menu.Item>
              </Navbar.Menu>
            </Navbar.Items>
          </Navbar>
        </div>
      ))}
    </>
  ),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      for (const align of ['start', 'end'] as const) {
        const name = `${align === 'start' ? 'Start' : 'End'} menu`;
        const trigger = within(box).getByRole('button', { name });
        await userEvent.click(trigger);
        const menu = await within(document.body).findByRole('menu', { name });
        const edge = align === 'start' ? startOffset : endOffset;
        await waitFor(() =>
          expect(edge(menu, trigger), `${dir}: ${align} edge of the panel`).toBeCloseTo(0, 0)
        );
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
      }
    }
  },
};

/** The brand sits at the start, the actions at the end, and the items follow the brand. */
export const BrandItemsAndActionsFollowTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      {(['ltr', 'rtl'] as const).map((dir) => (
        <div key={dir} dir={dir} data-direction={dir} className="mx-auto mb-4 w-[900px]">
          <Navbar aria-label={`Main ${dir}`}>
            <Navbar.Brand>
              <span className="text-lg font-semibold">Acme</span>
              <Navbar.Items>
                <Navbar.Item href="#" active>
                  Dashboard
                </Navbar.Item>
                <Navbar.Item href="#">Team</Navbar.Item>
              </Navbar.Items>
            </Navbar.Brand>
            <Navbar.Actions>
              <Button size="sm">Invite</Button>
            </Navbar.Actions>
          </Navbar>
        </div>
      ))}
    </>
  ),
  play: ({ canvasElement }) => {
    const [ltr, rtl] = (['ltr', 'rtl'] as const).map((dir) => directionBox(canvasElement, dir));
    for (const find of [
      (box: HTMLElement) => within(box).getByText('Acme'),
      (box: HTMLElement) => within(box).getByRole('link', { name: 'Dashboard' }),
      (box: HTMLElement) => within(box).getByRole('button', { name: 'Invite' }),
    ]) {
      // Each part is the same distance from the start edge of its bar.
      expect(startOffset(find(rtl!), rtl!)).toBeCloseTo(startOffset(find(ltr!), ltr!), 0);
    }
    // The brand is nearer the start than the actions, in both directions.
    for (const box of [ltr!, rtl!]) {
      expect(startOffset(within(box).getByText('Acme'), box)).toBeLessThan(
        startOffset(within(box).getByRole('button', { name: 'Invite' }), box)
      );
    }
  },
};
