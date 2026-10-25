import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkles } from 'lucide-react';
import { expect, fn, userEvent } from 'storybook/test';
import { expectFocusRing } from '../storybook-helpers';
import { AnnouncementBar, type AnnouncementBarIntent } from './AnnouncementBar';
import { Link } from './Link';

const meta = {
  title: 'Feedback/Announcement Bar',
  component: AnnouncementBar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { message: 'A new release is available — v2.0.0 is now in beta.' },
} satisfies Meta<typeof AnnouncementBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="space-y-3">
      {(['info', 'success', 'warning', 'danger', 'brand'] as AnnouncementBarIntent[]).map((i) => (
        <AnnouncementBar key={i} intent={i} message={`This is an ${i} announcement.`} />
      ))}
    </div>
  ),
};

export const WithAction: Story = {
  args: {
    intent: 'info',
    message: 'Your trial ends in 5 days.',
    action: (
      <Link href="#" variant="underline" className="text-current">
        Upgrade plan →
      </Link>
    ),
  },
};

export const Dismissible: Story = {
  args: {
    intent: 'warning',
    message: 'Maintenance scheduled for Sunday 02:00 UTC.',
    dismissible: true,
    onDismiss: fn(),
  },
};

export const Brand: Story = {
  args: {
    intent: 'brand',
    icon: Sparkles,
    message: 'New: AI-powered alerts now in beta.',
    action: (
      <Link href="#" variant="underline" className="text-white">
        Try it →
      </Link>
    ),
    dismissible: true,
  },
};

export const NoIcon: Story = {
  args: {
    intent: 'info',
    icon: null,
    message: 'No icon variant — text-only banner.',
  },
};

export const CustomIcon: Story = {
  args: {
    intent: 'success',
    icon: Sparkles,
    message: 'Your data has been migrated successfully.',
  },
};

export const RichContent: Story = {
  args: {
    intent: 'danger',
    message: (
      <>
        Service degraded — read{' '}
        <Link href="#" variant="underline" className="text-current">
          status page
        </Link>{' '}
        for updates.
      </>
    ),
    dismissible: true,
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickDismissFiresHandlerAndHides: Story = {
  tags: ['!dev'],
  args: {
    intent: 'info',
    message: 'Will disappear on click.',
    dismissible: true,
    onDismiss: fn(),
  },
  play: async ({ args, canvas }) => {
    const close = canvas.getByRole('button', { name: /dismiss/i });
    await userEvent.click(close);
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('status')).toBeNull();
  },
};

export const NotDismissibleHasNoCloseBtn: Story = {
  tags: ['!dev'],
  args: { intent: 'info', message: 'Plain banner.' },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: /dismiss/i })).toBeNull();
  },
};

// The brand bar is brand-500: the ring of its dismiss button is white, with no halo.

export const BrandDismissFocusShowsWhiteRingInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { intent: 'brand', message: 'New: AI-powered alerts now in beta.', dismissible: true },
  play: async ({ canvas }) => {
    await expectFocusRing(canvas.getByRole('button', { name: 'Dismiss announcement' }), {
      token: '--color-white',
      halo: false,
    });
  },
};

export const BrandDismissFocusShowsWhiteRingInLight: Story = {
  tags: ['!dev'],
  ...BrandDismissFocusShowsWhiteRingInDark,
  globals: { theme: 'light' },
};
