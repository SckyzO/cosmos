import { ArrowLeft, Mail, MailCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Input } from '../forms/Input';
import { useFocusOnSwitch } from '../hooks/useFocusOnSwitch';
import { useLabels } from '../labels/labelsContext';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';
import { Link } from '../ui/Link';
import { RESET_PASSWORD_FORM_LABELS, type ResetPasswordFormLabels } from './labels';
import { ResendButton } from './ResendButton';

export type ResetPasswordFormProps = {
  onSubmit: (email: string) => void | Promise<void>;
  signInHref?: string;
  /**
   * Switch to the post-submit confirmation view. Default `false`. When it changes, the focus goes
   * to the heading of the new view, since the button that was pressed is gone with the old one;
   * focus the person had moved elsewhere on the page stays there.
   */
  sent?: boolean;
  /** Email displayed in the `sent` view. Falls back to the form's last value. */
  sentEmail?: string;
  loading?: boolean;
  error?: string;
  /** The title. Default `labels.title`. */
  title?: string;
  /** The line under the title. Default `labels.description`. */
  description?: string;
  /** Resend handler in the `sent` view. Hidden if not provided. */
  onResend?: () => void;
  /**
   * Seconds the resend button waits before it can be pressed again, from the moment the `sent`
   * view shows (the e-mail was just sent) and from each press. Default `0`: no wait. While it
   * waits the button is `aria-disabled` and keeps focus, the countdown is its description, and a
   * polite status says when a new link went out and when the wait is over. The server stays the
   * authority: show its refusal (a 429) through `error`.
   */
  resendCooldown?: number;
  /** The texts it writes, over `LabelsProvider`'s `resetPasswordForm` and the English defaults. */
  labels?: Partial<ResetPasswordFormLabels>;
  className?: string;
};

export const ResetPasswordForm = ({
  onSubmit,
  signInHref,
  sent = false,
  sentEmail,
  loading = false,
  error,
  title,
  description,
  onResend,
  resendCooldown = 0,
  labels: ownLabels,
  className,
}: ResetPasswordFormProps) => {
  const labels = useLabels('resetPasswordForm', RESET_PASSWORD_FORM_LABELS, ownLabels);
  const [email, setEmail] = useState('');
  // When the host shows or leaves the `sent` view, the button that was pressed is gone: the focus
  // goes to the heading of the new one.
  const heading = useFocusOnSwitch(sent ? 'sent' : 'form');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loading || email.length === 0) return;
    void onSubmit(email);
  };

  if (sent) {
    return (
      <div className={className}>
        <div className="bg-brand-500/10 text-brand-600 dark:text-brand-400 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
          <MailCheck className="h-6 w-6" aria-hidden />
        </div>
        <h1
          ref={heading}
          tabIndex={-1}
          className="mt-4 text-center text-xl font-semibold text-gray-900 outline-hidden dark:text-white"
        >
          {labels.sentTitle}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          {labels.sentDescription(
            <bdi className="font-medium text-gray-700 dark:text-gray-200">{sentEmail ?? email}</bdi>
          )}
        </p>
        <div className="mt-6 flex flex-col items-stretch gap-2">
          {onResend && (
            <ResendButton
              label={labels.resend}
              onResend={onResend}
              cooldown={resendCooldown}
              labels={labels}
              disabled={loading}
              loading={loading}
              variant="secondary"
              rowClassName="flex flex-col items-stretch gap-1 text-xs text-[var(--color-text-muted)]"
            />
          )}
          {signInHref && (
            <Link href={signInHref} variant="subtle" className="justify-center">
              <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
              {labels.signIn}
            </Link>
          )}
        </div>
      </div>
    );
  }

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
        <Button
          type="submit"
          loading={loading}
          disabled={loading || email.length === 0}
          className="w-full"
        >
          {labels.submit}
        </Button>
      </div>

      {signInHref && (
        <p className="mt-5 text-center text-xs text-[var(--color-text-muted)]">
          <Link href={signInHref} variant="colored">
            <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
            {labels.signIn}
          </Link>
        </p>
      )}
    </form>
  );
};
