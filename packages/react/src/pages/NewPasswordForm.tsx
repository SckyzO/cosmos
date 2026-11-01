import { ArrowLeft, CircleCheck, Clock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PasswordInput } from '../forms/PasswordInput';
import { defaultPasswordRules, type PasswordRule } from '../forms/PasswordPolicyChecker';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';
import { Link } from '../ui/Link';
import { NewPasswordField } from './NewPasswordField';

/** `form` asks for the password, `expired` is a link that no longer works, `done` is the end. */
export type NewPasswordFormView = 'form' | 'expired' | 'done';

export type NewPasswordFormProps = {
  /** Called with the new password once it follows the `rules` and the confirmation matches. */
  onSubmit: (password: string) => void | Promise<void>;
  /** Which screen to show. Default `form`. */
  view?: NewPasswordFormView;
  /** `expired`: where to ask for another link. Without it, the view has no link to follow. */
  requestHref?: string;
  requestLabel?: string;
  /** `form` and `expired`: where "Back to sign in" goes; `done`: where "Continue to sign in" goes. */
  signInHref?: string;
  signInLabel?: string;
  /** `done`: the label of the link to the sign-in page. */
  continueLabel?: string;
  /**
   * The password policy: what the rules say of a password, listed live under the field. Default
   * `defaultPasswordRules`. The form stays closed until they all hold; a list that comes back
   * empty shows none and asks for a non-empty password only.
   */
  rules?: (password: string) => PasswordRule[];
  /**
   * Scores a password from 0 to 4 (zxcvbn's scale). Given, a `PasswordStrengthMeter` shows under
   * the field once something is typed. Cosmos bundles no estimator: see the docs.
   */
  strength?: (password: string) => number;
  loading?: boolean;
  error?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  className?: string;
};

/**
 * The page the e-mail link of `ResetPasswordForm` opens: a new password and its confirmation, then
 * a confirmation screen, or an offer to ask for another link when this one has expired. Each
 * screen is its own `h1`.
 */
export const NewPasswordForm = ({
  onSubmit,
  view = 'form',
  requestHref,
  requestLabel = 'Send me a new link',
  signInHref,
  signInLabel = 'Back to sign in',
  continueLabel = 'Continue to sign in',
  rules: rulesOf = defaultPasswordRules,
  strength,
  loading = false,
  error,
  title = 'Choose a new password',
  description = 'Use a password you don’t use anywhere else. A reset link works once.',
  submitLabel = 'Update password',
  className,
}: NewPasswordFormProps) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  // The mismatch shows when the field is left, not on every key.
  const [confirmLeft, setConfirmLeft] = useState(false);

  const rules = rulesOf(password);
  const matches = confirm === password;
  const canSubmit =
    password.length > 0 && rules.every((r) => r.ok) && confirm.length > 0 && matches && !loading;

  const backLink = signInHref && (
    <Link href={signInHref} variant="subtle" className="justify-center">
      <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
      {signInLabel}
    </Link>
  );

  if (view === 'expired') {
    return (
      <div className={className}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
          <Clock className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="mt-4 text-center text-xl font-semibold text-gray-900 dark:text-white">
          This link is no longer valid
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Reset links work once and expire after 1 hour. Ask for a new one to continue.
        </p>
        <div className="mt-6 flex flex-col items-stretch gap-3">
          {requestHref && (
            <Link href={requestHref} variant="colored" className="justify-center font-medium">
              {requestLabel}
            </Link>
          )}
          {backLink}
        </div>
      </div>
    );
  }

  if (view === 'done') {
    return (
      <div className={className}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-700 dark:text-green-400">
          <CircleCheck className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="mt-4 text-center text-xl font-semibold text-gray-900 dark:text-white">
          Password updated
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          You can now sign in with your new password.
        </p>
        {signInHref && (
          <div className="mt-6 flex flex-col items-stretch">
            <Link href={signInHref} variant="colored" className="justify-center font-medium">
              {continueLabel}
            </Link>
          </div>
        )}
      </div>
    );
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    void onSubmit(password);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>

      {error && (
        <div className="mb-4">
          <AlertBanner intent="danger">{error}</AlertBanner>
        </div>
      )}

      <div className="space-y-4">
        <NewPasswordField
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          rules={rules.length > 0 ? rules : null}
          score={strength && password.length > 0 ? strength(password) : undefined}
        />
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          required
          placeholder="Repeat the password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => setConfirmLeft(true)}
          error={confirmLeft && !matches ? 'Passwords don’t match' : undefined}
          success={confirm.length > 0 && matches ? 'Passwords match' : undefined}
          disabled={loading}
        />
        <Button type="submit" loading={loading} disabled={!canSubmit} className="w-full">
          {submitLabel}
        </Button>
      </div>

      {signInHref && <p className="mt-5 text-center text-xs">{backLink}</p>}
    </form>
  );
};
