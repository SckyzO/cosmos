import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useControllableState } from '../hooks/useControllableState';
import { Input } from '../forms/Input';
import { OtpInput } from '../forms/OtpInput';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';
import { Link } from '../ui/Link';
import { ResendButton, resendLabels, type ResendLabels } from './ResendButton';

/** How the person proves who they are: the verification `code`, or a `backup` code they saved. */
export type TwoStepMethod = 'code' | 'backup';

/** The words of the backup entry and of the resend wait, to translate with the rest of the page. */
export type TwoStepVerificationLabels = ResendLabels & {
  /** The link to the backup entry. Default "Use a backup code". */
  useBackupCode?: string;
  /** The link back to the verification code. Default "Use a verification code instead". */
  useVerificationCode?: string;
  /** Title of the backup entry. Default "Use a backup code". */
  backupTitle?: string;
  /** Description of the backup entry. */
  backupDescription?: string;
  /** Label of the backup field. Default "Backup code". */
  backupField?: string;
};

export type TwoStepVerificationFormProps = {
  /**
   * Called with the code and the method it was typed for. The `backup` code is passed as typed,
   * trimmed: no length or format is checked, the host's server says if it is good.
   */
  onSubmit: (code: string, method: TwoStepMethod) => void | Promise<void>;
  onResend?: () => void;
  /**
   * Seconds the resend button waits before it can be pressed again, from the moment the form
   * shows (a code was just sent) and from each press. Default `0`: no wait. While it waits the
   * button is `aria-disabled` and keeps focus, the countdown is its description, and a polite
   * status says when a new code went out and when the wait is over. The server stays the
   * authority: show its refusal (a 429) through `error`.
   */
  resendCooldown?: number;
  /** Offer the link that switches to the backup-code entry, and back. Default `false`. */
  backupCode?: boolean;
  /**
   * The entry shown: the verification `code` (default) or a `backup` code. Set it, with
   * `onMethodChange`, to own it; the link asks, the host answers.
   */
  method?: TwoStepMethod;
  /** The entry shown first, while uncontrolled. Default `code`. */
  defaultMethod?: TwoStepMethod;
  onMethodChange?: (method: TwoStepMethod) => void;
  labels?: TwoStepVerificationLabels;
  /** Email/phone where the code was sent — shown in the description. */
  sentTo?: string;
  length?: number;
  loading?: boolean;
  /**
   * What went wrong: a banner above the cells, or under the field on the backup entry, where it
   * should not say if the code was already used.
   */
  error?: string;
  /** `code` only: trigger onSubmit automatically when the user fills the last cell. Default `true`. */
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
  resendCooldown = 0,
  backupCode = false,
  method: methodProp,
  defaultMethod = 'code',
  onMethodChange,
  labels,
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
  const [method, setMethod] = useControllableState<TwoStepMethod>({
    value: methodProp,
    defaultValue: defaultMethod,
    onChange: onMethodChange,
    name: 'TwoStepVerificationForm.method',
  });
  const [code, setCode] = useState('');
  const [backup, setBackup] = useState('');
  const isBackup = method === 'backup';
  const backupValue = backup.trim();

  // Each entry starts afresh: what was typed for one says nothing of the other.
  const switchTo = (next: TwoStepMethod) => {
    setCode('');
    setBackup('');
    setMethod(next);
  };

  // The address or number is the host's: isolated, it keeps its order in a right-to-left page.
  const description = sentTo ? (
    <>
      Enter the {length}-digit code we sent to <bdi>{sentTo}</bdi>.
    </>
  ) : (
    `Enter the ${length}-digit verification code from your authenticator app.`
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (isBackup) {
      if (backupValue) void onSubmit(backupValue, 'backup');
    } else if (code.length === length) {
      void onSubmit(code, 'code');
    }
  };

  const handleComplete = (value: string) => {
    if (autoSubmit && !loading) void onSubmit(value, 'code');
  };

  const resend = resendLabels('code', labels);

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="bg-brand-500/10 text-brand-600 dark:text-brand-400 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
        <ShieldCheck className="h-6 w-6" aria-hidden />
      </div>
      <h1 className="mt-4 text-center text-xl font-semibold text-gray-900 dark:text-white">
        {isBackup ? (labels?.backupTitle ?? 'Use a backup code') : title}
      </h1>
      <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
        {isBackup
          ? (labels?.backupDescription ??
            'Enter one of the codes you saved when you turned on two-step verification. Each code works once.')
          : description}
      </p>

      {error && !isBackup && (
        <div className="mt-4">
          <AlertBanner intent="danger">{error}</AlertBanner>
        </div>
      )}

      <div className={isBackup ? 'mt-6' : 'mt-6 flex justify-center'}>
        {isBackup ? (
          <Input
            label={labels?.backupField ?? 'Backup code'}
            required
            autoFocus
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={backup}
            onChange={(e) => setBackup(e.target.value)}
            error={error}
            disabled={loading}
          />
        ) : (
          <OtpInput
            length={length}
            value={code}
            onChange={setCode}
            onComplete={handleComplete}
            disabled={loading}
            error={!!error}
            autoFocus
          />
        )}
      </div>

      <div className="mt-6 space-y-2">
        <Button
          type="submit"
          loading={loading}
          disabled={loading || (isBackup ? backupValue.length === 0 : code.length !== length)}
          className="w-full"
        >
          {submitLabel}
        </Button>
        {!isBackup && onResend && (
          // 44px tall, the touch target size, though the label is small.
          <ResendButton
            label={resendLabel}
            onResend={onResend}
            cooldown={resendCooldown}
            labels={resend}
            disabled={loading}
            variant="ghost"
            size="sm"
            className="min-h-11"
            prefix={<span>Didn&apos;t get a code?</span>}
            dot
            rowClassName="flex flex-wrap items-center justify-center gap-x-1 text-xs text-[var(--color-text-muted)]"
          />
        )}
        {backupCode && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => switchTo(isBackup ? 'code' : 'backup')}
              disabled={loading}
              className="min-h-11"
            >
              {isBackup
                ? (labels?.useVerificationCode ?? 'Use a verification code instead')
                : (labels?.useBackupCode ?? 'Use a backup code')}
            </Button>
          </div>
        )}
        {cancelHref && (
          <div className="flex justify-center">
            <Link href={cancelHref} variant="subtle">
              <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
              {cancelLabel}
            </Link>
          </div>
        )}
      </div>
    </form>
  );
};
