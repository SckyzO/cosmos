import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  endOffset,
  expectReadsLeftToRight,
  inDirection,
  portalDocsParams,
  startOffset,
} from '../storybook-helpers';
import { isFading, tokenMs, transitionMs, transitionValues } from '../storybook-motion';
import { Button } from './Button';
import { CookieBanner } from './CookieBanner';
import { Link } from './Link';

const meta = {
  title: 'Feedback/Cookie Banner',
  component: CookieBanner,
  parameters: portalDocsParams.sm(),
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { message: 'We use cookies.', onAccept: fn() },
} satisfies Meta<typeof CookieBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleMessage = (
  <>
    We use cookies to improve your experience and analyse traffic. Read our{' '}
    <Link href="#" variant="underline" className="text-current">
      privacy policy
    </Link>
    .
  </>
);

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => (
    <div className="relative h-72 bg-gray-100 dark:bg-gray-800">
      <CookieBanner message={sampleMessage} onAccept={args.onAccept as () => void} />
    </div>
  ),
  args: { onAccept: fn() } as never,
};

export const WithDeny: Story = {
  render: (args) => (
    <div className="relative h-72 bg-gray-100 dark:bg-gray-800">
      <CookieBanner
        message={sampleMessage}
        onAccept={args.onAccept as () => void}
        onDeny={args.onDeny as () => void}
      />
    </div>
  ),
  args: { onAccept: fn(), onDeny: fn() } as never,
};

export const FullChoices: Story = {
  render: (args) => (
    <div className="relative h-72 bg-gray-100 dark:bg-gray-800">
      <CookieBanner
        message={sampleMessage}
        onSettings={args.onSettings as () => void}
        onDeny={args.onDeny as () => void}
        onAccept={args.onAccept as () => void}
      />
    </div>
  ),
  args: { onSettings: fn(), onDeny: fn(), onAccept: fn() } as never,
};

export const Floating: Story = {
  render: (args) => (
    <div className="relative h-72 bg-gray-100 dark:bg-gray-800">
      <CookieBanner
        position="floating"
        message={sampleMessage}
        onSettings={fn()}
        onDeny={fn()}
        onAccept={args.onAccept as () => void}
      />
    </div>
  ),
  args: { onAccept: fn() } as never,
};

export const TopPosition: Story = {
  render: (args) => (
    <div className="relative h-72 bg-gray-100 dark:bg-gray-800">
      <CookieBanner position="top" message={sampleMessage} onAccept={args.onAccept as () => void} />
    </div>
  ),
  args: { onAccept: fn() } as never,
};

export const NoIconNoTitle: Story = {
  render: (args) => (
    <div className="relative h-72 bg-gray-100 dark:bg-gray-800">
      <CookieBanner
        showIcon={false}
        title=""
        ariaLabel="Cookie notice"
        message="Minimal banner — just the message and the Accept button."
        onAccept={args.onAccept as () => void}
      />
    </div>
  ),
  args: { onAccept: fn() } as never,
};

export const NoIconNoTitleChecks: Story = {
  ...NoIconNoTitle,
  tags: ['!dev', '!autodocs'],
  // With no title to name it, the dialog takes `ariaLabel`.
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('dialog', { name: 'Cookie notice' })).toBeInTheDocument();
  },
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="relative h-72 bg-gray-100 p-6 dark:bg-gray-800">
        <Button onClick={() => setOpen(true)} disabled={open}>
          {open ? 'Banner is open' : 'Re-open banner'}
        </Button>
        <CookieBanner
          open={open}
          onOpenChange={setOpen}
          message={sampleMessage}
          onSettings={() => undefined}
          onDeny={() => undefined}
          onAccept={() => undefined}
        />
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────
// The two closing tests stay off the docs page: their play function also runs
// there and would leave an empty example once the banner has closed.

export const ClickAcceptFiresHandlerAndCloses: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="relative h-72">
      <CookieBanner message={sampleMessage} onAccept={args.onAccept as () => void} />
    </div>
  ),
  args: { onAccept: fn() } as never,
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /accept all/i }));
    await expect(args.onAccept).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('dialog')).toBeNull();
  },
};

export const ClickDenyFiresHandlerAndCloses: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="relative h-72">
      <CookieBanner
        message={sampleMessage}
        onAccept={args.onAccept as () => void}
        onDeny={args.onDeny as () => void}
      />
    </div>
  ),
  args: { onAccept: fn(), onDeny: fn() } as never,
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /deny all/i }));
    await expect(args.onDeny).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('dialog')).toBeNull();
  },
};

