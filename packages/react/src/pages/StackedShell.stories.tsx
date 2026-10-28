import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, Plus } from 'lucide-react';
import { Shell } from '../layout/Shell';
import { Navbar } from '../navigation/Navbar';
import { placeholderAvatar } from '../storybook-avatars';
import { Button } from '../ui/Button';
import { Menu } from '../ui/Menu';
import { PageHeader } from '../templates/PageHeader';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { expect } from 'storybook/test';

// TUI Plus "Application Shells / Stacked" — top navbar with horizontal nav,
// no sidebar, full-width main content beneath. Builds on Cosmos `Shell` by
// omitting the `sidebar` slot and using a `<Navbar>` (not `<Topbar>`) as
// the top bar.

const meta = {
  title: 'Layout/Stacked Shell',
  parameters: portalDocsParams.full(),
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Avatar = () => (
  <img
    alt=""
    src={placeholderAvatar('cosmos-stacked-shell-demo', 96)}
    className="size-8 rounded-full bg-gray-700"
  />
);

const BellIcon = () => (
  <button
    type="button"
    aria-label="Notifications"
    className="relative rounded-full p-1 text-gray-400 hover:text-white"
  >
    <Bell className="size-6" aria-hidden />
  </button>
);

// TUI Plus pattern "With lighter page header" — dark navbar above a lighter
// page body with a generous title block.
export const WithLighterPageHeader: Story = {
  render: () => (
    <Shell
      topbar={
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
              <Navbar.Item theme="dark" href="#">
                Reports
              </Navbar.Item>
            </Navbar.Items>
          </Navbar.Brand>
          <Navbar.Actions>
            <BellIcon />
            <Avatar />
          </Navbar.Actions>
        </Navbar>
      }
    >
      <div className="bg-white dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-8 dark:border-white/10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>
        <div className="p-6">
          <div className="h-96 rounded-lg border-2 border-dashed border-gray-200 dark:border-white/10" />
        </div>
      </div>
    </Shell>
  ),
};

// TUI Plus pattern "With bottom border" — dark navbar, bordered page header
// strip with `PageHeader` + quick-action.
export const WithPageHeaderActions: Story = {
  render: () => (
    <Shell
      topbar={
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
            </Navbar.Items>
          </Navbar.Brand>
          <Navbar.Actions>
            <Button size="sm" icon={Plus}>
              New project
            </Button>
            <BellIcon />
            <Avatar />
          </Navbar.Actions>
        </Navbar>
      }
    >
      <div className="bg-[var(--color-bg-base)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-panel)] px-6 py-6">
          <PageHeader
            title="Projects"
            description="All projects you have access to across teams and workspaces."
          />
        </div>
        <div className="p-6">
          <div className="h-96 rounded-lg border-2 border-dashed border-[var(--color-border)]" />
        </div>
      </div>
    </Shell>
  ),
};

// Horizontal layout with dropdown groups: a `Shell` with no sidebar and a `Navbar` in `topbar`.
// The group holding the current page shows as active, and what does not fit goes into "More".
export const WithMenus: Story = {
  render: () => (
    <Shell
      topbar={
        <Navbar theme="dark">
          <Navbar.Brand>
            <Navbar.MobileMenuButton theme="dark" />
            <span className="ms-2 text-lg font-semibold text-white">Acme</span>
            <Navbar.Items>
              <Navbar.Item theme="dark" href="#">
                Dashboard
              </Navbar.Item>
              <Navbar.Menu label="Projects" active>
                <Menu.Item href="#" aria-current="page">
                  All projects
                </Menu.Item>
                <Menu.Item href="#">Archived</Menu.Item>
                <Menu.Item href="#">Templates</Menu.Item>
              </Navbar.Menu>
              <Navbar.Menu label="Reports">
                <Menu.Item href="#">Usage</Menu.Item>
                <Menu.Item href="#">Billing</Menu.Item>
              </Navbar.Menu>
              <Navbar.Item theme="dark" href="#">
                Team
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
      }
    >
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Projects</h1>
        <div className="mt-4 h-96 rounded-lg border-2 border-dashed border-[var(--color-border)]" />
      </div>
    </Shell>
  ),
};

// Below `lg` the items leave the bar: the menu button stays, and the bar never widens the page.
export const WithMenusMobile: Story = {
  ...WithMenus,
  globals: mobileViewport,
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(canvas.getByRole('button', { name: 'Toggle menu' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Projects' })).toBeNull();
  },
};

// Multi-column variant — Shell + sidebar + secondary panel (TUI "Multi-column").
export const MultiColumnWithSecondary: Story = {
  render: () => (
    <Shell
      topbar={
        <Navbar theme="dark">
          <Navbar.Brand>
            <span className="ms-2 text-lg font-semibold text-white">Acme</span>
            <Navbar.Items>
              <Navbar.Item theme="dark" active href="#">
                Inbox
              </Navbar.Item>
              <Navbar.Item theme="dark" href="#">
                Sent
              </Navbar.Item>
            </Navbar.Items>
          </Navbar.Brand>
          <Navbar.Actions>
            <Avatar />
          </Navbar.Actions>
        </Navbar>
      }
      secondary={
        <div className="p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Secondary panel
          </h3>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Use this slot for contextual actions, message previews, or filters tied to the main
            column.
          </p>
          <div className="mt-4 h-64 rounded-lg border-2 border-dashed border-[var(--color-border)]" />
        </div>
      }
    >
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">Main content</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Primary column. The secondary panel docks to the right via Shell's new{' '}
          <code>secondary</code> slot.
        </p>
        <div className="mt-4 h-96 rounded-lg border-2 border-dashed border-[var(--color-border)]" />
      </div>
    </Shell>
  ),
};

// Below `lg` the secondary panel stacks under the main column instead of squeezing it.
export const MultiColumnMobile: Story = {
  ...MultiColumnWithSecondary,
  globals: mobileViewport,
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const main = canvas.getByRole('main');
    const secondary = canvas.getByRole('complementary');
    await expect(main.getBoundingClientRect().width).toBeGreaterThan(300);
    await expect(secondary.getBoundingClientRect().width).toBe(main.getBoundingClientRect().width);
    await expect(secondary.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      main.getBoundingClientRect().bottom - 1
    );
  },
};
