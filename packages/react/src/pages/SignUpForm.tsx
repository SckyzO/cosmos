import { Mail, User } from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Checkbox } from '../forms/Checkbox';
import { Input } from '../forms/Input';
import { PasswordInput } from '../forms/PasswordInput';
import { PasswordPolicyChecker, defaultPasswordRules } from '../forms/PasswordPolicyChecker';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';
import { Link } from '../ui/Link';

export type SignUpFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  agreedToTerms: boolean;
};

export type SignUpFormProps = {
  onSubmit: (values: SignUpFormValues) => void | Promise<void>;
  signInHref?: string;
  signInLabel?: string;
  termsHref?: string;
  privacyHref?: string;
  /** Show PasswordPolicyChecker live below the password field. Default `true`. */
  showPolicy?: boolean;
  loading?: boolean;
  error?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  /** Slot rendered above the form (e.g. social provider buttons). */
  extraTop?: ReactNode;
  className?: string;
};

export const SignUpForm = ({
  onSubmit,
  signInHref,
  signInLabel = 'Sign in',
  termsHref = '#',
  privacyHref = '#',
  showPolicy = true,
  loading = false,
  error,
  title = 'Create your account',
  description = 'A few details to get you started.',
  submitLabel = 'Create account',
  extraTop,
  className,
}: SignUpFormProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const rules = useMemo(() => defaultPasswordRules(password), [password]);
  const allRulesPass = rules.every((r) => r.ok);
  const canSubmit =
    firstName.length > 0 &&
    lastName.length > 0 &&
    email.length > 0 &&
    (showPolicy ? allRulesPass : password.length > 0) &&
    agreedToTerms &&
    !loading;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    void onSubmit({ firstName, lastName, email, password, agreedToTerms });
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
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            icon={User}
            autoComplete="given-name"
            required
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
          />
          <Input
            label="Last name"
            autoComplete="family-name"
            required
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading}
          />
        </div>
        <Input
          label="Email"
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
          label="Password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        {showPolicy && password.length > 0 && <PasswordPolicyChecker rules={rules} />}
        <Checkbox
          label={
            <span>
              I agree to the{' '}
              <Link href={termsHref} variant="underline" className="text-current">
                terms
              </Link>{' '}
              and{' '}
              <Link href={privacyHref} variant="underline" className="text-current">
                privacy policy
              </Link>
              .
            </span>
          }
          checked={agreedToTerms}
          onChange={(c) => setAgreedToTerms(c)}
          disabled={loading}
        />
        <Button type="submit" loading={loading} disabled={!canSubmit} className="w-full">
          {submitLabel}
        </Button>
      </div>

      {signInHref && (
        <p className="mt-5 text-center text-xs text-[var(--color-text-muted)]">
          Already have an account?{' '}
          <Link href={signInHref} variant="colored">
            {signInLabel}
          </Link>
        </p>
      )}
    </form>
  );
};
