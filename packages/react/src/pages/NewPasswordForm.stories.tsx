import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { estimateStrength } from '../storybook-strength';
import { AuthLayout } from './AuthLayout';
import { NewPasswordForm } from './NewPasswordForm';

const meta = {
  title: 'Examples/Auth/New Password Form',
  component: NewPasswordForm,
  parameters: portalDocsParams(760),
  tags: ['autodocs'],
  args: { onSubmit: fn() },
  decorators: [
    (Story) => (
      <AuthLayout logo={Activity} title="Cosmos" subtitle="Reset your password">
        <Story />
      </AuthLayout>
    ),
  ],
} satisfies Meta<typeof NewPasswordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = { args: { signInHref: '#' } };

export const WithStrengthMeter: Story = {
  args: { signInHref: '#', strength: estimateStrength },
};

export const WithError: Story = {
  args: { error: 'This password appeared in a data breach. Choose another one.', signInHref: '#' },
};

export const Loading: Story = { args: { loading: true, signInHref: '#' } };

export const Expired: Story = {
  args: { view: 'expired', requestHref: '#', signInHref: '#' },
};

export const Done: Story = { args: { view: 'done', signInHref: '#' } };

/** The step the e-mail link opens: the form, then the done screen, or the expired one. */
export const Interactive: Story = {
  render: () => {
    const [view, setView] = useState<'form' | 'done'>('form');
    const [submitting, setSubmitting] = useState(false);
    return (
      <NewPasswordForm
        view={view}
        loading={submitting}
        strength={estimateStrength}
        signInHref="#"
        onSubmit={() => {
          setSubmitting(true);
          window.setTimeout(() => {
            setSubmitting(false);
            setView('done');
          }, 1000);
        }}
      />
    );
  },
};

/** In the split page of the demo: the form takes the column, the panel the brand. */
export const InSplitLayout: Story = {
  parameters: { layout: 'fullscreen' },
  args: { signInHref: '#', strength: estimateStrength },
  decorators: [
    (Story) => (
      <AuthLayout
        variant="split"
        logo={Activity}
        title="Cosmos Cloud"
        subtitle="Monitor every rack, node and alert from one place."
      >
        <Story />
      </AuthLayout>
    ),
  ],
};

export const OnPhone: Story = {
  globals: mobileViewport,
  args: { signInHref: '#', strength: estimateStrength },
};

// ── Interaction tests ────────────────────────────────────────────────────────

const standaloneDecorator = [
  (Story: () => React.ReactNode) => <div className="mx-auto max-w-sm p-12">{Story()}</div>,
];

// The interaction tests below stay off the docs page (`!autodocs`): their play
// functions take focus, which scrolls the docs page down to their iframe.
export const SubmitWaitsForTheRulesAndTheConfirmation: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { onSubmit: fn() },
  play: async ({ args, canvas }) => {
    const submit = canvas.getByRole('button', { name: 'Update password' });
    const password = canvas.getByLabelText(/^New password/);
    const confirm = canvas.getByLabelText(/^Confirm password/);
    await expect(submit).toBeDisabled();
    // The rules fail: the confirmation alone does not open it.
    await userEvent.type(password, 'weak');
    await userEvent.type(confirm, 'weak');
    await expect(submit).toBeDisabled();
    // The rules pass, the confirmation does not.
    await userEvent.clear(password);
    await userEvent.clear(confirm);
    await userEvent.type(password, 'SuperSecret_123!');
    await expect(submit).toBeDisabled();
    await userEvent.type(confirm, 'SuperSecret_123');
    await expect(submit).toBeDisabled();
    await userEvent.type(confirm, '!');
    await expect(submit).not.toBeDisabled();
    await userEvent.click(submit);
    await expect(args.onSubmit).toHaveBeenCalledWith('SuperSecret_123!');
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
  },
};

export const RulesAreShownFromTheStart: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  play: async ({ canvas }) => {
    const rules = canvas.getAllByRole('listitem');
    await expect(rules[0]).toHaveTextContent('At least 12 characters, not met');
    await userEvent.type(canvas.getByLabelText(/^New password/), 'Ab1!');
    await expect(rules[1]).toHaveTextContent('One uppercase letter, met');
  },
};

