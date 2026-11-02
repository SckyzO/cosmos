import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  expectReadsLeftToRight,
  portalDocsParams,
} from '../storybook-helpers';
import { AuthLayout } from './AuthLayout';
import { ResetPasswordForm } from './ResetPasswordForm';

const meta = {
  title: 'Examples/Auth/Reset Password Form',
  component: ResetPasswordForm,
  parameters: portalDocsParams(500),
  tags: ['autodocs'],
  args: { onSubmit: fn() },
  decorators: [
    (Story) => (
      <AuthLayout logo={Activity} title="Cosmos" subtitle="Reset your password">
        <Story />
      </AuthLayout>
    ),
  ],
} satisfies Meta<typeof ResetPasswordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = { args: { signInHref: '#' } };

export const SentConfirmation: Story = {
  args: {
    sent: true,
    sentEmail: 'john@example.com',
    signInHref: '#',
    onResend: fn(),
  },
};

// The countdown depends on how long the story has been open: no capture.
export const SentWithResendCooldown: Story = {
  tags: ['no-capture'],
  args: {
    sent: true,
    sentEmail: 'john@example.com',
    signInHref: '#',
    onResend: fn(),
    resendCooldown: 30,
  },
};

export const WithError: Story = {
  args: {
    error: 'No account found with that email.',
    signInHref: '#',
  },
};

export const Loading: Story = {
  args: { loading: true, signInHref: '#' },
};

export const Interactive: Story = {
  render: () => {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [sent, setSent] = useState(false);
    const [lastEmail, setLastEmail] = useState('');

    const handleSubmit = (email: string) => {
      setError(undefined);
      setLastEmail(email);
      setSubmitting(true);
      window.setTimeout(() => {
        setSubmitting(false);
        if (email.endsWith('@unknown.com')) {
          setError('No account found with that email.');
        } else {
          setSent(true);
        }
      }, 1200);
    };

    return (
      <ResetPasswordForm
        loading={submitting}
        error={error}
        sent={sent}
        sentEmail={lastEmail}
        signInHref="#"
        onResend={() => handleSubmit(lastEmail)}
        onSubmit={handleSubmit}
      />
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

const standaloneDecorator = [
  (Story: () => React.ReactNode) => <div className="mx-auto max-w-sm p-12">{Story()}</div>,
];

// The interaction tests below stay off the docs page (`!autodocs`): their play
// functions take focus, which scrolls the docs page down to their iframe.
export const SubmitFiresWithEmail: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { onSubmit: fn() },
  play: async ({ args, canvas }) => {
    const submit = canvas.getByRole('button', { name: /send reset link/i });
    await expect(submit).toBeDisabled();
    await userEvent.type(canvas.getByLabelText(/^Email/), 'john@example.com');
    await expect(submit).not.toBeDisabled();
    await userEvent.click(submit);
    await expect(args.onSubmit).toHaveBeenCalledWith('john@example.com');
  },
};

export const SentViewShowsEmail: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: {
    onSubmit: fn(),
    onResend: fn(),
    sent: true,
    sentEmail: 'john@example.com',
    signInHref: '#',
  },
  play: async ({ args, canvas }) => {
    await expect(canvas.getByText('john@example.com')).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { name: /check your inbox/i })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /resend/i }));
    await expect(args.onResend).toHaveBeenCalledTimes(1);
  },
};

// The back arrow points along the line, so it turns around in right to left; the address is the
// host's and keeps its own order inside the sentence.
export const SentViewMirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { onSubmit: fn(), sent: true, sentEmail: 'john@example.com', signInHref: '#' },
  render: (args) => bothDirections(() => <ResetPasswordForm {...args} />),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const arrow = box.querySelector('.lucide-arrow-left')!;
      await expect(getComputedStyle(arrow).scale, dir).toBe(dir === 'rtl' ? '-1 1' : 'none');
      expectReadsLeftToRight(box.querySelector('bdi')!);
    }
  },
};

// ── Resend cooldown ──────────────────────────────────────────────────────────

// Real seconds, so a 2 s cooldown and waits on what is checked, never a sleep.
const resendButton = (canvas: { getByRole: (role: string, o: object) => HTMLElement }) =>
  canvas.getByRole('button', { name: 'Resend' });

export const SentViewCountsDownBeforeResend: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { sent: true, sentEmail: 'john@example.com', onResend: fn(), resendCooldown: 2 },
  play: async ({ args, canvas }) => {
    const resend = resendButton(canvas);
    const status = canvas.getByRole('status');
    // The e-mail was just sent: the button waits, dimmed but focusable, and a press does nothing.
    await expect(resend).toHaveAttribute('aria-disabled', 'true');
    await expect(resend).not.toBeDisabled();
    await expect(resend).toHaveAccessibleDescription(/available in 0:0[12]/);
    resend.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onResend).not.toHaveBeenCalled();
    await expect(resend).toHaveFocus();
    await waitFor(() => expect(resend).not.toHaveAttribute('aria-disabled'), { timeout: 3500 });
    await expect(status).toHaveTextContent('You can request a new link.');
    // A press sends again and restarts the wait.
    await userEvent.keyboard('{Enter}');
    await expect(args.onResend).toHaveBeenCalledTimes(1);
    await expect(resend).toHaveAttribute('aria-disabled', 'true');
    await expect(status).toHaveTextContent('We sent you a new link.');
    await expect(resend).toHaveFocus();
  },
};

export const SentViewWithoutCooldownIsAsItWas: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { sent: true, sentEmail: 'john@example.com', onResend: fn() },
  play: async ({ args, canvas }) => {
    const resend = resendButton(canvas);
    await expect(resend).not.toHaveAttribute('aria-disabled');
    await userEvent.click(resend);
    await userEvent.click(resend);
    await expect(args.onResend).toHaveBeenCalledTimes(2);
    await expect(canvas.queryByRole('status')).toBeNull();
  },
};
