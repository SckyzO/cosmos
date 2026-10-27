import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, type Ref } from 'react';
import { useControllableState } from '../hooks/useControllableState';
import { Clipboard } from './Clipboard';

export type SecretValueProps = {
  /** The secret. While masked it is held in props only: it is never written to the DOM. */
  value: string;
  /** What the secret is ("API key"): names the group and the Show, Hide and Copy buttons. */
  label: string;
  /** Whether the value is shown, when controlled. */
  revealed?: boolean;
  /** Whether the value starts shown, when uncontrolled. Default `false`. */
  defaultRevealed?: boolean;
  /** Called with the state to move to, from the Show/Hide button and from `autoHideAfter`. */
  onRevealedChange?: (revealed: boolean) => void;
  /**
   * Trailing characters left visible while masked, to tell two secrets apart. Default `0`. At most
   * half of the value is ever shown, so a short secret is not given away.
   */
  visibleSuffix?: number;
  /** Milliseconds after which a revealed value hides again. Default: it stays shown. */
  autoHideAfter?: number;
  className?: string;
  /** Ref to the root element. */
  ref?: Ref<HTMLDivElement>;
};

// A fixed run, whatever the secret's length: the mask must not leak it.
const MASK = '•'.repeat(20);

const BUTTON =
  'inline-flex h-ctrl-36 w-ctrl-36 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus-visible:focus-indicator dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700';

/**
 * SecretValue — a stored secret (an API key, a webhook token) in a monospace box, masked until the
 * user asks to see it. While masked, the real value is not in the DOM: a fixed run of bullets plus
 * the optional `visibleSuffix`, so its length is not leaked and a screen reader never reads it.
 * The Copy button copies the real value without revealing it. The buttons wrap under the value on a
 * narrow screen.
 */
export const SecretValue = ({
  value,
  label,
  revealed: revealedProp,
  defaultRevealed = false,
  onRevealedChange,
  visibleSuffix = 0,
  autoHideAfter,
  className,
  ref,
}: SecretValueProps) => {
  const [revealed, setRevealed] = useControllableState({
    value: revealedProp,
    defaultValue: defaultRevealed,
    onChange: onRevealedChange,
    name: 'SecretValue.revealed',
  });

  useEffect(() => {
    if (!revealed || autoHideAfter === undefined) return;
    const timer = window.setTimeout(() => setRevealed(false), autoHideAfter);
    return () => window.clearTimeout(timer);
  }, [revealed, autoHideAfter, setRevealed]);

  const suffixLength = Math.max(0, Math.min(visibleSuffix, Math.floor(value.length / 2)));
  const Icon = revealed ? EyeOff : Eye;
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={clsx('flex flex-wrap items-center gap-2', className)}
    >
      <code className="min-w-0 flex-1 basis-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2.5 py-2 font-mono text-sm break-all text-[var(--color-text-primary)]">
        {revealed ? (
          <bdi>{value}</bdi>
        ) : (
          // One island for the dots and the suffix, so the suffix stays at the end of the value.
          <bdi>
            <span aria-hidden="true">{MASK}</span>
            {suffixLength > 0 && value.slice(-suffixLength)}
          </bdi>
        )}
      </code>
      <button
        type="button"
        aria-label={`${revealed ? 'Hide' : 'Show'} ${label}`}
        aria-pressed={revealed}
        onClick={() => setRevealed(!revealed)}
        className={BUTTON}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </button>
      <Clipboard value={value} size="md" copyLabel={`Copy ${label}`} copiedLabel="Copied!" />
    </div>
  );
};
