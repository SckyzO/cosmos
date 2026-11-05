import { Mail } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Checkbox } from '../forms/Checkbox';
import { Input } from '../forms/Input';
import { PasswordInput } from '../forms/PasswordInput';
import { useLabels } from '../labels/labelsContext';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';
import { Link } from '../ui/Link';
import { SIGN_IN_FORM_LABELS, type SignInFormLabels } from './labels';

export type SignInFormValues = {
  email: string;
  password: string;
  remember: boolean;
};

export type SignInFormProps = {
  onSubmit: (values: SignInFormValues) => void | Promise<void>;
  onForgotPassword?: () => void;
  /** Sign-up CTA target (router link href). Hidden if not provided. */
  signUpHref?: string;
  /** The sign-up link. Default `labels.signUp`. */
  signUpLabel?: string;
  /** The title. Default `labels.title`. */
  title?: string;
  /** The line under the title. Default `labels.description`. */
  description?: string;
  /** Label of the email field. Default `labels.email`. */
  emailLabel?: string;
  /** Label of the password field. Default `labels.password`. */
  passwordLabel?: string;
  /** Label of the checkbox. Default `labels.remember`. */
  rememberLabel?: string;
  /** The submit button. Default `labels.submit`. */
  submitLabel?: string;
  /** The link that asks for a new password. Default `labels.forgot`. */
  forgotLabel?: string;
  /** The texts it writes, over `LabelsProvider`'s `signInForm` and the English defaults. */
  labels?: Partial<SignInFormLabels>;
  loading?: boolean;
  error?: string;
  /** Slot rendered above the form (e.g. social provider buttons). */
  extraTop?: ReactNode;
  className?: string;
};

export const SignInForm = ({
  onSubmit,
  onForgotPassword,
  signUpHref,
  signUpLabel,
  title,
  description,
  emailLabel,
  passwordLabel,
  rememberLabel,
  submitLabel,
  forgotLabel,
  labels: ownLabels,
  loading = false,
  error,
  extraTop,
  className,
}: SignInFormProps) => {
  const labels = useLabels('signInForm', SIGN_IN_FORM_LABELS, ownLabels);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    void onSubmit({ email, password, remember });
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title ?? labels.title}
        </h1>
        {(description ?? labels.description) && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description ?? labels.description}
          </p>
        )}
      </div>

      {extraTop && <div className="mb-5">{extraTop}</div>}

      {error && (
        <div className="mb-4">
          <AlertBanner intent="danger">{error}</AlertBanner>
        </div>
      )}

      <div className="space-y-4">
        <Input
          label={emailLabel ?? labels.email}
          type="email"
          icon={Mail}
          autoComplete="email"
          required
          placeholder={labels.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <PasswordInput
          label={passwordLabel ?? labels.password}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <div className="flex items-center justify-between">
          <Checkbox
            label={rememberLabel ?? labels.remember}
            checked={remember}
            onChange={(c) => setRemember(c)}
            disabled={loading}
          />
          {onForgotPassword && (
            <Button variant="link" size="sm" onClick={() => onForgotPassword()}>
              {forgotLabel ?? labels.forgot}
            </Button>
          )}
        </div>
        <Button type="submit" loading={loading} disabled={loading} className="w-full">
          {submitLabel ?? labels.submit}
        </Button>
      </div>

      {signUpHref && (
        <p className="mt-5 text-center text-xs text-[var(--color-text-muted)]">
          {labels.noAccount}{' '}
          <Link href={signUpHref} variant="colored">
            {signUpLabel ?? labels.signUp}
          </Link>
        </p>
      )}
    </form>
  );
};
