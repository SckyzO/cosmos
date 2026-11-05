import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { LabelsProvider } from '../labels/LabelsProvider';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { estimateStrength } from '../storybook-strength';
import { Toaster, toast } from '../ui/Toast';
import { AuthLayout } from './AuthLayout';
import { SignUpForm } from './SignUpForm';

const meta = {
  title: 'Examples/Auth/Sign Up Form',
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

export const WithStrengthMeter: Story = {
  args: { strength: estimateStrength, signInHref: '#' },
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
                toast.success(`Account created for ${email}`);
              }
            }, 1200);
          }}
        />
        <Toaster />
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
export const SubmitDisabledUntilValid: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { onSubmit: fn() },
  play: async ({ args, canvas }) => {
    const submit = canvas.getByRole('button', { name: /create account/i });
    await expect(submit).toBeDisabled();
    await userEvent.type(canvas.getByLabelText(/^First name/), 'John');
    await userEvent.type(canvas.getByLabelText(/^Last name/), 'Doe');
    await userEvent.type(canvas.getByLabelText(/^Email/), 'john@example.com');
    await userEvent.type(canvas.getByLabelText(/^Password/), 'SuperSecret_123!');
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
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { onSubmit: fn() },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/At least 12 characters/i)).toBeNull();
    await userEvent.type(canvas.getByLabelText(/^Password/), 'abc');
    await expect(canvas.getByText(/At least 12 characters/i)).toBeInTheDocument();
  },
};

export const WeakPasswordKeepsSubmitDisabled: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { onSubmit: fn() },
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText(/^First name/), 'A');
    await userEvent.type(canvas.getByLabelText(/^Last name/), 'B');
    await userEvent.type(canvas.getByLabelText(/^Email/), 'a@b.co');
    await userEvent.type(canvas.getByLabelText(/^Password/), 'weak');
    await userEvent.click(canvas.getByLabelText(/i agree to the/i));
    const submit = canvas.getByRole('button', { name: /create account/i });
    await expect(submit).toBeDisabled();
  },
};

/** `rules` replaces the default policy: here only the length counts. */
export const CustomRulesDecideWhenSubmitOpens: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: {
    rules: (password: string) => [{ label: 'At least 6 characters', ok: password.length >= 6 }],
  },
  play: async ({ canvas }) => {
    const submit = canvas.getByRole('button', { name: /create account/i });
    await userEvent.type(canvas.getByLabelText(/^First name/), 'John');
    await userEvent.type(canvas.getByLabelText(/^Last name/), 'Doe');
    await userEvent.type(canvas.getByLabelText(/^Email/), 'john@example.com');
    await userEvent.click(canvas.getByLabelText(/i agree to the/i));
    await userEvent.type(canvas.getByLabelText(/^Password/), 'abcde');
    await expect(canvas.getByRole('listitem')).toHaveTextContent('At least 6 characters, not met');
    await expect(canvas.queryByText(/One symbol/)).toBeNull();
    await expect(submit).toBeDisabled();
    await userEvent.type(canvas.getByLabelText(/^Password/), 'f');
    await expect(submit).not.toBeDisabled();
  },
};

/** `strength` draws the meter once something is typed, and the field is described by it. */
export const StrengthDrawsTheMeterOnTyping: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { strength: estimateStrength },
  play: async ({ canvas }) => {
    const password = canvas.getByLabelText(/^Password/);
    await expect(canvas.queryByText(/Password strength/)).toBeNull();
    await userEvent.type(password, 'Correct-Horse-9');
    await expect(canvas.getByText(/Password strength/)).toHaveTextContent(
      'Password strength: Good'
    );
    await expect(password).toHaveAccessibleDescription('Password strength: Good');
  },
};

/** Without `strength` nothing changes: no meter, and the field has no description. */
export const WithoutStrengthThereIsNoMeter: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  play: async ({ canvas }) => {
    const password = canvas.getByLabelText(/^Password/);
    await userEvent.type(password, 'Correct-Horse-9');
    await expect(canvas.queryByText(/Password strength/)).toBeNull();
    await expect(password).not.toHaveAttribute('aria-describedby');
  },
};

// ── Narrow screens (#303) ────────────────────────────────────────────────────

/** Below `sm`, the first and last name stack instead of squeezing into two narrow columns. */
export const MobileStacksNameFields: Story = {
  tags: ['!dev'],
  globals: mobileViewport,
  args: { signInHref: '#' },
  play: async ({ canvas, canvasElement }) => {
    const first = canvas.getByLabelText(/First name/).getBoundingClientRect();
    const last = canvas.getByLabelText(/Last name/).getBoundingClientRect();
    await expect(last.top).toBeGreaterThanOrEqual(first.bottom);
    await expect(last.width).toBeCloseTo(first.width, 0);
    expectNoHorizontalOverflow(canvasElement);
  },
};

