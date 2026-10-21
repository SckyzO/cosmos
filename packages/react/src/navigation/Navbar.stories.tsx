import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Bell, Plus } from 'lucide-react';
import { placeholderAvatar } from '../storybook-avatars';
import { Navbar } from './Navbar';
import { Button } from '../ui/Button';

const meta = {
  title: 'Navigation/Navbar',
  component: Navbar,
  subcomponents: {
    'Navbar.Brand': Navbar.Brand,
    'Navbar.Items': Navbar.Items,
    'Navbar.Item': Navbar.Item,
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
        : 'relative rounded-full p-1 text-gray-500 hover:text-gray-700'
    }
  >
    <Bell className="size-6" aria-hidden />
  </button>
);

// TUI Plus pattern "Simple dark with menu button on left" — dark bg, hamburger
// on mobile, brand + items + actions (bell + avatar).
export const SimpleDarkMenuLeft: Story = {
  render: () => (
    <Navbar theme="dark">
      <Navbar.Brand>
        <Navbar.MobileMenuButton theme="dark" />
        <span className="ml-2 text-lg font-semibold text-white">Acme</span>
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
        <span className="ml-2 text-lg font-semibold text-white">Acme</span>
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
        <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">Cosmos</span>
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

// ── Interaction tests ────────────────────────────────────────────────────────

// The interaction tests below stay off the docs page (`!autodocs`): they render
// bare fixtures (a lone "x", a menu button hidden from `md` up) that read as
// broken examples there.
export const RootIsNavWithThemeAttribute: Story = {
  tags: ['!autodocs'],
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
  tags: ['!autodocs'],
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
  tags: ['!autodocs'],
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
  tags: ['!autodocs'],
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
  tags: ['!autodocs'],
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
  tags: ['!autodocs'],
  render: () => (
    <Navbar>
      <Navbar.Brand>
        {/* The button hides from `md` up: keep it visible at any test viewport. */}
        <Navbar.MobileMenuButton className="inline-flex!" />
      </Navbar.Brand>
    </Navbar>
  ),
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Toggle menu' });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await expect(button.matches(':focus-visible')).toBe(true);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-brand-500');
    await expect(toRgb(getComputedStyle(button).outlineColor)).toEqual(toRgb(accent));
  },
};
