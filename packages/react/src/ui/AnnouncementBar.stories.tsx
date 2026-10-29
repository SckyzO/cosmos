import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkles } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectFocusRing,
  expectMirrored,
  startOffset,
} from '../storybook-helpers';
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
        Upgrade plan{' '}
        <span aria-hidden className="inline-block [text-decoration:inherit] rtl:-scale-x-100">
          →
        </span>
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
        Try it{' '}
        <span aria-hidden className="inline-block [text-decoration:inherit] rtl:-scale-x-100">
          →
        </span>
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

/** The icon starts the bar, the action and the dismiss button end it, in either direction. */
export const ActionAndDismissSitAtTheEnd: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <AnnouncementBar
        message="Your trial ends in 5 days."
        action={
          <Link href="#" variant="underline" className="text-current">
            Upgrade plan{' '}
            <span aria-hidden className="inline-block [text-decoration:inherit] rtl:-scale-x-100">
              →
            </span>
          </Link>
        }
        dismissible
      />
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const bar = within(directionBox(canvasElement, dir)).getByRole('status');
      const dismiss = within(bar).getByRole('button', { name: 'Dismiss announcement' });
      const action = within(bar).getByRole('link');
      expect(endOffset(dismiss, bar)).toBeLessThan(startOffset(dismiss, bar));
      // The action comes before the dismiss button, toward the start.
      expect(startOffset(action, bar)).toBeLessThan(startOffset(dismiss, bar));
      expect(startOffset(bar.querySelector('svg')!, bar)).toBeLessThan(startOffset(action, bar));
      // The arrow is a box of its own, so it can turn around: the link's underline has to be
      // handed to it, it does not reach into a box.
      expect(
        getComputedStyle(action.querySelector('span')!).textDecorationLine,
        `${dir}: arrow underline`
      ).toBe('underline');
    }
    for (const find of [
      (box: HTMLElement) => within(box).getByRole('button', { name: 'Dismiss announcement' }),
      (box: HTMLElement) => within(box).getByRole('link'),
    ])
      expectMirrored(canvasElement, find);
  },
};
