import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { LabelsProvider } from '../labels/LabelsProvider';
import { portalDocsParams } from '../storybook-helpers';
import { Toaster, toast } from '../ui/Toast';
import { AuthLayout } from './AuthLayout';
import { SignInForm } from './SignInForm';

const meta = {
  title: 'Examples/Auth/Sign In Form',
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
                toast.success(`Signed in as ${email}`);
              }
            }, 1200);
          }}
        />
        <Toaster />
      </>
    );
  },
};

// ── Interaction tests (override decorator → standalone container) ────────────

const standaloneDecorator = [
  (Story: () => React.ReactNode) => <div className="mx-auto max-w-sm p-12">{Story()}</div>,
];

// The interaction tests below stay off the docs page (`!autodocs`): their play
// functions take focus, which scrolls the docs page down to their iframe.
export const SubmitFiresWithValues: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { onSubmit: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.type(canvas.getByLabelText(/^Email/), 'john@example.com');
    await userEvent.type(canvas.getByLabelText(/^Password/), 'p4ssw0rd');
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
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { onSubmit: fn(), onForgotPassword: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /forgot password/i }));
    await expect(args.onForgotPassword).toHaveBeenCalledTimes(1);
    // The prop is `() => void`: the click event stays with the button.
    await expect(args.onForgotPassword).toHaveBeenCalledWith();
  },
};

export const LoadingDisablesSubmit: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { onSubmit: fn(), loading: true },
  play: async ({ args, canvas }) => {
    const submit = canvas.getByRole('button', { name: /^sign in$/i });
    await expect(submit).toBeDisabled();
    await userEvent.click(submit).catch(() => undefined);
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

/** The provider's French words the form; the form's own `labels` and the app's `title` win. */
export const LabelsFromProviderAndProp: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LabelsProvider
      labels={{
        signInForm: {
          title: 'Connexion',
          description: 'Bon retour — saisissez vos identifiants.',
          email: 'E-mail',
          emailPlaceholder: 'jean@exemple.fr',
          password: 'Mot de passe',
          remember: 'Rester connecté',
          forgot: 'Mot de passe oublié ?',
          submit: 'Se connecter',
          noAccount: 'Pas de compte ?',
          signUp: 'En créer un',
        },
      }}
    >
      <div className="space-y-10">
        <div role="group" aria-label="Fournisseur">
          <SignInForm onSubmit={fn()} onForgotPassword={fn()} signUpHref="#" />
        </div>
        <div role="group" aria-label="Propre">
          <SignInForm onSubmit={fn()} title="Mon titre" labels={{ submit: 'Entrer' }} />
        </div>
      </div>
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    const provided = within(canvas.getByRole('group', { name: 'Fournisseur' }));
    await expect(provided.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    await expect(provided.getByText('Bon retour — saisissez vos identifiants.')).toBeVisible();
    await expect(provided.getByRole('textbox', { name: 'E-mail' })).toHaveAttribute(
      'placeholder',
      'jean@exemple.fr'
    );
    await expect(provided.getByLabelText(/^Mot de passe/, { selector: 'input' })).toBeVisible();
    await expect(provided.getByRole('checkbox', { name: 'Rester connecté' })).toBeVisible();
    await expect(provided.getByRole('button', { name: 'Mot de passe oublié ?' })).toBeVisible();
    await expect(provided.getByRole('button', { name: 'Se connecter' })).toBeVisible();
    await expect(provided.getByText(/^Pas de compte \?/)).toBeVisible();
    await expect(provided.getByRole('link', { name: 'En créer un' })).toBeVisible();

    // The app's `title` wins over every label, and the form's own `submit` over the provider's.
    const own = within(canvas.getByRole('group', { name: 'Propre' }));
    await expect(own.getByRole('heading', { name: 'Mon titre' })).toBeVisible();
    await expect(own.getByRole('button', { name: 'Entrer' })).toBeVisible();
    await expect(own.getByRole('textbox', { name: 'E-mail' })).toBeVisible();
  },
};
