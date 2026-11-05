import { Mail, User } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Checkbox } from '../forms/Checkbox';
import { Input } from '../forms/Input';
import { PASSWORD_POLICY_LABELS } from '../forms/labels';
import { defaultPasswordRules, type PasswordRule } from '../forms/PasswordPolicyChecker';
import { useLabels } from '../labels/labelsContext';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';
import { Link } from '../ui/Link';
import { SIGN_UP_FORM_LABELS, type SignUpFormLabels } from './labels';
import { NewPasswordField } from './NewPasswordField';

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
  /** The sign-in link. Default `labels.signIn`. */
  signInLabel?: string;
  termsHref?: string;
  privacyHref?: string;
  /** Show PasswordPolicyChecker live below the password field. Default `true`. */
  showPolicy?: boolean;
  /**
   * The password policy: what the rules say of a password. Default `defaultPasswordRules`. They
   * are listed once something is typed and keep the form closed until they all hold, unless
   * `showPolicy` is `false`.
   */
  rules?: (password: string) => PasswordRule[];
  /**
   * Scores a password from 0 to 4 (zxcvbn's scale). Given, a `PasswordStrengthMeter` shows under
   * the field once something is typed. Cosmos bundles no estimator: see the docs.
   */
  strength?: (password: string) => number;
  loading?: boolean;
  error?: string;
  /** The title. Default `labels.title`. */
  title?: string;
  /** The line under the title. Default `labels.description`. */
  description?: string;
  /** The submit button. Default `labels.submit`. */
  submitLabel?: string;
  /** The texts it writes, over `LabelsProvider`'s `signUpForm` and the English defaults. */
  labels?: Partial<SignUpFormLabels>;
  /** Slot rendered above the form (e.g. social provider buttons). */
  extraTop?: ReactNode;
  className?: string;
};

export const SignUpForm = ({
  onSubmit,
  signInHref,
  signInLabel,
  termsHref = '#',
  privacyHref = '#',
  showPolicy = true,
  rules: rulesProp,
  strength,
  loading = false,
  error,
  title,
  description,
  submitLabel,
  labels: ownLabels,
  extraTop,
  className,
}: SignUpFormProps) => {
  const labels = useLabels('signUpForm', SIGN_UP_FORM_LABELS, ownLabels);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // The default policy is worded by the dictionary's `passwordPolicyChecker` keys.
  const policy = useLabels('passwordPolicyChecker', PASSWORD_POLICY_LABELS);
  const rules = (rulesProp ?? ((value) => defaultPasswordRules(value, policy)))(password);
  const allRulesPass = rules.every((r) => r.ok);
  const canSubmit =
    firstName.length > 0 &&
    lastName.length > 0 &&
    email.length > 0 &&
    password.length > 0 &&
    (!showPolicy || allRulesPass) &&
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label={labels.firstName}
            icon={User}
            autoComplete="given-name"
            required
            placeholder={labels.firstNamePlaceholder}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
          />
          <Input
            label={labels.lastName}
            autoComplete="family-name"
            required
            placeholder={labels.lastNamePlaceholder}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading}
          />
        </div>
        <Input
          label={labels.email}
          type="email"
          icon={Mail}
          autoComplete="email"
          required
          placeholder={labels.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <NewPasswordField
          label={labels.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          rules={showPolicy && password.length > 0 && rules.length > 0 ? rules : null}
          score={strength && password.length > 0 ? strength(password) : undefined}
        />
        <Checkbox
          label={
            <span>
              {labels.agree(
                <Link href={termsHref} variant="underline" className="text-current">
                  {labels.terms}
                </Link>,
                <Link href={privacyHref} variant="underline" className="text-current">
                  {labels.privacy}
                </Link>
              )}
            </span>
          }
          checked={agreedToTerms}
          onChange={(c) => setAgreedToTerms(c)}
          disabled={loading}
        />
        <Button type="submit" loading={loading} disabled={!canSubmit} className="w-full">
          {submitLabel ?? labels.submit}
        </Button>
      </div>

      {signInHref && (
        <p className="mt-5 text-center text-xs text-[var(--color-text-muted)]">
          {labels.haveAccount}{' '}
          <Link href={signInHref} variant="colored">
            {signInLabel ?? labels.signIn}
          </Link>
        </p>
      )}
    </form>
  );
};
