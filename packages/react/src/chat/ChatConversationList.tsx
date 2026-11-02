import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Avatar } from '../ui/Avatar';

export type ChatPresence = 'online' | 'away' | 'offline';

export type ChatConversation = {
  id: string;
  /** Contact or group name. */
  name: string;
  /** Preview of the last message, shown as plain text on one line. */
  lastMessage?: string;
  /** Time of the last message, e.g. `10:42` or `Mon`. */
  time?: string;
  /** Unread messages. Hidden when `0` or unset. */
  unread?: number;
  presence?: ChatPresence;
  avatarSrc?: string;
  /**
   * Drawn in place of the `Avatar` that `name` and `avatarSrc` make: an `AvatarGroup` or an
   * `IconBox` for a group conversation. It sits in a 40px-high slot, centered, and a node
   * wider than 40px pushes the text along. The `presence` dot still marks its end corner.
   * Hidden from assistive technology, as the picture of the conversation: the row is named by
   * `name`, so a stack of members does not turn into a long list of names to read.
   */
  avatar?: ReactNode;
};

export type ChatConversationListProps = {
  conversations: ChatConversation[];
  /** Id of the open conversation. */
  selectedId?: string;
  onSelect: (id: string) => void;
  /** Accessible name of the list. Default `Conversations`. */
  label?: string;
  className?: string;
};

const PRESENCE_CLASS: Record<ChatPresence, string> = {
  online: 'bg-emerald-500',
  away: 'bg-amber-500',
  offline: 'bg-gray-400',
};

// The muted and secondary text drop under 4.5:1 on the accent tint of the
// selected row in the light themes.
const ON_SELECTED = 'text-gray-600 dark:text-gray-400';

/**
 * Conversation picker for the start pane of a two-pane chat: name, last
 * message, time, unread count and presence of each thread. A conversation
 * with an `avatar` node (a group, a channel) shows it in place of the avatar
 * made from its name.
 */
export const ChatConversationList = ({
  conversations,
  selectedId,
  onSelect,
  label = 'Conversations',
  className,
}: ChatConversationListProps) => (
  <nav aria-label={label} className={clsx('overflow-y-auto', className)}>
    <ul className="divide-y divide-[var(--color-border)]">
      {conversations.map((c) => {
        const selected = c.id === selectedId;
        const unread = c.unread ?? 0;
        return (
          <li key={c.id}>
            <button
              type="button"
              aria-current={selected || undefined}
              onClick={() => onSelect(c.id)}
              className={clsx(
                'focus-visible:focus-indicator py-row-12 flex w-full items-center gap-3 px-4 text-start transition-colors focus-visible:bg-gray-100 focus-visible:ring-inset dark:focus-visible:bg-gray-800',
                selected ? 'bg-brand-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
              )}
            >
              <span className="relative shrink-0">
                {c.avatar ? (
                  <span aria-hidden className="flex h-10 min-w-10 items-center justify-center">
                    {c.avatar}
                  </span>
                ) : (
                  <Avatar name={c.name} src={c.avatarSrc} size="md" />
                )}
                {c.presence && (
                  <span
                    aria-hidden
                    className={clsx(
                      'inset-e-0 absolute bottom-0 h-3 w-3 rounded-full ring-2 ring-[var(--color-bg-panel)]',
                      PRESENCE_CLASS[c.presence]
                    )}
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className={clsx(
                      'truncate text-sm text-[var(--color-text-primary)]',
                      unread > 0 ? 'font-semibold' : 'font-medium'
                    )}
                  >
                    <bdi>{c.name}</bdi>
                    {c.presence && <span className="sr-only">, {c.presence}</span>}
                  </span>
                  {c.time && (
                    <span
                      className={clsx(
                        'text-2xs shrink-0',
                        selected ? ON_SELECTED : 'text-[var(--color-text-muted)]'
                      )}
                    >
                      <bdi>{c.time}</bdi>
                    </span>
                  )}
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span
                    className={clsx(
                      'truncate text-xs',
                      selected ? ON_SELECTED : 'text-[var(--color-text-secondary)]'
                    )}
                  >
                    <bdi>{c.lastMessage}</bdi>
                  </span>
                  {unread > 0 && (
                    <span className="bg-brand-500 text-2xs min-w-5 shrink-0 rounded-full px-1.5 text-center leading-5 font-semibold text-white">
                      <bdi>{unread}</bdi>
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  </nav>
);
