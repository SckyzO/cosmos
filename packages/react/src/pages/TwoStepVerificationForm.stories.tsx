import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  mobileViewport,
  portalDocsParams,
} from '../storybook-helpers';
import { AuthLayout } from './AuthLayout';
import { TwoStepVerificationForm } from './TwoStepVerificationForm';

const meta = {
  title: 'Pages/Auth/Two Step Verification Form',
  component: TwoStepVerificationForm,
  parameters: portalDocsParams(560),
  tags: ['autodocs'],
  args: { onSubmit: fn() },
  decorators: [
    (Story) => (
      <AuthLayout logo={Activity} title="Cosmos" subtitle="Verify your account">
        <Story />
      </AuthLayout>
    ),
  ],
} satisfies Meta<typeof TwoStepVerificationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: { sentTo: 'john@example.com', cancelHref: '#', onResend: fn() },
};

export const AuthenticatorApp: Story = {
  args: { cancelHref: '#' },
};

export const WithError: Story = {
  args: {
    sentTo: 'john@example.com',
    error: 'Invalid code — please try again.',
    cancelHref: '#',
    onResend: fn(),
  },
};

export const Loading: Story = {
  args: { loading: true, sentTo: 'john@example.com', cancelHref: '#' },
};

export const FourDigits: Story = {
  args: { length: 4, sentTo: 'john@example.com', cancelHref: '#' },
};

export const Interactive: Story = {
  render: () => {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [verified, setVerified] = useState(false);
    return (
      <>
        <TwoStepVerificationForm
          loading={submitting}
          error={error}
          sentTo="john@example.com"
          cancelHref="#"
          onResend={() => setError('We resent a fresh code.')}
          onSubmit={(code) => {
            setError(undefined);
            setSubmitting(true);
            window.setTimeout(() => {
              setSubmitting(false);
              if (code === '123456') setVerified(true);
              else setError('Invalid code — try `123456`.');
            }, 1200);
          }}
        />
        {verified && (
          <div className="inset-s-4 fixed bottom-4 rounded-md bg-green-500 px-3 py-1.5 text-sm text-white shadow-lg">
            Account verified!
          </div>
        )}
      </>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

const standaloneDecorator = [
  (Story: () => React.ReactNode) => <div className="mx-auto max-w-sm p-12">{Story()}</div>,
];

// The interaction tests below stay off the docs page (`!autodocs`): their play
// functions take focus, which scrolls the docs page down to their iframe.
export const AutoSubmitOnComplete: Story = {
  tags: ['!autodocs'],
  decorators: standaloneDecorator,
  args: { onSubmit: fn(), sentTo: 'john@example.com', length: 4 },
  play: async ({ args, canvas }) => {
    const cells = canvas.getAllByRole('textbox');
    cells[0].focus();
    // One keyboard() call per digit: each call targets the cell that has focus
    // now. A single '1234' call kept typing into the first cell under the
    // Storybook UI's simulated events, though the input moves focus forward.
    for (const digit of '1234') await userEvent.keyboard(digit);
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledWith('1234'));
  },
};

export const ManualSubmitDisabledUntilFilled: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: {
    onSubmit: fn(),
    autoSubmit: false,
    sentTo: 'john@example.com',
    length: 4,
  },
  play: async ({ args, canvas }) => {
    const submit = canvas.getByRole('button', { name: /verify my account/i });
    await expect(submit).toBeDisabled();
    const cells = canvas.getAllByRole('textbox');
    cells[0].focus();
    // One keyboard() call per digit, as in AutoSubmitOnComplete.
    for (const digit of '123') await userEvent.keyboard(digit);
    await expect(submit).toBeDisabled();
    await userEvent.keyboard('4');
    await waitFor(() => expect(submit).not.toBeDisabled());
    await userEvent.click(submit);
    await expect(args.onSubmit).toHaveBeenCalledWith('1234');
  },
};

export const ResendFiresHandler: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { onSubmit: fn(), onResend: fn(), sentTo: 'john@example.com' },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /resend code/i }));
    await expect(args.onResend).toHaveBeenCalledTimes(1);
  },
};

// ── Resend code (#303) ───────────────────────────────────────────────────────

/** "Resend code" is a ghost button of at least 44px, a touch target on a phone too. */
export const ResendIsA44pxButton: Story = {
  tags: ['!dev'],
  globals: mobileViewport,
  args: { onSubmit: fn(), onResend: fn(), sentTo: 'john@example.com' },
  play: async ({ canvas, canvasElement }) => {
    const resend = canvas.getByRole('button', { name: 'Resend code' });
    await expect(resend.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await expect(resend).toBeEnabled();
    expectNoHorizontalOverflow(canvasElement);
  },
};

// The back arrow points along the line, so it turns around in right to left; the number the code
// went to is the host's and keeps its own order inside the sentence ("+33 6 12" would lose its plus).
export const MirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onSubmit: fn(), sentTo: '+33 6 12 34 56 78', cancelHref: '#' },
  render: (args) => bothDirections(() => <TwoStepVerificationForm {...args} />),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const arrow = box.querySelector('.lucide-arrow-left')!;
      await expect(getComputedStyle(arrow).scale, dir).toBe(dir === 'rtl' ? '-1 1' : 'none');
      expectReadsLeftToRight(box.querySelector('bdi')!);
    }
  },
};
