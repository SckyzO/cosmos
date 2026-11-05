import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { LabelsProvider } from '../labels/LabelsProvider';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { estimateStrength } from '../storybook-strength';
import { Button } from '../ui/Button';
import { AuthLayout } from './AuthLayout';
import { NewPasswordForm, type NewPasswordFormView } from './NewPasswordForm';

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

const onPhone: Story = {
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
    await expect(confirm).not.toBeInvalid();
    // The show/hide button is part of the field; the next stop is out of it.
    await userEvent.tab();
    await userEvent.tab();
    await expect(confirm).toBeInvalid();
    await expect(confirm).toHaveAccessibleDescription('Passwords don’t match');
    // Once they match, the error gives way to a polite confirmation.
    await userEvent.type(confirm, '23!');
    await expect(confirm).not.toBeInvalid();
    await expect(confirm).toHaveAccessibleDescription('Passwords match');
  },
};

/** The field is left, so nothing else says it: an alert announces the mismatch as it appears. */
export const MismatchIsAnnounced: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  play: async ({ canvas }) => {
    const confirm = canvas.getByLabelText(/^Confirm password/);
    await userEvent.type(canvas.getByLabelText(/^New password/), 'SuperSecret_123!');
    await userEvent.type(confirm, 'SuperSecret_1');
    await expect(canvas.queryByRole('alert')).toBeNull();
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole('alert')).toHaveTextContent('Passwords don’t match');
    // Typing the rest takes the alert away, and the polite status takes over.
    await userEvent.type(confirm, '23!');
    await expect(canvas.queryByRole('alert')).toBeNull();
  },
};

/** Moving the focus to the show/hide button stays in the field: no mismatch shows mid-typing. */
export const MismatchWaitsForTheWholeFieldToBeLeft: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  play: async ({ canvas }) => {
    const confirm = canvas.getByLabelText(/^Confirm password/);
    await userEvent.type(canvas.getByLabelText(/^New password/), 'SuperSecret_123!');
    await userEvent.type(confirm, 'SuperSecret_1');
    await userEvent.tab();
    await expect(canvas.getAllByRole('button', { name: 'Show password' })[1]).toHaveFocus();
    await expect(confirm).not.toBeInvalid();
    await expect(canvas.queryByRole('alert')).toBeNull();
    // Out of the button, the field is left.
    await userEvent.tab();
    await expect(confirm).toBeInvalid();
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

// The host that switches the screen: the form's own submit goes to `done`, a button outside it to
// `expired`.
const SwitchingHost = () => {
  const [view, setView] = useState<NewPasswordFormView>('form');
  return (
    <>
      <NewPasswordForm view={view} onSubmit={() => setView('done')} />
      <Button variant="secondary" size="sm" onClick={() => setView('expired')}>
        Expire the link
      </Button>
    </>
  );
};

/** The button that was pressed is gone with its screen: the focus goes to the new heading. */
export const FocusMovesToTheNewHeadingWhenTheViewSwitches: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  render: () => <SwitchingHost />,
  play: async ({ canvas }) => {
    // The first screen takes no focus when it mounts.
    await expect(canvas.getByRole('heading', { level: 1 })).not.toHaveFocus();
    await userEvent.type(canvas.getByLabelText(/^New password/), 'SuperSecret_123!');
    await userEvent.type(canvas.getByLabelText(/^Confirm password/), 'SuperSecret_123!');
    await userEvent.click(canvas.getByRole('button', { name: 'Update password' }));
    await expect(canvas.getByRole('heading', { level: 1, name: 'Password updated' })).toHaveFocus();
  },
};

/** Focus the person had moved elsewhere on the page stays where it is. */
export const FocusElsewhereIsLeftWhenTheViewSwitches: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  render: () => <SwitchingHost />,
  play: async ({ canvas }) => {
    const outside = canvas.getByRole('button', { name: 'Expire the link' });
    await userEvent.click(outside);
    await expect(canvas.getByRole('heading', { level: 1, name: /no longer valid/ })).toBeVisible();
    await expect(outside).toHaveFocus();
  },
};