/** From `sm` they share a row. */
export const NameFieldsShareARowWhenWide: Story = {
  tags: ['!dev', '!autodocs'],
  args: { signInHref: '#' },
  play: async ({ canvas }) => {
    const first = canvas.getByLabelText(/First name/).getBoundingClientRect();
    const last = canvas.getByLabelText(/Last name/).getBoundingClientRect();
    await expect(last.top).toBeCloseTo(first.top, 0);
  },
};

/** The provider's French words the form and its sentence round the links; `labels` wins. */
export const LabelsFromProviderAndProp: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LabelsProvider
      labels={{
        signUpForm: {
          title: 'Créer votre compte',
          description: 'Quelques informations pour commencer.',
          firstName: 'Prénom',
          firstNamePlaceholder: 'Jean',
          lastName: 'Nom',
          lastNamePlaceholder: 'Dupont',
          email: 'E-mail',
          emailPlaceholder: 'jean@exemple.fr',
          password: 'Mot de passe',
          terms: 'conditions',
          privacy: 'politique de confidentialité',
          agree: (terms, privacy) => (
            <>
              J’accepte les {terms} et la {privacy}.
            </>
          ),
          submit: 'Créer le compte',
          haveAccount: 'Déjà un compte ?',
          signIn: 'Se connecter',
        },
      }}
    >
      <div className="space-y-10">
        <div role="group" aria-label="Fournisseur">
          <SignUpForm onSubmit={fn()} signInHref="#" />
        </div>
        <div role="group" aria-label="Propre">
          <SignUpForm onSubmit={fn()} labels={{ submit: 'Valider' }} />
        </div>
      </div>
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    const provided = within(canvas.getByRole('group', { name: 'Fournisseur' }));
    await expect(provided.getByRole('heading', { name: 'Créer votre compte' })).toBeVisible();
    await expect(provided.getByRole('textbox', { name: 'Prénom' })).toHaveAttribute(
      'placeholder',
      'Jean'
    );
    await expect(provided.getByRole('textbox', { name: 'Nom' })).toHaveAttribute(
      'placeholder',
      'Dupont'
    );
    await expect(provided.getByRole('textbox', { name: 'E-mail' })).toHaveAttribute(
      'placeholder',
      'jean@exemple.fr'
    );
    await expect(provided.getByLabelText(/^Mot de passe/, { selector: 'input' })).toBeVisible();
    await expect(
      provided.getByRole('checkbox', {
        name: /^J’accepte les conditions et la politique de confidentialité/,
      })
    ).toBeVisible();
    await expect(provided.getByRole('link', { name: 'conditions' })).toBeVisible();
    await expect(
      provided.getByRole('link', { name: 'politique de confidentialité' })
    ).toBeVisible();
    await expect(provided.getByRole('button', { name: 'Créer le compte' })).toBeVisible();
    await expect(provided.getByText(/^Déjà un compte \?/)).toBeVisible();
    await expect(provided.getByRole('link', { name: 'Se connecter' })).toBeVisible();

    const own = within(canvas.getByRole('group', { name: 'Propre' }));
    await expect(own.getByRole('button', { name: 'Valider' })).toBeVisible();
    await expect(own.getByRole('textbox', { name: 'Prénom' })).toBeVisible();
  },
};

/** The rules and the strength meter are worded by the provider's `passwordPolicyChecker` and `passwordStrengthMeter`. */
export const PolicyAndStrengthFollowTheProvider: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LabelsProvider
      labels={{
        signUpForm: { password: 'Mot de passe' },
        passwordPolicyChecker: {
          title: 'Exigences',
          minLength: 'Au moins 12 caractères',
          uppercase: 'Une majuscule',
          lowercase: 'Une minuscule',
          number: 'Un chiffre',
          symbol: 'Un symbole',
          met: 'respectée',
          notMet: 'non respectée',
        },
        passwordStrengthMeter: {
          name: 'Robustesse',
          levels: ['Très faible', 'Faible', 'Moyen', 'Bon', 'Fort'],
        },
      }}
    >
      <SignUpForm onSubmit={fn()} strength={estimateStrength} />
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    const password = canvas.getByLabelText(/^Mot de passe/, { selector: 'input' });
    await userEvent.type(password, 'Correct-Horse-9');
    await expect(canvas.getByText('Exigences')).toBeVisible();
    await expect(canvas.getByText('Au moins 12 caractères')).toBeVisible();
    await expect(canvas.getByText('Un symbole').closest('li')).toHaveTextContent(
      'Un symbole, respectée'
    );
    await expect(canvas.queryByText('At least 12 characters')).toBeNull();
    await expect(canvas.getByText(/Robustesse/)).toHaveTextContent('Robustesse: Bon');
    await expect(password).toHaveAccessibleDescription('Robustesse: Bon');
  },
};
