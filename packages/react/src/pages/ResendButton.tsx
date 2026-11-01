import { clsx } from 'clsx';
import { useId, useState, type ReactNode } from 'react';
import { formatCountdown, useCooldown } from '../hooks/useCooldown';
import { Button, type ButtonProps } from '../ui/Button';

/** The words of a resend button that waits between two presses. */
export type ResendLabels = {
  /** Said when a press sends again, and shown until the wait ends. */
  resent?: string;
  /** Said once, when the wait ends and the button works again. */
  ready?: string;
  /** What the button is waiting for, as its description: "available in 0:30". */
  availableIn?: (seconds: number) => string;
};

type ResendButtonProps = {
  label: string;
  onResend: () => void;
  /** Seconds to wait before the next press, from mount and from each press. 0 for no wait. */
  cooldown: number;
  labels: Required<ResendLabels>;
  /** The host is busy: the button is disabled for real. */
  disabled?: boolean;
  /** Also draw the button's own spinner. */
  loading?: boolean;
  variant: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
  /** Text before the button on its row. */
  prefix?: ReactNode;
  /** Marks the countdown off from the button with a dot, for a row that reads in one line. */
  dot?: boolean;
  /** Classes of the row holding the prefix, the button and the countdown. */
  rowClassName?: string;
};

// Internal to the package, not exported: the resend button of `TwoStepVerificationForm` and of the
// `sent` view of `ResetPasswordForm`.
//
// While it waits the button is `aria-disabled`, not `disabled`: it stays in the tab order and keeps
// the focus a keyboard user just gave it, the press is ignored, and a screen reader hears the
// countdown as its description. The countdown text changes every second and is not a live region.
// A polite status says two things, once each: that a new message went out, and that the wait is
// over. Without a wait (`cooldown` 0) the button is a plain one, and there is no status.
export const ResendButton = ({
  label,
  onResend,
  cooldown,
  labels,
  disabled,
  loading,
  variant,
  size,
  className,
  prefix,
  dot = false,
  rowClassName,
}: ResendButtonProps) => {
  const countdownId = useId();
  // The status shows after a press, until the wait ends: then it is said and not shown.
  const [status, setStatus] = useState({ text: '', shown: false });
  const { remaining, restart } = useCooldown(cooldown, () =>
    setStatus({ text: labels.ready, shown: false })
  );
  const waiting = remaining > 0;

  const press = () => {
    if (waiting) return;
    onResend();
    if (cooldown > 0) {
      restart();
      setStatus({ text: labels.resent, shown: true });
    }
  };

  return (
    <>
      {cooldown > 0 && (
        <p
          role="status"
          className={
            status.shown ? 'text-center text-xs text-[var(--color-text-muted)]' : 'sr-only'
          }
        >
          {status.text}
        </p>
      )}
      <div className={rowClassName}>
        {prefix}
        <Button
          type="button"
          variant={variant}
          size={size}
          loading={loading}
          disabled={disabled}
          aria-disabled={waiting || undefined}
          aria-describedby={waiting ? countdownId : undefined}
          onClick={press}
          className={clsx('aria-disabled:pointer-events-none aria-disabled:opacity-50', className)}
        >
          {label}
        </Button>
        {waiting && (
          <span id={countdownId} className="text-center tabular-nums">
            {dot && <span aria-hidden>· </span>}
            {labels.availableIn(remaining)}
          </span>
        )}
      </div>
    </>
  );
};

/** The words of a resend button, with the defaults of a form that sends `what` ("code", "link"). */
export const resendLabels = (what: string, labels?: ResendLabels): Required<ResendLabels> => ({
  resent: labels?.resent ?? `We sent you a new ${what}.`,
  ready: labels?.ready ?? `You can request a new ${what}.`,
  availableIn: labels?.availableIn ?? ((seconds) => `available in ${formatCountdown(seconds)}`),
});
