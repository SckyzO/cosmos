import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { AuthLayout } from './AuthLayout';
import { TwoStepVerificationForm } from './TwoStepVerificationForm';

const meta = {
  title: 'Pages/Two Step Verification Form',
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
          <div className="fixed bottom-4 left-4 rounded-md bg-green-500 px-3 py-1.5 text-sm text-white shadow-lg">
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

export const AutoSubmitOnComplete: Story = {
  decorators: standaloneDecorator,
  args: { onSubmit: fn(), sentTo: 'john@example.com', length: 4 },
  play: async ({ args, canvas }) => {
    const cells = canvas.getAllByRole('textbox');
    cells[0].focus();
    await userEvent.keyboard('1234');
    await expect(args.onSubmit).toHaveBeenCalledWith('1234');
  },
};

export const ManualSubmitDisabledUntilFilled: Story = {
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
    await userEvent.keyboard('123');
    await expect(submit).toBeDisabled();
    await userEvent.keyboard('4');
    await expect(submit).not.toBeDisabled();
    await userEvent.click(submit);
    await expect(args.onSubmit).toHaveBeenCalledWith('1234');
  },
};

export const ResendFiresHandler: Story = {
  decorators: standaloneDecorator,
  args: { onSubmit: fn(), onResend: fn(), sentTo: 'john@example.com' },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /resend code/i }));
    await expect(args.onResend).toHaveBeenCalledTimes(1);
  },
};
