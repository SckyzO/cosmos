import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { LabelsProvider } from '../labels/LabelsProvider';
import {
  bothDirections,
  directionBox,
  expectReadsLeftToRight,
  portalDocsParams,
} from '../storybook-helpers';
import { Button } from '../ui/Button';
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

// The host that shows the `sent` view once the form is submitted, and a button outside it that
// shows it too.
const SendingHost = () => {
  const [sent, setSent] = useState(false);
  return (
    <>
      <ResetPasswordForm sent={sent} sentEmail="john@example.com" onSubmit={() => setSent(true)} />
      <Button variant="secondary" size="sm" onClick={() => setSent(true)}>
        Pretend it was sent
      </Button>
    </>
  );
};

/** The button that was pressed is gone with the form: the focus goes to the new heading. */
export const FocusMovesToTheSentHeading: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  render: () => <SendingHost />,
  play: async ({ canvas }) => {
    // The form takes no focus when it mounts.
    await expect(canvas.getByRole('heading', { level: 1 })).not.toHaveFocus();
    await userEvent.type(canvas.getByLabelText(/^Email/), 'john@example.com');
    await userEvent.click(canvas.getByRole('button', { name: /send reset link/i }));
    await expect(canvas.getByRole('heading', { level: 1, name: 'Check your inbox' })).toHaveFocus();
  },
};

/** Focus the person had moved elsewhere on the page stays where it is. */
export const FocusElsewhereIsLeftWhenSentSwitches: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  render: () => <SendingHost />,
  play: async ({ canvas }) => {
    const outside = canvas.getByRole('button', { name: 'Pretend it was sent' });
    await userEvent.click(outside);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Check your inbox' })).toBeVisible();
    await expect(outside).toHaveFocus();
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

/** The provider's French words the form, the `sent` view and its resend wait; `labels` wins. */
export const LabelsFromProviderAndProp: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LabelsProvider
      labels={{
        resetPasswordForm: {
          title: 'Réinitialiser votre mot de passe',
          description: 'Saisissez votre e-mail pour recevoir un lien.',
          email: 'E-mail',
          emailPlaceholder: 'jean@exemple.fr',
          submit: 'Envoyer le lien',
          signIn: 'Retour à la connexion',
          sentTitle: 'Consultez votre boîte de réception',
          sentDescription: (email) => (
            <>Nous avons envoyé un lien à {email}. Il expire dans 1 heure.</>
          ),
          resend: 'Renvoyer',
          resent: 'Nous vous avons envoyé un nouveau lien.',
          ready: 'Vous pouvez demander un nouveau lien.',
          availableIn: (seconds) => `disponible dans ${seconds} s`,
        },
      }}
    >
      <div className="space-y-10">
        <div role="group" aria-label="Formulaire">
          <ResetPasswordForm onSubmit={fn()} signInHref="#" labels={{ signIn: 'Retour' }} />
        </div>
        <div role="group" aria-label="Envoyé">
          <ResetPasswordForm
            onSubmit={fn()}
            sent
            sentEmail="jean@exemple.fr"
            onResend={fn()}
            resendCooldown={30}
            signInHref="#"
          />
        </div>
      </div>
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    const form = within(canvas.getByRole('group', { name: 'Formulaire' }));
    await expect(
      form.getByRole('heading', { name: 'Réinitialiser votre mot de passe' })
    ).toBeVisible();
    await expect(form.getByText('Saisissez votre e-mail pour recevoir un lien.')).toBeVisible();
    await expect(form.getByRole('textbox', { name: 'E-mail' })).toHaveAttribute(
      'placeholder',
      'jean@exemple.fr'
    );
    await expect(form.getByRole('button', { name: 'Envoyer le lien' })).toBeVisible();
    // Its own `signIn` wins over the provider's.
    await expect(form.getByRole('link', { name: 'Retour' })).toBeVisible();
    await expect(form.queryByRole('link', { name: 'Retour à la connexion' })).toBeNull();

    const sent = within(canvas.getByRole('group', { name: 'Envoyé' }));
    await expect(
      sent.getByRole('heading', { name: 'Consultez votre boîte de réception' })
    ).toBeVisible();
    await expect(sent.getByText(/^Nous avons envoyé un lien à/).closest('p')).toHaveTextContent(
      'Nous avons envoyé un lien à jean@exemple.fr. Il expire dans 1 heure.'
    );
    const resend = sent.getByRole('button', { name: 'Renvoyer' });
    await expect(resend).toHaveAccessibleDescription(/^disponible dans \d+ s$/);
    await expect(sent.getByRole('link', { name: 'Retour à la connexion' })).toBeVisible();
  },
};
