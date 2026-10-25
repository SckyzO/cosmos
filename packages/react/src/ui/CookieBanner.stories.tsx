import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
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
  tags: ['!autodocs'],
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
  tags: ['!autodocs'],
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
export const FullChoicesOnMobile: Story = {
  ...FullChoices,
  globals: { viewport: { value: 'mobile', isRotated: false } },
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
