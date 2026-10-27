import { clsx } from 'clsx';
import { AlertCircle, Check, CheckCheck, Clock } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar } from '../ui/Avatar';
import { MessageText } from './MessageText';

export type ChatMessageDirection = 'incoming' | 'outgoing';
export type ChatMessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// `text` and `children` are two ways to give the content, never both.
type ChatMessageContent =
  | {
      /** Message text. Rendered as text (never HTML); http(s) URLs become links. */
      text: string;
      children?: undefined;
    }
  | {
      text?: undefined;
      /**
       * Rich content in place of `text`: rendered nodes (a code block, a list, a table, an image
       * grid). Markdown rendering stays in the app; it passes what it rendered.
       */
      children: ReactNode;
    };

type ChatMessageBaseProps = {
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
  /**
   * Content is still arriving: shows a blinking caret after it, and marks the message
   * `aria-busy` so assistive tech can wait for the whole reply.
   */
  streaming?: boolean;
  /**
   * Draw an incoming message in a bubble. Default `true`. `false` drops the bubble: the content
   * takes the whole column next to the avatar, with the avatar and the name at the top, so a code
   * block, a table or an image grid gets the full width (an assistant reply). An outgoing message
   * keeps its bubble either way.
   */
  bubble?: boolean;
  /**
   * Actions under the message, in a row after the time: a `ChatMessageActions`. With a pointer they
   * stay out of sight (their space is kept) until the message is hovered or holds the focus; on
   * touch they always show, and keyboard focus always reveals them.
   */
  actions?: ReactNode;
  className?: string;
};

export type ChatMessageProps = ChatMessageBaseProps & ChatMessageContent;

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
  children,
  direction,
  sender,
  time,
  dateTime,
  status,
  avatarSrc,
  firstInGroup = true,
  streaming = false,
  bubble = true,
  actions,
  className,
}: ChatMessageProps) => {
  const outgoing = direction === 'outgoing';
  const flat = !outgoing && !bubble;
  const state = status && STATUS[status];
  const body = (
    <>
      <span className="sr-only">{`${sender}${time ? `, ${time}` : ''}: `}</span>
      {text === undefined ? children : <MessageText text={text} />}
      {streaming && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-current motion-safe:animate-pulse"
        />
      )}
    </>
  );
  const meta = (time || state) && (
    <span
      aria-hidden={!state || undefined}
      className={clsx(
        'text-3xs flex items-center gap-1 px-1',
        !actions && 'mt-0.5',
        status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-[var(--color-text-muted)]'
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
            className={clsx('h-3 w-3', status === 'read' && 'text-brand-600 dark:text-brand-400')}
          />
          <span className="sr-only">{state.label}</span>
        </>
      )}
    </span>
  );
  // Text keeps its `<p>`; rich content may hold blocks, which a `<p>` cannot.
  const Content = text === undefined ? 'div' : 'p';
  return (
    <div
      aria-busy={streaming || undefined}
      className={clsx(
        'flex gap-2',
        flat ? 'items-start' : 'items-end',
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
      <div
        className={clsx(
          'flex flex-col',
          flat ? 'min-w-0 flex-1' : 'max-w-[80%]',
          !flat && text === undefined && 'min-w-0',
          outgoing ? 'items-end' : 'items-start',
          actions && 'group/reply'
        )}
      >
        {firstInGroup && !outgoing && (
          <span
            aria-hidden
            className="text-2xs mb-0.5 px-1 font-medium text-[var(--color-text-muted)]"
          >
            {sender}
          </span>
        )}
        <Content
          className={clsx(
            flat
              ? 'w-full min-w-0 px-1 py-0.5 text-sm break-words text-[var(--color-text-primary)]'
              : 'rounded-2xl px-3.5 py-2 text-sm break-words',
            // A bubble around blocks (a code block) stays inside its column.
            !flat && text === undefined && 'max-w-full',
            text !== undefined && 'whitespace-pre-wrap',
            !flat &&
              (outgoing
                ? 'bg-brand-500 rounded-br-md text-white'
                : 'rounded-bl-md bg-gray-100 text-[var(--color-text-primary)] dark:bg-gray-800')
          )}
        >
          {body}
        </Content>
        {actions ? (
          <div className="mt-1 flex items-center gap-1">
            {/* The time first: after the hidden actions it would float mid-row. */}
            {meta}
            {/* Hidden by opacity, not removed: the row keeps its height. One rule, not a hidden default
                overridden by hover and focus, so no two opacities compete. Only where the device
                can hover; touch always shows it. Focus anywhere in the message shows it too. */}
            <div className="transition-opacity [@media(hover:hover)]:group-[:not(:hover):not(:focus-within)]/reply:opacity-0">
              {actions}
            </div>
          </div>
        ) : (
          meta
        )}
      </div>
    </div>
  );
};
