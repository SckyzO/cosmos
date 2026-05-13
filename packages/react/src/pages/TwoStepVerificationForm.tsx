import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { OtpInput } from '../forms/OtpInput';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';
import { Link } from '../ui/Link';

export type TwoStepVerificationFormProps = {
  onSubmit: (code: string) => void | Promise<void>;
  onResend?: () => void;
  /** Email/phone where the code was sent — shown in the description. */
  sentTo?: string;
  length?: number;
  loading?: boolean;
  error?: string;
  /** Trigger onSubmit automatically when the user fills the last cell. Default `true`. */
  autoSubmit?: boolean;
  cancelHref?: string;
  cancelLabel?: string;
  title?: string;
  submitLabel?: string;
  resendLabel?: string;
  className?: string;
};

export const TwoStepVerificationForm = ({
  onSubmit,
  onResend,
  sentTo,
  length = 6,
  loading = false,
  error,
  autoSubmit = true,
  cancelHref,
  cancelLabel = 'Back to sign in',
  title = 'Two-step verification',
  submitLabel = 'Verify my account',
  resendLabel = 'Resend code',
  className,
}: TwoStepVerificationFormProps) => {
  const [code, setCode] = useState('');

  const description = sentTo
    ? `Enter the ${length}-digit code we sent to ${sentTo}.`
    : `Enter the ${length}-digit verification code from your authenticator app.`;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loading || code.length !== length) return;
    void onSubmit(code);
  };

  const handleComplete = (value: string) => {
    if (autoSubmit && !loading) void onSubmit(value);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="bg-brand-500/10 text-brand-600 dark:text-brand-400 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
        <ShieldCheck className="h-6 w-6" aria-hidden />
      </div>
      <h1 className="mt-4 text-center text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h1>
      <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>

      {error && (
        <div className="mt-4">
          <AlertBanner variant="error">{error}</AlertBanner>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <OtpInput
          length={length}
          value={code}
          onChange={setCode}
          onComplete={handleComplete}
          disabled={loading}
          error={!!error}
          autoFocus
        />
      </div>

      <div className="mt-6 space-y-2">
        <Button
          type="submit"
          loading={loading}
          disabled={loading || code.length !== length}
          className="w-full"
        >
          {submitLabel}
        </Button>
        {onResend && (
          <p className="text-center text-xs text-[var(--color-text-muted)]">
            Didn&apos;t get a code?{' '}
            <button
              type="button"
              onClick={onResend}
              disabled={loading}
              className="text-brand-500 hover:text-brand-600 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendLabel}
            </button>
          </p>
        )}
        {cancelHref && (
          <div className="flex justify-center">
            <Link href={cancelHref} variant="subtle">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              {cancelLabel}
            </Link>
          </div>
        )}
      </div>
    </form>
  );
};
