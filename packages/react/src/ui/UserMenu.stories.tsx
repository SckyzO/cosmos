import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { CreditCard, KeyRound, LogOut, Settings, User } from 'lucide-react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Topbar } from '../layout/Topbar';
import { portalDocsParams } from '../storybook-helpers';
import { UserMenu } from './UserMenu';

const meta = {
  title: 'Overlays/User Menu',
  component: UserMenu,
  parameters: portalDocsParams(380),
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { children: null as ReactNode },
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
       <rect width="64" height="64" fill="#6366f1"/>
       <text x="50%" y="58%" font-family="sans-serif" font-size="28" fill="white" text-anchor="middle">JD</text>
     </svg>`
  );

// The menu where it lives: at the end of an app's top bar, with room under it
// for the open panel. `side="left"` puts the trigger before the page title.
const InTopbar = ({
  children,
  height = 340,
  side = 'right',
}: {
  children: ReactNode;
  height?: number;
  side?: 'left' | 'right';
}) => (
  <div className="bg-[var(--color-bg-base)]" style={{ minHeight: height }}>
    <Topbar
      pageTitle="Dashboard"
      leftActions={side === 'left' ? children : undefined}
      rightActions={side === 'right' ? children : undefined}
    />
  </div>
);

// ── Stories ──────────────────────────────────────────────────────────────────

export const Open: Story = {
  render: (args) => {
    const extra = args as unknown as {
      onProfile: () => void;
      onSettings: () => void;
      onBilling: () => void;
      onSignOut: () => void;
    };
    return (
      <InTopbar>
        <UserMenu defaultOpen>
          <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
          <UserMenu.Content>
            <UserMenu.Header name="John Doe" email="john@example.com" avatarSrc={SAMPLE_AVATAR} />
            <UserMenu.Items>
              <UserMenu.Item icon={User} onClick={extra.onProfile}>
                Profile
              </UserMenu.Item>
              <UserMenu.Item icon={Settings} onClick={extra.onSettings}>
                Settings
              </UserMenu.Item>
              <UserMenu.Item icon={CreditCard} onClick={extra.onBilling}>
                Billing
              </UserMenu.Item>
              <UserMenu.Separator />
              <UserMenu.Item icon={LogOut} intent="danger" onClick={extra.onSignOut}>
                Sign Out
              </UserMenu.Item>
            </UserMenu.Items>
          </UserMenu.Content>
        </UserMenu>
      </InTopbar>
    );
  },
  args: {
    onProfile: fn(),
    onSettings: fn(),
    onBilling: fn(),
    onSignOut: fn(),
  } as never,
};

export const Closed: Story = {
  render: () => (
    <InTopbar height={120}>
      <UserMenu>
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
      </UserMenu>
    </InTopbar>
  ),
};

export const WithoutAvatar: Story = {
  render: () => (
    <InTopbar>
      <UserMenu defaultOpen>
        <UserMenu.Trigger name="John Doe" />
        <UserMenu.Content>
          <UserMenu.Header name="John Doe" email="john@example.com" />
          <UserMenu.Items>
            <UserMenu.Item icon={User}>Profile</UserMenu.Item>
            <UserMenu.Item icon={Settings}>Settings</UserMenu.Item>
            <UserMenu.Separator />
            <UserMenu.Item icon={LogOut} intent="danger">
              Sign Out
            </UserMenu.Item>
          </UserMenu.Items>
        </UserMenu.Content>
      </UserMenu>
    </InTopbar>
  ),
  // The avatars repeat the name next to them: no image for assistive technology, in the trigger
  // (whose name is its content) and in the header of the menu.
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'User menu for John Doe' });
    await expect(within(trigger).queryByRole('img')).toBeNull();
    const menu = await within(document.body).findByRole('menu');
    await expect(within(menu).queryByRole('img')).toBeNull();
  },
};

export const WithoutHeader: Story = {
  render: () => (
    <InTopbar height={300}>
      <UserMenu defaultOpen>
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
        <UserMenu.Content>
          <UserMenu.Items>
            <UserMenu.Item icon={User}>Profile</UserMenu.Item>
            <UserMenu.Item icon={Settings}>Settings</UserMenu.Item>
            <UserMenu.Item icon={KeyRound}>Change password</UserMenu.Item>
            <UserMenu.Separator />
            <UserMenu.Item icon={LogOut} intent="danger">
              Sign Out
            </UserMenu.Item>
          </UserMenu.Items>
        </UserMenu.Content>
      </UserMenu>
    </InTopbar>
  ),
};

export const HideNameOnTrigger: Story = {
  render: () => (
    <InTopbar height={120}>
      <UserMenu>
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} hideName />
      </UserMenu>
    </InTopbar>
  ),
  // The name is not shown, but it still names the button.
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'User menu for John Doe' })).toBeVisible();
  },
};

export const AlignLeft: Story = {
  render: () => (
    <InTopbar side="left">
      <UserMenu defaultOpen align="start">
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
        <UserMenu.Content>
          <UserMenu.Header name="John Doe" email="john@example.com" avatarSrc={SAMPLE_AVATAR} />
          <UserMenu.Items>
            <UserMenu.Item icon={User}>Profile</UserMenu.Item>
            <UserMenu.Item icon={Settings}>Settings</UserMenu.Item>
            <UserMenu.Separator />
            <UserMenu.Item icon={LogOut} intent="danger">
              Sign Out
            </UserMenu.Item>
          </UserMenu.Items>
        </UserMenu.Content>
      </UserMenu>
    </InTopbar>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

// The interaction tests below stay off the docs page (`!autodocs`): their play
// functions take focus, which scrolls the docs page down to their iframe.
export const TriggerOpensMenu: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <InTopbar>
      <UserMenu>
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
        <UserMenu.Content>
          <UserMenu.Items>
            <UserMenu.Item icon={User}>Profile</UserMenu.Item>
          </UserMenu.Items>
        </UserMenu.Content>
      </UserMenu>
    </InTopbar>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /user menu for john doe/i });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(document.querySelector('[role="menu"]')).not.toBeNull());
  },
};

export const ItemClickFiresHandler: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => {
    const extra = args as unknown as { onProfile: () => void; onSignOut: () => void };
    return (
      <InTopbar>
        <UserMenu>
          <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
          <UserMenu.Content>
            <UserMenu.Items>
              <UserMenu.Item icon={User} onClick={extra.onProfile}>
                Profile
              </UserMenu.Item>
              <UserMenu.Item icon={LogOut} intent="danger" onClick={extra.onSignOut}>
                Sign Out
              </UserMenu.Item>
            </UserMenu.Items>
          </UserMenu.Content>
        </UserMenu>
      </InTopbar>
    );
  },
  args: { onProfile: fn(), onSignOut: fn() } as never,
  play: async ({ args, canvas }) => {
    const extra = args as unknown as { onProfile: ReturnType<typeof fn> };
    await userEvent.click(canvas.getByRole('button', { name: /user menu for/i }));
    await waitFor(() => expect(document.querySelector('[role="menu"]')).not.toBeNull());
    const profileItem = document
      .querySelector('[role="menu"]')!
      .querySelector('button:nth-of-type(1)') as HTMLButtonElement;
    await userEvent.click(profileItem);
    await expect(extra.onProfile).toHaveBeenCalledTimes(1);
    // Menu should auto-close
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
  },
};

export const EscapeCloses: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <InTopbar>
      <UserMenu>
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
        <UserMenu.Content>
          <UserMenu.Items>
            <UserMenu.Item icon={User}>Profile</UserMenu.Item>
          </UserMenu.Items>
        </UserMenu.Content>
      </UserMenu>
    </InTopbar>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /user menu for/i }));
    await waitFor(() => expect(document.querySelector('[role="menu"]')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
  },
};

/** WAI-ARIA menu button: arrows move between items, Tab and Escape leave the menu. */
export const KeyboardMenuNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <InTopbar>
      <UserMenu>
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
        <UserMenu.Content>
          <UserMenu.Items>
            <UserMenu.Item icon={User}>Profile</UserMenu.Item>
            <UserMenu.Item icon={Settings}>Settings</UserMenu.Item>
            <UserMenu.Item icon={LogOut} intent="danger">
              Sign Out
            </UserMenu.Item>
          </UserMenu.Items>
        </UserMenu.Content>
      </UserMenu>
      <button type="button">After</button>
    </InTopbar>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /user menu for/i });
    const menu = () => document.querySelector('[role="menu"]');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(menu()).not.toBeNull());
    await waitFor(() => expect(document.activeElement).toHaveTextContent('Profile'));
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toHaveTextContent('Settings');
    await userEvent.keyboard('{End}');
    await expect(document.activeElement).toHaveTextContent('Sign Out');
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toHaveTextContent('Profile');
    await userEvent.keyboard('{ArrowUp}');
    await expect(document.activeElement).toHaveTextContent('Sign Out');
    await userEvent.keyboard('{Home}');
    await expect(document.activeElement).toHaveTextContent('Profile');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(menu()).toBeNull());
    await expect(document.activeElement).toBe(trigger);
    // ArrowUp on the trigger opens the menu on its last item.
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(document.activeElement).toHaveTextContent('Sign Out'));
    // Tab closes the menu and moves on to the next element after the trigger.
    await userEvent.tab();
    await waitFor(() => expect(menu()).toBeNull());
    await expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'After' }));
    // Same from the first item: Tab skips the tabIndex -1 items and leaves.
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(document.activeElement).toHaveTextContent('Profile'));
    await userEvent.tab();
    await waitFor(() => expect(menu()).toBeNull());
    await expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'After' }));
  },
};

/** In a scrolling container, the open menu stays under its trigger, flush with its right edge. */
export const StaysUnderTriggerOnScroll: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="scroller" className="h-80 overflow-y-auto">
      <div className="flex justify-end px-6 pt-6 pb-[600px]">
        <UserMenu>
          <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
          <UserMenu.Content>
            <UserMenu.Items>
              <UserMenu.Item icon={User}>Profile</UserMenu.Item>
            </UserMenu.Items>
          </UserMenu.Content>
        </UserMenu>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /user menu for/i });
    await userEvent.click(trigger);
    const menu = await waitFor(() => document.querySelector<HTMLElement>('[role="menu"]')!);
    const before = trigger.getBoundingClientRect().top;
    canvas.getByTestId('scroller').scrollTop = 30;
    await expect(trigger.getBoundingClientRect().top).toBeCloseTo(before - 30, 0);
    await waitFor(() => {
      const t = trigger.getBoundingClientRect();
      const m = menu.getBoundingClientRect();
      expect(m.top).toBeCloseTo(t.bottom + 8, 0);
      expect(m.right).toBeCloseTo(t.right, 0);
    });
  },
};

/** `intent="danger"` colors an item and its icon red; a neutral item stays gray. */
export const DangerIntentColorsTheItem: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <InTopbar>
      <UserMenu>
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} hideName />
        <UserMenu.Content>
          <UserMenu.Items>
            <UserMenu.Item icon={User}>Profile</UserMenu.Item>
            <UserMenu.Item icon={LogOut} intent="neutral">
              Explicit neutral
            </UserMenu.Item>
            <UserMenu.Item icon={LogOut} intent="danger">
              Sign Out
            </UserMenu.Item>
          </UserMenu.Items>
        </UserMenu.Content>
      </UserMenu>
    </InTopbar>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /user menu for/i }));
    const menu = within(await waitFor(() => document.querySelector<HTMLElement>('[role="menu"]')!));
    const profile = menu.getByRole('menuitem', { name: 'Profile' });
    const neutral = menu.getByRole('menuitem', { name: 'Explicit neutral' });
    const danger = menu.getByRole('menuitem', { name: 'Sign Out' });

    await expect(profile).toHaveClass('text-gray-700');
    await expect(profile.querySelector('svg')).toHaveClass('text-gray-400');
    await expect(neutral.className).toBe(profile.className);
    await expect(danger).toHaveClass('text-red-600', 'hover:bg-red-50');
    await expect(danger).not.toHaveClass('text-gray-700');
    await expect(danger.querySelector('svg')).toHaveClass('text-red-500');
  },
};