export const MismatchShowsWhenLeavingTheField: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  play: async ({ canvas }) => {
    const confirm = canvas.getByLabelText(/^Confirm password/);
    await userEvent.type(canvas.getByLabelText(/^New password/), 'SuperSecret_123!');
    await userEvent.type(confirm, 'SuperSecret_1');
    // Not on every key.
    await expect(canvas.queryByText('Passwords don’t match')).toBeNull();
    await userEvent.tab();
    await expect(canvas.getByText('Passwords don’t match')).toBeInTheDocument();
    await expect(confirm).toBeInvalid();
    // Once they match, the error gives way to a polite confirmation.
    await userEvent.type(confirm, '23!');
    await expect(canvas.queryByText('Passwords don’t match')).toBeNull();
    await expect(canvas.getByText('Passwords match')).toBeInTheDocument();
  },
};

/** `rules` replaces the default policy, and an empty list asks for a non-empty password only. */
export const CustomRulesDecideWhenSubmitOpens: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: {
    rules: (password: string) => [{ label: 'At least 6 characters', ok: password.length >= 6 }],
  },
  play: async ({ canvas }) => {
    const submit = canvas.getByRole('button', { name: 'Update password' });
    await expect(canvas.queryByText('One symbol')).toBeNull();
    await userEvent.type(canvas.getByLabelText(/^New password/), 'abcde');
    await userEvent.type(canvas.getByLabelText(/^Confirm password/), 'abcde');
    await expect(submit).toBeDisabled();
    await userEvent.type(canvas.getByLabelText(/^New password/), 'f');
    await userEvent.type(canvas.getByLabelText(/^Confirm password/), 'f');
    await expect(submit).not.toBeDisabled();
  },
};

export const NoRulesAsksForAPasswordOnly: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { rules: () => [] },
  play: async ({ canvas }) => {
    const submit = canvas.getByRole('button', { name: 'Update password' });
    await expect(canvas.queryByText('Password requirements')).toBeNull();
    await expect(submit).toBeDisabled();
    await userEvent.type(canvas.getByLabelText(/^New password/), 'a');
    await userEvent.type(canvas.getByLabelText(/^Confirm password/), 'a');
    await expect(submit).not.toBeDisabled();
  },
};

export const StrengthDrawsTheMeterAndDescribesTheField: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { strength: estimateStrength },
  play: async ({ canvas }) => {
    const password = canvas.getByLabelText(/^New password/);
    await expect(canvas.queryByText(/Password strength/)).toBeNull();
    await userEvent.type(password, 'Correct-Horse-9');
    await expect(canvas.getByText(/Password strength/)).toHaveTextContent(
      'Password strength: Good'
    );
    await expect(password).toHaveAccessibleDescription('Password strength: Good');
  },
};

export const WithoutStrengthThereIsNoMeter: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  play: async ({ canvas }) => {
    const password = canvas.getByLabelText(/^New password/);
    await userEvent.type(password, 'Correct-Horse-9');
    await expect(canvas.queryByText(/Password strength/)).toBeNull();
    await expect(password).not.toHaveAttribute('aria-describedby');
  },
};

export const LoadingDisablesTheFields: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { loading: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/^New password/)).toBeDisabled();
    await expect(canvas.getByLabelText(/^Confirm password/)).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Update password' })).toBeDisabled();
  },
};

export const ExpiredViewOffersANewLink: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { view: 'expired', requestHref: '/forgot-password', signInHref: '/sign-in' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'This link is no longer valid' })
    ).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'Send me a new link' })).toHaveAttribute(
      'href',
      '/forgot-password'
    );
    await expect(canvas.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute(
      'href',
      '/sign-in'
    );
    await expect(canvas.queryByLabelText(/password/i)).toBeNull();
  },
};

export const ExpiredViewWithoutRequestHrefHasNoLink: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { view: 'expired' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1 })).toBeInTheDocument();
    await expect(canvas.queryByRole('link')).toBeNull();
  },
};

export const DoneViewLinksToSignIn: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { view: 'done', signInHref: '/sign-in' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Password updated' })
    ).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'Continue to sign in' })).toHaveAttribute(
      'href',
      '/sign-in'
    );
    await expect(canvas.queryByLabelText(/password/i)).toBeNull();
  },
};

export const EveryViewHasOneHeading: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  render: () => (
    <>
      {(['form', 'expired', 'done'] as const).map((view) => (
        <div key={view} data-testid={view}>
          <NewPasswordForm view={view} onSubmit={fn()} />
        </div>
      ))}
    </>
  ),
  play: async ({ canvas }) => {
    for (const view of ['form', 'expired', 'done']) {
      const box = canvas.getByTestId(view);
      await expect(box.querySelectorAll('h1')).toHaveLength(1);
    }
  },
};

export const FitsOnAPhone: Story = {
  ...OnPhone,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    await userEvent.type(canvas.getByLabelText(/^New password/), 'Correct-Horse-9');
    expectNoHorizontalOverflow(canvasElement);
  },
};
