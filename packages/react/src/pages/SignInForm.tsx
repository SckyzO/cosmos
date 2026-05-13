import { Mail } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Checkbox } from '../forms/Checkbox';
import { Input } from '../forms/Input';
import { PasswordInput } from '../forms/PasswordInput';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';
import { Link } from '../ui/Link';

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
  signUpLabel?: string;
  title?: string;
  description?: string;
  emailLabel?: string;
  passwordLabel?: string;
  rememberLabel?: string;
  submitLabel?: string;
  forgotLabel?: string;
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
  signUpLabel = 'Create one',
  title = 'Sign in',
  description = 'Welcome back — enter your credentials below.',
  emailLabel = 'Email',
  passwordLabel = 'Password',
  rememberLabel = 'Keep me signed in',
  submitLabel = 'Sign in',
  forgotLabel = 'Forgot password?',
  loading = false,
  error,
  extraTop,
  className,
}: SignInFormProps) => {
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
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>

      {extraTop && <div className="mb-5">{extraTop}</div>}

      {error && (
        <div className="mb-4">
          <AlertBanner variant="error">{error}</AlertBanner>
        </div>
      )}

      <div className="space-y-4">
        <Input
          label={emailLabel}
          type="email"
          icon={Mail}
          autoComplete="email"
          required
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <PasswordInput
          label={passwordLabel}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <div className="flex items-center justify-between">
          <Checkbox
            label={rememberLabel}
            checked={remember}
            onChange={(c) => setRemember(c)}
            disabled={loading}
          />
          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-brand-500 hover:text-brand-600 text-xs font-medium transition-colors"
            >
              {forgotLabel}
            </button>
          )}
        </div>
        <Button type="submit" loading={loading} disabled={loading} className="w-full">
          {submitLabel}
        </Button>
      </div>

      {signUpHref && (
        <p className="mt-5 text-center text-xs text-[var(--color-text-muted)]">
          No account?{' '}
          <Link href={signUpHref} variant="colored">
            {signUpLabel}
          </Link>
        </p>
      )}
    </form>
  );
};
