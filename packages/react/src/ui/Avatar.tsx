import { clsx } from 'clsx';
import { useState } from 'react';
import { STATUS_DOT } from '../status/types';
import { AVATAR_SIZE_CLASS } from './avatarSizes';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline';

export type AvatarProps = {
  src?: string;
  alt?: string;
  /** Used to compute initials if `src` not provided or fails to load. */
  name?: string;
  size?: AvatarSize;
  /**
   * Presence dot at the bottom-right. The status is also text: it joins the accessible name
   * ("Ana Costa, online").
   */
  status?: AvatarStatus;
  /** The word read for `status`, for another language ("en ligne"). Defaults to the status. */
  statusLabel?: string;
  className?: string;
};

// About 30% of the avatar, 10px at the least; ringed with the surface so it reads on any theme.
const DOT_SIZE_CLASS: Record<AvatarSize, string> = {
  xs: 'h-2.5 w-2.5',
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
  xl: 'h-5 w-5',
  '2xl': 'h-6 w-6',
  '3xl': 'h-7 w-7',
};

// Same fills as HealthDot (UNKNOWN steps up in dark to stay 3:1 against the surface).
const STATUS_DOT_CLASS: Record<AvatarStatus, string> = {
  online: STATUS_DOT.OK,
  away: STATUS_DOT.WARN,
  busy: STATUS_DOT.CRIT,
  offline: STATUS_DOT.UNKNOWN,
};

const initialsOf = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
};

export const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
  status,
  statusLabel,
  className,
}: AvatarProps) => {
  // Remember which `src` failed, so a new `src` gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState<string>();
  const showImage = src && src !== failedSrc;
  const label = status
    ? [alt ?? name, statusLabel ?? status].filter(Boolean).join(', ')
    : (alt ?? name);
  return (
    <span
      className={clsx(
        'bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300 relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        AVATAR_SIZE_CLASS[size],
        className
      )}
      role="img"
      aria-label={label}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt ?? name ?? ''}
          onError={() => setFailedSrc(src)}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span>{initialsOf(name)}</span>
      )}
      {status && (
        <span
          aria-hidden
          data-status={status}
          className={clsx(
            'absolute right-0 bottom-0 rounded-full ring-2 ring-[var(--color-bg-panel)]',
            DOT_SIZE_CLASS[size],
            STATUS_DOT_CLASS[status]
          )}
        />
      )}
    </span>
  );
};
