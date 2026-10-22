import { clsx } from 'clsx';
import { useEffect, useRef, type ReactNode } from 'react';

export type ChatThreadProps = {
  /** `ChatMessage`, `ChatDaySeparator` and `ChatTypingIndicator` elements. */
  children: ReactNode;
  /** Accessible name of the message log. Default `Conversation`. */
  label?: string;
  className?: string;
};

// Distance from the bottom, in px, under which the thread counts as scrolled down.
const STICK_THRESHOLD = 32;

/**
 * Scrolling message list. It stays pinned to the newest message while the
 * reader is at the bottom (new messages, streamed text), and leaves the scroll
 * position alone once they scroll up to read history.
 *
 * It is a `role="log"` live region, so screen readers announce new messages.
 */
export const ChatThread = ({ children, label = 'Conversation', className }: ChatThreadProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const stuck = useRef(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const toBottom = () => {
      if (stuck.current) node.scrollTop = node.scrollHeight;
    };
    toBottom();
    const observer = new MutationObserver(toBottom);
    observer.observe(node, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      role="log"
      aria-live="polite"
      aria-label={label}
      tabIndex={0}
      onScroll={(e) => {
        const el = e.currentTarget;
        stuck.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD;
      }}
      className={clsx(
        'focus-visible:ring-brand-500/40 flex flex-col gap-1 overflow-y-auto p-4 focus:outline-none focus-visible:ring-2',
        className
      )}
    >
      {children}
    </div>
  );
};

export type ChatDaySeparatorProps = {
  /** Day label, e.g. `Today` or `Monday 12 May`. */
  children: ReactNode;
};

/** Centered day label between two groups of messages. */
export const ChatDaySeparator = ({ children }: ChatDaySeparatorProps) => (
  <div className="text-2xs my-3 flex items-center gap-3 font-medium text-[var(--color-text-muted)]">
    <span aria-hidden className="h-px flex-1 bg-[var(--color-border)]" />
    <span>{children}</span>
    <span aria-hidden className="h-px flex-1 bg-[var(--color-border)]" />
  </div>
);

export type ChatTypingIndicatorProps = {
  /** Who is typing, read by screen readers. */
  name: string;
};

/** Three animated dots in an incoming bubble: `name` is typing. */
export const ChatTypingIndicator = ({ name }: ChatTypingIndicatorProps) => (
  <div className="mt-2 flex">
    <span className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 dark:bg-gray-800">
      <span className="sr-only">{name} is typing</span>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          aria-hidden
          style={{ animationDelay: `${delay}ms` }}
          className="h-1.5 w-1.5 rounded-full bg-gray-400 motion-safe:animate-bounce dark:bg-gray-500"
        />
      ))}
    </span>
  </div>
);
