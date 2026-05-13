import type { Meta, StoryObj } from '@storybook/react-vite';
import { CreditCard, KeyRound, LogOut, Settings, User } from 'lucide-react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { UserMenu } from './UserMenu';

const meta = {
  title: 'Overlays/User Menu',
  component: UserMenu,
  parameters: portalDocsParams(380),
  tags: ['autodocs'],
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
       <rect width="64" height="64" fill="%236366f1"/>
       <text x="50%" y="58%" font-family="sans-serif" font-size="28" fill="white" text-anchor="middle">JD</text>
     </svg>`,
  );

// ── Stories ──────────────────────────────────────────────────────────────────

export const Open: Story = {
  render: (args) => (
    <div className="flex h-[320px] items-start justify-end">
      <UserMenu defaultOpen>
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
        <UserMenu.Content>
          <UserMenu.Header
            name="John Doe"
            email="john@example.com"
            avatarSrc={SAMPLE_AVATAR}
          />
          <UserMenu.Items>
            <UserMenu.Item icon={User} onClick={args.onProfile as () => void}>
              Profile
            </UserMenu.Item>
            <UserMenu.Item icon={Settings} onClick={args.onSettings as () => void}>
              Settings
            </UserMenu.Item>
            <UserMenu.Item icon={CreditCard} onClick={args.onBilling as () => void}>
              Billing
            </UserMenu.Item>
            <UserMenu.Separator />
            <UserMenu.Item
              icon={LogOut}
              variant="danger"
              onClick={args.onSignOut as () => void}
            >
              Sign Out
            </UserMenu.Item>
          </UserMenu.Items>
        </UserMenu.Content>
      </UserMenu>
    </div>
  ),
  args: {
    onProfile: fn(),
    onSettings: fn(),
    onBilling: fn(),
    onSignOut: fn(),
  } as never,
};

export const Closed: Story = {
  render: () => (
    <div className="flex h-32 items-start justify-end">
      <UserMenu>
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
      </UserMenu>
    </div>
  ),
};

export const WithoutAvatar: Story = {
  render: () => (
    <div className="flex h-[320px] items-start justify-end">
      <UserMenu defaultOpen>
        <UserMenu.Trigger name="John Doe" />
        <UserMenu.Content>
          <UserMenu.Header name="John Doe" email="john@example.com" />
          <UserMenu.Items>
            <UserMenu.Item icon={User}>Profile</UserMenu.Item>
            <UserMenu.Item icon={Settings}>Settings</UserMenu.Item>
            <UserMenu.Separator />
            <UserMenu.Item icon={LogOut} variant="danger">
              Sign Out
            </UserMenu.Item>
          </UserMenu.Items>
        </UserMenu.Content>
      </UserMenu>
    </div>
  ),
};

export const WithoutHeader: Story = {
  render: () => (
    <div className="flex h-[260px] items-start justify-end">
      <UserMenu defaultOpen>
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
        <UserMenu.Content>
          <UserMenu.Items>
            <UserMenu.Item icon={User}>Profile</UserMenu.Item>
            <UserMenu.Item icon={Settings}>Settings</UserMenu.Item>
            <UserMenu.Item icon={KeyRound}>Change password</UserMenu.Item>
            <UserMenu.Separator />
            <UserMenu.Item icon={LogOut} variant="danger">
              Sign Out
            </UserMenu.Item>
          </UserMenu.Items>
        </UserMenu.Content>
      </UserMenu>
    </div>
  ),
};

export const HideNameOnTrigger: Story = {
  render: () => (
    <div className="flex h-32 items-start justify-end">
      <UserMenu>
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} hideName />
      </UserMenu>
    </div>
  ),
};

export const AlignLeft: Story = {
  render: () => (
    <div className="flex h-[320px] items-start justify-start">
      <UserMenu defaultOpen align="left">
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
        <UserMenu.Content>
          <UserMenu.Header
            name="John Doe"
            email="john@example.com"
            avatarSrc={SAMPLE_AVATAR}
          />
          <UserMenu.Items>
            <UserMenu.Item icon={User}>Profile</UserMenu.Item>
            <UserMenu.Item icon={Settings}>Settings</UserMenu.Item>
            <UserMenu.Separator />
            <UserMenu.Item icon={LogOut} variant="danger">
              Sign Out
            </UserMenu.Item>
          </UserMenu.Items>
        </UserMenu.Content>
      </UserMenu>
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const TriggerOpensMenu: Story = {
  render: () => (
    <div className="flex h-[320px] items-start justify-end">
      <UserMenu>
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
        <UserMenu.Content>
          <UserMenu.Items>
            <UserMenu.Item icon={User}>Profile</UserMenu.Item>
          </UserMenu.Items>
        </UserMenu.Content>
      </UserMenu>
    </div>
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
  render: (args) => (
    <div className="flex h-[320px] items-start justify-end">
      <UserMenu>
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
        <UserMenu.Content>
          <UserMenu.Items>
            <UserMenu.Item icon={User} onClick={args.onProfile as () => void}>
              Profile
            </UserMenu.Item>
            <UserMenu.Item
              icon={LogOut}
              variant="danger"
              onClick={args.onSignOut as () => void}
            >
              Sign Out
            </UserMenu.Item>
          </UserMenu.Items>
        </UserMenu.Content>
      </UserMenu>
    </div>
  ),
  args: { onProfile: fn(), onSignOut: fn() } as never,
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /user menu for/i }));
    await waitFor(() => expect(document.querySelector('[role="menu"]')).not.toBeNull());
    const profileItem = document.querySelector('[role="menu"]')!.querySelector(
      'button:nth-of-type(1)',
    ) as HTMLButtonElement;
    await userEvent.click(profileItem);
    await expect((args as { onProfile: ReturnType<typeof fn> }).onProfile).toHaveBeenCalledTimes(1);
    // Menu should auto-close
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
  },
};

export const EscapeCloses: Story = {
  render: () => (
    <div className="flex h-[320px] items-start justify-end">
      <UserMenu>
        <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
        <UserMenu.Content>
          <UserMenu.Items>
            <UserMenu.Item icon={User}>Profile</UserMenu.Item>
          </UserMenu.Items>
        </UserMenu.Content>
      </UserMenu>
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /user menu for/i }));
    await waitFor(() => expect(document.querySelector('[role="menu"]')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
  },
};