export const SettingsDoesNotAutoClose: Story = {
  tags: ['!dev'],
  render: (args) => (
    <div className="relative h-72">
      <CookieBanner
        message={sampleMessage}
        onSettings={args.onSettings as () => void}
        onAccept={args.onAccept as () => void}
      />
    </div>
  ),
  args: { onSettings: fn(), onAccept: fn() } as never,
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /cookie settings/i }));
    await expect(args.onSettings).toHaveBeenCalledTimes(1);
    // Banner stays open so the user can still pick Accept after the settings modal.
    await expect(canvas.queryByRole('dialog')).not.toBeNull();
  },
};

/** At the `mobile` viewport the actions wrap under the message and nothing runs past the edge. */
const fullChoicesOnMobile: Story = {
  ...FullChoices,
  globals: { viewport: { value: 'mobile', isRotated: false } },
};

export const FullChoicesOnMobileChecks: Story = {
  ...fullChoicesOnMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    const dialog = canvas.getByRole('dialog');
    await expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    // The three actions are all inside the dialog.
    const bounds = dialog.getBoundingClientRect();
    for (const name of ['Cookie settings', 'Deny all', 'Accept all']) {
      const { left, right } = canvas.getByRole('button', { name }).getBoundingClientRect();
      await expect(left).toBeGreaterThanOrEqual(bounds.left);
      await expect(right).toBeLessThanOrEqual(bounds.right);
    }
  },
};

/** The icon and the text start the banner, the choices end it, and the title keeps its order. */
export const LaysOutFromTheStartInBothDirections: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="relative h-72 bg-gray-100 dark:bg-gray-800">
      <CookieBanner
        title="We use cookies (3 of 5)."
        message={sampleMessage}
        onAccept={args.onAccept as () => void}
        onDeny={() => {}}
        onSettings={() => {}}
      />
    </div>
  ),
  args: { onAccept: fn() } as never,
  play: async ({ canvasElement }) => {
    const banner = within(canvasElement).getByRole('dialog');
    for (const dir of ['ltr', 'rtl'] as const) {
      await inDirection(dir, () => {
        const icon = banner.querySelector('svg')!;
        const title = within(banner).getByText('We use cookies (3 of 5).').closest('p')!;
        const accept = within(banner).getByRole('button', { name: 'Accept all' });
        const settings = within(banner).getByRole('button', { name: 'Cookie settings' });
        expect(startOffset(icon, banner)).toBeLessThan(startOffset(title, banner));
        expect(endOffset(accept, banner)).toBeLessThan(startOffset(accept, banner));
        expect(startOffset(settings, banner)).toBeLessThan(startOffset(accept, banner));
        expectReadsLeftToRight(title);
      });
    }
  },
};

// ── Motion ───────────────────────────────────────────────────────────────────

const RisingBanner = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative h-72 bg-gray-100 p-6 dark:bg-gray-800">
      <Button onClick={() => setOpen(true)} disabled={open}>
        {open ? 'Banner is open' : 'Show the banner'}
      </Button>
      <CookieBanner
        open={open}
        onOpenChange={setOpen}
        message={sampleMessage}
        onSettings={() => undefined}
        onDeny={() => undefined}
        onAccept={() => undefined}
      />
    </div>
  );
};

/**
 * The banner rises from the bottom as it fades in, 200 ms, and leaves the same way, 120 ms, on
 * Accept or Deny; with the reduced setting it shows and goes at once.
 */
export const RisesAndLeaves: Story = {
  tags: ['!autodocs'],
  parameters: { ...portalDocsParams.sm(), settleMotion: false },
  render: () => <RisingBanner />,
};

/** Open, the banner is opaque and in its place. */
export const OpenBannerIsAtRest: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="relative h-72">
      <CookieBanner message={sampleMessage} onAccept={fn()} />
    </div>
  ),
  play: async ({ canvas }) => {
    const banner = canvas.getByRole('dialog');
    await expect(getComputedStyle(banner).opacity).toBe('1');
    await expect(getComputedStyle(banner).translate).toBe('none');
    await expect(banner).not.toHaveAttribute('inert');
  },
};

// One banner for each place it can be fixed to, each with its own Accept.
const PLACES = [
  ['bottom', '0px 100%'],
  ['top', '0px -100%'],
  ['floating', '0px calc(100% + 16px)'],
] as const;

// Closed to begin with: the play function shows them, and reads the transitions it has just started.
const AllPlaces = () => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div className="relative h-72">
      <Button onClick={() => setOpen({ bottom: true, top: true, floating: true })}>Show all</Button>
      {PLACES.map(([position]) => (
        <CookieBanner
          key={position}
          position={position}
          title={`${position} banner`}
          message="We use cookies."
          acceptLabel={`Accept ${position}`}
          open={open[position] ?? false}
          onOpenChange={(next) => setOpen((now) => ({ ...now, [position]: next }))}
          onAccept={() => undefined}
        />
      ))}
    </div>
  );
};

