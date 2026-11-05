import { ArrowLeft, CircleCheck, Clock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PasswordInput } from '../forms/PasswordInput';
import { PASSWORD_POLICY_LABELS } from '../forms/labels';
import { defaultPasswordRules, type PasswordRule } from '../forms/PasswordPolicyChecker';
import { useFocusOnSwitch } from '../hooks/useFocusOnSwitch';
import { useLabels } from '../labels/labelsContext';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';
import { Link } from '../ui/Link';
import { NEW_PASSWORD_FORM_LABELS, type NewPasswordFormLabels } from './labels';
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
  /** `form` and `expired`: where "Back to sign in" goes; `done`: where "Continue to sign in" goes. */
  signInHref?: string;
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
  /** The title of the form. Default `labels.title`. */
  title?: string;
  /** The line under the title. Default `labels.description`. */
  description?: string;
  /** The texts it writes, over `LabelsProvider`'s `newPasswordForm` and the English defaults. */
  labels?: Partial<NewPasswordFormLabels>;
  className?: string;
};

/**
 * The page the e-mail link of `ResetPasswordForm` opens: a new password and its confirmation, then
 * a confirmation screen, or an offer to ask for another link when this one has expired. Each
 * screen is its own `h1`. When the host switches `view`, the focus goes to the new heading, since
 * the button that was pressed is gone with its screen; focus the person had moved elsewhere on
 * the page stays there, and the first screen takes none when it mounts.
 */
export const NewPasswordForm = ({
  onSubmit,
  view = 'form',
  requestHref,
  signInHref,
  rules: rulesProp,
  strength,
  loading = false,
  error,
  title,
  description,
  labels: ownLabels,
  className,
}: NewPasswordFormProps) => {
  const labels = useLabels('newPasswordForm', NEW_PASSWORD_FORM_LABELS, ownLabels);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  // The mismatch shows when the field is left, not on every key.
  const [confirmLeft, setConfirmLeft] = useState(false);
  // When the host switches the screen, the button that was pressed is gone: the focus goes to the
  // heading of the new one.
  const heading = useFocusOnSwitch(view);

  // The default policy is worded by the dictionary's `passwordPolicyChecker` keys.
  const policy = useLabels('passwordPolicyChecker', PASSWORD_POLICY_LABELS);
  const rules = (rulesProp ?? ((value) => defaultPasswordRules(value, policy)))(password);
  const matches = confirm === password;
  const mismatch = confirmLeft && !matches;
  const canSubmit =
    password.length > 0 && rules.every((r) => r.ok) && confirm.length > 0 && matches && !loading;

  const backLink = signInHref && (
    <Link href={signInHref} variant="subtle" className="justify-center">
      <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
      {labels.signIn}
    </Link>
  );

  if (view === 'expired') {
    return (
      <div className={className}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
          <Clock className="h-6 w-6" aria-hidden />
        </div>
        <h1
          ref={heading}
          tabIndex={-1}
          className="mt-4 text-center text-xl font-semibold text-gray-900 outline-hidden dark:text-white"
        >
          {labels.expiredTitle}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          {labels.expiredDescription}
        </p>
        <div className="mt-6 flex flex-col items-stretch gap-3">
          {requestHref && (
            <Link href={requestHref} variant="colored" className="justify-center font-medium">
              {labels.request}
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
        <h1
          ref={heading}
          tabIndex={-1}
          className="mt-4 text-center text-xl font-semibold text-gray-900 outline-hidden dark:text-white"
        >
          {labels.doneTitle}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          {labels.doneDescription}
        </p>
        {signInHref && (
          <div className="mt-6 flex flex-col items-stretch">
            <Link href={signInHref} variant="colored" className="justify-center font-medium">
              {labels.continue}
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
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-xl font-semibold text-gray-900 outline-hidden dark:text-white"
        >
          {title ?? labels.title}
        </h1>
        {(description ?? labels.description) && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description ?? labels.description}
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4">
          <AlertBanner intent="danger">{error}</AlertBanner>
        </div>
      )}

      <div className="space-y-4">
        <NewPasswordField
          label={labels.newPassword}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          rules={rules.length > 0 ? rules : null}
          score={strength && password.length > 0 ? strength(password) : undefined}
        />
        {/* The show/hide button is part of the field: only a blur that goes elsewhere leaves it. */}
        <div
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setConfirmLeft(true);
          }}
        >
          <PasswordInput
            label={labels.confirmPassword}
            autoComplete="new-password"
            required
            placeholder={labels.confirmPlaceholder}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={mismatch ? labels.mismatch : undefined}
            success={confirm.length > 0 && matches ? labels.match : undefined}
            disabled={loading}
          />
          {/* The focus has left the field, so its description is not read: the alert says it. */}
          {mismatch && (
            <span role="alert" className="sr-only">
              {labels.mismatch}
            </span>
          )}
        </div>
        <Button type="submit" loading={loading} disabled={!canSubmit} className="w-full">
          {labels.submit}
        </Button>
      </div>

      {signInHref && <p className="mt-5 text-center text-xs">{backLink}</p>}
    </form>
  );
};
