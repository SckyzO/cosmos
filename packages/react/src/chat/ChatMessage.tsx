import { clsx } from 'clsx';
import { AlertCircle, Check, CheckCheck, Clock } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { MessageText } from './MessageText';

export type ChatMessageDirection = 'incoming' | 'outgoing';
export type ChatMessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type ChatMessageProps = {
  /** Message text. Rendered as text (never HTML); http(s) URLs become links. */
  text: string;
  /** `outgoing` (right, accent) for the current user, `incoming` (left) otherwise. */
  direction: ChatMessageDirection;
  /** Sender name: shown on the first message of a group, always read by screen readers. */
  sender: string;
  /** Time label, e.g. `10:42`. */
  time?: string;
  /** Machine-readable time for the `<time>` element (ISO 8601). */
  dateTime?: string;
  /** Delivery state of an outgoing message. */
  status?: ChatMessageStatus;
  /** Avatar image of an incoming sender; initials of `sender` otherwise. */
  avatarSrc?: string;
  /**
   * First message of a run from the same sender: shows the name and the avatar.
   * Set `false` on the following ones to group them. Default `true`.
   */
  firstInGroup?: boolean;
  /** Text is still arriving: shows a blinking caret after it. */
  streaming?: boolean;
  className?: string;
};

const STATUS: Record<ChatMessageStatus, { icon: typeof Check; label: string }> = {
  sending: { icon: Clock, label: 'Sending' },
  sent: { icon: Check, label: 'Sent' },
  delivered: { icon: CheckCheck, label: 'Delivered' },
  read: { icon: CheckCheck, label: 'Read' },
  failed: { icon: AlertCircle, label: 'Not sent' },
};

/**
 * One chat bubble. Incoming bubbles sit on the left with the sender's avatar
 * on the first message of a group; outgoing ones sit on the right in the
 * accent color with their delivery state. Sender and time are read by screen
 * readers on every message, grouped or not.
 */
export const ChatMessage = ({
  text,
  direction,
  sender,
  time,
  dateTime,
  status,
  avatarSrc,
  firstInGroup = true,
  streaming = false,
  className,
}: ChatMessageProps) => {
  const outgoing = direction === 'outgoing';
  const state = status && STATUS[status];
  return (
    <div
      className={clsx(
        'flex items-end gap-2',
        outgoing ? 'flex-row-reverse' : 'flex-row',
        firstInGroup && 'mt-2',
        className
      )}
    >
      {!outgoing && (
        <span className="w-8 shrink-0" aria-hidden>
          {firstInGroup && <Avatar name={sender} src={avatarSrc} size="sm" />}
        </span>
      )}
      <div className={clsx('flex max-w-[80%] flex-col', outgoing ? 'items-end' : 'items-start')}>
        {firstInGroup && !outgoing && (
          <span
            aria-hidden
            className="text-2xs mb-0.5 px-1 font-medium text-[var(--color-text-muted)]"
          >
            {sender}
          </span>
        )}
        <p
          className={clsx(
            'rounded-2xl px-3.5 py-2 text-sm break-words whitespace-pre-wrap',
            outgoing
              ? 'bg-brand-500 rounded-br-md text-white'
              : 'rounded-bl-md bg-gray-100 text-[var(--color-text-primary)] dark:bg-gray-800'
          )}
        >
          <span className="sr-only">{`${sender}${time ? `, ${time}` : ''}: `}</span>
          <MessageText text={text} />
          {streaming && (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-current motion-safe:animate-pulse"
            />
          )}
        </p>
        {(time || state) && (
          <span
            aria-hidden={!state || undefined}
            className={clsx(
              'text-3xs mt-0.5 flex items-center gap-1 px-1',
              status === 'failed'
                ? 'text-red-600 dark:text-red-400'
                : 'text-[var(--color-text-muted)]'
            )}
          >
            {time && (
              <time aria-hidden dateTime={dateTime}>
                {time}
              </time>
            )}
            {state && (
              <>
                <state.icon
                  aria-hidden
                  className={clsx(
                    'h-3 w-3',
                    status === 'read' && 'text-brand-600 dark:text-brand-400'
                  )}
                />
                <span className="sr-only">{state.label}</span>
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
};
