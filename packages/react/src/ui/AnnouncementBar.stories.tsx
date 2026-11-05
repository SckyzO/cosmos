import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkles } from 'lucide-react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectFocusRing,
  expectMirrored,
  startOffset,
} from '../storybook-helpers';
import { SlowFolds, clipOf, finishAnimations } from '../storybook-folds';
import { AnnouncementBar, type AnnouncementBarIntent } from './AnnouncementBar';
import { Link } from './Link';
import { LabelsProvider } from '../labels/LabelsProvider';

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

/**
 * Dismiss it: the bar fades and folds away in 200 ms, and the content under it comes up with it
 * instead of jumping.
 */
export const FoldsAway: Story = {
  parameters: { settleMotion: false },
  args: { dismissible: true, intent: 'brand' },
  render: (args) => (
    <div>
      <AnnouncementBar {...args} />
      <p className="m-0 p-4 text-sm text-[var(--color-text-secondary)]">
        The page under the bar. It comes up as the bar folds away.
      </p>
    </div>
  ),
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

// The folding box around the bar: the bar, the box that holds it, the box that clips it, the fold.
const foldOfBar = (bar: HTMLElement) => bar.parentElement!.parentElement!.parentElement!;

/**
 * Dismissed, the bar is inert and out of the accessibility tree at once and folds away, fading with
 * no slide, while the content under it comes up; it unmounts once it has. Slowed to 2 s to read
 * the middle.
 */
export const FoldsAwayThenUnmounts: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  args: { dismissible: true, onDismiss: fn() },
  render: (args) => (
    <SlowFolds>
      <AnnouncementBar {...args} />
      <p data-testid="page">The page under the bar.</p>
    </SlowFolds>
  ),
  play: async ({ args, canvas }) => {
    const bar = canvas.getByRole('status');
    const fold = foldOfBar(bar);
    const page = canvas.getByTestId('page');
    await expect(fold.inert).toBe(false);
    const top = page.getBoundingClientRect().top;
    await expect(top).toBeGreaterThan(bar.getBoundingClientRect().height - 1);

    await userEvent.click(canvas.getByRole('button', { name: /dismiss/i }));
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    // Inert and hidden at once, still on screen, fading with no slide.
    await expect(bar.isConnected).toBe(true);
    await expect(fold.inert).toBe(true);
    await expect(fold).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.queryByRole('status')).toBeNull();
    await expect(fold.getAnimations().length).toBeGreaterThan(0);
    await expect(getComputedStyle(bar.parentElement!).translate).toBe('none');
    await expect(getComputedStyle(clipOf(fold)).overflow).toBe('hidden');

    // Folded, the bar goes and the page is at the top.
    await finishAnimations(fold);
    await waitFor(() => expect(bar.isConnected).toBe(false));
    await expect(page.getBoundingClientRect().top).toBeLessThan(top);
  },
};

/** A sticky bar keeps its place at the top: the box that sticks is the outer one, around the fold. */
export const StickyBarFoldsInsideTheStickyBox: Story = {
  tags: ['!dev', '!autodocs'],
  args: { sticky: true, dismissible: true },
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('status');
    const outer = foldOfBar(bar).parentElement!;
    await expect(getComputedStyle(outer).position).toBe('sticky');
    await expect(getComputedStyle(foldOfBar(bar)).position).not.toBe('sticky');
    await expect(getComputedStyle(outer).zIndex).toBe('40');
  },
};

/** With the Animations setting on "Reduced", the bar is gone as soon as it is dismissed. */
export const ReducedMotionGoneAtOnce: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  globals: { motion: 'reduced' },
  args: { dismissible: true },
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('status');
    await userEvent.click(canvas.getByRole('button', { name: /dismiss/i }));
    await expect(bar.isConnected).toBe(false);
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
  ...BrandDismissFocusShowsWhiteRingInDark,
  tags: ['!dev', '!autodocs'],
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

/** The provider names the close button, and the bar's own `labels` win over it. */
export const TranslatedByLabels: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LabelsProvider labels={{ announcementBar: { dismiss: "Fermer l'annonce" } }}>
      <AnnouncementBar message="Nouvelle version disponible." dismissible onDismiss={fn()} />
      <AnnouncementBar
        message="Maintenance ce soir."
        dismissible
        onDismiss={fn()}
        labels={{ dismiss: 'Masquer' }}
      />
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: "Fermer l'annonce" })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Masquer' })).toBeVisible();
  },
};