/**
 * Each banner comes in from the edge it is fixed to, along the block axis, and goes back the way it
 * came; the floating one, off its edge by 1rem, takes that gap with it.
 */
export const BannerMovesToAndFromItsEdge: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <AllPlaces />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show all' }));
    // In: from out of sight to rest, fading in over the base duration. All three are read first:
    // they come in together, and the wait for one would outlast the others.
    for (const [position, away] of PLACES) {
      const banner = canvas.getByRole('dialog', { name: `${position} banner` });
      await expect(transitionValues(banner, 'translate')).toEqual([away, 'none']);
      await expect(transitionValues(banner, 'opacity')).toEqual(['0', '1']);
      await expect(transitionMs(banner)).toBe(tokenMs('--cosmos-motion-base'));
    }
    for (const [position] of PLACES) {
      const banner = canvas.getByRole('dialog', { name: `${position} banner` });
      await waitFor(() => expect(getComputedStyle(banner).opacity).toBe('1'));
    }
    for (const [position, away] of PLACES) {
      const banner = canvas.getByRole('dialog', { name: `${position} banner` });
      await userEvent.click(within(banner).getByRole('button', { name: `Accept ${position}` }));
      // Out: back to where it came from, over the shorter exit.
      await expect(transitionValues(banner, 'translate')).toEqual(['none', away]);
      await expect(transitionValues(banner, 'opacity')).toEqual(['1', '0']);
      await expect(transitionMs(banner)).toBe(tokenMs('--cosmos-motion-exit-lg'));
    }
    await waitFor(() => expect(canvas.queryAllByRole('dialog')).toHaveLength(0));
  },
};

/**
 * At its real speed, a banner that is closed is already out of the way while it leaves: out of the
 * tab order and the accessibility tree, taking no clicks. It is gone once it has left.
 */
export const LeavingBannerIsInert: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  args: { onAccept: fn(), onDeny: fn() } as never,
  render: (args) => (
    <div className="relative h-72">
      <CookieBanner
        message={sampleMessage}
        onAccept={args.onAccept as () => void}
        onDeny={args.onDeny as () => void}
      />
    </div>
  ),
  play: async ({ args, canvas }) => {
    const banner = canvas.getByRole('dialog');
    await waitFor(() => expect(getComputedStyle(banner).opacity).toBe('1'));
    await userEvent.click(within(banner).getByRole('button', { name: /deny all/i }));
    await expect(args.onDeny).toHaveBeenCalledTimes(1);
    // Still on screen, fading...
    await expect(banner).toBeInTheDocument();
    await expect(isFading(banner)).toBe(true);
    // ...and already out of the way.
    await expect(banner).toHaveAttribute('inert');
    await expect(getComputedStyle(banner).pointerEvents).toBe('none');
    await waitFor(() => expect(banner).not.toBeInTheDocument());
  },
};

const ReopenableBanner = () => {
  const [open, setOpen] = useState(true);
  return (
    <div className="relative h-72">
      <Button onClick={() => setOpen(true)}>Show again</Button>
      <CookieBanner
        open={open}
        onOpenChange={setOpen}
        message={sampleMessage}
        onAccept={() => undefined}
      />
    </div>
  );
};

/** Shown again while it leaves, the same banner comes back, not a second one. */
export const ReopeningWhileItLeavesKeepsTheBanner: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <ReopenableBanner />,
  play: async ({ canvas }) => {
    const banner = canvas.getByRole('dialog');
    await waitFor(() => expect(getComputedStyle(banner).opacity).toBe('1'));
    await userEvent.click(within(banner).getByRole('button', { name: /accept all/i }));
    await expect(isFading(banner)).toBe(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Show again' }));
    await expect(canvas.getAllByRole('dialog')).toHaveLength(1);
    await expect(canvas.getByRole('dialog')).toBe(banner);
    await expect(banner).not.toHaveAttribute('inert');
    await waitFor(() => expect(getComputedStyle(banner).opacity).toBe('1'));
    await expect(getComputedStyle(banner).translate).toBe('none');
  },
};

/** With the reduced setting the banner is there as it shows, and gone as it closes: nothing plays. */
export const BannerSkipsMotionWhenReduced: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { motion: 'reduced' },
  parameters: { settleMotion: false },
  render: () => <ReopenableBanner />,
  play: async ({ canvas }) => {
    const banner = canvas.getByRole('dialog');
    await expect(isFading(banner)).toBe(false);
    await expect(transitionMs(banner)).toBe(0);
    await expect(getComputedStyle(banner).opacity).toBe('1');
    await expect(getComputedStyle(banner).translate).toBe('none');
    await userEvent.click(within(banner).getByRole('button', { name: /accept all/i }));
    await expect(canvas.queryByRole('dialog')).toBeNull();
    await expect(banner).not.toBeInTheDocument();
  },
};
