import { clsx } from 'clsx';
import { useState } from 'react';
import { STATUS_DOT } from '../status/types';
import { AVATAR_SHAPE_CLASS, AVATAR_SIZE_CLASS } from './avatarSizes';
import type { Intent } from './intent';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export type AvatarShape = 'circle' | 'rounded' | 'square';

export type AvatarRing = 'brand' | 'success' | 'warning' | 'danger';

export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline';

export type AvatarProps = {
  src?: string;
  alt?: string;
  /** Used to compute initials if `src` not provided or fails to load. */
  name?: string;
  size?: AvatarSize;
  /**
   * The outline of the box and of the image. `circle` (default), `rounded` (8px radius) or
   * `square` (6px radius: the corners are softened, not sharp).
   */
  shape?: AvatarShape;
  /**
   * A colored ring around the avatar, set off from it by a gap in the surface color. It works over
   * a photo as well as over initials. No ring by default.
   */
  ring?: AvatarRing;
  /**
   * The meaning the initials carry, as a color. `brand` (default) is the accent tint. It has no
   * effect over an image.
   */
  intent?: Intent;
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

// Tinted background and initials per intent. The initials are -700 in light and -300 in dark. In
// light the tint is the -50 of the same hue, the pairing `INTENT_STYLE` uses for its surfaces: a
// translucent 500 over the page or over sand leaves green-700 at 4.2:1 to 4.4:1 and amber-700 at
// 4.3:1 to 4.5:1, under AA, where -50 keeps 4.7:1 or more on every surface. `brand` keeps the accent
// tint the avatar always had. Tailwind scans for whole class names, so each is written out.
const INTENT_CLASS: Record<Intent, string> = {
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300',
  brand: 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  success: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

// The ring is a box-shadow, so it follows the shape; its gap is the surface color. The shades are
// the ones that keep 3:1 against the surface in every theme (green-600 3.2:1 and amber-600 3.2:1
// on white, where the 500s fall to 2.2:1).
const RING_CLASS: Record<AvatarRing, string> = {
  brand: 'ring-brand-500',
  success: 'ring-green-600',
  warning: 'ring-amber-600',
  danger: 'ring-red-500',
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
  shape = 'circle',
  ring,
  intent = 'brand',
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
        'relative inline-flex shrink-0 items-center justify-center font-semibold',
        AVATAR_SHAPE_CLASS[shape],
        // Over an image the tint is the accent one, whatever the intent: it only tints initials.
        INTENT_CLASS[showImage ? 'brand' : intent],
        ring && ['ring-2 ring-offset-2 ring-offset-[var(--color-bg-panel)]', RING_CLASS[ring]],
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
          className={clsx('h-full w-full object-cover', AVATAR_SHAPE_CLASS[shape])}
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
