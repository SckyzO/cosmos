import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { AuthLayout } from './AuthLayout';
import { SignUpForm } from './SignUpForm';

const meta = {
  title: 'Pages/Sign Up Form',
  component: SignUpForm,
  parameters: portalDocsParams(720),
  tags: ['autodocs'],
  args: { onSubmit: fn() },
  decorators: [
    (Story) => (
      <AuthLayout logo={Activity} title="Cosmos" subtitle="Create your account">
        <Story />
      </AuthLayout>
    ),
  ],
} satisfies Meta<typeof SignUpForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = { args: { signInHref: '#' } };

export const WithoutPolicy: Story = {
  args: { showPolicy: false, signInHref: '#' },
};

export const WithError: Story = {
  args: {
    error: 'An account already exists with this email.',
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
    const [created, setCreated] = useState<string | null>(null);
    return (
      <>
        <SignUpForm
          loading={submitting}
          error={error}
          signInHref="#"
          onSubmit={({ email }) => {
            setError(undefined);
            setSubmitting(true);
            window.setTimeout(() => {
              setSubmitting(false);
              if (email.endsWith('@taken.com')) {
                setError('An account already exists with this email.');
              } else {
                setCreated(email);
              }
            }, 1200);
          }}
        />
        {created && (
          <div className="fixed bottom-4 left-4 rounded-md bg-green-500 px-3 py-1.5 text-sm text-white shadow-lg">
            Account created for {created}
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

export const SubmitDisabledUntilValid: Story = {
  decorators: standaloneDecorator,
  args: { onSubmit: fn() },
  play: async ({ args, canvas }) => {
    const submit = canvas.getByRole('button', { name: /create account/i });
    await expect(submit).toBeDisabled();
    await userEvent.type(canvas.getByLabelText('First name'), 'John');
    await userEvent.type(canvas.getByLabelText('Last name'), 'Doe');
    await userEvent.type(canvas.getByLabelText('Email'), 'john@example.com');
    await userEvent.type(canvas.getByLabelText('Password'), 'SuperSecret_123!');
    await expect(submit).toBeDisabled();
    await userEvent.click(canvas.getByLabelText(/i agree to the/i));
    await expect(submit).not.toBeDisabled();
    await userEvent.click(submit);
    await expect(args.onSubmit).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'SuperSecret_123!',
      agreedToTerms: true,
    });
  },
};

export const PolicyDisplaysOnTyping: Story = {
  decorators: standaloneDecorator,
  args: { onSubmit: fn() },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/At least 12 characters/i)).toBeNull();
    await userEvent.type(canvas.getByLabelText('Password'), 'abc');
    await expect(canvas.getByText(/At least 12 characters/i)).toBeInTheDocument();
  },
};

export const WeakPasswordKeepsSubmitDisabled: Story = {
  decorators: standaloneDecorator,
  args: { onSubmit: fn() },
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('First name'), 'A');
    await userEvent.type(canvas.getByLabelText('Last name'), 'B');
    await userEvent.type(canvas.getByLabelText('Email'), 'a@b.co');
    await userEvent.type(canvas.getByLabelText('Password'), 'weak');
    await userEvent.click(canvas.getByLabelText(/i agree to the/i));
    const submit = canvas.getByRole('button', { name: /create account/i });
    await expect(submit).toBeDisabled();
  },
};
