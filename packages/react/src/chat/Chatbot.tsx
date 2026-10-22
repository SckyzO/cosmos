import { clsx } from 'clsx';
import { MessageCircle, RotateCcw, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePortalFocus } from '../ui/overlayA11y';
import { ChatComposer } from './ChatComposer';
import { ChatMessage, type ChatMessageStatus } from './ChatMessage';
import { ChatThread, ChatTypingIndicator } from './ChatThread';

export type ChatbotMessage = {
  id: string;
  /** `user` messages sit on the right, `bot` ones on the left. */
  role: 'user' | 'bot';
  /** Rendered as text, never HTML. */
  text: string;
  time?: string;
  /** Delivery state of a user message. */
  status?: ChatMessageStatus;
  /** The bot reply is still arriving in chunks: shows a caret. */
  streaming?: boolean;
};

export type ChatbotProps = {
  /** The conversation, owned by the app. */
  messages: ChatbotMessage[];
  /** Called with the text the user sends, or the suggested reply they pick. */
  onSend: (text: string) => void;
  /** Open state, when controlled. */
  open?: boolean;
  /** Initial open state, when uncontrolled. Default `false`. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Name of the bot, shown in the panel header. Default `Assistant`. */
  title?: string;
  /** Line under the title, e.g. `Replies in a few seconds`. */
  subtitle?: string;
  /** Name read before the user's messages. Default `You`. */
  userName?: string;
  /** The bot is composing a reply: shows the typing indicator. */
  typing?: boolean;
  /** Suggested replies shown as chips above the composer. */
  suggestions?: string[];
  /** Error shown above the composer, with a Retry button when `onRetry` is set. */
  error?: string;
  onRetry?: () => void;
  /** Unread messages, shown as a badge on the launcher while the panel is closed. */
  unreadCount?: number;
  /** Accessible name of the launcher. Default `Open chat`. */
  launcherLabel?: string;
};

// Exit transition length: the panel stays mounted this long after closing.
const EXIT_MS = 150;

/**
 * Floating chat widget: a launcher at the bottom right opens a chat panel,
 * full-screen under 480px. No network code: the app owns `messages` and
 * answers `onSend`, so any backend fits.
 *
 * The panel is portaled to `<body>`. Opening moves focus to the composer,
 * Escape closes and focus goes back to the launcher.
 */
export const Chatbot = ({
  messages,
  onSend,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  title = 'Assistant',
  subtitle,
  userName = 'You',
  typing = false,
  suggestions,
  error,
  onRetry,
  unreadCount = 0,
  launcherLabel = 'Open chat',
}: ChatbotProps) => {
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  };

  // `visible` turns on a frame after opening, so the enter transition runs,
  // and off once the exit transition is over: the panel stays mounted meanwhile.
  const [visible, setVisible] = useState(open);
  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const timer = setTimeout(() => setVisible(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open]);
  const shown = open && visible;

  const launcherRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const panelRef = usePortalFocus<HTMLDivElement>({
    open,
    onClose: () => setOpen(false),
    triggerRef: launcherRef,
    initialFocus: (panel) => panel.querySelector('textarea'),
  });

  const unread = !open && unreadCount > 0;

  return createPortal(
    <>
      {(open || visible) && (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={clsx(
            'fixed inset-0 z-50 flex flex-col overflow-hidden bg-[var(--color-bg-panel)] shadow-2xl focus:outline-none motion-safe:transition-all motion-safe:duration-150',
            'min-[480px]:inset-auto min-[480px]:right-6 min-[480px]:bottom-24 min-[480px]:h-[min(600px,calc(100dvh-8rem))] min-[480px]:w-96 min-[480px]:rounded-2xl min-[480px]:border min-[480px]:border-[var(--color-border)]',
            shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
          )}
        >
          <header className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
            <span className="bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 flex h-9 w-9 items-center justify-center rounded-full">
              <MessageCircle className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id={titleId}
                className="truncate text-sm font-semibold text-[var(--color-text-primary)]"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="truncate text-xs text-[var(--color-text-muted)]">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="focus-visible:ring-brand-500/40 rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>

          <ChatThread label={`Conversation with ${title}`} className="flex-1">
            {messages.map((m, i) => (
              <ChatMessage
                key={m.id}
                text={m.text}
                direction={m.role === 'user' ? 'outgoing' : 'incoming'}
                sender={m.role === 'user' ? userName : title}
                time={m.time}
                status={m.status}
                streaming={m.streaming}
                firstInGroup={messages[i - 1]?.role !== m.role}
              />
            ))}
            {typing && <ChatTypingIndicator name={title} />}
          </ChatThread>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            >
              <span className="flex-1">{error}</span>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:hover:bg-red-500/20"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden />
                  Retry
                </button>
              )}
            </div>
          )}

          {suggestions && suggestions.length > 0 && (
            <ul aria-label="Suggested replies" className="flex flex-wrap gap-2 px-3 pb-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => onSend(s)}
                    className="border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 focus-visible:ring-brand-500/40 rounded-full border px-3 py-1 text-xs font-medium focus:outline-none focus-visible:ring-2"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <ChatComposer onSend={onSend} />
        </div>
      )}

      <button
        ref={launcherRef}
        type="button"
        aria-label={unread ? `${launcherLabel}, ${unreadCount} unread` : launcherLabel}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={clsx(
          'bg-brand-500 shadow-brand-500/25 hover:bg-brand-600 focus-visible:ring-brand-500/40 fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform focus:outline-none focus-visible:ring-4 active:scale-95',
          open && 'max-[479px]:hidden'
        )}
      >
        {open ? (
          <X className="h-6 w-6" aria-hidden />
        ) : (
          <MessageCircle className="h-6 w-6" aria-hidden />
        )}
        {unread && (
          <span
            aria-hidden
            className="text-2xs absolute -top-1 -right-1 min-w-5 rounded-full bg-red-500 px-1.5 text-center leading-5 font-semibold text-white ring-2 ring-[var(--color-bg-base)]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </>,
    document.body
  );
};
