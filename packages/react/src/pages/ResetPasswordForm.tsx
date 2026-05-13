import { ArrowLeft, Mail, MailCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Input } from '../forms/Input';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';
import { Link } from '../ui/Link';

export type ResetPasswordFormProps = {
  onSubmit: (email: string) => void | Promise<void>;
  signInHref?: string;
  signInLabel?: string;
  /** Switch to the post-submit confirmation view. Default `false`. */
  sent?: boolean;
  /** Email displayed in the `sent` view. Falls back to the form's last value. */
  sentEmail?: string;
  loading?: boolean;
  error?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  /** Resend handler in the `sent` view. Hidden if not provided. */
  onResend?: () => void;
  resendLabel?: string;
  className?: string;
};

export const ResetPasswordForm = ({
  onSubmit,
  signInHref,
  signInLabel = 'Back to sign in',
  sent = false,
  sentEmail,
  loading = false,
  error,
  title = 'Reset your password',
  description = 'Enter your email and we’ll send you a link to reset your password.',
  submitLabel = 'Send reset link',
  onResend,
  resendLabel = 'Resend',
  className,
}: ResetPasswordFormProps) => {
  const [email, setEmail] = useState('');

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
        <h1 className="mt-4 text-center text-xl font-semibold text-gray-900 dark:text-white">
          Check your inbox
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          We&apos;ve sent a reset link to{' '}
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {sentEmail ?? email}
          </span>
          . The link expires in 1 hour.
        </p>
        <div className="mt-6 flex flex-col items-stretch gap-2">
          {onResend && (
            <Button
              variant="secondary"
              loading={loading}
              disabled={loading}
              onClick={onResend}
            >
              {resendLabel}
            </Button>
          )}
          {signInHref && (
            <Link
              href={signInHref}
              variant="subtle"
              className="justify-center"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              {signInLabel}
            </Link>
          )}
        </div>
      </div>
    );
  }

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
          <AlertBanner variant="error">{error}</AlertBanner>
        </div>
      )}

      <div className="space-y-4">
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
        <Button
          type="submit"
          loading={loading}
          disabled={loading || email.length === 0}
          className="w-full"
        >
          {submitLabel}
        </Button>
      </div>

      {signInHref && (
        <p className="mt-5 text-center text-xs text-[var(--color-text-muted)]">
          <Link href={signInHref} variant="colored">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {signInLabel}
          </Link>
        </p>
      )}
    </form>
  );
};
