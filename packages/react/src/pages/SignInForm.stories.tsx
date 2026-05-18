import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { AuthLayout } from './AuthLayout';
import { SignInForm } from './SignInForm';

const meta = {
  title: 'Pages/Sign In Form',
  component: SignInForm,
  parameters: portalDocsParams(600),
  tags: ['autodocs'],
  args: { onSubmit: fn() },
  // Component-level decorator: every story below renders inside <AuthLayout>.
  // Stories override the decorator when isolation is needed (e.g. interaction tests).
  decorators: [
    (Story) => (
      <AuthLayout logo={Activity} title="Cosmos" subtitle="Sign in to continue">
        <Story />
      </AuthLayout>
    ),
  ],
} satisfies Meta<typeof SignInForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories (inherit AuthLayout from meta.decorators) ────────────────────────

export const Default: Story = {
  args: { signUpHref: '#', onForgotPassword: fn() },
};

export const WithError: Story = {
  args: {
    error: 'Invalid email or password — please try again.',
    signUpHref: '#',
    onForgotPassword: fn(),
  },
};

export const Loading: Story = {
  args: { loading: true, signUpHref: '#', onForgotPassword: fn() },
};

export const Interactive: Story = {
  render: () => {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [signedIn, setSignedIn] = useState<string | null>(null);
    return (
      <>
        <SignInForm
          loading={submitting}
          error={error}
          signUpHref="#"
          onForgotPassword={() => undefined}
          onSubmit={({ email, password }) => {
            setError(undefined);
            setSubmitting(true);
            window.setTimeout(() => {
              setSubmitting(false);
              if (password === 'wrong') {
                setError('Incorrect password. Try `letmein`.');
              } else {
                setSignedIn(email);
              }
            }, 1200);
          }}
        />
        {signedIn && (
          <div className="fixed bottom-4 left-4 rounded-md bg-green-500 px-3 py-1.5 text-sm text-white shadow-lg">
            Signed in as {signedIn}
          </div>
        )}
      </>
    );
  },
};

// ── Interaction tests (override decorator → standalone container) ────────────

const standaloneDecorator = [
  (Story: () => React.ReactNode) => <div className="mx-auto max-w-sm p-12">{Story()}</div>,
];

export const SubmitFiresWithValues: Story = {
  decorators: standaloneDecorator,
  args: { onSubmit: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.type(canvas.getByLabelText('Email'), 'john@example.com');
    await userEvent.type(canvas.getByLabelText('Password'), 'p4ssw0rd');
    await userEvent.click(canvas.getByLabelText(/keep me signed in/i));
    await userEvent.click(canvas.getByRole('button', { name: /^sign in$/i }));
    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: 'p4ssw0rd',
      remember: true,
    });
  },
};

export const ForgotFiresHandler: Story = {
  decorators: standaloneDecorator,
  args: { onSubmit: fn(), onForgotPassword: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /forgot password/i }));
    await expect(args.onForgotPassword).toHaveBeenCalledTimes(1);
  },
};

export const LoadingDisablesSubmit: Story = {
  decorators: standaloneDecorator,
  args: { onSubmit: fn(), loading: true },
  play: async ({ args, canvas }) => {
    const submit = canvas.getByRole('button', { name: /^sign in$/i });
    await expect(submit).toBeDisabled();
    await userEvent.click(submit).catch(() => undefined);
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};
