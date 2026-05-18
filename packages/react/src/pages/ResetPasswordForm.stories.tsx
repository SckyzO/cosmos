import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { AuthLayout } from './AuthLayout';
import { ResetPasswordForm } from './ResetPasswordForm';

const meta = {
  title: 'Pages/Reset Password Form',
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

export const SubmitFiresWithEmail: Story = {
  decorators: standaloneDecorator,
  args: { onSubmit: fn() },
  play: async ({ args, canvas }) => {
    const submit = canvas.getByRole('button', { name: /send reset link/i });
    await expect(submit).toBeDisabled();
    await userEvent.type(canvas.getByLabelText('Email'), 'john@example.com');
    await expect(submit).not.toBeDisabled();
    await userEvent.click(submit);
    await expect(args.onSubmit).toHaveBeenCalledWith('john@example.com');
  },
};

export const SentViewShowsEmail: Story = {
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
