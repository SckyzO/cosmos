import { clsx } from 'clsx';
import { RefreshCw, ThumbsDown, ThumbsUp, type LucideIcon } from 'lucide-react';
import { useControllableState } from '../hooks/useControllableState';
import { Clipboard } from '../ui/Clipboard';

export type ChatFeedback = 'up' | 'down';

export type ChatMessageActionsProps = {
  /** The reply as plain text: what "Copy reply" puts on the clipboard. No copy button without it. */
  text?: string;
  /** Shows "Regenerate", called when it is pressed. */
  onRegenerate?: () => void;
  /**
   * The feedback given on the reply, when controlled: `'up'`, `'down'` or `null` for none. The two
   * feedback buttons show once `feedback`, `defaultFeedback` or `onFeedbackChange` is set.
   */
  feedback?: ChatFeedback | null;
  /** Initial feedback, when uncontrolled. Default none. */
  defaultFeedback?: ChatFeedback | null;
  /** Called with the feedback to move to; pressing the pressed button again gives `null`. */
  onFeedbackChange?: (feedback: ChatFeedback | null) => void;
  className?: string;
};

const BUTTON =
  'focus-visible:focus-indicator inline-flex h-ctrl-28 w-ctrl-28 shrink-0 items-center justify-center rounded-lg transition-colors';
const IDLE =
  'text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text-primary)] dark:hover:bg-gray-800';
const PRESSED = 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400';

const FEEDBACK: { value: ChatFeedback; label: string; icon: LucideIcon }[] = [
  { value: 'up', label: 'Good response', icon: ThumbsUp },
  { value: 'down', label: 'Bad response', icon: ThumbsDown },
];

/**
 * The row of actions under an assistant reply: copy it, regenerate it, rate it. Pass it as the
 * `actions` of the `ChatMessage` it belongs to: there it stays out of sight with a pointer until
 * the reply is hovered or holds the focus, and always shows on touch. On its own it is always
 * shown.
 */
export const ChatMessageActions = ({
  text,
  onRegenerate,
  feedback: feedbackProp,
  defaultFeedback,
  onFeedbackChange,
  className,
}: ChatMessageActionsProps) => {
  const [feedback, setFeedback] = useControllableState<ChatFeedback | null>({
    value: feedbackProp,
    defaultValue: defaultFeedback ?? null,
    onChange: onFeedbackChange,
    name: 'ChatMessageActions.feedback',
  });
  const rated =
    feedbackProp !== undefined || defaultFeedback !== undefined || onFeedbackChange !== undefined;

  return (
    <div role="group" aria-label="Reply actions" className={clsx('flex items-center', className)}>
      {text !== undefined && (
        <Clipboard plain value={text} copyLabel="Copy reply" copiedLabel="Copied" duration={2000} />
      )}
      {onRegenerate && (
        <button
          type="button"
          aria-label="Regenerate"
          onClick={onRegenerate}
          className={clsx(BUTTON, IDLE)}
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
      {rated &&
        FEEDBACK.map(({ value, label, icon: Icon }) => {
          const pressed = feedback === value;
          return (
            <button
              key={value}
              type="button"
              aria-label={label}
              aria-pressed={pressed}
              onClick={() => setFeedback(pressed ? null : value)}
              className={clsx(BUTTON, pressed ? PRESSED : IDLE)}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </button>
          );
        })}
    </div>
  );
};
