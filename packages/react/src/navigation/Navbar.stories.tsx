import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Bell, Plus } from 'lucide-react';
import { Navbar } from './Navbar';
import { Button } from '../ui/Button';

const meta = {
  title: 'Navigation/Navbar',
  component: Navbar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Avatar = () => (
  <img
    alt=""
    src="https://i.pravatar.cc/96?u=cosmos-navbar-demo"
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
          <Navbar.Item theme="dark" active href="#">Dashboard</Navbar.Item>
          <Navbar.Item theme="dark" href="#">Team</Navbar.Item>
          <Navbar.Item theme="dark" href="#">Projects</Navbar.Item>
          <Navbar.Item theme="dark" href="#">Calendar</Navbar.Item>
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
          <Navbar.Item theme="dark" active href="#">Dashboard</Navbar.Item>
          <Navbar.Item theme="dark" href="#">Team</Navbar.Item>
          <Navbar.Item theme="dark" href="#">Projects</Navbar.Item>
          <Navbar.Item theme="dark" href="#">Calendar</Navbar.Item>
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
          <Navbar.Item theme="light" active href="#">Dashboard</Navbar.Item>
          <Navbar.Item theme="light" href="#">Hosts</Navbar.Item>
          <Navbar.Item theme="light" href="#">Alerts</Navbar.Item>
          <Navbar.Item theme="light" href="#">Logs</Navbar.Item>
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

export const RootIsNavWithThemeAttribute: Story = {
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