export const FitsOnAPhone: Story = {
  ...onPhone,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    await userEvent.type(canvas.getByLabelText(/^New password/), 'Correct-Horse-9');
    expectNoHorizontalOverflow(canvasElement);
  },
};

/** The provider's French words the three views and the confirmation; `labels` wins. */
export const LabelsFromProviderAndProp: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LabelsProvider
      labels={{
        newPasswordForm: {
          title: 'Choisissez un nouveau mot de passe',
          description: 'Un mot de passe que vous n’utilisez nulle part ailleurs.',
          newPassword: 'Nouveau mot de passe',
          confirmPassword: 'Confirmer le mot de passe',
          confirmPlaceholder: 'Répétez le mot de passe',
          mismatch: 'Les mots de passe ne correspondent pas',
          match: 'Les mots de passe correspondent',
          submit: 'Mettre à jour',
          signIn: 'Retour à la connexion',
          expiredTitle: 'Ce lien n’est plus valide',
          expiredDescription: 'Les liens ne servent qu’une fois. Demandez-en un nouveau.',
          request: 'Demander un nouveau lien',
          doneTitle: 'Mot de passe mis à jour',
          doneDescription: 'Vous pouvez vous connecter avec votre nouveau mot de passe.',
          continue: 'Continuer vers la connexion',
        },
      }}
    >
      <div className="space-y-10">
        <div role="group" aria-label="Formulaire">
          <NewPasswordForm onSubmit={fn()} signInHref="#" labels={{ submit: 'Valider' }} />
        </div>
        <div role="group" aria-label="Expiré">
          <NewPasswordForm onSubmit={fn()} view="expired" requestHref="#" signInHref="#" />
        </div>
        <div role="group" aria-label="Terminé">
          <NewPasswordForm onSubmit={fn()} view="done" signInHref="#" />
        </div>
      </div>
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    const form = within(canvas.getByRole('group', { name: 'Formulaire' }));
    await expect(
      form.getByRole('heading', { name: 'Choisissez un nouveau mot de passe' })
    ).toBeVisible();
    await expect(
      form.getByText('Un mot de passe que vous n’utilisez nulle part ailleurs.')
    ).toBeVisible();
    await expect(form.getByRole('link', { name: 'Retour à la connexion' })).toBeVisible();
    // Its own `submit` wins over the provider's.
    await expect(form.getByRole('button', { name: 'Valider' })).toBeVisible();
    await expect(form.queryByRole('button', { name: 'Mettre à jour' })).toBeNull();
    await userEvent.type(
      form.getByLabelText(/^Nouveau mot de passe/, { selector: 'input' }),
      'abc'
    );
    const confirm = form.getByLabelText(/^Confirmer le mot de passe/, { selector: 'input' });
    await expect(confirm).toHaveAttribute('placeholder', 'Répétez le mot de passe');
    await userEvent.type(confirm, 'abd');
    await userEvent.click(document.body);
    await expect(
      (await form.findAllByText('Les mots de passe ne correspondent pas')).length
    ).toBeGreaterThan(0);
    await userEvent.clear(confirm);
    await userEvent.type(confirm, 'abc');
    await expect(await form.findByText('Les mots de passe correspondent')).toBeVisible();

    const expired = within(canvas.getByRole('group', { name: 'Expiré' }));
    await expect(expired.getByRole('heading', { name: 'Ce lien n’est plus valide' })).toBeVisible();
    await expect(
      expired.getByText('Les liens ne servent qu’une fois. Demandez-en un nouveau.')
    ).toBeVisible();
    await expect(expired.getByRole('link', { name: 'Demander un nouveau lien' })).toBeVisible();

    const done = within(canvas.getByRole('group', { name: 'Terminé' }));
    await expect(done.getByRole('heading', { name: 'Mot de passe mis à jour' })).toBeVisible();
    await expect(
      done.getByText('Vous pouvez vous connecter avec votre nouveau mot de passe.')
    ).toBeVisible();
    await expect(done.getByRole('link', { name: 'Continuer vers la connexion' })).toBeVisible();
  },
};
